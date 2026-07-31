import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import {
  AlertCircle,
  Archive,
  Briefcase,
  Building2,
  CheckCircle,
  FileCheck2,
  GitCommit,
  Lock,
  LogOut,
  Mail,
  MessageSquareText,
  Settings,
  UserCog,
  UserMinus,
  UserPlus,
  UserSquare2,
  UserX,
  type LucideIcon,
} from 'lucide-react';

import { ActivityFilters } from '@/components/activity/activity-filters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cacheTags } from '@/lib/cache-tags';
import {
  getActivityTimeline,
  getActivityUsers,
  type ActivityEntityType,
} from '@/lib/db/queries/activity';
import { ActivityType, type User } from '@/lib/db/schema';
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
  [ActivityType.CHANGE_USER_ROLE]: UserCog,
  [ActivityType.REVOKE_TEAM_ACCESS]: UserX,
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

export type ActivitySearchParams = {
  entityType?: ActivityEntityType | 'all';
  userId?: string;
  page?: string;
};

async function getActivitySectionData(teamId: number, user: User, params: ActivitySearchParams) {
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

  return { timeline, activityUsers };
}

type ActivitySettingsSectionProps = {
  teamId: number | null;
  user: User;
  searchParams: ActivitySearchParams;
};

export async function ActivitySettingsSection({
  teamId,
  user,
  searchParams,
}: ActivitySettingsSectionProps) {
  if (!teamId) {
    return (
      <section id="activity" aria-labelledby="activity-settings-title" className="scroll-mt-6">
        <div className="mb-4">
          <h2 id="activity-settings-title" className="text-lg font-semibold">
            Activity
          </h2>
          <p className="text-muted-sm">Review your workspace activity history.</p>
        </div>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Workspace activity</CardTitle>
            <CardDescription>Activity becomes available after you join a team.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  const { activityUsers, timeline } = await getActivitySectionData(teamId, user, searchParams);

  return (
    <section id="activity" aria-labelledby="activity-settings-title" className="scroll-mt-6">
      <div className="mb-4">
        <h2 id="activity-settings-title" className="text-lg font-semibold">
          Activity
        </h2>
        <p className="text-muted-sm">Team timeline of CRM operations and notes activity.</p>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="panel">
          <CardHeader className="panel-header">
            <CardTitle className="panel-title">Filters</CardTitle>
            <CardDescription>Filter activity by entity or team member.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFilters
              crmRole={user.crmRole}
              activityUsers={activityUsers}
              anchor="activity"
            />
          </CardContent>
        </Card>

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
                          </span>{' '}
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
                <AlertCircle className="size-10 text-muted-foreground" />
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
      </div>
    </section>
  );
}
