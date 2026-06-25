import { cn } from '@/lib/utils';

type Status = 'open' | 'on_hold' | 'closed' | 'filled';

const config: Record<Status, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  on_hold: {
    label: 'On Hold',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  filled: {
    label: 'Filled',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

export function VacancyStatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      {label}
    </span>
  );
}