'use server';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { createCandidate, deleteCandidate, updateCandidate } from '@/lib/db/queries/candidates';
import { hasPermission } from '@/lib/rbac';
import { createNullableString, createNullableNumber } from '@/lib/zod-helpers';
import { validateForm } from '@/lib/form';
import { cacheTags } from '@/lib/cache-tags';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// ----- Schema -----

const candidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: createNullableString(z.string().email('Invalid email')),
  phone: createNullableString(z.string().max(50)),
  location: createNullableString(z.string().max(100)),
  techStack: createNullableString(z.string().max(500)),
  seniority: z.preprocess(
    (value) => (value === '' || value === 'none' ? null : value),
    z.enum(['intern', 'junior', 'middle', 'senior', 'lead', 'principal'])
  ),
  salaryExpectation: createNullableNumber(z.number().min(0)),
  currency: z.preprocess(
    (value) => (value === '' || value == null ? 'USD' : value),
    z.string().max(10)
  ),
  noticePeriod: createNullableString(z.string().max(50)),
  linkedinUrl: createNullableString(z.string().max(255)),
  status: z.enum(['active', 'passive', 'placed', 'blacklisted']).default('active'),
  source: createNullableString(z.string().max(100)),
  notes: createNullableString(z.string().max(2000)),
});

export type CandidateFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

// ----- Create -----

export async function createCandidateAction(
  _prev: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'candidates.create')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateForm(formData, candidateSchema);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await createCandidate(
    {
      teamId,
      ...parsed.data,
    },
    user.id
  );

  revalidateTag(cacheTags.candidates.list(teamId), 'max');
  revalidateTag(cacheTags.submissions.list(teamId), 'max');
  revalidateTag(cacheTags.vacancies.list(teamId), 'max');

  return { success: true };
}

// ----- Update -----

export async function updateCandidateAction(
  id: number,
  _prev: CandidateFormState,
  formData: FormData
): Promise<CandidateFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'candidates.update')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateForm(formData, candidateSchema);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const updated = await updateCandidate(id, teamId, parsed.data, user.id);
  if (!updated) return { error: 'Candidate not found or access denied' };

  revalidateTag(cacheTags.candidates.list(teamId), 'max');
  revalidateTag(cacheTags.candidates.detail(id), 'max');
  revalidateTag(cacheTags.submissions.list(teamId), 'max');
  revalidateTag(cacheTags.submissions.byCandidate(id), 'max');
  revalidateTag(cacheTags.vacancies.list(teamId), 'max');

  return { success: true };
}

// ----- Delete -----

export async function deleteCandidateAction(id: number): Promise<CandidateFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'candidates.archive')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const deleted = await deleteCandidate(id, teamId, user.id);
  if (!deleted) return { error: 'Candidate not found or access denied' };

  revalidateTag(cacheTags.candidates.list(teamId), 'max');
  revalidateTag(cacheTags.candidates.detail(id), 'max');
  revalidateTag(cacheTags.submissions.list(teamId), 'max');
  revalidateTag(cacheTags.submissions.byCandidate(id), 'max');
  revalidateTag(cacheTags.vacancies.list(teamId), 'max');

  redirect('/candidates');
}
