'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { CandidateStatusBadge } from '@/components/candidates/candidate-status-badge';
import { CandidateForm } from '@/components/candidates/candidate-form';
import { DeleteCandidateDialog } from '@/components/candidates/delete-candidate-dialog';
import { SENIORITY_OPTIONS, STATUS_OPTIONS } from '@/components/candidates/candidate-form';

import type { User } from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac';

export type CandidateRow = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: 'active' | 'passive' | 'placed' | 'blacklisted';
  seniority: 'intern' | 'junior' | 'middle' | 'senior' | 'lead' | 'principal' | null;
  createdAt: Date;
  updatedAt: Date;
  teamId: number;
  location: string | null;
  techStack: string | null;
  salaryExpectation: number | null;
  currency: string;
  noticePeriod: string | null;
  linkedinUrl: string | null;
  source: string | null;
  notes: string | null;
};

type Props = {
  data: CandidateRow[];
  total: number;
  page: number;
  totalPages: number;
  currentUser: User;
};

const col = createColumnHelper<CandidateRow>();

export function CandidateTable({ data, total, page, totalPages, currentUser }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<CandidateRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CandidateRow | null>(null);
  const [, startTransition] = useTransition();

  const canCreate = hasPermission(currentUser, 'candidates.create');
  const canEdit = hasPermission(currentUser, 'candidates.update');
  const canDelete = hasPermission(currentUser, 'candidates.archive');

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function setPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const columns = useMemo(
    () => [
      col.display({
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <button
            className="table-link"
            onClick={() => router.push(`/candidates/${row.original.id}`)}
          >
            {row.original.firstName} {row.original.lastName}
          </button>
        ),
      }),

      col.accessor('techStack', {
        header: 'Primary skill',
        cell: (info) => {
          const stack = info.getValue();
          if (!stack) return <span className="text-muted-foreground">—</span>;
          return <span>{stack.split(',')[0].trim()}</span>;
        },
      }),

      col.accessor('seniority', {
        header: 'Seniority',
        cell: (info) => {
          const seniority = info.getValue();
          return seniority ? (
            <span>{SENIORITY_OPTIONS.find((o) => o.value === seniority)?.label ?? seniority}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      }),

      col.accessor('salaryExpectation', {
        header: 'Salary',
        cell: (info) => {
          const val = info.getValue();
          if (val === null) return <span className="text-muted-foreground">—</span>;
          const currency = info.row.original.currency;
          return (
            <span className="text-meta tabular-nums">
              {val.toLocaleString()}
              {currency ? ` ${currency}` : ''}
            </span>
          );
        },
      }),

      col.accessor('location', {
        header: 'Location',
        cell: (info) => info.getValue() ?? <span className="text-muted-foreground">—</span>,
      }),

      col.accessor('noticePeriod', {
        header: 'Notice period',
        cell: (info) => info.getValue() ?? <span className="text-muted-foreground">—</span>,
      }),

      col.accessor('status', {
        header: 'Status',
        cell: (info) => <CandidateStatusBadge status={info.getValue()} />,
      }),

      col.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="table-actions">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${row.original.firstName} ${row.original.lastName}`}
                onClick={() => {
                  setEditCandidate(row.original);
                  setFormOpen(true);
                }}
              >
                <Pencil className="icon-sm" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Archive ${row.original.firstName} ${row.original.lastName}`}
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="icon-sm" />
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [router, canEdit, canDelete]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="toolbar">
        <Input
          placeholder="Search by name..."
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => updateParam('search', e.target.value)}
          className="h-9 w-64"
        />

        <Select
          defaultValue={searchParams.get('status') ?? 'all'}
          onValueChange={(value) => updateParam('status', value)}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get('seniority') ?? 'all'}
          onValueChange={(value) => updateParam('seniority', value)}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {SENIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="toolbar-actions">
          <span className="toolbar-count">{total} candidates</span>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setEditCandidate(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 icon-md" />
              New candidate
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <Table>
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
                    <span className="text-2xl">👤</span>
                    <p className="font-medium">No candidates yet</p>
                    <p className="text-sm">Add your first candidate to start the pipeline.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/candidates/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={
                        cell.column.id === 'actions' || cell.column.id === 'name'
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="icon-md" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="icon-md" />
            </Button>
          </div>
        </div>
      )}

      {/* Form Sheet */}
      <CandidateForm
        key={editCandidate ? `edit-${editCandidate.id}` : 'create'}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditCandidate(null);
        }}
        candidate={editCandidate}
      />

      {/* Delete Dialog */}
      <DeleteCandidateDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        candidate={
          deleteTarget
            ? { id: deleteTarget.id, name: `${deleteTarget.firstName} ${deleteTarget.lastName}` }
            : null
        }
      />
    </div>
  );
}
