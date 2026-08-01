import { Card, CardContent, CardHeader } from '@/components/ui/card';

function SettingsCardSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-9 w-full rounded-md bg-muted" />
            </div>
          ))}
          <div className="h-9 w-32 rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-6 w-28 rounded bg-muted" />
      <div className="h-4 w-80 max-w-full rounded bg-muted" />
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="page-content animate-pulse" aria-busy="true">
      <span className="sr-only">Loading settings...</span>

      <div className="page-header" aria-hidden="true">
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-muted" />
      </div>

      <div className="flex flex-col gap-8" aria-hidden="true">
        <section className="flex flex-col gap-4">
          <SectionHeadingSkeleton />
          <SettingsCardSkeleton />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeadingSkeleton />
          <div className="flex flex-col gap-6">
            <SettingsCardSkeleton rows={3} />
            <SettingsCardSkeleton rows={1} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeadingSkeleton />
          <Card className="panel">
            <CardHeader>
              <div className="h-5 w-24 rounded bg-muted" />
              <div className="h-4 w-64 max-w-full rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div className="h-9 w-44 rounded-md bg-muted" />
                <div className="h-9 w-44 rounded-md bg-muted" />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
