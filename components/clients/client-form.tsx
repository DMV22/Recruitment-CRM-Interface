'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { createClientAction, updateClientAction } from '@/app/(dashboard)/clients/actions';
import type { ClientFormState } from '@/app/(dashboard)/clients/actions';

import type { Client } from '@/lib/db/schema';

import { Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  client?: Client | null; // if present - edit mode; if not - create mode
};

const initialState: ClientFormState = {};

export function ClientForm({ open, onClose, client }: Props) {
  const isEdit = !!client;

  const action = isEdit ? updateClientAction.bind(null, client.id) : createClientAction;

  const [state, formAction, isPending] = useActionState<ClientFormState, FormData>(
    action,
    initialState
  );

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="form-wrapper">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Client' : 'New Client'}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="form-body">
          {/* Name */}
          <div className="form-field">
            <Label htmlFor="name">
              Company name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={client?.name ?? ''}
              placeholder="Acme Corp"
              aria-invalid={!!state.fieldErrors?.name}
            />
            {state.fieldErrors?.name && (
              <p className="form-error">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Industry */}
          <div className="form-field">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={client?.industry ?? ''}
              placeholder="Fintech, Healthcare..."
            />
          </div>

          {/* Website */}
          <div className="form-field">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={client?.website ?? ''}
              placeholder="https://example.com"
              aria-invalid={!!state.fieldErrors?.website}
            />
            {state.fieldErrors?.website && (
              <p className="form-error">{state.fieldErrors.website[0]}</p>
            )}
          </div>

          {/* Status */}
          <div className="form-field">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={client?.status ?? 'prospect'}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="form-field">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={client?.notes ?? ''}
              placeholder="Internal notes about this client..."
              rows={4}
            />
          </div>

          {/* Error */}
          {state.error && (
            <p className="form-error-block">{state.error}</p>
          )}

          {/* Actions */}
          <div className="form-footer">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="spinner" />}
              {isEdit ? 'Save changes' : 'Create client'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}