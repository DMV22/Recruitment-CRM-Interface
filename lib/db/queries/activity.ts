import { db } from '@/lib/db/drizzle';
import { activityLogs, users, type User } from '@/lib/db/schema';
import { and, count, desc, eq } from 'drizzle-orm';

export type ActivityEntityType = 'client' | 'vacancy' | 'candidate' | 'submission';

export type ActivityFilter = {
  entityType?: ActivityEntityType;
  userId?: number;
  page?: number;
  perPage?: number;
};

export async function getActivityTimeline(
  teamId: number,
  currentUser: User,
  filter: ActivityFilter = {}
) {
  const { entityType, userId, page = 1, perPage = 25 } = filter;
  const offset = (page - 1) * perPage;

  const isAdmin = currentUser.crmRole === 'admin';
  const scopedUserId = isAdmin ? userId : currentUser.id;

  const where = and(
    eq(activityLogs.teamId, teamId),
    entityType ? eq(activityLogs.entityType, entityType) : undefined,
    scopedUserId ? eq(activityLogs.userId, scopedUserId) : undefined
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        timestamp: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        userId: activityLogs.userId,
        userName: users.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(where)
      .orderBy(desc(activityLogs.timestamp))
      .limit(perPage)
      .offset(offset),

    db.select({ total: count() }).from(activityLogs).where(where),
  ]);

  return {
    data: rows,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getActivityUsers(teamId: number) {
  return db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .innerJoin(activityLogs, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.teamId, teamId))
    .groupBy(users.id, users.name)
    .orderBy(users.name);
}
