'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { deleteNoteAction } from '@/app/(dashboard)/notes/actions';
import type { NoteEntityType } from '@/lib/db/queries/notes';

type Props = {
  id: number;
  entityType: NoteEntityType;
  entityId: number;
};

export function DeleteNoteButton({ id, entityType, entityId }: Props) {
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    startTransition(async () => {
      const result = await deleteNoteAction(id, entityType, entityId);

      if (result?.error) {
        // If the server returned an access error or an "record not found" error:
        alert(result.error);
      }
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label="Delete note"
      className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
      onClick={handleDelete}
    >
      <Trash2 className="icon-sm" />
    </Button>
  );
}
