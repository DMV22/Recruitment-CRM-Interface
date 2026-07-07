import type { PipelineStage } from '@/lib/db/schema';
import { PIPELINE_STAGE_LABELS } from '@/lib/db/schema';

const STAGE_STYLES: Record<PipelineStage, string> = {
  sourced: 'badge badge-neutral',
  screening: 'badge badge-blue',
  hr_interview: 'badge badge-blue',
  tech_interview: 'badge badge-warning',
  client_interview: 'badge badge-warning',
  offer: 'badge badge-success',
  hired: 'badge badge-success',
  rejected: 'badge badge-error',
};

export function SubmissionStageBadge({ stage }: { stage: PipelineStage }) {
  return <span className={STAGE_STYLES[stage]}>{PIPELINE_STAGE_LABELS[stage]}</span>;
}
