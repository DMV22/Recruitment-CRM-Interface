'use server';

import { z } from 'zod';
import { type PipelineStage, pipelineStageEnum } from '@/lib/db/schema';
import { createNullableString, createNullableNumber } from '@/lib/zod-helpers';

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
  vacancyId: createNullableNumber(z.number().int().positive('Invalid vacancy ID')),
  candidateId: createNullableNumber(z.number().int().positive('Invalid candidate ID')),
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
