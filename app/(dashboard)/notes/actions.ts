'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';

import { cacheTags } from '@/lib/cache-tags';
import { type NoteEntityType } from '@/lib/db/queries/notes';

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
