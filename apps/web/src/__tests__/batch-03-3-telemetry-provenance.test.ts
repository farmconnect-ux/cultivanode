import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";

vi.mock("server-only", () => ({}));

import {
  ingestAuthenticatedDeviceTelemetry,
  recordMachineryObservation,
} from "@/lib/iot/machinery-telemetry-ingestion.service";

const FARM_A = "11111111-1111-4111-8111-111111111111";
const MACH_A = "22222222-2222-4222-8222-222222222222";
const DEV_A = "33333333-3333-4333-8333-333333333333";

describe("Batch 03.3 (Workstream B) — Machinery Telemetry Provenance Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates payloads, authenticates devices through service_role RPC, maps duplicate/auth errors, and keeps farmer observations unverified_provisional", async () => {
    const serviceRpc = vi.fn().mockResolvedValueOnce({
      data: {
        telemetry_id: "tel-1",
        farm_id: FARM_A,
        machinery_id: MACH_A,
        source_category: "device_authenticated",
        validation_status: "verified",
        trust_classification: "verified_current",
        trace_id: "44444444-4444-4444-8444-444444444444",
        ingested_at: "2026-11-21T20:00:00Z",
      },
      error: null,
    });
    const serviceClient = { rpc: serviceRpc } as unknown as SupabaseClient<Database>;

    // 1. Valid authenticated device ingestion
    const okRes = await ingestAuthenticatedDeviceTelemetry(
      {
        deviceId: DEV_A,
        deviceToken: "valid-device-token-1234567890",
        farmId: FARM_A,
        machineryId: MACH_A,
        recordedAt: "2026-11-21T19:58:00Z",
        deviceEventId: "evt-1001",
        speedKmh: 12.5,
        fuelPct: 78,
        engineHours: 121.5,
        status: "working",
      },
      { serviceClientOverride: serviceClient },
    );
    expect(okRes.ok).toBe(true);
    if (okRes.ok) {
      expect(okRes.sourceCategory).toBe("device_authenticated");
      expect(okRes.trustClassification).toBe("verified_current");
    }

    // 2. Implausible sensor value rejected before RPC (400)
    const badRange = await ingestAuthenticatedDeviceTelemetry(
      {
        deviceId: DEV_A,
        deviceToken: "valid-device-token-1234567890",
        farmId: FARM_A,
        machineryId: MACH_A,
        recordedAt: "2026-11-21T19:58:00Z",
        deviceEventId: "evt-1002",
        engineTempC: 999,
      },
      { serviceClientOverride: serviceClient },
    );
    expect(badRange.ok).toBe(false);
    if (!badRange.ok) expect(badRange.status).toBe(400);

    // 3. Replayed device event mapped to 409 duplicate_device_event
    serviceRpc.mockResolvedValueOnce({ data: null, error: { code: "23505", message: "duplicate key" } });
    const replay = await ingestAuthenticatedDeviceTelemetry(
      {
        deviceId: DEV_A,
        deviceToken: "valid-device-token-1234567890",
        farmId: FARM_A,
        machineryId: MACH_A,
        recordedAt: "2026-11-21T19:58:00Z",
        deviceEventId: "evt-1001",
      },
      { serviceClientOverride: serviceClient },
    );
    expect(replay.ok).toBe(false);
    if (!replay.ok) {
      expect(replay.status).toBe(409);
      expect(replay.code).toBe("duplicate_device_event");
    }

    // 4. Unauthenticated / revoked device mapped to 403
    serviceRpc.mockResolvedValueOnce({ data: null, error: { code: "42501", message: "Device authentication failed." } });
    const unauth = await ingestAuthenticatedDeviceTelemetry(
      {
        deviceId: DEV_A,
        deviceToken: "wrong-device-token-1234567890",
        farmId: FARM_A,
        machineryId: MACH_A,
        recordedAt: "2026-11-21T19:58:00Z",
        deviceEventId: "evt-1003",
      },
      { serviceClientOverride: serviceClient },
    );
    expect(unauth.ok).toBe(false);
    if (!unauth.ok) expect(unauth.status).toBe(403);

    // 5. Farmer observation via user JWT stays farmer_observation / unverified_provisional
    const userRpc = vi.fn().mockResolvedValueOnce({
      data: {
        telemetry_id: "tel-obs-1",
        farm_id: FARM_A,
        machinery_id: MACH_A,
        source_category: "farmer_observation",
        validation_status: "provisional",
        trust_classification: "unverified_provisional",
        trace_id: "55555555-5555-4555-8555-555555555555",
        ingested_at: "2026-11-21T20:01:00Z",
      },
      error: null,
    });
    const userClient = { rpc: userRpc } as unknown as SupabaseClient<Database>;
    const obsRes = await recordMachineryObservation(userClient, {
      farmId: FARM_A,
      machineryId: MACH_A,
      recordedAt: "2026-11-21T19:55:00Z",
      fuelPct: 80,
      engineHours: 121.0,
    });
    expect(obsRes.ok).toBe(true);
    if (obsRes.ok) {
      expect(obsRes.sourceCategory).toBe("farmer_observation");
      expect(obsRes.trustClassification).toBe("unverified_provisional");
    }
  });
});
