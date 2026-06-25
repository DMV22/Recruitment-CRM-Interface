'use client';

import { useEffect, useState, useTransition } from 'react';
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
import { deleteVacancyAction } from '@/app/(dashboard)/vacancies/actions';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancy: {
    id: number;
    title: string;
  } | null;
};

export function DeleteVacancyDialog({ open, onOpenChange, vacancy }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

  async function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    
    if (!vacancy) return;

    setError(null);

    startTransition(async () => {
      const result = await deleteVacancyAction(vacancy.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive vacancy?</AlertDialogTitle>
          <AlertDialogDescription>
            Vacancy <span className="font-medium">{vacancy?.title}</span> will be moved to
            status <span className="font-medium">closed</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Archiving...' : 'Archive'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}