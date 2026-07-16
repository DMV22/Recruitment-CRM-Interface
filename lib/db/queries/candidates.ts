import { logActivity } from '@/lib/activity/log-activity';
import { db } from '@/lib/db/drizzle';
import { candidates, type NewCandidate, ActivityType } from '@/lib/db/schema';
import { candidateScopeFilter } from '@/lib/rbac/candidate-scope';

import { eq, and, desc, count, sql, isNull } from 'drizzle-orm';

// ----- Types -----

export type CandidatesFilter = {
  search?: string;
  status?: 'active' | 'passive' | 'placed' | 'blacklisted';
  seniority?: 'intern' | 'junior' | 'middle' | 'senior' | 'lead' | 'principal';
  page?: number;
  perPage?: number;
};

// ----- List -----

export async function getCandidates(
  teamId: number,
  userId: number,
  crmRole: string,
  filter: CandidatesFilter = {}
) {
  const { search, status, seniority, page = 1, perPage = 25 } = filter;
  const offset = (page - 1) * perPage;

  const scopeFilter = candidateScopeFilter(userId, crmRole, teamId);

  const where = and(
    eq(candidates.teamId, teamId),
    isNull(candidates.deletedAt),
    scopeFilter,
    status ? eq(candidates.status, status) : undefined,
    seniority ? eq(candidates.seniority, seniority) : undefined,
    search
      ? sql`concat(${candidates.firstName}, ' ', ${candidates.lastName}) ilike ${`%${search}%`}`
      : undefined
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: candidates.id,
        firstName: candidates.firstName,
        lastName: candidates.lastName,
        email: candidates.email,
        phone: candidates.phone,
        status: candidates.status,
        seniority: candidates.seniority,
        techStack: candidates.techStack,
        salaryExpectation: candidates.salaryExpectation,
        currency: candidates.currency,
        location: candidates.location,
        noticePeriod: candidates.noticePeriod,
        linkedinUrl: candidates.linkedinUrl,
        source: candidates.source,
        notes: candidates.notes,
        teamId: candidates.teamId,
        createdAt: candidates.createdAt,
        updatedAt: candidates.updatedAt,
        deletedAt: candidates.deletedAt,
      })
      .from(candidates)
      .where(where)
      .orderBy(desc(candidates.createdAt))
      .limit(perPage)
      .offset(offset),

    db.select({ total: count() }).from(candidates).where(where),
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

export async function getCandidateById(
  id: number,
  teamId: number,
  userId: number,
  crmRole: string
) {
  const scope = candidateScopeFilter(userId, crmRole, teamId);

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(
      and(eq(candidates.id, id), eq(candidates.teamId, teamId), isNull(candidates.deletedAt), scope)
    )
    .limit(1);

  return candidate ?? null;
}

// ----- Optional single (including archived) -----
// It's convenient in case you need to perform a restore or view a specific archive later

export async function getCandidateByIdIncludingArchived(
  id: number,
  teamId: number,
  userId: number,
  crmRole: string
) {
  const scope = candidateScopeFilter(userId, crmRole, teamId);

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(and(eq(candidates.id, id), eq(candidates.teamId, teamId), scope))
    .limit(1);

  return candidate ?? null;
}

// ----- Create -----

export async function createCandidate(
  data: Omit<NewCandidate, 'id' | 'createdAt' | 'updatedAt'>,
  userId: number
) {
  return db.transaction(async (tx) => {
    const [candidate] = await tx.insert(candidates).values(data).returning();

    await logActivity(
      tx,
      data.teamId,
      userId,
      ActivityType.CREATE_CANDIDATE,
      'candidate',
      candidate.id
    );

    return candidate;
  });
}

// ----- Update -----

export async function updateCandidate(
  id: number,
  teamId: number,
  data: Partial<Omit<NewCandidate, 'id' | 'teamId' | 'createdAt'>>,
  userId: number
) {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(candidates)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(eq(candidates.id, id), eq(candidates.teamId, teamId), isNull(candidates.deletedAt))
      )
      .returning();

    if (!updated) return null;

    await logActivity(tx, teamId, userId, ActivityType.UPDATE_CANDIDATE, 'candidate', id);

    return updated;
  });
}

// ----- Delete (soft via deletedAt) -----

export async function deleteCandidate(id: number, teamId: number, userId: number) {
  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(candidates)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(eq(candidates.id, id), eq(candidates.teamId, teamId), isNull(candidates.deletedAt))
        )
        .returning();

      if (!updated) return null;

      await logActivity(tx, teamId, userId, ActivityType.ARCHIVE_CANDIDATE, 'candidate', id);

      return updated;
    });
  } catch (error) {
    console.error('Error while archiving the candidate:', error);
    return null;
  }
}

// ----- Optional restore -----

export async function restoreCandidate(id: number, teamId: number, userId: number) {
  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(candidates)
        .set({
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(candidates.id, id), eq(candidates.teamId, teamId)))
        .returning();

      if (!updated) return null;

      await logActivity(tx, teamId, userId, ActivityType.UPDATE_CANDIDATE, 'candidate', id);

      return updated;
    });
  } catch (error) {
    console.error('Error while restoring the candidate:', error);
    return null;
  }
}
