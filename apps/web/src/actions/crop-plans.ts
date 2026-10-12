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

const BUILTIN_STANDARDS: Record<string, FarmAgronomicStandard> = {
  maize_savanna_v2: {
    id: "maize_savanna_v2",
    cropName: "Maize",
    variety: "DMR-LSR-Y",
    agroEcologicalZone: "Derived Savanna",
    version: 2,
    expectedYieldKgPerHa: 4500,
    expectedDurationDays: 110,
    seedRateKgPerHa: 20,
    recommendedOperations: [
      { stage: "Land Preparation", dayOffset: 0, activity: "Ploughing, Harrowing & Basal NPK 15:15:15 Application", targetInputs: [{ itemName: "NPK 15:15:15", standardQuantityPerHa: 200, unit: "kg" }] },
      { stage: "Planting", dayOffset: 3, activity: "Direct Seeding at 75cm x 25cm Spacing", targetInputs: [{ itemName: "Certified Seed Maize DMR-LSR-Y", standardQuantityPerHa: 20, unit: "kg" }] },
      { stage: "Establishment", dayOffset: 14, activity: "Emergence Assessment & Pre-emergence Weed Scouting" },
      { stage: "Vegetative V4-V6", dayOffset: 28, activity: "First Weeding & Topdress Urea Application", targetInputs: [{ itemName: "Urea 46% N", standardQuantityPerHa: 100, unit: "kg" }] },
      { stage: "Vegetative V8", dayOffset: 45, activity: "Fall Armyworm (Spodoptera frugiperda) Scouting & Biopesticide" },
      { stage: "Reproductive R1", dayOffset: 65, activity: "Tasseling / Silking Moisture Inspection" },
      { stage: "Maturity", dayOffset: 110, activity: "Grain Physiological Maturity & Cobby Harvest" },
    ],
  },
  cassava_savanna_v2: {
    id: "cassava_savanna_v2",
    cropName: "Cassava",
    variety: "TME 419",
    agroEcologicalZone: "Derived Savanna",
    version: 2,
    expectedYieldKgPerHa: 28000,
    expectedDurationDays: 330,
    seedRateKgPerHa: 50,
    recommendedOperations: [
      { stage: "Land Preparation", dayOffset: 0, activity: "Mound/Ridge Formation & Stem Cutting Preparation", targetInputs: [{ itemName: "TME 419 Stem Bundles", standardQuantityPerHa: 50, unit: "bundles" }] },
      { stage: "Planting", dayOffset: 2, activity: "Stem Planting at 1m x 1m Spacing" },
      { stage: "Establishment", dayOffset: 30, activity: "Sprouting Check & Early Weed Suppression" },
      { stage: "Vegetative", dayOffset: 60, activity: "NPK 15:15:15 Ring Application", targetInputs: [{ itemName: "NPK 15:15:15", standardQuantityPerHa: 200, unit: "kg" }] },
      { stage: "Canopy Close", dayOffset: 120, activity: "Cassava Mosaic Disease (CMD) Scouting" },
      { stage: "Root Bulking", dayOffset: 240, activity: "Root Sizing Diagnostic & Starch Accumulation Check" },
      { stage: "Harvest", dayOffset: 330, activity: "Bulk Tuber Lifting & Post-Harvest Processing" },
    ],
  },
  tomato_irrigated_v1: {
    id: "tomato_irrigated_v1",
    cropName: "Tomato",
    variety: "Roma VF",
    agroEcologicalZone: "Irrigated Lowland",
    version: 1,
    expectedYieldKgPerHa: 22000,
    expectedDurationDays: 95,
    seedRateKgPerHa: 0.5,
    recommendedOperations: [
      { stage: "Nursery", dayOffset: 0, activity: "Nursery Bed Sowing & Shade Net Setup", targetInputs: [{ itemName: "Roma VF Certified Seed", standardQuantityPerHa: 0.5, unit: "kg" }] },
      { stage: "Transplanting", dayOffset: 21, activity: "Transplanting Seedlings & Drip Emitter Alignment" },
      { stage: "Vegetative", dayOffset: 35, activity: "Staking, Trellising & Early Blight Preventive Spray" },
      { stage: "Flowering", dayOffset: 50, activity: "Foliar Micronutrient & Calcium Nitrate Feeding", targetInputs: [{ itemName: "Calcium Nitrate", standardQuantityPerHa: 50, unit: "kg" }] },
      { stage: "Fruiting", dayOffset: 70, activity: "Tuta absoluta Trap Inspection & Fruit Rot Prevention" },
      { stage: "Harvesting", dayOffset: 95, activity: "Staggered Red Ripe Tomato Harvest" },
    ],
  },
  cowpea_savanna_v1: {
    id: "cowpea_savanna_v1",
    cropName: "Cowpea",
    variety: "SAMPEA-14",
    agroEcologicalZone: "Guinea Savanna",
    version: 1,
    expectedYieldKgPerHa: 1800,
    expectedDurationDays: 75,
    seedRateKgPerHa: 25,
    recommendedOperations: [
      { stage: "Land Preparation", dayOffset: 0, activity: "Harrowing & Rhizobium Inoculation", targetInputs: [{ itemName: "SAMPEA-14 Seed", standardQuantityPerHa: 25, unit: "kg" }] },
      { stage: "Planting", dayOffset: 1, activity: "Direct Seeding at 75cm x 20cm" },
      { stage: "Establishment", dayOffset: 14, activity: "First Weeding & Aphid Scouting" },
      { stage: "Flowering", dayOffset: 35, activity: "Maruca Pod Borer Protection Spray" },
      { stage: "Podding", dayOffset: 55, activity: "Pod Borer & Coreid Bug Management" },
      { stage: "Harvest", dayOffset: 75, activity: "Dry Pod Harvesting & Threshing" },
    ],
  },
  rice_lowland_v1: {
    id: "rice_lowland_v1",
    cropName: "Rice",
    variety: "FARO 44",
    agroEcologicalZone: "Lowland Fadama",
    version: 1,
    expectedYieldKgPerHa: 5000,
    expectedDurationDays: 120,
    seedRateKgPerHa: 60,
    recommendedOperations: [
      { stage: "Land Preparation", dayOffset: 0, activity: "Puddling, Leveling & Bund Maintenance" },
      { stage: "Planting", dayOffset: 14, activity: "Transplanting 21-day Seedlings", targetInputs: [{ itemName: "FARO 44 Seedlings", standardQuantityPerHa: 60, unit: "kg" }] },
      { stage: "Tillering", dayOffset: 35, activity: "Basal NPK 15:15:15 Application & Water Level Maintenance", targetInputs: [{ itemName: "NPK 15:15:15", standardQuantityPerHa: 200, unit: "kg" }] },
      { stage: "Panicle Initiation", dayOffset: 65, activity: "Topdress Urea Application", targetInputs: [{ itemName: "Urea 46% N", standardQuantityPerHa: 100, unit: "kg" }] },
      { stage: "Ripening", dayOffset: 100, activity: "Pre-Harvest Field Drainage" },
      { stage: "Harvest", dayOffset: 120, activity: "Paddy Harvesting & Threshing" },
    ],
  },
  soybean_savanna_v1: {
    id: "soybean_savanna_v1",
    cropName: "Soybean",
    variety: "TGX 1448-2E",
    agroEcologicalZone: "Southern Guinea Savanna",
    version: 1,
    expectedYieldKgPerHa: 2200,
    expectedDurationDays: 105,
    seedRateKgPerHa: 50,
    recommendedOperations: [
      { stage: "Land Preparation", dayOffset: 0, activity: "Seedbed Preparation & Inoculant Treatment", targetInputs: [{ itemName: "TGX 1448-2E Seed", standardQuantityPerHa: 50, unit: "kg" }] },
      { stage: "Planting", dayOffset: 2, activity: "Mechanical / Manual Seeding at 50cm x 10cm" },
      { stage: "Establishment", dayOffset: 20, activity: "Stand Count & Post-emergence Weeding" },
      { stage: "Flowering", dayOffset: 45, activity: "Foliar Phosphorus / Micronutrient Supplement" },
      { stage: "Pod Setting", dayOffset: 75, activity: "Pod Sucking Bug Diagnostic" },
      { stage: "Harvest", dayOffset: 105, activity: "Harvesting at 13-14% Seed Moisture" },
    ],
  },
};

