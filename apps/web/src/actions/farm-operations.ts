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

/* ------------------------------------------------------------------ Machinery Management Actions */

export async function addMachineryAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const assetCode = text(form, "asset_code", 40);
  const machineryType = text(form, "machinery_type", 40) || "tractor";
  const make = text(form, "make", 80);
  const model = text(form, "model", 80);
  const registrationNumber = text(form, "registration_number", 40);
  const serialNumber = text(form, "serial_number", 60);
  const yearRaw = Number(text(form, "year_manufactured", 6));
  const engineHoursRaw = Number(text(form, "engine_hours", 10));
  const purchaseCostNgn = Number(text(form, "purchase_cost_ngn", 15));
  const fuelType = text(form, "fuel_type", 20) || "diesel";
  const operatorId = text(form, "default_operator_id", 36);
  const notes = text(form, "notes", 1000);

  if (!farmId) return bad("errorFarmRequired");
  if (!assetCode || assetCode.length < 2) return bad("errorAssetCodeRequired");
  if (!make || !model) return bad("errorMakeModelRequired");

  const purchaseCostKobo = Number.isFinite(purchaseCostNgn) && purchaseCostNgn >= 0 ? Math.round(purchaseCostNgn * 100) : 0;
  const engineHours = Number.isFinite(engineHoursRaw) && engineHoursRaw >= 0 ? engineHoursRaw : 0;
  const year = Number.isFinite(yearRaw) && yearRaw > 1950 ? yearRaw : null;

  const { error } = await (s.supabase as any)
    .from("farm_machinery_assets")
    .insert({
      farm_id: farmId,
      asset_code: assetCode,
      machinery_type: machineryType,
      make,
      model,
      registration_number: registrationNumber || null,
      serial_number: serialNumber || null,
      year_manufactured: year,
      engine_hours: engineHours,
      purchase_cost_kobo: purchaseCostKobo,
      fuel_type: fuelType,
      default_operator_id: operatorId || null,
      current_status: "AVAILABLE",
      notes: notes || null,
    });

  if (error) {
    logger.warn("machinery_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToSaveMachinery");
  }

  refresh();
  return ok({ message: "machinery_registered" });
}

export async function logMachineryUsageAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const machineryId = text(form, "machinery_id", 36);
  const operatorId = text(form, "operator_id", 36);
  const plotId = text(form, "plot_id", 36);
  const logDate = text(form, "log_date", 12) || new Date().toISOString().split("T")[0];
  const startHoursRaw = Number(text(form, "start_engine_hours", 10));
  const endHoursRaw = Number(text(form, "end_engine_hours", 10));
  const areaCoveredRaw = Number(text(form, "area_covered_ha", 10));
  const fuelConsumedRaw = Number(text(form, "fuel_consumed_liters", 10));
  const costNgn = Number(text(form, "cost_ngn", 12));
  const notes = text(form, "notes", 500);

  if (!farmId || !machineryId) return bad("errorMachineryRequired");
  if (!Number.isFinite(startHoursRaw) || !Number.isFinite(endHoursRaw) || endHoursRaw < startHoursRaw) {
    return bad("errorEngineHoursInvalid");
  }

  const costKobo = Number.isFinite(costNgn) && costNgn >= 0 ? Math.round(costNgn * 100) : 0;
  const areaCoveredHa = Number.isFinite(areaCoveredRaw) && areaCoveredRaw >= 0 ? areaCoveredRaw : 0;
  const fuelConsumedLiters = Number.isFinite(fuelConsumedRaw) && fuelConsumedRaw >= 0 ? fuelConsumedRaw : 0;

  const { error } = await (s.supabase as any)
    .from("farm_machinery_usage_logs")
    .insert({
      farm_id: farmId,
      machinery_id: machineryId,
      operator_id: operatorId || null,
      plot_id: plotId || null,
      log_date: logDate,
      start_engine_hours: startHoursRaw,
      end_engine_hours: endHoursRaw,
      area_covered_ha: areaCoveredHa,
      fuel_consumed_liters: fuelConsumedLiters,
      cost_kobo: costKobo,
      notes: notes || null,
      recorded_by: s.uid,
    });

  if (error) {
    logger.warn("machinery_usage_failed", { code: error.code, message: error.message });
    return bad("errorFailedToLogUsage");
  }

  // Update machine current engine hours
  await (s.supabase as any)
    .from("farm_machinery_assets")
    .update({ engine_hours: endHoursRaw, updated_at: new Date().toISOString() })
    .eq("id", machineryId);

  refresh();
  return ok({ message: "machinery_usage_logged" });
}

