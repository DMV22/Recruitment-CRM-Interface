import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmissionStageBadge } from '@/components/submissions/submission-stage-badge';

import { formatRelativeTime } from '@/lib/format-time';
import type { PipelineStage } from '@/lib/db/schema';

type RecentSubmission = {
  id: number;
  candidateName: string;
  vacancyTitle: string;
  clientName: string;
  stage: string;
  submittedAt: Date;
};

type Props = {
  data: RecentSubmission[];
};

export function RecentSubmissions({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card className="panel">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-sm">
            No submissions yet. Add your first submission to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="panel">
      <CardHeader className="panel-header panel-header-row">
        <div>
          <CardTitle className="panel-title">Recent Submissions</CardTitle>
          <p className="panel-subtitle">Last 5 candidate submissions</p>
        </div>

        <Link href="/submissions" className="panel-link">
          View all
        </Link>
      </CardHeader>

      <CardContent className="dashboard-list-content">
        <ul className="dashboard-list">
          {data.map((submission) => {
            const stageEnum = submission.stage as PipelineStage;

            return (
              <li key={submission.id} className="dashboard-list-item">
                <div className="dashboard-list-main">
                  <p className="dashboard-list-title">{submission.candidateName}</p>
                  <p className="dashboard-list-subtitle">
                    {submission.vacancyTitle}
                    <span className="dashboard-list-separator">·</span>
                    {submission.clientName}
                  </p>
                </div>

                <div className="dashboard-list-side">
                  <SubmissionStageBadge stage={stageEnum} />
                  <span className="dashboard-list-time">
                    {formatRelativeTime(submission.submittedAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
