'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { getUser } from '@/lib/db/queries';
import { getUserTeamId } from '@/lib/db/queries';
import { hasPermission } from '@/lib/rbac';
import { createVacancy, updateVacancy, deleteVacancy } from '@/lib/db/queries/vacancies';

// ----- Schema -----

const vacancySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  clientId: z.coerce.number({ invalid_type_error: 'Client is required' }).min(1, 'Client is required'),
  // Use .transform to automatically clean up lines
  description: z.string().max(5000).optional().or(z.literal('')).transform(parseOptionalString),
  techStack: z.string().max(500).optional().or(z.literal('')).transform(parseOptionalString),
  seniority: z
    .enum(['intern', 'junior', 'middle', 'senior', 'lead', 'principal'])
    .optional()
    .or(z.literal(''))
    .transform(v => v || null),
  // Automatically parse numbers
  salaryMin: z.coerce.number().min(0).optional().or(z.literal('')).transform(parseOptionalNumber),
  salaryMax: z.coerce.number().min(0).optional().or(z.literal('')).transform(parseOptionalNumber),
  currency: z.string().max(10).default('USD'),
  location: z.string().max(100).optional().or(z.literal('')).transform(parseOptionalString),
  workType: z.enum(['remote', 'hybrid', 'onsite']).default('remote'),
  status: z.enum(['open', 'on_hold', 'closed', 'filled']).default('open'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignedRecruiterId: z.coerce.number().optional().or(z.literal('')).transform(parseOptionalNumber),
  hiringManagerId: z.coerce.number().optional().or(z.literal('')).transform(parseOptionalNumber),
  // Automatically parse date
  deadlineAt: z.string().optional().or(z.literal('')).transform(parseOptionalDate),
});


export type VacancyFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

// ----- Helpers -----

function parseOptionalNumber(value: unknown) {
  if (value === '' || value === undefined || value === null) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

function parseOptionalString(value: unknown) {
  if (value === '' || value === undefined) return null;
  return value as string;
}

function parseOptionalDate(value: unknown) {
  if (value === '' || value === undefined || value === null) return null;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
}


function validateVacancyForm(formData: FormData) {
  // Automatically collects all key-value pairs from the form into a single object
  const raw = Object.fromEntries(formData.entries());
  if (!raw.currency) raw.currency = 'USD';

  return vacancySchema.safeParse(raw);
}

// ----- Create -----

export async function createVacancyAction(_prev: VacancyFormState, formData: FormData): Promise<VacancyFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'vacancies.create')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateVacancyForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await createVacancy(
    {
      teamId,
      ...parsed.data,
    },
    user.id
  );

  revalidateTag('vacancies', 'default');

  return { success: true }
}

// ----- Update -----

export async function updateVacancyAction(id: number, _prev: VacancyFormState, formData: FormData): Promise<VacancyFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'vacancies.update')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateVacancyForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const updated = await updateVacancy(
    id,
    teamId,
    parsed.data, // Simply pass a clean object
    user.id
  );

  if (!updated) return { error: 'Vacancy not found or access denied' };

  revalidateTag('vacancies', 'default');
  revalidateTag(`vacancy-${id}`, 'default');
  return { success: true };
}

// ----- Delete -----

export async function deleteVacancyAction(id: number): Promise<VacancyFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'vacancies.archive')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const deleted = await deleteVacancy(id, teamId, user.id);
  if (!deleted) return { error: 'Vacancy not found or access denied' };

  revalidateTag('vacancies', 'default');
  redirect('/vacancies');
}