import { redirect } from 'next/navigation';
import { cacheTag } from 'next/cache';

import { getUser } from '@/lib/db/queries';
import { getUserTeamId } from '@/lib/db/queries';
import { getClients } from '@/lib/db/queries/clients';
import { cacheTags } from '@/lib/cache-tags';

import { ClientTable } from '@/components/clients/client-table';

type SearchParams = {
  search?: string;
  status?: 'prospect' | 'active' | 'inactive';
  page?: string;
};

async function getClientsPageData(teamId: number, params: SearchParams) {
  'use cache';

  cacheTag(cacheTags.clients.list(teamId));

  const page = Number(params.page ?? '1');
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  return getClients(teamId, {
    search: params.search,
    status: params.status,
    page: safePage,
    perPage: 25,
  });
}

async function ClientsContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const teamId = await getUserTeamId(user.id);
  if (!teamId) redirect('/sign-in');

  const result = await getClientsPageData(teamId, searchParams);

  return (
    <ClientTable
      data={result.data}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      currentUser={user}
    />
  );
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <p className="page-subtitle">Manage client companies and contacts</p>
      </div>

      <ClientsContent searchParams={params} />
    </div>
  );
}
