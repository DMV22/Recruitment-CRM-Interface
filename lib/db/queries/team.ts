import { db } from '@/lib/db/drizzle';
import { invitations, teamMembers, teams, users } from '@/lib/db/schema';
import { and, desc, eq, asc } from 'drizzle-orm';

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
