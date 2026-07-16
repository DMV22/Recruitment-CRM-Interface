import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function SubmissionsLoadingPage() {
  return (
    <div className="page-content animate-pulse">
      {/* Header */}
      <div className="page-header">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Toolbar / Card Wrapper */}
      <div className="card space-y-4">
        <div className="table-toolbar">
          <div className="table-toolbar-filters">
            <div className="h-9 w-44 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="ml-auto h-4 w-28 animate-pulse rounded bg-muted" />
        </div>

        {/* Shadcn UI Table Skeleton */}
        <div className="table-wrapper">
          <Table className="data-table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {['Candidate', 'Vacancy', 'Client', 'Stage', 'Submitted by', 'Date', ''].map(
                  (col) => (
                    <TableHead key={col} className="h-10 font-medium">
                      {col}
                    </TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.from({ length: 6 }).map((_, row) => (
                <TableRow key={row} className="hover:bg-transparent">
                  {Array.from({ length: 7 }).map((_, cell) => (
                    <TableCell key={cell} className="p-4">
                      {cell === 6 ? (
                        <div className="ml-auto h-8 w-8 animate-pulse rounded-md bg-muted" />
                      ) : (
                        <div className="h-5 animate-pulse rounded bg-muted" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
