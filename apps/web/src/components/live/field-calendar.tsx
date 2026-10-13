import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { cn } from "@/lib/utils";

export type CalendarItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  kind: "crop_operation" | "task";
  status: string;
  href?: string;
  googleUrl?: string;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DONE = new Set(["completed", "skipped", "cancelled"]);

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

/** Month grid (Mon–Sun) of crop operations and field tasks. Navigation is plain links, so it works without JS. */
export function FieldCalendar({
  month,
  today,
  items,
  monthHref,
}: {
  month: string; // YYYY-MM
  today: string; // YYYY-MM-DD
  items: CalendarItem[];
  monthHref: (month: string) => string;
}) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y!, m! - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first
  const days = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  const cells = Math.ceil((lead + days) / 7) * 7;
  const byDay = new Map<string, CalendarItem[]>();
  for (const it of items) {
    if (!it.date.startsWith(month)) continue;
    byDay.set(it.date, [...(byDay.get(it.date) ?? []), it]);
  }
  const title = first.toLocaleDateString("en-NG", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-headline-sm text-headline-sm text-on-surface">{title}</p>
        <div className="flex items-center gap-1">
          <Link href={monthHref(shiftMonth(month, -1))} className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-low" aria-label="Previous month">
            <Icon name="chevron_left" />
          </Link>
          <Link href={monthHref(today.slice(0, 7))} className="rounded-lg px-2.5 py-1 font-label-md text-label-md text-primary hover:bg-surface-container-low">
            Today
          </Link>
          <Link href={monthHref(shiftMonth(month, 1))} className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-low" aria-label="Next month">
            <Icon name="chevron_right" />
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-body-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-secondary" /> Crop operation</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-tertiary-container" /> Field task</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-critical" /> Overdue</span>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 overflow-hidden rounded-xl border border-outline-variant/40 bg-outline-variant/40 [gap:1px]">
          {WEEKDAYS.map((d) => (
            <div key={d} className="bg-surface-container-low px-2 py-1.5 text-center font-label-sm text-label-sm uppercase text-on-surface-variant">
              {d}
            </div>
          ))}
          {Array.from({ length: cells }, (_, i) => {
            const n = i - lead + 1;
            if (n < 1 || n > days) return <div key={`blank-${i}`} className="min-h-24 bg-surface-container-lowest/60" />;
            const iso = `${month}-${String(n).padStart(2, "0")}`;
            const list = byDay.get(iso) ?? [];
            return (
              <div key={iso} className={cn("flex min-h-24 flex-col gap-1 bg-surface-container-lowest p-1.5", iso === today && "ring-2 ring-inset ring-primary-container")}>
                <span className={cn("self-end font-label-sm text-label-sm", iso === today ? "font-bold text-primary" : "text-on-surface-variant")}>{n}</span>
                {list.slice(0, 3).map((it) => {
                  const overdue = !DONE.has(it.status) && iso < today;
                  const chip = cn(
                    "block truncate rounded px-1.5 py-0.5 text-[11px] leading-4",
                    DONE.has(it.status) && "line-through opacity-60",
                    overdue
                      ? "bg-critical-soft text-critical"
                      : it.kind === "crop_operation"
                        ? "bg-secondary-container/60 text-on-secondary-container"
                        : "bg-tertiary-container/20 text-on-surface",
                  );
                  return it.href ? (
                    <Link key={it.id} href={it.href} title={it.title} className={cn(chip, "hover:underline")}>
                      {it.title}
                    </Link>
                  ) : (
                    <span key={it.id} title={it.title} className={chip}>
                      {it.title}
                    </span>
                  );
                })}
                {list.length > 3 && <span className="px-1 text-[11px] text-on-surface-variant">+{list.length - 3} more</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
