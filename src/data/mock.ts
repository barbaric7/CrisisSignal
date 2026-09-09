/* ============================================================
   CrisisSignal — mock data layer (frontend demo only)
   All values are fictional sample data for UI presentation.
   ============================================================ */

export type Severity = "critical" | "high" | "medium" | "low";
export type EventStatus = "escalating" | "active" | "monitoring" | "contained";
export type EventType =
  | "wildfire" | "flood" | "storm" | "seismic" | "volcanic"
  | "heat" | "power" | "industrial" | "drought";
export type Region =
  | "North America" | "South America" | "Europe" | "Africa" | "Asia" | "Oceania";
export type SourceKind = "satellite" | "sensor" | "social" | "news" | "official" | "field";

export interface Evidence { kind: SourceKind; text: string; time: string; source: string; }
export interface TimelineEntry { time: string; label: string; detail?: string; sev?: Severity; }
export interface Weather {
  tempC: number; windKmh: number; humidity: number;
  airQuality: string; aqLevel: 0 | 1 | 2 | 3;
  sensorsOnline: number; sensorsTotal: number;
}
export interface CrisisEvent {
  id: string; code: string; name: string; type: EventType;
  location: string; country: string; region: Region;
  lat: number; lon: number;
  severity: Severity; status: EventStatus;
  confidence: number; affectedRadiusKm: number; populationAtRisk: number;
  sourcesCount: number; detectedAt: string; updatedMinAgo: number;
  weather: Weather; evidence: Evidence[]; timeline?: TimelineEntry[]; spark: number[];
}

export interface DataSource {
  id: string; name: string; provider: string; category: string; kind: SourceKind;
  status: "healthy" | "degraded" | "offline";
  ingest: string; lastSyncMin: number; uptime: number; coverage: string;
}

export interface AlertItem {
  id: string; severity: Severity; title: string; message: string;
  source: string; timeMinAgo: number; eventRef?: string; acked: boolean;
}

/* ---------------- events ---------------- */

