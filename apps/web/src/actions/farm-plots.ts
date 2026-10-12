"use server";

import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
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
  const code = String(form.get("code") || form.get("plot_code") || "").trim();
  const rawSize = String(form.get("area_ha") || form.get("size_hectares") || form.get("size") || "0").replace(",", ".");
  const areaHa = parseFloat(rawSize);
  const soilType = String(form.get("soil_type") || form.get("soil_texture") || "").trim();
  const slope = String(form.get("slope") || "").trim();
  const irrigationStatus = String(form.get("irrigation_status") || form.get("irrigation_type") || "").trim();
  const accessibility = String(form.get("accessibility") || "").trim();
  const userNotes = String(form.get("notes") || "").trim();

  if (!farmId || !name || Number.isNaN(areaHa) || areaHa <= 0) {
    logger.warn("plot_create_invalid_input", { farmId, name, rawSize });
    return;
  }

  // Preserve all plot agronomic traits into notes
  const meta: string[] = [];
  if (code) meta.push(`[${code}]`);
  if (soilType) meta.push(`Soil: ${soilType}`);
  if (slope) meta.push(`Slope: ${slope}`);
  if (irrigationStatus) meta.push(`Irrigation: ${irrigationStatus}`);
  if (accessibility) meta.push(`Access: ${accessibility}`);
  if (userNotes) meta.push(userNotes);
  const notes = meta.join(" • ") || null;

  const { error } = await supabase.from("plots").insert({
    farm_id: farmId,
    name,
    area_ha: Math.round(areaHa * 10000) / 10000,
    notes,
  });

  if (error) {
    logger.error("plot_insert_failed", { message: error.message, code: error.code, farmId });
    return;
  }

  revalidatePath(`/[lang]/account/farms/${farmId}`, "page");
  revalidatePath(`/[lang]/account/farms`, "page");
  revalidatePath(`/account/farms/${farmId}`);
  revalidatePath(`/account/farms`);
}

export async function updateFarmPlot(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const plotId = String(form.get("plot_id") || "").trim();
  const farmId = String(form.get("farm_id") || "").trim();
  const name = String(form.get("name") || "").trim();
  const rawSize = String(form.get("area_ha") || form.get("size_hectares") || "0").replace(",", ".");
  const areaHa = parseFloat(rawSize);
  const notes = String(form.get("notes") || "").trim();

  if (!plotId || !name || Number.isNaN(areaHa) || areaHa <= 0) return;

  const { error } = await supabase
    .from("plots")
    .update({
      name,
      area_ha: Math.round(areaHa * 10000) / 10000,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", plotId);

  if (error) {
    logger.error("plot_update_failed", { message: error.message, code: error.code, plotId });
    return;
  }

  revalidatePath(`/[lang]/account/farms/${farmId}`, "page");
  revalidatePath(`/[lang]/account/farms`, "page");
  revalidatePath(`/account/farms/${farmId}`);
  revalidatePath(`/account/farms`);
}

export async function deleteFarmPlot(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const plotId = String(form.get("plot_id") || "").trim();
  const farmId = String(form.get("farm_id") || "").trim();

  if (!plotId) return;

  const { error } = await supabase.from("plots").delete().eq("id", plotId);
  if (error) {
    logger.error("plot_delete_failed", { message: error.message, code: error.code, plotId });
    return;
  }

  revalidatePath(`/[lang]/account/farms/${farmId}`, "page");
  revalidatePath(`/[lang]/account/farms`, "page");
  revalidatePath(`/account/farms/${farmId}`);
  revalidatePath(`/account/farms`);
}
