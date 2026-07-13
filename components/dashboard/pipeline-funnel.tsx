'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PipelineStage } from '@/lib/db/schema';
import { PIPELINE_STAGE_LABELS } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

type PipelineStageData = {
  stage: PipelineStage;
  count: number;
};

const STAGE_BAR_CLASS: Record<PipelineStage, string> = {
  sourced: 'pipeline-bar-neutral',
  screening: 'pipeline-bar-blue',
  hr_interview: 'pipeline-bar-blue',
  tech_interview: 'pipeline-bar-warning',
  client_interview: 'pipeline-bar-warning',
  offer: 'pipeline-bar-success',
  hired: 'pipeline-bar-success',
  rejected: 'pipeline-bar-error',
};

type Props = {
  data: PipelineStageData[];
};

export function PipelineFunnel({ data }: Props) {
  const activeStages = data.filter((item) => item.stage !== 'rejected');
  const max = Math.max(...activeStages.map((item) => item.count), 1);

  return (
    <Card className="dashboard-panel dashboard-panel-wide">
      <CardHeader className="dashboard-panel-header">
        <CardTitle className="dashboard-panel-title">Pipeline Funnel</CardTitle>
        <p className="dashboard-panel-subtitle">Submissions by current stage</p>
      </CardHeader>

      <CardContent className="dashboard-pipeline">
        {data.map((item) => {
          const width = Math.min(Math.max((item.count / max) * 100, item.count > 0 ? 2 : 0), 100);

          return (
            <div key={item.stage} className="dashboard-pipeline-row">
              <span className="dashboard-pipeline-label">{PIPELINE_STAGE_LABELS[item.stage]}</span>
              <div className="dashboard-pipeline-track">
                <div
                  className={cn('dashboard-pipeline-fill', STAGE_BAR_CLASS[item.stage])}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="dashboard-pipeline-count">{item.count}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
