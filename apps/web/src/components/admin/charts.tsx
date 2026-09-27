"use client";

import { useState } from "react";

// Small SVG charts for the admin dashboard. Rules:
// thin marks, 2px gaps between stacked segments, recessive grid, one y-axis, legend for 2+ series,
// hover tooltips, and a table view so no number depends on colour alone.

export type Series = { key: string; label: string; color: string };

const W = 520;
const H = 230;
const PAD = { top: 12, right: 8, bottom: 28, left: 34 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function niceMax(v: number): number {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function Grid({ max }: { max: number }) {
  const ticks = [0, max / 2, max];
  return (
    <g aria-hidden="true">
      {ticks.map((t) => {
        const y = PAD.top + PLOT_H - (t / max) * PLOT_H;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#E7E4DC" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={13} fill="#55605A">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function XLabels({ days }: { days: string[] }) {
  if (days.length === 0) return null;
  const picks = Array.from(new Set([0, Math.floor((days.length - 1) / 2), days.length - 1]));
  const step = PLOT_W / days.length;
  return (
    <g aria-hidden="true">
      {picks.map((i) => (
        <text key={i} x={PAD.left + step * i + step / 2} y={H - 6} textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"} fontSize={13} fill="#55605A">
          {dayLabel(days[i]!)}
        </text>
      ))}
    </g>
  );
}

function Legend({ series }: { series: Series[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function Tooltip({ x, title, rows }: { x: number; title: string; rows: { label: string; value: number; color?: string }[] }) {
  const left = `${Math.min(Math.max((x / W) * 100, 12), 88)}%`;
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-line bg-white px-3 py-2 text-sm shadow-md"
      style={{ left }}
      role="status"
    >
      <p className="font-semibold">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2">
          {r.color && <span className="inline-block size-2.5 rounded-sm" style={{ background: r.color }} aria-hidden="true" />}
          <span className="text-muted">{r.label}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">{r.value.toLocaleString("en-NG")}</span>
        </p>
      ))}
    </div>
  );
}

function TableView({ caption, days, series, rows }: { caption: string; days: string[]; series: Series[]; rows: Record<string, number>[] }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-semibold text-leaf-700">Show as table</summary>
      <div className="mt-2 max-h-72 overflow-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th className="border-b border-line py-1 pr-3">Day</th>
              {series.map((s) => (
                <th key={s.key} className="border-b border-line py-1 pr-3 text-right">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d, i) => (
              <tr key={d}>
                <td className="border-b border-line/60 py-1 pr-3">{dayLabel(d)}</td>
                {series.map((s) => (
                  <td key={s.key} className="border-b border-line/60 py-1 pr-3 text-right tabular-nums">{rows[i]?.[s.key] ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Stacked columns, one per day (for example sign-ups by channel). */
export function StackedColumns({ title, days, series, rows }: { title: string; days: string[]; series: Series[]; rows: Record<string, number>[] }) {
  const [active, setActive] = useState<number | null>(null);
  const totals = rows.map((r) => series.reduce((sum, s) => sum + (r[s.key] ?? 0), 0));
  const max = niceMax(Math.max(0, ...totals));
  const step = PLOT_W / Math.max(days.length, 1);
  const barW = Math.max(Math.min(step - 2, 18), 2);
  const y = (v: number) => (v / max) * PLOT_H;

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="sr-only">{title}</figcaption>
      <Legend series={series} />
      <div className="relative" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
          <Grid max={max} />
          {days.map((d, i) => {
            const x = PAD.left + step * i + (step - barW) / 2;
            let base = PAD.top + PLOT_H;
            const segments = series.map((s) => {
              const v = rows[i]?.[s.key] ?? 0;
              if (v <= 0) return null;
              const h = Math.max(y(v) - 2, 1); // 2px surface gap between stacked segments
              base -= y(v);
              return <rect key={s.key} x={x} y={base + 2} width={barW} height={h} rx={Math.min(2, barW / 2)} fill={s.color} />;
            });
            return (
              <g key={d} opacity={active === null || active === i ? 1 : 0.55}>
                {segments}
                <rect
                  x={PAD.left + step * i}
                  y={PAD.top}
                  width={step}
                  height={PLOT_H}
                  fill="transparent"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  tabIndex={-1}
                />
              </g>
            );
          })}
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + PLOT_H} y2={PAD.top + PLOT_H} stroke="#C9C5BA" />
          <XLabels days={days} />
        </svg>
        {active !== null && days[active] && (
          <Tooltip
            x={PAD.left + step * active + step / 2}
            title={`${dayLabel(days[active])} · ${totals[active]} total`}
            rows={series.map((s) => ({ label: s.label, value: rows[active]?.[s.key] ?? 0, color: s.color }))}
          />
        )}
      </div>
      <TableView caption={title} days={days} series={series} rows={rows} />
    </figure>
  );
}

/** A single series over time, with a crosshair (for example page views per day). */
export function LineArea({ title, days, values, label, color = "#2F7F47" }: { title: string; days: string[]; values: number[]; label: string; color?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...values));
  const step = PLOT_W / Math.max(days.length, 1);
  const px = (i: number) => PAD.left + step * i + step / 2;
  const py = (v: number) => PAD.top + PLOT_H - (v / max) * PLOT_H;
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const area = values.length ? `${line} L${px(values.length - 1).toFixed(1)},${PAD.top + PLOT_H} L${px(0).toFixed(1)},${PAD.top + PLOT_H} Z` : "";

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="relative" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
          <Grid max={max} />
          <path d={area} fill={color} opacity={0.12} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {active !== null && (
            <g aria-hidden="true">
              <line x1={px(active)} x2={px(active)} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="#9AA39E" strokeDasharray="3 3" />
              <circle cx={px(active)} cy={py(values[active] ?? 0)} r={4.5} fill={color} stroke="#fff" strokeWidth={2} />
            </g>
          )}
          {days.map((d, i) => (
            <rect key={d} x={PAD.left + step * i} y={PAD.top} width={step} height={PLOT_H} fill="transparent" onMouseEnter={() => setActive(i)} />
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + PLOT_H} y2={PAD.top + PLOT_H} stroke="#C9C5BA" />
          <XLabels days={days} />
        </svg>
        {active !== null && days[active] && (
          <Tooltip x={px(active)} title={dayLabel(days[active])} rows={[{ label, value: values[active] ?? 0 }]} />
        )}
      </div>
      <TableView caption={title} days={days} series={[{ key: "v", label, color }]} rows={values.map((v) => ({ v }))} />
    </figure>
  );
}

/** Horizontal bars for a ranked list (roles, states). Values are always printed, so colour carries nothing alone. */
export function BarList({ items, color = "#2F7F47", extra }: { items: { label: string; value: number; note?: string }[]; color?: string; extra?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-2" aria-label={extra}>
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(6rem,12rem)_1fr_auto] items-center gap-3 text-sm" title={`${i.label}: ${i.value}${i.note ? ` (${i.note})` : ""}`}>
          <span className="truncate">{i.label}</span>
          <span className="h-3 rounded-r bg-line/40">
            <span className="block h-3 rounded-r" style={{ width: `${Math.max((i.value / max) * 100, i.value > 0 ? 2 : 0)}%`, background: color }} />
          </span>
          <span className="tabular-nums">
            <span className="font-semibold">{i.value.toLocaleString("en-NG")}</span>
            {i.note && <span className="ml-2 text-muted">{i.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
