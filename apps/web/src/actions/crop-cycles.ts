"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import {
  getCropById,
  generatePlantingSchedule,
  type AgronomySeason,
  type FarmZone,
  type CropVariety,
  type ScheduledOperation,
} from "@cultivanode/shared";

export type CropActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  at?: number;
  cycleId?: string;
  data?: Record<string, string>;
};

const ok = (extra: Partial<CropActionState> = {}): CropActionState => ({
  ok: true,
  at: Date.now(),
  ...extra,
});

const bad = (error: string, extra: Partial<CropActionState> = {}): CropActionState => ({
  ok: false,
  error,
  at: Date.now(),
  ...extra,
});

const text = (form: FormData, key: string, max: number) =>
  String(form.get(key) ?? "").trim().slice(0, max);

function lang(form: FormData): Locale {
  const l = text(form, "lang", 5);
  return hasLocale(l) ? l : "en";
}

async function signedIn(form?: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const l = form ? lang(form) : "en";
    redirect(`/${l}/sign-in`);
  }
  return { supabase, uid: data.user.id };
}

/* ------------------------------------------------------------------ CM-03 / CM-04: Create Crop Plan */

export async function createCropPlanAction(
  _prev: CropActionState,
  form: FormData
): Promise<CropActionState> {
  const s = await signedIn(form);
  const plotId = text(form, "plot_id", 36);
  const cropId = text(form, "crop_id", 60);
  const varietyId = text(form, "variety_id", 60);
  const season = text(form, "season", 30) || "early_rainy";
  const plantingDate = text(form, "planting_date", 10);
  const areaRaw = text(form, "target_area_ha", 12);
  const targetYieldRaw = text(form, "target_yield_kg", 12);
  const budgetRaw = text(form, "estimated_budget_ngn", 15);

  if (!plotId) return bad("errorPlotRequired");
  if (!cropId) return bad("errorCropRequired");
  if (!varietyId) return bad("errorVarietyRequired");
  if (!plantingDate || !/^\d{4}-\d{2}-\d{2}$/.test(plantingDate)) return bad("errorPlantingDateInvalid");

  const targetAreaHa = Number(areaRaw.replace(",", "."));
  if (!Number.isFinite(targetAreaHa) || targetAreaHa <= 0) return bad("errorAreaInvalid");

  const crop = getCropById(cropId);
  if (!crop) return bad("errorCropNotRecognized");

  const variety = crop.varieties.find((v: CropVariety) => v.id === varietyId) ?? crop.varieties[0]!;

  // Default target yield from catalogue if not provided
  let targetYieldKg = Number(targetYieldRaw.replace(",", "."));
  if (!Number.isFinite(targetYieldKg) || targetYieldKg <= 0) {
    const yieldPerHa = variety.typicalYieldTonsPerHa ?? variety.expectedYieldTonnesPerHa ?? 3;
    targetYieldKg = Math.round(yieldPerHa * targetAreaHa * 1000);
  }

  // Budget in integer kobo
  let budgetKobo = 0;
  if (budgetRaw) {
    const budgetNgn = Number(budgetRaw.replace(",", "."));
    if (Number.isFinite(budgetNgn) && budgetNgn >= 0) {
      budgetKobo = Math.round(budgetNgn * 100);
    }
  }

  // Fetch plot and farm zone to generate agronomic schedule
  const { data: plotData, error: plotErr } = await s.supabase
    .from("plots")
    .select("id, farm_id, area_ha, farms(zone)")
    .eq("id", plotId)
    .single();

  if (plotErr || !plotData) {
    logger.warn("crop_cycles.plot_not_found", { plotId, error: String(plotErr) });
    return bad("errorPlotNotFound");
  }

  const farmZone: FarmZone = ((plotData.farms as any)?.zone as FarmZone) ?? "derived_savanna";

  // Generate deterministic planting schedule from agronomy engine
  const schedule = generatePlantingSchedule({
    cropId,
    varietyId: variety.id,
    farmAreaHectares: targetAreaHa,
    plantingDate,
    zone: farmZone,
    season: season as AgronomySeason,
  });

  // Insert into crop_cycles
  const { data: cycleRow, error: cycleErr } = await (s.supabase as any)
    .from("crop_cycles")
    .insert({
      plot_id: plotId,
      crop_id: cropId,
      variety_id: variety.id,
      season,
      status: "planning",
      target_area_ha: targetAreaHa,
      planting_date: plantingDate,
      expected_harvest_date: schedule.harvestEstimatedDate,
      target_yield_kg: targetYieldKg,
      current_stage: crop?.stages?.[0]?.id ?? crop?.growthStages?.[0]?.id ?? "land_prep",
      health_score: 1.0,
      health_status: "excellent",
      estimated_budget_kobo: budgetKobo,
      actual_cost_kobo: 0,
      created_by: s.uid,
    })
    .select("id")
    .single();

  if (cycleErr || !cycleRow) {
    logger.error("crop_cycles.create_failed", { plotId, error: String(cycleErr) });
    if (cycleErr?.code === "23505") {
      return bad("errorPlotHasActiveCycle");
    }
    return bad("errorFailedToSavePlan");
  }

  const cycleId = (cycleRow as any).id as string;

  // Insert scheduled operations from agronomic engine
  if (schedule.operations.length > 0) {
    const opsToInsert = schedule.operations.map((op: ScheduledOperation) => ({
      cycle_id: cycleId,
      name: op.name,
      stage: op.stage,
      relative_start_day: op.relativeStartDay,
      relative_end_day: op.relativeEndDay,
      scheduled_start_date: op.startDate,
      scheduled_end_date: op.endDate,
      status: "pending" as const,
      required_equipment: op.requirements.equipment?.[0] ?? (op.requirements as any).machineryNeeded?.[0] ?? null,
      notes: op.description ?? null,
    }));

    const { error: opsErr } = await (s.supabase as any)
      .from("crop_cycle_operations")
      .insert(opsToInsert);

    if (opsErr) {
      logger.error("crop_cycles.ops_insert_failed", { cycleId, error: String(opsErr) });
    }
  }

  refresh();
  return ok({ cycleId, message: "Crop cycle planned successfully" });
}

/* ------------------------------------------------------------------ Lifecycle Status Actions */

export async function activateCropCycleAction(cycleId: string): Promise<CropActionState> {
  const s = await signedIn();
  const { error } = await (s.supabase as any)
    .from("crop_cycles")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", cycleId);

  if (error) {
    logger.error("crop_cycles.activate_failed", { cycleId, error: String(error) });
    return bad("errorFailedToActivate");
  }

  refresh();
  return ok({ message: "Crop cycle activated" });
}

export async function completeCropCycleAction(cycleId: string): Promise<CropActionState> {
  const s = await signedIn();
  const { error } = await (s.supabase as any)
    .from("crop_cycles")
    .update({
      status: "completed",
      actual_harvest_date: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    })
    .eq("id", cycleId);

  if (error) {
    logger.error("crop_cycles.complete_failed", { cycleId, error: String(error) });
    return bad("errorFailedToComplete");
  }

  refresh();
  return ok({ message: "Crop cycle completed" });
}

export async function abandonCropCycleAction(cycleId: string): Promise<CropActionState> {
  const s = await signedIn();
  const { error } = await (s.supabase as any)
    .from("crop_cycles")
    .update({ status: "abandoned", updated_at: new Date().toISOString() })
    .eq("id", cycleId);

  if (error) {
    logger.error("crop_cycles.abandon_failed", { cycleId, error: String(error) });
    return bad("errorFailedToAbandon");
  }

  refresh();
  return ok({ message: "Crop cycle marked as abandoned" });
}
