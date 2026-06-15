export default function TripSummary({ summary }) {
  return (
    <div className="card">
      <h2>Trip Summary</h2>
      <div className="summary-grid">
        <div className="summary-stat">
          <div className="value">{summary.total_miles}</div>
          <div className="label">Total Miles</div>
        </div>
        <div className="summary-stat">
          <div className="value">{summary.total_driving_hours}h</div>
          <div className="label">Driving Hours</div>
        </div>
        <div className="summary-stat">
          <div className="value">{summary.estimated_cycle_used_hours}h</div>
          <div className="label">Est. Cycle Used</div>
        </div>
        <div className="summary-stat">
          <div className="value">{summary.cycle_limit_hours}h</div>
          <div className="label">70hr/8-Day Limit</div>
        </div>
      </div>
      <ul className="stops-list" style={{ marginTop: '1rem' }}>
        {summary.legs.map((leg, i) => (
          <li key={i}>
            <strong>Leg {i + 1}:</strong> {leg.from} → {leg.to} — {leg.distance_miles} mi (
            {leg.duration_hours}h drive)
          </li>
        ))}
      </ul>
    </div>
  )
}
