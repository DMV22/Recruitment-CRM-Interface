'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { getUser } from '@/lib/db/queries';
import { getUserTeamId } from '@/lib/db/queries';
import { hasPermission } from '@/lib/rbac';
import { createVacancy, updateVacancy, deleteVacancy } from '@/lib/db/queries/vacancies';

// ----- Helpers -----

const nullableString = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return null;
  }
  return value;
},
  z.string().nullable()
);

const nullableNumber = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null || value === 'unassigned') {
    return null;
  }
  const num = Number(value);

  return Number.isNaN(num) ? null : num;
},
  z.number().min(0).nullable()
);

const nullableDate = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return null;
  }
  const date = new Date(value as string);

  return Number.isNaN(date.getTime()) ? null : date;
},
  z.date().nullable()
);

// ----- Schema -----

const vacancySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  clientId: z.coerce.number({ invalid_type_error: 'Client is required' })
    .min(1, 'Client is required'),
  description: nullableString.pipe(z.string().max(5000).nullable()),
  techStack: nullableString.pipe(z.string().max(500).nullable()),
  seniority: z.preprocess(
    (value) => ((value === '' || value === 'none') ? null : value),
    z.enum(['intern', 'junior', 'middle', 'senior', 'lead', 'principal']).nullable()
  ),
  salaryMin: nullableNumber,
  salaryMax: nullableNumber,
  currency: z.string().max(10).default('USD'),
  location: nullableString.pipe(z.string().max(100).nullable()),
  workType: z.enum(['remote', 'hybrid', 'onsite']).default('remote'),
  status: z.enum(['open', 'on_hold', 'closed', 'filled']).default('open'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignedRecruiterId: nullableNumber,
  hiringManagerId: nullableNumber,
  deadlineAt: nullableDate,
}).superRefine((data, ctx) => {
  if (data.salaryMin !== null && data.salaryMax !== null && data.salaryMin > data.salaryMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimum salary cannot be greater than maximum salary',
      path: ['salaryMin'],
    });
  }
});


export type VacancyFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

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

  revalidateTag('vacancies', { expire: 0 });

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

  revalidateTag('vacancies', { expire: 0 });
  revalidateTag(`vacancy-${id}`, { expire: 0 });
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

  revalidateTag('vacancies', { expire: 0 });
  redirect('/vacancies');
}