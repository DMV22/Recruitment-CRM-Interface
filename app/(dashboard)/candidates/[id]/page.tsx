import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cacheTag } from 'next/cache';
import { ArrowLeft } from 'lucide-react';

import { CandidateDetail } from '@/components/candidates/candidate-detail';
import { NotesSection } from '@/components/notes/notes-section';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getCandidateById } from '@/lib/db/queries/candidates';
import { getNotesForEntity } from '@/lib/db/queries/notes';
import { hasPermission } from '@/lib/rbac';
import { cacheTags } from '@/lib/cache-tags';

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

  cacheTag(cacheTags.candidates.detail(id));

  const [candidate, notes] = await Promise.all([
    getCandidateById(id, teamId, userId, crmRole),
    getNotesForEntity(teamId, 'candidate', id),
  ]);

  if (!candidate) return null;

  return { candidate, notes };
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

  const data = await getCandidateDetailPageData(candidateId, teamId, user.id, user.crmRole);
  if (!data) notFound();

  const { candidate, notes } = data;

  return (
    <div className="page-content">
      <Link href="/candidates" className="back-link">
        <ArrowLeft className="icon-md" />
        Back to candidates
      </Link>

      <CandidateDetail candidate={candidate} />

      <NotesSection
        entityType="candidate"
        entityId={candidate.id}
        notes={notes}
        currentUserId={user.id}
        canCreate={hasPermission(user, 'notes.create')}
      />
    </div>
  );
}
