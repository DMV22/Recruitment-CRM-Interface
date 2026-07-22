import { cacheTag } from 'next/cache';
import { notFound, redirect } from 'next/navigation';

import { SubmissionTable } from '@/components/submissions/submission-table';
import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getSubmissions } from '@/lib/db/queries/submissions';
import { hasPermission } from '@/lib/rbac';
import type { PipelineStage } from '@/lib/db/schema';
import { cacheTags } from '@/lib/cache-tags';

type PageProps = {
  searchParams: Promise<{
    stage?: PipelineStage;
    vacancyId?: string;
    page?: string;
  }>;
};

async function getSubmissionsPageData(
  userId: number,
  crmRole: string,
  teamId: number,
  params: {
    stage?: PipelineStage;
    vacancyId?: string;
    page?: string;
  }
) {
  'use cache';

  cacheTag(cacheTags.submissions.list(teamId));

  const page = Number(params.page ?? '1');
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  const parsedVacancyId = params.vacancyId ? Number(params.vacancyId) : undefined;
  const safeVacancyId =
    parsedVacancyId && !Number.isNaN(parsedVacancyId) ? parsedVacancyId : undefined;

  return getSubmissions(teamId, userId, crmRole, {
    stage: params.stage,
    vacancyId: safeVacancyId,
    page: safePage,
    perPage: 25,
  });
}

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (!hasPermission(user, 'submissions.read')) notFound();

  const teamId = await getUserTeamId(user.id);
  if (!teamId) notFound();

  const result = await getSubmissionsPageData(user.id, user.crmRole, teamId, params);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title-lg">Submissions</h1>
        <p className="page-subtitle">Track candidate pipeline across all vacancies.</p>
      </div>

      <SubmissionTable
        data={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        currentUser={user}
      />
    </div>
  );
}
