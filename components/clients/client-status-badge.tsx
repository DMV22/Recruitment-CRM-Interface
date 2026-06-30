import { cn } from '@/lib/utils';

type Status = 'prospect' | 'active' | 'inactive';

const STATUS_STYLES: Record<Status, string> = {
  prospect: 'status-badge-prospect',
  active: 'status-badge-active',
  inactive: 'status-badge-inactive',
};

const STATUS_LABELS: Record<Status, string> = {
  prospect: 'Prospect',
  active: 'Active',
  inactive: 'Inactive',
};

export function ClientStatusBadge({ status }: { status: Status }) {
  return <span className={cn('status-badge', STATUS_STYLES[status])}>{STATUS_LABELS[status]}</span>;
}
