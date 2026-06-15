import { useEffect, useRef } from 'react'
import '../index.css'

const ROW_LABELS = ['1. Off Duty', '2. Sleeper\nBerth', '3. Driving', '4. On Duty\n(not driving)']
const HOURS = Array.from({ length: 25 }, (_, i) => i)

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return {
    month: d.toLocaleString('en-US', { month: '2-digit' }),
    day: d.toLocaleString('en-US', { day: '2-digit' }),
    year: d.getFullYear(),
  }
}

function formatHourLabel(h) {
  if (h === 0) return 'Mid-\nnight'
  if (h === 12) return 'Noon'
  if (h === 24) return 'Mid-\nnight'
  return h < 12 ? `${h}` : `${h - 12}`
}

export default function ELDLogSheet({ log }) {
  const canvasRef = useRef(null)
  const { month, day, year } = formatDate(log.date)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = 900
    const labelW = 72
    const totalColW = 38
    const gridW = W - labelW - totalColW
    const rowH = 48
    const numRows = 4
    const H = rowH * numRows + 56
    const cellW = gridW / 24

    canvas.width = W
    canvas.height = H
    canvas.style.width = '100%'
    canvas.style.height = 'auto'

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // Header row with hour labels
    const headerH = 56
    ctx.fillStyle = '#222'
    ctx.font = 'bold 9px Arial, sans-serif'
    ctx.textAlign = 'center'

    // Draw "Mid-night" at start
    ctx.fillText('Mid-', labelW + 0, 14)
    ctx.fillText('night', labelW + 0, 24)

    for (let h = 1; h <= 23; h++) {
      const x = labelW + h * cellW
      const label = h === 12 ? 'Noon' : h < 12 ? `${h}` : `${h - 12}`
      ctx.fillText(label, x, 20)
    }
    // End midnight
    ctx.fillText('Mid-', labelW + 24 * cellW, 14)
    ctx.fillText('night', labelW + 24 * cellW, 24)

    // "Total Hours" header
    ctx.font = 'bold 8px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Total', W - totalColW + totalColW / 2, 14)
    ctx.fillText('Hours', W - totalColW + totalColW / 2, 24)

    // AM/PM labels
    ctx.font = '7px Arial, sans-serif'
    ctx.fillStyle = '#141414'
    // Small tick marks at every 15 min
    for (let h = 0; h <= 24; h++) {
      const x = labelW + h * cellW
      // Major tick
      ctx.beginPath()
      ctx.strokeStyle = '#020202'
      ctx.lineWidth = 1
      ctx.moveTo(x, headerH - 12)
      ctx.lineTo(x, headerH)
      ctx.stroke()
      // Minor ticks at 15, 30, 45 min
      if (h < 24) {
        for (let m = 1; m <= 3; m++) {
          const mx = x + (m / 4) * cellW
          const tickH = m === 2 ? 8 : 5
          ctx.beginPath()
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 0.5
          ctx.moveTo(mx, headerH - tickH)
          ctx.lineTo(mx, headerH)
          ctx.stroke()
        }
      }
    }

    // Outer border for grid
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, headerH, W, rowH * numRows)

    // Draw rows
    for (let row = 0; row < numRows; row++) {
      const y = headerH + row * rowH

      // Row label area
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(0, y, labelW, rowH)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1
      ctx.strokeRect(0, y, labelW, rowH)

      // Row label text
      ctx.fillStyle = '#111'
      ctx.font = 'bold 9px Arial, sans-serif'
      ctx.textAlign = 'left'
      const lines = ROW_LABELS[row].split('\n')
      lines.forEach((line, li) => {
        const ty = y + rowH / 2 - (lines.length - 1) * 6 + li * 12
        ctx.fillText(line, 4, ty)
      })

      // Grid area background
      ctx.fillStyle = row % 2 === 0 ? '#fafafa' : '#f2f2f2'
      ctx.fillRect(labelW, y, gridW, rowH)

      // Horizontal lines within row (subdivide into quarters for ruler look)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 0.5
      // midline
      ctx.beginPath()
      ctx.moveTo(labelW, y + rowH / 2)
      ctx.lineTo(labelW + gridW, y + rowH / 2)
      ctx.stroke()

      // Vertical hour lines
      for (let h = 0; h <= 24; h++) {
        const x = labelW + h * cellW
        ctx.beginPath()
        ctx.strokeStyle = h % 6 === 0 ? '#484848' : h % 3 === 0 ? '#484848' : '#484848'
        ctx.lineWidth = h % 6 === 0 ? 1 : 0.5
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + rowH)
        ctx.stroke()

        // Quarter-hour ticks inside row
        if (h < 24) {
          for (let m = 1; m <= 3; m++) {
            const mx = x + (m / 4) * cellW
            ctx.beginPath()
            ctx.strokeStyle = '#838383'
            ctx.lineWidth = 0.5
            ctx.moveTo(mx, y)
            ctx.lineTo(mx, y + rowH)
            ctx.stroke()
          }
        }
      }

      // Row border
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.strokeRect(labelW, y, gridW, rowH)

      // Total hours cell
      ctx.fillStyle = '#fff'
      ctx.fillRect(W - totalColW, y, totalColW, rowH)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.strokeRect(W - totalColW, y, totalColW, rowH)
    }

    // Draw segments
    const rowTotals = [0, 0, 0, 0]
    log.segments.forEach((seg) => {
      const row = seg.row
      const y = headerH + row * rowH
      const startX = labelW + (seg.start_minute / 1440) * gridW
      const endX = labelW + (seg.end_minute / 1440) * gridW

      // Filled dark bar (like real paper log — solid black line)
      ctx.fillStyle = '#3e3e3e'
      ctx.fillRect(startX, y + rowH * 0.48, endX - startX, rowH * 0.05)

      // Vertical drop lines at start and end
      ctx.strokeStyle = '#383737'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(startX, y + 2)
      ctx.lineTo(startX, y + rowH - 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(endX, y + 2)
      ctx.lineTo(endX, y + rowH - 2)
      ctx.stroke()

      rowTotals[row] += seg.end_minute - seg.start_minute
    })

    // Fill total hours
    ctx.fillStyle = '#111'
    ctx.font = 'bold 11px Arial, sans-serif'
    ctx.textAlign = 'center'
    rowTotals.forEach((mins, row) => {
      const hrs = (mins / 60).toFixed(1)
      const y = headerH + row * rowH + rowH / 2 + 4
      ctx.fillText(hrs, W - totalColW + totalColW / 2, y)
    })

  }, [log])

  const { off_duty, sleeper, driving, on_duty } = log.total_hours

  return (
  <div className="card shadow-sm border-dark mx-auto" style={{ maxWidth: 960 }}>
    {/* Header */}
    <div className="card-header bg-white border-2 border-bottom">
      <div className="d-flex justify-content-between align-items-start flex-wrap">

        <div>
          <h5 className="fw-bold mb-0">Driver's Daily Log</h5>
          <small className="text-muted">(24 Hours)</small>
        </div>

        <div className="d-flex gap-4 align-items-end">

          <div className="d-flex gap-2">
            <div className="text-center">
              <div className="border-bottom px-3">{month}</div>
              <small>(month)</small>
            </div>

            <div className="text-center">
              <div className="border-bottom px-3">{day}</div>
              <small>(day)</small>
            </div>

            <div className="text-center">
              <div className="border-bottom px-3">{year}</div>
              <small>(year)</small>
            </div>
          </div>

          <small className="text-muted text-end">
            <div>Original - File at home terminal.</div>
            <div>Duplicate - Driver retains for 8 days.</div>
          </small>

        </div>

      </div>
    </div>

    {/* From / To */}
    <div className="card-body py-2 border-bottom">
      <div className="row">
        <div className="col-md-6">
          <strong>From:</strong>{" "}
          {log.from || log.pickup_location}
        </div>

        <div className="col-md-6">
          <strong>To:</strong>{" "}
          {log.to || log.dropoff_location}
        </div>
      </div>
    </div>

    {/* Summary */}
    <div className="card-body border-bottom">

      <div className="row g-3">

        <div className="col-md-6">

          <div className="row g-2 mb-2">

            <div className="col-6">
              <div className="card text-center">
                <div className="card-body p-2">
                  <small className="text-muted">
                    Total Miles Driving
                  </small>
                  <div className="fw-bold">
                    {log.miles_driving}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6">
              <div className="card text-center">
                <div className="card-body p-2">
                  <small className="text-muted">
                    Total Miles Today
                  </small>
                  <div className="fw-bold">
                    {log.miles_total}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="border rounded p-2">
            <small className="text-muted">
              Vehicle Numbers
            </small>
            <div>{log.vehicle_numbers}</div>
          </div>

        </div>

        <div className="col-md-6">

          <div className="mb-2">
            <small className="text-muted">
              Carrier
            </small>
            <div>{log.carrier}</div>
          </div>

          <div className="mb-2">
            <small className="text-muted">
              Main Office
            </small>
            <div>{log.main_office}</div>
          </div>

          <div>
            <small className="text-muted">
              Home Terminal
            </small>
            <div>{log.home_terminal}</div>
          </div>

        </div>

      </div>

    </div>

    {/* Driver */}
    <div className="card-body py-2 border-bottom">
      <div className="row">
        <div className="col-md-6">
          <strong>Driver:</strong> {log.driver_name}
        </div>

        <div className="col-md-6">
          <strong>Co-Driver:</strong> {log.co_driver}
        </div>
      </div>
    </div>

    {/* Canvas */}
    <div className="card-body py-2">
      <canvas
        ref={canvasRef}
        className="w-100"
      />
    </div>

    {/* Remarks */}
<div className="card-body eld-section">
  <h6 className="fw-bold">Remarks</h6>

  <div className="form-control p-3 remarks-box">
    {log.remarks}
  </div>
</div>

{/* Shipping */}
<div className="card-body eld-section">
  <h6 className="fw-bold">
    Shipping Documents
  </h6>

  <div className="form-control p-3 shipping-box">
    {log.shipping_docs}
  </div>
</div>

{/* DVL */}
<div className="card-body eld-section">
  <div className="row g-3">

    <div className="col-md-4">
      <label className="form-label fw-bold">
        DVL / Manifest No.
      </label>

      <div className="form-control p-3 log-box"></div>
    </div>

    <div className="col-md-8">
      <label className="form-label fw-bold">
        Shipper & Commodity
      </label>

      <div className="form-control p-3 log-box"></div>
    </div>

  </div>
</div>

    {/* Totals */}
    <div className="card-footer bg-light">

      <div className="row text-center">

        <div className="col">
          <div className="text-muted small">
            Off Duty
          </div>
          <span className="badge bg-secondary">
            {off_duty}h
          </span>
        </div>

        <div className="col">
          <div className="text-muted small">
            Sleeper
          </div>
          <span className="badge bg-info">
            {sleeper}h
          </span>
        </div>

        <div className="col">
          <div className="text-muted small">
            Driving
          </div>
          <span className="badge bg-success">
            {driving}h
          </span>
        </div>

        <div className="col">
          <div className="text-muted small">
            On Duty
          </div>
          <span className="badge bg-warning text-dark">
            {on_duty}h
          </span>
        </div>

      </div>

    </div>
  </div>
)
}
