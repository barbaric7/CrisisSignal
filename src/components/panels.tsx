import { useMemo, useState } from "react";
import {
  Activity, ShieldAlert, Server, Users, MapPin, ArrowUpRight, Bell, Share2,
  TrendingUp, History, PieChart as PieIcon, Map as MapIcon, Thermometer, Wind,
  Droplet, Gauge, Crosshair, ChevronRight, TrendingDown, Clock3,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Line as RLine, ComposedChart,
} from "recharts";
import type { CrisisEvent, DataSource, Severity, EventType } from "../data/mock";
import { defaultTimeline, trendSeries } from "../data/mock";
import { SEVERITY, SEVERITY_ORDER, TYPE_META, KIND_META, cx, hexA, fmt, compact, timeAgo, coords, AQ_COLORS } from "../lib/meta";
import { Card, SevBadge, StatusPill, SourceStatusPill, Progress, Sparkline, Empty } from "./ui";

/* ---------------- recharts dark tooltip ---------------- */
export function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="t">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey}>{p.name}: <b style={{ color: p.color ?? p.fill ?? "var(--text)" }}>{p.value}</b></div>
      ))}
    </div>
  );
}

/* ============================================================
   Summary stat cards
   ============================================================ */
const HEX_OF: Record<string, string> = {
  "var(--critical)": "#ff4d5f",
  "var(--high)": "#ff8b3d",
  "var(--ok)": "#3fd68f",
  "var(--info)": "#45b8ff",
  "var(--warn)": "#ffc53d",
};
const hexOf = (c: string) => HEX_OF[c] ?? c;

export function StatCards(props: { events: CrisisEvent[]; sources: DataSource[] }) {
  const { events, sources } = props;
  const highRisk = events.filter((e) => e.severity === "critical" || e.severity === "high");
  const escalating = events.filter((e) => e.status === "escalating");
  const fresh = events.filter((e) => e.updatedMinAgo <= 60).length;
  const healthy = sources.filter((s) => s.status === "healthy").length;
  const degraded = sources.filter((s) => s.status === "degraded").length;
  const offline = sources.filter((s) => s.status === "offline").length;
  const pop = events.reduce((a, e) => a + e.populationAtRisk, 0);
  const regions = new Set(events.map((e) => e.region)).size;
  const spark = useMemo(() => trendSeries(12, 5).map((d) => d.events), []);

  const cards = [
    {
      label: "Active events", value: fmt(events.length), sub: `${fresh} updated in last hour`,
      subColor: "var(--critical)", Icon: Activity, color: "var(--critical)", spark,
      SubIcon: TrendingUp,
    },
    {
      label: "High-risk areas", value: fmt(highRisk.length), sub: `${escalating.length} escalating today`,
      subColor: "var(--high)", Icon: ShieldAlert, color: "var(--high)",
      spark: spark.map((v, i) => Math.round(v * 0.45 + Math.sin(i) * 1.5 + 3)), SubIcon: TrendingUp,
    },
    {
      label: "Data sources", value: `${healthy}`, valueSuffix: ` / ${sources.length}`,
      sub: `${degraded} degraded · ${offline} offline`, subColor: degraded + offline > 0 ? "var(--warn)" : "var(--ok)",
      Icon: Server, color: "var(--ok)", spark: [9, 9, 8, 9, 7, 8, 8, 7, 8, 8, 7, 8], SubIcon: TrendingDown,
    },
    {
      label: "Population at risk", value: compact(pop), sub: `across ${regions} regions`,
      subColor: "var(--text-3)", Icon: Users, color: "var(--info)",
      spark: spark.map((v, i) => Math.round(v * 1.4 + i * 1.2)), SubIcon: TrendingUp,
    },
  ];

  return (
    <>
      {cards.map((c) => (
        <div className="card stat-card c3" key={c.label}>
          <div className="stat-top">
            <div>
              <div className="stat-label">{c.label}</div>
              <div className="stat-value">
                {c.value}
                {"valueSuffix" in c && c.valueSuffix ? <small> {c.valueSuffix}</small> : null}
              </div>
            </div>
            <div className="stat-tile" style={{ color: c.color, background: hexA(hexOf(c.color), 0.1), borderColor: hexA(hexOf(c.color), 0.3) }}>
              <c.Icon size={17} strokeWidth={2.2} />
            </div>
          </div>
          <div className="stat-sub">
            <c.SubIcon size={12} style={{ color: c.subColor }} />
            <span style={{ color: c.subColor }}>{c.sub}</span>
          </div>
          <Sparkline data={c.spark} color={hexOf(c.color)} />
        </div>
      ))}
    </>
  );
}

