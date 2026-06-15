const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function planTrip(tripData) {
  const response = await fetch(`${API_BASE}/plan-trip/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tripData),
  })


  
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Backend returned invalid JSON:", text);
    throw new Error("Server error: Invalid response from backend");
  }
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to plan trip')
  }
  return data
}
