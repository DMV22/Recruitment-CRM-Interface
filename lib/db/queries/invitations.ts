import { and, asc, eq, ilike } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { invitations, teams, users } from '@/lib/db/schema';

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
