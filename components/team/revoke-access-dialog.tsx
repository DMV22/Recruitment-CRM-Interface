'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';

import { revokeAccessAction } from '@/app/(dashboard)/team/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: number;
    name: string | null;
  } | null;
};

export function RevokeAccessDialog({ open, onOpenChange, member }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setError(null);
    }
    onOpenChange(isOpen);
  }

  async function handleRevoke(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (!member) return;

    setError(null);

    startTransition(async () => {
      const result = await revokeAccessAction(member.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke access?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove{' '}
            <span className="font-bold text-foreground">
              {member?.name ?? `User #${member?.id}`}
            </span>{' '}
            from the team. They will lose access to the CRM until invited again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="form-error-block">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleRevoke} className="btn-danger">
            {isPending && <Loader2 className="spinner" />}
            Revoke access
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
