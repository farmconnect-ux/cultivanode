"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  at?: number;
  data?: Record<string, string>;
};

const ok = (extra: Partial<ActionState> = {}): ActionState => ({ ok: true, at: Date.now(), ...extra });
const bad = (error: string, extra: Partial<ActionState> = {}): ActionState => ({ ok: false, error, at: Date.now(), ...extra });
const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

function lang(form: FormData): Locale {
  const l = text(form, "lang", 5);
  return hasLocale(l) ? l : "en";
}

async function signedIn(form: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${lang(form)}/sign-in`);
  return { supabase, uid: data.user.id };
}

/* ------------------------------------------------------------------ Plot operations */

export async function addPlot(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const name = text(form, "name", 80);
  const notes = text(form, "notes", 500);
  const areaRaw = text(form, "area_ha", 12);

  if (!farmId) return bad("errorFarmRequired");
  if (!name || name.length < 1) return bad("errorPlotNameRequired");

  let areaHa: number | null = null;
  if (areaRaw) {
    const parsed = Number(areaRaw.replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) {
      areaHa = Math.round(parsed * 10000) / 10000;
    }
  }

  const { error } = await s.supabase.from("plots").insert({
    farm_id: farmId,
    name,
    area_ha: areaHa,
    notes: notes || null,
  });

  if (error) {
    logger.warn("plot_insert_failed", { code: error.code, message: error.message });
    if (error.code === "23505") return bad("errorDuplicatePlotName");
    return bad("errorGeneric");
  }

  refresh();
  return ok({ message: "plot_created" });
}

/* ------------------------------------------------------------------ Soil record operations */

export async function addSoilRecord(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const plotId = text(form, "plot_id", 36);
  const soilType = text(form, "soil_type", 60);
  const labName = text(form, "lab_name", 100);
  const notes = text(form, "notes", 500);
  const testedOn = text(form, "tested_on", 10) || new Date().toISOString().slice(0, 10);

  if (!plotId) return bad("errorPlotRequired");

  const phRaw = Number(text(form, "ph", 10));
  const nitrogenRaw = Number(text(form, "nitrogen_pct", 10));
  const phosphorusRaw = Number(text(form, "phosphorus_ppm", 10));
  const potassiumRaw = Number(text(form, "potassium_cmol_kg", 10));
  const organicMatterRaw = Number(text(form, "organic_matter_pct", 10));

  const { error } = await s.supabase.from("soil_records").insert({
    plot_id: plotId,
    soil_type: soilType || null,
    tested_on: testedOn,
    ph: Number.isFinite(phRaw) && phRaw > 0 ? phRaw : null,
    nitrogen_pct: Number.isFinite(nitrogenRaw) && nitrogenRaw >= 0 ? nitrogenRaw : null,
    phosphorus_ppm: Number.isFinite(phosphorusRaw) && phosphorusRaw >= 0 ? phosphorusRaw : null,
    potassium_cmol_kg: Number.isFinite(potassiumRaw) && potassiumRaw >= 0 ? potassiumRaw : null,
    organic_matter_pct: Number.isFinite(organicMatterRaw) && organicMatterRaw >= 0 ? organicMatterRaw : null,
    lab_name: labName || null,
    notes: notes || null,
  });

  if (error) {
    logger.warn("soil_record_insert_failed", { code: error.code, message: error.message });
    return bad("errorGeneric");
  }

  refresh();
  return ok({ message: "soil_record_created" });
}

/* ------------------------------------------------------------------ Farm boundary update */

export async function updateFarmBoundary(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const boundaryWkt = text(form, "boundary_wkt", 5000);

  if (!farmId) return bad("errorFarmRequired");
  if (!boundaryWkt || !boundaryWkt.includes("POLYGON")) return bad("errorInvalidBoundary");

  const { error } = await s.supabase
    .from("farms")
    .update({
      boundary: boundaryWkt,
    })
    .eq("id", farmId);

  if (error) {
    logger.warn("farm_boundary_update_failed", { code: error.code, message: error.message });
    return bad("errorInvalidPolygon");
  }

  refresh();
  return ok({ message: "boundary_updated" });
}
