import { and, eq, exists, sql } from 'drizzle-orm';
import { submissions, vacancies, candidates } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';

export function candidateScopeFilter(userId: number, crmRole: string, teamId: number) {
  if (crmRole !== 'hiring_manager') return undefined;

  return exists(
    db
      .select({ one: sql`1` })
      .from(submissions)
      .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
      .where(
        and(
          eq(submissions.candidateId, candidates.id),
          eq(vacancies.teamId, teamId),
          eq(vacancies.hiringManagerId, userId)
        )
      )
  );
}
