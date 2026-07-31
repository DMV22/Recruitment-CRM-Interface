import { notFound, redirect } from 'next/navigation';

import { getUser } from '@/lib/db/queries';
import { hasPermission } from '@/lib/rbac';

type LegacyActivitySearchParams = Record<string, string | string[] | undefined>;

export default async function LegacyActivityPage({
  searchParams,
}: {
  searchParams: Promise<LegacyActivitySearchParams>;
}) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (!hasPermission(user, 'activity.read')) notFound();

  const params = await searchParams;
  const destination = new URLSearchParams();

  for (const key of ['entityType', 'userId', 'page']) {
    const value = params[key];
    if (typeof value === 'string') destination.set(key, value);
  }

  const query = destination.toString();
  redirect(query ? `/settings?${query}#activity` : '/settings#activity');
}
