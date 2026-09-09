import { useEffect, useMemo, useState } from "react";
import { Globe2, Map as MapIcon } from "lucide-react";
import { EVENTS, SOURCES, ALERTS, RANGE_MIN, type AlertItem, type CrisisEvent } from "./data/mock";
import { SEVERITY, SEVERITY_ORDER, TYPE_META } from "./lib/meta";
import { TopNav, FilterBar, AppFooter, DEFAULT_FILTERS, type Filters, type ViewName } from "./components/chrome";
import { EventMap } from "./components/EventMap";
import {
  StatCards, SituationsPanel, FocusCard, WeatherPanel, TimelineCard,
  TrendCard, AnalyticsCard, FeedHealthCard,
} from "./components/panels";
import { EventsView, SourcesView, AlertsView } from "./components/views";
import { DetailView } from "./components/DetailView";
import { Card } from "./components/ui";

type View = { name: ViewName } | { name: "detail"; id: string };

const MAP_H = 470;
const ROW_H = MAP_H + 46;

export default function App() {
  const [view, setView] = useState<View>({ name: "overview" });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(EVENTS[0].id);
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS);
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => new Date());
  const [refreshedAt, setRefreshedAt] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);

  /* ticking UTC clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* filtering */
  const filtered = useMemo<CrisisEvent[]>(
    () =>
      EVENTS.filter(
        (e) =>
          (filters.region === "all" || e.region === filters.region) &&
          (filters.type === "all" || e.type === filters.type) &&
          (filters.severity === "all" || e.severity === filters.severity) &&
          e.updatedMinAgo <= (RANGE_MIN[filters.range] ?? Infinity)
      ),
    [filters]
  );

  const focus = useMemo(
    () => filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );
  const focusId = focus?.id ?? null;

  const regions = useMemo(() => [...new Set(EVENTS.map((e) => e.region))].sort(), []);
  const typeOptions = useMemo(
    () => (Object.keys(TYPE_META) as (keyof typeof TYPE_META)[]).map((k) => ({ value: k, label: TYPE_META[k].label })),
    []
  );

  const unacked = alerts.filter((a) => !a.acked).length;
  const updatedSec = Math.max(0, Math.floor((now.getTime() - refreshedAt) / 1000));

  const nav = (v: ViewName) => setView({ name: v });
  const openDetail = (id: string) => { setSelectedId(id); setView({ name: "detail", id }); };
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshedAt(Date.now()); setRefreshing(false); }, 900);
  };
  const toggleSubscribe = (id: string) =>
    setSubscribed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const detailEvent = view.name === "detail" ? EVENTS.find((e) => e.id === view.id) ?? null : null;

  return (
    <div className="app">
      <TopNav
        view={view.name === "detail" ? "events" : view.name}
        onNav={nav}
        eventCount={EVENTS.length}
        unacked={unacked}
        now={now}
      />

      <main className="container">
        {view.name === "overview" && (
          <>
            <FilterBar
              filters={filters}
              onChange={setFilters}
              regions={regions}
              types={typeOptions}
              updatedSec={updatedSec}
              refreshing={refreshing}
              onRefresh={refresh}
              resultCount={filtered.length}
            />

            <div className="grid">
              <StatCards events={filtered} sources={SOURCES} />
            </div>

            <div className="grid">
              <Card
                className="c8"
                title="Live event map"
                icon={Globe2}
                style={{ height: ROW_H }}
                bodyClass="tight"
                actions={(
                  <>
                    <div className="map-legend">
                      {SEVERITY_ORDER.map((s) => (
                        <span className="li" key={s}>
                          <i style={{ background: SEVERITY[s].color }} />{SEVERITY[s].label}
                        </span>
                      ))}
                    </div>
                    <span className="tag">{filtered.length} plotted</span>
                  </>
                )}
              >
                <EventMap
                  events={filtered}
                  selectedId={focusId}
                  onSelect={setSelectedId}
                  onOpen={openDetail}
                  height={MAP_H}
                />
              </Card>

              <SituationsPanel
                events={filtered}
                selectedId={focusId}
                onSelect={setSelectedId}
                onOpen={openDetail}
                height={ROW_H}
              />
            </div>

            <div className="grid">
              <FocusCard
                event={focus}
                onOpen={openDetail}
                subscribed={focusId ? subscribed.has(focusId) : false}
                onSubscribe={() => focusId && toggleSubscribe(focusId)}
              />
              <WeatherPanel event={focus} className="c3" />
              <TrendCard className="c4" />
            </div>

            <div className="grid">
              <TimelineCard event={focus} className="c5" />
              <AnalyticsCard events={filtered} className="c4" />
              <FeedHealthCard sources={SOURCES} className="c3" onOpen={() => nav("sources")} />
            </div>
          </>
        )}

        {view.name === "events" && <EventsView events={EVENTS} onOpen={openDetail} />}
        {view.name === "sources" && <SourcesView sources={SOURCES} />}
        {view.name === "alerts" && (
          <AlertsView
            alerts={alerts}
            onAck={(id) => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acked: true } : a)))}
            onAckAll={() => setAlerts((prev) => prev.map((a) => ({ ...a, acked: true })))}
            onOpenEvent={openDetail}
          />
        )}
        {view.name === "detail" && detailEvent && (
          <DetailView event={detailEvent} onBack={() => nav("overview")} onBackEvents={() => nav("events")} />
        )}
        {view.name === "detail" && !detailEvent && (
          <Card title="Event not found" icon={MapIcon}>
            <p className="muted">The requested event is no longer in the register.</p>
            <button className="btn primary" onClick={() => nav("overview")}>Back to overview</button>
          </Card>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
