import { db } from '@/lib/db/drizzle';
import { activityLogs, ActivityType } from '@/lib/db/schema';

export async function logActivity(
  teamId: number,
  userId: number | null,
  action: ActivityType,
  entityType?: string | null,
  entityId?: number | null
) {
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action,
    entityType: entityType ?? null,
    entityId: entityId ?? null,
  });
}
