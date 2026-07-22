import { notFound, redirect } from 'next/navigation';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { hasPermission } from '@/lib/rbac';
import { getTeamOverview } from '@/lib/db/queries/team';
import { cacheTags } from '@/lib/cache-tags';

import { TeamMembersTable } from '@/components/team/team-members-table';
import { InviteMemberForm } from '@/components/team/invite-member-form';
import { PendingInvitationsList } from '@/components/team/pending-invitations-list';
import { getPendingInvitationForUser } from '@/lib/db/queries/invitations';
import { PendingInvitationBanner } from '@/components/team/pending-invitation-banner';

async function getCachedTeamData(teamId: number) {
  'use cache';

  cacheTag(cacheTags.team.list(teamId));
  return getTeamOverview(teamId);
}

export default async function TeamPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const teamId = await getUserTeamId(user.id);
  if (!teamId) {
    const pendingInvitation = await getPendingInvitationForUser(user.email);

    return (
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title-lg">Team Access</h1>
          <p className="page-subtitle">You are currently not a member of any team.</p>
        </div>

        {pendingInvitation ? (
          <PendingInvitationBanner invitation={pendingInvitation} />
        ) : (
          <div className="table-empty-content rounded-lg border">
            <span className="text-2xl">👤</span>
            <p className="font-medium">No active team membership</p>
            <p className="text-sm">
              Your account does not currently belong to a team and no pending invitation was found.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!hasPermission(user, 'team.read')) notFound();

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
