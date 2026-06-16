export default function TripForm({ form, setForm, onSubmit, loading }) {
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="card shadow-sm border-0 max-w-lg mx-auto">
      {/* Header section typical for dispatch/log software */}
      <div className="card-header bg-dark text-white py-3">
        <h5 className="mb-0 fw-bold text-uppercase tracking-wider">
          <i className="bi bi-truck me-2"></i> New Trip Dispatch & Log Planner
        </h5>
      </div>
      
      <div className="card-body p-4 bg-light">
        <form onSubmit={onSubmit}>
          
          {/* Section: Route Information */}
          <div className="mb-4">
            <h6 className="text-secondary text-uppercase fw-semibold border-bottom pb-2 mb-3">
              Route Details
            </h6>
            
            <div className="row g-3">
              <div className="col-md-12">
                <label htmlFor="current_location" className="form-label fw-medium text-muted small">
                  Current Location
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-secondary">📍</span>
                  <input
                    id="current_location"
                    type="text"
                    className="form-control border-start-0 ps-0"
                    value={form.current_location}
                    onChange={update('current_location')}
                    placeholder="e.g. Chicago, IL"
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label htmlFor="pickup_location" className="form-label fw-medium text-muted small">
                  Pickup Location
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-success">🟢</span>
                  <input
                    id="pickup_location"
                    type="text"
                    className="form-control border-start-0 ps-0"
                    value={form.pickup_location}
                    onChange={update('pickup_location')}
                    placeholder="e.g. Indianapolis, IN"
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label htmlFor="dropoff_location" className="form-label fw-medium text-muted small">
                  Dropoff Location
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-danger">🔴</span>
                  <input
                    id="dropoff_location"
                    type="text"
                    className="form-control border-start-0 ps-0"
                    value={form.dropoff_location}
                    onChange={update('dropoff_location')}
                    placeholder="e.g. Nashville, TN"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Driver & Compliance */}
          <div className="mb-4">
            <h6 className="text-secondary text-uppercase fw-semibold border-bottom pb-2 mb-3">
              Driver & HOS Compliance
            </h6>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="driver_name" className="form-label fw-medium text-muted small">
                  Driver Name
                </label>
                <input
                  id="driver_name"
                  type="text"
                  className="form-control"
                  value={form.driver_name}
                  onChange={update('driver_name')}
                  placeholder="Driver name for log sheets"
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="current_cycle_used_hours" className="form-label fw-medium text-muted small">
                  Current Cycle Used (Hrs)
                </label>
                <div className="input-group">
                  <input
                    id="current_cycle_used_hours"
                    type="number"
                    min="0"
                    max="70"
                    step="0.5"
                    className="form-control"
                    value={form.current_cycle_used_hours}
                    onChange={update('current_cycle_used_hours')}
                    required
                  />
                  <span className="input-group-text bg-body text-muted small">/ 70 hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="d-grid gap-2 mt-4 pt-2">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg fw-bold shadow-sm py-2 text-uppercase tracking-wider" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Planning & Verifying Logs…
                </>
              ) : (
                'Plan Trip & Generate Logs'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}