import { useState } from 'react'
import { planTrip } from './api'
import TripForm from './components/TripForm'
import TripSummary from './components/TripSummary'
import RouteMap from './components/RouteMap'
import ELDLogSheet from './components/ELDLogSheet'

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
      const data = await planTrip(form);

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
      <header className="app-header">
        <h1>ELD Trip Planner</h1>
        <p>
          Property-carrying driver · 70hr/8-day cycle · Route planning with HOS-compliant ELD logs
        </p>
      </header>

      <div className="container">
        <div className="card">
          <h2>Trip Details</h2>
          <TripForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            loading={loading}
          />
          {error && <div className="error-banner">{error}</div>}
        </div>

        {loading && <div className="loading card">Planning route and generating ELD logs…</div>}

        {result && (
          <>
            <TripSummary summary={result.summary} />
            <div className="card">
              <h2>Route Map</h2>
              <RouteMap
                geometry={result.route.geometry}
                locations={result.locations}
                stops={result.route.stops}
              />
            </div>
            <div className="card">
              <h2>Daily Log Sheets</h2>
              {result.daily_logs.map((log) => (
                <ELDLogSheet key={log.date} log={log} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}