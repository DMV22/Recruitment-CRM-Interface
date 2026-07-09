'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { getUser } from '@/lib/db/queries';
import { getUserTeamId } from '@/lib/db/queries';
import { hasPermission } from '@/lib/rbac';
import { createClient, updateClient, deleteClient } from '@/lib/db/queries/clients';
import { createNullableString } from '@/lib/zod-helpers';
import { validateForm } from '@/lib/form';
import { cacheTags } from '@/lib/cache-tags';

// ----- Schemas -----

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  industry: createNullableString(z.string().max(100)),
  website: createNullableString(z.string().url('Invalid URL')),
  status: z.enum(['prospect', 'active', 'inactive']).default('prospect'),
  notes: createNullableString(z.string().max(2000)),
});

export type ClientFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

// ----- Create -----

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'clients.create')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateForm(formData, clientSchema);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { industry, website, notes, ...rest } = parsed.data;

  await createClient(
    {
      ...rest,
      teamId,
      industry: industry || null,
      website: website || null,
      notes: notes || null,
      assignedUserId: null,
    },
    user.id
  );

  revalidateTag(cacheTags.clients.list(teamId), 'max');
  revalidateTag(cacheTags.vacancies.list(teamId), 'max');
  revalidateTag(cacheTags.submissions.list(teamId), 'max');

  return { success: true };
}

// ----- Update -----

export async function updateClientAction(
  id: number,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'clients.update')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateForm(formData, clientSchema);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { industry, website, notes, ...rest } = parsed.data;

  const updated = await updateClient(
    id,
    teamId,
    {
      ...rest,
      industry: industry || null,
      website: website || null,
      notes: notes || null,
      assignedUserId: null,
    },
    user.id
  );

  if (!updated) return { error: 'Client not found or access denied' };

  revalidateTag(cacheTags.clients.list(teamId), 'max');
  revalidateTag(cacheTags.clients.detail(id), 'max');
  revalidateTag(cacheTags.vacancies.list(teamId), 'max');
  revalidateTag(cacheTags.submissions.list(teamId), 'max');
  revalidateTag(cacheTags.submissions.byClient(id), 'max');

  return { success: true };
}

// ----- Delete -----

export async function deleteClientAction(id: number): Promise<ClientFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'clients.archive')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const deleted = await deleteClient(id, teamId, user.id);
  if (!deleted) return { error: 'Client not found or access denied' };

  revalidateTag(cacheTags.clients.list(teamId), 'max');
  revalidateTag(cacheTags.clients.detail(id), 'max');
  revalidateTag(cacheTags.vacancies.list(teamId), 'max');
  revalidateTag(cacheTags.submissions.list(teamId), 'max');
  revalidateTag(cacheTags.submissions.byClient(id), 'max');

  redirect('/clients');
}
