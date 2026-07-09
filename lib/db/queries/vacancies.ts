import { db } from '@/lib/db/drizzle';
import { vacancies, clients, users, activityLogs, ActivityType } from '@/lib/db/schema';
import type { NewVacancy } from '@/lib/db/schema';
import { eq, and, ilike, desc, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// ----- Types -----

export type VacanciesFilter = {
  search?: string;
  status?: 'open' | 'on_hold' | 'closed' | 'filled';
  priority?: 'low' | 'medium' | 'high';
  assignedRecruiterId?: number;
  page?: number;
  perPage?: number;
};

// ----- List -----

export async function getVacancies(
  teamId: number,
  userId: number,
  crmRole: string,
  filter: VacanciesFilter = {}
) {
  const { search, status, priority, assignedRecruiterId, page = 1, perPage = 25 } = filter;
  const offset = (page - 1) * perPage;

  // Scope rule: Hiring Manager can only see their own vacancies
  const scopeFilter =
    crmRole === 'hiring_manager' ? eq(vacancies.hiringManagerId, userId) : undefined;

  const where = and(
    eq(vacancies.teamId, teamId),
    scopeFilter,
    status ? eq(vacancies.status, status) : undefined,
    priority ? eq(vacancies.priority, priority) : undefined,
    assignedRecruiterId ? eq(vacancies.assignedRecruiterId, assignedRecruiterId) : undefined,
    search ? ilike(vacancies.title, `%${search}%`) : undefined
  );

  // Creating a CTE (Common Table Expression) for a recruiter
  const recruiter = db
    .$with('recruiter')
    .as(db.select({ id: users.id, name: users.name }).from(users));

  const [rows, [{ total }]] = await Promise.all([
    db
      .with(recruiter)
      .select({
        id: vacancies.id,
        title: vacancies.title,
        description: vacancies.description,
        techStack: vacancies.techStack,
        seniority: vacancies.seniority,
        salaryMin: vacancies.salaryMin,
        salaryMax: vacancies.salaryMax,
        currency: vacancies.currency,
        location: vacancies.location,
        workType: vacancies.workType,
        status: vacancies.status,
        priority: vacancies.priority,
        teamId: vacancies.teamId,
        clientId: vacancies.clientId,
        assignedRecruiterId: vacancies.assignedRecruiterId,
        hiringManagerId: vacancies.hiringManagerId,
        deadlineAt: vacancies.deadlineAt,
        createdAt: vacancies.createdAt,
        updatedAt: vacancies.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
        },
        assignedRecruiter: {
          id: recruiter.id,
          name: recruiter.name,
        },
      })
      .from(vacancies)
      .leftJoin(clients, eq(vacancies.clientId, clients.id))
      .leftJoin(recruiter, eq(vacancies.assignedRecruiterId, recruiter.id))
      .where(where)
      .orderBy(desc(vacancies.updatedAt))
      .limit(perPage)
      .offset(offset),

    db.with(recruiter).select({ total: count() }).from(vacancies).where(where),
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

const hiringManagers = alias(users, 'hiring_managers');

export async function getVacancyById(id: number, teamId: number) {
  const [vacancy] = await db
    .select({
      id: vacancies.id,
      title: vacancies.title,
      description: vacancies.description,
      techStack: vacancies.techStack,
      seniority: vacancies.seniority,
      salaryMin: vacancies.salaryMin,
      salaryMax: vacancies.salaryMax,
      currency: vacancies.currency,
      location: vacancies.location,
      workType: vacancies.workType,
      status: vacancies.status,
      priority: vacancies.priority,
      teamId: vacancies.teamId,
      clientId: vacancies.clientId,
      assignedRecruiterId: vacancies.assignedRecruiterId,
      hiringManagerId: vacancies.hiringManagerId,
      deadlineAt: vacancies.deadlineAt,
      createdAt: vacancies.createdAt,
      updatedAt: vacancies.updatedAt,
      client: {
        id: clients.id,
        name: clients.name,
      },
      assignedRecruiter: {
        id: users.id,
        name: users.name,
      },
      hiringManager: {
        id: hiringManagers.id,
        name: hiringManagers.name,
      },
    })
    .from(vacancies)
    .leftJoin(clients, eq(vacancies.clientId, clients.id))
    .leftJoin(users, eq(vacancies.assignedRecruiterId, users.id))
    .leftJoin(hiringManagers, eq(vacancies.hiringManagerId, hiringManagers.id))
    .where(and(eq(vacancies.id, id), eq(vacancies.teamId, teamId)));

  return vacancy ?? null;
}

// ----- Clients for Select -----

export async function getClientsForSelect(teamId: number) {
  return db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(and(eq(clients.teamId, teamId), eq(clients.status, 'active')))
    .orderBy(clients.name);
}

// ----- Create -----

export async function createVacancy(
  data: Omit<NewVacancy, 'id' | 'createdAt' | 'updatedAt'>,
  userId: number
) {
  return db.transaction(async (tx) => {
    const [vacancy] = await tx.insert(vacancies).values(data).returning();

    await tx.insert(activityLogs).values({
      teamId: data.teamId,
      userId,
      action: ActivityType.CREATE_VACANCY,
      entityType: 'vacancies',
      entityId: vacancy.id,
    });

    return vacancy;
  });
}

// ----- Update -----

export async function updateVacancy(
  id: number,
  teamId: number,
  data: Partial<Omit<NewVacancy, 'id' | 'teamId' | 'createdAt'>>,
  userId: number
) {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(vacancies)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(vacancies.id, id), eq(vacancies.teamId, teamId)))
      .returning();

    if (!updated) return null;

    await tx.insert(activityLogs).values({
      teamId,
      userId,
      action: ActivityType.UPDATE_VACANCY,
      entityType: 'vacancy',
      entityId: id,
    });

    return updated;
  });
}

// ----- Delete (soft via status=closed)  -----

export async function deleteVacancy(id: number, teamId: number, userId: number) {
  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(vacancies)
        .set({
          status: 'closed',
          updatedAt: new Date(),
        })
        .where(and(eq(vacancies.id, id), eq(vacancies.teamId, teamId)))
        .returning();

      if (!updated) return null;

      await tx.insert(activityLogs).values({
        teamId,
        userId,
        action: ActivityType.ARCHIVE_VACANCY,
        entityType: 'vacancy',
        entityId: id,
      });

      return updated;
    });
  } catch (error) {
    console.error('Error while archiving the vacancy:', error);
    return null;
  }
}
