import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

type Trend = { value: string; direction: "up" | "down" | "flat"; good?: boolean };

/** DESIGN.md → high-density KPI card: 28px metric, unit, trend chip, optional micro sparkline. */
export function KpiCard({
  label,
  value,
  unit,
  icon,
  trend,
  hint,
  spark,
  className,
  children,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: IconName;
  trend?: Trend;
  hint?: React.ReactNode;
  spark?: number[];
  className?: string;
  children?: React.ReactNode;
}) {
  const good = trend ? (trend.good ?? trend.direction === "up") : true;
  return (
    <div className={cn("card-surface card-interactive flex flex-col gap-3 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{label}</span>
        {icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-surface-container-low text-secondary">
            <Icon name={icon} className="text-lg" />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-metric-num text-metric-num text-on-surface">{value}</span>
        {unit && <span className="text-body-sm font-medium text-on-surface-variant">{unit}</span>}
      </div>
      {(trend || spark) && (
        <div className="flex items-end justify-between gap-3">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-label-sm text-label-sm",
                trend.direction === "flat"
                  ? "bg-surface-container text-on-surface-variant"
                  : good
                    ? "bg-positive-soft text-[#047857]"
                    : "bg-critical-soft text-[#b91c1c]",
              )}
            >
              <Icon
                name={trend.direction === "up" ? "trending_up" : trend.direction === "down" ? "trending_down" : "trending_flat"}
                className="text-sm"
              />
              {trend.value}
            </span>
          ) : (
            <span />
          )}
          {spark && <Sparkline values={spark} className={good ? "text-secondary" : "text-critical"} />}
        </div>
      )}
      {hint && <p className="text-body-sm text-on-surface-variant">{hint}</p>}
      {children}
    </div>
  );
}

/** Tiny inline trend line; inherits currentColor. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const w = 72;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / span) * (h - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-6 w-[72px] overflow-visible", className)} aria-hidden>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="currentColor" opacity="0.08" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="2.25" fill="currentColor" />
    </svg>
  );
}
