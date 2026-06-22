import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getUser } from '@/lib/db/queries';
import { getUserTeamId } from '@/lib/db/queries';
import { getClients } from '@/lib/db/queries/clients';
import { ClientTable } from '@/components/clients/client-table';

type SearchParams = {
  search?: string;
  status?: 'prospect' | 'active' | 'inactive';
  page?: string;
};

async function ClientsContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const teamId = await getUserTeamId(user.id);
  if (!teamId) redirect('/sign-in');

  const page = Number(searchParams.page ?? '1');
  const result = await getClients(teamId, {
    search: searchParams.search,
    status: searchParams.status,
    page,
    perPage: 25,
  });

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

export default async function ClientsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Clients</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage client companies and contacts
        </p>
      </div>

      <ClientsContent searchParams={params} />
    </div>
  );
}