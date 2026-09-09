import { useState } from "react";
import {
  MapPin, CalendarDays, Bell, Share2, Download, ChevronRight, FileWarning,
  RadioTower,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { CrisisEvent } from "../data/mock";
import { defaultTimeline, trendSeries } from "../data/mock";
import { SEVERITY, TYPE_META, KIND_META, cx, hexA, fmt, coords, timeAgo } from "../lib/meta";
import { Card, SevBadge, StatusPill, Progress } from "./ui";
import { FocusMap } from "./EventMap";
import { WeatherPanel, TimelineCard, ChartTip } from "./panels";

export function DetailView(props: {
  event: CrisisEvent;
  onBack: () => void;
  onBackEvents: () => void;
}) {
  const { event: e, onBack, onBackEvents } = props;
  const [subscribed, setSubscribed] = useState(false);
  const T = TYPE_META[e.type];
  const series = trendSeries(14, e.code.length + 2);

  const contributions = [
    { l: "Satellite", v: 34 }, { l: "Sensor", v: 26 }, { l: "Social", v: 22 },
    { l: "Official", v: 12 }, { l: "News", v: 6 },
  ];

  return (
    <>
      <div className="breadcrumb">
        <button onClick={onBack}>Overview</button>
        <ChevronRight size={12} className="sep" />
        <button onClick={onBackEvents}>Events</button>
        <ChevronRight size={12} className="sep" />
        <span className="here">{e.name}</span>
      </div>

      {/* hero */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="hero">
          <div style={{ minWidth: 0 }}>
            <h1>
              <span className="cell-icon" style={{ width: 38, height: 38, color: SEVERITY[e.severity].color, background: hexA(SEVERITY[e.severity].color, 0.1), borderColor: hexA(SEVERITY[e.severity].color, 0.3) }}>
                <T.Icon size={17} />
              </span>
              {e.name}
              <SevBadge sev={e.severity} />
              <StatusPill status={e.status} />
            </h1>
            <div className="meta">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> {e.location}, {e.country}</span>
              <span className="mono">{coords(e.lat, e.lon)}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CalendarDays size={13} /> detected {e.detectedAt}</span>
              <span className="tag">{e.code}</span>
              <span className="tag">cadence 15 min</span>
            </div>
          </div>
          <div className="hero-actions">
            <button className={cx("btn", subscribed && "on")} onClick={() => setSubscribed((s) => !s)}>
              <Bell size={14} /> {subscribed ? "Subscribed" : "Subscribe"}
            </button>
            <button className="btn"><Share2 size={14} /> Share</button>
            <button className="btn"><Download size={14} /> Export</button>
          </div>
        </div>
        <div className="hero-stats">
          {[
            { l: "Confidence score", v: `${e.confidence}%` },
            { l: "Evidence items", v: fmt(e.evidence.length) },
            { l: "Affected radius", v: `${fmt(e.affectedRadiusKm)} km` },
            { l: "Population at risk", v: e.populationAtRisk ? fmt(e.populationAtRisk) : "—" },
            { l: "Sources reporting", v: fmt(e.sourcesCount) },
          ].map((s) => (
            <div className="mini-stat" key={s.l}>
              <div className="l">{s.l}</div>
              <div className="v">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* map + weather + impact */}
      <div className="grid">
        <Card className="c8" title="Focused extent — impact modelling" icon={RadioTower}
          actions={<span className="tag">ring ≈ {fmt(e.affectedRadiusKm)} km</span>}
          bodyClass="tight" bodyStyle={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <FocusMap event={e} height="100%" />
        </Card>
        <div className="c4" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WeatherPanel event={e} className="" />
          <Card title="Impact summary" icon={FileWarning}>
            <div className="kv"><span className="k">Correlation ID</span><span className="v">{e.code}-X9</span></div>
            <div className="kv"><span className="k">First detection</span><span className="v">{e.detectedAt.split("·")[1]?.trim() ?? "—"}</span></div>
            <div className="kv"><span className="k">Last update</span><span className="v">{timeAgo(e.updatedMinAgo)}</span></div>
            <div className="kv"><span className="k">Model confidence</span><span className="v" style={{ color: e.confidence >= 80 ? "var(--ok)" : "var(--warn)" }}>{e.confidence}%</span></div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                <span className="muted" style={{ fontWeight: 600 }}>Containment / resolution</span>
                <span className="mono" style={{ fontSize: 11 }}>{e.status === "contained" ? "82%" : e.status === "escalating" ? "8%" : "34%"}</span>
              </div>
              <Progress value={e.status === "contained" ? 82 : e.status === "escalating" ? 8 : 34} color={e.status === "contained" ? "#3fd68f" : e.status === "escalating" ? "#ff4d5f" : "#ffc53d"} />
            </div>
          </Card>
        </div>
      </div>

      {/* evidence + timeline */}
      <div className="grid">
        <Card className="c7" title="Evidence log" icon={FileWarning}
          actions={<span className="tag">{e.evidence.length} items · {e.sourcesCount} sources</span>} bodyClass="tight">
          {e.evidence.map((ev, i) => {
            const K = KIND_META[ev.kind];
            return (
              <div className="ev-row" key={i}>
                <div className="ev-icon"><K.Icon size={14} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ev-text">{ev.text}</div>
                  <div className="ev-src">{K.label} · {ev.source}</div>
                </div>
                <div className="ev-time mono">{ev.time}</div>
              </div>
            );
          })}
        </Card>
        <TimelineCard event={e} className="c5" />
      </div>

      {/* regional trend + contributions */}
      <div className="grid">
        <Card className="c7" title="Regional activity (14d)" icon={RadioTower}
          actions={<span className="tag">{e.region}</span>}>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={series} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SEVERITY[e.severity].color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={SEVERITY[e.severity].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#18222e" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#5d6b7e", fontSize: 10.5, fontFamily: "JetBrains Mono, monospace" }} axisLine={{ stroke: "#1d2634" }} tickLine={false} />
              <YAxis tick={{ fill: "#5d6b7e", fontSize: 10.5, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="events" name="signals" stroke={SEVERITY[e.severity].color} strokeWidth={2} fill="url(#dg)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="c5" title="Source contributions" icon={RadioTower}>
          {contributions.map((c) => (
            <div className="bar-row" key={c.l} style={{ gridTemplateColumns: "80px 1fr 38px" }}>
              <span className="l">{c.l}</span>
              <Progress value={c.v} color="#45b8ff" height={6} />
              <span className="v">{c.v}%</span>
            </div>
          ))}
          <div className="dim" style={{ fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
            Confidence weighting is recomputed on every ingest cycle; degraded feeds are
            down-weighted automatically until sync latency returns to SLA.
          </div>
        </Card>
      </div>
    </>
  );
}
