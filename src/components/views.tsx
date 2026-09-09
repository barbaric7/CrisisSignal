import { useMemo, useState } from "react";
import {
  MapPin, Link2, Satellite, RadioTower, MessagesSquare, Newspaper, FileText,
  Siren, Check, CheckCheck, Info, ChevronLeft, ChevronRight, Inbox,
} from "lucide-react";
import type { AlertItem, CrisisEvent, DataSource, SourceKind } from "../data/mock";
import { SEVERITY, TYPE_META, KIND_META, SOURCE_STATUS, cx, hexA, fmt, timeAgo, coords } from "../lib/meta";
import { Card, SevBadge, StatusPill, SourceStatusPill, Progress, Empty } from "./ui";
import { SearchBox } from "./chrome";

const KIND_ICON: Record<SourceKind, any> = {
  satellite: Satellite, sensor: RadioTower, social: MessagesSquare,
  news: Newspaper, official: FileText, field: Siren,
};

/* ============================================================
   Events table view
   ============================================================ */
export function EventsView(props: { events: CrisisEvent[]; onOpen: (id: string) => void }) {
  const { events, onOpen } = props;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "contained">("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events
      .filter((e) => (status === "all" ? true : status === "contained" ? e.status === "contained" : e.status !== "contained"))
      .filter((e) => !needle || `${e.name} ${e.location} ${e.country} ${e.code}`.toLowerCase().includes(needle))
      .sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank || a.updatedMinAgo - b.updatedMinAgo);
  }, [events, q, status]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Event register</h1>
          <p className="page-sub">All tracked situations across the public-data correlation pipeline</p>
        </div>
        <div className="page-actions">
          <SearchBox value={q} onChange={setQ} placeholder="Search events, locations, codes…" />
          {(["all", "open", "contained"] as const).map((s) => (
            <button key={s} className={cx("chip", status === s && "active")} onClick={() => setStatus(s)}>
              {s === "all" ? "All" : s === "open" ? "Open" : "Contained"}
            </button>
          ))}
        </div>
      </div>

      <Card bodyClass="tight">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th><th>Location</th><th>Severity</th><th>Status</th>
                <th style={{ width: 130 }}>Confidence</th><th>Sources</th><th>Updated</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const T = TYPE_META[e.type];
                return (
                  <tr key={e.id} className="clickable" onClick={() => onOpen(e.id)}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="cell-icon" style={{ color: SEVERITY[e.severity].color, background: hexA(SEVERITY[e.severity].color, 0.09), borderColor: hexA(SEVERITY[e.severity].color, 0.28) }}>
                          <T.Icon size={14} />
                        </span>
                        <div>
                          <div className="cell-main">{e.name}</div>
                          <div className="cell-sub mono">{e.code} · {T.label}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{e.location}</div>
                      <div className="cell-sub">{e.country} · <span className="mono">{coords(e.lat, e.lon)}</span></div>
                    </td>
                    <td><SevBadge sev={e.severity} /></td>
                    <td><StatusPill status={e.status} /></td>
                    <td>
                      <div className="meter-row">
                        <Progress value={e.confidence} color={e.confidence >= 80 ? "#3fd68f" : e.confidence >= 65 ? "#ffc53d" : "#ff8b3d"} />
                        <span className="val">{e.confidence}%</span>
                      </div>
                    </td>
                    <td className="mono">{e.sourcesCount}</td>
                    <td className="mono" style={{ color: "var(--text-2)" }}>{timeAgo(e.updatedMinAgo)}</td>
                    <td><ChevronRight size={14} style={{ color: "var(--text-3)" }} /></td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={8}><Empty icon={Inbox} title="No events match" hint="Adjust search or status filter." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <span>Showing {rows.length} of {events.length} tracked events</span>
          <div className="pager">
            <button title="Previous page"><ChevronLeft size={12} /></button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button title="Next page"><ChevronRight size={12} /></button>
          </div>
        </div>
      </Card>
    </>
  );
}

/* ============================================================
   Data sources view
   ============================================================ */
