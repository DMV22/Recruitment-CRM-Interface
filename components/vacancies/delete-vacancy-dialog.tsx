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

import { Loader2 } from 'lucide-react';

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
            Vacancy <span className="font-bold text-foreground">{vacancy?.title}</span> will be moved to
            status <span className="font-bold text-foreground">closed</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="form-error-block">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={handleDelete}
            className="btn-danger"
          >
            {isPending ?? <Loader2 className="spinner" />}
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}