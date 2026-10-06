"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { HarvestQualityGrade } from "@cultivanode/shared";

export type HarvestActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  at?: number;
  batchCode?: string;
};

const ok = (extra: Partial<HarvestActionState> = {}): HarvestActionState => ({
  ok: true,
  at: Date.now(),
  ...extra,
});

const bad = (error: string, extra: Partial<HarvestActionState> = {}): HarvestActionState => ({
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

/* ------------------------------------------------------------------ CM-09 / CM-10: Record Harvest */

export async function recordHarvestAction(
  _prev: HarvestActionState,
  form: FormData
): Promise<HarvestActionState> {
  const s = await signedIn(form);
  const cycleId = text(form, "cycle_id", 36);
  const harvestDate = text(form, "harvest_date", 10) || new Date().toISOString().split("T")[0]!;
  const qtyRaw = text(form, "quantity_kg", 15);
  const qualityGrade = (text(form, "quality_grade", 30) || "grade_a") as HarvestQualityGrade;
  const moistureRaw = text(form, "moisture_pct", 6);
  const lossRaw = text(form, "loss_pct", 6);
  const storageLocation = text(form, "storage_location", 120);
  const notes = text(form, "notes", 1000);

  if (!cycleId) return bad("errorCycleRequired");

  const quantityKg = Number(qtyRaw.replace(",", "."));
  if (!Number.isFinite(quantityKg) || quantityKg <= 0) return bad("errorQuantityInvalid");

  const moisturePct = moistureRaw ? Number(moistureRaw.replace(",", ".")) : null;
  const lossPct = lossRaw ? Number(lossRaw.replace(",", ".")) : null;

  // Generate unique batch code
  const datePrefix = harvestDate.replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const batchCode = `HV-${datePrefix}-${randomSuffix}`;

  const { error } = await s.supabase
    .from("crop_harvests")
    .insert({
      cycle_id: cycleId,
      batch_code: batchCode,
      harvest_date: harvestDate,
      quantity_kg: quantityKg,
      quality_grade: qualityGrade,
      moisture_pct: moisturePct,
      loss_pct: lossPct,
      storage_location: storageLocation || null,
      notes: notes || null,
      recorded_by: s.uid,
    });

  if (error) {
    logger.error("crop_harvest.insert_failed", { cycleId, error: String(error) });
    return bad("errorFailedToRecordHarvest");
  }

  // Update cycle status to harvesting if it was active
  await s.supabase
    .from("crop_cycles")
    .update({ status: "harvesting", updated_at: new Date().toISOString() })
    .eq("id", cycleId)
    .eq("status", "active");

  refresh();
  return ok({
    batchCode,
    message: `Harvest batch ${batchCode} recorded (${quantityKg.toLocaleString()} kg)`,
  });
}
