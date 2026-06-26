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
    <div className="detail-page">
      {/* Back */}
      <Link
        href="/clients"
        className="back-link"
      >
        <ArrowLeft className="icon-md" />
        Back to clients
      </Link>

      {/* Header */}
      <div className="detail-header">
        <div className="page-title">
          <div className="detail-title">
            <h1 className="page-title">{client.name}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
          {client.industry && (
            <p className="text-hint">{client.industry}</p>
          )}
        </div>
      </div>

      {/* Details card */}
      <div className="detail-card">
        <h2 className="card-label">Details</h2>
        <dl className="detail-grid">
          <div>
            <dt className="detail-label">
              <Globe className="icon-sm" /> Website
            </dt>
            <dd>
              {client.website ? (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link"
                >
                  {client.website} <ExternalLink className="icon-xs" />
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="detail-label">
              <Building2 className="icon-sm" /> Assigned to
            </dt>
            <dd>{client.assignedUser?.name ?? <span className="text-muted-foreground">Unassigned</span>}</dd>
          </div>
        </dl>

        {client.notes && (
          <div>
            <dt className="detail-label">
              <FileText className="icon-sm" /> Notes
            </dt>
            <p className="text-hint whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Contacts */}
      {contacts.length > 0 && (
        <div className="detail-card-sm">
          <h2 className="card-label">Contacts ({contacts.length})</h2>
          <ul className="contact-list">
            {contacts.map((c) => (
              <li key={c.id} className="contact-item">
                <div>
                  <p className="card-label">
                    {c.name}
                    {c.isPrimary && (
                      <span className="contact-badge">(Primary)</span>
                    )}
                  </p>
                  {c.position && <p className="text-meta">{c.position}</p>}
                </div>
                <div className="contact-meta">
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