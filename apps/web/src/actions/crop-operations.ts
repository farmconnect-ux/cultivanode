"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import {
  APPROVED_CHEMICALS_REGISTRY,
  type CropInputCategory,
} from "@cultivanode/shared";

export type OperationActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  at?: number;
};

const ok = (extra: Partial<OperationActionState> = {}): OperationActionState => ({
  ok: true,
  at: Date.now(),
  ...extra,
});

const bad = (error: string, extra: Partial<OperationActionState> = {}): OperationActionState => ({
  ok: false,
  error,
  at: Date.now(),
  ...extra,
});

const text = (form: FormData, key: string, max: number) =>
  String(form.get(key) ?? "").trim().slice(0, max);

function lang(form: FormData): Locale {
  const l = text(form, "lang", 5);
  return hasLocale(l) ? l : "en";
}

async function signedIn(form?: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const l = form ? lang(form) : "en";
    redirect(`/${l}/sign-in`);
  }
  return { supabase, uid: data.user.id };
}

/* ------------------------------------------------------------------ CM-05: Complete Operation */

export async function completeOperationAction(
  _prev: OperationActionState,
  form: FormData
): Promise<OperationActionState> {
  const s = await signedIn(form);
  const operationId = text(form, "operation_id", 36);
  const actualDate = text(form, "actual_date", 10) || new Date().toISOString().split("T")[0]!;
  const costRaw = text(form, "actual_cost_ngn", 15);
  const notes = text(form, "notes", 1000);

  if (!operationId) return bad("errorOperationRequired");

  let actualCostKobo = 0;
  if (costRaw) {
    const costNgn = Number(costRaw.replace(",", "."));
    if (Number.isFinite(costNgn) && costNgn >= 0) {
      actualCostKobo = Math.round(costNgn * 100);
    }
  }

  const { error } = await (s.supabase as any)
    .from("crop_cycle_operations")
    .update({
      status: "completed",
      actual_date: actualDate,
      actual_cost_kobo: actualCostKobo,
      notes: notes || null,
      completed_by: s.uid,
      updated_at: new Date().toISOString(),
    })
    .eq("id", operationId);

  if (error) {
    logger.error("crop_operations.complete_failed", { operationId, error: String(error) });
    return bad("errorFailedToCompleteOp");
  }

  refresh();
  return ok({ message: "Operation marked as completed" });
}

/* ------------------------------------------------------------------ CM-05: Reschedule Operation */

