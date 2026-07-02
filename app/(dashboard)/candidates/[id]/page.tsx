import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { ArrowLeft } from 'lucide-react';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getCandidateById } from '@/lib/db/queries/candidates';
import { hasPermission } from '@/lib/rbac';

import { CandidateDetail } from '@/components/candidates/candidate-detai';

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getCandidateDetailPageData(id: number, teamId: number) {
  'use cache';

  cacheTag('candidates');
  cacheTag(`candidate-${id}`);

  const candidate = await getCandidateById(id, teamId);
  return candidate ?? null;
}

export default async function CandidateDetailPage({ params }: PageProps) {
  const { id } = await params;
  const candidateId = Number(id);

  if (Number.isNaN(candidateId)) notFound();

  const user = await getUser();
  if (!user) redirect('/sign-in');

  if (!hasPermission(user, 'candidates.read')) notFound();

  const teamId = await getUserTeamId(user.id);
  if (!teamId) notFound();

  const candidate = await getCandidateDetailPageData(candidateId, teamId);
  if (!candidate) notFound();

  return (
    <div className="page-content">
      <Link href="/candidates" className="back-link">
        <ArrowLeft className="icon-md" />
        Back to candidates
      </Link>

      <CandidateDetail candidate={candidate} />
    </div>
  );
}
