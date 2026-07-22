'use client';

import { useActionState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  createSubmissionAction,
  type SubmissionFormState,
} from '@/app/(dashboard)/submissions/actions';

type CandidateOption = {
  id: number;
  firstName: string;
  lastName: string;
  seniority: string | null;
  techStack: string | null;
};

type Props = {
  vacancyId: number;
  candidates: CandidateOption[];
  onClose: () => void;
};

const initialState: SubmissionFormState = {};

export function SubmitCandidateForm({ vacancyId, candidates, onClose }: Props) {
  const [state, formAction, isPending] = useActionState<SubmissionFormState, FormData>(
    createSubmissionAction,
    initialState
  );

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (state.success) onCloseRef.current();
  }, [state.success]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Candidate</DialogTitle>

          <DialogDescription>Select a candidate to submit to this vacancy.</DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <>
            <p className="py-6 text-center text-sm text-muted-foreground">
              All candidates have already been submitted to this vacancy.
            </p>

            <div className="form-footer">
              <Button type="button" variant="outline" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="vacancyId" value={vacancyId} />

            {/* Candidate */}

            <div className="form-field">
              <Label htmlFor="candidateId">
                Candidate
                <span className="text-destructive">*</span>
              </Label>

              <Select name="candidateId">
                <SelectTrigger id="candidateId">
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>

                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={String(candidate.id)}>
                      {candidate.firstName} {candidate.lastName}
                      {candidate.seniority && ` — ${candidate.seniority}`}
                      {candidate.techStack && ` (${candidate.techStack.split(',')[0].trim()})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {state.fieldErrors?.candidateId && (
                <p className="form-error">{state.fieldErrors.candidateId[0]}</p>
              )}
            </div>

            {/* Notes */}

            <div className="form-field">
              <Label htmlFor="notes">Notes</Label>

              <Textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Optional submission notes..."
              />

              {state.fieldErrors?.notes && (
                <p className="form-error">{state.fieldErrors.notes[0]}</p>
              )}
            </div>

            {state.error && <p className="form-error-block">{state.error}</p>}

            <div className="form-footer">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending && <Loader2 className="spinner" />}
                Submit Candidate
              </Button>

              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
