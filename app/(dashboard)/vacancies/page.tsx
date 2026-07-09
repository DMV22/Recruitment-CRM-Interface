import { cacheTag } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { eq, and, inArray } from 'drizzle-orm';

import { VacancyTable } from '@/components/vacancies/vacancy-table';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getVacancies, getClientsForSelect } from '@/lib/db/queries/vacancies';
import { db } from '@/lib/db/drizzle';
import { teamMembers, users } from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac';
import { cacheTags } from '@/lib/cache-tags';

type PageProps = {
  searchParams: Promise<{
    search?: string;
    status?: 'open' | 'on_hold' | 'closed' | 'filled';
    priority?: 'low' | 'medium' | 'high';
    page?: string;
  }>;
};

async function getVacanciesPageData(
  userId: number,
  crmRole: string,
  teamId: number,
  params: {
    search?: string;
    status?: 'open' | 'on_hold' | 'closed' | 'filled';
    priority?: 'low' | 'medium' | 'high';
    page?: string;
  }
) {
  'use cache';

  cacheTag(cacheTags.vacancies.list(teamId));

  const page = Number(params.page ?? '1');
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  const [vacanciesResult, clients, teamUsers] = await Promise.all([
    getVacancies(teamId, userId, crmRole, {
      search: params.search,
      status: params.status,
      priority: params.priority,
      page: safePage,
      perPage: 25,
    }),
    getClientsForSelect(teamId),
    db
      .select({ id: users.id, name: users.name, crmRole: users.crmRole })
      .from(users)
      .innerJoin(teamMembers, eq(teamMembers.userId, users.id))
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          inArray(users.crmRole, ['recruiter', 'admin', 'hiring_manager'])
        )
      ),
  ]);

  const recruiters = teamUsers
    .filter((u) => u.crmRole === 'recruiter' || u.crmRole === 'admin')
    .map((u) => ({ id: u.id, name: u.name }));

  const hiringManagers = teamUsers
    .filter((u) => u.crmRole === 'hiring_manager' || u.crmRole === 'admin')
    .map((u) => ({ id: u.id, name: u.name }));

  return {
    vacanciesResult,
    clients,
    recruiters,
    hiringManagers,
  };
}

export default async function VacanciesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const user = await getUser();
  if (!user) redirect('/sign-in');

  if (!hasPermission(user, 'vacancies.read')) notFound();

  const teamId = await getUserTeamId(user.id);
  if (!teamId) notFound();

  const { vacanciesResult, clients, recruiters, hiringManagers } = await getVacanciesPageData(
    user.id,
    user.crmRole,
    teamId,
    params
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title-lg">Vacancies</h1>
        <p className="page-subtitle">Manage open roles, priorities, assignments, and deadlines.</p>
      </div>

      <VacancyTable
        data={vacanciesResult.data}
        total={vacanciesResult.total}
        page={vacanciesResult.page}
        totalPages={vacanciesResult.totalPages}
        currentUser={user}
        clients={clients}
        recruiters={recruiters}
        hiringManagers={hiringManagers}
      />
    </div>
  );
}
