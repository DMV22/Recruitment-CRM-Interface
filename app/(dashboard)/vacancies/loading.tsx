export default function VacanciesLoadingPage() {
  return (
    <div className="page-content animate-pulse">
      <div className="page-header">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="toolbar">
        <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        <div className="ml-auto h-9 w-32 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="table-wrapper">
        <div className="skeleton-header-row">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" />
          ))}
        </div>

        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="skeleton-body-row">
              {Array.from({ length: 7 }).map((_, cell) => (
                <div
                  key={cell}
                  className="h-5 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}