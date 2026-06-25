import { cn } from '@/lib/utils';

type Priority = 'low' | 'medium' | 'high';

const config: Record<Priority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  high: {
    label: 'High',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function VacancyPriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = config[priority];

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