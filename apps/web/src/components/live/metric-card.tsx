import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ds/icon";

/** KPI card matching the ported dashboards (white card, label row with icon chip, large metric, footnote). */
export function MetricCard({
  label,
  value,
  unit,
  icon,
  iconTone = "bg-secondary-container/40 text-secondary",
  foot,
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon: IconName;
  iconTone?: string;
  foot?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</span>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconTone)}>
          <Icon name={icon} className="text-xl" />
        </span>
      </div>
      <div className="mt-space-md flex items-baseline gap-1.5">
        <span className="font-metric-num text-[2.5rem] font-bold leading-none tracking-tight text-on-surface">{value}</span>
        {unit && <span className="font-headline-sm text-headline-sm text-on-surface-variant">{unit}</span>}
      </div>
      {foot && <div className="mt-space-sm text-body-sm text-on-surface-variant">{foot}</div>}
    </>
  );
  const cls = cn(
    "flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow duration-200",
    href && "card-interactive",
    className,
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
