import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { EmptyState } from "@/components/ds/empty-state";
import { CropManagement } from "@/components/screens/crop-management";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";

export const metadata: Metadata = { title: "Crop management" };

export default async function Page({ params }: PageProps<"/[lang]/account/crops">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, state, lga")
    .or(scope.join(","))
    .order("created_at");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: plots } = farmIds.length
    ? await supabase.from("plots").select("id, farm_id, name, area_ha").in("farm_id", farmIds)
    : { data: [] };

  const plotList = plots ?? [];
  const plotIds = plotList.map((p) => p.id);
  const plotMap = new Map(plotList.map((p) => [p.id, p]));

  const { data: cycles } = farmIds.length
    ? await supabase
        .from("crop_cycles")
        .select("id, plot_id, farm_id, crop_name, crop_id, variety, variety_id, season, status, target_yield_kg, planted_area_hectares, target_area_ha, start_date, planting_date, expected_harvest_date, current_stage")
        .in("farm_id", farmIds)
        .order("planting_date", { ascending: false })
    : { data: [] };

  const rawCycles = cycles ?? [];
  const cycleList = rawCycles.map((c) => ({
    ...c,
    crop_name: c.crop_name || (c.crop_id ? c.crop_id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Crop"),
    variety: c.variety || c.variety_id || "",
    planted_area_hectares: Number(c.planted_area_hectares ?? c.target_area_ha ?? 1),
    start_date: c.start_date || c.planting_date,
    target_yield_kg: Number(c.target_yield_kg ?? 0),
  }));
  const cycleIds = cycleList.map((c) => c.id);

  const { data: observations } = cycleIds.length
    ? await supabase
        .from("crop_observations")
        .select("id, crop_cycle_id, observation_type, severity, title, description, recommended_action, observed_at")
        .in("crop_cycle_id", cycleIds)
        .order("observed_at", { ascending: false })
        .limit(6)
    : { data: [] };

  const obsList = observations ?? [];

  const totalPlantedHa = cycleList.reduce(
    (sum, c) => sum + (Number(c.planted_area_hectares) || 0),
    0
  );
  const totalTargetYieldMt = (
    cycleList.reduce((sum, c) => sum + (Number(c.target_yield_kg) || 0), 0) / 1000
  ).toFixed(1);

  const hasLiveCycles = cycleList.length > 0;

  return (
    <>
      <LiveStrip tone={hasLiveCycles ? "live" : "preview"}>
        {hasLiveCycles
          ? `Showing ${cycleList.length} active crop cycle${cycleList.length === 1 ? "" : "s"} across ${plotList.length} plots.`
          : "Crop cycles, phenology and scouting logs show sample data until you start a crop cycle on one of your plots."}
      </LiveStrip>
      <CropManagement
        lang={lang}
        slots={{
          actions: (
            <div className="flex items-center gap-space-sm flex-wrap self-start md:self-center">
              <Link
                href={`/${lang}/account/crops/new`}
                className="flex items-center gap-space-xs px-space-md py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-lg text-label-lg transition-all shadow-sm font-semibold"
              >
                <Icon name="add" className="text-lg" />
                <span>Start New Crop Cycle</span>
              </Link>
              <Link
                href={`/${lang}/account/crops/scouting`}
                className="flex items-center gap-space-xs px-space-md py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface rounded-lg font-label-lg text-label-lg transition-all font-semibold"
              >
                <Icon name="add_a_photo" className="text-lg text-secondary" />
                <span>Field Scouting Log</span>
              </Link>
            </div>
          ),
          kpis: hasLiveCycles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Active Planted Area
                  </span>
                  <div className="p-2 rounded-lg bg-surface-container text-secondary">
                    <Icon name="fence" className="text-xl" />
                  </div>
                </div>
                <div className="my-space-md">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">
                      {totalPlantedHa.toFixed(1)}
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">
                      Ha
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {plotList.length} operational field plot{plotList.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-semibold">
                  <Icon name="check_circle" className="text-sm" />
                  <span>{cycleList.length} Active Cycles (Igba Ewe)</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Projected Season Yield
                  </span>
                  <div className="p-2 rounded-lg bg-surface-container text-secondary">
                    <Icon name="grain" className="text-xl" />
                  </div>
                </div>
                <div className="my-space-md">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">
                      {totalTargetYieldMt}
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">
                      MT
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-secondary font-label-md text-label-md font-bold mt-1">
                    <Icon name="trending_up" className="text-sm" />
                    <span>Target Production Output</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-secondary h-1.5 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Scouting Records
                  </span>
                  <div className="p-2 rounded-lg bg-surface-container text-secondary">
                    <Icon name="fact_check" className="text-xl" />
                  </div>
                </div>
                <div className="my-space-md">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">
                      {obsList.length}
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">
                      Logs
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Field diagnostics &amp; scouting sweeps
                  </p>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Epidemiology status</span>
                  <span className="text-secondary font-semibold">Synchronized</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    Field Plots Registered
                  </span>
                  <div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container">
                    <Icon name="verified" className="text-xl" />
                  </div>
                </div>
                <div className="my-space-md">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-secondary font-bold">
                      {plotList.length}
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">
                      Plots
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {farmList.length} Farm enterprise{farmList.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-semibold">
                  <Icon name="check_circle" className="text-sm" />
                  <span>Cadastral Demarcation Active</span>
                </div>
              </div>
            </div>
          ) : undefined,
          portfolios: hasLiveCycles ? (
            <div className="flex flex-col space-y-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                    Active Crop Portfolios &amp; Phenology Stages
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Live telemetry calculated from temperature sums, canopy reflectance &amp; phenological modeling.
                  </p>
                </div>
                <Link
                  href={`/${lang}/account/crops/new`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-on-primary rounded-lg font-label-sm text-label-sm font-semibold hover:bg-primary transition-all self-start sm:self-center"
                >
                  <Icon name="add" className="text-base" /> Start Another Cycle
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
                {cycleList.map((cycle) => {
                  const plot = cycle.plot_id ? plotMap.get(cycle.plot_id) : undefined;
                  return (
                    <div
                      key={cycle.id}
                      className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow"
                    >
                      <div className="p-space-lg space-y-space-md">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">
                              {plot ? `${plot.name} · ${plot.area_ha || cycle.planted_area_hectares} Ha` : `${cycle.planted_area_hectares} Ha`}
                            </span>
                            <h3 className="font-headline-md text-headline-md text-on-surface mt-1">
                              {cycle.crop_name} {cycle.variety ? `(${cycle.variety})` : ""}
                            </h3>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              {cycle.season || "Early Rains 2026"}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold uppercase">
                            {cycle.current_stage || cycle.status}
                          </span>
                        </div>
                        <div className="bg-surface-container-low p-space-md rounded-lg space-y-space-xs">
                          <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                            <span className="font-semibold">Lifecycle Status</span>
                            <span className="text-secondary font-bold capitalize">{cycle.status}</span>
                          </div>
                          <div className="w-full bg-surface-container-highest rounded-full h-2">
                            <div
                              className="bg-secondary h-2 rounded-full"
                              style={{ width: cycle.status === "completed" ? "100%" : "60%" }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-space-sm font-label-sm text-label-sm">
                          <div className="bg-surface p-space-sm rounded">
                            <p className="text-on-surface-variant">Planted Date</p>
                            <p className="font-metric-num text-headline-sm text-primary font-bold">
                              {cycle.start_date ? formatDate(cycle.start_date, lang) : "—"}
                            </p>
                          </div>
                          <div className="bg-surface p-space-sm rounded">
                            <p className="text-on-surface-variant">Target Yield</p>
                            <p className="font-metric-num text-headline-sm text-secondary font-bold">
                              {cycle.target_yield_kg ? `${cycle.target_yield_kg.toLocaleString()} kg` : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-surface-container-low px-space-lg py-space-sm flex items-center justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface-variant">Target Harvest: {cycle.expected_harvest_date ? formatDate(cycle.expected_harvest_date, lang) : "TBD"}</span>
                        <Link
                          className="text-secondary hover:text-primary font-semibold flex items-center gap-0.5"
                          href={`/${lang}/account/crops/${cycle.id}`}
                        >
                          View Plan <Icon name="arrow_forward" className="text-sm" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : undefined,
          scouting: obsList.length > 0 ? (
            <div className="space-y-space-md">
              {obsList.map((obs) => (
                <div key={obs.id} className="bg-surface-container-low p-space-md rounded-xl space-y-space-sm">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">
                        {obs.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold uppercase ${
                          obs.severity === "high" || obs.severity === "critical"
                            ? "bg-error-container text-on-error-container"
                            : "bg-secondary-container text-on-secondary-container"
                        }`}
                      >
                        {obs.severity} Priority
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {obs.observed_at ? formatDate(obs.observed_at, lang) : "Recent"}
                    </span>
                  </div>
                  {obs.description && (
                    <p className="font-body-sm text-body-sm text-on-surface">{obs.description}</p>
                  )}
                  {obs.recommended_action && (
                    <div className="p-space-xs bg-surface-container rounded font-label-sm text-label-sm text-on-surface space-y-0.5">
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Icon name="recommend" className="text-sm" /> Recommended Agronomic Action:
                      </span>
                      <p className="text-xs text-on-surface-variant">{obs.recommended_action}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : undefined,
        }}
      />
    </>
  );
}
