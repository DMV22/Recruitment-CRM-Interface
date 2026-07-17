import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ActivityLoadingPage() {
  return (
    <div className="page-content animate-pulse">
      {/* Page Header Skeleton */}
      <div className="page-header">
        <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded-md bg-muted mt-2" />
      </div>

      {/* 1. Filters Card Skeleton */}
      <Card className="panel mb-6">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="activity-filters">
            <div className="h-10 w-[180px] animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-[180px] animate-pulse rounded-md bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Timeline Card Skeleton */}
      <Card className="panel">
        <CardHeader className="panel-header">
          <CardTitle className="panel-title">Timeline</CardTitle>
        </CardHeader>

        <CardContent>
          <ul className="timeline">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="timeline-item pt-4 first:pt-0 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted animate-pulse" />
                <div className="timeline-body space-y-2 mt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
