import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addCropOperation, addSuggestedOperations, completeCropOperation, logObservation, recordHarvest, setCropOperationStatus, updateCropStage, updatePlantCount } from "@/actions/farm-ops";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, Facts, KpiGrid, Meter, Section, Split, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cap } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, mass, naira, num, pct, relDays, share, nowMs } from "@/lib/format";
import { addDays, missingOperations, stageOn, suggestCropPlan } from "@/lib/crop-plan";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SCOUT_PHOTO_FIELD, ScoutResult } from "@/components/live/scout-result";
import type { Diagnosis } from "@/lib/ai-vision";
import { isOn } from "@/lib/flags";
import { signedPhotoUrls } from "@/lib/scouting-photos";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Crop cycle" };
// Saving a scouting observation with photos can wait for the AI to look at them.
export const maxDuration = 60;

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params, searchParams }: PageProps<"/[lang]/account/crops/[id]">) {
  const { lang, id } = await params;
  const sp = await searchParams;
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
  type Obs = NonNullable<typeof obs>[number] & { ai_diagnosis?: Diagnosis | null; ai_analysed_at?: string | null };
  const [aiOn, signed] = await Promise.all([isOn("ai_photo_diagnosis"), signedPhotoUrls(supabase as unknown as SupabaseClient, (obs ?? []).flatMap((o) => o.photo_urls ?? []))]);
  const hidden = { lang, crop_cycle_id: id };
  const title = `${cap(c.crop_id)} ${c.variety_id ?? ""}`.trim();
  const today = new Date(nowMs()).toISOString().slice(0, 10);
  const plan = suggestCropPlan(c.crop_id, c.planting_date, c.variety_id);
  const suggestedOps = missingOperations(plan.operations, ops ?? [], c.planting_date < today ? addDays(today, -14) : undefined);
  const stageNow = stageOn(plan.stages, today);
  const planned = typeof sp.planned === "string" ? Number(sp.planned) : null;
  // Stand count: plants established at planting and still alive at the last count.
  const planted = c.plants_planted;
  const alive = c.plants_alive;
  const survival = planted ? Math.round(share(alive ?? planted, planted)) : null;

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
              title="Update stand count"
              description="How many plants are alive now? Lower it when plants die (pests, flood, drought) and say why; the history is kept in the cycle notes."
              trigger="Stand count"
              icon="eco"
              tone="secondary"
              action={updatePlantCount}
              hidden={hidden}
              fields={[
                { name: "plants_alive", label: "Plants alive now", type: "number", required: true, min: 0, defaultValue: alive ?? planted ?? "" },
                ...(planted == null ? [{ name: "plants_planted", label: "Plants established at planting", type: "number" as const, min: 0 }] : []),
                { name: "cause", label: "Cause of loss (optional)", placeholder: "e.g. termites, flooding, replanted gaps" },
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

      {planned != null && Number.isFinite(planned) && (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-positive-soft px-4 py-3 text-body-sm text-[#065f46]">
          <Icon name="check_circle" className="mt-0.5 text-base" />
          Crop cycle created with {planned} planned operation{planned === 1 ? "" : "s"}. They are already on Field Operations &amp; Calendar and in your phone calendar feed.
        </p>
      )}
      <KpiGrid>
        <MetricCard label="Season progress" value={`${Math.round(share(elapsed, total))}%`} icon="timelapse" foot={`Day ${elapsed} of ${Math.round(total)}`} />
        <MetricCard label="Harvested" value={mass(harvested || c.actual_yield_kg)} icon="grain" foot={`Target ${mass(c.target_yield_kg)} on ${num(c.target_area_ha, 1)} ha`} />
        <MetricCard label="Spend vs budget" value={pct(share(Number(c.actual_cost_kobo), Number(c.estimated_budget_kobo)))} icon="payments" foot={`${naira(c.actual_cost_kobo)} of ${naira(c.estimated_budget_kobo)}`} />
        <MetricCard
          label="Plant stand"
          value={alive != null ? num(alive) : planted != null ? num(planted) : "—"}
          unit={alive != null || planted != null ? "plants" : undefined}
          icon="eco"
          foot={
            planted
              ? `${survival}% of ${num(planted)} planted${c.plants_counted_on ? ` · counted ${formatDay(c.plants_counted_on, lang)}` : ""}`
              : "Add the number of plants with Stand count"
          }
        />
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
                    cell: (o) =>
                      o.status === "completed" || o.status === "skipped" || o.status === "cancelled" ? null : (
                        <div className="flex flex-wrap justify-end gap-1">
                          {o.status === "pending" && <ActionButton action={setCropOperationStatus} hidden={{ lang, id: o.id, status: "in_progress" }} label="Start" icon="play_arrow" />}
                          <ActionButton action={completeCropOperation} hidden={{ lang, id: o.id }} label="Done" />
                          <ActionButton action={setCropOperationStatus} hidden={{ lang, id: o.id, status: "skipped" }} label="Skip" icon="block" confirm="Skip this operation?" />
                        </div>
                      ),
                  },
                ]}
              />
            </Section>
            <Section
              title="Suggested operations"
              icon="tips_and_updates"
              description={
                plan.specific
                  ? `From the ${cap(plan.cropId)} good agricultural practice calendar, dated from your planting day, leaving out work your plan already covers. Add the ones you'll do.`
                  : "A general field-crop calendar (no crop-specific template yet), dated from your planting day."
              }
              action={
                suggestedOps.length > 1 ? (
                  <ActionButton action={addSuggestedOperations} hidden={hidden} label={`Add all ${suggestedOps.length}`} icon="done_all" tone="primary" />
                ) : undefined
              }
            >
              <DataTable
                rows={suggestedOps}
                rowKey={(o) => o.key}
                empty="Every suggested operation is already in your plan."
                columns={[
                  { label: "When", cell: (o) => `${formatDay(o.startsOn, lang)} (${relDays(o.startsOn)})` },
                  {
                    label: "Operation",
                    cell: (o) => (
                      <div className="max-w-md">
                        <p className="font-medium">{o.name}</p>
                        <p className="text-body-sm text-on-surface-variant">{o.description}</p>
                      </div>
                    ),
                  },
                  { label: "Stage", cell: (o) => o.stage },
                  { label: "Machinery", cell: (o) => o.machinery ?? "—" },
                  {
                    label: "",
                    cell: (o) => (
                      <ActionButton
                        action={addCropOperation}
                        hidden={{
                          ...hidden,
                          operation_type: o.operationType,
                          name: o.name,
                          scheduled_date: o.startsOn < today && c.status !== "planning" ? today : o.startsOn,
                          stage: o.stage,
                          required_machinery: o.machinery ?? "",
                          notes: o.description,
                        }}
                        label="Add"
                        icon="add"
                      />
                    ),
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
            {plan.stages.length > 0 && (
              <Section
                title="Growth stages"
                icon="timeline"
                description={stageNow ? `By the calendar, this crop should be at: ${stageNow.name}.` : "Stages start from your planting date."}
              >
                <ol className="flex flex-col gap-2">
                  {plan.stages.map((st) => {
                    const now = stageNow?.id === st.id;
                    const past = st.endsOn < today;
                    return (
                      <li key={st.id} className={`rounded-lg border p-2.5 ${now ? "border-primary-container bg-secondary-container/20" : "border-outline-variant/40"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-label-lg text-label-lg ${past && !now ? "text-on-surface-variant" : "text-on-surface"}`}>
                            {past && !now ? "✓ " : ""}
                            {st.name}
                          </p>
                          {now && <Status value="current" />}
                          {c.current_stage === st.name && !now && <Status value="recorded" />}
                        </div>
                        <p className="text-body-sm text-on-surface-variant">
                          {formatDay(st.startsOn, lang)} – {formatDay(st.endsOn, lang)}
                        </p>
                        {now && <p className="mt-1 text-body-sm text-on-surface">{st.description}</p>}
                      </li>
                    );
                  })}
                </ol>
                {stageNow && stageNow.name !== c.current_stage && (
                  <div className="mt-3">
                    <ActionButton action={updateCropStage} hidden={{ ...hidden, status: c.status, current_stage: stageNow.name }} label={`Set stage to ${stageNow.name}`} icon="check" />
                  </div>
                )}
              </Section>
            )}
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
                    SCOUT_PHOTO_FIELD,
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
                    <div className="mt-2">
                      <ScoutResult id={o.id} lang={lang} photos={o.photo_urls ?? []} signed={signed} diagnosis={(o as Obs).ai_diagnosis ?? null} analysedAt={(o as Obs).ai_analysed_at ?? null} aiOn={aiOn} />
                    </div>
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