export async function logMachineryMaintenanceAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const machineryId = text(form, "machinery_id", 36);
  const maintenanceType = text(form, "maintenance_type", 30) || "preventive";
  const serviceDate = text(form, "service_date", 12) || new Date().toISOString().split("T")[0];
  const engineHoursRaw = Number(text(form, "engine_hours_at_service", 10));
  const serviceProvider = text(form, "service_provider", 120);
  const partsReplaced = text(form, "parts_replaced", 500);
  const partsCostNgn = Number(text(form, "parts_cost_ngn", 12));
  const labourCostNgn = Number(text(form, "labour_cost_ngn", 12));
  const downtimeHoursRaw = Number(text(form, "downtime_hours", 8));
  const nextDueDate = text(form, "next_service_due_date", 12);
  const nextDueHoursRaw = Number(text(form, "next_service_due_hours", 10));
  const notes = text(form, "notes", 1000);

  if (!farmId || !machineryId) return bad("errorMachineryRequired");

  const partsCostKobo = Number.isFinite(partsCostNgn) && partsCostNgn >= 0 ? Math.round(partsCostNgn * 100) : 0;
  const labourCostKobo = Number.isFinite(labourCostNgn) && labourCostNgn >= 0 ? Math.round(labourCostNgn * 100) : 0;
  const totalCostKobo = partsCostKobo + labourCostKobo;
  const engineHours = Number.isFinite(engineHoursRaw) && engineHoursRaw >= 0 ? engineHoursRaw : 0;
  const downtimeHours = Number.isFinite(downtimeHoursRaw) && downtimeHoursRaw >= 0 ? downtimeHoursRaw : 0;
  const nextDueHours = Number.isFinite(nextDueHoursRaw) && nextDueHoursRaw > 0 ? nextDueHoursRaw : null;

  const { error } = await (s.supabase as any)
    .from("farm_machinery_maintenance_records")
    .insert({
      farm_id: farmId,
      machinery_id: machineryId,
      maintenance_type: maintenanceType,
      service_date: serviceDate,
      engine_hours_at_service: engineHours,
      service_provider: serviceProvider || null,
      parts_replaced: partsReplaced || null,
      parts_cost_kobo: partsCostKobo,
      labour_cost_kobo: labourCostKobo,
      total_cost_kobo: totalCostKobo,
      downtime_hours: downtimeHours,
      next_service_due_date: nextDueDate || null,
      next_service_due_hours: nextDueHours,
      notes: notes || null,
    });

  if (error) {
    logger.warn("machinery_maint_failed", { code: error.code, message: error.message });
    return bad("errorFailedToLogMaintenance");
  }

  refresh();
  return ok({ message: "maintenance_logged" });
}

export async function addEquipmentAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const equipmentName = text(form, "equipment_name", 120);
  const category = text(form, "category", 40) || "sprayer";
  const quantityRaw = Number(text(form, "quantity", 8));
  const storageLocation = text(form, "storage_location", 120);
  const condition = text(form, "condition", 30) || "good";
  const assignedWorkerId = text(form, "assigned_to_worker_id", 36);
  const purchaseCostNgn = Number(text(form, "purchase_cost_ngn", 12));
  const notes = text(form, "notes", 500);

  if (!farmId) return bad("errorFarmRequired");
  if (!equipmentName || equipmentName.length < 2) return bad("errorEquipmentNameRequired");

  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.round(quantityRaw) : 1;
  const purchaseCostKobo = Number.isFinite(purchaseCostNgn) && purchaseCostNgn >= 0 ? Math.round(purchaseCostNgn * 100) : 0;

  const { error } = await (s.supabase as any)
    .from("farm_equipment_assets")
    .insert({
      farm_id: farmId,
      equipment_name: equipmentName,
      category,
      quantity,
      storage_location: storageLocation || null,
      condition,
      assigned_to_worker_id: assignedWorkerId || null,
      purchase_cost_kobo: purchaseCostKobo,
      status: "available",
      notes: notes || null,
    });

  if (error) {
    logger.warn("equipment_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToSaveEquipment");
  }

  refresh();
  return ok({ message: "equipment_registered" });
}

