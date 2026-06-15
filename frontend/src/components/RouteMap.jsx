import { useEffect, useRef } from 'react'
import L from 'leaflet'

const STOP_COLORS = {
  rest: '#805ad5',
  break: '#d69e2e',
  fuel: '#38a169',
  pickup: '#3182ce',
  dropoff: '#e53e3e',
}

export default function RouteMap({ geometry, locations, stops }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  useEffect(() => {
    if (!mapRef.current || !geometry?.length) return

    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
    }

    const map = L.map(mapRef.current)
    mapInstance.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    const routeLine = L.polyline(geometry, {
      color: '#2b6cb0',
      weight: 5,
      opacity: 0.8,
    }).addTo(map)

    const markerDefs = [
      { key: 'current', label: 'Current', color: '#718096', icon: '▶' },
      { key: 'pickup', label: 'Pickup', color: '#3182ce', icon: 'P' },
      { key: 'dropoff', label: 'Dropoff', color: '#e53e3e', icon: 'D' },
    ]

    markerDefs.forEach(({ key, label, color, icon }) => {
      const loc = locations[key]
      if (!loc) return
      L.marker([loc.lat, loc.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${icon}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      })
        .addTo(map)
        .bindPopup(`<strong>${label}</strong><br/>${loc.name}`)
    })

    stops.forEach((stop, i) => {
      const color = STOP_COLORS[stop.type] || '#718096'
      L.circleMarker([stop.lat, stop.lng], {
        radius: 6,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindPopup(
          `<strong>${stop.type}</strong><br/>${stop.notes}<br/><small>${new Date(stop.time).toLocaleString()}</small>`,
        )
    })

    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [geometry, locations, stops])

  return (
    <>
      <div ref={mapRef} className="map-container" />
      {stops.length > 0 && (
        <ul className="stops-list">
          {stops.map((stop, i) => (
            <li key={i}>
              <span className={`stop-badge ${stop.type}`}>{stop.type}</span>
              {stop.notes} — {new Date(stop.time).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
