import { logActivity } from '@/lib/activity/log-activity';
import { db } from '@/lib/db/drizzle';
import { clients, clientContacts, users, ActivityType } from '@/lib/db/schema';
import type { NewClient } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, count } from 'drizzle-orm';

// ----- List -----

export type ClientsFilter = {
  search?: string;
  status?: 'prospect' | 'active' | 'inactive';
  page?: number;
  perPage?: number;
};

export type ClientWithMeta = typeof clients.$inferSelect & {
  assignedUser: { id: number; name: string | null } | null;
  vacanciesCount: number;
};

export async function getClients(teamId: number, filter: ClientsFilter = {}) {
  const { search, status, page = 1, perPage = 25 } = filter;
  const offset = (page - 1) * perPage;

  const where = and(
    eq(clients.teamId, teamId),
    status ? eq(clients.status, status) : undefined,
    search
      ? or(ilike(clients.name, `%${search}%`), ilike(clients.industry, `%${search}%`))
      : undefined
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        industry: clients.industry,
        website: clients.website,
        status: clients.status,
        notes: clients.notes,
        teamId: clients.teamId,
        assignedUserId: clients.assignedUserId,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        assignedUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(clients)
      .leftJoin(users, eq(clients.assignedUserId, users.id))
      .where(where)
      .orderBy(desc(clients.updatedAt))
      .limit(perPage)
      .offset(offset),

    db.select({ total: count() }).from(clients).where(where),
  ]);

  return {
    data: rows,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

// ----- Single -----

export async function getClientById(id: number, teamId: number) {
  const [client] = await db
    .select({
      id: clients.id,
      name: clients.name,
      industry: clients.industry,
      website: clients.website,
      status: clients.status,
      notes: clients.notes,
      teamId: clients.teamId,
      assignedUserId: clients.assignedUserId,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
      assignedUser: {
        id: users.id,
        name: users.name,
      },
    })
    .from(clients)
    .leftJoin(users, eq(clients.assignedUserId, users.id))
    .where(and(eq(clients.id, id), eq(clients.teamId, teamId)));

  return client ?? null;
}

export async function getClientContacts(clientId: number) {
  return db
    .select()
    .from(clientContacts)
    .where(eq(clientContacts.clientId, clientId))
    .orderBy(desc(clientContacts.isPrimary));
}

// ----- Create -----

export async function createClient(
  data: Omit<NewClient, 'id' | 'createdAt' | 'updatedAt'>,
  userId: number
) {
  return db.transaction(async (tx) => {
    const [client] = await tx.insert(clients).values(data).returning();

    await logActivity(data.teamId, userId, ActivityType.CREATE_CLIENT, 'client', client.id);

    return client;
  });
}

// ----- Update -----

export async function updateClient(
  id: number,
  teamId: number,
  data: Partial<Omit<NewClient, 'id' | 'teamId' | 'createdAt'>>,
  userId: number
) {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.teamId, teamId)))
      .returning();

    if (!updated) return null;

    await logActivity(teamId, userId, ActivityType.UPDATE_CLIENT, 'client', id);

    return updated;
  });
}

// ----- Delete (soft via status=inactive) / Hard delete -----

export async function deleteClient(id: number, teamId: number, userId: number) {
  try {
    return await db.transaction(async (tx) => {
      // Instead of .delete(), use .update()
      const [updated] = await tx
        .update(clients)
        .set({
          status: 'inactive',
          updatedAt: new Date(),
        })
        .where(and(eq(clients.id, id), eq(clients.teamId, teamId)))
        .returning();

      if (!updated) return null;

      await logActivity(teamId, userId, ActivityType.ARCHIVE_CLIENT, 'client', id);

      return updated;
    });
  } catch (error) {
    console.error('Error while archiving the client:', error);
    return null;
  }
}
