'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Loader2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { createNoteAction, type NoteFormState } from '@/app/(dashboard)/notes/actions';
import type { NoteEntityType } from '@/lib/db/queries/notes';

type Props = {
  entityType: NoteEntityType;
  entityId: number;
};

const initialState: NoteFormState = {};

export function AddNoteForm({ entityType, entityId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createNoteAction, initialState);

  // Clearing the form after successfully saving the note
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="notes-form">
      <div className="form-field">
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />

        <Label htmlFor="content" className="sr-only">
          Note Content
        </Label>

        <Textarea
          id="content"
          name="content"
          rows={3}
          placeholder="Add a note or feedback for this record..."
          className="resize-none"
          disabled={isPending}
        />

        {state.fieldErrors?.content?.[0] && (
          <p className="form-error">{state.fieldErrors.content[0]}</p>
        )}

        {state.error && <p className="form-error-block">{state.error}</p>}
      </div>

      <div className="notes-form-footer">
        <Button type="submit" size="sm" disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="spinner" /> : <Plus className="mr-1.5 icon-md" />}
          Add note
        </Button>
      </div>
    </form>
  );
}
