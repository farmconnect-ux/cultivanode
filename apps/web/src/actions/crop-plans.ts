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

export async function createCropCycle(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const plotId = String(form.get("plot_id") || "").trim();
  const cropName = String(form.get("crop_name") || "").trim();
  const variety = String(form.get("variety") || "").trim();
  const plantedAreaHectares = parseFloat(String(form.get("planted_area_hectares") || "0"));
  const startDate = String(form.get("start_date") || "").trim();
  const targetHarvestDate = String(form.get("target_harvest_date") || "").trim() || null;
  const targetYieldKg = parseFloat(String(form.get("target_yield_kg") || "0")) || null;
  const budgetCapMinor = parseInt(String(form.get("budget_cap_minor") || "0"), 10);
  const standardId = String(form.get("standard_id") || "").trim();

  if (!farmId || !plotId || !cropName || plantedAreaHectares <= 0 || !startDate) return;

  const { data: cycle } = await supabase
    .from("crop_cycles")
    .insert({
      farm_id: farmId,
      plot_id: plotId,
      crop_name: cropName,
      variety: variety || null,
      planted_area_hectares: plantedAreaHectares,
      start_date: startDate,
      target_harvest_date: targetHarvestDate,
      target_yield_kg: targetYieldKg,
      budget_cap_minor: budgetCapMinor,
      status: "planning",
    })
    .select()
    .single();

  if (!cycle) return;

  if (standardId) {
    const { data: stdData } = await supabase
      .from("farm_agronomic_standards")
      .select("*")
      .eq("id", standardId)
      .single();

    if (stdData) {
      const standardObj: FarmAgronomicStandard = {
        id: stdData.id,
        cropName: stdData.crop_name,
        variety: stdData.variety || undefined,
        agroEcologicalZone: stdData.agro_ecological_zone || undefined,
        version: stdData.version,
        expectedYieldKgPerHa: stdData.expected_yield_kg_per_ha,
        expectedDurationDays: stdData.expected_duration_days,
        seedRateKgPerHa: stdData.seed_rate_kg_per_ha,
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
        operation_type: op.activity,
        scheduled_date: op.scheduledDate,
        status: "scheduled",
        planned_inputs: op.recommendedInputs,
        notes: `Advisory Stage: ${op.stage}`,
      }));

      if (opsToInsert.length > 0) {
        await supabase.from("crop_cycle_operations").insert(opsToInsert);
      }
    }
  }

  revalidatePath("/account/crops");
}

export async function logCropOperation(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const cycleId = String(form.get("crop_cycle_id") || "").trim();
  const operationType = String(form.get("operation_type") || "").trim();
  const scheduledDate = String(form.get("scheduled_date") || "").trim();
  const completedDate = String(form.get("completed_date") || "").trim() || null;
  const directCostMinor = parseInt(String(form.get("direct_cost_minor") || "0"), 10);
  const notes = String(form.get("notes") || "").trim();

  if (!cycleId || !operationType) return;

  await supabase.from("crop_cycle_operations").insert({
    crop_cycle_id: cycleId,
    operation_type: operationType,
    scheduled_date: scheduledDate || new Date().toISOString().split("T")[0],
    completed_date: completedDate,
    status: completedDate ? "completed" : "scheduled",
    direct_cost_minor: directCostMinor,
    notes: notes || null,
  });

  revalidatePath(`/account/crops/${cycleId}`);
}

export async function logCropObservation(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const cycleId = String(form.get("crop_cycle_id") || "").trim();
  const observationType = String(form.get("observation_type") || "general").trim();
  const severity = String(form.get("severity") || "low").trim();
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const recommendedAction = String(form.get("recommended_action") || "").trim();

  if (!cycleId || !title) return;

  await supabase.from("crop_observations").insert({
    crop_cycle_id: cycleId,
    observation_type: observationType,
    severity,
    title,
    description: description || null,
    recommended_action: recommendedAction || null,
  });

  revalidatePath(`/account/crops/${cycleId}`);
}
