'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';

import { updateAccount } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type AccountSettingsSectionProps = {
  name: string;
  email: string;
};

export function AccountSettingsSection({ name, email }: AccountSettingsSectionProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateAccount, {});

  return (
    <section id="general" aria-labelledby="general-settings-title" className="scroll-mt-6">
      <div className="mb-4">
        <h2 id="general-settings-title" className="text-lg font-semibold">
          General
        </h2>
        <p className="text-muted-sm">Update the account information used across the CRM.</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Keep your profile name and email address up to date.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" action={formAction}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                defaultValue={state.name ?? name}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                defaultValue={email}
                required
              />
            </div>
            {state.error ? (
              <p className="form-error-block" role="alert">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p className="text-sm text-muted-foreground" role="status">
                {state.success}
              </p>
            ) : null}
            <div>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
