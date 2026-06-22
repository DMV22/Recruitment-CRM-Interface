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

import type { Client, User } from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac';

import { Plus, Pencil, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

type ClientRow = Pick<Client, 'id' | 'name' | 'industry' | 'website' | 'status' | 'updatedAt'> & {
  assignedUser: { id: number; name: string | null } | null;
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
  const [editClient, setEditClient] = useState<Client | null>(null);
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
          className="font-medium text-foreground hover:text-primary transition-colors text-left"
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
      cell: (info) => <ClientStatusBadge status={info.getValue()} />,
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
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
          >
            Visit <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    }),
    col.display({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${row.original.name}`}
              onClick={() => {
                setEditClient(row.original as unknown as Client);
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
              aria-label={`Delete ${row.original.name}`}
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5" />
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
      <div className="flex flex-wrap items-center gap-3">
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

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} clients</span>
          {canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setEditClient(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New client
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
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
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
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

      {/* Form Sheet */}
      <ClientForm
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