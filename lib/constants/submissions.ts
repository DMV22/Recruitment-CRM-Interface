import type { PipelineStage } from '@/lib/db/schema';

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

export const HIRING_MANAGER_ALLOWED_TRANSITIONS: Partial<Record<PipelineStage, PipelineStage[]>> = {
  tech_interview: ['client_interview', 'offer', 'rejected'],
  client_interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
};
