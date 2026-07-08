'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { SubmissionStageBadge } from '@/components/submissions/submission-stage-badge';
import { SubmitCandidateForm } from '@/components/submissions/submit-candidate-form';
import { UpdateStageDialog } from '@/components/submissions/update-stage-dialog';
import { hasPermission } from '@/lib/rbac';
import { PIPELINE_STAGES } from '@/lib/db/schema';
import type { User, PipelineStage } from '@/lib/db/schema';
import type { SubmissionRow } from '@/lib/db/queries/submissions';

type CandidateOption = {
  id: number;
  firstName: string;
  lastName: string;
  seniority: string | null;
  techStack: string | null;
};

type Props = {
  vacancyId: number;
  vacancyTitle: string;
  clientName: string;
  submissions: SubmissionRow[];
  availableCandidates: CandidateOption[];
  currentUser: User;
};

export function VacancyPipeline({
  vacancyId,
  vacancyTitle,
  clientName,
  submissions,
  availableCandidates,
  currentUser,
}: Props) {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [stageTarget, setStageTarget] = useState<SubmissionRow | null>(null);

  const canCreate = hasPermission(currentUser, 'submissions.create');
  const canUpdate = hasPermission(currentUser, 'submissions.update');

  const { grouped } = useMemo(() => {
    const groupedData = PIPELINE_STAGES.reduce<Record<PipelineStage, SubmissionRow[]>>(
      (acc, stage) => {
        acc[stage] = submissions.filter((s) => s.currentStage === stage);
        return acc;
      },
      {} as Record<PipelineStage, SubmissionRow[]>
    );

    return { grouped: groupedData };
  }, [submissions]);

  const visibleStages = PIPELINE_STAGES.filter((stage) => grouped[stage].length > 0);

  return (
    <div className="detail-section">
      <div className="detail-section-header">
        <h2 className="detail-section-title">Pipeline</h2>

        {canCreate && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setSubmitOpen(true)}
          >
            + Submit candidate
          </button>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No candidates in pipeline</p>
          <p className="empty-state-desc">Submit a candidate to start tracking progress.</p>
        </div>
      ) : (
        <div className="pipeline-stages">
          {visibleStages.map((stage) => (
            <div
              key={stage}
              className={`pipeline-stage-group ${
                stage === 'rejected' ? 'pipeline-stage-rejected' : ''
              }`}
            >
              <div className="pipeline-stage-header">
                <SubmissionStageBadge stage={stage} />
                <span className="pipeline-stage-count">{grouped[stage].length}</span>
              </div>

              <div className="pipeline-cards">
                {grouped[stage].map((sub) => (
                  <div key={sub.id} className="pipeline-card">
                    <div className="pipeline-card-name">
                      <Link href={`/candidates/${sub.candidate.id}`} className="table-link">
                        {sub.candidate.firstName} {sub.candidate.lastName}
                      </Link>
                    </div>
                    {sub.candidate.seniority && (
                      <span className="pipeline-card-meta">{sub.candidate.seniority}</span>
                    )}
                    {canUpdate && (
                      <button
                        type="button"
                        className="btn-icon pipeline-card-action"
                        onClick={() =>
                          setStageTarget({
                            ...sub,
                            vacancy: {
                              ...sub.vacancy,
                              id: vacancyId,
                              title: vacancyTitle,
                              client: {
                                id: sub.vacancy.client?.id ?? 0,
                                name: clientName,
                              },
                            },
                          })
                        }
                        title="Move stage"
                        aria-label="Move stage"
                      >
                        →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {submitOpen && (
        <SubmitCandidateForm
          vacancyId={vacancyId}
          candidates={availableCandidates}
          onClose={() => setSubmitOpen(false)}
        />
      )}

      {stageTarget && (
        <UpdateStageDialog
          submission={stageTarget}
          currentUser={currentUser}
          onClose={() => setStageTarget(null)}
        />
      )}
    </div>
  );
}
