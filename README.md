# ELD Trip Planner

Full-stack Django + React application that plans truck trips with HOS-compliant route instructions and FMCSA-style daily ELD log sheets.

## Live Demo

- **Frontend:** Deploy to [Vercel](https://vercel.com) (see Deployment below)
- **Backend API:** Deploy to [Render](https://render.com) (free tier)

## Features

- **Inputs:** Current location, pickup location, dropoff location, current cycle used (hours)
- **Outputs:**
  - Interactive map with route, pickup/dropoff markers, and planned stops (rest, break, fuel)
  - Daily log sheets drawn on a 24-hour grid (Off Duty, Sleeper, Driving, On Duty)
  - Trip summary with miles, driving hours, and cycle usage

## Assumptions (FMCSA Property-Carrying)

| Rule | Value |
|------|-------|
| Cycle limit | 70 hours / 8 days |
| Max driving | 11 hours after 10 consecutive hours off duty |
| On-duty window | 14 hours |
| Break | 30 minutes after 8 hours driving |
| Rest period | 10 hours sleeper berth |
| Pickup / Dropoff | 1 hour each (on duty, not driving) |
| Fuel stops | Every 1,000 miles (~30 min on duty) |
| Adverse conditions | None |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5 + Django REST Framework |
| Frontend | React 18 + Vite |
| Maps | Leaflet + OpenStreetMap tiles (free) |
| Geocoding | Nominatim / OpenStreetMap (free) |
| Routing | OSRM public API (free) |

## Project Structure

```
eld-trip-planner/
├── backend/
│   ├── config/          # Django settings
│   ├── trips/
│   │   ├── services/
│   │   │   ├── geocoding.py    # Address → coordinates
│   │   │   ├── routing.py      # OSRM route + polyline
│   │   │   ├── hos_planner.py  # HOS rules engine
│   │   │   └── eld_generator.py # Daily log sheet data
│   │   ├── views.py     # POST /api/plan-trip/
│   │   └── urls.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TripForm.jsx
│   │   │   ├── RouteMap.jsx
│   │   │   ├── ELDLogSheet.jsx  # Canvas-drawn log grids
│   │   │   └── TripSummary.jsx
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API runs at `http://127.0.0.1:8000/api/`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` (proxies `/api` to Django).

### Example API Request

```bash
curl -X POST http://127.0.0.1:8000/api/plan-trip/ \
  -H "Content-Type: application/json" \
  -d '{
    "current_location": "Chicago, IL",
    "pickup_location": "Indianapolis, IN",
    "dropoff_location": "Nashville, TN",
    "current_cycle_used_hours": 10,
    "driver_name": "John Driver"
  }'
```

For multi-day log sheets, try a longer route e.g. `Los Angeles, CA` → `Denver, CO` → `Chicago, IL`.

## Deployment

### 1. Backend (Render)

1. Push this repo to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect the repo, set **Root Directory** to `backend`
4. Build: `pip install -r requirements.txt`
5. Start: `gunicorn config.wsgi --bind 0.0.0.0:$PORT`
6. Add environment variables from `backend/.env.example`
7. Set `CORS_ALLOWED_ORIGINS` to your Vercel frontend URL

### 2. Frontend (Vercel)

1. Import the GitHub repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-api.onrender.com/api`
4. Deploy

## Loom Video Guide (3–5 min)

Record a Loom covering:

1. **Demo (1 min):** Enter trip details, submit, show map + log sheets
2. **HOS logic (1 min):** Walk through `hos_planner.py` — 11/14 rule, breaks, rests, fuel
3. **ELD drawing (1 min):** Show `ELDLogSheet.jsx` canvas rendering
4. **API & maps (1 min):** `views.py` endpoint, OSRM routing, Leaflet map
5. **Deployment (30 sec):** Vercel + Render setup

## GitHub

Push to GitHub and share the repository URL:

```bash
git add .
git commit -m "Initial ELD trip planner app"
git remote add origin https://github.com/YOUR_USERNAME/eld-trip-planner.git
git push -u origin main
```

## License

MIT
