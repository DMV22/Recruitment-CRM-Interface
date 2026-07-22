'use client';

import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Shield, Trash2, UserRound } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RoleSelect } from '@/components/team/role-select';
import { formatRoleLabel } from '@/components/team/pending-invitations-list';
import type { CrmRole } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { RevokeAccessDialog } from '@/components/team/revoke-access-dialog';

type TeamMemberRow = {
  membershipId: number;
  userId: number;
  name: string | null;
  email: string;
  crmRole: CrmRole;
  joinedAt: Date;
};

type Props = {
  members: TeamMemberRow[];
  currentUserId: number;
  canManageTeam: boolean;
  canManageRoles: boolean;
};

const col = createColumnHelper<TeamMemberRow>();

export function TeamMembersTable({ members, currentUserId, canManageTeam, canManageRoles }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: number; name: string | null } | null>(
    null
  );

  const openRevokeDialog = (id: number, name: string | null) => {
    setSelectedMember({ id, name });
    setDialogOpen(true);
  };

  const columns = useMemo(
    () => [
      col.accessor('name', {
        header: 'Member',
        cell: ({ row }) => (
          <div className="member-cell">
            <div className="member-avatar">
              <UserRound className="icon-md" />
            </div>
            <div className="member-info">
              <p className="member-name">{row.original.name ?? 'Unknown user'}</p>
              <p className="member-email">{row.original.email}</p>
            </div>
          </div>
        ),
      }),
      col.accessor('crmRole', {
        header: 'Role',
        cell: ({ row, getValue }) =>
          canManageRoles ? (
            <RoleSelect
              userId={row.original.userId}
              value={getValue()}
              disabled={row.original.userId === currentUserId}
            />
          ) : (
            <span className="status-badge capitalize">{formatRoleLabel(getValue())}</span>
          ),
      }),
      col.accessor('joinedAt', {
        header: 'Joined',
        cell: ({ getValue }) => (
          <span className="text-hint tabular-nums">
            {new Date(getValue()).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      }),
      col.display({
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.userId === currentUserId ? (
            <span className="team-badge-you">
              <Shield className="icon-sm" />
              You
            </span>
          ) : (
            <span className="status-badge status-badge-active">Active</span>
          ),
      }),
      col.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            {canManageTeam && row.original.userId !== currentUserId ? (
              <Button
                variant="ghost"
                size="icon"
                className="team-button-delete"
                onClick={() =>
                  openRevokeDialog(row.original.userId, row.original.name ?? row.original.email)
                }

                aria-label={`Revoke access for ${row.original.name ?? row.original.email}`}
              >
                <Trash2 className="icon-md" />
              </Button>
            ) : null}
          </div>
        ),
      }),
    ],
    [canManageRoles, canManageTeam, currentUserId]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team members</CardTitle>
        <CardDescription>Manage access, CRM roles, and team membership.</CardDescription>
      </CardHeader>

      <CardContent>
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
                      <span className="text-2xl">👥</span>
                      <p className="font-medium">No team members found</p>
                      <p className="text-sm">Invite your first teammate to start collaborating.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cell.column.id === 'actions' ? 'text-right' : undefined}
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
      </CardContent>

      <RevokeAccessDialog open={dialogOpen} onOpenChange={setDialogOpen} member={selectedMember} />
    </Card>
  );
}
