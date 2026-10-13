// Live replacements for the overview's weather strip and "What needs attention today?" panel.
// Both read the signed-in account's own farms; the visual language matches the ported dashboard.
import Link from "next/link";
import { Icon, type IconName } from "@/components/ds/icon";
import type { Locale } from "@/i18n/config";
import { describe, loadForecast } from "@/lib/forecast";
import { num, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Farm = { id: string; name: string; lga: string | null };

export async function loadOverviewPanels(lang: Locale, farms: Farm[]) {
  const supabase = await createClient();
  const ids = farms.map((f) => f.id);
  if (!ids.length) return { weather: null, attention: null, crops: null, livestock: null, machinery: null, stock: null };
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: pt }, { data: plots }, { data: alerts }, { data: tasks }, { data: stock }, { data: groups }, { data: devAlerts }] = await Promise.all([
    supabase.from("farm_points").select("id, name, lat, lng, lga").in("id", ids).not("lat", "is", null).limit(1).maybeSingle(),
    supabase.from("plots").select("id").in("farm_id", ids),
    supabase.from("crop_alerts").select("id, category, severity, title, message, action_url").in("farm_id", ids).eq("is_dismissed", false).order("created_at", { ascending: false }).limit(10),
    supabase.from("farm_operational_tasks").select("id, title, due_date, priority, status").in("farm_id", ids).not("status", "in", "(completed,cancelled)").lte("due_date", today).order("due_date").limit(5),
    supabase.from("farm_inventory").select("id, item_name, quantity, unit, reorder_threshold").in("farm_id", ids).gt("reorder_threshold", 0),
    supabase.from("farm_livestock_groups").select("id, group_name, health_status").in("farm_id", ids).neq("health_status", "healthy"),
    supabase.from("device_alerts").select("id, observation, suggested_action, severity").in("farm_id", ids).eq("status", "open").limit(5),
  ]);
  const plotIds = (plots ?? []).map((p) => p.id).concat("00000000-0000-0000-0000-000000000000");
  const [forecast, { data: moisture }] = await Promise.all([
    pt?.lat != null && pt.lng != null ? loadForecast(Number(pt.lat), Number(pt.lng)) : Promise.resolve(null),
    supabase.from("telemetry_readings").select("calibrated_value, source_timestamp").in("plot_id", plotIds).eq("channel_code", "soil_moisture_pct").order("source_timestamp", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const rain3 = (forecast?.daily ?? []).slice(0, 3).reduce((s, d) => s + d.rainMm, 0);
  const weatherAlert = (alerts ?? []).find((a) => a.category === "weather");
  const now = forecast?.current;
  const w = now ? describe(now.code) : null;
  const weather = (
    <div className="-mx-space-lg -mb-space-lg mt-space-lg flex flex-col justify-between gap-space-md border-t border-surface-container bg-surface-container-low/60 px-space-lg py-space-md xl:flex-row xl:items-center">
      <div className="flex flex-wrap items-center gap-space-lg">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-lowest text-secondary shadow-sm">
            <Icon name={w?.icon ?? "cloud_off"} className="text-2xl" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md text-on-surface">{now ? `${Math.round(now.temp)}°C` : "—"}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{w?.text ?? "Forecast unavailable"}</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{pt ? `${pt.name}${pt.lga ? ` · ${pt.lga}` : ""}` : "Add a farm GPS point"}</span>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-outline-variant/30 sm:block" />
        <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Relative humidity</p>
            <p className="font-headline-sm text-headline-sm text-on-surface">{now ? `${Math.round(now.humidity)}%` : "—"}</p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Soil moisture (sensor)</p>
            <p className="font-headline-sm text-headline-sm text-on-surface">{moisture ? `${num(moisture.calibrated_value, 1)}%` : "—"}</p>
          </div>
          <div className="hidden sm:block">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Rain, next 3 days</p>
            <p className="font-headline-sm text-headline-sm text-on-surface">{forecast ? `${num(rain3, 1)} mm` : "—"}</p>
          </div>
        </div>
      </div>
      <Link href={`/${lang}/account/weather`} className="flex max-w-xl items-center gap-space-sm rounded-lg bg-surface-container-lowest p-space-sm px-space-md shadow-sm hover:bg-surface-container">
        <Icon name={weatherAlert ? "thunderstorm" : "wb_sunny"} className="text-xl text-on-tertiary-container" />
        <div className="min-w-0 flex-1">
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-tertiary-container">{weatherAlert ? weatherAlert.title : "No weather alerts"}</span>
          <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{weatherAlert ? weatherAlert.message : "Open the 10-day forecast and water balance."}</p>
        </div>
        <Icon name="chevron_right" className="text-lg text-on-surface-variant" />
      </Link>
    </div>
  );

  type Item = { tone: "critical" | "caution" | "info"; tag: string; title: string; body: string; href: string; cta: string; rank: number };
  const SEV: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const items: Item[] = [];
  for (const a of alerts ?? []) {
    items.push({ tone: a.severity === "high" || a.severity === "critical" ? "critical" : "caution", tag: a.category, title: a.title, body: a.message, href: `/${lang}${a.action_url ?? "/account/risk"}`, cta: "Open", rank: SEV[a.severity ?? "low"] ?? 3 });
  }
  for (const d of devAlerts ?? []) {
    items.push({ tone: d.severity === "critical" ? "critical" : "caution", tag: "sensor", title: d.observation, body: d.suggested_action, href: `/${lang}/account/iot`, cta: "Sensors", rank: d.severity === "critical" ? 0 : 2 });
  }
  for (const t of tasks ?? []) {
    items.push({ tone: "caution", tag: "overdue task", title: t.title, body: `Due ${t.due_date}. Priority ${t.priority}.`, href: `/${lang}/account/tasks`, cta: "Tasks", rank: t.priority === "urgent" ? 1 : 2 });
  }
  for (const s of (stock ?? []).filter((x) => Number(x.quantity) <= Number(x.reorder_threshold))) {
    items.push({ tone: "info", tag: "reorder", title: `${s.item_name} running low`, body: `${num(s.quantity, 1)} ${s.unit} left; reorder level ${num(s.reorder_threshold)}.`, href: `/${lang}/account/inventory`, cta: "Inventory", rank: 3 });
  }
  for (const g of groups ?? []) {
    items.push({ tone: "caution", tag: "livestock", title: `${g.group_name}: ${g.health_status}`, body: "Check the health log and treatments.", href: `/${lang}/account/livestock`, cta: "Livestock", rank: 2 });
  }
  const top = items.sort((a, b) => a.rank - b.rank).slice(0, 4);
  const TONE = {
    critical: { box: "border-error/30 bg-error-container/20", tag: "bg-error text-on-error", icon: "report" as IconName },
    caution: { box: "border-[#d97706]/30 bg-caution-soft", tag: "bg-[#b45309] text-white", icon: "warning" as IconName },
    info: { box: "border-secondary/30 bg-positive-soft", tag: "bg-secondary text-on-secondary", icon: "info" as IconName },
  };
  const attention = (
    <section className="mb-space-lg rounded-xl border-l-4 border-l-error bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex flex-col justify-between gap-space-sm border-b border-surface-container pb-space-sm md:flex-row md:items-center">
        <div className="flex items-center gap-space-xs">
          <Icon name="priority_high" className="text-error" />
          <h2 className="font-headline-md text-headline-md text-on-surface">What Needs Attention Today?</h2>
          <span className="rounded-full bg-error-container px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-error-container">{items.length} action items</span>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">From your alerts, sensors, tasks, stock and livestock</span>
      </div>
      {top.length ? (
        <div className="mt-space-md grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
          {top.map((it, i) => (
            <div key={i} className={cn("flex flex-col gap-2 rounded-lg border p-space-md", TONE[it.tone].box)}>
              <span className={cn("self-start rounded px-1.5 py-0.5 font-label-sm text-[0.625rem] font-bold uppercase", TONE[it.tone].tag)}>
                Priority {i + 1} · {it.tag}
              </span>
              <p className="font-label-lg text-label-lg text-on-surface">{it.title}</p>
              <p className="line-clamp-3 text-body-sm text-on-surface-variant">{it.body}</p>
              <Link href={it.href} className="mt-auto inline-flex items-center gap-1 self-end rounded bg-primary-container px-2 py-1 font-label-sm text-label-sm text-on-primary hover:bg-primary">
                <Icon name={TONE[it.tone].icon} className="text-sm" /> {it.cta}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-body-sm text-on-surface-variant">Nothing needs your attention right now.</p>
      )}
    </section>
  );
  const extra = await loadSidePanels(lang, ids);
  return { weather, attention, ...extra };
}

const card = "rounded-xl bg-surface-container-lowest p-space-lg shadow-sm";
function Head({ icon, title, href, lang, cta }: { icon: IconName; title: string; href: string; lang: Locale; cta: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-surface-container pb-space-md">
      <div className="flex items-center gap-space-xs">
        <Icon name={icon} className="text-secondary" />
        <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
      </div>
      <Link href={`/${lang}${href}`} className="font-label-md text-label-md text-primary-container hover:underline">{cta} →</Link>
    </div>
  );
}
function Bar({ value, tone }: { value: number; tone: "ok" | "warn" | "bad" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
      <div className={cn("h-full rounded-full", tone === "ok" ? "bg-secondary" : tone === "warn" ? "bg-[#d97706]" : "bg-error")} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

async function loadSidePanels(lang: Locale, ids: string[]) {
  const supabase = await createClient();
  const since = new Date(nowMs() - 7 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: cycles }, { data: groups }, { data: prod }, { data: fleet }, { data: stock }] = await Promise.all([
    supabase.from("crop_cycles").select("id, crop_id, variety_id, current_stage, status, health_status, planting_date, expected_harvest_date, target_area_ha, target_yield_kg").in("farm_id", ids).not("status", "in", "(completed,abandoned)").order("expected_harvest_date"),
    supabase.from("farm_livestock_groups").select("id, group_name, animal_type, breed, population, health_status, age_weeks").in("farm_id", ids),
    supabase.from("farm_livestock_production_logs").select("group_id, product_type, quantity, unit").in("farm_id", ids).gte("log_date", since),
    supabase.from("farm_machinery_assets").select("id, asset_code, name, current_status, engine_hours, next_service_hours").in("farm_id", ids).order("asset_code"),
    supabase.from("farm_inventory").select("id, item_name, quantity, unit, reorder_threshold, category").in("farm_id", ids).in("category", ["seed", "fertiliser", "chemical", "feed", "fuel"]).order("item_name"),
  ]);
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const crops = (
    <div className={card}>
      <Head icon="potted_plant" title="Active Crop Cycles" href="/account/crops" lang={lang} cta="All crops" />
      <div className="mt-space-md grid grid-cols-1 gap-space-md md:grid-cols-2">
        {(cycles ?? []).slice(0, 4).map((c) => {
          const total = Math.max(1, Date.parse(c.expected_harvest_date) - Date.parse(c.planting_date));
          const pct = ((nowMs() - Date.parse(c.planting_date)) / total) * 100;
          const days = Math.round((Date.parse(c.expected_harvest_date) - nowMs()) / 86_400_000);
          return (
            <Link key={c.id} href={`/${lang}/account/crops/${c.id}`} className="card-interactive flex flex-col gap-2 rounded-lg border border-outline-variant/40 p-space-md">
              <div className="flex items-start justify-between gap-2">
                <p className="font-label-lg text-label-lg text-on-surface">{cap(c.crop_id)} {c.variety_id}</p>
                <span className={cn("rounded-full px-2 py-0.5 font-label-sm text-label-sm", c.health_status === "healthy" ? "bg-positive-soft text-[#047857]" : c.health_status === "watch" ? "bg-caution-soft text-[#b45309]" : "bg-critical-soft text-[#b91c1c]")}>{(c.health_status ?? "").replace("_", " ")}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant">{c.current_stage ?? c.status} · {num(c.target_area_ha, 1)} ha · target {num(Number(c.target_yield_kg ?? 0) / 1000, 1)} t</p>
              <Bar value={pct} tone={c.health_status === "healthy" ? "ok" : c.health_status === "watch" ? "warn" : "bad"} />
              <p className="text-body-sm text-on-surface-variant">{days >= 0 ? `Harvest in ${days} days` : `Harvest ${-days} days overdue`}</p>
            </Link>
          );
        })}
        {!cycles?.length && <p className="py-4 text-body-sm text-on-surface-variant">No active crop cycles.</p>}
      </div>
    </div>
  );
  const out = new Map<string, { q: number; unit: string; type: string }>();
  for (const p of prod ?? []) {
    if (!p.group_id) continue;
    const cur = out.get(p.group_id) ?? { q: 0, unit: p.unit, type: p.product_type };
    out.set(p.group_id, { ...cur, q: cur.q + Number(p.quantity) });
  }
  const livestock = (
    <div className={card}>
      <Head icon="pets" title="Livestock & Aquaculture" href="/account/livestock" lang={lang} cta="All groups" />
      <div className="mt-space-md grid grid-cols-1 gap-space-md md:grid-cols-2">
        {(groups ?? []).map((g) => (
          <div key={g.id} className="flex flex-col gap-1 rounded-lg border border-outline-variant/40 p-space-md">
            <div className="flex items-start justify-between gap-2">
              <p className="font-label-lg text-label-lg text-on-surface">{g.group_name}</p>
              <span className={cn("rounded-full px-2 py-0.5 font-label-sm text-label-sm", g.health_status === "healthy" ? "bg-positive-soft text-[#047857]" : "bg-caution-soft text-[#b45309]")}>{g.health_status}</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">{num(g.population)} head · {g.breed ?? g.animal_type}{g.age_weeks != null ? ` · ${g.age_weeks} wk` : ""}</p>
            <p className="text-body-sm text-on-surface">{out.get(g.id) ? `${num(out.get(g.id)!.q)} ${out.get(g.id)!.unit} of ${out.get(g.id)!.type} in 7 days` : "No production logged this week"}</p>
          </div>
        ))}
        {!groups?.length && <p className="py-4 text-body-sm text-on-surface-variant">No livestock groups.</p>}
      </div>
    </div>
  );
  const machinery = (
    <div className={card}>
      <Head icon="agriculture" title="Machinery & Equipment" href="/account/machinery" lang={lang} cta="Fleet" />
      <ul className="mt-space-md flex flex-col divide-y divide-outline-variant/30">
        {(fleet ?? []).map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="truncate font-label-lg text-label-lg text-on-surface">{m.asset_code} · {m.name}</p>
              <p className="text-body-sm text-on-surface-variant">{num(m.engine_hours)} h{m.next_service_hours ? ` · service at ${num(m.next_service_hours)} h` : ""}</p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">{m.current_status.replace(/_/g, " ")}</span>
          </li>
        ))}
        {!fleet?.length && <li className="py-4 text-body-sm text-on-surface-variant">No machines registered.</li>}
      </ul>
      <Link href={`/${lang}/account/find`} className="mt-space-sm inline-flex w-full items-center justify-center gap-1 rounded-lg bg-surface-container px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container-high">
        <Icon name="precision_manufacturing" className="text-base" /> Hire machinery nearby
      </Link>
    </div>
  );
  const stockPanel = (
    <div className={card}>
      <Head icon="inventory_2" title="Input Stock Watch" href="/account/inventory" lang={lang} cta="Inventory" />
      <ul className="mt-space-md flex flex-col gap-3">
        {(stock ?? []).slice(0, 6).map((x) => {
          const t = Number(x.reorder_threshold);
          const q = Number(x.quantity);
          const low = t > 0 && q <= t;
          return (
            <li key={x.id}>
              <div className="mb-1 flex justify-between gap-2 text-body-sm">
                <span className="truncate text-on-surface">{x.item_name}</span>
                <span className={low ? "font-semibold text-[#b45309]" : "text-on-surface-variant"}>{num(q, 1)} {x.unit}{low ? " · reorder" : ""}</span>
              </div>
              <Bar value={t > 0 ? (q / (t * 2)) * 100 : 100} tone={low ? "warn" : "ok"} />
            </li>
          );
        })}
        {!stock?.length && <li className="text-body-sm text-on-surface-variant">No inputs in stock.</li>}
      </ul>
      <Link href={`/${lang}/marketplace`} className="mt-space-md inline-flex w-full items-center justify-center gap-1 rounded-lg bg-surface-container px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container-high">
        <Icon name="shopping_cart" className="text-base" /> Reorder from the marketplace
      </Link>
    </div>
  );
  return { crops, livestock, machinery, stock: stockPanel };
}
