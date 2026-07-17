import { Mail } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/format-time';
import type { CrmRole } from '@/lib/rbac';

type InvitationRow = {
  id: number;
  email: string;
  crmRole: CrmRole;
  status: string;
  invitedAt: Date;
};

type Props = {
  invitations: InvitationRow[];
};

export function formatRoleLabel(role: CrmRole) {
  return role.replace('_', ' ');
}

export function PendingInvitationsList({ invitations }: Props) {
  return (
    <Card className="panel">
      <CardHeader className="panel-header">
        <CardTitle className="panel-title">Pending invitations</CardTitle>
        <CardDescription className="panel-subtitle">
          Users who have been invited but have not joined yet.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {invitations.length === 0 ? (
          <div className="table-empty-content">
            <span className="text-2xl">✉️</span>
            <p className="font-medium">No pending invitations</p>
            <p className="text-sm">All invitations have been accepted or none were sent yet.</p>
          </div>
        ) : (
          <div className="invites-list-wrapper">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="invite-card-row">
                <div className="invite-card-info">
                  <div className="invite-card-email-block">
                    <Mail className="icon-md text-muted-foreground/80" />
                    <p className="invite-card-email">{invitation.email}</p>
                  </div>

                  <div className="invite-card-meta">
                    <span className="status-badge capitalize">
                      {formatRoleLabel(invitation.crmRole)}
                    </span>
                    <span className="status-badge status-badge-medium capitalize">
                      {invitation.status}
                    </span>
                  </div>
                </div>

                <p className="text-hint">Invited {formatRelativeTime(invitation.invitedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
