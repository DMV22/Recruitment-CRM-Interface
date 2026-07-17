'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';

import { cacheTags } from '@/lib/cache-tags';

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