/* ============================================================
   Active situations list
   ============================================================ */
export function SituationsPanel(props: {
  events: CrisisEvent[]; selectedId: string | null;
  onSelect: (id: string) => void; onOpen: (id: string) => void; height: number;
}) {
  const { events, selectedId, onSelect, onOpen } = props;
  const sorted = [...events].sort(
    (a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank || a.updatedMinAgo - b.updatedMinAgo
  );
  return (
    <Card
      className="c4"
      title="Active situations"
      icon={MapIcon}
      actions={<span className="tag">{sorted.length} tracked</span>}
      bodyClass="tight"
      style={{ height: props.height }}
    >
      <div className="sit-list scroll" style={{ height: props.height - 46 }}>
        {sorted.length === 0 && <Empty icon={MapIcon} title="No situations in filter window" hint="Widen the time range or clear filters." />}
        {sorted.map((e) => {
          const T = TYPE_META[e.type];
          return (
            <button
              key={e.id}
              className={cx("sit-row", e.id === selectedId && "selected")}
              style={{ ["--sev" as any]: SEVERITY[e.severity].color }}
              onClick={() => onSelect(e.id)}
              onDoubleClick={() => onOpen(e.id)}
            >
              <div className="sit-head">
                <div className="sit-name">{e.name}</div>
                <SevBadge sev={e.severity} />
              </div>
              <div className="sit-loc"><MapPin size={11} /> {e.location} · {e.country}</div>
              <div className="sit-meta">
                <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><T.Icon size={11} /> {T.label}</span>
                <span>conf <b>{e.confidence}%</b></span>
                <span><b>{e.sourcesCount}</b> sources</span>
                <span style={{ marginLeft: "auto" }}>{timeAgo(e.updatedMinAgo)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================================================
   Selected situation focus card
   ============================================================ */
export function FocusCard(props: {
  event: CrisisEvent | null;
  onOpen: (id: string) => void;
  subscribed: boolean;
  onSubscribe: () => void;
}) {
  const { event, onOpen, subscribed, onSubscribe } = props;
  if (!event) {
    return (
      <Card className="c5" title="Situation focus" icon={Crosshair}>
        <Empty icon={Crosshair} title="No situation selected" hint="Pick a marker on the map or a row in Active situations." />
      </Card>
    );
  }
  const e = event;
  return (
    <Card
      className="c5"
      title="Situation focus"
      icon={Crosshair}
      actions={<><SevBadge sev={e.severity} /><StatusPill status={e.status} /></>}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
        <div style={{ font: "800 15.5px/1.3 var(--font)", letterSpacing: "-0.01em" }}>{e.name}</div>
        <span className="mono dim" style={{ fontSize: 11 }}>{e.code}</span>
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 4, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <MapPin size={12} /> {e.location}, {e.country}
        <span className="mono dim" style={{ fontSize: 11 }}>· {coords(e.lat, e.lon)}</span>
      </div>

      <div className="wx-grid" style={{ marginTop: 12 }}>
        <div className="wx-tile">
          <div className="wx-label">Confidence</div>
          <div className="wx-value" style={{ color: e.confidence >= 80 ? "var(--ok)" : e.confidence >= 65 ? "var(--warn)" : "var(--high)" }}>
            {e.confidence}<small>%</small>
          </div>
          <div style={{ marginTop: 7 }}><Progress value={e.confidence} color={e.confidence >= 80 ? "#3fd68f" : e.confidence >= 65 ? "#ffc53d" : "#ff8b3d"} /></div>
        </div>
        <div className="wx-tile">
          <div className="wx-label">Evidence items</div>
          <div className="wx-value">{e.evidence.length}</div>
          <div className="dim" style={{ fontSize: 10.5, marginTop: 6 }}>{e.sourcesCount} contributing sources</div>
        </div>
        <div className="wx-tile">
          <div className="wx-label">Affected radius</div>
          <div className="wx-value">{fmt(e.affectedRadiusKm)}<small> km</small></div>
          <div className="dim" style={{ fontSize: 10.5, marginTop: 6 }}>modelled extent</div>
        </div>
        <div className="wx-tile">
          <div className="wx-label">Population at risk</div>
          <div className="wx-value">{e.populationAtRisk ? compact(e.populationAtRisk) : "—"}</div>
          <div className="dim" style={{ fontSize: 10.5, marginTop: 6 }}>within impact zone</div>
        </div>
      </div>

      <div className="card-title" style={{ margin: "14px 0 4px" }}>Supporting evidence</div>
      <div style={{ margin: "0 -15px" }}>
        {e.evidence.slice(0, 3).map((ev, i) => {
          const K = KIND_META[ev.kind];
          return (
            <div className="ev-row" key={i}>
              <div className="ev-icon"><K.Icon size={14} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ev-text">{ev.text}</div>
                <div className="ev-src">{K.label} · {ev.source}</div>
              </div>
              <div className="ev-time">{ev.time}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
        <button className="btn primary sm" onClick={() => onOpen(e.id)}>Open full dossier <ArrowUpRight size={13} /></button>
        <button className={cx("btn sm", subscribed && "on")} onClick={onSubscribe}>
          <Bell size={13} /> {subscribed ? "Subscribed" : "Subscribe"}
        </button>
        <button className="btn sm"><Share2 size={13} /> Share</button>
      </div>
    </Card>
  );
}

/* ============================================================
   Weather & sensors
   ============================================================ */
export function WeatherPanel({ event, className = "c3" }: { event: CrisisEvent | null; className?: string }) {
  if (!event) return <Card className={className} title="Weather & sensors" icon={Wind}><Empty icon={Wind} title="No selection" /></Card>;
  const w = event.weather;
  const tiles = [
    { l: "Temperature", Icon: Thermometer, v: `${w.tempC}`, u: "°C", color: w.tempC >= 40 ? "var(--high)" : "var(--text)" },
    { l: "Wind speed", Icon: Wind, v: `${w.windKmh}`, u: "km/h", color: w.windKmh >= 60 ? "var(--high)" : "var(--text)" },
    { l: "Humidity", Icon: Droplet, v: `${w.humidity}`, u: "%", color: "var(--text)" },
    { l: "Air quality", Icon: Gauge, v: w.airQuality, u: "", color: AQ_COLORS[w.aqLevel] },
  ];
  const pct = (w.sensorsOnline / w.sensorsTotal) * 100;
  const advisories: { text: string; color: string }[] = [];
  if (w.aqLevel >= 2) advisories.push({ text: "Air-quality health warning", color: AQ_COLORS[w.aqLevel] });
  if (w.windKmh >= 60) advisories.push({ text: "High-wind warning", color: "#ff8b3d" });
  if (w.tempC >= 40) advisories.push({ text: "Extreme heat warning", color: "#ff8b3d" });
  if (event.severity === "critical" || event.status === "escalating")
    advisories.push({ text: "Evacuation advisory — impact zones", color: "#ff4d5f" });
  if (event.type === "flood" || event.type === "storm")
    advisories.push({ text: "Flash-flood watch in effect", color: "#ffc53d" });
  if (!advisories.length) advisories.push({ text: "No active advisories", color: "#3fd68f" });
  const tempTrend = Array.from({ length: 12 }, (_, i) => Math.round(w.tempC - 5 + Math.sin((i / 11) * Math.PI) * 6));

  return (
    <Card className={className} title="Weather & sensors" icon={Wind} actions={<span className="tag">{event.code}</span>}>
      <div className="wx-grid">
        {tiles.map((t) => (
          <div className="wx-tile" key={t.l}>
            <div className="wx-label"><t.Icon size={12} /> {t.l}</div>
            <div className="wx-value" style={{ color: t.color }}>{t.v}{t.u && <small> {t.u}</small>}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
          <span className="muted" style={{ fontWeight: 600 }}>Local sensor mesh</span>
          <span className="mono" style={{ color: pct > 80 ? "var(--ok)" : "var(--warn)", fontSize: 11 }}>{w.sensorsOnline}/{w.sensorsTotal} reporting</span>
        </div>
        <Progress value={pct} color={pct > 80 ? "#3fd68f" : "#ffc53d"} />
      </div>

      <div className="card-title" style={{ margin: "15px 0 7px" }}>Advisories in effect</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {advisories.slice(0, 3).map((a) => (
          <div key={a.text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
            <i style={{ width: 7, height: 7, borderRadius: 2, background: a.color, flex: "none" }} />
            {a.text}
          </div>
        ))}
      </div>

      <div className="card-title" style={{ margin: "15px 0 2px" }}>Temp trend (24 h)</div>
      <Sparkline data={tempTrend} color="#ff8b3d" height={40} />
      <div className="kv" style={{ marginTop: 6 }}>
        <span className="k">Peak gust (24 h)</span>
        <span className="v">{Math.round(w.windKmh * 1.6)} km/h</span>
      </div>
      <div className="kv">
        <span className="k">Precipitation (24 h)</span>
        <span className="v">{event.type === "flood" || event.type === "storm" ? `${38 + (w.humidity % 20)} mm` : `${w.humidity % 5} mm`}</span>
      </div>
    </Card>
  );
}

/* ============================================================
   Event timeline
   ============================================================ */
export function TimelineCard({ event, className = "c5" }: { event: CrisisEvent | null; className?: string }) {
  if (!event) return <Card className={className} title="Event timeline" icon={History}><Empty icon={History} title="No selection" /></Card>;
  const items = defaultTimeline(event);
  return (
    <Card className={className} title="Event timeline" icon={History} actions={<span className="tag">{event.code}</span>}>
      <div className="timeline">
        {items.map((t, i) => (
          <div className="tl-item" key={i}>
            <div className="tl-time">{t.time}</div>
            <div className="tl-rail">
              <span className="tl-dot" style={{ color: t.sev ? SEVERITY[t.sev].color : "var(--accent)" }} />
              <span className="tl-line" />
            </div>
            <div>
              <div className="tl-label">{t.label}</div>
              {t.detail && <div className="tl-detail">{t.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================
   Trend chart (events per day)
   ============================================================ */
export function TrendCard({ className = "c4", title = "Events per day" }: { className?: string; title?: string }) {
  const [days, setDays] = useState(7);
  const data = useMemo(() => trendSeries(days, 3), [days]);
  const total = data.reduce((a, d) => a + d.events, 0);
  const peak = data.reduce((a, d) => (d.events > a.events ? d : a), data[0]);
  const delta = data.length > 1 ? Math.round(((data[data.length - 1].events - data[0].events) / Math.max(1, data[0].events)) * 100) : 0;
  return (
    <Card
      className={className}
      title={title}
      icon={TrendingUp}
      bodyStyle={{ display: "flex", flexDirection: "column", flex: 1 }}
      actions={(
        <div style={{ display: "flex", gap: 5 }}>
          {[7, 14, 30].map((d) => (
            <button key={d} className={cx("chip", days === d && "active")} style={{ padding: "4px 9px", fontSize: 11 }} onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      )}
    >
      <div style={{ flex: 1, minHeight: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="#18222e" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#5d6b7e", fontSize: 10.5, fontFamily: "JetBrains Mono, monospace" }} axisLine={{ stroke: "#1d2634" }} tickLine={false} interval={days === 30 ? 4 : 0} />
            <YAxis tick={{ fill: "#5d6b7e", fontSize: 10.5, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(69,184,255,0.06)" }} />
            <Bar dataKey="events" name="events" radius={[4, 4, 0, 0]} maxBarSize={26}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.events >= 18 ? "#ff4d5f" : d.events >= 15 ? "#ff8b3d" : "#2f7ff0"} fillOpacity={0.85} />
              ))}
            </Bar>
            <RLine type="monotone" dataKey="alerts" name="alerts" stroke="#ffc53d" strokeWidth={1.8} dot={false} strokeDasharray="4 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 10.5, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
        <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#2f7ff0", marginRight: 5 }} />events detected</span>
        <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#ffc53d", marginRight: 5 }} />alerts raised</span>
      </div>
      <div className="mini-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: 11 }}>
        <div className="mini-stat">
          <div className="l">Total ({days}d)</div>
          <div className="v" style={{ fontSize: 16 }}>{total}</div>
        </div>
        <div className="mini-stat">
          <div className="l">Peak day</div>
          <div className="v" style={{ fontSize: 16, color: "var(--critical)" }}>{peak.day}</div>
        </div>
        <div className="mini-stat">
          <div className="l">Trend</div>
          <div className="v" style={{ fontSize: 16, color: delta >= 0 ? "var(--critical)" : "var(--ok)" }}>
            {delta >= 0 ? "+" : ""}{delta}%
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   Analytics: severity donut + type mix
   ============================================================ */
export function AnalyticsCard({ events, className = "c4" }: { events: CrisisEvent[]; className?: string }) {
  const sevData = SEVERITY_ORDER.map((s) => ({
    name: SEVERITY[s].label, value: events.filter((e) => e.severity === s).length, color: SEVERITY[s].color,
  })).filter((d) => d.value > 0);

  const typeCounts = useMemo(() => {
    const m = new Map<EventType, number>();
    events.forEach((e) => m.set(e.type, (m.get(e.type) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [events]);
  const maxT = Math.max(1, ...typeCounts.map((t) => t[1]));

  return (
    <Card className={className} title="Severity & type mix" icon={PieIcon} actions={<span className="tag">{events.length} events</span>}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}>
        <div style={{ position: "relative", width: 148, height: 148 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sevData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={64} paddingAngle={3} strokeWidth={0}>
                {sevData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.9} />)}
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ font: "800 21px/1 var(--font)" }}>{events.length}</div>
              <div className="dim" style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>tracked</div>
            </div>
          </div>
        </div>
        <div>
          {typeCounts.map(([type, n]) => {
            const T = TYPE_META[type];
            return (
              <div className="bar-row" key={type} style={{ gridTemplateColumns: "86px 1fr 26px" }}>
                <span className="l" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><T.Icon size={12} style={{ color: "var(--text-3)" }} />{T.label}</span>
                <Progress value={(n / maxT) * 100} color="#45b8ff" height={6} />
                <span className="v">{n}</span>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            {sevData.map((d) => (
              <span key={d.name} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-2)", fontFamily: "var(--mono)" }}>
                <i style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />{d.name} {d.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   Feed health mini panel
   ============================================================ */
export function FeedHealthCard({ sources, className = "c3", onOpen }: { sources: DataSource[]; className?: string; onOpen: () => void }) {
  const top = [...sources].sort((a, b) => a.lastSyncMin - b.lastSyncMin).slice(0, 6);
  return (
    <Card
      className={className}
      title="Feed health"
      icon={Server}
      actions={<button className="btn sm" onClick={onOpen} style={{ padding: "4px 8px" }}>All <ChevronRight size={12} /></button>}
      bodyClass="tight"
    >
      <div>
        {top.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 15px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "600 12px var(--font)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
              <div className="mono dim" style={{ fontSize: 10, marginTop: 1 }}>{s.ingest} · sync {timeAgo(s.lastSyncMin)}</div>
            </div>
            <SourceStatusPill status={s.status} />
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 15px", display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--text-3)" }}>
        <Clock3 size={12} /> Pipeline lag <b className="mono" style={{ color: "var(--text-2)" }}>1.8 s</b> · queue <b className="mono" style={{ color: "var(--text-2)" }}>412</b>
      </div>
    </Card>
  );
}
