'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import type { ActionState } from '@/lib/auth/middleware';

import Image from 'next/image';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const isSignIn = mode === 'signin';
  const router = useRouter();

  const [signinState, signinAction, signinPending] = useActionState<ActionState, FormData>(signIn, {
    error: '',
  });

  const [signupState, signupAction, signupPending] = useActionState<ActionState, FormData>(signUp, {
    error: '',
  });

  const state = isSignIn ? signinState : signupState;
  const action = isSignIn ? signinAction : signupAction;
  const isPending = isSignIn ? signinPending : signupPending;

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard');
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo + title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Image src="/crm-software.png" alt="CRM Logo" width={40} height={40} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isSignIn ? 'Sign in to your account' : 'Create your account'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignIn
              ? 'Recruitment CRM — manage your hiring pipeline'
              : 'Get started with Recruitment CRM'}
          </p>
        </div>

        {/* Form */}
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              required
              placeholder={isSignIn ? '••••••••' : 'Min. 8 characters'}
              minLength={8}
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignIn ? 'Signing in...' : 'Creating account...'}
              </>
            ) : isSignIn ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        {/* Toggle link */}
        <p className="text-center text-sm text-muted-foreground">
          {isSignIn ? (
            <>
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/sign-in" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
