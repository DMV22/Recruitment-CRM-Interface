'use client';

import { useActionState, useRef, useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { PIPELINE_STAGE_LABELS } from '@/lib/db/schema';
import type { User } from '@/lib/db/schema';
import type { SubmissionRow } from '@/lib/db/queries/submissions';
import {
  ALLOWED_STAGE_TRANSITIONS,
  HIRING_MANAGER_ALLOWED_TRANSITIONS,
} from '@/lib/constants/submissions';
import { SubmissionStageBadge } from '@/components/submissions/submission-stage-badge';

import {
  updateSubmissionStageAction,
  type SubmissionFormState,
} from '@/app/(dashboard)/submissions/actions';

type Props = {
  submission: SubmissionRow;
  currentUser: User;
  onClose: () => void;
};

const initialState: SubmissionFormState = {};

export function UpdateStageDialog({ submission, currentUser, onClose }: Props) {
  const boundAction = updateSubmissionStageAction.bind(null, submission.id);
  const [state, formAction, isPending] = useActionState<SubmissionFormState, FormData>(
    boundAction,
    initialState
  );
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (state.success) onCloseRef.current();
  }, [state.success]);

  const isHiringManager = currentUser.crmRole === 'hiring_manager';
  const allowedStages = useMemo(() => {
    return isHiringManager
      ? (HIRING_MANAGER_ALLOWED_TRANSITIONS[submission.currentStage] ?? [])
      : (ALLOWED_STAGE_TRANSITIONS[submission.currentStage] ?? []);
  }, [isHiringManager, submission.currentStage]);

  // Manage the stage selection state to dynamically indicate to the user whether a field is required
  const [selectedStage, setSelectedStage] = useState<string>(() => {
    return allowedStages.length > 0 ? allowedStages[0] : '';
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move pipeline stage</DialogTitle>
          <DialogDescription className="mt-2">
            <strong>
              {submission.candidate.firstName} {submission.candidate.lastName}
            </strong>
            {' — '}
            {submission.vacancy.title}
          </DialogDescription>
          <div className="text-sm text-muted-foreground">
            Current stage <SubmissionStageBadge stage={submission.currentStage} />
          </div>
        </DialogHeader>

        {allowedStages.length === 0 ? (
          <>
            <div className="py-4 text-sm text-muted-foreground">
              No further stage transitions available.
            </div>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </>
        ) : (
          <form action={formAction} className="space-y-5">
            <div className="form-field">
              <Label htmlFor="stage">
                Move to stage
                <span className="text-destructive">*</span>
              </Label>
              <Select name="stage" defaultValue={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {PIPELINE_STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="form-field">
              <Label htmlFor="rejectionReason">
                Rejection reason{' '}
                {selectedStage === 'rejected' && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="rejectionReason"
                name="rejectionReason"
                placeholder={
                  selectedStage === 'rejected' ? 'Specify reason (Required)' : 'Optional'
                }
              />
              {state.fieldErrors?.rejectionReason && (
                <p className="form-error">{state.fieldErrors.rejectionReason[0]}</p>
              )}
            </div>

            <div className="form-field">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={4} placeholder="Optional notes..." />
              {state.fieldErrors?.notes && (
                <p className="form-error">{state.fieldErrors.notes[0]}</p>
              )}
            </div>

            {state.error && <p className="form-error-block">{state.error}</p>}

            <div className="form-footer">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending && <Loader2 className="spinner" />}
                Move stage
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
