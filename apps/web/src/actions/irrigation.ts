"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function recordIrrigationEvent(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const plotId = String(form.get("plot_id") || "").trim() || null;
  const zone = String(form.get("irrigation_zone") || "Zone A - Drip Manifold").trim();
  const duration = parseInt(String(form.get("duration_minutes") || "45"), 10) || 45;
  const volume = parseFloat(String(form.get("water_volume_litres") || "1200")) || 1200;
  const moistureBefore = parseFloat(String(form.get("soil_moisture_before_percent") || "22.5")) || 22.5;
  const moistureAfter = parseFloat(String(form.get("soil_moisture_after_percent") || "48.0")) || 48.0;

  if (!farmId) return;

  const { error } = await (supabase.from("farm_irrigation_events") as any).insert({
    farm_id: farmId,
    plot_id: plotId,
    irrigation_zone: zone,
    duration_minutes: duration,
    water_volume_litres: volume,
    soil_moisture_before_percent: moistureBefore,
    soil_moisture_after_percent: moistureAfter,
    trigger_reason: "soil_moisture_deficit_alert",
    status: "completed",
  });

  if (error) {
    console.error("Failed to record irrigation event:", error.message);
    return;
  }

  revalidatePath("/account/irrigation");
}

export async function addWaterInfrastructure(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const name = String(form.get("asset_name") || "").trim();
  const type = String(form.get("asset_type") || "borehole_pump").trim();
  const capacity = parseFloat(String(form.get("storage_capacity_litres") || "10000")) || 10000;
  const flowRate = parseFloat(String(form.get("flow_rate_litres_per_hour") || "1500")) || 1500;

  if (!farmId || !name) return;

  const { error } = await (supabase.from("farm_water_infrastructure") as any).insert({
    farm_id: farmId,
    asset_name: name,
    asset_type: type,
    storage_capacity_litres: capacity,
    flow_rate_litres_per_hour: flowRate,
    current_water_level_percentage: 88.0,
    status: "operational",
  });

  if (error) {
    console.error("Failed to add water infrastructure:", error.message);
    return;
  }

  revalidatePath("/account/irrigation");
}
