import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { Sidebar } from '@/components/sidebar';
import { SidebarSkeleton } from '@/components/sidebar-skeleton';

// A separate async Server Component - all dynamic access is handled here
async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} />
      <main className="lg:pl-56 flex flex-col min-h-screen">
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// The layout itself is static - Suspense unblocks the render
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}