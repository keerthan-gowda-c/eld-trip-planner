const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function planTrip(tripData) {
  const response = await fetch(`${API_BASE}/api/plan-trip/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tripData),
  })


  
  const text = await response.text();
console.log("STATUS:", response.status);
  console.log("RAW RESPONSE:", text);

  return data
}
