import { logActivity } from '@/lib/activity/log-activity';
import { db } from '@/lib/db/drizzle';
import { ActivityType, invitations, teamMembers, teams, users } from '@/lib/db/schema';
import { CrmRole } from '@/lib/rbac';
import { and, desc, eq, asc, count } from 'drizzle-orm';

export async function getTeamOverview(teamId: number) {
  // 1. First, we check whether the command exists (to prevent unnecessary JOIN queries if the ID is incorrect)
  const [team] = await db
    .select({
      id: teams.id,
      name: teams.name,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) return null;

  // 2. In parallel, we load the related data for the existing command
  const [members, pendingInvitations] = await Promise.all([
    db
      .select({
        membershipId: teamMembers.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        crmRole: users.crmRole,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(asc(users.name)),

    db
      .select({
        id: invitations.id,
        email: invitations.email,
        crmRole: invitations.crmRole,
        status: invitations.status,
        invitedAt: invitations.invitedAt,
      })
      .from(invitations)
      .where(and(eq(invitations.teamId, teamId), eq(invitations.status, 'pending')))
      .orderBy(desc(invitations.invitedAt)),
  ]);

  return {
    team,
    members,
    pendingInvitations,
  };
}

export async function inviteTeamMember(
  teamId: number,
  email: string,
  crmRole: CrmRole,
  invitedBy: number
) {
  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .insert(invitations)
      .values({
        teamId,
        email,
        role: 'member',
        crmRole,
        invitedBy,
        status: 'pending',
      })
      .returning();

    await logActivity(
      tx,
      teamId,
      invitedBy,
      ActivityType.INVITE_TEAM_MEMBER,
      'team',
      invitation.id
    );

    return invitation;
  });
}

export async function changeUserCrmRole(
  teamId: number,
  targetUserId: number,
  crmRole: CrmRole,
  changedBy: number
) {
  return db.transaction(async (tx) => {
    const [membershipCheck] = await tx
      .select({ total: count() })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId)));

    const exists = Number(membershipCheck?.total ?? 0) > 0;
    if (!exists) return null;

    const [updatedUser] = await tx
      .update(users)
      .set({
        crmRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId))
      .returning();

    await logActivity(tx, teamId, changedBy, ActivityType.UPDATE_ACCOUNT, 'team', targetUserId);

    return updatedUser;
  });
}