export function SourcesView({ sources }: { sources: DataSource[] }) {
  const counts = {
    total: sources.length,
    healthy: sources.filter((s) => s.status === "healthy").length,
    degraded: sources.filter((s) => s.status === "degraded").length,
    offline: sources.filter((s) => s.status === "offline").length,
  };
  const stats = [
    { l: "Total sources", v: counts.total, c: "var(--text)" },
    { l: "Reporting normally", v: counts.healthy, c: "var(--ok)" },
    { l: "Degraded", v: counts.degraded, c: "var(--warn)" },
    { l: "Offline", v: counts.offline, c: "var(--danger)" },
  ];
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Data sources</h1>
          <p className="page-sub">Ingest feeds powering detection, correlation and confidence scoring</p>
        </div>
        <div className="page-actions">
          <button className="btn primary"><Link2 size={14} /> Connect source</button>
        </div>
      </div>

      <div className="mini-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 14 }}>
        {stats.map((s) => (
          <div className="mini-stat" key={s.l}>
            <div className="l">{s.l}</div>
            <div className="v" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <Card bodyClass="tight">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Source</th><th>Category</th><th>Status</th><th>Ingest rate</th>
                <th>Last sync</th><th style={{ width: 160 }}>Uptime (30d)</th><th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => {
                const Icon = KIND_ICON[s.kind];
                const st = SOURCE_STATUS[s.status];
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="cell-icon"><Icon size={14} /></span>
                        <div>
                          <div className="cell-main">{s.name}</div>
                          <div className="cell-sub">{s.provider}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="tag">{s.category}</span></td>
                    <td><SourceStatusPill status={s.status} /></td>
                    <td className="mono" style={{ color: s.status === "offline" ? "var(--text-3)" : "var(--text)" }}>{s.ingest}</td>
                    <td className="mono" style={{ color: "var(--text-2)" }}>{timeAgo(s.lastSyncMin)}</td>
                    <td>
                      <div className="meter-row">
                        <Progress value={s.uptime} color={st.color} />
                        <span className="val">{s.uptime.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="muted">{s.coverage}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <span>{counts.total} feeds · 5 categories · aggregate ingest 5.7k msg/min</span>
          <div className="pager"><button className="active">1</button><button>2</button></div>
        </div>
      </Card>
    </>
  );
}

/* ============================================================
   Alerts view
   ============================================================ */
const ALERT_ICON: Record<string, any> = { critical: Siren, high: Info, medium: Info, low: Info };

export function AlertsView(props: {
  alerts: AlertItem[];
  onAck: (id: string) => void;
  onAckAll: () => void;
  onOpenEvent: (id: string) => void;
}) {
  const { alerts, onAck, onAckAll, onOpenEvent } = props;
  const [tab, setTab] = useState<"all" | "unacked">("all");
  const rows = alerts.filter((a) => (tab === "all" ? true : !a.acked));
  const unacked = alerts.filter((a) => !a.acked).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Alert stream</h1>
          <p className="page-sub">Escalations, threshold breaches and pipeline notifications</p>
        </div>
        <div className="page-actions">
          {(["all", "unacked"] as const).map((t) => (
            <button key={t} className={cx("chip", tab === t && "active")} onClick={() => setTab(t)}>
              {t === "all" ? `All (${alerts.length})` : `Unacknowledged (${unacked})`}
            </button>
          ))}
          <button className="btn" onClick={onAckAll} disabled={unacked === 0}><CheckCheck size={14} /> Acknowledge all</button>
        </div>
      </div>

      <Card bodyClass="tight">
        {rows.map((a) => {
          const c = SEVERITY[a.severity].color;
          const Icon = a.severity === "critical" ? Siren : a.severity === "high" ? Siren : Info;
          return (
            <div key={a.id} className={cx("alert-row", !a.acked && "unacked")} style={{ ["--sev" as any]: c }}>
              <div className="alert-icon" style={{ color: c, background: hexA(c, 0.1), borderColor: hexA(c, 0.32) }}>
                <Icon size={16} />
              </div>
              <div className="alert-body">
                <div className="alert-title" style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  {a.title}
                  <SevBadge sev={a.severity} subtle />
                  {a.acked && <span className="tag" style={{ color: "var(--ok)", borderColor: "rgba(63,214,143,.35)", background: "rgba(63,214,143,.08)" }}><Check size={10} /> ACK</span>}
                </div>
                <div className="alert-msg">{a.message}</div>
                <div className="alert-meta">
                  <span>{a.source}</span>
                  <span>{timeAgo(a.timeMinAgo)}</span>
                  {a.eventRef && <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => onOpenEvent(a.eventRef!)}>open event ↗</span>}
                </div>
              </div>
              <div className="alert-side">
                <button className={cx("btn sm", a.acked && "on")} onClick={() => onAck(a.id)} disabled={a.acked}>
                  <Check size={13} /> {a.acked ? "Acknowledged" : "Acknowledge"}
                </button>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <Empty icon={CheckCheck} title="Inbox zero" hint="No unacknowledged alerts right now." />}
      </Card>
    </>
  );
}
