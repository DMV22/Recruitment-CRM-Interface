import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cacheTag } from 'next/cache';
import { ArrowLeft } from 'lucide-react';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getCandidateById } from '@/lib/db/queries/candidates';
import { hasPermission } from '@/lib/rbac';

import { CandidateDetail } from '@/components/candidates/candidate-detail';

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getCandidateDetailPageData(
  id: number,
  teamId: number,
  userId: number,
  crmRole: string
) {
  'use cache';

  cacheTag('candidates');
  cacheTag(`candidate-${id}`);

  const candidate = await getCandidateById(id, teamId, userId, crmRole);
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

  const candidate = await getCandidateDetailPageData(candidateId, teamId, user.id, user.crmRole);
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
