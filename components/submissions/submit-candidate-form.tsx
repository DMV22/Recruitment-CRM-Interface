'use client';

import { useActionState, useRef, useEffect } from 'react';
import { createSubmissionAction } from '@/app/(dashboard)/submissions/actions';

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

const initialState = { success: false, error: undefined, fieldErrors: undefined };

export function SubmitCandidateForm({ vacancyId, candidates, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(createSubmissionAction, initialState);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (state.success) onCloseRef.current();
  }, [state.success]);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">Submit candidate</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {candidates.length === 0 ? (
          <div className="dialog-body">
            <p className="text-muted-foreground py-4 text-center">
              All candidates have already been submitted to this vacancy.
            </p>
            <div className="dialog-footer mt-4 px-0 pb-0">
              <button type="button" className="btn btn-secondary w-full" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="vacancyId" value={vacancyId} />

            <div className="dialog-body">
              <div className="field-group">
                <label htmlFor="candidateId" className="field-label">
                  Candidate <span className="required">*</span>
                </label>
                <select id="candidateId" name="candidateId" className="field-input" required>
                  <option value="">Select candidate...</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                      {c.seniority ? ` — ${c.seniority}` : ''}
                      {c.techStack ? ` (${c.techStack.split(',')[0].trim()})` : ''}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.candidateId && (
                  <p className="field-error">{state.fieldErrors.candidateId[0]}</p>
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
                  placeholder="Optional submission notes..."
                />
                {state.fieldErrors?.notes && (
                  <p className="field-error">{state.fieldErrors.notes[0]}</p>
                )}
              </div>

              {state.error && <p className="field-error-block">{state.error}</p>}
            </div>

            <div className="dialog-footer">
              <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit candidate'}
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
