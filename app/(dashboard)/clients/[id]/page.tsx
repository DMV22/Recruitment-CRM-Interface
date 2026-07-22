import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cacheTag } from 'next/cache';
import { ArrowLeft } from 'lucide-react';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getClientById, getClientContacts } from '@/lib/db/queries/clients';
import { getNotesForEntity } from '@/lib/db/queries/notes';
import { cacheTags } from '@/lib/cache-tags';
import { hasPermission } from '@/lib/rbac';
import { User } from '@/lib/db/schema';

import ClientDetail from '@/components/clients/client-detail';
import { NotesSection } from '@/components/notes/notes-section';

async function getClientDetailPageData(user: User, id: number, teamId: number) {
  'use cache';

  cacheTag(cacheTags.clients.detail(id));

  const canReadNotes = hasPermission(user, 'notes.read');
  const canCreateNotes = hasPermission(user, 'notes.create');

  const client = await getClientById(id, teamId);
  if (!client) return null;

  const [contacts, notes] = await Promise.all([
    getClientContacts(id),
    canReadNotes ? getNotesForEntity(teamId, 'client', id) : Promise.resolve([]),
  ]);

  return { client, contacts, notes, canReadNotes, canCreateNotes };
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = Number(id);

  if (Number.isNaN(clientId)) notFound();

  const user = await getUser();
  if (!user) redirect('/sign-in');

  if (!hasPermission(user, 'clients.read')) notFound();

  const teamId = await getUserTeamId(user.id);
  if (!teamId) redirect('/sign-in');

  const data = await getClientDetailPageData(user, clientId, teamId);
  if (!data) notFound();

  const { client, contacts, notes, canReadNotes, canCreateNotes } = data;

  return (
    <div className="detail-page">
      {/* Back */}
      <Link href="/clients" className="back-link">
        <ArrowLeft className="icon-md" />
        Back to clients
      </Link>

      <ClientDetail client={client} contacts={contacts} />

      {canReadNotes ? (
        <NotesSection
          entityType="client"
          entityId={client.id}
          notes={notes}
          currentUserId={user.id}
          canCreate={canCreateNotes}
        />
      ) : null}
    </div>
  );
}
