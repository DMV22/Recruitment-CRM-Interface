'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Mail, Send, Loader2 } from 'lucide-react';

import { inviteMemberAction, type TeamActionState } from '@/app/(dashboard)/team/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialState: TeamActionState = {};

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteMemberAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <Card className="panel">
      <CardHeader className="panel-header">
        <CardTitle className="panel-title">Invite member</CardTitle>
        <CardDescription className="panel-subtitle">
          Send an invitation and assign a CRM role before the user joins the team.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <form ref={formRef} action={formAction} className="team-invite-form">
          {/* Email Field */}
          <div className="form-field">
            <Label htmlFor="email">Email</Label>
            <div className="team-input-wrapper">
              <Input
                name="email"
                type="email"
                placeholder="colleague@company.com"
                disabled={pending}
                required
              />
            </div>
            {state.fieldErrors?.email?.[0] && (
              <p className="form-error">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          {/* CRM Role Field */}
          <div className="form-field">
            <Label htmlFor="crmRole">CRM role</Label>
            <Select name="crmRole" defaultValue="viewer" disabled={pending}>
              <SelectTrigger id="crmRole" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {state.fieldErrors?.crmRole?.[0] && (
              <p className="form-error">{state.fieldErrors.crmRole[0]}</p>
            )}
          </div>

          {/* Global Error Block */}
          {state.error && <div className="form-error-block">{state.error}</div>}

          {/* Footer Actions */}
          <div className="team-form-footer">
            <Button type="submit" disabled={pending} className="gap-1.5">
              {pending ? <Loader2 className="spinner" /> : <Send className="icon-md " />}
              {pending ? 'Sending...' : 'Send invitation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
