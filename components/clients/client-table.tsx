'use client';

import { useState, useTransition } from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, } from '@tanstack/react-table';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { ClientStatusBadge } from '@/components/clients/client-status-badge';
import { ClientForm } from '@/components/clients/client-form';
import { DeleteClientDialog } from '@/components/clients/delete-client-dialog';

import type { User } from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac';

import { Plus, Pencil, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

type ClientRow = {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  status: 'prospect' | 'active' | 'inactive';
  notes: string | null;
  teamId: number;
  assignedUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
  assignedUser: { id: number | null; name: string | null } | null;
};

type Props = {
  data: ClientRow[];
  total: number;
  page: number;
  totalPages: number;
  currentUser: User;
};

const col = createColumnHelper<ClientRow>();

export function ClientTable({ data, total, page, totalPages, currentUser }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [, startTransition] = useTransition();

  const canCreate = hasPermission(currentUser, 'clients.create');
  const canEdit = hasPermission(currentUser, 'clients.update');
  const canDelete = hasPermission(currentUser, 'clients.archive');

  // ----- URL-driven filters -----
  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // reset page on filter change
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  // ----- Columns -----
  const columns = [
    col.accessor('name', {
      header: 'Company',
      cell: (info) => (
        <button
          className="table-link"
          onClick={() => router.push(`/clients/${info.row.original.id}`)}
        >
          {info.getValue()}
        </button>
      ),
    }),
    col.accessor('industry', {
      header: 'Industry',
      cell: (info) => info.getValue() ?? <span className="text-muted-foreground">—</span>,
    }),
    col.accessor('status', {
      header: 'Status',
      cell: (info) => {
        return <ClientStatusBadge status={info.getValue()} />;
      },
    }),
    col.accessor('assignedUser', {
      header: 'Assigned to',
      cell: (info) =>
        info.getValue()?.name ?? <span className="text-muted-foreground">Unassigned</span>,
    }),
    col.accessor('website', {
      header: 'Website',
      cell: (info) =>
        info.getValue() ? (
          <a
            href={info.getValue()!}
            target="_blank"
            rel="noopener noreferrer"
            className="table-external-link"
          >
            Visit <ExternalLink className="icon-xs" />
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
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
              aria-label={`Edit ${row.original.name}`}
              onClick={() => {
                setEditClient(row.original);
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
              aria-label={`Delete ${row.original.name}`}
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="icon-sm" />
            </Button>
          )}
        </div>
      ),
    }),
  ];

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
          placeholder="Search by name or industry..."
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => updateParam('search', e.target.value)}
          className="h-9 w-64"
        />

        <Select
          defaultValue={searchParams.get('status') ?? 'all'}
          onValueChange={(v) => updateParam('status', v)}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="toolbar-actions">
          <span className="toolbar-count">{total} clients</span>
          {canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setEditClient(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 icon-md" />
              New client
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
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
                    <span className="text-2xl">🏢</span>
                    <p className="font-medium">No clients yet</p>
                    <p className="text-sm">Add your first client to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/clients/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={
                        cell.column.id === 'actions' || cell.column.id === 'name' || cell.column.id === 'website'
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
      <ClientForm
        key={editClient ? `edit-${editClient.id}` : 'create'}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditClient(null) }}
        client={editClient}
      />

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteClientDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          clientId={deleteTarget.id}
          clientName={deleteTarget.name}
        />
      )}
    </div>
  );
}