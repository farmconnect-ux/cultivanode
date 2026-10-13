import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addCropOperation, completeCropOperation, logObservation, recordHarvest, updateCropStage } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, Facts, KpiGrid, Meter, Section, Split, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cap } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, mass, naira, num, pct, relDays, share, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Crop cycle" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/crops/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const supabase = await createClient();
  const { data: c } = await supabase.from("crop_cycles").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();

  const [{ data: farm }, { data: plot }, { data: ops }, { data: obs }, { data: harvests }, { data: std }, { data: variances }] = await Promise.all([
    supabase.from("farms").select("name, state, lga").eq("id", c.farm_id).maybeSingle(),
    c.plot_id ? supabase.from("plots").select("name, plot_code, soil_texture, irrigation_type, soil_ph").eq("id", c.plot_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("crop_cycle_operations").select("*").eq("crop_cycle_id", id).order("scheduled_date"),
    supabase.from("crop_observations").select("*").eq("crop_cycle_id", id).order("observed_at", { ascending: false }),
    supabase.from("crop_harvests").select("*").eq("crop_cycle_id", id).order("harvest_date", { ascending: false }),
    c.standard_id ? supabase.from("farm_agronomic_standards").select("standard_code, source_authority, parameters").eq("id", c.standard_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("farm_plan_actual_variances").select("*").eq("crop_cycle_id", id),
  ]);

  const total = Math.max(1, (Date.parse(c.expected_harvest_date) - Date.parse(c.planting_date)) / 86_400_000);
  const elapsed = Math.max(0, Math.round((nowMs() - Date.parse(c.planting_date)) / 86_400_000));
  const harvested = (harvests ?? []).reduce((s, h) => s + Number(h.quantity_kg), 0);
  const opsCost = (ops ?? []).reduce((s, o) => s + Number(o.actual_cost_kobo), 0);
  const openObs = (obs ?? []).filter((o) => !o.resolved);
  const hidden = { lang, crop_cycle_id: id };
  const title = `${cap(c.crop_id)} ${c.variety_id ?? ""}`.trim();

  return (
    <Stack>
      <PageHeader
        back={{ href: `/${lang}/account/crops`, label: "Crop management" }}
        eyebrow={
          <>
            <Status value={c.status} />
            {c.health_status && <Status value={c.health_status} />}
            <Chip icon="calendar_month">{c.season}</Chip>
            {std && <Chip icon="verified">{std.standard_code}</Chip>}
          </>
        }
        title={title}
        description={`${plot?.name ?? "No plot"} · ${farm?.name ?? ""} · planted ${formatDay(c.planting_date, lang)}, harvest ${relDays(c.expected_harvest_date)}`}
        actions={
          <>
            <ActionDialog
              title="Update stage"
              trigger="Update stage"
              icon="timeline"
              tone="secondary"
              action={updateCropStage}
              hidden={hidden}
              fields={[
                { name: "status", label: "Status", type: "select", required: true, defaultValue: c.status, options: opt(["planning", "land_preparation", "planting", "establishment", "maintenance", "harvesting", "completed", "abandoned"]) },
                { name: "current_stage", label: "Growth stage", defaultValue: c.current_stage ?? "", placeholder: "Tasseling" },
                { name: "health_status", label: "Health", type: "select", defaultValue: c.health_status ?? "", options: opt(["healthy", "watch", "at_risk", "critical"]) },
              ]}
            />
            <ActionDialog
              title="Record a harvest"
              trigger="Record harvest"
              icon="agriculture"
              action={recordHarvest}
              hidden={hidden}
              fields={[
                { name: "quantity_kg", label: "Quantity (kg)", type: "number", required: true },
                { name: "harvest_date", label: "Date", type: "date" },
                { name: "quality_grade", label: "Grade", type: "select", options: opt(["A", "B", "C", "reject"]) },
                { name: "destination", label: "Destination", type: "select", required: true, defaultValue: "store", options: opt(["store", "marketplace", "offtaker", "processing", "home_use"]) },
                { name: "moisture_pct", label: "Moisture %", type: "number" },
                { name: "loss_pct", label: "Loss %", type: "number" },
                { name: "batch_code", label: "Batch code", placeholder: "Generated if blank" },
                { name: "storage_location", label: "Stored at" },
              ]}
            />
          </>
        }
      />

      <KpiGrid>
        <MetricCard label="Season progress" value={`${Math.round(share(elapsed, total))}%`} icon="timelapse" foot={`Day ${elapsed} of ${Math.round(total)}`} />
        <MetricCard label="Harvested" value={mass(harvested || c.actual_yield_kg)} icon="grain" foot={`Target ${mass(c.target_yield_kg)} on ${num(c.target_area_ha, 1)} ha`} />
        <MetricCard label="Spend vs budget" value={pct(share(Number(c.actual_cost_kobo), Number(c.estimated_budget_kobo)))} icon="payments" foot={`${naira(c.actual_cost_kobo)} of ${naira(c.estimated_budget_kobo)}`} />
        <MetricCard label="Open scouting issues" value={openObs.length} icon="pest_control" foot={`Health score ${Math.round(Number(c.health_score ?? 0) * 100)}/100`} />
      </KpiGrid>

      <Split
        wide={
          <>
            <Section
              title="Operations plan"
              icon="checklist"
              description={`Operations cost so far: ${naira(opsCost)}`}
              action={
                <ActionDialog
                  title="Schedule an operation"
                  trigger="Add operation"
                  tone="ghost"
                  action={addCropOperation}
                  hidden={hidden}
                  fields={[
                    { name: "operation_type", label: "Type", type: "select", required: true, options: opt(["land_prep", "planting", "fertiliser", "weed_control", "pest_control", "disease_control", "irrigation", "scouting", "harvest", "other"]) },
                    { name: "name", label: "What", required: true },
                    { name: "scheduled_date", label: "Date", type: "date", required: true },
                    { name: "stage", label: "Stage" },
                    { name: "required_machinery", label: "Machinery" },
                    { name: "notes", label: "Notes", type: "textarea" },
                  ]}
                />
              }
            >
              <DataTable
                rows={ops ?? []}
                rowKey={(o) => o.id}
                empty="No operations planned yet."
                columns={[
                  { label: "Date", cell: (o) => formatDay(o.scheduled_date, lang) },
                  { label: "Operation", cell: (o) => <span className="font-medium">{o.name}</span> },
                  { label: "Stage", cell: (o) => o.stage },
                  { label: "Cost", numeric: true, cell: (o) => (o.actual_cost_kobo ? naira(o.actual_cost_kobo) : "—") },
                  { label: "Status", cell: (o) => <Status value={o.status} /> },
                  {
                    label: "",
                    cell: (o) => (o.status !== "completed" ? <ActionButton action={completeCropOperation} hidden={{ lang, id: o.id }} label="Done" /> : null),
                  },
                ]}
              />
            </Section>
            <Section title="Harvest batches" icon="inventory">
              <DataTable
                rows={harvests ?? []}
                rowKey={(h) => h.id}
                empty="No harvest recorded yet."
                columns={[
                  { label: "Batch", cell: (h) => <span className="font-medium">{h.batch_code}</span> },
                  { label: "Date", cell: (h) => (h.harvest_date ? formatDay(h.harvest_date, lang) : "—") },
                  { label: "Quantity", numeric: true, cell: (h) => mass(h.quantity_kg) },
                  { label: "Grade", cell: (h) => h.quality_grade ?? "—" },
                  { label: "Moisture", numeric: true, cell: (h) => (h.moisture_pct != null ? pct(h.moisture_pct, 1) : "—") },
                  { label: "Destination", cell: (h) => label(h.destination) },
                ]}
              />
            </Section>
            {(variances ?? []).length > 0 && (
              <Section title="Standard vs plan vs actual" icon="compare_arrows">
                <DataTable
                  rows={variances ?? []}
                  rowKey={(v) => v.id}
                  columns={[
                    { label: "Metric", cell: (v) => v.metric_name },
                    { label: "Standard", numeric: true, cell: (v) => `${num(v.standard_value, 2)} ${v.unit}` },
                    { label: "Plan", numeric: true, cell: (v) => num(v.plan_value, 2) },
                    { label: "Actual", numeric: true, cell: (v) => num(v.actual_value, 2) },
                    { label: "vs plan", numeric: true, cell: (v) => pct(share(Number(v.actual_value), Number(v.plan_value) || 1) - 100) },
                  ]}
                />
              </Section>
            )}
          </>
        }
        side={
          <>
            <Section title="Field facts" icon="info">
              <Facts
                className="sm:grid-cols-1"
                items={[
                  ["Plot", plot ? `${plot.name}${plot.plot_code ? ` (${plot.plot_code})` : ""}` : "—"],
                  ["Soil", label(plot?.soil_texture)],
                  ["Soil pH", plot?.soil_ph ?? "—"],
                  ["Water", label(plot?.irrigation_type)],
                  ["Seed", c.seed_quantity_kg ? `${num(c.seed_quantity_kg)} kg` : "—"],
                  ["Plant population", c.plant_population_per_ha ? `${num(c.plant_population_per_ha)}/ha` : "—"],
                  ["Location", [farm?.lga, farm?.state].filter(Boolean).join(", ") || "—"],
                ]}
              />
              <div className="mt-4">
                <p className="mb-1 text-body-sm text-on-surface-variant">Health score</p>
                <Meter value={Number(c.health_score ?? 0) * 100} tone={c.health_status === "healthy" ? "positive" : c.health_status === "watch" ? "caution" : "critical"} />
              </div>
              {c.notes && <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface">{c.notes}</p>}
            </Section>
            <Section
              title="Scouting log"
              icon="pest_control"
              action={
                <ActionDialog
                  title="Log a scouting observation"
                  trigger="Log"
                  tone="ghost"
                  action={logObservation}
                  hidden={hidden}
                  fields={[
                    { name: "category", label: "Category", type: "select", required: true, options: opt(["pest", "disease", "nutrient_deficiency", "weed_infestation", "water_stress", "general"]) },
                    { name: "severity", label: "Severity", type: "select", required: true, defaultValue: "medium", options: opt(["low", "medium", "high", "critical"]) },
                    { name: "title", label: "Title", required: true, wide: true },
                    { name: "description", label: "What you saw", type: "textarea", required: true },
                    { name: "recommended_action", label: "Recommended action", type: "textarea" },
                  ]}
                />
              }
            >
              <ul className="flex flex-col gap-3">
                {(obs ?? []).map((o) => (
                  <li key={o.id} className="rounded-lg border border-outline-variant/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-label-lg text-label-lg text-on-surface">{o.title}</p>
                      <Status value={o.resolved ? "resolved" : o.severity} />
                    </div>
                    <p className="mt-1 text-body-sm text-on-surface-variant">{o.description}</p>
                    {o.recommended_action && <p className="mt-1 text-body-sm text-on-surface">→ {o.recommended_action}</p>}
                  </li>
                ))}
                {!obs?.length && <li className="py-4 text-center text-body-sm text-on-surface-variant">No observations yet.</li>}
              </ul>
            </Section>
          </>
        }
      />
    </Stack>
  );
}
