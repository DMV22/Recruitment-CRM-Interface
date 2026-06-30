export default function Loading() {
  return (
    <div className="page-content animate-pulse">
      <div className="page-header">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="h-4 w-52 rounded bg-muted" />
      </div>
      <div className="toolbar">
        <div className="h-9 w-64 rounded-md bg-muted" />
        <div className="h-9 w-36 rounded-md bg-muted" />
      </div>
      <div className="table-wrapper">
        <div className="h-10 bg-muted/50" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-row">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
