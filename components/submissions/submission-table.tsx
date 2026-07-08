'use client';

import { useState, useCallback, useTransition, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

import { SubmissionStageBadge } from './submission-stage-badge';
import { UpdateStageDialog } from './update-stage-dialog';
import type { SubmissionRow } from '@/lib/db/queries/submissions';
import type { User } from '@/lib/db/schema';
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac';

type Props = {
  data: SubmissionRow[];
  total: number;
  page: number;
  totalPages: number;
  currentUser: User;
};

export function SubmissionTable({ data, total, page, totalPages, currentUser }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [stageTarget, setStageTarget] = useState<SubmissionRow | null>(null);
  const [, startTransition] = useTransition();

  const canUpdate = hasPermission(currentUser, 'submissions.update');

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const columns = useMemo<ColumnDef<SubmissionRow>[]>(
    () => [
      {
        accessorKey: 'candidate',
        header: 'Candidate',
        cell: ({ row }) => (
          <Link href={`/candidates/${row.original.candidate.id}`} className="table-link">
            {row.original.candidate.firstName} {row.original.candidate.lastName}
          </Link>
        ),
      },
      {
        accessorKey: 'vacancy',
        header: 'Vacancy',
        cell: ({ row }) => (
          <Link href={`/vacancies/${row.original.vacancy.id}`} className="table-link">
            {row.original.vacancy.title}
          </Link>
        ),
      },
      {
        id: 'client',
        header: 'Client',
        cell: ({ row }) => <span className="text-muted">{row.original.vacancy.client.name}</span>,
      },
      {
        accessorKey: 'currentStage',
        header: 'Stage',
        cell: ({ row }) => <SubmissionStageBadge stage={row.original.currentStage} />,
      },
      {
        id: 'submittedBy',
        header: 'Submitted by',
        cell: ({ row }) => (
          <span className="text-muted">{row.original.submittedBy.name ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'submittedAt',
        header: 'Date',
        cell: ({ row }) =>
          new Date(row.original.submittedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) =>
          canUpdate ? (
            <button
              className="btn-icon"
              onClick={() => setStageTarget(row.original)}
              title="Move stage"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </button>
          ) : null,
      },
    ],
    [canUpdate] // Depends only on changes to user permissions
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  const currentStage = searchParams.get('stage') ?? '';

  return (
    <>
      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-filters">
            <select
              className="filter-select"
              value={currentStage}
              onChange={(e) => updateParam('stage', e.target.value || null)}
            >
              <option value="">All stages</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {PIPELINE_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <span className="table-count">
            {total} submission{total !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {table.getFlatHeaders().map((header) => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="table-empty">
                    <div className="empty-state">
                      <p className="empty-state-title">No submissions yet</p>
                      <p className="empty-state-desc">
                        Submit a candidate to a vacancy to start tracking pipeline stages.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="table-row">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="table-pagination">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => updateParam('page', String(page - 1))}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => updateParam('page', String(page + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {stageTarget && (
        <UpdateStageDialog
          submission={stageTarget}
          currentUser={currentUser}
          onClose={() => setStageTarget(null)}
        />
      )}
    </>
  );
}
