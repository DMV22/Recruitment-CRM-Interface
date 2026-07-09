import { db } from '@/lib/db/drizzle';
import { candidates, type NewCandidate, activityLogs, ActivityType } from '@/lib/db/schema';
import { candidateScopeFilter } from '@/lib/rbac/candidate-scope';

import { eq, and, desc, count, ilike, or } from 'drizzle-orm';

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
    scopeFilter,
    status ? eq(candidates.status, status) : undefined,
    seniority ? eq(candidates.seniority, seniority) : undefined,
    search
      ? or(ilike(candidates.firstName, `%${search}%`), ilike(candidates.lastName, `%${search}%`))
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
    .where(and(eq(candidates.id, id), eq(candidates.teamId, teamId), scope))
    .limit(1);

  return candidate ?? null;
}

// ----- Create -----

export async function createCandidate(
  data: Omit<NewCandidate, 'id' | 'createdAt' | 'updatedAt'>,
  userId: number
) {
  const [candidate] = await db.insert(candidates).values(data).returning();

  await db.insert(activityLogs).values({
    teamId: data.teamId,
    userId,
    action: ActivityType.CREATE_CANDIDATE,
    entityType: 'candidate',
    entityId: candidate.id,
  });

  return candidate;
}

// ----- Update -----

export async function updateCandidate(
  id: number,
  teamId: number,
  data: Partial<Omit<NewCandidate, 'id' | 'teamId' | 'createdAt'>>,
  userId: number
) {
  const [updated] = await db
    .update(candidates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(candidates.id, id), eq(candidates.teamId, teamId)))
    .returning();

  if (!updated) return null;

  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: ActivityType.UPDATE_CANDIDATE,
    entityType: 'candidate',
    entityId: id,
  });

  return updated;
}

// ----- Delete (soft via status=blacklisted)  -----

export async function deleteCandidate(id: number, teamId: number, userId: number) {
  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(candidates)
        .set({
          status: 'blacklisted',
          updatedAt: new Date(),
        })
        .where(and(eq(candidates.id, id), eq(candidates.teamId, teamId)))
        .returning();

      if (!updated) return null;

      await tx.insert(activityLogs).values({
        teamId,
        userId,
        action: ActivityType.ARCHIVE_CANDIDATE,
        entityType: 'candidate',
        entityId: id,
      });

      return updated;
    });
  } catch (error) {
    console.error('Error while archiving the candidate:', error);
    return null;
  }
}
