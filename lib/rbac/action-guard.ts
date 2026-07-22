import { getUser } from '@/lib/db/queries';
import { requirePermission } from '@/lib/rbac';
import type { Permission } from '@/lib/rbac';

export async function withPermission<T>(
  permission: Permission,
  action: (userId: number) => Promise<T>
): Promise<T> {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  requirePermission(user, permission);
  return action(user.id);
}
