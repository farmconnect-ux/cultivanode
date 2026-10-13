// Building blocks for the live account modules. They keep the visual language of the ported
// screens (white cards on the surface tint, label-sm eyebrows, metric numerals) so a page wired
// to the database reads like the design it replaced.
import * as React from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ds/icon";
import { cn } from "@/lib/utils";

export type Tone = "positive" | "caution" | "critical" | "info" | "neutral";

const TONE: Record<Tone, string> = {
  positive: "bg-positive-soft text-[#047857]",
  caution: "bg-caution-soft text-[#b45309]",
  critical: "bg-critical-soft text-[#b91c1c]",
  info: "bg-secondary-container/60 text-on-secondary-container",
  neutral: "bg-surface-container text-on-surface-variant",
};

/** Status words used across modules, mapped to a tone. Unknown words are neutral. */
const STATUS_TONE: Record<string, Tone> = {
  active: "positive", healthy: "positive", completed: "positive", complete: "positive", paid: "positive", released: "positive",
  delivered: "positive", accepted: "positive", confirmed: "positive", resolved: "positive", available: "positive", successful: "positive",
  awarded: "positive", funded: "positive", approved: "positive", present: "positive", valid: "positive", sold: "positive", repaid: "positive",
  open: "info", planned: "info", scheduled: "info", pending: "info", submitted: "info", requested: "info", assigned: "info",
  in_progress: "info", in_transit: "info", processing: "info", signed: "info", delivering: "info", running: "info", collecting: "info",
  preparing: "info", committed: "info", shortlisted: "info", enrolled: "info", supported: "info", draft: "neutral", offered: "info",
  watch: "caution", monitoring: "caution", under_review: "caution", assessing: "caution", awaiting_confirmation: "caution", late: "caution",
  reserved: "caution", in_use: "caution", under_maintenance: "caution", degraded: "caution", warning: "caution", held: "caution",
  half_day: "caution", repaying: "caution", disbursed: "caution", quoted: "caution", fault: "critical", blocked: "critical",
  at_risk: "critical", critical: "critical", overdue: "critical", disputed: "critical", failed: "critical", declined: "critical",
  rejected: "critical", cancelled: "neutral", expired: "neutral", closed: "neutral", inactive: "neutral", idle: "neutral", off: "neutral",
  urgent: "critical", high: "caution", medium: "info", low: "neutral", normal: "neutral", sick: "critical", treatment: "caution",
  quarantined: "critical", on_leave: "neutral", absent: "critical", working: "positive",
};

export function toneOf(status: string | null | undefined): Tone {
  return (status && STATUS_TONE[status]) || "neutral";
}

export function Pill({ children, tone = "neutral", icon, className }: { children: React.ReactNode; tone?: Tone; icon?: IconName; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 font-label-sm text-label-sm", TONE[tone], className)}>
      {icon && <Icon name={icon} className="text-sm" />}
      {children}
    </span>
  );
}

/** A status pill whose colour follows the word. */
export function Status({ value, className }: { value: string | null | undefined; className?: string }) {
  const text = value ? value.replace(/_/g, " ") : "—";
  return (
    <Pill tone={toneOf(value)} className={cn("capitalize", className)}>
      {text}
    </Pill>
  );
}

export function Chip({ children, icon, className }: { children: React.ReactNode; icon?: IconName; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant", className)}>
      {icon && <Icon name={icon} className="text-sm" />}
      {children}
    </span>
  );
}

export function KpiGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}

export function Section({
  title,
  description,
  icon,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: IconName;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm", className)}>
      <div className="flex flex-col gap-3 border-b border-outline-variant/40 px-space-lg py-space-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-secondary">
              <Icon name={icon} className="text-lg" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
            {description && <p className="mt-0.5 text-body-sm text-on-surface-variant">{description}</p>}
          </div>
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      <div className={cn("p-space-lg", bodyClassName)}>{children}</div>
    </section>
  );
}

export type Column<T> = {
  label: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Right-align numeric columns. */
  numeric?: boolean;
};

/** A compact, horizontally scrollable table. Renders `empty` when there are no rows. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty = "Nothing recorded yet.",
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T, i: number) => string;
  empty?: React.ReactNode;
  className?: string;
}) {
  if (!rows.length) return <p className="py-6 text-center text-body-sm text-on-surface-variant">{empty}</p>;
  return (
    <div className={cn("-mx-space-lg overflow-x-auto", className)}>
      <table className="w-full min-w-[560px] border-collapse text-left text-body-sm">
        <thead>
          <tr className="border-b border-outline-variant/50">
            {columns.map((c) => (
              <th
                key={c.label}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-space-lg py-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant first:pl-space-lg",
                  c.numeric && "text-right",
                  c.className,
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey(r, i)} className="border-b border-outline-variant/30 transition-colors last:border-0 hover:bg-surface-container-low/60">
              {columns.map((c) => (
                <td key={c.label} className={cn("px-space-lg py-2.5 align-top text-on-surface", c.numeric && "text-right tabular-nums", c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Thin progress bar, 0–100. */
