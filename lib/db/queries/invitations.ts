import { and, asc, count, eq, ilike } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { ActivityType, invitations, teamMembers, teams, users } from '@/lib/db/schema';
import { logActivity } from '@/lib/activity/log-activity';

export async function getPendingInvitationForUser(email: string) {
  const [invitation] = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      crmRole: invitations.crmRole,
      invitedAt: invitations.invitedAt,
      teamId: invitations.teamId,
      status: invitations.status,
      teamName: teams.name,
      invitedByName: users.name,
    })
    .from(invitations)
    .innerJoin(teams, eq(invitations.teamId, teams.id))
    .leftJoin(users, eq(invitations.invitedBy, users.id))
    .where(and(ilike(invitations.email, email), eq(invitations.status, 'pending')))
    .orderBy(asc(invitations.invitedAt))
    .limit(1);

  return invitation ?? null;
}

export async function acceptPendingInvitation(invitationId: number, userId: number) {
  return db.transaction(async (tx) => {
    // 1. Checking if a user exists
    const [user] = await tx
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return { error: 'User not found' };

    // 2. Checking the existence and status of an invitation
    const [invitation] = await tx
      .select()
      .from(invitations)
      .where(and(eq(invitations.id, invitationId), eq(invitations.status, 'pending')))
      .limit(1);

    if (!invitation) return { error: 'Invitation not found or already accepted' };

    // 3. Security: Verifying email ownership
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return { error: 'This invitation does not belong to the current user' };
    }

    // 4. Optomization: Fast and easy index-based count() instead of select()
    const [membershipCheck] = await tx
      .select({ total: count() })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    if (Number(membershipCheck?.total ?? 0) > 0) {
      return { error: 'You are already a member of a team' };
    }

    // 5. Building a relationship with the team
    await tx.insert(teamMembers).values({
      userId,
      teamId: invitation.teamId,
      role: invitation.role,
    });

    // 6. Updating a user role in the global table
    await tx
      .update(users)
      .set({
        crmRole: invitation.crmRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 7. Updating the invitation status
    const [accepted] = await tx
      .update(invitations)
      .set({
        status: 'accepted',
      })
      .where(eq(invitations.id, invitationId))
      .returning();

    // 8. Audit: Logging a successful team join within a transaction
    await logActivity(
      tx,
      invitation.teamId,
      userId,
      ActivityType.ACCEPT_INVITATION,
      'team',
      invitation.teamId
    );

    return { success: true, invitation: accepted };
  });
}
