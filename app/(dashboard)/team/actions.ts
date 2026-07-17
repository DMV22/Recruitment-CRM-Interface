'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';

import { cacheTags } from '@/lib/cache-tags';
import { getUser, getUserTeamId } from '@/lib/db/queries';
import { inviteTeamMember } from '@/lib/db/queries/team';
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
  revalidateTag(cacheTags.team.list(teamId), 'max');
  revalidateTag(cacheTags.activity.list(teamId), 'max');
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

  // SECURITY: Checking whether this email address is already a member or has been invited
  // 1. Searching for an active invitation (pending) to this team
  const [existingInvite] = await db
    .select({ total: count() })
    .from(invitations)
    .where(
      and(
        eq(invitations.teamId, teamId),
        eq(invitations.email, email),
        eq(invitations.status, 'pending')
      )
    );

  if (Number(existingInvite?.total ?? 0) > 0) {
    return { error: 'An invitation has already been sent to this email address' };
  }

  // 2. Searching to see if a user with this email address is already a member of this team
  const [existingMember] = await db
    .select({ total: count() })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.teamId, teamId), eq(users.email, email)));

  if (Number(existingMember?.total ?? 0) > 0) {
    return { error: 'This user is already a member of your team' };
  }

  await inviteTeamMember(teamId, email, crmRole, user.id);
  revalidateTeam(teamId);

  return { success: true };
}
