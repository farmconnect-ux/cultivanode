"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import {
  calculateCropHealthScore,
  type ScoutingCategory,
  type ScoutingSeverity,
} from "@cultivanode/shared";

export type ScoutingActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  at?: number;
  newHealthScore?: number;
};

const ok = (extra: Partial<ScoutingActionState> = {}): ScoutingActionState => ({
  ok: true,
  at: Date.now(),
  ...extra,
});

const bad = (error: string, extra: Partial<ScoutingActionState> = {}): ScoutingActionState => ({
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

async function recomputeAndSaveHealth(supabase: any, cycleId: string) {
  const [opsRes, obsRes, alertsRes] = await Promise.all([
    supabase.from("crop_cycle_operations").select("status, scheduled_end_date").eq("cycle_id", cycleId),
    supabase.from("crop_observations").select("resolved, severity, category, description").eq("cycle_id", cycleId),
    supabase.from("crop_alerts").select("is_dismissed, severity, title").eq("cycle_id", cycleId),
  ]);

  const ops = (opsRes.data ?? []).map((o: any) => ({
    status: o.status,
    scheduledEndDate: o.scheduled_end_date,
  }));

  const obs = (obsRes.data ?? []).map((o: any) => ({
    resolved: o.resolved,
    severity: o.severity,
    category: o.category,
    description: o.description,
  }));

  const alerts = (alertsRes.data ?? []).map((a: any) => ({
    isDismissed: a.is_dismissed,
    severity: a.severity,
    title: a.title,
  }));

  const health = calculateCropHealthScore({
    operations: ops,
    observations: obs,
    alerts,
  });

  await supabase
    .from("crop_cycles")
    .update({
      health_score: health.score,
      health_status: health.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cycleId);

  return health;
}

/* ------------------------------------------------------------------ CM-07 / CM-08: Scouting Observation */

export async function recordScoutingObservationAction(
  _prev: ScoutingActionState,
  form: FormData
): Promise<ScoutingActionState> {
  const s = await signedIn(form);
  const cycleId = text(form, "cycle_id", 36);
  const category = (text(form, "category", 30) || "general") as ScoutingCategory;
  const severity = (text(form, "severity", 20) || "low") as ScoutingSeverity;
  const description = text(form, "description", 1000);
  const recommendedAction = text(form, "recommended_action", 1000);
  const latRaw = text(form, "latitude", 20);
  const lngRaw = text(form, "longitude", 20);
  const photoPathRaw = text(form, "photo_path", 300);

  if (!cycleId) return bad("errorCycleRequired");
  if (!description || description.length < 3) return bad("errorDescriptionRequired");

  let locationGeog: string | null = null;
  if (latRaw && lngRaw) {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      locationGeog = `SRID=4326;POINT(${lng} ${lat})`;
    }
  }

  const photoPaths = photoPathRaw ? [photoPathRaw] : [];

  const { error } = await (s.supabase as any)
    .from("crop_observations")
    .insert({
      cycle_id: cycleId,
      observer_id: s.uid,
      category,
      severity,
      description,
      photo_paths: photoPaths,
      location: locationGeog,
      recommended_action: recommendedAction || null,
      resolved: false,
    });

  if (error) {
    logger.error("crop_scouting.insert_failed", { cycleId, error: String(error) });
    return bad("errorFailedToRecordObservation");
  }

  // Recalculate health telemetry
  const health = await recomputeAndSaveHealth(s.supabase, cycleId);

  refresh();
  return ok({
    message: "Observation logged. Crop health updated.",
    newHealthScore: health.score,
  });
}

export async function resolveScoutingObservationAction(
  observationId: string,
  cycleId: string
): Promise<ScoutingActionState> {
  const s = await signedIn();
  const { error } = await (s.supabase as any)
    .from("crop_observations")
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", observationId);

  if (error) {
    logger.error("crop_scouting.resolve_failed", { observationId, error: String(error) });
    return bad("errorFailedToResolveObs");
  }

  const health = await recomputeAndSaveHealth(s.supabase, cycleId);

  refresh();
  return ok({
    message: "Observation marked as resolved. Crop health updated.",
    newHealthScore: health.score,
  });
}

/* ------------------------------------------------------------------ CM-08: Crop Measurement */

export async function recordMeasurementAction(
  _prev: ScoutingActionState,
  form: FormData
): Promise<ScoutingActionState> {
  const s = await signedIn(form);
  const cycleId = text(form, "cycle_id", 36);
  const metricName = text(form, "metric_name", 60);
  const metricValueRaw = text(form, "metric_value", 15);

  if (!cycleId) return bad("errorCycleRequired");
  if (!metricName) return bad("errorMetricNameRequired");

  const metricValue = Number(metricValueRaw.replace(",", "."));
  if (!Number.isFinite(metricValue)) return bad("errorMetricValueInvalid");

  const { error } = await (s.supabase as any)
    .from("crop_measurements")
    .insert({
      cycle_id: cycleId,
      metric_name: metricName,
      metric_value: metricValue,
      recorded_by: s.uid,
    });

  if (error) {
    logger.error("crop_scouting.measurement_insert_failed", { cycleId, error: String(error) });
    return bad("errorFailedToRecordMeasurement");
  }

  refresh();
  return ok({ message: "Crop measurement logged" });
}
