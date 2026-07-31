'use client';

import { useActionState } from 'react';
import { Loader2, Lock, Trash2 } from 'lucide-react';

import { deleteAccount, updatePassword } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
};

export function SecuritySettingsSection() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});
  const [deleteState, deleteAction, isDeletePending] = useActionState<DeleteState, FormData>(
    deleteAccount,
    {}
  );

  return (
    <section id="security" aria-labelledby="security-settings-title" className="scroll-mt-6">
      <div className="mb-4">
        <h2 id="security-settings-title" className="text-lg font-semibold">
          Security
        </h2>
        <p className="text-muted-sm">Manage your password and account access.</p>
      </div>

      <div className="flex max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Choose a strong password that you do not use elsewhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" action={passwordAction}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={passwordState.currentPassword}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={passwordState.newPassword}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={passwordState.confirmPassword}
                />
              </div>
              {passwordState.error ? (
                <p className="form-error-block" role="alert">
                  {passwordState.error}
                </p>
              ) : null}
              {passwordState.success ? (
                <p className="text-sm text-muted-foreground" role="status">
                  {passwordState.success}
                </p>
              ) : null}
              <div>
                <Button type="submit" disabled={isPasswordPending}>
                  {isPasswordPending ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Lock data-icon="inline-start" />
                  )}
                  {isPasswordPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete Account</CardTitle>
            <CardDescription>
              Permanently disable your account and remove your team membership. This action cannot
              be reversed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={deleteAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="delete-password">Confirm Password</Label>
                <Input
                  id="delete-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={deleteState.password}
                />
              </div>
              {deleteState.error ? (
                <p className="form-error-block" role="alert">
                  {deleteState.error}
                </p>
              ) : null}
              <div>
                <Button type="submit" variant="destructive" disabled={isDeletePending}>
                  {isDeletePending ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Trash2 data-icon="inline-start" />
                  )}
                  {isDeletePending ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
