import { useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule10, geoGraticule } from "d3-geo";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";
import { Plus, Minus, Maximize2, Crosshair } from "lucide-react";
import type { CrisisEvent } from "../data/mock";
import { SEVERITY, hexA, coords, fmt } from "../lib/meta";

const W = 960, H = 520;
const world = worldData as any;

const MARKER_R: Record<string, number> = { critical: 5.2, high: 4.4, medium: 3.7, low: 3.1 };

/* shared, computed once */
const countries = feature(world, world.objects.countries) as any;

function useGeo() {
  return useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" } as any);
    const path = geoPath(projection);
    return {
      projection,
      sphere: path({ type: "Sphere" } as any) || "",
      grat: path(geoGraticule10()) || "",
      land: countries.features.map((f: any) => path(f) || ""),
    };
  }, []);
}

/* ============================================================
   Interactive world map (overview)
   ============================================================ */
export function EventMap(props: {
  events: CrisisEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  height?: number;
}) {
  const { events, selectedId, onSelect, onOpen, height = 480 } = props;
  const { projection, sphere, grat, land } = useGeo();
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ k: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [readout, setReadout] = useState<string | null>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  /* client px -> viewBox coords (preserveAspectRatio: meet) */
  const toSvg = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const s = Math.min(rect.width / W, rect.height / H);
    const ox = (rect.width - W * s) / 2, oy = (rect.height - H * s) / 2;
    return [(clientX - rect.left - ox) / s, (clientY - rect.top - oy) / s, s] as const;
  };

  const zoomAt = (mx: number, my: number, factor: number) =>
    setT((p) => {
      const k = Math.min(9, Math.max(1, p.k * factor));
      const f = k / p.k;
      const x = k === 1 ? 0 : mx - f * (mx - p.x);
      const y = k === 1 ? 0 : my - f * (my - p.y);
      return { k, x, y };
    });

  /* non-passive wheel zoom */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [mx, my] = toSvg(e.clientX, e.clientY);
      zoomAt(mx, my, Math.exp(-e.deltaY * 0.0016));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* drag pan with window-level listeners */
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const s = Math.min(rect.width / W, rect.height / H);
      const dx = (e.clientX - d.sx) / s, dy = (e.clientY - d.sy) / s;
      if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 4) d.moved = true;
      setT((p) => ({ ...p, x: p.k === 1 ? 0 : d.ox + dx, y: p.k === 1 ? 0 : d.oy + dy }));
    };
    const up = () => {
      suppressClick.current = !!drag.current?.moved;
      setTimeout(() => (suppressClick.current = false), 0);
      setDragging(false);
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);

  const onPointerMove = (e: React.PointerEvent) => {
    const [mx, my] = toSvg(e.clientX, e.clientY);
    const ll = projection.invert ? projection.invert([(mx - t.x) / t.k, (my - t.y) / t.k]) : null;
    setReadout(ll && isFinite(ll[0]) ? coords(ll[1], ll[0]) : null);
  };

  const selected = events.find((e) => e.id === selectedId) ?? null;
  const hovered = events.find((e) => e.id === hover) ?? null;

  return (
    <div className="map-wrap" ref={wrapRef} style={{ height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className={dragging ? "dragging" : ""}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          drag.current = { sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y, moved: false };
          setDragging(true);
        }}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setReadout(null)}
      >
        <defs>
          <radialGradient id="ocean" cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor="#0e1723" />
            <stop offset="100%" stopColor="#0a0f16" />
          </radialGradient>
        </defs>

        <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
          <path d={sphere} fill="url(#ocean)" stroke="#1c2836" strokeWidth={1 / t.k} />
          <path d={grat} fill="none" stroke="#15202d" strokeWidth={0.6 / t.k} />
          {land.map((d, i) => (
            <path key={i} d={d} fill="#18222f" stroke="#243244" strokeWidth={0.7 / t.k} strokeLinejoin="round" />
          ))}
        </g>

        {/* markers (screen-space, constant size) */}
        <g>
          {events.map((ev) => {
            const p = projection([ev.lon, ev.lat]);
            if (!p) return null;
            const sx = p[0] * t.k + t.x, sy = p[1] * t.k + t.y;
            if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) return null;
            const c = SEVERITY[ev.severity].color;
            const r = MARKER_R[ev.severity];
            const isSel = ev.id === selectedId;
            const live = ev.status === "active" || ev.status === "escalating";
            return (
              <g
                key={ev.id}
                transform={`translate(${sx},${sy})`}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (suppressClick.current) return;
                  onSelect(ev.id);
                }}
                onDoubleClick={(e) => { e.stopPropagation(); onOpen(ev.id); }}
                onPointerEnter={() => setHover(ev.id)}
                onPointerLeave={() => setHover(null)}
              >
                {live && <circle className="marker-pulse" r={r + 3} fill={hexA(c, 0.5)} />}
                {isSel && (
                  <circle r={r + 7} fill="none" stroke={hexA(c, 0.75)} strokeWidth={1.2} strokeDasharray="3 3">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={r + 3.5} fill={hexA(c, 0.16)} />
                <circle className="marker-core" r={hover === ev.id ? r + 1.2 : r} fill={c} stroke="#0a0f16" strokeWidth={1.4} />
              </g>
            );
          })}
        </g>
      </svg>

      {/* tooltip */}
      {hovered && (() => {
        const p = projection([hovered.lon, hovered.lat]);
        if (!p) return null;
        const sx = p[0] * t.k + t.x, sy = p[1] * t.k + t.y;
        return (
          <div className="map-tooltip" style={{ left: `${(sx / W) * 100}%`, top: `${(sy / H) * 100}%` }}>
            <div className="tt-name">{hovered.name}</div>
            <div className="tt-loc">{hovered.location} · {hovered.country}</div>
            <div className="tt-row"><span>severity</span><span style={{ color: SEVERITY[hovered.severity].color }}>{SEVERITY[hovered.severity].label.toUpperCase()}</span></div>
            <div className="tt-row"><span>confidence</span><span>{hovered.confidence}%</span></div>
            <div className="tt-row"><span>sources</span><span>{hovered.sourcesCount}</span></div>
            <div className="tt-row"><span>radius</span><span>{fmt(hovered.affectedRadiusKm)} km</span></div>
          </div>
        );
      })()}

      {/* zoom controls */}
      <div className="map-ctrl">
        <button className="icon-btn" title="Zoom in" onClick={() => zoomAt(W / 2, H / 2, 1.5)}><Plus size={15} /></button>
        <button className="icon-btn" title="Zoom out" onClick={() => zoomAt(W / 2, H / 2, 1 / 1.5)}><Minus size={15} /></button>
        <button className="icon-btn" title="Reset view" onClick={() => setT({ k: 1, x: 0, y: 0 })}><Maximize2 size={14} /></button>
        {selected && (
          <button
            className="icon-btn"
            title="Center on selected event"
            onClick={() => {
              const p = projection([selected.lon, selected.lat]);
              if (!p) return;
              const k = 3.2;
              setT({ k, x: W / 2 - p[0] * k, y: H / 2 - p[1] * k });
            }}
          >
            <Crosshair size={15} />
          </button>
        )}
      </div>

      {/* bottom-left overlays */}
      <div className="map-overlay-bl">
        {selected && (
          <div className="map-chip">
            <span className="dot" style={{ background: SEVERITY[selected.severity].color }} />
            {selected.location}
            <span className="dim" style={{ fontSize: 10 }}>selected</span>
          </div>
        )}
        <div className="map-readout">{readout ?? "— cursor position —"}</div>
      </div>

      <div className="map-attr">Natural Earth · demo data only</div>
    </div>
  );
}

