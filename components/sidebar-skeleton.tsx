// components/sidebar-skeleton.tsx
export function SidebarSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar skeleton */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-background z-30">
        <div className="flex h-full flex-col animate-pulse">
          {/* Logo area */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-4 px-2 space-y-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md">
                <div className="h-4 w-4 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            ))}
          </nav>

          {/* User area */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-7 w-7 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content placeholder */}
      <div className="lg:pl-56 flex flex-col min-h-screen">
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-4 w-72 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}