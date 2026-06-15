export default function TripSummary({ summary }) {
  return (
    <>
      {/* KPI Cards */}
      <div className="row g-3 mb-4">

        <div className="col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted text-uppercase">
                Total Miles
              </small>
              <h2 className="fw-bold mb-0">
                <i className="bi bi-truck me-2 text-primary"></i>
                {summary.total_miles}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted text-uppercase">
                Driving Hours
              </small>
              <h2 className="fw-bold mb-0">
                {summary.total_driving_hours}h
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted text-uppercase">
                Cycle Used
              </small>
              <h2 className="fw-bold mb-0">
                {summary.estimated_cycle_used_hours}h
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted text-uppercase">
                Cycle Limit
              </small>
              <h2 className="fw-bold mb-0">
                {summary.cycle_limit_hours}h
              </h2>
            </div>
          </div>
        </div>

      </div>

      {/* Route Breakdown */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0 fw-semibold">
            Route Breakdown
          </h5>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Leg</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Miles</th>
                  <th>Drive Time</th>
                </tr>
              </thead>

              <tbody>
                {summary.legs.map((leg, index) => (
                  <tr key={index}>
                    <td>
                      <span className="badge bg-primary">
                        {index + 1}
                      </span>
                    </td>

                    <td>{leg.from}</td>

                    <td>{leg.to}</td>

                    <td>
                      {leg.distance_miles.toLocaleString()} mi
                    </td>

                    <td>
                      {leg.duration_hours} h
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        </div>
      </div>
    </>
  )
}