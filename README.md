# CausalFunnel — User Analytics Application

A full-stack user analytics platform that tracks page views and click events, stores them in MongoDB, and presents insights through an interactive React dashboard.

---

## Architecture

```
┌──────────────┐      ┌──────────────────┐      ┌───────────┐
│  tracker.js  │─────▶│  Flask Backend   │─────▶│  MongoDB  │
│  (browser)   │ POST │  /api/events     │      │           │
└──────────────┘      └──────────────────┘      └───────────┘
                              ▲
                              │ GET
                      ┌───────┴────────┐
                      │ React Dashboard│
                      │  (SPA)         │
                      └────────────────┘
```

**Tech Stack:** React 18 · Flask · MongoDB · Recharts · Lucide Icons

---

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- MongoDB (running on `localhost:27017`)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# (Optional) Seed demo data
python seed.py

# Start the server
python app.py
# → Runs on http://localhost:5000
```

Environment variables (optional):
- `MONGO_URI` — MongoDB connection string (default: `mongodb://localhost:27017`)

### 2. Frontend

```bash
cd frontend
npm install
npm start
# → Runs on http://localhost:3000, proxies API to :5000
```

### 3. Demo Page (Tracker test)

Open `demo/index.html` in a browser. The embedded `tracker.js` will begin sending events to the backend. Click around to generate heatmap data.

---

## Project Structure

```
analytics-app/
├── backend/
│   ├── app.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   └── seed.py             # Demo data generator (45 sessions)
├── frontend/
│   ├── public/index.html   # HTML shell
│   └── src/
│       ├── App.js           # Router + sidebar layout
│       ├── api.js           # Axios API service
│       ├── index.css        # Full design system
│       └── pages/
│           ├── Dashboard.js     # Overview: stats, charts, top pages
│           ├── Sessions.js      # Session list with search/sort/pagination
│           ├── SessionDetail.js # User journey timeline
│           └── Heatmap.js       # Click heatmap (dots + density grid)
├── demo/
│   ├── tracker.js          # Embeddable tracking script
│   └── index.html          # Demo e-commerce page
└── README.md
```

---

## Tracking Script

Embed on any page:

```html
<script src="tracker.js" data-api="http://localhost:5000/api/events"></script>
```

**Tracked events:**

| Event       | Data Captured                                                  |
|-------------|----------------------------------------------------------------|
| `page_view` | URL, referrer, user agent, screen width/height, timestamp      |
| `click`     | x/y coordinates, element tag, element text, viewport dims      |

**Behaviour:**
- Generates a unique `session_id` per browser (localStorage + cookie fallback)
- Batches events every 3 seconds to reduce network calls
- Flushes on `beforeunload` and `visibilitychange`

---

## API Endpoints

| Method   | Endpoint                    | Description                                 |
|----------|-----------------------------|---------------------------------------------|
| `POST`   | `/api/events`               | Receive single or batch events              |
| `GET`    | `/api/sessions`             | List sessions (paginated, searchable)       |
| `GET`    | `/api/sessions/<id>/events` | All events for a session                    |
| `DELETE` | `/api/sessions/<id>`        | Delete a session and its events             |
| `GET`    | `/api/heatmap`              | Click data by page URL (or list pages)      |
| `GET`    | `/api/analytics/summary`    | Dashboard stats (totals, hourly, top pages) |
| `GET`    | `/api/pages`                | Unique page URLs                            |
| `GET`    | `/api/health`               | Health check with DB ping                   |

### Example: Post events

```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc123",
    "event_type": "click",
    "page_url": "https://example.com",
    "timestamp": "2026-05-14T10:30:00Z",
    "metadata": {
      "x": 450,
      "y": 320,
      "element_tag": "BUTTON",
      "element_text": "Buy Now",
      "viewport_width": 1440,
      "viewport_height": 900
    }
  }'
```

---

## Dashboard Views

### Overview
- Total events, sessions, unique pages, avg events/session
- Hourly activity area chart
- Event type breakdown pie chart
- Top pages table with distribution bars

### Sessions
- Searchable/sortable session list
- Device type detection (Desktop/Mobile/Tablet)
- Duration calculation
- Click into any session for full event timeline

### Session Detail
- Summary stat cards (views, clicks, duration, pages visited)
- Session metadata (user agent, device, entry page, referrer)
- Filterable event timeline with coordinate/element details

### Heatmap
- Page URL selector dropdown
- **Dots view** — individual click positions with proximity-based heat colouring
- **Density view** — 24×16 grid showing aggregated click zones
- Zoom controls (50%–200%)
- Hover tooltip with click details (position, element, viewport, session)
- Colour legend (blue → yellow → orange → red)

---

## Design

Dark editorial aesthetic ("data observatory") with:
- `DM Sans` body + `JetBrains Mono` monospace
- Accent colour `#e8453c`
- Card-based layout with subtle borders and shadows
- Responsive: sidebar collapses to hamburger on mobile (≤768px)

---

## License

Built for the CausalFunnel Full Stack Engineer assignment.