export const EVENTS: CrisisEvent[] = [
  {
    id: "ev-sonoma-fire", code: "CS-2417", name: "Wildfire — Sonoma County", type: "wildfire",
    location: "Sonoma County, California", country: "United States", region: "North America",
    lat: 38.44, lon: -122.72, severity: "critical", status: "escalating",
    confidence: 87, affectedRadiusKm: 14, populationAtRisk: 3400, sourcesCount: 12,
    detectedAt: "08 Sep 2026 · 08:02 UTC", updatedMinAgo: 6,
    weather: { tempC: 34, windKmh: 28, humidity: 18, airQuality: "Hazardous", aqLevel: 3, sensorsOnline: 14, sensorsTotal: 18 },
    evidence: [
      { kind: "satellite", text: "Satellite thermal anomaly cluster (9 detections in 3 h)", time: "08:02", source: "NOAA GOES-18 · VIIRS band 7" },
      { kind: "field", text: "Emergency services report — active fire front", time: "09:40", source: "Sonoma County dispatch" },
      { kind: "social", text: "142 verified social media reports from affected area", time: "11:15", source: "Social stream · geo-filtered" },
      { kind: "news", text: "Local news coverage confirms evacuation advisory", time: "12:00", source: "Regional news aggregator" },
      { kind: "sensor", text: "PM2.5 above threshold at 6 air-quality stations", time: "12:40", source: "Air-quality mesh network" },
    ],
    timeline: [
      { time: "08:02", label: "Initial thermal anomaly detected via satellite feed", detail: "9 hot-spot detections, VIIRS confidence 0.87", sev: "low" },
      { time: "09:15", label: "Event confirmed, escalated to medium severity", detail: "Cross-checked with emergency dispatch traffic", sev: "medium" },
      { time: "10:40", label: "Evacuation advisory issued for surrounding area", detail: "Zones SON-4, SON-7 flagged by county OEM", sev: "medium" },
      { time: "12:00", label: "Escalated to high — active fire front confirmed", detail: "Perimeter growth estimated 1.4 km/h", sev: "high" },
      { time: "12:40", label: "Air-quality alerts pushed to regional dashboards", detail: "6 stations reporting PM2.5 > 250 µg/m³", sev: "high" },
      { time: "13:05", label: "Escalated to critical — spot fires across containment line", detail: "Wind shift 28 km/h from NE", sev: "critical" },
    ],
    spark: [2, 3, 3, 5, 6, 9, 12, 14, 18, 22],
  },
  {
    id: "ev-meghna-flood", code: "CS-2414", name: "Flooding — Meghna River Basin", type: "flood",
    location: "Sylhet Division", country: "Bangladesh", region: "Asia",
    lat: 24.9, lon: 91.87, severity: "high", status: "active",
    confidence: 74, affectedRadiusKm: 42, populationAtRisk: 128000, sourcesCount: 8,
    detectedAt: "07 Sep 2026 · 21:26 UTC", updatedMinAgo: 14,
    weather: { tempC: 29, windKmh: 14, humidity: 88, airQuality: "Moderate", aqLevel: 1, sensorsOnline: 22, sensorsTotal: 26 },
    evidence: [
      { kind: "satellite", text: "SAR water-extent mapping shows 310 km² inundation", time: "21:26", source: "Sentinel-1 SAR" },
      { kind: "sensor", text: "3 gauge stations above danger level", time: "22:10", source: "Hydrological sensor network" },
      { kind: "official", text: "District administration opens 14 shelters", time: "06:45", source: "DDM situation report" },
    ],
    spark: [4, 5, 7, 8, 8, 10, 12, 13, 13, 14],
  },
  {
    id: "ev-luzon-surge", code: "CS-2419", name: "Storm Surge — Coastal Luzon", type: "storm",
    location: "Quezon Province", country: "Philippines", region: "Asia",
    lat: 14.03, lon: 121.98, severity: "high", status: "active",
    confidence: 81, affectedRadiusKm: 26, populationAtRisk: 64000, sourcesCount: 9,
    detectedAt: "09 Sep 2026 · 02:12 UTC", updatedMinAgo: 27,
    weather: { tempC: 30, windKmh: 62, humidity: 78, airQuality: "Good", aqLevel: 0, sensorsOnline: 17, sensorsTotal: 20 },
    evidence: [
      { kind: "satellite", text: "Typhoon structure classification: category 2 equivalent", time: "02:12", source: "Himawari-9 imagery" },
      { kind: "sensor", text: "Tide gauges +1.8 m above predicted astronomical tide", time: "04:30", source: "Coastal buoy array" },
      { kind: "official", text: "PAGASA signal No. 3 raised for coastal municipalities", time: "05:00", source: "PAGASA bulletin #6" },
    ],
    spark: [1, 2, 4, 6, 9, 11, 14, 15, 17, 18],
  },
  {
    id: "ev-ba-grid", code: "CS-2411", name: "Grid Failure — Metro Area", type: "power",
    location: "Buenos Aires", country: "Argentina", region: "South America",
    lat: -34.6, lon: -58.38, severity: "medium", status: "active",
    confidence: 66, affectedRadiusKm: 18, populationAtRisk: 210000, sourcesCount: 5,
    detectedAt: "09 Sep 2026 · 06:55 UTC", updatedMinAgo: 41,
    weather: { tempC: 17, windKmh: 22, humidity: 64, airQuality: "Good", aqLevel: 0, sensorsOnline: 9, sensorsTotal: 12 },
    evidence: [
      { kind: "official", text: "Utility telemetry: 4 substations offline", time: "06:55", source: "Grid telemetry relay" },
      { kind: "social", text: "Outage reports cluster in 3 city districts", time: "07:20", source: "Social stream · keyword filter" },
      { kind: "sensor", text: "Nightlight delta detected on low-orbit pass", time: "09:41", source: "VIIRS DNB anomaly scan" },
    ],
    spark: [6, 6, 7, 9, 12, 11, 10, 9, 9, 8],
  },
  {
    id: "ev-valparaiso-quake", code: "CS-2408", name: "Earthquake M4.6 — Valparaíso Coast", type: "seismic",
    location: "Valparaíso Region", country: "Chile", region: "South America",
    lat: -33.05, lon: -71.62, severity: "low", status: "monitoring",
    confidence: 91, affectedRadiusKm: 30, populationAtRisk: 12000, sourcesCount: 6,
    detectedAt: "09 Sep 2026 · 04:48 UTC", updatedMinAgo: 58,
    weather: { tempC: 15, windKmh: 30, humidity: 70, airQuality: "Good", aqLevel: 0, sensorsOnline: 31, sensorsTotal: 31 },
    evidence: [
      { kind: "sensor", text: "Seismic event M4.6, depth 24 km — 12 stations", time: "04:48", source: "Global seismic network" },
      { kind: "official", text: "No tsunami threat per regional warning centre", time: "05:02", source: "SHOA bulletin" },
      { kind: "social", text: "Felt reports (MMI IV) from 214 submissions", time: "05:30", source: "Did-you-feel-it stream" },
    ],
    spark: [3, 3, 4, 4, 5, 5, 4, 4, 3, 3],
  },
  {
    id: "ev-andalusia-heat", code: "CS-2420", name: "Heatwave — Andalusia Interior", type: "heat",
    location: "Andalusia", country: "Spain", region: "Europe",
    lat: 37.39, lon: -5.98, severity: "high", status: "active",
    confidence: 79, affectedRadiusKm: 120, populationAtRisk: 86000, sourcesCount: 7,
    detectedAt: "08 Sep 2026 · 12:00 UTC", updatedMinAgo: 95,
    weather: { tempC: 43, windKmh: 12, humidity: 14, airQuality: "Moderate", aqLevel: 1, sensorsOnline: 26, sensorsTotal: 28 },
    evidence: [
      { kind: "sensor", text: "Station network: 43.1 °C peak, 6 stations above 41 °C", time: "12:00", source: "AEMET station feed" },
      { kind: "satellite", text: "Land-surface temperature anomaly +9.4 °C", time: "13:20", source: "MODIS LST product" },
      { kind: "official", text: "Health authority activates heat contingency plan", time: "18:05", source: "Regional health bulletin" },
    ],
    spark: [5, 6, 7, 8, 9, 10, 11, 12, 12, 13],
  },
  {
    id: "ev-reykjanes-volc", code: "CS-2408B", name: "Volcanic Unrest — Reykjanes", type: "volcanic",
    location: "Reykjanes Peninsula", country: "Iceland", region: "Europe",
    lat: 63.9, lon: -22.4, severity: "medium", status: "monitoring",
    confidence: 71, affectedRadiusKm: 9, populationAtRisk: 2600, sourcesCount: 6,
    detectedAt: "06 Sep 2026 · 17:34 UTC", updatedMinAgo: 240,
    weather: { tempC: 9, windKmh: 41, humidity: 81, airQuality: "Good", aqLevel: 0, sensorsOnline: 19, sensorsTotal: 21 },
    evidence: [
      { kind: "sensor", text: "Seismic swarm: 340 events in 24 h, max M3.1", time: "17:34", source: "IMO seismic network" },
      { kind: "sensor", text: "GPS uplift 11 mm/week at Svartsengi", time: "08:00", source: "Geodetic array" },
      { kind: "official", text: "Aviation colour code raised to ORANGE", time: "09:15", source: "ICAO VOLMET notice" },
    ],
    spark: [2, 3, 4, 6, 7, 7, 8, 8, 9, 9],
  },
  {
    id: "ev-odisha-cyclone", code: "CS-2416", name: "Cyclonic Storm — Odisha Coast", type: "storm",
    location: "Bay of Bengal / Odisha", country: "India", region: "Asia",
    lat: 19.8, lon: 85.85, severity: "high", status: "escalating",
    confidence: 77, affectedRadiusKm: 85, populationAtRisk: 310000, sourcesCount: 10,
    detectedAt: "08 Sep 2026 · 00:00 UTC", updatedMinAgo: 180,
    weather: { tempC: 31, windKmh: 95, humidity: 84, airQuality: "Good", aqLevel: 0, sensorsOnline: 15, sensorsTotal: 24 },
    evidence: [
      { kind: "satellite", text: "Rapid intensification: +30 kt in 12 h", time: "00:00", source: "INSAT-3DR imagery" },
      { kind: "official", text: "IMD warning: landfall expected within 36 h", time: "06:30", source: "IMD bulletin #11" },
      { kind: "official", text: "Pre-positioning of NDRF teams in 4 districts", time: "10:00", source: "State EOC situation report" },
    ],
    spark: [2, 3, 5, 7, 9, 12, 14, 16, 19, 21],
  },
  {
    id: "ev-cusco-landslide", code: "CS-2405", name: "Landslide Risk — Cusco Region", type: "seismic",
    location: "Cusco Region", country: "Peru", region: "South America",
    lat: -13.53, lon: -71.97, severity: "medium", status: "monitoring",
    confidence: 63, affectedRadiusKm: 6, populationAtRisk: 4800, sourcesCount: 4,
    detectedAt: "07 Sep 2026 · 15:12 UTC", updatedMinAgo: 700,
    weather: { tempC: 18, windKmh: 9, humidity: 55, airQuality: "Good", aqLevel: 0, sensorsOnline: 6, sensorsTotal: 9 },
    evidence: [
      { kind: "satellite", text: "InSAR displacement 4 cm on valley flank", time: "15:12", source: "Sentinel-1 InSAR" },
      { kind: "field", text: "Municipal report: new tension cracks above road", time: "18:40", source: "Civil defence field report" },
    ],
    spark: [4, 4, 5, 5, 6, 6, 6, 7, 7, 7],
  },
  {
    id: "ev-rhine-spill", code: "CS-2413", name: "Chemical Spill — Middle Rhine", type: "industrial",
    location: "Rhine River, NRW", country: "Germany", region: "Europe",
    lat: 50.94, lon: 6.96, severity: "medium", status: "contained",
    confidence: 84, affectedRadiusKm: 12, populationAtRisk: 0, sourcesCount: 6,
    detectedAt: "08 Sep 2026 · 09:20 UTC", updatedMinAgo: 1100,
    weather: { tempC: 21, windKmh: 16, humidity: 62, airQuality: "Good", aqLevel: 0, sensorsOnline: 12, sensorsTotal: 12 },
    evidence: [
      { kind: "official", text: "Fire brigade reports containment booms deployed", time: "09:20", source: "Municipal emergency office" },
      { kind: "sensor", text: "Water-quality probes: pH deviation downstream", time: "10:05", source: "River monitoring array" },
      { kind: "news", text: "Shipping traffic paused at km 688–700", time: "11:30", source: "Regional news aggregator" },
    ],
    spark: [8, 9, 7, 6, 5, 4, 4, 3, 3, 2],
  },
  {
    id: "ev-horn-drought", code: "CS-2398", name: "Drought Monitor — Horn of Africa", type: "drought",
    location: "Sanaag & Togdheer", country: "Somalia", region: "Africa",
    lat: 9.5, lon: 44.5, severity: "low", status: "monitoring",
    confidence: 69, affectedRadiusKm: 240, populationAtRisk: 540000, sourcesCount: 5,
    detectedAt: "01 Sep 2026 · 00:00 UTC", updatedMinAgo: 2600,
    weather: { tempC: 36, windKmh: 19, humidity: 21, airQuality: "Moderate", aqLevel: 1, sensorsOnline: 7, sensorsTotal: 11 },
    evidence: [
      { kind: "satellite", text: "NDVI anomaly −0.31 vs 10-yr median", time: "00:00", source: "MODIS NDVI composite" },
      { kind: "official", text: "Water-point survey: 38% non-functional", time: "00:00", source: "Humanitarian partner report" },
    ],
    spark: [6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
  },
  {
    id: "ev-hokkaido-tsunami", code: "CS-2402", name: "Tsunami Advisory — Hokkaido East", type: "seismic",
    location: "Hokkaido Pacific coast", country: "Japan", region: "Asia",
    lat: 42.9, lon: 143.2, severity: "low", status: "contained",
    confidence: 88, affectedRadiusKm: 60, populationAtRisk: 9000, sourcesCount: 7,
    detectedAt: "26 Aug 2026 · 08:44 UTC", updatedMinAgo: 12400,
    weather: { tempC: 22, windKmh: 26, humidity: 74, airQuality: "Good", aqLevel: 0, sensorsOnline: 28, sensorsTotal: 28 },
    evidence: [
      { kind: "sensor", text: "M6.9 event, JMA tsunami advisory issued", time: "08:44", source: "JMA seismic network" },
      { kind: "sensor", text: "Observed wave 0.4 m at Kushiro — advisory lifted", time: "11:20", source: "Coastal tide gauge array" },
    ],
    spark: [9, 7, 5, 4, 3, 2, 2, 1, 1, 1],
  },
];

/* ---------------- data sources ---------------- */

export const SOURCES: DataSource[] = [
  { id: "src-noaa", name: "NOAA satellite feed", provider: "GOES-18 / VIIRS", category: "Satellite", kind: "satellite", status: "healthy", ingest: "1.2k/min", lastSyncMin: 0.2, uptime: 99.98, coverage: "Global" },
  { id: "src-news", name: "Regional news aggregator", provider: "1,140 outlets", category: "News", kind: "news", status: "healthy", ingest: "340/min", lastSyncMin: 0.75, uptime: 99.6, coverage: "142 countries" },
  { id: "src-social", name: "Social media stream", provider: "Firehose sample 5%", category: "Social", kind: "social", status: "degraded", ingest: "2.8k/min", lastSyncMin: 3, uptime: 96.2, coverage: "Global" },
  { id: "src-emdis", name: "Emergency services dispatch", provider: "41 regional CAD feeds", category: "Official", kind: "official", status: "healthy", ingest: "85/min", lastSyncMin: 1.1, uptime: 99.4, coverage: "NA / EU" },
  { id: "src-wx", name: "Weather sensor network", provider: "3,902 stations", category: "Sensor", kind: "sensor", status: "offline", ingest: "0/min", lastSyncMin: 14, uptime: 87.1, coverage: "Global" },
  { id: "src-seis", name: "Global seismic network", provider: "FDSN relay", category: "Sensor", kind: "sensor", status: "healthy", ingest: "12/min", lastSyncMin: 0.4, uptime: 99.99, coverage: "Global" },
  { id: "src-ais", name: "Maritime AIS feed", provider: "Terrestrial + SAT", category: "Sensor", kind: "sensor", status: "degraded", ingest: "610/min", lastSyncMin: 6, uptime: 94.8, coverage: "Coastal" },
  { id: "src-aq", name: "Air-quality mesh", provider: "12,400 nodes", category: "Sensor", kind: "sensor", status: "healthy", ingest: "480/min", lastSyncMin: 1.6, uptime: 98.7, coverage: "Urban" },
  { id: "src-ngo", name: "Humanitarian field reports", provider: "27 partner orgs", category: "Official", kind: "field", status: "healthy", ingest: "9/min", lastSyncMin: 22, uptime: 97.9, coverage: "48 countries" },
  { id: "src-grid", name: "Utility grid telemetry", provider: "6 operators", category: "Official", kind: "official", status: "healthy", ingest: "150/min", lastSyncMin: 0.9, uptime: 99.1, coverage: "NA / SA" },
];

/* ---------------- alerts ---------------- */

export const ALERTS: AlertItem[] = [
  { id: "al-1", severity: "critical", title: "Severity escalation — Wildfire, Sonoma County", message: "Confidence-weighted model raised CS-2417 from HIGH to CRITICAL after spot-fire detections across containment line.", source: "Correlation engine", timeMinAgo: 4, eventRef: "ev-sonoma-fire", acked: false },
  { id: "al-2", severity: "high", title: "Storm surge threshold exceeded — Coastal Luzon", message: "Tide gauges report +1.8 m above predicted astronomical tide; exceeds 1.5 m alert threshold.", source: "Coastal buoy array", timeMinAgo: 22, eventRef: "ev-luzon-surge", acked: false },
  { id: "al-3", severity: "high", title: "Rapid intensification — Cyclonic Storm, Odisha", message: "Sustained winds +30 kt in 12 h. Landfall window narrowed to 24–36 h.", source: "IMD bulletin #11", timeMinAgo: 51, eventRef: "ev-odisha-cyclone", acked: false },
  { id: "al-4", severity: "medium", title: "Source degraded — Social media stream", message: "Ingest latency 3 min and rising (SLA 60 s). Confidence weighting adjusted automatically.", source: "Pipeline monitor", timeMinAgo: 64, acked: true },
  { id: "al-5", severity: "medium", title: "Sensor swarm offline — Weather network, EU-West", message: "412 stations unreachable after upstream provider maintenance window overran.", source: "Pipeline monitor", timeMinAgo: 14, acked: false },
  { id: "al-6", severity: "low", title: "Advisory lifted — Tsunami, Hokkaido East", message: "Observed wave 0.4 m; regional advisory lifted. Event moved to contained.", source: "JMA relay", timeMinAgo: 300, eventRef: "ev-hokkaido-tsunami", acked: true },
  { id: "al-7", severity: "low", title: "Weekly correlation digest ready", message: "18 candidate event merges reviewed; 3 auto-merged, 15 kept separate.", source: "Correlation engine", timeMinAgo: 1440, acked: true },
];

/* ---------------- derived helpers ---------------- */

export const RANGE_MIN: Record<string, number> = { "24h": 1440, "72h": 4320, "7d": 10080, "30d": 43200 };

export function defaultTimeline(e: CrisisEvent): TimelineEntry[] {
  if (e.timeline) return e.timeline;
  return [
    { time: "T+0:00", label: `Initial detection — ${e.evidence[0]?.source ?? "sensor feed"}`, detail: e.evidence[0]?.text, sev: "low" },
    { time: "T+0:45", label: "Cross-source corroboration (≥2 independent feeds)", detail: e.evidence[1]?.text, sev: "medium" },
    { time: "T+2:10", label: `Classified ${e.type} · severity ${e.severity.toUpperCase()}`, detail: `Confidence ${e.confidence}% at classification`, sev: e.severity },
    { time: "T+4:00", label: "Monitoring cadence set to 15 min", detail: `${e.sourcesCount} sources contributing`, sev: e.severity },
  ];
}

/** Deterministic pseudo-random series for trend charts. */
export function trendSeries(days: number, seed = 3): { day: string; events: number; alerts: number }[] {
  const out: { day: string; events: number; alerts: number }[] = [];
  const now = new Date("2026-09-09T13:20:00Z");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const label = days <= 7
      ? d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    const t = days - i;
    const wave = Math.sin(t * 0.9 + seed) * 3 + Math.sin(t * 0.31 + seed * 2) * 4;
    const events = Math.max(3, Math.round(14 + wave + t * 0.55));
    const alerts = Math.max(1, Math.round(events * 0.45 + Math.sin(t * 1.7 + seed) * 2));
    out.push({ day: label, events, alerts });
  }
  return out;
}
