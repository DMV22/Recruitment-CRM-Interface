import { notFound, redirect } from 'next/navigation';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  Building2,
  Briefcase,
  UserSquare2,
  FileCheck2,
  Archive,
  GitCommit,
  MessageSquareText,
  type LucideIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityFilters } from '@/components/activity/activity-filters';

import { getUser, getUserTeamId } from '@/lib/db/queries';
import {
  getActivityTimeline,
  getActivityUsers,
  type ActivityEntityType,
} from '@/lib/db/queries/activity';
import { ActivityType, User } from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac';
import { cacheTags } from '@/lib/cache-tags';
import { formatRelativeTime } from '@/lib/format-time';

const iconMap: Partial<Record<ActivityType, LucideIcon>> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,

  // Custom CRM actions
  [ActivityType.CREATE_CLIENT]: Building2,
  [ActivityType.UPDATE_CLIENT]: Building2,
  [ActivityType.ARCHIVE_CLIENT]: Archive,
  [ActivityType.CREATE_VACANCY]: Briefcase,
  [ActivityType.UPDATE_VACANCY]: Briefcase,
  [ActivityType.ARCHIVE_VACANCY]: Archive,
  [ActivityType.CREATE_CANDIDATE]: UserSquare2,
  [ActivityType.UPDATE_CANDIDATE]: UserSquare2,
  [ActivityType.ARCHIVE_CANDIDATE]: Archive,
  [ActivityType.CREATE_SUBMISSION]: FileCheck2,
  [ActivityType.UPDATE_SUBMISSION_STAGE]: GitCommit,
  [ActivityType.CREATE_NOTE]: MessageSquareText,
  [ActivityType.DELETE_NOTE]: Archive,
};

function formatAction(action: ActivityType) {
  switch (action) {
    case ActivityType.CREATE_CLIENT:
      return 'Created a client';
    case ActivityType.UPDATE_CLIENT:
      return 'Updated a client';
    case ActivityType.ARCHIVE_CLIENT:
      return 'Archived a client';
    case ActivityType.CREATE_VACANCY:
      return 'Created a vacancy';
    case ActivityType.UPDATE_VACANCY:
      return 'Updated a vacancy';
    case ActivityType.ARCHIVE_VACANCY:
      return 'Archived a vacancy';
    case ActivityType.CREATE_CANDIDATE:
      return 'Created a candidate';
    case ActivityType.UPDATE_CANDIDATE:
      return 'Updated a candidate';
    case ActivityType.ARCHIVE_CANDIDATE:
      return 'Archived a candidate';
    case ActivityType.CREATE_SUBMISSION:
      return 'Created a submission';
    case ActivityType.UPDATE_SUBMISSION_STAGE:
      return 'Changed a submission stage';
    case ActivityType.CREATE_NOTE:
      return 'Added a note';
    case ActivityType.DELETE_NOTE:
      return 'Deleted a note';
    default:
      return action.replaceAll('_', ' ').toLowerCase();
  }
}

function formatEntity(entityType: string | null) {
  if (!entityType) return 'system';
  return entityType.replaceAll('_', ' ');
}

type SearchParams = {
  entityType?: ActivityEntityType | 'all';
  userId?: string;
  page?: string;
};

async function getActivityPageData(teamId: number, user: User, params: SearchParams) {
  'use cache';

  cacheTag(cacheTags.activity.list(teamId));

  const page = Number(params.page ?? '1');
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  const entityType =
    params.entityType && params.entityType !== 'all' ? params.entityType : undefined;

  const userId = params.userId && params.userId !== 'all' ? Number(params.userId) : undefined;

  const [timeline, activityUsers] = await Promise.all([
    getActivityTimeline(teamId, user, {
      entityType,
      userId,
      page: safePage,
      perPage: 25,
    }),
    user.crmRole === 'admin' ? getActivityUsers(teamId) : Promise.resolve([]),
  ]);

  return {
    timeline,
    activityUsers,
  };
}

async function ActivityContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  if (!hasPermission(user, 'activity.read')) {
    notFound();
  }

  const teamId = await getUserTeamId(user.id);
  if (!teamId) redirect('/sign-in');

  const { activityUsers, timeline } = await getActivityPageData(teamId, user, searchParams);

  return (
    <>
      {/* Filters Section */}
      <Card className="panel">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFilters crmRole={user.crmRole} activityUsers={activityUsers} />
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card className="panel">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Timeline</CardTitle>
        </CardHeader>

        <CardContent>
          {timeline.data.length > 0 ? (
            <ul className="timeline">
              {timeline.data.map((log) => {
                const Icon = iconMap[log.action as ActivityType] ?? Settings;

                return (
                  <li key={log.id} className="timeline-item">
                    <div className="timeline-icon">
                      <Icon className="icon-md" />
                    </div>

                    <div className="timeline-body">
                      <p className="timeline-text">
                        <span className="timeline-user">{log.userName ?? 'System'}</span>{' '}
                        <span className="timeline-action">
                          {formatAction(log.action as ActivityType)}
                        </span>
                        {log.entityType ? (
                          <span className="timeline-entity">
                            {formatEntity(log.entityType)} #{log.entityId}
                          </span>
                        ) : null}
                      </p>

                      <p className="timeline-time">{formatRelativeTime(log.timestamp)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="table-empty-content text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <div>
                <h3 className="timeline-empty-title text-foreground">No activity found</h3>
                <p className="timeline-empty-text">
                  No operational records match the selected filter parameters.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title-lg">Activity Log</h1>
        <p className="page-subtitle">Team timeline of CRM operations and notes activity.</p>
      </div>

      <ActivityContent searchParams={params} />
    </div>
  );
}

export const metadata = { title: 'Activity Log | Recruitment CRM' };
