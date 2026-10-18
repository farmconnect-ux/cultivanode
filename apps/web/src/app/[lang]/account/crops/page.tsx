import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addCropOperation, createCropCycle, createPlot } from "@/actions/farm-ops";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Meter, Pill, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cap, cycleOptions, farmOptions, loadFarmScope, plotOptions } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { mass, naira, num, relDays, share, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Crop management" };

const CROPS = ["maize", "cassava", "soybean", "rice", "sorghum", "yam", "cowpea", "groundnut", "tomato", "pepper", "okra", "cucumber", "watermelon"].map((c) => ({ value: c, label: cap(c) }));
const HEALTH_TONE = { healthy: "positive", watch: "caution", at_risk: "critical", critical: "critical" } as const;

export default async function Page({ params }: PageProps<"/[lang]/account/crops">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds;

  const [{ data: cycles }, { data: ops }] = ids.length
    ? await Promise.all([
        supabase
          .from("crop_cycles")
          .select("id, farm_id, plot_id, crop_id, variety_id, season, status, current_stage, target_area_ha, planting_date, expected_harvest_date, target_yield_kg, actual_yield_kg, health_score, health_status, estimated_budget_kobo, actual_cost_kobo")
          .in("farm_id", ids)
          .order("planting_date", { ascending: false }),
        supabase
          .from("crop_cycle_operations")
          .select("id, crop_cycle_id, name, operation_type, stage, status, scheduled_date")
          .in("crop_cycle_id", scope.cycles.map((c) => c.id).concat("00000000-0000-0000-0000-000000000000"))
          .neq("status", "completed")
          .order("scheduled_date")
          .limit(12),
      ])
    : [{ data: [] }, { data: [] }];

  const all = cycles ?? [];
  const active = all.filter((c) => !["completed", "abandoned"].includes(c.status));
  const plotName = new Map(scope.plots.map((p) => [p.id, p.name]));
  const farmName = new Map(scope.farms.map((f) => [f.id, f.name]));
  const cycleName = new Map(all.map((c) => [c.id, `${cap(c.crop_id)} ${c.variety_id ?? ""}`.trim()]));
  const area = active.reduce((s, c) => s + Number(c.target_area_ha), 0);
  const projected = active.reduce((s, c) => s + Number(c.target_yield_kg ?? 0), 0);
  const budget = active.reduce((s, c) => s + Number(c.estimated_budget_kobo), 0);
  const spent = active.reduce((s, c) => s + Number(c.actual_cost_kobo), 0);
  const avgHealth = active.length ? active.reduce((s, c) => s + Number(c.health_score ?? 0), 0) / active.length : 0;
  const atRisk = active.filter((c) => c.health_status === "at_risk" || c.health_status === "critical");
  const hidden = { lang };

  const startCycle = (
    <ActionDialog
      title="Start a crop cycle"
      description="Plan a planting on one of your plots. Maize, cassava and soybean link to the GAP standard automatically."
      trigger="New crop cycle"
      action={createCropCycle}
      hidden={hidden}
      fields={[
        { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
        { name: "plot_id", label: "Plot", type: "select", options: plotOptions(scope) },
        { name: "crop_id", label: "Crop", type: "select", required: true, options: CROPS },
        { name: "variety_id", label: "Variety", placeholder: "e.g. SAMMAZ 15" },
        { name: "season", label: "Season", placeholder: `${new Date().getFullYear()} late season` },
        { name: "target_area_ha", label: "Area (ha)", type: "number", required: true, min: 0.01 },
        { name: "planting_date", label: "Planting date", type: "date", required: true },
        { name: "expected_harvest_date", label: "Expected harvest", type: "date", required: true },
        { name: "target_yield_kg", label: "Target yield (kg)", type: "number" },
        { name: "plants_planted", label: "Number of plants / stands", type: "number", min: 0 },
        { name: "estimated_budget", label: "Budget (₦)", type: "number" },
      ]}
    />
  );

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="potted_plant">{active.length} active cycles</Chip>
            <Chip icon="landscape">{scope.plots.length} plots</Chip>
          </>
        }
        title="Crop Phenology & Production"
        description="Every crop cycle on your farms — stage, health, cost against budget and the operations coming up."
        actions={
          <>
            <Link href={`/${lang}/account/crops/scouting`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3.5 py-2 font-label-md text-label-md text-on-surface shadow-sm ring-1 ring-outline-variant/60 hover:bg-surface-container-low">
              <Icon name="pest_control" className="text-base" /> Field scouting
            </Link>
            {scope.farms.length > 0 && (
              <ActionDialog
                title="Add a plot"
                trigger="Add plot"
                icon="add_location_alt"
                tone="secondary"
                action={createPlot}
                hidden={hidden}
                fields={[
                  { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                  { name: "name", label: "Plot name", required: true },
                  { name: "plot_code", label: "Code", placeholder: "NB-A" },
                  { name: "area_ha", label: "Area (ha)", type: "number" },
                  { name: "soil_texture", label: "Soil texture", type: "select", options: ["sandy", "loamy_sand", "sandy_loam", "loam", "silt_loam", "clay_loam", "clay"].map((v) => ({ value: v, label: cap(v.replace(/_/g, " ")) })) },
                  { name: "irrigation_type", label: "Water", type: "select", options: ["rainfed", "drip", "sprinkler", "furrow", "manual"].map((v) => ({ value: v, label: cap(v) })) },
                ]}
              />
            )}
            {scope.farms.length > 0 && startCycle}
          </>
        }
      />

      {!scope.farms.length && (
        <StartHere title="Register a farm first" action={<Link className="font-label-md text-primary-container" href={`/${lang}/account/farms/new`}>Add a farm →</Link>}>
          Crop cycles live on your farm&apos;s plots.
        </StartHere>
      )}

      <KpiGrid>
        <MetricCard label="Active planted area" value={num(area, 1)} unit="ha" icon="fence" foot={`${active.length} cycles across ${new Set(active.map((c) => c.farm_id)).size} farms`} />
        <MetricCard label="Projected yield" value={mass(projected)} icon="grain" foot="Sum of target yields for active cycles" />
        <MetricCard
          label="Cost vs budget"
          value={`${Math.round(share(spent, budget))}%`}
          icon="account_balance_wallet"
          foot={`${naira(spent)} of ${naira(budget)}`}
        />
        <MetricCard
          label="Crop health index"
          value={`${Math.round(avgHealth * 100)}`}
          unit="/100"
          icon="health_and_safety"
          iconTone={atRisk.length ? "bg-critical-soft text-critical" : undefined}
          foot={atRisk.length ? `${atRisk.length} cycle${atRisk.length > 1 ? "s" : ""} at risk` : "No cycles at risk"}
        />
      </KpiGrid>

      <Split
        wide={
          <Section title="Active crop portfolio" icon="potted_plant" description="Stage progress is days since planting over the season length.">
            {active.length ? (
              <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
                {active.map((c) => {
                  const total = Math.max(1, (Date.parse(c.expected_harvest_date) - Date.parse(c.planting_date)) / 86_400_000);
                  const done = Math.max(0, (nowMs() - Date.parse(c.planting_date)) / 86_400_000);
                  const prog = share(done, total);
                  return (
                    <Link key={c.id} href={`/${lang}/account/crops/${c.id}`} className="card-interactive flex flex-col gap-3 rounded-xl border border-outline-variant/40 p-space-md">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">
                            {(c.plot_id && plotName.get(c.plot_id)) || "No plot"} · {num(c.target_area_ha, 1)} ha · {farmName.get(c.farm_id)}
                          </p>
                          <p className="font-headline-sm text-headline-sm text-on-surface">
                            {cap(c.crop_id)} {c.variety_id}
                          </p>
                        </div>
                        {c.health_status && <Pill tone={HEALTH_TONE[c.health_status as keyof typeof HEALTH_TONE] ?? "neutral"}>{c.health_status.replace("_", " ")}</Pill>}
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-body-sm">
                          <span className="text-on-surface">{c.current_stage ?? cap(c.status.replace(/_/g, " "))}</span>
                          <span className="text-on-surface-variant">harvest {relDays(c.expected_harvest_date)}</span>
                        </div>
                        <Meter value={prog} />
                      </div>
                      <div className="flex justify-between text-body-sm text-on-surface-variant">
                        <span>Target {mass(c.target_yield_kg)}</span>
                        <span>
                          {naira(c.actual_cost_kobo)} / {naira(c.estimated_budget_kobo)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-body-sm text-on-surface-variant">No active crop cycles. Start one to track stages, inputs and costs.</p>
            )}
          </Section>
        }
        side={
          <Section
            title="Upcoming operations"
            icon="event_upcoming"
            action={
              scope.cycles.length > 0 && (
                <ActionDialog
                  title="Schedule an operation"
                  trigger="Schedule"
                  icon="add"
                  tone="ghost"
                  action={addCropOperation}
                  hidden={hidden}
                  fields={[
                    { name: "crop_cycle_id", label: "Crop cycle", type: "select", required: true, options: cycleOptions(scope) },
                    { name: "operation_type", label: "Type", type: "select", required: true, options: ["land_prep", "planting", "fertiliser", "weed_control", "pest_control", "disease_control", "irrigation", "scouting", "harvest", "other"].map((v) => ({ value: v, label: cap(v.replace(/_/g, " ")) })) },
                    { name: "name", label: "What", required: true, placeholder: "Urea top-dressing" },
                    { name: "scheduled_date", label: "Date", type: "date", required: true },
                    { name: "stage", label: "Crop stage", placeholder: "Vegetative" },
                    { name: "required_machinery", label: "Machinery", placeholder: "Boom sprayer" },
                  ]}
                />
              )
            }
          >
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {(ops ?? []).map((o) => (
                <li key={o.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-label-lg text-label-lg text-on-surface">{o.name}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {cycleName.get(o.crop_cycle_id)} · {formatDay(o.scheduled_date, lang)}
                    </p>
                  </div>
                  <Status value={o.status} />
                </li>
              ))}
              {!ops?.length && <li className="py-6 text-center text-body-sm text-on-surface-variant">Nothing scheduled.</li>}
            </ul>
          </Section>
        }
      />

      <Section title="Season history" icon="history" description="Completed and abandoned cycles with actual yield.">
        <DataTable
          rows={all.filter((c) => ["completed", "abandoned"].includes(c.status))}
          rowKey={(c) => c.id}
          empty="No completed cycles yet."
          columns={[
            { label: "Crop", cell: (c) => <Link className="font-medium text-primary-container hover:underline" href={`/${lang}/account/crops/${c.id}`}>{cap(c.crop_id)} {c.variety_id}</Link> },
            { label: "Season", cell: (c) => c.season },
            { label: "Area", numeric: true, cell: (c) => `${num(c.target_area_ha, 1)} ha` },
            { label: "Yield", numeric: true, cell: (c) => mass(c.actual_yield_kg) },
            { label: "Yield / ha", numeric: true, cell: (c) => `${num(Number(c.actual_yield_kg) / Number(c.target_area_ha))} kg` },
            { label: "Cost", numeric: true, cell: (c) => naira(c.actual_cost_kobo) },
            { label: "Status", cell: (c) => <Status value={c.status} /> },
          ]}
        />
      </Section>
    </Stack>
  );
}
