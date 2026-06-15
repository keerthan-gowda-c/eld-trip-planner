import { useState } from 'react'
import { planTrip } from './api'
import TripForm from './components/TripForm'
import TripSummary from './components/TripSummary'
import RouteMap from './components/RouteMap'
import ELDLogSheet from './components/ELDLogSheet'
import './index.css'

const DEFAULT_FORM = {
  current_location: 'Chicago, IL',
  pickup_location: 'Indianapolis, IN',
  dropoff_location: 'Nashville, TN',
  current_cycle_used_hours: 10,
  driver_name: 'John Driver',
}

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await planTrip(form)
      // Add pickup and dropoff locations to every ELD log
      const updatedData = {
        ...data,
        daily_logs: data.daily_logs.map((log) => ({
          ...log,
          from: form.pickup_location,
          to: form.dropoff_location,
        })),
      }

      setResult(updatedData)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="hero-section">
  <div className="container">
    <div className="row align-items-center">

      <div className="col-lg-8">
        <div className="d-flex align-items-center mb-3">
          <div className="hero-icon me-3">
            <i className="bi bi-truck"></i>
          </div>

          <div>
            <h1 className="hero-title mb-1">
              ELD Trip Planner
            </h1>

            <div className="hero-subtitle">
              FMCSA Compliant Route & Driver Log Management
            </div>
          </div>
        </div>

        <p className="hero-description">
          Plan routes, monitor Hours of Service (HOS), generate
          compliant ELD log sheets, track mileage, and optimize
          long-haul trucking operations.
        </p>

        <div className="hero-badges">
          <span className="badge-item">
            <i className="bi bi-shield-check"></i>
            FMCSA Compliant
          </span>

          <span className="badge-item">
            <i className="bi bi-clock-history"></i>
            70 Hr / 8 Day Cycle
          </span>

          <span className="badge-item">
            <i className="bi bi-file-earmark-text"></i>
            ELD Logs
          </span>
        </div>
      </div>

      <div className="col-lg-4 mt-4 mt-lg-0">

        <div className="compliance-card">

          <div className="card-label">
            Driver Status
          </div>

          <div className="card-value">
            Active
          </div>

          <hr />

          <div className="status-row">
            <i className="bi bi-fuel-pump"></i>
            Mileage Tracking
          </div>

          <div className="status-row">
            <i className="bi bi-map"></i>
            Route Planning
          </div>

          <div className="status-row">
            <i className="bi bi-journal-check"></i>
            Daily Logs
          </div>

        </div>

      </div>

    </div>
  </div>
</header>

      <div className="container py-4">

  {/* Trip Details */}
  <div className="card shadow-sm border-0 mb-4">
    <div className="card-header bg-primary text-white d-flex align-items-center">
      <i className="bi bi-clipboard-data me-2"></i>
      <h4 className="mb-0">Trip Details</h4>
    </div>

    <div className="card-body">
      <TripForm
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {error && (
        <div className="alert alert-danger mt-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
    </div>
  </div>

  {/* Loading */}
  {loading && (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body text-center py-5">

        <div
          className="spinner-border text-primary mb-3"
          role="status"
        />

        <h5>Generating Trip Plan</h5>

        <p className="text-muted mb-0">
          Calculating route, HOS availability, mileage and ELD logs...
        </p>

      </div>
    </div>
  )}

  {/* Results */}
  {result && (
    <>

      {/* Summary */}
      <TripSummary summary={result.summary} />

      {/* Route Map */}
      <div className="card shadow-sm border-0 mb-4">

        <div className="card-header bg-dark text-white d-flex align-items-center">
          <i className="bi bi-map me-2"></i>
          <h4 className="mb-0">Route Map</h4>
        </div>

        <div className="card-body">
          <RouteMap
            geometry={result.route.geometry}
            locations={result.locations}
            stops={result.route.stops}
          />
        </div>

      </div>

      {/* ELD Logs */}
      <div className="card shadow-sm border-0">

        <div className="card-header bg-success text-white d-flex align-items-center">
          <i className="bi bi-journal-check me-2"></i>
          <h4 className="mb-0">Daily ELD Log Sheets</h4>
        </div>

        <div className="card-body">

          <div className="alert alert-light border mb-4">
            <i className="bi bi-info-circle me-2"></i>
            FMCSA compliant daily driver logs generated from route and HOS calculations.
          </div>

          {result.daily_logs.map((log) => (
            <div
              key={log.date}
              className="mb-5 pb-4 border-bottom"
            >
              <div className="d-flex justify-content-between align-items-center mb-3">

                <h5 className="mb-0">
                  <i className="bi bi-calendar-event me-2"></i>
                  Log Date: {log.date}
                </h5>

                <span className="badge bg-success">
                  Generated
                </span>

              </div>

              <ELDLogSheet log={log} />
            </div>
          ))}

        </div>

      </div>

    </>
  )}

</div>
    </>
  )
}
