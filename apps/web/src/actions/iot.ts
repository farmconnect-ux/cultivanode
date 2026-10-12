"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function recordTelemetryReading(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const plotId = String(form.get("plot_id") || "").trim() || null;
  const deviceType = String(form.get("device_type") || "soil_sensor").trim();
  const deviceId = String(form.get("device_id") || `SN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`).trim();
  const moisture = parseFloat(String(form.get("soil_moisture") || "28.5"));
  const temp = parseFloat(String(form.get("soil_temperature") || "26.4"));
  const ec = parseFloat(String(form.get("electrical_conductivity") || "1.2"));

  if (!farmId) return;

  const telemetryData = {
    soil_moisture_percentage: moisture,
    soil_temperature_celsius: temp,
    electrical_conductivity_ds_m: ec,
    battery_millivolts: 3620,
    snr_db: 9.4,
    rssi_dbm: -102,
  };

  const { error } = await (supabase.from("farm_iot_telemetry") as any).insert({
    farm_id: farmId,
    plot_id: plotId,
    device_id: deviceId,
    device_type: deviceType,
    telemetry_data: telemetryData,
    recorded_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to record telemetry reading:", error.message);
    return;
  }

  revalidatePath("/account/iot");
  revalidatePath("/account/irrigation");
}
