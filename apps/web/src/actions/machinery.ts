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
  const category = String(form.get("category") || "tractor").trim();
  const make = String(form.get("make") || form.get("manufacturer") || "").trim();
  const model = String(form.get("model") || "").trim();
  const serialNumber = String(form.get("serial_number") || form.get("registration_number") || "").trim();
  const fuelType = String(form.get("fuel_type") || "diesel").trim();
  const fuelConsumptionRate = parseFloat(String(form.get("fuel_consumption_rate") || "0")) || null;
  const initialHours = parseFloat(String(form.get("total_operating_hours") || form.get("engine_hours") || "0")) || 0;
  const nextServiceHours = parseFloat(String(form.get("next_service_hours") || "0")) || null;

  if (!farmId || !name) return;

  await supabase.from("farm_machinery_assets").insert({
    farm_id: farmId,
    name,
    category,
    make: make || null,
    model: model || null,
    serial_number: serialNumber || null,
    fuel_type: fuelType,
    fuel_consumption_rate: fuelConsumptionRate,
    total_operating_hours: initialHours,
    next_service_hours: nextServiceHours,
    status: "operational",
  });

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

  const { error: usageErr } = await supabase.from("farm_machinery_usage_logs").insert({
    machinery_id: machineryId,
    plot_id: plotId,
    crop_cycle_id: cycleId,
    activity,
    hours_run: hoursRun,
    fuel_litres_used: fuelLitresUsed,
    fuel_cost_minor: fuelCostMinor,
    operator_labor_cost_minor: operatorLaborCostMinor,
    area_covered_ha: areaCoveredHa,
    log_date: new Date().toISOString().split("T")[0],
  });

  if (usageErr) return;

  // Update total operating hours on the asset
  const { data: currentMach } = await supabase
    .from("farm_machinery_assets")
    .select("total_operating_hours")
    .eq("id", machineryId)
    .single();

  if (currentMach) {
    await supabase
      .from("farm_machinery_assets")
      .update({
        total_operating_hours: (currentMach.total_operating_hours || 0) + hoursRun,
        updated_at: new Date().toISOString(),
      })
      .eq("id", machineryId);
  }

  revalidatePath("/account/machinery");
  revalidatePath("/account/machinery/dispatch");
}

export { createMachineryAsset as registerMachineryAsset };