/* ------------------------------------------------------------------ Staff Attendance & Tasks */

export async function recordAttendanceAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const workerId = text(form, "worker_id", 36);
  const attendanceDate = text(form, "attendance_date", 12) || new Date().toISOString().split("T")[0];
  const status = text(form, "status", 30) || "present";
  const overtimeMinutesRaw = Number(text(form, "overtime_minutes", 6));
  const dailyWageNgn = Number(text(form, "daily_wage_ngn", 12));
  const clockInLatRaw = Number(text(form, "clock_in_lat", 12));
  const clockInLngRaw = Number(text(form, "clock_in_lng", 12));
  const notes = text(form, "notes", 500);

  if (!farmId || !workerId) return bad("errorWorkerRequired");

  const dailyWageKobo = Number.isFinite(dailyWageNgn) && dailyWageNgn >= 0 ? Math.round(dailyWageNgn * 100) : 0;
  const overtimeMinutes = Number.isFinite(overtimeMinutesRaw) && overtimeMinutesRaw >= 0 ? Math.round(overtimeMinutesRaw) : 0;
  const clockInLat = Number.isFinite(clockInLatRaw) ? clockInLatRaw : null;
  const clockInLng = Number.isFinite(clockInLngRaw) ? clockInLngRaw : null;

  const { error } = await (s.supabase as any)
    .from("farm_attendance_records")
    .upsert({
      farm_id: farmId,
      worker_id: workerId,
      attendance_date: attendanceDate,
      status,
      overtime_minutes: overtimeMinutes,
      daily_wage_kobo: dailyWageKobo,
      clock_in_lat: clockInLat,
      clock_in_lng: clockInLng,
      clock_in_time: new Date().toISOString(),
      notes: notes || null,
      recorded_by: s.uid,
    }, { onConflict: "worker_id,attendance_date" });

  if (error) {
    logger.warn("attendance_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToRecordAttendance");
  }

  refresh();
  return ok({ message: "attendance_recorded" });
}

export async function addOperationalTaskAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const title = text(form, "title", 140);
  const description = text(form, "description", 1000);
  const priority = text(form, "priority", 20) || "medium";
  const startDate = text(form, "start_date", 12) || new Date().toISOString().split("T")[0];
  const dueDate = text(form, "due_date", 12) || startDate;
  const workerId = text(form, "assigned_worker_id", 36);
  const plotId = text(form, "plot_id", 36);
  const cycleId = text(form, "crop_cycle_id", 36);
  const livestockGroupId = text(form, "livestock_group_id", 36);
  const estDurationRaw = Number(text(form, "estimated_duration_hours", 6));
  const estCostNgn = Number(text(form, "estimated_cost_ngn", 12));
  const notes = text(form, "notes", 1000);

  if (!farmId) return bad("errorFarmRequired");
  if (!title || title.length < 2) return bad("errorTaskTitleRequired");

  const estDuration = Number.isFinite(estDurationRaw) && estDurationRaw >= 0 ? estDurationRaw : 0;
  const estCostKobo = Number.isFinite(estCostNgn) && estCostNgn >= 0 ? Math.round(estCostNgn * 100) : 0;

  const { error } = await (s.supabase as any)
    .from("farm_operational_tasks")
    .insert({
      farm_id: farmId,
      title,
      description: description || null,
      priority,
      status: "PLANNED",
      start_date: startDate,
      due_date: dueDate,
      assigned_worker_id: workerId || null,
      plot_id: plotId || null,
      crop_cycle_id: cycleId || null,
      livestock_group_id: livestockGroupId || null,
      estimated_duration_hours: estDuration,
      estimated_cost_kobo: estCostKobo,
      notes: notes || null,
      created_by: s.uid,
    });

  if (error) {
    logger.warn("task_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToSaveTask");
  }

  refresh();
  return ok({ message: "task_created" });
}

