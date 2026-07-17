'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VacancyStatusBadge, type Status } from '@/components/vacancies/vacancy-status-badge';

import { cn } from '@/lib/utils';

type VacancyStatusData = {
  status: string;
  count: number;
};

const STATUS_ORDER: Status[] = ['open', 'on_hold', 'filled', 'closed'];

const STATUS_BAR_CLASS: Record<Status, string> = {
  open: 'status-bar-open',
  on_hold: 'status-bar-on-hold',
  closed: 'status-bar-closed',
  filled: 'status-bar-filled',
};

type Props = {
  data: VacancyStatusData[];
};

export function VacanciesStatusChart({ data }: Props) {
  const { total, sorted } = useMemo(() => {
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);

    const sortedData = STATUS_ORDER.map((status) => {
      const count = data.find((item) => item.status === status)?.count ?? 0;
      const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

      return { status, count, percent };
    });

    return { total: totalCount, sorted: sortedData };
  }, [data]);

  if (total === 0) {
    return (
      <Card className="panel">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Vacancies by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-hint">No vacancies created yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="panel">
      <CardHeader className="panel-header">
        <CardTitle className="panel-title">Vacancies by Status</CardTitle>
        <p className="panel-subtitle">
          {total} {total === 1 ? 'vacancy' : 'vacancies'} total
        </p>
      </CardHeader>

      <CardContent className="status-chart">
        <div className="status-track" role="img" aria-label="Vacancy status distribution">
          {sorted
            .filter((item) => item.count > 0)
            .map((item) => (
              <div
                key={item.status}
                className={cn('status-fill', STATUS_BAR_CLASS[item.status])}
                style={{ width: `${(item.count / total) * 100}%` }}
              />
            ))}
        </div>

        <ul className="status-legend">
          {sorted.map((item) => (
            <li key={item.status} className="status-legend-item">
              <VacancyStatusBadge status={item.status} />

              <div className="status-legend-meta">
                <span className="status-legend-count">{item.count}</span>
                <span className="status-legend-percent">({item.percent}%)</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
