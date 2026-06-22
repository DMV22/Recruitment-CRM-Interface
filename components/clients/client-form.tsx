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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Client' : 'New Client'}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="mt-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
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
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={client?.industry ?? ''}
              placeholder="Fintech, Healthcare..."
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
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
              <p className="text-xs text-destructive">{state.fieldErrors.website[0]}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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