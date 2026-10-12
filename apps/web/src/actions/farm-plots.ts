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

  const fullPayload: Record<string, any> = {
    farm_id: farmId,
    name,
    area_ha: Math.round(areaHa * 10000) / 10000,
    size_hectares: Math.round(areaHa * 10000) / 10000,
    plot_code: code || null,
    code: code || null,
    soil_texture: soilType || null,
    soil_type: soilType || null,
    slope: slope || null,
    irrigation_type: irrigationStatus || null,
    irrigation_status: irrigationStatus || null,
    accessibility: accessibility || null,
    notes: userNotes || null,
  };

  let { error } = await supabase.from("plots").insert(fullPayload as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const metaParts = [
      code ? `plot_code:${code}` : "",
      soilType ? `soil_texture:${soilType}` : "",
      slope ? `slope:${slope}` : "",
      irrigationStatus ? `irrigation_type:${irrigationStatus}` : "",
      accessibility ? `accessibility:${accessibility}` : "",
    ].filter(Boolean);
    const metaNote = metaParts.length > 0 ? `[front_end_meta: ${metaParts.join(", ")}]` : "";
    const combinedNotes = [userNotes, metaNote].filter(Boolean).join(" | ");

    const fallbackPayload = {
      farm_id: farmId,
      name,
      area_ha: Math.round(areaHa * 10000) / 10000,
      notes: combinedNotes || null,
    };
    const retry = await supabase.from("plots").insert(fallbackPayload as any);
    error = retry.error;
  }

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
  const code = String(form.get("code") || form.get("plot_code") || "").trim();
  const soilType = String(form.get("soil_type") || form.get("soil_texture") || "").trim();
  const slope = String(form.get("slope") || "").trim();
  const irrigationStatus = String(form.get("irrigation_status") || form.get("irrigation_type") || "").trim();
  const accessibility = String(form.get("accessibility") || "").trim();
  const notes = String(form.get("notes") || "").trim();

  if (!plotId || !name || Number.isNaN(areaHa) || areaHa <= 0) return;

  const updatePayload: Record<string, any> = {
    name,
    area_ha: Math.round(areaHa * 10000) / 10000,
    size_hectares: Math.round(areaHa * 10000) / 10000,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  };
  if (code) {
    updatePayload.plot_code = code;
    updatePayload.code = code;
  }
  if (soilType) {
    updatePayload.soil_texture = soilType;
    updatePayload.soil_type = soilType;
  }
  if (slope) {
    updatePayload.slope = slope;
  }
  if (irrigationStatus) {
    updatePayload.irrigation_type = irrigationStatus;
    updatePayload.irrigation_status = irrigationStatus;
  }
  if (accessibility) {
    updatePayload.accessibility = accessibility;
  }

  let { error } = await supabase.from("plots").update(updatePayload as any).eq("id", plotId);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const metaParts = [
      code ? `plot_code:${code}` : "",
      soilType ? `soil_texture:${soilType}` : "",
      slope ? `slope:${slope}` : "",
      irrigationStatus ? `irrigation_type:${irrigationStatus}` : "",
      accessibility ? `accessibility:${accessibility}` : "",
    ].filter(Boolean);
    const metaNote = metaParts.length > 0 ? `[front_end_meta: ${metaParts.join(", ")}]` : "";
    const combinedNotes = [notes, metaNote].filter(Boolean).join(" | ");

    const fallbackPayload = {
      name,
      area_ha: Math.round(areaHa * 10000) / 10000,
      notes: combinedNotes || null,
      updated_at: new Date().toISOString(),
    };
    const retry = await supabase.from("plots").update(fallbackPayload as any).eq("id", plotId);
    error = retry.error;
  }

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
