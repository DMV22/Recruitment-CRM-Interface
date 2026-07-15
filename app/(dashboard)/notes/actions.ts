'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';

import { cacheTags } from '@/lib/cache-tags';
import { createNoteForEntity, deleteOwnNote, type NoteEntityType } from '@/lib/db/queries/notes';
import { getUser, getUserTeamId } from '@/lib/db/queries';
import { validateForm } from '@/lib/form';
import { hasPermission } from '@/lib/rbac';

const noteSchema = z.object({
  entityType: z.enum(['client', 'vacancy', 'candidate', 'submission']),
  entityId: z.coerce.number().int().positive(),
  content: z.string().trim().min(1, 'Note is required').max(5000, 'Note is too long'),
});

export type NoteFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

function revalidateEntity(entityType: NoteEntityType, entityId: number, teamId: number) {
  revalidateTag(cacheTags.notes.byEntity(entityType, entityId), 'max');
  revalidateTag(cacheTags.activity.list(teamId), 'max');

  if (entityType === 'client') revalidateTag(cacheTags.clients.detail(entityId), 'max');
  if (entityType === 'vacancy') revalidateTag(cacheTags.vacancies.detail(entityId), 'max');
  if (entityType === 'candidate') revalidateTag(cacheTags.candidates.detail(entityId), 'max');
  if (entityType === 'submission') revalidateTag(cacheTags.submissions.detail(entityId), 'max');
}

export async function createNoteAction(
  _prev: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'notes.create')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateForm(formData, noteSchema);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { entityType, entityId, content } = parsed.data;

  const created = await createNoteForEntity(teamId, user.id, entityType, entityId, content);
  if (!created) return { error: 'Entity not found or access denied' };

  revalidateEntity(entityType, entityId, teamId);

  return { success: true };
}

export async function deleteNoteAction(
  id: number,
  entityType: NoteEntityType,
  entityId: number
): Promise<{ error?: string; success?: boolean }> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'notes.delete')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const deleted = await deleteOwnNote(teamId, id, user.id);
  if (!deleted) return { error: 'Note not found or access denied' };

  revalidateEntity(entityType, entityId, teamId);

  return { success: true };
}