/* ============================================================
   Focused map (event dossier) — centered projection + impact ring
   ============================================================ */
export function FocusMap({ event, height = 380 }: { event: CrisisEvent; height?: number | string }) {
  const geo = useMemo(() => {
    /* adaptive zoom: pick a scale where the impact ring renders ~92 px */
    const rDeg = Math.max(event.affectedRadiusKm / (111.32 * Math.cos((event.lat * Math.PI) / 180)), 0.04);
    const scale = Math.min(60000, Math.max(500, 92 / (rDeg * 0.01747)));
    const projection = geoNaturalEarth1()
      .rotate([-event.lon, -event.lat])
      .scale(scale)
      .translate([W / 2, H / 2]);
    const path = geoPath(projection);
    const step = scale > 20000 ? 0.5 : scale > 8000 ? 1 : scale > 2500 ? 5 : 10;
    const center = projection([event.lon, event.lat])!;
    const edge = projection([event.lon + rDeg, event.lat])!;
    const rPx = Math.max(24, Math.hypot(edge[0] - center[0], edge[1] - center[1]));
    const kmPerPx = 111.32 / (scale * 0.01747);
    return {
      sphere: path({ type: "Sphere" } as any) || "",
      grat: path(geoGraticule().step([step, step])()) || "",
      land: countries.features.map((f: any) => path(f) || ""),
      center, rPx,
      scaleKm: kmPerPx * 120,
    };
  }, [event]);

  const c = SEVERITY[event.severity].color;

  return (
    <div className="map-wrap" style={{ height, minHeight: typeof height === "number" ? undefined : 380 }}>
      <div className="sweep" />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="ocean2" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#0e1723" />
            <stop offset="100%" stopColor="#0a0f16" />
          </radialGradient>
        </defs>
        <path d={geo.sphere} fill="url(#ocean2)" stroke="#1c2836" />
        <path d={geo.grat} fill="none" stroke="#15202d" strokeWidth={0.6} />
        {geo.land.map((d, i) => (
          <path key={i} d={d} fill="#18222f" stroke="#243244" strokeWidth={0.7} strokeLinejoin="round" />
        ))}
        {/* impact rings (screen space) */}
        <g transform={`translate(${geo.center[0]},${geo.center[1]})`}>
          <circle r={geo.rPx} fill={hexA(c, 0.07)} stroke={hexA(c, 0.85)} strokeWidth={1.4} strokeDasharray="7 6" />
          <circle r={geo.rPx * 0.62} fill="none" stroke={hexA(c, 0.35)} strokeWidth={1} strokeDasharray="2 5" />
          <line x1={-geo.rPx - 14} x2={-geo.rPx + 6} y1={0} y2={0} stroke={hexA(c, 0.6)} strokeWidth={1} />
          <line x1={geo.rPx - 6} x2={geo.rPx + 14} y1={0} y2={0} stroke={hexA(c, 0.6)} strokeWidth={1} />
          <circle className="marker-pulse" r={10} fill={hexA(c, 0.5)} />
          <circle r={13} fill={hexA(c, 0.15)} />
          <circle r={6} fill={c} stroke="#0a0f16" strokeWidth={1.6} />
        </g>
      </svg>
      <div className="map-overlay-bl">
        <div className="map-chip">
          <span className="dot" style={{ background: c }} />
          Impact radius ≈ {fmt(event.affectedRadiusKm)} km
        </div>
        <div className="map-readout">{coords(event.lat, event.lon)} · {event.code}</div>
      </div>
      <div className="map-readout" style={{ position: "absolute", right: 12, bottom: 12, zIndex: 4 }}>
        <svg width="62" height="8" style={{ verticalAlign: "middle", marginRight: 6 }}>
          <path d="M1,1 V7 M1,4 H61 M61,1 V7" stroke="#5d6b7e" strokeWidth="1" fill="none" />
        </svg>
        {geo.scaleKm >= 10 ? Math.round(geo.scaleKm) : geo.scaleKm.toFixed(1)} km
      </div>
      <div className="map-attr" style={{ bottom: 34 }}>Adaptive extent · demo data only</div>
    </div>
  );
}
