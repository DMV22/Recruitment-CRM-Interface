import { db } from '@/lib/db/drizzle';
import { candidates, submissions, vacancies } from '@/lib/db/schema';
import { eq, and, ilike, desc, count, inArray } from 'drizzle-orm';

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

  // Scope rule: Hiring Manager can only see candidates submitted on their assigned vacancies
  let allowedCandidateIds: number[] | undefined;

  if (crmRole === 'hiring_manager') {
    const assignedVacancies = await db
      .select({ id: vacancies.id })
      .from(vacancies)
      .where(and(eq(vacancies.teamId, teamId), eq(vacancies.hiringManagerId, userId)));

    const vacancyIds = assignedVacancies.map((v) => v.id);

    if (vacancyIds.length === 0) {
      return { data: [], total: 0, page, perPage, totalPages: 0 };
    }

    const submittedCandidates = await db
      .select({ candidateId: submissions.candidateId })
      .from(submissions)
      .where(inArray(submissions.vacancyId, vacancyIds));

    allowedCandidateIds = [...new Set(submittedCandidates.map((s) => s.candidateId))];

    if (allowedCandidateIds.length === 0) {
      return { data: [], total: 0, page, perPage, totalPages: 0 };
    }
  }

  const where = and(
    eq(candidates.teamId, teamId),
    allowedCandidateIds ? inArray(candidates.id, allowedCandidateIds) : undefined,
    status ? eq(candidates.status, status) : undefined,
    seniority ? eq(candidates.seniority, seniority) : undefined,
    search ? ilike(candidates.firstName, `%${search}%`) : undefined
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
