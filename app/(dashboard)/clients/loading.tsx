export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="h-4 w-52 rounded bg-muted" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-64 rounded-md bg-muted" />
        <div className="h-9 w-36 rounded-md bg-muted" />
      </div>
      <div className="rounded-md border border-border">
        <div className="h-10 bg-muted/50" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 border-t border-border px-4 flex items-center gap-4">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}