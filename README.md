# CrisisSignal — Situation Intelligence Dashboard (frontend)

A production-grade **frontend-only** disaster monitoring / situation intelligence dashboard.
All events, sources, alerts and metrics are **fictional sample data** — there is no backend,
database, API, NLP or data-processing logic in this project.

## Stack

- **React 18 + TypeScript** (Vite)
- **d3-geo + topojson-client + world-atlas** — real world map rendered from bundled Natural Earth
  topology (fully offline; no map tiles, no external APIs)
- **Recharts** — trend / mix charts
- **lucide-react** — iconography
- Hand-rolled dark design system (`src/index.css`) — CSS variables, 12-column grid, responsive

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
```

## Screens

| Screen | Route (nav) | Contents |
| --- | --- | --- |
| Overview | `Overview` | Filter bar (location / type / severity / time window), 4 KPI cards with sparklines, interactive world map (pan, wheel-zoom, hover tooltips, click-select, center-on-event, cursor lat/lon readout), Active Situations panel, Situation Focus card (confidence, evidence, radius, population), Weather & Sensors (tiles, sensor mesh, advisories), Events-per-day chart (7/14/30 d), Event timeline, Severity & type mix, Feed health |
| Event register | `Events` | Searchable, status-filterable table of all tracked events → click a row for the dossier |
| Event dossier | via any event | Hero header with severity/status badges + KPI strip, focused map with adaptive zoom, dashed impact ring + scale bar + radar sweep, evidence log, timeline, regional activity chart, source contributions, weather & impact summary |
| Data sources | `Sources` | Feed health KPIs + ingest table (status, rate, sync, uptime, coverage) |
| Alert stream | `Alerts` | Severity-coded alert feed with working acknowledge / acknowledge-all and deep links into events |

## What is "working" in the UI

- Filters actually filter the map, situation list, KPIs and analytics (client-side over mock data)
- Map: drag to pan, wheel/buttons to zoom, crosshair centers the selected event, markers pulse for
  live/escalating events, hover tooltips, double-click opens the dossier
- Selecting a situation (map marker or list row) drives the focus card, weather panel and timeline
- Ticking UTC clock, "updated Ns ago" counter with refresh action
- Alert acknowledgement state (badge counts update everywhere)
- Subscribe toggles, event search, status chips, chart range switches (7/14/30 d)

## Structure

```
src/
  data/mock.ts          # all sample data + deterministic trend generator
  lib/meta.tsx          # severity/status/type metadata, formatters, color helpers
  components/
    chrome.tsx          # top nav, filter bar, footer, search box
    ui.tsx              # Card, badges, pills, progress, sparkline, empty states
    EventMap.tsx        # interactive world map + focused impact map
    panels.tsx          # KPI cards, situations list, focus, weather, timeline, charts
    views.tsx           # Events / Sources / Alerts screens
    DetailView.tsx      # full event dossier
  App.tsx               # view routing + filter/selection/alert state
  index.css             # design system
smoke/                  # SSR render smoke test (vite build -c smoke/vite.ssr.config.ts)
```

*Demonstration interface — all events, sources & metrics are fictional sample data.*
