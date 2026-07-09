'use client';

import { useState, useTransition } from 'react';
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
import { deleteCandidateAction } from '@/app/(dashboard)/candidates/actions';

import { Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: {
    id: number;
    name: string;
  } | null;
};

export function DeleteCandidateDialog({ open, onOpenChange, candidate }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setError(null);
    }
    onOpenChange(isOpen);
  }

  async function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (!candidate) return;

    setError(null);

    startTransition(async () => {
      const result = await deleteCandidateAction(candidate.id);
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
          <AlertDialogTitle>Archive candidate?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-bold text-foreground">{candidate?.name}</span> will be archived
            and hidden from the default candidates list. This action can be reversed later by
            restoring the candidate.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="form-error-block">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleDelete} className="btn-danger">
            {isPending && <Loader2 className="spinner" />}
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