export async function updateOperationalTaskAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const taskId = text(form, "task_id", 36);
  const status = text(form, "status", 30) || "COMPLETED";
  const actualDurationRaw = Number(text(form, "actual_duration_hours", 6));
  const actualCostNgn = Number(text(form, "actual_cost_ngn", 12));
  const notes = text(form, "notes", 1000);

  if (!taskId) return bad("errorTaskIdRequired");

  const actualDuration = Number.isFinite(actualDurationRaw) && actualDurationRaw >= 0 ? actualDurationRaw : 0;
  const actualCostKobo = Number.isFinite(actualCostNgn) && actualCostNgn >= 0 ? Math.round(actualCostNgn * 100) : 0;

  const updates: Record<string, any> = {
    status,
    actual_duration_hours: actualDuration,
    actual_cost_kobo: actualCostKobo,
    updated_at: new Date().toISOString(),
  };

  if (status === "COMPLETED") {
    updates.completed_at = new Date().toISOString();
  }
  if (notes) {
    updates.notes = notes;
  }

  const { error } = await (s.supabase as any)
    .from("farm_operational_tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) {
    logger.warn("task_update_failed", { code: error.code, message: error.message });
    return bad("errorFailedToUpdateTask");
  }

  refresh();
  return ok({ message: "task_updated" });
}

/* ------------------------------------------------------------------ Livestock Deep Domain Actions */

export async function addIndividualLivestockAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const tagNumber = text(form, "tag_number", 60);
  const rfidNumber = text(form, "rfid_number", 60);
  const animalType = text(form, "animal_type", 30) || "cattle";
  const breed = text(form, "breed", 80);
  const sex = text(form, "sex", 10) || "female";
  const dob = text(form, "date_of_birth", 12);
  const acquisitionDate = text(form, "acquisition_date", 12) || new Date().toISOString().split("T")[0];
  const acquisitionSource = text(form, "acquisition_source", 30) || "born_on_farm";
  const sireTag = text(form, "sire_tag", 60);
  const damTag = text(form, "dam_tag", 60);
  const currentWeightRaw = Number(text(form, "current_weight_kg", 8));
  const housingLocation = text(form, "housing_location", 120);
  const notes = text(form, "notes", 1000);

  if (!farmId) return bad("errorFarmRequired");
  if (!tagNumber || tagNumber.length < 1) return bad("errorTagRequired");
  if (!breed) return bad("errorBreedRequired");

  const currentWeight = Number.isFinite(currentWeightRaw) && currentWeightRaw >= 0 ? currentWeightRaw : null;

  const { error } = await (s.supabase as any)
    .from("farm_livestock_animals")
    .insert({
      farm_id: farmId,
      tag_number: tagNumber,
      rfid_number: rfidNumber || null,
      animal_type: animalType,
      breed,
      sex,
      date_of_birth: dob || null,
      acquisition_date: acquisitionDate,
      acquisition_source: acquisitionSource,
      sire_tag: sireTag || null,
      dam_tag: damTag || null,
      current_weight_kg: currentWeight,
      housing_location: housingLocation || null,
      status: "active",
      notes: notes || null,
    });

  if (error) {
    logger.warn("individual_livestock_failed", { code: error.code, message: error.message });
    return bad("errorFailedToSaveAnimal");
  }

  refresh();
  return ok({ message: "animal_registered" });
}

export async function logLivestockHealthAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const animalId = text(form, "animal_id", 36);
  const groupId = text(form, "group_id", 36);
  const eventType = text(form, "event_type", 30) || "vaccination";
  const disease = text(form, "disease_or_condition", 120);
  const symptoms = text(form, "symptoms", 500);
  const medicationName = text(form, "medication_name", 120);
  const dosage = text(form, "dosage", 80);
  const administeredOn = text(form, "administered_on", 12) || new Date().toISOString().split("T")[0];
  const withdrawalDaysRaw = Number(text(form, "withdrawal_period_days", 6));
  const vetName = text(form, "vet_name", 120);
  const costNgn = Number(text(form, "cost_ngn", 12));
  const notes = text(form, "notes", 1000);

  if (!farmId) return bad("errorFarmRequired");

  const withdrawalDays = Number.isFinite(withdrawalDaysRaw) && withdrawalDaysRaw >= 0 ? Math.round(withdrawalDaysRaw) : 0;
  const costKobo = Number.isFinite(costNgn) && costNgn >= 0 ? Math.round(costNgn * 100) : 0;

  const adminDate = new Date(administeredOn);
  const endDate = new Date(adminDate);
  endDate.setDate(endDate.getDate() + withdrawalDays);
  const withdrawalEndDate = endDate.toISOString().split("T")[0];

  const { error } = await (s.supabase as any)
    .from("farm_livestock_health_events")
    .insert({
      farm_id: farmId,
      animal_id: animalId || null,
      group_id: groupId || null,
      event_type: eventType,
      disease_or_condition: disease || null,
      symptoms: symptoms || null,
      medication_name: medicationName || null,
      dosage: dosage || null,
      administered_on: administeredOn,
      withdrawal_period_days: withdrawalDays,
      withdrawal_end_date: withdrawalEndDate,
      vet_name: vetName || null,
      cost_kobo: costKobo,
      notes: notes || null,
      recorded_by: s.uid,
    });

  if (error) {
    logger.warn("livestock_health_failed", { code: error.code, message: error.message });
    return bad("errorFailedToLogHealth");
  }

  refresh();
  return ok({ message: "health_event_logged" });
}

