import { cn } from '@/lib/utils';

type Priority = 'low' | 'medium' | 'high';

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'status-badge-low',
  medium: 'status-badge-medium',
  high: 'status-badge-high',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function VacancyPriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn('status-badge', PRIORITY_STYLES[priority])}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
