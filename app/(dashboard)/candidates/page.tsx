import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { notFound, redirect } from 'next/navigation';

import { CandidateTable } from '@/components/candidates/candidate-table';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getCandidates } from '@/lib/db/queries/candidates';
import { hasPermission } from '@/lib/rbac';

type PageProps = {
  searchParams: Promise<{
    search?: string;
    status?: 'active' | 'passive' | 'placed' | 'blacklisted';
    seniority?: 'intern' | 'junior' | 'middle' | 'senior' | 'lead' | 'principal';
    page?: string;
  }>;
};

async function getCandidatesPageData(
  userId: number,
  crmRole: string,
  teamId: number,
  params: {
    search?: string;
    status?: 'active' | 'passive' | 'placed' | 'blacklisted';
    seniority?: 'intern' | 'junior' | 'middle' | 'senior' | 'lead' | 'principal';
    page?: string;
  }
) {
  'use cache';

  cacheTag('candidates');

  const page = Number(params.page ?? '1');
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  return getCandidates(teamId, userId, crmRole, {
    search: params.search,
    status: params.status,
    seniority: params.seniority,
    page: safePage,
    perPage: 25,
  });
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const user = await getUser();
  if (!user) redirect('/sign-in');

  if (!hasPermission(user, 'candidates.read')) notFound();

  const teamId = await getUserTeamId(user.id);
  if (!teamId) notFound();

  const candidatesResult = await getCandidatesPageData(user.id, user.crmRole, teamId, params);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title-lg">Candidates</h1>
        <p className="page-subtitle">Manage candidate profiles, skills, and pipeline activity.</p>
      </div>

      <CandidateTable
        data={candidatesResult.data}
        total={candidatesResult.total}
        page={candidatesResult.page}
        totalPages={candidatesResult.totalPages}
        currentUser={user}
      />
    </div>
  );
}
