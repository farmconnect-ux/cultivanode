import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * CultivaNode 3.0 — Batch 03.3 (Workstream B) Machinery Telemetry Provenance Service.
 *
 * Security boundary:
 * - This module is the ONLY application file permitted by ESLint
 *   (`cultivanode/no-direct-telemetry-trusted-writer`) to invoke the `service_role`-only
 *   `ingest_authenticated_device_telemetry` and `ingest_provider_machinery_telemetry` RPCs.
 * - Device authentication (`auth_token_hash` SHA-256 verification and active
 *   `machinery_device_links` check) is enforced INSIDE PostgreSQL, not merely in Next.js.
 * - Never logs raw device tokens, credentials, or secrets.
 */

export const AuthenticatedDeviceTelemetrySchema = z
  .object({
    deviceId: z.string().uuid(),
    deviceToken: z.string().min(16).max(256),
    farmId: z.string().uuid(),
    machineryId: z.string().uuid(),
    recordedAt: z.string().datetime(),
    deviceEventId: z.string().trim().min(1).max(128),
    speedKmh: z.number().min(0).max(120).nullable().optional(),
    headingDeg: z.number().min(0).max(360).nullable().optional(),
    fuelPct: z.number().min(0).max(100).nullable().optional(),
    engineRpm: z.number().int().min(0).max(6000).nullable().optional(),
    engineTempC: z.number().min(-40).max(200).nullable().optional(),
    engineHours: z.number().min(0).max(100_000).nullable().optional(),
    status: z.enum(["idle", "working", "transit", "off", "alert"]).default("working"),
    traceId: z.string().uuid().optional(),
  })
  .strict();

export type AuthenticatedDeviceTelemetryInput = z.input<typeof AuthenticatedDeviceTelemetrySchema>;

export const FarmerObservationTelemetrySchema = z
  .object({
    farmId: z.string().uuid(),
    machineryId: z.string().uuid(),
    recordedAt: z.string().datetime(),
    fuelPct: z.number().min(0).max(100).nullable().optional(),
    engineHours: z.number().min(0).max(100_000).nullable().optional(),
    engineTempC: z.number().min(-40).max(200).nullable().optional(),
    status: z.enum(["idle", "working", "transit", "off", "alert"]).default("idle"),
    traceId: z.string().uuid().optional(),
  })
  .strict();

export type FarmerObservationTelemetryInput = z.input<typeof FarmerObservationTelemetrySchema>;

export type TelemetryIngestionResult =
  | {
      ok: true;
      telemetryId: string;
      farmId: string;
      machineryId: string;
      sourceCategory: string;
      validationStatus: string;
      trustClassification: string;
      traceId: string;
      ingestedAt: string;
    }
  | { ok: false; status: number; code: string; error: string };

