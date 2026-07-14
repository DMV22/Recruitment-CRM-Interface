import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { Building2, Briefcase, Users, GitPullRequest, TrendingUp, Trophy } from 'lucide-react';

import { KpiCard } from '@/components/dashboard/kpi-card';
import { PipelineFunnel } from '@/components/dashboard/pipeline-funnel';
import { RecentSubmissions } from '@/components/dashboard/recent-submissions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { VacanciesStatusChart } from '@/components/dashboard/vacancies-status-chart';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { User } from '@/lib/db/schema';
import { getDashboardStats } from '@/lib/db/queries/dashboard';
import { hasPermission } from '@/lib/rbac';
import { cacheTags } from '@/lib/cache-tags';

type DashboardDataProps = {
  teamId: number;
  userId: number;
  crmRole: string;
};

async function getCachedDashboardData({ teamId, userId, crmRole }: DashboardDataProps) {
  'use cache';

  cacheTag(cacheTags.clients.list(teamId));
  cacheTag(cacheTags.vacancies.list(teamId));
  cacheTag(cacheTags.candidates.list(teamId));
  cacheTag(cacheTags.submissions.list(teamId));

  return getDashboardStats(teamId, userId, crmRole);
}

async function DashboardContent({ teamId, user }: { teamId: number; user: User }) {
  const stats = await getCachedDashboardData({
    teamId,
    userId: user.id,
    crmRole: user.crmRole,
  });

  const firstName = user.name?.split(' ')[0] ?? 'there';

  return (
    <div className="page-content">
      <div>
        <h1 className="page-title-lg">
          Good {getGreeting()}, {firstName}
        </h1>
        <p className="page-subtitle">
          Here&apos;s what&apos;s happening with your recruitment pipeline today.
        </p>
      </div>

      {/* KPI Grid - 6 cards */}
      <section aria-label="Key performance indicators" className="dashboard-kpi-grid">
        <KpiCard
          title="Total Clients"
          value={stats.kpi.totalClients}
          icon={Building2}
          description="Companies in CRM"
        />
        <KpiCard
          title="Active Vacancies"
          value={stats.kpi.activeVacancies}
          icon={Briefcase}
          description="Open positions"
        />
        <KpiCard
          title="Candidates"
          value={stats.kpi.totalCandidates}
          icon={Users}
          description="Talent pool"
        />
        <KpiCard
          title="Submissions"
          value={stats.kpi.totalSubmissions}
          icon={GitPullRequest}
          description="All pipeline entries"
        />
        <KpiCard
          title="Hired This Month"
          value={stats.kpi.hiredThisMonth}
          icon={Trophy}
          description="Placements this month"
        />
        <KpiCard
          title="Conversion"
          value={`${stats.kpi.conversionRate}%`}
          icon={TrendingUp}
          description="Submissions → Hired"
        />
      </section>

      {/* Pipeline Funnel + Vacancy Status */}
      <section aria-label="Pipeline overview" className="dashboard-middle-grid">
        <div className="dashboard-funnel-col">
          <PipelineFunnel data={stats.pipeline} />
        </div>
        <div className="dashboard-status-col">
          <VacanciesStatusChart data={stats.vacanciesByStatus} />
        </div>
      </section>

      {/* Recent Submissions + Activity */}
      <section aria-label="Recent activity" className="dashboard-lower-grid">
        <RecentSubmissions data={stats.recentSubmissions} />
        <RecentActivity data={stats.recentActivity} />
      </section>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours(); // Browser/server local time for a good UX
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (!hasPermission(user, 'dashboard.read')) notFound();

  const teamId = await getUserTeamId(user.id);
  if (!teamId) notFound();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent teamId={teamId} user={user} />
    </Suspense>
  );
}

export const metadata = { title: 'Dashboard | Recruitment CRM' };
