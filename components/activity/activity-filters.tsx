'use client';

import { useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  crmRole: string;
  activityUsers: { id: number; name: string | null }[];
};

export function ActivityFilters({ crmRole, activityUsers }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      params.delete('page');

      startTransition(() => {
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="activity-filters">
      {/* Entity Filter */}
      <Select
        defaultValue={searchParams.get('entityType') ?? 'all'}
        onValueChange={(val) => handleFilterChange('entityType', val)}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All entities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All entities</SelectItem>
          <SelectItem value="client">Client</SelectItem>
          <SelectItem value="vacancy">Vacancy</SelectItem>
          <SelectItem value="candidate">Candidate</SelectItem>
          <SelectItem value="submission">Submission</SelectItem>
        </SelectContent>
      </Select>

      {/* Admin User Filter */}
      {crmRole === 'admin' && (
        <Select
          defaultValue={searchParams.get('userId') ?? 'all'}
          onValueChange={(val) => handleFilterChange('userId', val)}
          disabled={isPending}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {activityUsers.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.name ?? `User #${item.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