export async function rescheduleOperationAction(
  _prev: OperationActionState,
  form: FormData
): Promise<OperationActionState> {
  const s = await signedIn(form);
  const operationId = text(form, "operation_id", 36);
  const startDate = text(form, "scheduled_start_date", 10);
  const endDate = text(form, "scheduled_end_date", 10);

  if (!operationId) return bad("errorOperationRequired");
  if (!startDate || !endDate) return bad("errorDatesRequired");
  if (endDate < startDate) return bad("errorInvalidDateRange");

  const { error } = await (s.supabase as any)
    .from("crop_cycle_operations")
    .update({
      scheduled_start_date: startDate,
      scheduled_end_date: endDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", operationId);

  if (error) {
    logger.error("crop_operations.reschedule_failed", { operationId, error: String(error) });
    return bad("errorFailedToRescheduleOp");
  }

  refresh();
  return ok({ message: "Operation rescheduled" });
}

/* ------------------------------------------------------------------ CM-05: Skip Operation */

export async function skipOperationAction(
  _prev: OperationActionState,
  form: FormData
): Promise<OperationActionState> {
  const s = await signedIn(form);
  const operationId = text(form, "operation_id", 36);
  const notes = text(form, "notes", 1000);

  if (!operationId) return bad("errorOperationRequired");

  const { error } = await (s.supabase as any)
    .from("crop_cycle_operations")
    .update({
      status: "skipped",
      notes: notes ? `Skipped: ${notes}` : "Skipped by farmer",
      updated_at: new Date().toISOString(),
    })
    .eq("id", operationId);

  if (error) {
    logger.error("crop_operations.skip_failed", { operationId, error: String(error) });
    return bad("errorFailedToSkipOp");
  }

  refresh();
  return ok({ message: "Operation skipped" });
}

/* ------------------------------------------------------------------ CM-06: Record Input Application (Chemical Safety Guardrail) */

export async function recordInputApplicationAction(
  _prev: OperationActionState,
  form: FormData
): Promise<OperationActionState> {
  const s = await signedIn(form);
  const cycleId = text(form, "cycle_id", 36);
  const operationId = text(form, "operation_id", 36) || null;
  const category = (text(form, "category", 30) || "other") as CropInputCategory;
  const chemicalId = text(form, "chemical_id", 60) || null;
  const productName = text(form, "product_name", 120);
  const activeIngredient = text(form, "active_ingredient", 120) || null;
  const rateRaw = text(form, "rate_per_ha", 10);
  const unit = text(form, "unit", 20) || "liters";
  const areaRaw = text(form, "area_applied_ha", 10);
  const quantityRaw = text(form, "total_quantity", 10);
  const costRaw = text(form, "cost_ngn", 15);
  const phiDaysRaw = text(form, "phi_days", 5);
  const appliedDate = text(form, "applied_date", 10) || new Date().toISOString().split("T")[0]!;

  if (!cycleId) return bad("errorCycleRequired");
  if (!productName) return bad("errorProductNameRequired");

  // NAFDAC BANNED CHEMICAL CHECK
  if (chemicalId) {
    const chemical = APPROVED_CHEMICALS_REGISTRY.find((c) => c.id === chemicalId);
    if (chemical?.isBannedInNigeria) {
      logger.warn("crop_operations.banned_chemical_blocked", { chemicalId, productName });
      return bad("errorChemicalBannedByNAFDAC: Active ingredient / chemical is BANNED in Nigeria (NAFDAC).");
    }
  }

  // Check active ingredient string for banned chemicals
  const bannedKeywords = ["paraquat", "carbofuran", "ddt", "aldrin", "endosulfan", "chlordane"];
  const combinedText = `${productName} ${activeIngredient ?? ""}`.toLowerCase();
  for (const banned of bannedKeywords) {
    if (combinedText.includes(banned)) {
      logger.warn("crop_operations.banned_chemical_detected", { productName, banned });
      return bad(`errorChemicalBannedByNAFDAC: "${banned}" is banned by NAFDAC in Nigeria and prohibited.`);
    }
  }

  const ratePerHa = Number(rateRaw.replace(",", ".")) || 1.0;
  const areaAppliedHa = Number(areaRaw.replace(",", ".")) || 1.0;
  const totalQuantity = Number(quantityRaw.replace(",", ".")) || (ratePerHa * areaAppliedHa);

  let costKobo = 0;
  if (costRaw) {
    const costNgn = Number(costRaw.replace(",", "."));
    if (Number.isFinite(costNgn) && costNgn >= 0) {
      costKobo = Math.round(costNgn * 100);
    }
  }

  const phiDays = Number(phiDaysRaw) || 0;

  const { error } = await (s.supabase as any)
    .from("crop_input_applications")
    .insert({
      cycle_id: cycleId,
      operation_id: operationId,
      category,
      chemical_id: chemicalId,
      product_name: productName,
      active_ingredient: activeIngredient,
      rate_per_ha: ratePerHa,
      unit,
      area_applied_ha: areaAppliedHa,
      total_quantity: totalQuantity,
      cost_kobo: costKobo,
      pre_harvest_interval_days: phiDays,
      applied_date: appliedDate,
      applied_by: s.uid,
    });

  if (error) {
    logger.error("crop_operations.input_insert_failed", { cycleId, error: String(error) });
    return bad("errorFailedToRecordInput");
  }

  refresh();
  return ok({ message: "Input application recorded safely" });
}
