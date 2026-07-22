'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { getUser } from '@/lib/db/queries';
import { acceptPendingInvitation } from '@/lib/db/queries/invitations';
import { cacheTags } from '@/lib/cache-tags';

export type AcceptInvitationState = {
  error?: string;
  success?: boolean;
};

export async function acceptInvitationAction(
  _prev: AcceptInvitationState,
  formData: FormData
): Promise<AcceptInvitationState> {
  const user = await getUser();
  if (!user) return { error: 'Unauthorized' };

  const invitationId = Number(formData.get('invitationId'));
  if (!Number.isInteger(invitationId) || invitationId <= 0) {
    return { error: 'Invalid invitation' };
  }

  const result = await acceptPendingInvitation(invitationId, user.id);

  if ('error' in result) {
    return { error: result.error };
  }

  const teamId = result.invitation.teamId;

  revalidateTag(cacheTags.team.list(teamId), { expire: 0 });
  revalidateTag(cacheTags.activity.list(teamId), { expire: 0 });

  redirect('/team');
}
