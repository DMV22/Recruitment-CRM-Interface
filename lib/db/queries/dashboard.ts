import { db } from '@/lib/db/drizzle';
import {
  clients,
  vacancies,
  candidates,
  submissions,
  activityLogs,
  users,
  PipelineStage,
  PIPELINE_STAGES,
} from '@/lib/db/schema';
import { candidateScopeFilter } from '@/lib/rbac/candidate-scope';
import { eq, and, count, desc, gte, isNull } from 'drizzle-orm';

export type DashboardStats = {
  kpi: {
    totalClients: number;
    activeVacancies: number;
    totalCandidates: number;
    totalSubmissions: number;
    hiredThisMonth: number;
    conversionRate: number;
  };
  pipeline: { stage: string; count: number }[];
  recentSubmissions: {
    id: number;
    candidateName: string;
    vacancyTitle: string;
    clientName: string;
    stage: string;
    submittedAt: Date;
  }[];
  recentActivity: {
    id: number;
    action: string;
    entityType: string | null;
    userName: string | null;
    timestamp: Date;
  }[];
  vacanciesByStatus: { status: string; count: number }[];
};

export async function getDashboardStats(
  teamId: number,
  userId: number,
  crmRole: string
): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const isHiringManager = crmRole === 'hiring_manager';

  const candidateScope = candidateScopeFilter(userId, crmRole, teamId);

  // Security: creating a single filter for the vacancies table
  const vacancyScopeFilter = isHiringManager
    ? and(eq(vacancies.teamId, teamId), eq(vacancies.hiringManagerId, userId))
    : eq(vacancies.teamId, teamId);

  // Optimization: to count hiring-manager submixes, we also need an inner join with the filtered job openings
  const submissionScopeFilter = isHiringManager
    ? and(eq(vacancies.teamId, teamId), eq(vacancies.hiringManagerId, userId))
    : eq(vacancies.teamId, teamId);

  const [
    [{ rawClients }],
    [{ rawVacancies }],
    [{ rawCandidates }],
    [{ rawSubmissions }],
    [{ rawHired }],
    pipelineRows,
    recentSubmissionsRaw,
    recentActivityRaw,
    vacancyStatusRows,
  ] = await Promise.all([
    db.select({ rawClients: count() }).from(clients).where(eq(clients.teamId, teamId)),

    db
      .select({ rawVacancies: count() })
      .from(vacancies)
      .where(and(vacancyScopeFilter, eq(vacancies.status, 'open'))),

    db
      .select({ rawCandidates: count() })
      .from(candidates)
      .where(and(eq(candidates.teamId, teamId), isNull(candidates.deletedAt), candidateScope)),

    db
      .select({ rawSubmissions: count() })
      .from(submissions)
      .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
      .where(submissionScopeFilter),

    db
      .select({ rawHired: count() })
      .from(submissions)
      .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
      .where(
        and(
          submissionScopeFilter,
          eq(submissions.currentStage, 'hired'),
          gte(submissions.updatedAt, startOfMonth)
        )
      ),

    // Pipeline funnel - submissions по stage
    db
      .select({ stage: submissions.currentStage, count: count() })
      .from(submissions)
      .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
      .where(submissionScopeFilter)
      .groupBy(submissions.currentStage),

    // Last 5 submissions
    db
      .select({
        id: submissions.id,
        candidateFirstName: candidates.firstName,
        candidateLastName: candidates.lastName,
        vacancyTitle: vacancies.title,
        clientName: clients.name,
        stage: submissions.currentStage,
        submittedAt: submissions.submittedAt,
      })
      .from(submissions)
      .innerJoin(vacancies, eq(submissions.vacancyId, vacancies.id))
      .innerJoin(clients, eq(vacancies.clientId, clients.id))
      .innerJoin(candidates, eq(submissions.candidateId, candidates.id))
      .where(submissionScopeFilter)
      .orderBy(desc(submissions.submittedAt))
      .limit(5),

    // Team's latest activity
    db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        userName: users.name,
        timestamp: activityLogs.timestamp,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.teamId, teamId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(5),

    // Vacancies by status
    db
      .select({ status: vacancies.status, count: count() })
      .from(vacancies)
      .where(vacancyScopeFilter)
      .groupBy(vacancies.status),
  ]);

  const kpi = {
    totalClients: Number(rawClients),
    activeVacancies: Number(rawVacancies),
    totalCandidates: Number(rawCandidates),
    totalSubmissions: Number(rawSubmissions),
    hiredThisMonth: Number(rawHired),
    conversionRate: 0,
  };

  kpi.conversionRate =
    kpi.totalSubmissions > 0 ? Math.round((kpi.hiredThisMonth / kpi.totalSubmissions) * 100) : 0;

  const pipelineMap = new Map<PipelineStage, number>(
    pipelineRows.map((r) => [r.stage, Number(r.count)])
  );
  const pipeline = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: pipelineMap.get(stage) ?? 0,
  }));

  return {
    kpi,
    pipeline,
    recentSubmissions: recentSubmissionsRaw.map((r) => ({
      id: r.id,
      candidateName: `${r.candidateFirstName} ${r.candidateLastName}`,
      vacancyTitle: r.vacancyTitle,
      clientName: r.clientName,
      stage: r.stage,
      submittedAt: r.submittedAt,
    })),
    recentActivity: recentActivityRaw.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      userName: r.userName,
      timestamp: r.timestamp,
    })),
    vacanciesByStatus: vacancyStatusRows.map((r) => ({
      status: r.status,
      count: Number(r.count),
    })),
  };
}
