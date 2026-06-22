'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { getUserTeamId } from '@/lib/db/queries';
import { hasPermission } from '@/lib/rbac';
import { createClient, updateClient, deleteClient } from '@/lib/db/queries/clients';

// ----- Schemas -----

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  industry: z.string().max(100).optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.enum(['prospect', 'active', 'inactive']).default('prospect'),
  assignedUserId: z.coerce.number().optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type ClientFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

// ----- Create -----

export async function createClientAction(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'clients.create')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const raw = {
    name: formData.get('name'),
    industry: formData.get('industry'),
    website: formData.get('website'),
    status: formData.get('status'),
    assignedUserId: formData.get('assignedUserId') || undefined,
    notes: formData.get('notes'),
  };

  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { industry, website, notes, assignedUserId, ...rest } = parsed.data;

  await createClient(
    {
      ...rest,
      teamId,
      industry: industry || null,
      website: website || null,
      notes: notes || null,
      assignedUserId: assignedUserId ?? null,
    },
    user.id
  );

  revalidateTag('clients', { expire: 0 });
  return { success: true };
}

// ----- Update -----

export async function updateClientAction(id: number, _prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'clients.update')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const raw = {
    name: formData.get('name'),
    industry: formData.get('industry'),
    website: formData.get('website'),
    status: formData.get('status'),
    assignedUserId: formData.get('assignedUserId') || undefined,
    notes: formData.get('notes'),
  };

  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { industry, website, notes, assignedUserId, ...rest } = parsed.data;

  const updated = await updateClient(
    id,
    teamId,
    {
      ...rest,
      industry: industry || null,
      website: website || null,
      notes: notes || null,
      assignedUserId: assignedUserId ?? null,
    },
    user.id
  );

  if (!updated) return { error: 'Client not found or access denied' };

  revalidateTag('clients', { expire: 0 });
  revalidateTag(`client-${id}`, { expire: 0 });
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

  revalidateTag('clients', { expire: 0 });
  redirect('/clients');
}