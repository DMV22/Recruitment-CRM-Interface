'use client';

import { useState, useCallback, useTransition, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { SubmissionStageBadge } from './submission-stage-badge';
import { UpdateStageDialog } from './update-stage-dialog';

import type { SubmissionRow } from '@/lib/db/queries/submissions';
import type { User } from '@/lib/db/schema';
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  const updateFilterParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
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

  const updatePage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextPage <= 1) {
        params.delete('page');
      } else {
        params.set('page', String(nextPage));
      }

      startTransition(() => {
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
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
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.vacancy.client.name}</span>
        ),
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
          <span className="text-muted-foreground">{row.original.submittedBy.name ?? '—'}</span>
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
              type="button"
              className="btn-icon"
              onClick={() => setStageTarget(row.original)}
              title="Move stage"
              aria-label="Move stage"
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
    [canUpdate]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const currentStage = searchParams.get('stage') ?? '';

  return (
    <>
      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-filters">
            <select
              className="filter-select"
              value={currentStage}
              onChange={(e) => updateFilterParam('stage', e.target.value || null)}
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
          <Table className="data-table">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="table-empty-cell">
                    <div className="table-empty-content">
                      <p className="font-medium">No submissions yet</p>
                      <p className="text-sm">
                        Submit a candidate to a vacancy to start tracking pipeline stages.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span>
              Page {page} of {totalPages}
            </span>

            <div className="pagination-buttons">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updatePage(page - 1)}
              >
                <ChevronLeft className="icon-md" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updatePage(page + 1)}
              >
                <ChevronRight className="icon-md" />
              </Button>
            </div>
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
