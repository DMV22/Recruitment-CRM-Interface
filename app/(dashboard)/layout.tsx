import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { Sidebar } from '@/components/sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} />

      {/* Main content - offset by sidebar width on desktop */}
      <main className="lg:pl-56 flex flex-col min-h-screen">
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}