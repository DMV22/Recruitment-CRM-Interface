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
    // INNER JOIN garantees that we only get candidates that have been submitted to the hiring manager's vacancies
    const submittedCandidates = await db
      .selectDistinct({ candidateId: submissions.candidateId })
      .from(vacancies)
      .innerJoin(submissions, eq(submissions.vacancyId, vacancies.id))
      .where(and(eq(vacancies.teamId, teamId), eq(vacancies.hiringManagerId, userId)));

    // Since innerJoin does not return null, we can map the raw numbers directly
    allowedCandidateIds = submittedCandidates.map((s) => s.candidateId);

    // If the hiring manager has no vacancies or no candidates submitted to their vacancies
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
