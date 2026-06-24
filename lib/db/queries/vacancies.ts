import { db } from '@/lib/db/drizzle';
import { vacancies, clients, users } from '@/lib/db/schema';
import { eq, and, ilike, desc, count } from 'drizzle-orm';

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
  const scopeFilter = crmRole === 'hiring_manager'
    ? eq(vacancies.hiringManagerId, userId)
    : undefined;

  const where = and(
    eq(vacancies.teamId, teamId),
    scopeFilter,
    status ? eq(vacancies.status, status) : undefined,
    priority ? eq(vacancies.priority, priority) : undefined,
    assignedRecruiterId
      ? eq(vacancies.assignedRecruiterId, assignedRecruiterId)
      : undefined,
    search ? ilike(vacancies.title, `%${search}%`) : undefined
  );

  // Creating a CTE (Common Table Expression) for a recruiter
  const recruiter = db.$with('recruiter').as(
    db.select({ id: users.id, name: users.name }).from(users)
  );

  const [rows, [{ total }]] = await Promise.all([
    db
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

    db.select({ total: count() }).from(vacancies).where(where),
  ]);

  return {
    data: rows,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}