'use client';

import { useTransition } from 'react';
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
import { Loader2 } from 'lucide-react';
import { deleteClientAction } from '@/app/(dashboard)/clients/actions';

type Props = {
  open: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
};

export function DeleteClientDialog({ open, onClose, clientId, clientName }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteClientAction(clientId);
      onClose();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete client?</AlertDialogTitle>
          <AlertDialogDescription className="text-hint block">
            <span className="font-bold text-foreground">{clientName}</span> will be permanently deleted along
            with all associated data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="btn-danger"
          >
            {isPending && <Loader2 className="spinner" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}