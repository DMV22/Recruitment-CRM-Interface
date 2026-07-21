import { and, asc, count, eq, ilike } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import { ActivityType, invitations, teamMembers, teams, users } from '@/lib/db/schema';
import { logActivity } from '@/lib/activity/log-activity';

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

export async function acceptPendingInvitation(invitationId: number, userId: number) {
  return db.transaction(async (tx) => {
    // 1. Верифікація існування користувача та його актуального email
    const [user] = await tx
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return { error: 'User not found' };

    // 2. Попередня перевірка на рівні додатку.
    // Скорочує навантаження, але фінальний захист від Race Condition забезпечить UNIQUE CONSTRAINT у БД.
    const [existingMembership] = await tx
      .select({ total: count() })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    if (Number(existingMembership?.total ?? 0) > 0) {
      return { error: 'You are already a member of a team' as const };
    }

    // 3. АТОМАРНЕ ЗАХОПЛЕННЯ (Atomic Claim): Зміна статусу інвайту на 'accepted' одним запитом.
    // Це унеможливлює Race Condition - паралельний запит отримає пустий результат.
    const [claimedInvitation] = await tx
      .update(invitations)
      .set({
        status: 'accepted',
      })
      .where(and(eq(invitations.id, invitationId), eq(invitations.status, 'pending')))
      .returning();

    // 4. Захисні гварди: перевірка чи інвайт взагалі існував та чи належить він поточному юзеру
    if (!claimedInvitation) {
      return { error: 'Invitation not found or already accepted' as const };
    }

    if (claimedInvitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return { error: 'This invitation does not belong to the current user' as const };
    }

    // 5. Створення зв'язку з командою.
    // Якщо в цей мікромомент інший потік спробував вставити цей же userId, UNIQUE constraint бази заблокує операцію та скасує транзакцію.
    await tx.insert(teamMembers).values({
      userId,
      teamId: claimedInvitation.teamId,
      role: claimedInvitation.role,
    });

    // 6. Синхронізація глобальної CRM-ролі користувача
    await tx
      .update(users)
      .set({
        crmRole: claimedInvitation.crmRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 7. Аудит: Логування успішного приєднання до команди всередині транзакції
    await logActivity(
      tx,
      claimedInvitation.teamId,
      userId,
      ActivityType.ACCEPT_INVITATION,
      'team',
      claimedInvitation.teamId
    );

    return { success: true, invitation: claimedInvitation };
  });
}
