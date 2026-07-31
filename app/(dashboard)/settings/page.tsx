import { notFound, redirect } from 'next/navigation';

import { AccountSettingsSection } from '@/components/settings/account-settings-section';
import {
  ActivitySettingsSection,
  type ActivitySearchParams,
} from '@/components/settings/activity-settings-section';
import { SecuritySettingsSection } from '@/components/settings/security-settings-section';
import { getUser, getUserTeamId } from '@/lib/db/queries';
import { hasPermission } from '@/lib/rbac';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<ActivitySearchParams>;
}) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (!hasPermission(user, 'settings.read')) notFound();

  const canReadActivity = hasPermission(user, 'activity.read');
  const [params, teamId] = await Promise.all([
    searchParams,
    canReadActivity ? getUserTeamId(user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title-lg">Settings</h1>
        <p className="page-subtitle">Manage your account, security, and workspace activity.</p>
      </div>

      <div className="flex flex-col gap-8">
        <AccountSettingsSection name={user.name ?? ''} email={user.email} />
        <SecuritySettingsSection />
        {canReadActivity ? (
          <ActivitySettingsSection teamId={teamId} user={user} searchParams={params} />
        ) : null}
      </div>
    </div>
  );
}

export const metadata = { title: 'Settings | Recruitment CRM' };
