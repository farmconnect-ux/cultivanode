"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { StandardPlanActualEngine, FarmAgronomicStandard } from "@cultivanode/shared";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createCropCycle(form: FormData): Promise<{ id?: string; error?: string } | void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const plotId = String(form.get("plot_id") || "").trim();
  const cropName = String(form.get("crop_name") || form.get("crop_id") || "").trim();
  const variety = String(form.get("variety") || form.get("variety_id") || "").trim();
  const plantedAreaHectares = parseFloat(String(form.get("planted_area_hectares") || form.get("target_area_ha") || "1")) || 1;
  const startDate = String(form.get("start_date") || form.get("planting_date") || new Date().toISOString().split("T")[0]).trim();
  const targetHarvestDate = String(form.get("target_harvest_date") || form.get("expected_harvest_date") || "").trim() || null;
  const targetYieldKg = parseFloat(String(form.get("target_yield_kg") || "0")) || null;
  const budgetCapMinor = parseInt(String(form.get("budget_cap_minor") || form.get("estimated_budget_kobo") || "0"), 10);
  const season = String(form.get("season") || "Early Rains 2026").trim();
  const standardId = String(form.get("standard_id") || "").trim();

  if (!farmId || !cropName) return { error: "Farm and Crop Name are required" };

  const insertPayload: Record<string, any> = {
    farm_id: farmId,
    plot_id: plotId || null,
    crop_id: cropName.toLowerCase().replace(/\s+/g, "_"),
    crop_name: cropName,
    variety: variety || null,
    variety_id: variety || null,
    season,
    planted_area_hectares: plantedAreaHectares,
    target_area_ha: plantedAreaHectares,
    start_date: startDate,
    planting_date: startDate,
    target_harvest_date: targetHarvestDate,
    expected_harvest_date: targetHarvestDate || startDate,
    target_yield_kg: targetYieldKg || 0,
    budget_cap_minor: budgetCapMinor,
    estimated_budget_kobo: budgetCapMinor,
    status: "planning",
    current_stage: "Planning",
  };

  const { data: cycle, error: cycleErr } = await supabase
    .from("crop_cycles")
    .insert(insertPayload)
    .select()
    .single();

  if (cycleErr) {
    return { error: cycleErr.message };
  }

  if (cycle && standardId) {
    const { data: stdData } = await supabase
      .from("farm_agronomic_standards")
      .select("*")
      .eq("id", standardId)
      .single();

    if (stdData) {
      const standardObj: FarmAgronomicStandard = {
        id: stdData.id,
        cropName: stdData.crop_name || cropName,
        variety: stdData.variety || undefined,
        agroEcologicalZone: stdData.agro_ecological_zone || undefined,
        version: typeof stdData.version === "number" ? stdData.version : 1,
        expectedYieldKgPerHa: stdData.expected_yield_kg_per_ha || 3500,
        expectedDurationDays: stdData.expected_duration_days || 120,
        seedRateKgPerHa: stdData.seed_rate_kg_per_ha || 25,
        recommendedOperations: (stdData.recommended_operations as any) || [],
      };

      const plan = StandardPlanActualEngine.generatePlanFromStandard(standardObj, {
        farmId,
        plotId,
        cropName,
        variety,
        plantedAreaHectares,
        startDate,
        targetHarvestDate: targetHarvestDate || undefined,
        targetYieldKg: targetYieldKg || undefined,
        budgetCapMinor,
      });

      const opsToInsert = plan.recommendedOperations.map((op) => ({
        crop_cycle_id: cycle.id,
        name: op.activity,
        operation_type: op.activity.toLowerCase().replace(/\s+/g, "_"),
        stage: op.stage || "Establishment",
        scheduled_date: op.scheduledDate,
        status: "pending",
        planned_inputs: (op.recommendedInputs as any) || null,
        notes: `Advisory Stage: ${op.stage}`,
      }));

      if (opsToInsert.length > 0) {
        await supabase.from("crop_cycle_operations").insert(opsToInsert);
      }
    }
  }

  revalidatePath("/account/crops");
  return { id: cycle?.id };
}

export async function logCropOperation(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const cycleId = String(form.get("crop_cycle_id") || "").trim();
  const name = String(form.get("name") || form.get("operation_type") || "").trim();
  const operationType = String(form.get("operation_type") || name).trim().toLowerCase().replace(/\s+/g, "_");
  const stage = String(form.get("stage") || "Vegetative").trim();
  const scheduledDate = String(form.get("scheduled_date") || new Date().toISOString().split("T")[0]).trim();
  const completedDate = String(form.get("completed_date") || "").trim() || null;
  const actualCostKobo = parseInt(String(form.get("actual_cost_kobo") || form.get("direct_cost_minor") || "0"), 10);
  const notes = String(form.get("notes") || "").trim();

  if (!cycleId || !name) return;

  await supabase.from("crop_cycle_operations").insert({
    crop_cycle_id: cycleId,
    name,
    operation_type: operationType,
    stage,
    scheduled_date: scheduledDate,
    completed_date: completedDate,
    status: completedDate ? "completed" : "pending",
    actual_cost_kobo: actualCostKobo,
    direct_cost_minor: actualCostKobo,
    notes: notes || null,
  });

  revalidatePath(`/account/crops/${cycleId}`);
}

export async function logCropObservation(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const cycleId = String(form.get("crop_cycle_id") || "").trim();
  const rawCat = String(form.get("category") || form.get("observation_type") || "general").trim();
  const severity = String(form.get("severity") || "low").trim();
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || title).trim();
  const recommendedAction = String(form.get("recommended_action") || "").trim();

  if (!cycleId || !title) return;

  await supabase.from("crop_observations").insert({
    crop_cycle_id: cycleId,
    observation_type: rawCat,
    severity,
    title,
    description: description || null,
    recommended_action: recommendedAction || null,
    observed_at: new Date().toISOString(),
  });

  revalidatePath(`/account/crops/${cycleId}`);
  revalidatePath("/account/crops/scouting");
  revalidatePath("/account/crops");
}
