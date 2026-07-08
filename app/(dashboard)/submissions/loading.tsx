export default function SubmissionsLoading() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-text" style={{ width: '320px' }} />
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="skeleton skeleton-text" style={{ width: '200px', height: '36px' }} />
          <div className="skeleton skeleton-text" style={{ width: '140px', height: '36px' }} />
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {['Candidate', 'Vacancy', 'Client', 'Stage', 'Submitted by', 'Date', ''].map(
                  (col) => (
                    <th key={col}>{col}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}>
                      <div className="skeleton skeleton-text" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
