'use server';

import { z } from 'zod';
import { candidates, type PipelineStage, pipelineStageEnum, vacancies } from '@/lib/db/schema';
import { createNullableString } from '@/lib/zod-helpers';
import { hasPermission } from '@/lib/rbac';
import { getUser, getUserTeamId } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import {
  createSubmission,
  getSubmissionById,
  updateSubmissionStage,
} from '@/lib/db/queries/submissions';

import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';

// ----- Helpers -----

export const ALLOWED_STAGE_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  sourced: ['screening', 'rejected'],
  screening: ['hr_interview', 'rejected'],
  hr_interview: ['tech_interview', 'rejected'],
  tech_interview: ['client_interview', 'offer', 'rejected'],
  client_interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: [],
};

// Hiring Manager can only move between specific stages
export const HIRING_MANAGER_ALLOWED_TRANSITIONS: Partial<Record<PipelineStage, PipelineStage[]>> = {
  tech_interview: ['client_interview', 'offer', 'rejected'],
  client_interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
};

// ----- Schema -----

export const createSubmissionSchema = z.object({
  vacancyId: z.coerce.number().int().positive('Invalid vacancy ID'),
  candidateId: z.coerce.number().int().positive('Invalid candidate ID'),
  notes: createNullableString(z.string().max(2000)),
});

export const updateStageSchema = z
  .object({
    stage: z.enum(pipelineStageEnum.enumValues),
    notes: createNullableString(z.string().max(2000)),
    rejectionReason: createNullableString(z.string().max(500)),
  })
  // Cross-field validation: We require the reason for rejection ONLY for the "rejected" status
  .superRefine((data, ctx) => {
    if (
      data.stage === 'rejected' &&
      (!data.rejectionReason || data.rejectionReason.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rejection reason is required when rejection stage is selected',
        path: ['rejectionReason'],
      });
    }
  });

// ----- Types -----

export type SubmissionFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

function validateSubmissionsForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());

  return createSubmissionSchema.safeParse(raw);
}

// ----- Create -----

export async function createSubmissionAction(
  _prev: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'submissions.create')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateSubmissionsForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { vacancyId, candidateId, notes } = parsed.data;

  // 1. VACANCY VERIFICATION: We make sure it belongs to this team
  const [vacancy] = await db
    .select({ id: vacancies.id, teamId: vacancies.teamId })
    .from(vacancies)
    .where(eq(vacancies.id, vacancyId));

  if (!vacancy || vacancy.teamId !== teamId) {
    return { error: 'Vacancy not found' };
  }

  // 2. CANDIDATE VERIFICATION: We make sure it belongs to this team
  const [candidate] = await db
    .select({ id: candidates.id, teamId: candidates.teamId })
    .from(candidates)
    .where(eq(candidates.id, candidateId));

  if (!candidate || candidate.teamId !== teamId) {
    return { error: 'Candidate not found or access denied' };
  }

  await createSubmission(
    {
      vacancyId,
      candidateId,
      submittedBy: user.id,
      currentStage: 'sourced',
      notes,
      rejectionReason: null,
    },
    teamId,
    user.id
  );

  revalidateTag('submissions', { expire: 0 });
  revalidateTag(`vacancy-${vacancyId}`, { expire: 0 });

  return { success: true };
}

// ----- Update Stage -----

export async function updateSubmissionStageAction(
  submissionId: number,
  _prev: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'submissions.update')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = updateStageSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { stage, notes, rejectionReason } = parsed.data;

  // Fetch current submission to validate transition
  const submission = await getSubmissionById(submissionId, teamId);
  if (!submission) return { error: 'Submission not found or access denied' };

  const currentStage = submission.currentStage;
  const isHiringManager = user.crmRole === 'hiring_manager';
  const allowedNext = isHiringManager
    ? (HIRING_MANAGER_ALLOWED_TRANSITIONS[currentStage] ?? [])
    : (ALLOWED_STAGE_TRANSITIONS[currentStage] ?? []);

  if (!allowedNext.includes(stage)) {
    return { error: `Cannot move from ${currentStage} to ${stage}` };
  }

  const updated = await updateSubmissionStage(
    submissionId,
    teamId,
    stage,
    user.id,
    notes,
    rejectionReason
  );

  if (!updated) return { error: 'Failed to update stage' };

  revalidateTag('submissions', { expire: 0 });
  revalidateTag(`submission-${submissionId}`, { expire: 0 });
  revalidateTag(`vacancy-${submission.vacancy.id}`, { expire: 0 });

  return { success: true };
}
