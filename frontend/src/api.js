const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function planTrip(tripData) {
  const response = await fetch(`${API_BASE}api/plan-trip/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tripData),
  })


  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Failed to plan trip')
  }
  
  return data
}