export async function logLivestockFeedingAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const groupId = text(form, "group_id", 36);
  const animalId = text(form, "animal_id", 36);
  const feedItemId = text(form, "feed_item_id", 36);
  const feedName = text(form, "feed_name", 120);
  const quantityRaw = Number(text(form, "quantity_kg", 10));
  const costNgn = Number(text(form, "cost_ngn", 12));
  const feedingDate = text(form, "feeding_date", 12) || new Date().toISOString().split("T")[0];
  const wasteRaw = Number(text(form, "waste_kg", 10));
  const notes = text(form, "notes", 500);

  if (!farmId) return bad("errorFarmRequired");
  if (!feedName || !Number.isFinite(quantityRaw) || quantityRaw <= 0) return bad("errorFeedQuantityRequired");

  const costKobo = Number.isFinite(costNgn) && costNgn >= 0 ? Math.round(costNgn * 100) : 0;
  const wasteKg = Number.isFinite(wasteRaw) && wasteRaw >= 0 ? wasteRaw : 0;

  const { error } = await (s.supabase as any)
    .from("farm_livestock_feedings")
    .insert({
      farm_id: farmId,
      group_id: groupId || null,
      animal_id: animalId || null,
      feed_item_id: feedItemId || null,
      feed_name: feedName,
      quantity_kg: quantityRaw,
      cost_kobo: costKobo,
      feeding_date: feedingDate,
      waste_kg: wasteKg,
      notes: notes || null,
      recorded_by: s.uid,
    });

  if (error) {
    logger.warn("livestock_feeding_failed", { code: error.code, message: error.message });
    return bad("errorFailedToLogFeeding");
  }

  refresh();
  return ok({ message: "feeding_logged" });
}

export async function logLivestockProductionAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const groupId = text(form, "group_id", 36);
  const animalId = text(form, "animal_id", 36);
  const productType = text(form, "product_type", 30) || "eggs";
  const quantityRaw = Number(text(form, "quantity", 12));
  const unit = text(form, "unit", 20) || "crates";
  const productionDate = text(form, "production_date", 12) || new Date().toISOString().split("T")[0];
  const qualityGrade = text(form, "quality_grade", 20) || "standard";
  const storageLocation = text(form, "storage_location", 120);

  if (!farmId) return bad("errorFarmRequired");
  if (!Number.isFinite(quantityRaw) || quantityRaw <= 0) return bad("errorProductionQuantityInvalid");

  const { error } = await (s.supabase as any)
    .from("farm_livestock_production_logs")
    .insert({
      farm_id: farmId,
      group_id: groupId || null,
      animal_id: animalId || null,
      product_type: productType,
      quantity: quantityRaw,
      unit,
      production_date: productionDate,
      quality_grade: qualityGrade,
      storage_location: storageLocation || null,
      recorded_by: s.uid,
    });

  if (error) {
    logger.warn("livestock_prod_failed", { code: error.code, message: error.message });
    return bad("errorFailedToLogProduction");
  }

  refresh();
  return ok({ message: "production_logged" });
}

/* ------------------------------------------------------------------ Multi-Location Inventory Movement */

