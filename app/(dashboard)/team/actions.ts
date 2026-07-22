'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';

import { cacheTags } from '@/lib/cache-tags';
import { getUser, getUserTeamId } from '@/lib/db/queries';
import { changeUserCrmRole, inviteTeamMember, revokeTeamAccess } from '@/lib/db/queries/team';
import { validateForm } from '@/lib/form';
import { hasPermission } from '@/lib/rbac';
import { invitations, teamMembers, users } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { and, count, eq } from 'drizzle-orm';

const inviteSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  crmRole: z.enum(['admin', 'recruiter', 'hiring_manager', 'viewer']),
});

const changeRoleSchema = z.object({
  userId: z.coerce.number().int().positive('Invalid user ID'),
  crmRole: z.enum(['admin', 'recruiter', 'hiring_manager', 'viewer']),
});

export type TeamActionState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

function revalidateTeam(teamId: number) {
  revalidateTag(cacheTags.team.list(teamId), { expire: 0 });
  revalidateTag(cacheTags.activity.list(teamId), { expire: 0 });
}

export async function inviteMemberAction(
  _prev: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'team.manage')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateForm(formData, inviteSchema);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, crmRole } = parsed.data;

  // SECURITY:
  // 1) Prevent duplicate pending invitations inside the same team.
  // This gives a clear user-facing error before we hit DB constraints.
  const [existingInviteInCurrentTeam] = await db
    .select({ total: count() })
    .from(invitations)
    .where(
      and(
        eq(invitations.teamId, teamId),
        eq(invitations.email, email),
        eq(invitations.status, 'pending')
      )
    );

  if (Number(existingInviteInCurrentTeam?.total ?? 0) > 0) {
    return { error: 'An invitation has already been sent to this email address.' };
  }

  // SECURITY:
  // 2) Prevent inviting a user who is already a member of the current team.
  const [existingMemberInCurrentTeam] = await db
    .select({ total: count() })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.teamId, teamId), eq(users.email, email)));

  if (Number(existingMemberInCurrentTeam?.total ?? 0) > 0) {
    return { error: 'This user is already a member of your team.' };
  }

  // DOMAIN GUARD:
  // 3) Prevent inviting a user who already belongs to another team.
  // Since the system currently enforces one active team membership per user, such invitations would become invisible/useless for that user.
  const [existingMemberInAnotherTeam] = await db
    .select({ total: count() })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(users.email, email));

  if (Number(existingMemberInAnotherTeam?.total ?? 0) > 0) {
    return {
      error: 'This user already belongs to another team and cannot be invited.',
    };
  }

  // DOMAIN GUARD:
  // 4) Prevent hidden cross-team pending invitations.
  // Without this check, a user with no team could receive multiple invitations, but the current UX shows only the oldest pending one.
  const [existingPendingInviteAnywhere] = await db
    .select({ total: count() })
    .from(invitations)
    .where(and(eq(invitations.email, email), eq(invitations.status, 'pending')));

  if (Number(existingPendingInviteAnywhere?.total ?? 0) > 0) {
    return {
      error: 'This email already has a pending invitation to another team.',
    };
  }

  try {
    await inviteTeamMember(teamId, email, crmRole, user.id);
  } catch {
    // Final protection against race conditions or DB-level unique violations.
    return {
      error:
        'Unable to send the invitation because a pending invite already exists or the user is already assigned.',
    };
  }

  revalidateTeam(teamId);

  return { success: true };
}

export async function changeUserRoleAction(
  _prev: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'roles.manage')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  const parsed = validateForm(formData, changeRoleSchema);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { userId, crmRole } = parsed.data;

  // SECURITY: Protection from admin panel lockouts (Self-Demotion guard)
  if (userId === user.id) {
    return { error: 'You cannot modify your own CRM role. Ask another administrator to do this.' };
  }

  const updated = await changeUserCrmRole(teamId, userId, crmRole, user.id);
  if (!updated) return { error: 'Team member not found or access denied' };

  revalidateTeam(teamId);

  return { success: true };
}

export async function revokeAccessAction(userId: number): Promise<TeamActionState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };
  if (!hasPermission(user, 'team.manage')) return { error: 'Forbidden' };

  const teamId = await getUserTeamId(user.id);
  if (!teamId) return { error: 'No team found' };

  // SECURITY: Blocking self-removal from the team (Self-Eviction guard)
  if (userId === user.id) {
    return {
      error: 'You cannot remove yourself from the team. Ask another administrator to do this.',
    };
  }

  const revoked = await revokeTeamAccess(teamId, userId, user.id);
  if (!revoked) return { error: 'Team member not found' };

  revalidateTeam(teamId);

  return { success: true };
}
