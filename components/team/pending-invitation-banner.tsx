'use client';

import { useActionState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';

import {
  acceptInvitationAction,
  type AcceptInvitationState,
} from '@/app/(dashboard)/team/invitation-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CrmRole } from '@/lib/rbac';

type Props = {
  invitation: {
    id: number;
    teamName: string;
    invitedByName: string | null;
    crmRole: CrmRole;
    invitedAt: Date;
  };
};

const initialState: AcceptInvitationState = {};

export function PendingInvitationBanner({ invitation }: Props) {
  const [state, formAction, isPending] = useActionState(acceptInvitationAction, initialState);

  return (
    <Card className="panel max-w-xl mx-auto">
      <CardHeader className="panel-header">
        <CardTitle className="panel-title banner-title-content">
          <MailCheck className="banner-title-icon" />
          Workspace invitation
        </CardTitle>
        <CardDescription className="panel-subtitle mt-1.5">
          You have a pending invitation to join{' '}
          <span className="font-semibold text-foreground">{invitation.teamName}</span>.
        </CardDescription>
      </CardHeader>

      <CardContent className="banner-body">
        {/* Meta information block */}
        <div className="banner-meta-list">
          <p>
            Role:{' '}
            <span className="banner-meta-value capitalize">
              {invitation.crmRole.replace('_', ' ')}
            </span>
          </p>
          <p>
            Invited by:{' '}
            <span className="banner-meta-value">{invitation.invitedByName ?? 'System'}</span>
          </p>
        </div>

        {/* Dynamic server errors display */}
        {state.error && <div className="form-error-block">{state.error}</div>}

        {/* Action form */}
        <form action={formAction}>
          <input type="hidden" name="invitationId" value={invitation.id} />
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto gap-2">
            {isPending && <Loader2 className="spinner" />}
            {isPending ? 'Joining workspace...' : 'Accept invitation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