export async function moveInventoryTransactionalAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const inventoryId = text(form, "inventory_id", 36);
  const txType = text(form, "transaction_type", 30) || "ISSUE";
  const quantityRaw = Number(text(form, "quantity", 12));
  const unitCostNgn = Number(text(form, "unit_cost_ngn", 12));
  const notes = text(form, "notes", 500);

  if (!farmId || !inventoryId) return bad("errorInventoryRequired");
  if (!Number.isFinite(quantityRaw) || quantityRaw <= 0) return bad("errorQuantityInvalid");

  const unitCostKobo = Number.isFinite(unitCostNgn) && unitCostNgn >= 0 ? Math.round(unitCostNgn * 100) : 0;
  const idempotencyKey = `tx_${farmId}_${inventoryId}_${Date.now()}`;

  const { data, error } = await (s.supabase as any).rpc("record_farm_inventory_movement", {
    p_farm_id: farmId,
    p_inventory_id: inventoryId,
    p_transaction_type: txType,
    p_quantity: quantityRaw,
    p_unit_cost_kobo: unitCostKobo,
    p_notes: notes || null,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    logger.warn("inventory_movement_failed", { code: error.code, message: error.message });
    return bad(error.message || "errorFailedInventoryMovement");
  }

  refresh();
  return ok({ message: "inventory_movement_recorded", data: { new_balance: String(data?.balance_after ?? "") } });
}

/* ------------------------------------------------------------------ Standard Plan Actual Variance Recording */

export async function recordPlanActualVarianceAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const entityType = text(form, "entity_type", 30) || "crop_operation";
  const entityId = text(form, "entity_id", 36);
  const standardId = text(form, "standard_id", 80);
  const metricName = text(form, "metric_name", 60);
  const unit = text(form, "unit", 30);
  const standardValRaw = Number(text(form, "standard_value", 12));
  const planValRaw = Number(text(form, "plan_value", 12));
  const actualValRaw = Number(text(form, "actual_value", 12));
  const isOverride = text(form, "is_farmer_override", 10) === "true";
  const reason = text(form, "farmer_deviation_reason", 1000);

  if (!farmId || !entityId) return bad("errorEntityRequired");
  if (!metricName || !unit) return bad("errorMetricRequired");

  const { error } = await (s.supabase as any)
    .from("farm_plan_actual_variances")
    .insert({
      farm_id: farmId,
      entity_type: entityType,
      entity_id: entityId,
      standard_id: standardId || null,
      is_farmer_override: isOverride,
      metric_name: metricName,
      unit,
      standard_value: Number.isFinite(standardValRaw) ? standardValRaw : 0,
      plan_value: Number.isFinite(planValRaw) ? planValRaw : 0,
      actual_value: Number.isFinite(actualValRaw) ? actualValRaw : 0,
      farmer_deviation_reason: reason || null,
    });

  if (error) {
    logger.warn("variance_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToSaveVariance");
  }

  refresh();
  return ok({ message: "variance_recorded" });
}

/* ------------------------------------------------------------------ Farm Budgets Action */

export async function addFarmBudgetAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const farmId = text(form, "farm_id", 36);
  const name = text(form, "name", 120);
  const fiscalYearRaw = Number(text(form, "fiscal_year", 6));
  const enterpriseType = text(form, "enterprise_type", 30) || "whole_farm";
  const budgetedExpenseNgn = Number(text(form, "total_budgeted_expense_ngn", 15));
  const budgetedIncomeNgn = Number(text(form, "total_budgeted_income_ngn", 15));

  if (!farmId) return bad("errorFarmRequired");
  if (!name || name.length < 2) return bad("errorBudgetNameRequired");

  const fiscalYear = Number.isFinite(fiscalYearRaw) ? fiscalYearRaw : new Date().getFullYear();
  const expenseKobo = Number.isFinite(budgetedExpenseNgn) && budgetedExpenseNgn >= 0 ? Math.round(budgetedExpenseNgn * 100) : 0;
  const incomeKobo = Number.isFinite(budgetedIncomeNgn) && budgetedIncomeNgn >= 0 ? Math.round(budgetedIncomeNgn * 100) : 0;

  const { error } = await (s.supabase as any)
    .from("farm_budgets")
    .insert({
      farm_id: farmId,
      name,
      fiscal_year: fiscalYear,
      enterprise_type: enterpriseType,
      total_budgeted_expense_kobo: expenseKobo,
      total_budgeted_income_kobo: incomeKobo,
      status: "active",
      created_by: s.uid,
    });

  if (error) {
    logger.warn("budget_insert_failed", { code: error.code, message: error.message });
    return bad("errorFailedToCreateBudget");
  }

  refresh();
  return ok({ message: "budget_created" });
}