const IS_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createCropCycle(form: FormData): Promise<{ id?: string; error?: string } | void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const rawPlotId = String(form.get("plot_id") || "").trim();
  const plotId = IS_UUID_REGEX.test(rawPlotId) ? rawPlotId : null;
  const cropName = String(form.get("crop_name") || form.get("crop_id") || "").trim();
  const variety = String(form.get("variety") || form.get("variety_id") || "").trim();
  const plantedAreaHectares = parseFloat(String(form.get("planted_area_hectares") || form.get("target_area_ha") || "1")) || 1;
  const startDate = String(form.get("start_date") || form.get("planting_date") || new Date().toISOString().split("T")[0]).trim();
  const targetHarvestDate = String(form.get("target_harvest_date") || form.get("expected_harvest_date") || "").trim() || null;
  const targetYieldKg = parseFloat(String(form.get("target_yield_kg") || "0")) || null;
  const budgetCapMinor = parseInt(String(form.get("budget_cap_minor") || form.get("estimated_budget_kobo") || "0"), 10) || 0;
  const season = String(form.get("season") || "Early Rains 2026").trim();
  const standardId = String(form.get("standard_id") || "").trim();

  if (!farmId || !cropName) return { error: "Farm and Crop Name are required" };

  // Determine standard reference and harvest calculation
  const builtinStandard = BUILTIN_STANDARDS[standardId];
  const calculatedHarvestDate = targetHarvestDate || (() => {
    const d = new Date(startDate);
    const duration = builtinStandard?.expectedDurationDays || 110;
    d.setDate(d.getDate() + duration);
    return d.toISOString().split("T")[0];
  })();

  let resolvedStandardUuid: string | null = null;
  let standardObj: FarmAgronomicStandard | null = builtinStandard || null;

  if (standardId) {
    if (IS_UUID_REGEX.test(standardId)) {
      const { data: stdData } = await supabase
        .from("farm_agronomic_standards")
        .select("*")
        .eq("id", standardId)
        .maybeSingle();
      if (stdData) {
        resolvedStandardUuid = stdData.id;
        if (!standardObj) {
          standardObj = {
            id: stdData.id,
            cropName: stdData.crop_name || cropName,
            variety: stdData.variety || variety || undefined,
            agroEcologicalZone: stdData.agro_ecological_zone || undefined,
            version: typeof stdData.version === "number" ? stdData.version : 1,
            expectedYieldKgPerHa: stdData.expected_yield_kg_per_ha || 3500,
            expectedDurationDays: stdData.expected_duration_days || 120,
            seedRateKgPerHa: stdData.seed_rate_kg_per_ha || 20,
            recommendedOperations: (stdData.recommended_operations as any) || [],
          };
        }
      }
    } else {
      const { data: stdData } = await supabase
        .from("farm_agronomic_standards")
        .select("*")
        .ilike("crop_name", standardId.replace(/_/g, " "))
        .maybeSingle();
      if (stdData) {
        resolvedStandardUuid = stdData.id;
      }
    }
  }

  const finalYieldKg = targetYieldKg && targetYieldKg > 0
    ? targetYieldKg
    : (standardObj ? Math.round(standardObj.expectedYieldKgPerHa * plantedAreaHectares) : Math.round(3500 * plantedAreaHectares));

  const fullPayload: Record<string, any> = {
    farm_id: farmId,
    plot_id: plotId,
    standard_id: resolvedStandardUuid,
    crop_id: cropName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    crop_name: cropName,
    variety: variety || null,
    variety_id: variety || null,
    season,
    target_area_ha: plantedAreaHectares,
    planted_area_hectares: plantedAreaHectares,
    planting_date: startDate,
    start_date: startDate,
    expected_harvest_date: calculatedHarvestDate,
    target_harvest_date: calculatedHarvestDate,
    target_yield_kg: finalYieldKg,
    estimated_budget_kobo: budgetCapMinor,
    budget_cap_minor: budgetCapMinor,
    status: "planning",
    current_stage: "Planning",
    notes: standardObj ? `Agronomic standard: ${standardObj.cropName} (${standardObj.variety || "Standard"})` : null,
  };

  let { data: cycle, error: cycleErr } = await supabase
    .from("crop_cycles")
    .insert(fullPayload as any)
    .select()
    .single();

  if (cycleErr && (cycleErr.code === "PGRST204" || cycleErr.code === "42703")) {
    // Schema cache fallback to strict original columns
    const fallbackPayload = {
      farm_id: farmId,
      plot_id: plotId,
      standard_id: resolvedStandardUuid,
      crop_id: cropName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      crop_name: cropName,
      variety_id: variety || null,
      season,
      target_area_ha: plantedAreaHectares,
      planting_date: startDate,
      expected_harvest_date: calculatedHarvestDate,
      target_yield_kg: finalYieldKg,
      estimated_budget_kobo: budgetCapMinor,
      status: "planning",
      current_stage: "Planning",
      notes: standardObj ? `Standard: ${standardObj.cropName} (${standardObj.variety || "Standard"})` : null,
    };
    const retry = await supabase.from("crop_cycles").insert(fallbackPayload as any).select().single();
    cycle = retry.data;
    cycleErr = retry.error;
  }

  if (cycleErr) {
    return { error: cycleErr.message };
  }

  if (cycle && standardObj) {
    try {
      const plan = StandardPlanActualEngine.generatePlanFromStandard(standardObj, {
        farmId,
        plotId: plotId || "",
        cropName,
        variety: variety || undefined,
        plantedAreaHectares,
        startDate,
        targetHarvestDate: calculatedHarvestDate,
        targetYieldKg: finalYieldKg,
        budgetCapMinor,
      });

      const opsToInsert = plan.recommendedOperations.map((op) => ({
        crop_cycle_id: cycle.id,
        cycle_id: cycle.id,
        name: op.activity,
        operation_type: op.activity.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 50),
        stage: op.stage || "Establishment",
        scheduled_date: op.scheduledDate,
        status: "pending",
        planned_inputs: (op.recommendedInputs as any) || [],
        notes: `Advisory Stage: ${op.stage}`,
      }));

      if (opsToInsert.length > 0) {
        await supabase.from("crop_cycle_operations").insert(opsToInsert as any);
      }
    } catch {
      // Non-fatal if advisory ops generation fails
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
