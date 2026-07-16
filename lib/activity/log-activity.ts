import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';

type DbExecutor = Pick<typeof db, 'insert'>;

export async function logActivity(
  executor: DbExecutor,
  teamId: number,
  userId: number | null,
  action: ActivityType,
  entityType?: string | null,
  entityId?: number | null
) {
  await executor.insert(activityLogs).values({
    teamId,
    userId,
    action,
    entityType: entityType ?? null,
    entityId: entityId ?? null,
  });
}
