import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Building2, Briefcase, MapPin, Coins, CalendarDays, User2, ArrowLeft } from 'lucide-react';
import { cacheTag } from 'next/cache';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VacancyStatusBadge } from '@/components/vacancies/vacancy-status-badge';
import { VacancyPriorityBadge } from '@/components/vacancies/vacancy-priority-badge';
import { VacancyPipeline } from '@/components/vacancies/vacancy-pipeline';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getVacancyById } from '@/lib/db/queries/vacancies';
import { getSubmissionsByVacancy, getCandidatesForSubmit } from '@/lib/db/queries/submissions';
import { hasPermission } from '@/lib/rbac';
import { cacheTags } from '@/lib/cache-tags';

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatSalary(min: number | null, max: number | null, currency: string) {
  if (min === null && max === null) return '—';

  const minStr = min?.toLocaleString();
  const maxStr = max?.toLocaleString();

  if (min !== null && max !== null) {
    return min > max ? `${minStr} ${currency}` : `${minStr} - ${maxStr} ${currency}`;
  }

  if (min !== null) return `From ${minStr} ${currency}`;
  return `Up to ${maxStr} ${currency}`;
}

function formatDate(date: Date | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

async function getVacancyDetailPageData(id: number, teamId: number) {
  'use cache';

  cacheTag(cacheTags.vacancies.detail(id));
  cacheTag(cacheTags.submissions.byVacancy(id));

  const [vacancy, pipelineSubmissions, availableCandidates] = await Promise.all([
    getVacancyById(id, teamId),
    getSubmissionsByVacancy(id, teamId),
    getCandidatesForSubmit(teamId, id),
  ]);

  if (!vacancy) return null;

  return {
    vacancy,
    pipelineSubmissions,
    availableCandidates,
  };
}

export default async function VacancyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const vacancyId = Number(id);

  if (Number.isNaN(vacancyId)) {
    notFound();
  }

  const user = await getUser();
  if (!user) redirect('/sign-in');

  if (!hasPermission(user, 'vacancies.read')) notFound();

  const teamId = await getUserTeamId(user.id);
  if (!teamId) notFound();

  const pageData = await getVacancyDetailPageData(vacancyId, teamId);
  if (!pageData) notFound();

  const { vacancy, pipelineSubmissions, availableCandidates } = pageData;

  if (user.crmRole === 'hiring_manager' && vacancy.hiringManagerId !== user.id) {
    notFound();
  }

  return (
    <div className="page-content">
      <Link href="/vacancies" className="back-link">
        <ArrowLeft className="icon-md" />
        Back to vacancies
      </Link>

      <div className="space-y-3">
        <div className="detail-title">
          <h1 className="page-title-lg">{vacancy.title}</h1>
          <VacancyStatusBadge status={vacancy.status} />
          <VacancyPriorityBadge priority={vacancy.priority} />
        </div>

        <div className="vacancy-meta-row">
          <span className="vacancy-meta-item">
            <Building2 className="icon-md" />
            {vacancy.client?.name ?? '—'}
          </span>

          <span className="vacancy-meta-item">
            <Briefcase className="icon-md" />
            {vacancy.workType}
          </span>

          <span className="vacancy-meta-item">
            <MapPin className="icon-md" />
            {vacancy.location ?? '—'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Vacancy details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="detail-field">
                <p className="detail-field-label">Client</p>
                <p className="font-medium">{vacancy.client?.name ?? '—'}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Seniority</p>
                <p className="font-medium">{vacancy.seniority ?? '—'}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Tech stack</p>
                <p className="font-medium">{vacancy.techStack ?? '—'}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Salary</p>
                <p className="font-medium">
                  {formatSalary(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency)}
                </p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Deadline</p>
                <p className="font-medium">{formatDate(vacancy.deadlineAt)}</p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Created</p>
                <p className="font-medium">{formatDate(vacancy.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="detail-field-label">Description</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {vacancy.description ?? 'No description provided.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="detail-field">
                <p className="detail-field-label">Assigned recruiter</p>
                <p className="vacancy-meta-item font-medium">
                  <User2 className="icon-md text-muted-foreground" />
                  {vacancy.assignedRecruiter?.name ?? 'Unassigned'}
                </p>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">Hiring manager</p>
                <p className="vacancy-meta-item font-medium">
                  <User2 className="icon-md text-muted-foreground" />
                  {vacancy.hiringManager?.name ?? 'Unassigned'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="snapshot-item">
                <Coins className="icon-md" />
                <span>{formatSalary(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency)}</span>
              </div>

              <div className="snapshot-item">
                <CalendarDays className="icon-md" />
                <span>Deadline: {formatDate(vacancy.deadlineAt)}</span>
              </div>

              <div className="snapshot-item">
                <Briefcase className="icon-md" />
                <span>{pipelineSubmissions.length} submissions in pipeline</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <VacancyPipeline
        vacancyId={vacancyId}
        vacancyTitle={vacancy.title}
        clientName={vacancy.client?.name ?? '—'}
        submissions={pipelineSubmissions}
        availableCandidates={availableCandidates}
        currentUser={user}
      />
    </div>
  );
}
