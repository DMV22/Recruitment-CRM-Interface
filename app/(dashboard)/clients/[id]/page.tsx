import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cacheTag } from 'next/cache';
import { ArrowLeft } from 'lucide-react';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getClientById, getClientContacts } from '@/lib/db/queries/clients';
import { cacheTags } from '@/lib/cache-tags';

import ClientDetail from '@/components/clients/client-detail';

async function getClientDetailPageData(id: number, teamId: number) {
  'use cache';

  cacheTag(cacheTags.clients.detail(id));

  const [client, contacts] = await Promise.all([getClientById(id, teamId), getClientContacts(id)]);
  if (!client) return null;

  return { client, contacts };
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = Number(id);

  if (Number.isNaN(clientId)) notFound();

  const user = await getUser();
  if (!user) redirect('/sign-in');

  const teamId = await getUserTeamId(user.id);
  if (!teamId) redirect('/sign-in');

  const data = await getClientDetailPageData(clientId, teamId);
  if (!data) notFound();

  const { client, contacts } = data;

  return (
    <div className="detail-page">
      {/* Back */}
      <Link href="/clients" className="back-link">
        <ArrowLeft className="icon-md" />
        Back to clients
      </Link>

      <ClientDetail client={client} contacts={contacts} />
    </div>
  );
}
