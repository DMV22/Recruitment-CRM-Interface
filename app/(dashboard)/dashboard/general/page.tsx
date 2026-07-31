import { redirect } from 'next/navigation';

export default function LegacyGeneralSettingsPage() {
  redirect('/settings#general');
}
