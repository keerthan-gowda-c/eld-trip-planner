import { useEffect, useRef } from 'react'

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
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#111', border: '2px solid #333', padding: 0, background: '#fff', maxWidth: 960, margin: '0 auto' }}>

      {/* Title bar */}
      <div style={{ borderBottom: '2px solid #333', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 }}>Drivers Daily Log</div>
          <div style={{ fontSize: 9, color: '#555' }}>(24 hours)</div>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 11, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #333', minWidth: 40, textAlign: 'center', paddingBottom: 1 }}>{month}</div>
              <div style={{ fontSize: 9 }}>(month)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #333', minWidth: 30, textAlign: 'center', paddingBottom: 1 }}>{day}</div>
              <div style={{ fontSize: 9 }}>(day)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #333', minWidth: 50, textAlign: 'center', paddingBottom: 1 }}>{year}</div>
              <div style={{ fontSize: 9 }}>(year)</div>
            </div>
          </div>
          <div style={{ fontSize: 9, lineHeight: 1.6, textAlign: 'right', color: '#444' }}>
            <div>Original - File at home terminal.</div>
            <div>Duplicate - Driver retains in his/her possession for 8 days.</div>
          </div>
        </div>
      </div>

      {/* From / To */}
      <div style={{ display: 'flex', borderBottom: '1px solid #bbb', padding: '4px 10px', gap: 40 }}>
        <div><span style={{ fontWeight: 'bold' }}>From:</span> <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 160 }}>{log.from || log.pickup_location || ''}</span></div>
        <div><span style={{ fontWeight: 'bold' }}>To:</span> <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 160 }}>{log.to ||  log.dropoff_location || ''}</span></div>
      </div>

      {/* Miles & Carrier info */}
      <div style={{ display: 'flex', borderBottom: '1px solid #bbb', padding: '6px 10px', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
            <div style={{ border: '1px solid #888', padding: '4px 8px', minWidth: 80 }}>
              <div style={{ fontSize: 9, color: '#555' }}>Total Miles Driving</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', minHeight: 16 }}>{log.miles_driving || ''}</div>
            </div>
            <div style={{ border: '1px solid #888', padding: '4px 8px', minWidth: 80 }}>
              <div style={{ fontSize: 9, color: '#555' }}>Total Miles Today</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', minHeight: 16 }}>{log.miles_total || ''}</div>
            </div>
          </div>
          <div style={{ border: '1px solid #888', padding: '4px 8px' }}>
            <div style={{ fontSize: 9, color: '#555' }}>Truck/Tractor and Trailer Numbers or License Plate(s)/State (show each unit)</div>
            <div style={{ minHeight: 14 }}>{log.vehicle_numbers || ''}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ borderBottom: '1px solid #bbb', padding: '3px 0', marginBottom: 4 }}>
            <div style={{ fontSize: 9, color: '#555' }}>Name of Carrier or Carriers</div>
            <div style={{ minHeight: 14 }}>{log.carrier || ''}</div>
          </div>
          <div style={{ borderBottom: '1px solid #bbb', padding: '3px 0', marginBottom: 4 }}>
            <div style={{ fontSize: 9, color: '#555' }}>Main Office Address</div>
            <div style={{ minHeight: 14 }}>{log.main_office || ''}</div>
          </div>
          <div style={{ padding: '3px 0' }}>
            <div style={{ fontSize: 9, color: '#555' }}>Home Terminal Address</div>
            <div style={{ minHeight: 14 }}>{log.home_terminal || ''}</div>
          </div>
        </div>
      </div>

      {/* Driver name & co-driver */}
      <div style={{ display: 'flex', padding: '4px 10px', borderBottom: '1px solid #bbb', gap: 40, fontSize: 10 }}>
        <div>
          <span style={{ fontWeight: 'bold' }}>Driver: </span>
          <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 180 }}>{log.driver_name}</span>
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Co-Driver: </span>
          <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 160 }}>{log.co_driver || ''}</span>
        </div>
      </div>

      {/* Grid canvas */}
      <div style={{ padding: '0 10px 4px' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
      </div>

      {/* Remarks */}
      <div style={{ borderTop: '1px solid #bbb', padding: '6px 10px' }}>
        <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>Remarks</div>
        <div style={{ borderBottom: '1px solid #aaa', minHeight: 18, fontSize: 11 }}>{log.remarks || ''}</div>
        <div style={{ borderBottom: '1px solid #aaa', minHeight: 18 }}></div>
      </div>

      {/* Shipping Documents */}
      <div style={{ borderTop: '1px solid #bbb', padding: '6px 10px' }}>
        <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>Shipping Documents:</div>
        <div style={{ borderBottom: '1px solid #aaa', minHeight: 16 }}>{log.shipping_docs || ''}</div>
      </div>

      {/* DVL / Shipper */}
      <div style={{ borderTop: '1px solid #bbb', padding: '4px 10px', display: 'flex', gap: 24, fontSize: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold' }}>DVL or Manifest No.</div>
          <div style={{ fontWeight: 'bold', color: '#666' }}>or</div>
          <div style={{ borderBottom: '1px solid #aaa', minHeight: 14 }}></div>
        </div>
        <div style={{ flex: 2 }}>
          <div style={{ fontWeight: 'bold' }}>Shipper &amp; Commodity</div>
          <div style={{ borderBottom: '1px solid #aaa', minHeight: 14 }}></div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ borderTop: '1px solid #bbb', padding: '4px 10px', fontSize: 9, textAlign: 'center', color: '#555' }}>
        <div>Enter name of place you reported and where released from work and when and where each change of duty occurred.</div>
        <div>Use time standard of home terminal.</div>
      </div>

      {/* Recap section */}
      <div style={{ borderTop: '2px solid #333', padding: '6px 10px', fontSize: 9 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {/* Left: Recap label */}
          <div style={{ width: 90, borderRight: '1px solid #888', paddingRight: 6 }}>
            <div style={{ fontWeight: 'bold', fontSize: 10 }}>Recap:</div>
            <div>Complete at</div>
            <div>end of day</div>
          </div>

          {/* 70 hour */}
          <div style={{ flex: 1, borderRight: '1px solid #888', padding: '0 6px' }}>
            <div style={{ fontWeight: 'bold', textAlign: 'center' }}>70 Hour/ 8 Day</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>Drivers</div>
              </div>
              {['A.', 'B.', 'C.'].map(l => (
                <div key={l} style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>{l}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 2, fontSize: 8 }}>
              <div style={{ flex: 1 }}>
                <div>On duty hours today. Total lines 3 &amp; 4</div>
              </div>
              <div style={{ flex: 1 }}>
                <div>A. Total hours on duty last 7 days including today.</div>
              </div>
              <div style={{ flex: 1 }}>
                <div>B. Total hours available tomorrow 70 hr. minus A*</div>
              </div>
              <div style={{ flex: 1 }}>
                <div>C. Total hours on duty last 8 days including today.</div>
              </div>
            </div>
          </div>

          {/* 60 hour */}
          <div style={{ flex: 1, padding: '0 6px' }}>
            <div style={{ fontWeight: 'bold', textAlign: 'center' }}>60 Hour/ 7 Day</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>Day Drivers</div>
              </div>
              {['A.', 'B.', 'C.'].map(l => (
                <div key={l} style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>{l}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 2, fontSize: 8 }}>
              <div style={{ flex: 1 }}>
              </div>
              <div style={{ flex: 1 }}>
                <div>A. Total hours on duty last 8 days including today.</div>
              </div>
              <div style={{ flex: 1 }}>
                <div>B. Total hours available tomorrow 60 hr. minus A*</div>
              </div>
              <div style={{ flex: 1 }}>
                <div>C. Total hours on duty last 7 days including today.</div>
              </div>
            </div>
          </div>

          {/* Right note */}
          <div style={{ width: 100, borderLeft: '1px solid #888', paddingLeft: 6, fontSize: 8 }}>
            <div style={{ fontWeight: 'bold' }}>*If you took 34 consecutive hours off duty you have 60/70 hours available</div>
          </div>
        </div>
      </div>

      {/* Totals summary bar */}
      <div style={{ borderTop: '2px solid #333', padding: '4px 10px', display: 'flex', gap: 24, fontSize: 10, background: '#f5f5f5' }}>
        <div><span style={{ fontWeight: 'bold' }}>Off Duty:</span> {off_duty}h</div>
        <div><span style={{ fontWeight: 'bold' }}>Sleeper Berth:</span> {sleeper}h</div>
        <div><span style={{ fontWeight: 'bold' }}>Driving:</span> {driving}h</div>
        <div><span style={{ fontWeight: 'bold' }}>On Duty (Not Driving):</span> {on_duty}h</div>
      </div>
    </div>
  )
}
