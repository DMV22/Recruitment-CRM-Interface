import { notFound, redirect } from 'next/navigation';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { hasPermission } from '@/lib/rbac';
import { getTeamOverview } from '@/lib/db/queries/team';

import { TeamMembersTable } from '@/components/team/team-members-table';
import { InviteMemberForm } from '@/components/team/invite-member-form';
import { PendingInvitationsList } from '@/components/team/pending-invitations-list';

async function getCachedTeamData(teamId: number) {
  'use cache';

  cacheTag(`team-${teamId}`);
  return getTeamOverview(teamId);
}

export default async function TeamPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (!hasPermission(user, 'team.read')) notFound();

  const teamId = await getUserTeamId(user.id);
  if (!teamId) notFound();

  const data = await getCachedTeamData(teamId);
  if (!data) notFound();

  const canManageTeam = hasPermission(user, 'team.manage');
  const canManageRoles = hasPermission(user, 'roles.manage');

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title-lg">Team Management</h1>
        <p className="page-subtitle">Manage team members, assign CRM roles, and control access.</p>
      </div>

      <TeamMembersTable
        members={data.members}
        currentUserId={user.id}
        canManageTeam={canManageTeam}
        canManageRoles={canManageRoles}
      />

      <PendingInvitationsList invitations={data.pendingInvitations} />

      {canManageTeam ? <InviteMemberForm /> : null}
    </div>
  );
}
