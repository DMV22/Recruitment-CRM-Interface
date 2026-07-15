import { logActivity } from '@/lib/activity/log-activity';
import { db } from '@/lib/db/drizzle';
import {
  entityNotes,
  users,
  clients,
  vacancies,
  candidates,
  submissions,
  ActivityType,
} from '@/lib/db/schema';
import { and, eq, desc, count } from 'drizzle-orm';

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

export async function getNotesForEntity(
  teamId: number,
  entityType: NoteEntityType,
  entityId: number
): Promise<EntityNoteItem[]> {
  const belongs = await assertEntityBelongsToTeam(teamId, entityType, entityId);
  if (!belongs) return [];

  const rows = await db
    .select({
      id: entityNotes.id,
      entityType: entityNotes.entityType,
      entityId: entityNotes.entityId,
      content: entityNotes.content,
      createdBy: entityNotes.createdBy,
      createdAt: entityNotes.createdAt,
      authorName: users.name,
    })
    .from(entityNotes)
    .leftJoin(users, eq(entityNotes.createdBy, users.id))
    .where(and(eq(entityNotes.entityType, entityType), eq(entityNotes.entityId, entityId)))
    .orderBy(desc(entityNotes.createdAt));

  return rows;
}

export async function createNoteForEntity(
  teamId: number,
  userId: number,
  entityType: NoteEntityType,
  entityId: number,
  content: string
) {
  const belongs = await assertEntityBelongsToTeam(teamId, entityType, entityId);
  if (!belongs) return null;

  return db.transaction(async (tx) => {
    const [note] = await tx
      .insert(entityNotes)
      .values({
        entityType,
        entityId,
        content,
        createdBy: userId,
      })
      .returning();

    await logActivity(teamId, userId, ActivityType.CREATE_NOTE, entityType, entityId);

    return note;
  });
}

export async function deleteOwnNote(teamId: number, id: number, userId: number) {
  return db.transaction(async (tx) => {
    const [deletedNote] = await tx
      .delete(entityNotes)
      .where(and(eq(entityNotes.id, id), eq(entityNotes.createdBy, userId)))
      .returning();

    if (!deletedNote) return null;

    await logActivity(
      teamId,
      userId,
      ActivityType.DELETE_NOTE,
      deletedNote.entityType,
      deletedNote.entityId
    );

    return deletedNote;
  });
}
