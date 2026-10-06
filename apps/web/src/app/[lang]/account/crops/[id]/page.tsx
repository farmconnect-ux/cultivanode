import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { CropCycleDetailView } from "@/components/account/crop-cycle-detail-view";
import type {
  CropCycle,
  CropCycleOperation,
  CropObservation,
  CropMeasurement,
  CropInputApplication,
  CropHarvest,
  CropAlert,
} from "@cultivanode/shared";

export default async function CropCycleDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const supabase = await createClient();

  const [cycleRes, opsRes, obsRes, measRes, inputsRes, harvestsRes, alertsRes] = await Promise.all([
    (supabase as any)
      .from("crop_cycles")
      .select("*, plots(*, farms(*))")
      .eq("id", id)
      .single(),
    (supabase as any)
      .from("crop_cycle_operations")
      .select("*")
      .eq("cycle_id", id)
      .order("relative_start_day"),
    (supabase as any)
      .from("crop_observations")
      .select("*")
      .eq("cycle_id", id)
      .order("created_at", { ascending: false }),
    (supabase as any)
      .from("crop_measurements")
      .select("*")
      .eq("cycle_id", id)
      .order("recorded_at", { ascending: false }),
    (supabase as any)
      .from("crop_input_applications")
      .select("*")
      .eq("cycle_id", id)
      .order("applied_date", { ascending: false }),
    (supabase as any)
      .from("crop_harvests")
      .select("*")
      .eq("cycle_id", id)
      .order("harvest_date", { ascending: false }),
    (supabase as any)
      .from("crop_alerts")
      .select("*")
      .eq("cycle_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (cycleRes.error || !cycleRes.data) {
    notFound();
  }

  const rawCycle = cycleRes.data;
  const rawPlot = rawCycle.plots as any;
  const rawFarm = rawPlot?.farms as any;

  const cycle: CropCycle = {
    id: rawCycle.id,
    plotId: rawCycle.plot_id,
    cropId: rawCycle.crop_id,
    varietyId: rawCycle.variety_id,
    season: rawCycle.season,
    status: rawCycle.status,
    targetAreaHa: Number(rawCycle.target_area_ha),
    plantingDate: rawCycle.planting_date,
    expectedHarvestDate: rawCycle.expected_harvest_date,
    actualHarvestDate: rawCycle.actual_harvest_date,
    targetYieldKg: Number(rawCycle.target_yield_kg),
    actualYieldKg: Number(rawCycle.actual_yield_kg),
    currentStage: rawCycle.current_stage,
    healthScore: Number(rawCycle.health_score),
    healthStatus: rawCycle.health_status,
    estimatedBudgetKobo: Number(rawCycle.estimated_budget_kobo),
    actualCostKobo: Number(rawCycle.actual_cost_kobo),
    createdBy: rawCycle.created_by,
    createdAt: rawCycle.created_at,
    updatedAt: rawCycle.updated_at,
  };

  const plot = {
    id: rawPlot?.id ?? "",
    name: rawPlot?.name ?? "Plot",
    area_ha: rawPlot?.area_ha ? Number(rawPlot.area_ha) : null,
    soil_texture: rawPlot?.soil_texture,
    irrigation_type: rawPlot?.irrigation_type,
    farm: {
      id: rawFarm?.id ?? "",
      name: rawFarm?.name ?? "My Farm",
      zone: rawFarm?.zone,
    },
  };

  const operations: CropCycleOperation[] = (opsRes.data ?? []).map((o: any) => ({
    id: o.id,
    cycleId: o.cycle_id,
    name: o.name,
    stage: o.stage,
    relativeStartDay: o.relative_start_day,
    relativeEndDay: o.relative_end_day,
    scheduledStartDate: o.scheduled_start_date,
    scheduledEndDate: o.scheduled_end_date,
    actualDate: o.actual_date,
    status: o.status,
    notes: o.notes,
    bookingId: o.booking_id,
    requiredEquipment: o.required_equipment,
    actualCostKobo: Number(o.actual_cost_kobo) || 0,
    completedBy: o.completed_by,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  }));

  const observations: CropObservation[] = (obsRes.data ?? []).map((o: any) => ({
    id: o.id,
    cycleId: o.cycle_id,
    observerId: o.observer_id,
    category: o.category,
    severity: o.severity,
    description: o.description,
    photoPaths: o.photo_paths ?? [],
    location: null,
    recommendedAction: o.recommended_action,
    resolved: o.resolved,
    resolvedAt: o.resolved_at,
    createdAt: o.created_at,
  }));

  const measurements: CropMeasurement[] = (measRes.data ?? []).map((m: any) => ({
    id: m.id,
    cycleId: m.cycle_id,
    metricName: m.metric_name,
    metricValue: Number(m.metric_value),
    recordedAt: m.recorded_at,
    recordedBy: m.recorded_by,
  }));

  const inputs: CropInputApplication[] = (inputsRes.data ?? []).map((i: any) => ({
    id: i.id,
    cycleId: i.cycle_id,
    operationId: i.operation_id,
    category: i.category,
    chemicalId: i.chemical_id,
    productName: i.product_name,
    activeIngredient: i.active_ingredient,
    ratePerHa: Number(i.rate_per_ha),
    unit: i.unit,
    areaAppliedHa: Number(i.area_applied_ha),
    totalQuantity: Number(i.total_quantity),
    costKobo: Number(i.cost_kobo) || 0,
    preHarvestIntervalDays: i.pre_harvest_interval_days ?? 0,
    reEntryIntervalHours: i.re_entry_interval_hours ?? 0,
    appliedDate: i.applied_date,
    appliedBy: i.applied_by,
    createdAt: i.created_at,
  }));

  const harvests: CropHarvest[] = (harvestsRes.data ?? []).map((h: any) => ({
    id: h.id,
    cycleId: h.cycle_id,
    batchCode: h.batch_code,
    harvestDate: h.harvest_date,
    quantityKg: Number(h.quantity_kg),
    qualityGrade: h.quality_grade,
    moisturePct: h.moisture_pct ? Number(h.moisture_pct) : null,
    lossPct: h.loss_pct ? Number(h.loss_pct) : null,
    storageLocation: h.storage_location,
    notes: h.notes,
    recordedBy: h.recorded_by,
    createdAt: h.created_at,
  }));

  const alerts: CropAlert[] = (alertsRes.data ?? []).map((a: any) => ({
    id: a.id,
    cycleId: a.cycle_id,
    category: a.category,
    severity: a.severity,
    title: a.title,
    message: a.message,
    actionUrl: a.action_url,
    isDismissed: a.is_dismissed,
    createdAt: a.created_at,
  }));

  return (
    <CropCycleDetailView
      lang={lang}
      cycle={cycle}
      plot={plot}
      operations={operations}
      observations={observations}
      measurements={measurements}
      inputs={inputs}
      harvests={harvests}
      alerts={alerts}
    />
  );
}
