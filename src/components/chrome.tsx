import {
  Bell, RefreshCw, MapPin, Layers, ShieldAlert, Clock, Search,
  Globe2, ListFilter, type LucideIcon,
} from "lucide-react";
import { cx } from "../lib/meta";

export type ViewName = "overview" | "events" | "sources" | "alerts";

/* ============================================================
   Top navigation
   ============================================================ */
export function TopNav(props: {
  view: ViewName;
  onNav: (v: ViewName) => void;
  eventCount: number;
  unacked: number;
  now: Date;
}) {
  const { view, onNav, eventCount, unacked, now } = props;
  const tabs: { id: ViewName; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "events", label: "Events", count: eventCount },
    { id: "sources", label: "Sources" },
    { id: "alerts", label: "Alerts", count: unacked },
  ];
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <div className="brand">
          {/* mark: thin scope ring, red sweep quarter, off-centre blip */}
          <svg className="brand-mark" viewBox="0 0 24 24" fill="none" aria-label="CrisisSignal">
            <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.4" opacity="0.42" />
            <path d="M12 3.6 A 8.4 8.4 0 0 1 20.4 12" stroke="#ff4d5f" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="10.1" cy="13.6" r="2.2" fill="#ff4d5f" />
          </svg>
          <div style={{ minWidth: 0 }}>
            <div className="brand-name"><span className="w1">Crisis</span><span className="w2">Signal</span></div>
            <div className="brand-sub">Public data disaster &amp; situation intelligence</div>
          </div>
        </div>

        <div className="nav-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={view === t.id}
              className={cx("nav-tab", view === t.id && "active")}
              onClick={() => onNav(t.id)}
            >
              <span className="tab-label">{t.label}</span>
              {typeof t.count === "number" && <span className="nav-count">{t.count}</span>}
            </button>
          ))}
        </div>

        <div className="topnav-right">
          <span className="live-pill"><i className="live-dot" />Live</span>
          <span className="clock" title="Coordinated Universal Time">{hh}:{mm}:{ss} UTC</span>
          <button className="icon-btn" title="Alerts" onClick={() => onNav("alerts")}>
            <Bell size={16} />
            {unacked > 0 && <span className="count">{unacked}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   Filter bar
   ============================================================ */
export interface Filters { region: string; type: string; severity: string; range: string; }
export const DEFAULT_FILTERS: Filters = { region: "all", type: "all", severity: "all", range: "24h" };

function Select(props: {
  icon: LucideIcon; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; title: string;
}) {
  const { icon: Icon, value, onChange, options, title } = props;
  return (
    <span className="select-wrap" title={title}>
      <Icon size={14} className="lead" />
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={title}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </span>
  );
}

export function FilterBar(props: {
  filters: Filters;
  onChange: (f: Filters) => void;
  regions: string[];
  types: { value: string; label: string }[];
  updatedSec: number;
  refreshing: boolean;
  onRefresh: () => void;
  resultCount: number;
}) {
  const { filters, onChange, regions, types, updatedSec, refreshing, onRefresh, resultCount } = props;
  const set = (k: keyof Filters) => (v: string) => onChange({ ...filters, [k]: v });
  return (
    <div className="filterbar">
      <span className="tag" style={{ padding: "6px 10px" }}><ListFilter size={12} /> Filters</span>
      <Select
        title="Location filter" icon={MapPin} value={filters.region} onChange={set("region")}
        options={[{ value: "all", label: "All locations" }, ...regions.map((r) => ({ value: r, label: r }))]}
      />
      <Select
        title="Event type filter" icon={Layers} value={filters.type} onChange={set("type")}
        options={[{ value: "all", label: "All event types" }, ...types]}
      />
      <Select
        title="Severity filter" icon={ShieldAlert} value={filters.severity} onChange={set("severity")}
        options={[
          { value: "all", label: "All severities" },
          { value: "critical", label: "Critical" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ]}
      />
      <Select
        title="Time window" icon={Clock} value={filters.range} onChange={set("range")}
        options={[
          { value: "24h", label: "Last 24 hours" },
          { value: "72h", label: "Last 72 hours" },
          { value: "7d", label: "Last 7 days" },
          { value: "30d", label: "Last 30 days" },
        ]}
      />
      <div className="spacer" />
      <span className="updated-note" style={{ color: "var(--text-2)" }}>{resultCount} events in window</span>
      <span className="updated-note">
        <RefreshCw size={12} className={refreshing ? "spin" : undefined} style={{ color: "var(--accent)" }} />
        updated {updatedSec}s ago
      </span>
      <button className="icon-btn" title="Refresh feeds" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw size={15} className={refreshing ? "spin" : undefined} />
      </button>
    </div>
  );
}

/* ============================================================
   Footer
   ============================================================ */
export function AppFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>CrisisSignal v2.4.1 · build 8f31c2e</span>
        <span className="dim">|</span>
        <span>Demonstration interface — all events, sources &amp; metrics are fictional sample data</span>
        <div className="r">
          <a href="#status">System status</a>
          <a href="#api">Data policy</a>
          <a href="#docs">Docs</a>
          <span style={{ color: "var(--text-2)" }}>All timestamps UTC</span>
        </div>
      </div>
    </footer>
  );
}

/* small helper reused by views */
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <span className="search-wrap">
      <Search size={14} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </span>
  );
}

export { Globe2 };
