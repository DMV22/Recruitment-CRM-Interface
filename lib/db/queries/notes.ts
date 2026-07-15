import { db } from '@/lib/db/drizzle';
import { clients, vacancies, candidates, submissions } from '@/lib/db/schema';
import { and, eq, count } from 'drizzle-orm';

export type NoteEntityType = 'client' | 'vacancy' | 'candidate' | 'submission';

export type EntityNoteItem = {
  id: number;
  entityType: NoteEntityType;
  entityId: number;
  content: string;
  createdBy: number;
  createdAt: Date;
  authorName: string | null;
};

async function assertEntityBelongsToTeam(
  teamId: number,
  entityType: NoteEntityType,
  entityId: number
): Promise<boolean> {
  // 1. For entities directly linked to a team, we use the quick count() function
  if (entityType === 'client') {
    const [result] = await db
      .select({ total: count() })
      .from(clients)
      .where(and(eq(clients.id, entityId), eq(clients.teamId, teamId)));
    return Number(result?.total ?? 0) > 0;
  }

  if (entityType === 'vacancy') {
    const [result] = await db
      .select({ total: count() })
      .from(vacancies)
      .where(and(eq(vacancies.id, entityId), eq(vacancies.teamId, teamId)));
    return Number(result?.total ?? 0) > 0;
  }

  if (entityType === 'candidate') {
    const [result] = await db
      .select({ total: count() })
      .from(candidates)
      .where(and(eq(candidates.id, entityId), eq(candidates.teamId, teamId)));
    return Number(result?.total ?? 0) > 0;
  }

  // 2. For submissions, we perform a simple count() using an inner join with the vacancy.
  const [submissionResult] = await db
    .select({ total: count() })
    .from(submissions)
    .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
    .where(and(eq(submissions.id, entityId), eq(vacancies.teamId, teamId)));

  return Number(submissionResult?.total ?? 0) > 0;
}
