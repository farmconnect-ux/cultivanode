import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";
import { verifyActiveAccount } from "@/lib/engines-api-helper";
import {
  ingestAuthenticatedDeviceTelemetry,
  recordMachineryObservation,
  type AuthenticatedDeviceTelemetryInput,
  type FarmerObservationTelemetryInput,
} from "@/lib/iot/machinery-telemetry-ingestion.service";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * POST /api/iot/machinery-telemetry
 *
 * Supports two strictly separated provenance pathways:
 * 1. Device-authenticated telemetry: `x-device-id` header + `Authorization: Bearer <device-token>`.
 *    Token SHA-256 and active machinery_device_links are verified inside PostgreSQL.
 * 2. Farmer / staff observation: `Authorization: Bearer <supabase-jwt>` (no `x-device-id`).
 *    Always classified as `farmer_observation` / `staff_observation` and `unverified_provisional`.
 */
export async function POST(req: Request) {
  const token = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    body = raw as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const deviceId = req.headers.get("x-device-id")?.trim();
  if (deviceId) {
    const res = await ingestAuthenticatedDeviceTelemetry({
      ...body,
      deviceId,
      deviceToken: token,
    } as unknown as AuthenticatedDeviceTelemetryInput);
    if (!res.ok) {
      return NextResponse.json({ error: res.error, code: res.code }, { status: res.status });
    }
    return NextResponse.json(res, { status: 201 });
  }

  // Authenticated farmer / staff observation pathway
  try {
    const { url, key } = supabaseEnv();
    const client = createSupabaseClient<Database>(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const active = await verifyActiveAccount(client, data.user.id);
    if (!active.ok) return active.response;

    const res = await recordMachineryObservation(client, body as unknown as FarmerObservationTelemetryInput);
    if (!res.ok) {
      return NextResponse.json({ error: res.error, code: res.code }, { status: res.status });
    }
    return NextResponse.json(res, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable." }, { status: 503 });
  }
}
