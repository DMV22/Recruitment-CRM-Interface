import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import { getClientById, getClientContacts } from '@/lib/db/queries/clients';

import { ClientStatusBadge } from '@/components/clients/client-status-badge';

import { ArrowLeft, ExternalLink, Building2, Globe, FileText } from 'lucide-react';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }>; }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const teamId = await getUserTeamId(user.id);
  if (!teamId) redirect('/sign-in');

  const [client, contacts] = await Promise.all([
    getClientById(Number(id), teamId),
    getClientContacts(Number(id)),
  ]);

  if (!client) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{client.name}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
          {client.industry && (
            <p className="text-sm text-muted-foreground">{client.industry}</p>
          )}
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium">Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 mb-1">
              <Globe className="h-3.5 w-3.5" /> Website
            </dt>
            <dd>
              {client.website ? (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {client.website} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 mb-1">
              <Building2 className="h-3.5 w-3.5" /> Assigned to
            </dt>
            <dd>{client.assignedUser?.name ?? <span className="text-muted-foreground">Unassigned</span>}</dd>
          </div>
        </dl>

        {client.notes && (
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 mb-1 text-sm">
              <FileText className="h-3.5 w-3.5" /> Notes
            </dt>
            <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Contacts */}
      {contacts.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-medium">Contacts ({contacts.length})</h2>
          <ul className="divide-y divide-border">
            {contacts.map((c) => (
              <li key={c.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {c.name}
                    {c.isPrimary && (
                      <span className="ml-2 text-xs text-muted-foreground">(Primary)</span>
                    )}
                  </p>
                  {c.position && <p className="text-xs text-muted-foreground">{c.position}</p>}
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  {c.email && <p>{c.email}</p>}
                  {c.phone && <p>{c.phone}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}