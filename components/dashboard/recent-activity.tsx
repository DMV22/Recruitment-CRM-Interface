import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Briefcase, Building2, GitPullRequest, Users } from 'lucide-react';

import { formatRelativeTime } from '@/lib/format-time';

type ActivityItem = {
  id: number;
  action: string;
  entityType: string | null;
  userName: string | null;
  timestamp: Date;
};

const ENTITY_ICON: Record<string, React.ElementType> = {
  client: Building2,
  vacancy: Briefcase,
  candidate: Users,
  submission: GitPullRequest,
};

function formatAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (char) => char.toUpperCase());
}

type Props = {
  data: ActivityItem[];
};

export function RecentActivity({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card className="panel">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-sm">No recent activity to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="panel">
      <CardHeader className="panel-header">
        <CardTitle className="panel-title">Recent Activity</CardTitle>
        <p className="panel-subtitle">Latest team actions</p>
      </CardHeader>

      <CardContent className="dashboard-list-content">
        <ul className="dashboard-list">
          {data.map((item) => {
            const Icon = (item.entityType && ENTITY_ICON[item.entityType]) || Activity;

            return (
              <li key={item.id} className="activity-item">
                <div className="activity-icon-wrap">
                  <Icon className="activity-icon" />
                </div>

                <div className="activity-body">
                  <p className="activity-text">
                    <span className="activity-user">{item.userName ?? 'System'}</span>{' '}
                    <span className="activity-action">{formatAction(item.action)}</span>
                  </p>

                  <p className="activity-time">{formatRelativeTime(item.timestamp)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
