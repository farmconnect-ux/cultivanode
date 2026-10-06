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

  const soilTextureRaw = text(form, "soil_texture", 30);
  const irrigationTypeRaw = text(form, "irrigation_type", 30);
  const drainageRaw = text(form, "drainage", 30);

  const { error } = await s.supabase.from("plots").insert({
    farm_id: farmId,
    name,
    area_ha: areaHa,
    notes: notes || null,
    soil_texture: soilTextureRaw || null,
    irrigation_type: irrigationTypeRaw || "rainfed",
    drainage: drainageRaw || null,
  });

  if (error) {
    logger.warn("plot_insert_failed", { code: error.code, message: error.message });
    if (error.code === "23505") return bad("errorDuplicatePlotName");
    return bad(error.message || "errorGeneric");
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

/* ------------------------------------------------------------------ Livestock operations */

export async function addLivestockAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const animalType = text(form, "animal_type", 30);
  const breed = text(form, "breed", 80);
  const identifier = text(form, "identifier", 80);
  const headCountRaw = Number(text(form, "head_count", 10));
  const housingLocation = text(form, "housing_location", 120);
  const healthStatus = text(form, "health_status", 30) || "healthy";
  const purpose = text(form, "purpose", 30) || "meat";
  const notes = text(form, "notes", 1000);

  if (!farmId) return bad("errorFarmRequired");
  if (!breed) return bad("errorBreedRequired");
  if (!identifier) return bad("errorIdentifierRequired");

  const headCount = Number.isFinite(headCountRaw) && headCountRaw >= 0 ? Math.round(headCountRaw) : 1;

  const { error } = await (s.supabase as any)
    .from("farm_livestock")
    .insert({
      farm_id: farmId,
      animal_type: animalType || "cattle",
      breed,
      identifier,
      head_count: headCount,
      housing_location: housingLocation || null,
      health_status: healthStatus,
      purpose,
      notes: notes || null,
    });

  if (error) {
    logger.warn("livestock_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToSaveLivestock");
  }

  refresh();
  return ok({ message: "livestock_registered" });
}

/* ------------------------------------------------------------------ Farm Workers operations */

export async function addFarmWorkerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const fullName = text(form, "full_name", 120);
  const phone = text(form, "phone", 30);
  const role = text(form, "role", 40) || "field_worker";
  const employmentType = text(form, "employment_type", 30) || "permanent";
  const dailyWageNgn = Number(text(form, "daily_wage_ngn", 12));
  const emergencyContact = text(form, "emergency_contact", 120);

  if (!farmId) return bad("errorFarmRequired");
  if (!fullName || fullName.length < 2) return bad("errorNameRequired");

  const dailyWageKobo = Number.isFinite(dailyWageNgn) && dailyWageNgn >= 0 ? Math.round(dailyWageNgn * 100) : 0;

  const { error } = await (s.supabase as any)
    .from("farm_workers")
    .insert({
      farm_id: farmId,
      full_name: fullName,
      phone: phone || null,
      role,
      employment_type: employmentType,
      daily_wage_kobo: dailyWageKobo,
      status: "active",
      emergency_contact: emergencyContact || null,
    });

  if (error) {
    logger.warn("farm_worker_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToSaveWorker");
  }

  refresh();
  return ok({ message: "worker_registered" });
}

/* ------------------------------------------------------------------ Inventory operations */

export async function addInventoryItemAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const itemName = text(form, "item_name", 120);
  const category = text(form, "category", 40) || "seed";
  const quantityRaw = Number(text(form, "quantity", 12));
  const unit = text(form, "unit", 20) || "kg";
  const reorderThresholdRaw = Number(text(form, "reorder_threshold", 12));
  const storageLocation = text(form, "storage_location", 120);
  const unitCostNgn = Number(text(form, "unit_cost_ngn", 12));
  const expiryDate = text(form, "expiry_date", 12);

  if (!farmId) return bad("errorFarmRequired");
  if (!itemName || itemName.length < 2) return bad("errorItemNameRequired");

  const quantity = Number.isFinite(quantityRaw) && quantityRaw >= 0 ? quantityRaw : 0;
  const reorderThreshold = Number.isFinite(reorderThresholdRaw) && reorderThresholdRaw >= 0 ? reorderThresholdRaw : 0;
  const unitCostKobo = Number.isFinite(unitCostNgn) && unitCostNgn >= 0 ? Math.round(unitCostNgn * 100) : 0;

  const { error } = await (s.supabase as any)
    .from("farm_inventory")
    .insert({
      farm_id: farmId,
      item_name: itemName,
      category,
      quantity,
      unit,
      reorder_threshold: reorderThreshold,
      storage_location: storageLocation || null,
      unit_cost_kobo: unitCostKobo,
      expiry_date: expiryDate || null,
    });

  if (error) {
    logger.warn("inventory_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToSaveInventory");
  }

  refresh();
  return ok({ message: "inventory_item_added" });
}

/* ------------------------------------------------------------------ Farm Financial Transactions */

export async function recordFarmTransactionAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const cycleId = text(form, "crop_cycle_id", 36);
  const type = text(form, "type", 20) || "expense";
  const category = text(form, "category", 40) || "other";
  const amountNgn = Number(text(form, "amount_ngn", 15));
  const transactionDate = text(form, "transaction_date", 12) || new Date().toISOString().split("T")[0];
  const receiptNumber = text(form, "receipt_number", 60);
  const paymentMethod = text(form, "payment_method", 30) || "cash";
  const description = text(form, "description", 500);

  if (!farmId) return bad("errorFarmRequired");
  if (!description || description.length < 2) return bad("errorDescriptionRequired");
  if (!Number.isFinite(amountNgn) || amountNgn <= 0) return bad("errorAmountInvalid");

  const amountKobo = Math.round(amountNgn * 100);

  const { error } = await (s.supabase as any)
    .from("farm_financial_transactions")
    .insert({
      farm_id: farmId,
      crop_cycle_id: cycleId || null,
      type,
      category,
      amount_kobo: amountKobo,
      transaction_date: transactionDate,
      receipt_number: receiptNumber || null,
      payment_method: paymentMethod,
      description,
      recorded_by: s.uid,
    });

  if (error) {
    logger.warn("finance_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToRecordTransaction");
  }

  refresh();
  return ok({ message: "transaction_recorded" });
}

/* ------------------------------------------------------------------ General Farm Records */

export async function addFarmRecordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const recordType = text(form, "record_type", 40) || "general";
  const title = text(form, "title", 150);
  const details = text(form, "details", 2000);
  const documentUrl = text(form, "document_url", 500);
  const recordedDate = text(form, "recorded_date", 12) || new Date().toISOString().split("T")[0];

  if (!farmId) return bad("errorFarmRequired");
  if (!title || title.length < 2) return bad("errorTitleRequired");

  const { error } = await (s.supabase as any)
    .from("farm_general_records")
    .insert({
      farm_id: farmId,
      record_type: recordType,
      title,
      details: details || null,
      document_url: documentUrl || null,
      recorded_date: recordedDate,
    });

  if (error) {
    logger.warn("general_record_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToSaveRecord");
  }

  refresh();
  return ok({ message: "farm_record_saved" });
}
