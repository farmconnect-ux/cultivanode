"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createFarmPlot(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const name = String(form.get("name") || "").trim();
  const code = String(form.get("code") || "").trim();
  const sizeHectares = parseFloat(String(form.get("size_hectares") || "0"));
  const soilType = String(form.get("soil_type") || "").trim();
  const slope = String(form.get("slope") || "flat").trim();
  const irrigationStatus = String(form.get("irrigation_status") || "rainfed").trim();
  const accessibility = String(form.get("accessibility") || "good").trim();
  const notes = String(form.get("notes") || "").trim();

  if (!farmId || !name || sizeHectares <= 0) return;

  await supabase.from("plots").insert({
    farm_id: farmId,
    name,
    code: code || null,
    size_hectares: sizeHectares,
    soil_type: soilType || null,
    slope,
    irrigation_status: irrigationStatus,
    accessibility,
    notes: notes || null,
  });

  revalidatePath(`/account/farms/${farmId}`);
}

export async function updateFarmPlot(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const plotId = String(form.get("plot_id") || "").trim();
  const farmId = String(form.get("farm_id") || "").trim();
  const name = String(form.get("name") || "").trim();
  const sizeHectares = parseFloat(String(form.get("size_hectares") || "0"));
  const soilType = String(form.get("soil_type") || "").trim();
  const slope = String(form.get("slope") || "flat").trim();
  const irrigationStatus = String(form.get("irrigation_status") || "rainfed").trim();

  if (!plotId || !name || sizeHectares <= 0) return;

  await supabase
    .from("plots")
    .update({
      name,
      size_hectares: sizeHectares,
      soil_type: soilType || null,
      slope,
      irrigation_status: irrigationStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", plotId);

  revalidatePath(`/account/farms/${farmId}`);
}

export async function deleteFarmPlot(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const plotId = String(form.get("plot_id") || "").trim();
  const farmId = String(form.get("farm_id") || "").trim();

  await supabase.from("plots").delete().eq("id", plotId);
  revalidatePath(`/account/farms/${farmId}`);
}