export async function ingestAuthenticatedDeviceTelemetry(
  input: AuthenticatedDeviceTelemetryInput,
  options: { serviceClientOverride?: SupabaseClient<Database> } = {},
): Promise<TelemetryIngestionResult> {
  const parsed = AuthenticatedDeviceTelemetrySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "invalid_telemetry_payload",
      error: parsed.error.issues[0]?.message ?? "Invalid machinery telemetry payload.",
    };
  }

  const data = parsed.data;
  const traceId = data.traceId ?? randomUUID();

  let serviceClient: SupabaseClient<Database> | null = null;
  try {
    serviceClient = options.serviceClientOverride ?? createServiceClient();
  } catch {
    serviceClient = null;
  }

  if (!serviceClient) {
    logger.error("machinery_telemetry_service_client_unavailable", {
      farmId: data.farmId,
      machineryId: data.machineryId,
      traceId,
    });
    return {
      ok: false,
      status: 503,
      code: "telemetry_service_unavailable",
      error: "Telemetry ingestion service is not configured.",
    };
  }

  const { data: rpcData, error } = await serviceClient.rpc("ingest_authenticated_device_telemetry", {
    p_device_id: data.deviceId,
    p_device_token: data.deviceToken,
    p_farm_id: data.farmId,
    p_machinery_id: data.machineryId,
    p_recorded_at: data.recordedAt,
    p_device_event_id: data.deviceEventId,
    p_speed_kmh: data.speedKmh ?? null,
    p_heading_deg: data.headingDeg ?? null,
    p_fuel_pct: data.fuelPct ?? null,
    p_engine_rpm: data.engineRpm ?? null,
    p_engine_temp_c: data.engineTempC ?? null,
    p_engine_hours: data.engineHours ?? null,
    p_status: data.status,
    p_trace_id: traceId,
  });

  if (error || !rpcData || typeof rpcData !== "object" || Array.isArray(rpcData)) {
    logger.warn("machinery_telemetry_device_ingestion_rejected", {
      farmId: data.farmId,
      machineryId: data.machineryId,
      deviceId: data.deviceId,
      traceId,
      code: error?.code ?? "unknown",
    });
    const status =
      error?.code === "42501"
        ? 403
        : error?.code === "23505"
          ? 409
          : error?.code === "22023" || error?.code === "23514"
            ? 400
            : 500;
    return {
      ok: false,
      status,
      code: error?.code === "23505" ? "duplicate_device_event" : error?.code ?? "device_ingestion_failed",
      error: error?.message ?? "Machinery telemetry ingestion rejected.",
    };
  }

  const obj = rpcData as Record<string, unknown>;
  return {
    ok: true,
    telemetryId: String(obj.telemetry_id ?? ""),
    farmId: String(obj.farm_id ?? data.farmId),
    machineryId: String(obj.machinery_id ?? data.machineryId),
    sourceCategory: String(obj.source_category ?? "device_authenticated"),
    validationStatus: String(obj.validation_status ?? "verified"),
    trustClassification: String(obj.trust_classification ?? "verified_current"),
    traceId: String(obj.trace_id ?? traceId),
    ingestedAt: String(obj.ingested_at ?? new Date().toISOString()),
  };
}

export async function recordMachineryObservation(
  userClient: SupabaseClient<Database>,
  input: FarmerObservationTelemetryInput,
): Promise<TelemetryIngestionResult> {
  const parsed = FarmerObservationTelemetrySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "invalid_observation_payload",
      error: parsed.error.issues[0]?.message ?? "Invalid machinery observation payload.",
    };
  }

  const data = parsed.data;
  const traceId = data.traceId ?? randomUUID();

  const { data: rpcData, error } = await userClient.rpc("record_machinery_observation", {
    p_farm_id: data.farmId,
    p_machinery_id: data.machineryId,
    p_recorded_at: data.recordedAt,
    p_fuel_pct: data.fuelPct ?? null,
    p_engine_hours: data.engineHours ?? null,
    p_engine_temp_c: data.engineTempC ?? null,
    p_status: data.status,
    p_trace_id: traceId,
  });

  if (error || !rpcData || typeof rpcData !== "object" || Array.isArray(rpcData)) {
    const status = error?.code === "42501" ? 403 : error?.code === "22023" || error?.code === "23514" ? 400 : 500;
    return {
      ok: false,
      status,
      code: error?.code ?? "observation_failed",
      error: error?.message ?? "Unable to record machinery observation.",
    };
  }

  const obj = rpcData as Record<string, unknown>;
  return {
    ok: true,
    telemetryId: String(obj.telemetry_id ?? ""),
    farmId: String(obj.farm_id ?? data.farmId),
    machineryId: String(obj.machinery_id ?? data.machineryId),
    sourceCategory: String(obj.source_category ?? "farmer_observation"),
    validationStatus: String(obj.validation_status ?? "provisional"),
    trustClassification: String(obj.trust_classification ?? "unverified_provisional"),
    traceId: String(obj.trace_id ?? traceId),
    ingestedAt: String(obj.ingested_at ?? new Date().toISOString()),
  };
}
