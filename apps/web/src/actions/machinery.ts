"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createMachineryAsset(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const name = String(form.get("name") || "").trim();
  const category = String(form.get("category") || "tractor").trim().toLowerCase();
  const validCategories = ["tractor", "plough", "harrow", "ridger", "planter", "harvester", "boom_sprayer", "water_pump", "generator", "trailer", "truck", "processor", "other"];
  const dbCat = validCategories.includes(category) ? category : "tractor";
  const make = String(form.get("make") || form.get("manufacturer") || "").trim();
  const model = String(form.get("model") || "").trim();
  const serialNumber = String(form.get("serial_number") || form.get("registration_number") || "").trim();
  const fuelType = String(form.get("fuel_type") || "diesel").trim().toLowerCase();
  const validFuels = ["diesel", "petrol", "electric", "manual", "hybrid"];
  const dbFuel = validFuels.includes(fuelType) ? fuelType : "diesel";
  const fuelConsumptionRate = parseFloat(String(form.get("fuel_consumption_rate") || "0")) || null;
  const initialHours = parseFloat(String(form.get("total_operating_hours") || form.get("engine_hours") || "0")) || 0;
  const nextServiceHours = parseFloat(String(form.get("next_service_hours") || "0")) || null;
  const autoCode = `MACH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  if (!farmId || !name) return;

  const fullAsset = {
    farm_id: farmId,
    asset_code: autoCode,
    name,
    category: dbCat,
    make: make || null,
    manufacturer: make || null,
    model: model || null,
    serial_number: serialNumber || null,
    registration_number: serialNumber || null,
    fuel_type: dbFuel,
    current_status: "available",
    status: "operational",
    engine_hours: initialHours,
    total_operating_hours: initialHours,
    fuel_consumption_rate: fuelConsumptionRate,
    next_service_hours: nextServiceHours,
  };

  let { error } = await supabase.from("farm_machinery_assets").insert(fullAsset as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackAsset = {
      farm_id: farmId,
      asset_code: autoCode,
      name,
      category: dbCat,
      manufacturer: make || null,
      model: model || null,
      registration_number: serialNumber || null,
      fuel_type: dbFuel,
      current_status: "available",
      engine_hours: initialHours,
    };
    await supabase.from("farm_machinery_assets").insert(fallbackAsset as any);
  }

  revalidatePath("/account/machinery");
}

export async function logMachineryUsage(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const machineryId = String(form.get("machinery_id") || "").trim();
  const plotId = String(form.get("plot_id") || "").trim() || null;
  const cycleId = String(form.get("crop_cycle_id") || "").trim() || null;
  const activity = String(form.get("activity") || form.get("operation_name") || "").trim();
  const hoursRun = parseFloat(String(form.get("hours_run") || form.get("hours_operated") || "0")) || 0;
  const fuelLitresUsed = parseFloat(String(form.get("fuel_litres_used") || form.get("fuel_litres_consumed") || "0")) || 0;
  const fuelCostMinor = parseInt(String(form.get("fuel_cost_minor") || form.get("operational_cost_kobo") || "0"), 10) || 0;
  const operatorLaborCostMinor = parseInt(String(form.get("operator_labor_cost_minor") || "0"), 10) || 0;
  const areaCoveredHa = parseFloat(String(form.get("area_covered_ha") || "0")) || null;

  if (!machineryId || hoursRun <= 0 || !activity) return;

  const { data: currentMach } = await (supabase.from("farm_machinery_assets") as any)
    .select("*")
    .eq("id", machineryId)
    .single();

  const farmId = (currentMach as any)?.farm_id;
  if (!farmId) return;

  const nowIso = new Date().toISOString();
  const fullUsage: Record<string, any> = {
    farm_id: farmId,
    machinery_id: machineryId,
    plot_id: plotId,
    crop_cycle_id: cycleId,
    activity,
    operation_name: activity,
    start_time: nowIso,
    end_time: nowIso,
    hours_run: hoursRun,
    hours_operated: hoursRun,
    fuel_litres_used: fuelLitresUsed,
    fuel_litres_consumed: fuelLitresUsed,
    fuel_cost_minor: fuelCostMinor,
    operational_cost_kobo: fuelCostMinor,
    operator_labor_cost_minor: operatorLaborCostMinor,
    area_covered_ha: areaCoveredHa,
    log_date: new Date().toISOString().split("T")[0],
  };

  let { error: usageErr } = await supabase.from("farm_machinery_usage_logs").insert(fullUsage as any);

  if (usageErr && (usageErr.code === "PGRST204" || usageErr.code === "42703" || usageErr.message.includes("column") || usageErr.message.includes("schema cache"))) {
    const fallbackUsage = {
      farm_id: farmId,
      machinery_id: machineryId,
      plot_id: plotId,
      operation_name: activity,
      start_time: nowIso,
      end_time: nowIso,
      hours_operated: hoursRun,
      fuel_litres_consumed: fuelLitresUsed,
      operational_cost_kobo: fuelCostMinor,
      area_covered_ha: areaCoveredHa,
      notes: [operatorLaborCostMinor ? `Operator cost: ${operatorLaborCostMinor}` : "", cycleId ? `Cycle: ${cycleId}` : ""].filter(Boolean).join(" | ") || null,
    };
    await supabase.from("farm_machinery_usage_logs").insert(fallbackUsage as any);
  }

  // Update operating hours on the asset
  if (currentMach) {
    const newHours = (Number((currentMach as any).total_operating_hours ?? (currentMach as any).engine_hours) || 0) + hoursRun;
    await (supabase.from("farm_machinery_assets") as any)
      .update({
        engine_hours: newHours,
        total_operating_hours: newHours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", machineryId);
  }

  revalidatePath("/account/machinery");
  revalidatePath("/account/machinery/dispatch");
}

export { createMachineryAsset as registerMachineryAsset };
