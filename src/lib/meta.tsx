import {
  Flame, Droplets, CloudLightning, Activity, Mountain, ThermometerSun, Zap,
  Factory, SunDim, Satellite, RadioTower, MessagesSquare, Newspaper, FileText,
  Siren, type LucideIcon,
} from "lucide-react";
import type { EventType, Severity, EventStatus, SourceKind } from "../data/mock";

/* ---------------- severity ---------------- */

export const SEVERITY: Record<Severity, { label: string; color: string; rank: number }> = {
  critical: { label: "Critical", color: "#ff4d5f", rank: 0 },
  high:     { label: "High",     color: "#ff8b3d", rank: 1 },
  medium:   { label: "Medium",   color: "#ffc53d", rank: 2 },
  low:      { label: "Low",      color: "#3fd68f", rank: 3 },
};
export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

/* ---------------- status ---------------- */

export const STATUS: Record<EventStatus, { label: string; color: string; pulse?: boolean }> = {
  escalating: { label: "Escalating", color: "#ff4d5f", pulse: true },
  active:     { label: "Active",     color: "#ff8b3d", pulse: true },
  monitoring: { label: "Monitoring", color: "#45b8ff" },
  contained:  { label: "Contained",  color: "#3fd68f" },
};

export const SOURCE_STATUS: Record<string, { label: string; color: string; pulse?: boolean }> = {
  healthy:  { label: "Healthy",  color: "#3fd68f" },
  degraded: { label: "Degraded", color: "#ffc53d", pulse: true },
  offline:  { label: "Offline",  color: "#ff4d5f" },
};

/* ---------------- event types ---------------- */

export const TYPE_META: Record<EventType, { label: string; Icon: LucideIcon }> = {
  wildfire:   { label: "Wildfire",   Icon: Flame },
  flood:      { label: "Flood",      Icon: Droplets },
  storm:      { label: "Storm",      Icon: CloudLightning },
  seismic:    { label: "Seismic",    Icon: Activity },
  volcanic:   { label: "Volcanic",   Icon: Mountain },
  heat:       { label: "Heat",       Icon: ThermometerSun },
  power:      { label: "Power",      Icon: Zap },
  industrial: { label: "Industrial", Icon: Factory },
  drought:    { label: "Drought",    Icon: SunDim },
};

/* ---------------- evidence kinds ---------------- */

export const KIND_META: Record<SourceKind, { label: string; Icon: LucideIcon }> = {
  satellite: { label: "Satellite", Icon: Satellite },
  sensor:    { label: "Sensor",    Icon: RadioTower },
  social:    { label: "Social",    Icon: MessagesSquare },
  news:      { label: "News",      Icon: Newspaper },
  official:  { label: "Official",  Icon: FileText },
  field:     { label: "Field",     Icon: Siren },
};

/* ---------------- formatting ---------------- */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function timeAgo(min: number): string {
  if (min < 1) return "just now";
  if (min < 60) return `${Math.round(min)}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const fmt = (n: number) => n.toLocaleString("en-US");
export const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function hexA(hex: string, a: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const coords = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;

export const AQ_COLORS = ["#3fd68f", "#ffc53d", "#ff8b3d", "#ff4d5f"];
