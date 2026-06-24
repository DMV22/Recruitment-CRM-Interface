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
  description: z.string().max(5000).optional().or(z.literal('')),
  techStack: z.string().max(500).optional().or(z.literal('')),
  seniority: z
    .enum(['intern', 'junior', 'middle', 'senior', 'lead', 'principal'])
    .optional()
    .or(z.literal('')),
  salaryMin: z.coerce.number().min(0).optional().or(z.literal('')),
  salaryMax: z.coerce.number().min(0).optional().or(z.literal('')),
  currency: z.string().max(10).default('USD'),
  location: z.string().max(100).optional().or(z.literal('')),
  workType: z.enum(['remote', 'hybrid', 'onsite']).default('remote'),
  status: z.enum(['open', 'on_hold', 'closed', 'filled']).default('open'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignedRecruiterId: z.coerce.number().optional().or(z.literal('')),
  hiringManagerId: z.coerce.number().optional().or(z.literal('')),
  deadlineAt: z.string().optional().or(z.literal('')),
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

// ----- Create -----

export async function createVacancyAction(_prev: VacancyFormState, formData: FormData): Promise<VacancyFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'vacancies.create')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const raw = {
    title: formData.get('title'),
    clientId: formData.get('clientId'),
    description: formData.get('description'),
    techStack: formData.get('techStack'),
    seniority: formData.get('seniority'),
    salaryMin: formData.get('salaryMin'),
    salaryMax: formData.get('salaryMax'),
    currency: formData.get('currency') || 'USD',
    location: formData.get('location'),
    workType: formData.get('workType'),
    status: formData.get('status'),
    priority: formData.get('priority'),
    assignedRecruiterId: formData.get('assignedRecruiterId'),
    hiringManagerId: formData.get('hiringManagerId'),
    deadlineAt: formData.get('deadlineAt'),
  };

  const parsed = vacancySchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  await createVacancy(
    {
      teamId,
      title: d.title,
      clientId: d.clientId,
      description: parseOptionalString(d.description),
      techStack: parseOptionalString(d.techStack),
      seniority: d.seniority || null,
      salaryMin: parseOptionalNumber(d.salaryMin),
      salaryMax: parseOptionalNumber(d.salaryMax),
      currency: d.currency,
      location: parseOptionalString(d.location),
      workType: d.workType,
      status: d.status,
      priority: d.priority,
      assignedRecruiterId: parseOptionalNumber(d.assignedRecruiterId),
      hiringManagerId: parseOptionalNumber(d.hiringManagerId),
      deadlineAt: parseOptionalDate(d.deadlineAt),
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

  const raw = {
    title: formData.get('title'),
    clientId: formData.get('clientId'),
    description: formData.get('description'),
    techStack: formData.get('techStack'),
    seniority: formData.get('seniority'),
    salaryMin: formData.get('salaryMin'),
    salaryMax: formData.get('salaryMax'),
    currency: formData.get('currency') || 'USD',
    location: formData.get('location'),
    workType: formData.get('workType'),
    status: formData.get('status'),
    priority: formData.get('priority'),
    assignedRecruiterId: formData.get('assignedRecruiterId'),
    hiringManagerId: formData.get('hiringManagerId'),
    deadlineAt: formData.get('deadlineAt'),
  };

  const parsed = vacancySchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  const updated = await updateVacancy(
    id,
    teamId,
    {
      title: d.title,
      clientId: d.clientId,
      description: parseOptionalString(d.description),
      techStack: parseOptionalString(d.techStack),
      seniority: d.seniority || null,
      salaryMin: parseOptionalNumber(d.salaryMin),
      salaryMax: parseOptionalNumber(d.salaryMax),
      currency: d.currency,
      location: parseOptionalString(d.location),
      workType: d.workType,
      status: d.status,
      priority: d.priority,
      assignedRecruiterId: parseOptionalNumber(d.assignedRecruiterId),
      hiringManagerId: parseOptionalNumber(d.hiringManagerId),
      deadlineAt: parseOptionalDate(d.deadlineAt),
    },
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