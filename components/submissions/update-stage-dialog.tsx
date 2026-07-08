'use client';

import { useActionState, useRef, useEffect, useState, useMemo } from 'react';
import { updateSubmissionStageAction } from '@/app/(dashboard)/submissions/actions';
import { PIPELINE_STAGE_LABELS } from '@/lib/db/schema';
import type { User } from '@/lib/db/schema';
import type { SubmissionRow } from '@/lib/db/queries/submissions';
import {
  ALLOWED_STAGE_TRANSITIONS,
  HIRING_MANAGER_ALLOWED_TRANSITIONS,
} from '@/lib/constants/submissions';
import { SubmissionStageBadge } from './submission-stage-badge';

type Props = {
  submission: SubmissionRow;
  currentUser: User;
  onClose: () => void;
};

const initialState = { success: false, error: undefined, fieldErrors: undefined };

export function UpdateStageDialog({ submission, currentUser, onClose }: Props) {
  const boundAction = updateSubmissionStageAction.bind(null, submission.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

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
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">Move pipeline stage</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-desc">
            <strong>
              {submission.candidate.firstName} {submission.candidate.lastName}
            </strong>
            {' — '}
            {submission.vacancy.title}
          </p>
          <p className="dialog-desc-sub">
            Current stage: <SubmissionStageBadge stage={submission.currentStage} />
          </p>
        </div>

        {allowedStages.length === 0 ? (
          <div className="dialog-body">
            <p className="text-muted">No further stage transitions available.</p>
          </div>
        ) : (
          <form action={formAction}>
            <div className="dialog-body">
              <div className="field-group">
                <label htmlFor="stage" className="field-label">
                  Move to stage <span className="required">*</span>
                </label>
                <select
                  id="stage"
                  name="stage"
                  className="field-input"
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  required
                >
                  {allowedStages.map((s) => (
                    <option key={s} value={s}>
                      {PIPELINE_STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="rejectionReason" className="field-label">
                  Rejection reason{' '}
                  {selectedStage === 'rejected' && <span className="required">*</span>}
                </label>
                <input
                  id="rejectionReason"
                  name="rejectionReason"
                  className="field-input"
                  placeholder={
                    selectedStage === 'rejected' ? 'Specify reason (Required)' : 'Optional'
                  }
                />
                {state.fieldErrors?.rejectionReason && (
                  <p className="field-error">{state.fieldErrors.rejectionReason[0]}</p>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="notes" className="field-label">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className="field-input field-textarea"
                  rows={3}
                  placeholder="Optional notes about this stage change..."
                />
                {state.fieldErrors?.notes && (
                  <p className="field-error">{state.fieldErrors.notes[0]}</p>
                )}
              </div>

              {state.error && <p className="field-error">{state.error}</p>}
            </div>

            <div className="dialog-footer">
              <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? 'Saving...' : 'Move stage'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
