'use client';

import { useMemo, useState, useTransition } from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { VacancyStatusBadge } from '@/components/vacancies/vacancy-status-badge';
import { VacancyPriorityBadge } from '@/components/vacancies/vacancy-priority-badge';
import { VacancyForm } from '@/components/vacancies/vacancy-form';
import { DeleteVacancyDialog } from '@/components/vacancies/delete-vacancy-dialog';

import type { User } from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac';

type VacancyRow = {
  id: number;
  title: string;
  description: string | null;
  techStack: string | null;
  seniority: 'intern' | 'junior' | 'middle' | 'senior' | 'lead' | 'principal' | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  location: string | null;
  workType: 'remote' | 'hybrid' | 'onsite';
  status: 'open' | 'on_hold' | 'closed' | 'filled';
  priority: 'low' | 'medium' | 'high';
  teamId: number;
  clientId: number;
  assignedRecruiterId: number | null;
  hiringManagerId: number | null;
  deadlineAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: { id: number; name: string } | null;
  assignedRecruiter: { id: number | null; name: string | null } | null;
};

type SelectOption = {
  id: number;
  name: string | null;
};

type ClientOption = {
  id: number;
  name: string;
};

type Props = {
  data: VacancyRow[];
  total: number;
  page: number;
  totalPages: number;
  currentUser: User;
  clients: ClientOption[];
  recruiters?: SelectOption[];
  hiringManagers?: SelectOption[];
};

const col = createColumnHelper<VacancyRow>();

function formatDeadline(date: Date | null) {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
}

function getDaysOpen(createdAt: Date) {
  return formatDistanceToNowStrict(new Date(createdAt), { addSuffix: false });
}

export function VacancyTable({ data, total, page, totalPages, currentUser, clients, recruiters = [], hiringManagers = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [editVacancy, setEditVacancy] = useState<VacancyRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VacancyRow | null>(null);
  const [, startTransition] = useTransition();

  const canCreate = hasPermission(currentUser, 'vacancies.create');
  const canEdit = hasPermission(currentUser, 'vacancies.update');
  const canDelete = hasPermission(currentUser, 'vacancies.archive');

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
      col.accessor('title', {
        header: 'Title',
        cell: (info) => (
          <button
            className="font-medium text-left text-foreground transition-colors hover:text-primary"
            onClick={() => router.push(`/vacancies/${info.row.original.id}`)}
          >
            {info.getValue()}
          </button>
        ),
      }),

      col.accessor('client', {
        header: 'Client',
        cell: (info) =>
          info.getValue()?.name ?? <span className="text-muted-foreground">—</span>,
      }),

      col.accessor('status', {
        header: 'Status',
        cell: (info) => <VacancyStatusBadge status={info.getValue()} />,
      }),

      col.accessor('priority', {
        header: 'Priority',
        cell: (info) => <VacancyPriorityBadge priority={info.getValue()} />,
      }),

      col.accessor('assignedRecruiter', {
        header: 'Assigned recruiter',
        cell: (info) =>
          info.getValue()?.name ?? <span className="text-muted-foreground">Unassigned</span>,
      }),

      col.accessor('deadlineAt', {
        header: 'Deadline',
        cell: (info) => (
          <span className={info.getValue() ? '' : 'text-muted-foreground'}>
            {formatDeadline(info.getValue())}
          </span>
        ),
      }),

      col.accessor('createdAt', {
        id: 'daysOpen',
        header: 'Days open',
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {getDaysOpen(info.getValue())}
          </span>
        ),
      }),

      col.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${row.original.title}`}
                onClick={() => {
                  setEditVacancy(row.original);
                  setFormOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Archive ${row.original.title}`}
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [router, canEdit, canDelete]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title..."
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get('priority') ?? 'all'}
          onValueChange={(value) => updateParam('priority', value)}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} vacancies</span>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setEditVacancy(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New vacancy
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
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
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <span className="text-2xl">📋</span>
                    <p className="font-medium">No vacancies yet</p>
                    <p className="text-sm">
                      Add your first vacancy to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/vacancies/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={
                        cell.column.id === 'actions' || cell.column.id === 'title'
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <VacancyForm
        key={editVacancy ? `edit-${editVacancy.id}` : 'create'}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditVacancy(null);
        }}
        vacancy={editVacancy}
        clients={clients}
        recruiters={recruiters}
        hiringManagers={hiringManagers}
      />

      <DeleteVacancyDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        vacancy={
          deleteTarget ? { id: deleteTarget.id, title: deleteTarget.title } : null
        }
      />
    </div>
  );
}