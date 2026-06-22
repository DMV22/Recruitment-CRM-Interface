import { cn } from '@/lib/utils';

type Status = 'prospect' | 'active' | 'inactive';

const config: Record<Status, { label: string; className: string }> = {
  prospect: {
    label: 'Prospect',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
};

export function ClientStatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', className)}>
      {label}
    </span>
  );
}