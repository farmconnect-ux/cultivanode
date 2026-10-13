import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dismissCropAlert } from "@/actions/farm-ops";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton } from "@/components/live/action-form";
import { Chip, KpiGrid, LineChart, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { describe, loadForecast } from "@/lib/forecast";
import { ago, num, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Weather & climate" };

export default async function Page({ params, searchParams }: PageProps<"/[lang]/account/weather">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const sp = await searchParams;
  const { data: points } = scope.farmIds.length ? await supabase.from("farm_points").select("id, name, lat, lng, lga, state").in("id", scope.farmIds) : { data: [] };
  const pts = (points ?? []).filter((p) => p.lat != null && p.lng != null);
  const farm = pts.find((p) => p.id === sp.farm) ?? pts[0];
  const plotIds = scope.plots.filter((p) => p.farm_id === farm?.id).map((p) => p.id).concat("00000000-0000-0000-0000-000000000000");
  // Window ends at the latest reading, so a node that went offline still shows its last 48 hours.
  const { data: lastRead } = await supabase.from("telemetry_readings").select("source_timestamp").in("plot_id", plotIds).order("source_timestamp", { ascending: false }).limit(1).maybeSingle();
  const anchor = lastRead?.source_timestamp ? Date.parse(lastRead.source_timestamp) : nowMs();
  const [forecast, { data: readings }, { data: alerts }] = await Promise.all([
    farm ? loadForecast(Number(farm.lat), Number(farm.lng)) : Promise.resolve(null),
    supabase.from("telemetry_readings").select("channel_code, calibrated_value, source_timestamp").in("plot_id", plotIds).in("channel_code", ["air_temperature_c", "air_humidity_pct", "rainfall_mm"]).gte("source_timestamp", new Date(anchor - 48 * 3_600_000).toISOString()).order("source_timestamp"),
    supabase.from("crop_alerts").select("*").in("farm_id", scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"]).in("category", ["weather", "irrigation"]).eq("is_dismissed", false).order("created_at", { ascending: false }),
  ]);
  const temp = (readings ?? []).filter((r) => r.channel_code === "air_temperature_c");
  const rain48 = (readings ?? []).filter((r) => r.channel_code === "rainfall_mm").reduce((s, r) => s + Number(r.calibrated_value), 0);
  const days = forecast?.daily ?? [];
  const rain7 = days.slice(0, 7).reduce((s, d) => s + d.rainMm, 0);
  const et7 = days.slice(0, 7).reduce((s, d) => s + d.et0, 0);
  const dryRun = (() => {
    let n = 0;
    for (const d of days) {
      if (d.rainMm < 1) n++;
      else break;
    }
    return n;
  })();

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="location_on">{farm ? `${farm.name} · ${[farm.lga, farm.state].filter(Boolean).join(", ")}` : "No farm location"}</Chip>
            {pts.length > 1 &&
              pts.map((p) => (
                <a key={p.id} href={`?farm=${p.id}`} className={`rounded-full px-2.5 py-1 font-label-sm text-label-sm ${p.id === farm?.id ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
                  {p.name}
                </a>
              ))}
          </>
        }
        title="Weather & Climate"
        description="Ten-day forecast at your farm's GPS point, water balance for planning irrigation, and readings from your own weather sensors."
      />
      {!farm && <StartHere icon="location_on" title="Add a farm with a GPS point to get a forecast" />}
      <KpiGrid>
        <MetricCard label="Now" value={forecast?.current ? `${num(forecast.current.temp, 1)}°` : "—"} unit="C" icon={forecast?.current ? describe(forecast.current.code).icon : "cloud_off"} foot={forecast?.current ? `${describe(forecast.current.code).text} · RH ${num(forecast.current.humidity)}% · wind ${num(forecast.current.wind)} km/h` : "Forecast unavailable right now"} />
        <MetricCard label="Rain, next 7 days" value={num(rain7, 1)} unit="mm" icon="water_drop" foot={`Evapotranspiration ${num(et7, 1)} mm`} />
        <MetricCard label="Water balance, 7 days" value={num(rain7 - et7, 1)} unit="mm" icon="balance" iconTone={rain7 - et7 < -10 ? "bg-caution-soft text-[#b45309]" : undefined} foot={rain7 - et7 < -10 ? "Deficit — plan irrigation" : "Rain covers crop demand"} />
        <MetricCard label="Dry days ahead" value={dryRun} icon="sunny" foot={`On-farm rain gauge: ${num(rain48, 1)} mm in 48 h`} />
      </KpiGrid>
      <Section title="10-day forecast" icon="calendar_month">
        {days.length ? (
          <div className="grid grid-cols-2 gap-space-sm sm:grid-cols-5 xl:grid-cols-10">
            {days.map((d) => {
              const w = describe(d.code);
              return (
                <div key={d.date} className="flex flex-col items-center gap-1 rounded-xl bg-surface-container-low p-3 text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{formatDay(d.date, lang).split(",")[0]}</span>
                  <Icon name={w.icon} className="text-2xl text-secondary" />
                  <span className="font-label-lg text-label-lg text-on-surface">
                    {Math.round(d.tMax)}° <span className="text-on-surface-variant">{Math.round(d.tMin)}°</span>
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    {num(d.rainMm, 1)} mm · {d.rainProb}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-body-sm text-on-surface-variant">The forecast service didn&apos;t respond. Sensor readings below are still live.</p>
        )}
      </Section>
      <Split
        wide={
          <Section title="On-farm air temperature, 48 h" icon="thermostat">
            <LineChart unit="°C" points={temp.map((r) => ({ x: new Date(r.source_timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }), y: Number(r.calibrated_value) }))} />
          </Section>
        }
        side={
          <Section title="Weather alerts" icon="notification_important">
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {(alerts ?? []).map((a) => (
                <li key={a.id} className="flex flex-col gap-1 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-label-lg text-label-lg text-on-surface">{a.title}</p>
                    <Status value={a.severity} />
                  </div>
                  <p className="text-body-sm text-on-surface-variant">{a.message}</p>
                  <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                    <span>{ago(a.created_at)}</span>
                    <ActionButton action={dismissCropAlert} hidden={{ lang, id: a.id }} label="Dismiss" icon="close" />
                  </div>
                </li>
              ))}
              {!alerts?.length && <li className="py-4 text-center text-body-sm text-on-surface-variant">No weather alerts.</li>}
            </ul>
          </Section>
        }
      />
    </Stack>
  );
}
