import { cn } from '@/lib/utils';

export type Status = 'open' | 'on_hold' | 'closed' | 'filled';

const STATUS_STYLES: Record<Status, string> = {
  open: 'status-badge-open',
  on_hold: 'status-badge-on-hold',
  closed: 'status-badge-closed',
  filled: 'status-badge-filled',
};

const STATUS_LABELS: Record<Status, string> = {
  open: 'Open',
  on_hold: 'On Hold',
  closed: 'Closed',
  filled: 'Filled',
};

export function VacancyStatusBadge({ status }: { status: Status }) {
  return <span className={cn('status-badge', STATUS_STYLES[status])}>{STATUS_LABELS[status]}</span>;
}
