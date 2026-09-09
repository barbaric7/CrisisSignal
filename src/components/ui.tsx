import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { SEVERITY, STATUS, SOURCE_STATUS, cx, hexA } from "../lib/meta";
import type { Severity, EventStatus } from "../data/mock";

/* ---------- card shell ---------- */
export function Card(props: {
  title?: string; icon?: LucideIcon; actions?: ReactNode;
  children: ReactNode; className?: string; bodyClass?: string; style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}) {
  const { title, icon: Icon, actions, children, className, bodyClass, style, bodyStyle } = props;
  return (
    <section className={cx("card", className)} style={style}>
      {title && (
        <header className="card-head">
          <h3 className="card-title">{Icon && <Icon size={15} strokeWidth={2.2} />}{title}</h3>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className={cx("card-body", bodyClass)} style={bodyStyle}>{children}</div>
    </section>
  );
}

/* ---------- severity badge ---------- */
export function SevBadge({ sev, subtle }: { sev: Severity; subtle?: boolean }) {
  const m = SEVERITY[sev];
  return (
    <span
      className="badge"
      style={{
        color: m.color,
        background: hexA(m.color, subtle ? 0.08 : 0.13),
        borderColor: hexA(m.color, 0.4),
      }}
    >
      {m.label}
    </span>
  );
}

/* ---------- status pill ---------- */
export function StatusPill({ status }: { status: EventStatus }) {
  const m = STATUS[status];
  return (
    <span className={cx("pill", m.pulse && "pulse")} style={{ color: m.color, background: hexA(m.color, 0.09), borderColor: hexA(m.color, 0.35) }}>
      <i />{m.label}
    </span>
  );
}

export function SourceStatusPill({ status }: { status: string }) {
  const m = SOURCE_STATUS[status] ?? SOURCE_STATUS.healthy;
  return (
    <span className={cx("pill", m.pulse && "pulse")} style={{ color: m.color, background: hexA(m.color, 0.09), borderColor: hexA(m.color, 0.35) }}>
      <i />{m.label}
    </span>
  );
}

/* ---------- progress ---------- */
export function Progress({ value, color, height }: { value: number; color: string; height?: number }) {
  return (
    <div className="progress" style={height ? { height } : undefined}>
      <i style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}

/* ---------- inline sparkline (pure SVG, no deps) ---------- */
export function Sparkline({ data, color, height = 36 }: { data: number[]; color: string; height?: number }) {
  const w = 100, h = 32;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - 3 - ((v - min) / span) * (h - 7),
  ]);
  const line = pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = `sg-${color.replace("#", "")}`;
  return (
    <div className="stat-spark" style={{ height }} aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gid})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2} fill={color} />
      </svg>
    </div>
  );
}

/* ---------- empty state ---------- */
export function Empty({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="empty">
      <div className="box"><Icon size={19} /></div>
      <p><strong style={{ color: "var(--text-2)" }}>{title}</strong>{hint ? <><br />{hint}</> : null}</p>
    </div>
  );
}
