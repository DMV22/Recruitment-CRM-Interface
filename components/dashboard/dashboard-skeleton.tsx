import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function Skel({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skel className="h-6 w-48" />
        <Skel className="h-4 w-72" />
      </div>

      {/* KPI cards - 6 columns */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skel className="h-4 w-24" />
              <Skel className="h-8 w-8 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skel className="h-7 w-14 mb-2" />
              <Skel className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline funnel + Vacancy status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <Skel className="h-5 w-32 mb-1" />
            <Skel className="h-3 w-40" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skel className="h-3 w-28 shrink-0" />
                <Skel className="h-6 flex-1" />
                <Skel className="h-3 w-6 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vacancy status */}
        <Card>
          <CardHeader>
            <Skel className="h-5 w-36 mb-1" />
            <Skel className="h-3 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skel className="h-3 w-full rounded-full" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skel className="h-2.5 w-2.5 rounded-full" />
                    <Skel className="h-4 w-16" />
                  </div>
                  <Skel className="h-4 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent submissions + activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <Skel className="h-5 w-36" />
              <Skel className="h-3 w-40" />
            </div>
            <Skel className="h-4 w-14" />
          </CardHeader>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-3 border-b last:border-0 border-border"
              >
                <div className="space-y-1.5">
                  <Skel className="h-4 w-28" />
                  <Skel className="h-3 w-44" />
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Skel className="h-5 w-16 rounded-full" />
                  <Skel className="h-3 w-10" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <Skel className="h-5 w-32 mb-1" />
            <Skel className="h-3 w-28" />
          </CardHeader>
          <CardContent className="p-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-6 py-3 border-b last:border-0 border-border"
              >
                <Skel className="h-7 w-7 rounded-full shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <Skel className="h-4 w-48" />
                  <Skel className="h-3 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