export function Meter({ value, tone = "positive", className }: { value: number; tone?: Tone; className?: string }) {
  const bar = tone === "critical" ? "bg-critical" : tone === "caution" ? "bg-[#d97706]" : tone === "info" ? "bg-primary-container" : "bg-secondary";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high", className)}>
      <div className={cn("h-full rounded-full", bar)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** A label / value pair list for detail panels. */
export function Facts({ items, className }: { items: [React.ReactNode, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2", className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="flex items-baseline justify-between gap-3 border-b border-outline-variant/30 py-1.5">
          <dt className="text-body-sm text-on-surface-variant">{k}</dt>
          <dd className="text-right text-body-sm font-medium text-on-surface">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A card list item: title, meta line, trailing slot. */
export function ListRow({
  title,
  meta,
  trailing,
  icon,
  href,
  className,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  icon?: IconName;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      {icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-secondary">
          <Icon name={icon} className="text-lg" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-label-lg text-label-lg text-on-surface">{title}</p>
        {meta && <p className="mt-0.5 text-body-sm text-on-surface-variant">{meta}</p>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </>
  );
  const cls = cn("flex items-center gap-3 rounded-lg px-1 py-2.5", href && "transition-colors hover:bg-surface-container-low", className);
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Stack({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-space-lg", className)}>{children}</div>;
}

/** Two-column layout that stacks on small screens; `wide` takes two thirds. */
export function Split({ wide, side, className }: { wide: React.ReactNode; side: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-space-lg xl:grid-cols-3", className)}>
      <div className="flex min-w-0 flex-col gap-space-lg xl:col-span-2">{wide}</div>
      <div className="flex min-w-0 flex-col gap-space-lg">{side}</div>
    </div>
  );
}

/** Banner shown on pages where the signed-in workspace has nothing of this kind yet. */
export function StartHere({ icon = "rocket_launch", title, children, action }: { icon?: IconName; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-space-lg sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container/50 text-secondary">
        <Icon name={icon} className="text-xl" />
      </span>
      <div className="flex-1">
        <p className="font-label-lg text-label-lg text-on-surface">{title}</p>
        {children && <p className="mt-0.5 text-body-sm text-on-surface-variant">{children}</p>}
      </div>
      {action}
    </div>
  );
}

/** A minimal SVG line chart for a single series (e.g. 48h telemetry, weekly prices). */
export function LineChart({
  points,
  height = 140,
  unit,
  className,
}: {
  points: { x: string; y: number }[];
  height?: number;
  unit?: string;
  className?: string;
}) {
  if (points.length < 2) return <p className="py-6 text-center text-body-sm text-on-surface-variant">Not enough readings yet.</p>;
  const w = 600;
  const h = height;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const xy = points.map((p, i) => [(i / (points.length - 1)) * w, h - 16 - ((p.y - min) / span) * (h - 32)] as const);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = points.at(-1)!;
  return (
    <figure className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[140px] w-full text-secondary" role="img" aria-label={`Trend, latest ${last.y}${unit ?? ""}`}>
        <path d={`${d} L${w},${h} L0,${h} Z`} fill="currentColor" opacity="0.08" />
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-body-sm text-on-surface-variant">
        <span>{points[0].x}</span>
        <span>
          min {num1(min)}
          {unit} · max {num1(max)}
          {unit}
        </span>
        <span>{last.x}</span>
      </figcaption>
    </figure>
  );
}

function num1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Horizontal bars for a small categorical breakdown. */
export function Bars({ items, format = (n) => String(n) }: { items: { label: string; value: number; tone?: Tone }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-4 text-center text-body-sm text-on-surface-variant">Nothing to chart yet.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-body-sm">
            <span className="truncate text-on-surface">{i.label}</span>
            <span className="tabular-nums text-on-surface-variant">{format(i.value)}</span>
          </div>
          <Meter value={(i.value / max) * 100} tone={i.tone ?? "positive"} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Plots lat/lng points on a neutral grid (no map tiles, so no third-party requests). Points with a
 * `track` flag are joined in order to show a route. Each marker links to OpenStreetMap.
 */
export function PointMap({
  points,
  height = 280,
  track = false,
}: {
  points: { lat: number; lng: number; label: string; tone?: Tone }[];
  height?: number;
  track?: boolean;
}) {
  if (!points.length) return <p className="py-6 text-center text-body-sm text-on-surface-variant">No locations recorded yet.</p>;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.002;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad;
  const maxLng = Math.max(...lngs) + pad;
  const w = 600;
  const h = height;
  const x = (lng: number) => ((lng - minLng) / (maxLng - minLng || 1)) * (w - 40) + 20;
  const y = (lat: number) => h - 20 - ((lat - minLat) / (maxLat - minLat || 1)) * (h - 40);
  const fill: Record<Tone, string> = { positive: "#059669", caution: "#d97706", critical: "#dc2626", info: "#1d4ed8", neutral: "#64748b" };
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(p.lng).toFixed(1)},${y(p.lat).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded-lg bg-surface-container-low" role="img" aria-label="Location plot">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="currentColor" className="text-outline-variant" strokeOpacity="0.35" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill="url(#grid)" />
      {track && <path d={d} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="6 4" />}
      {points.map((p, i) => (
        <a key={i} href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=15/${p.lat}/${p.lng}`} target="_blank" rel="noreferrer">
          <circle cx={x(p.lng)} cy={y(p.lat)} r={track && i ? 3.5 : 7} fill={fill[p.tone ?? "positive"]} stroke="white" strokeWidth="2" />
          {(!track || i === 0) && (
            <text x={x(p.lng) + 10} y={y(p.lat) + 4} fontSize="12" className="fill-on-surface">
              {p.label}
            </text>
          )}
          <title>{`${p.label} — ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}</title>
        </a>
      ))}
    </svg>
  );
}
