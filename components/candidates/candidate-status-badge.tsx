import { cn } from '@/lib/utils';
import type { Candidate } from '@/lib/db/schema';

type Status = Candidate['status'];

const STATUS_STYLES: Record<Status, string> = {
  active: 'status-badge-active',
  passive: 'status-badge-passive',
  placed: 'status-badge-placed',
  blacklisted: 'status-badge-blacklisted',
};

const STATUS_LABELS: Record<Status, string> = {
  active: 'Active',
  passive: 'Passive',
  placed: 'Placed',
  blacklisted: 'Blacklisted',
};

export function CandidateStatusBadge({ status }: { status: Status }) {
  return <span className={cn('status-badge', STATUS_STYLES[status])}>{STATUS_LABELS[status]}</span>;
}
