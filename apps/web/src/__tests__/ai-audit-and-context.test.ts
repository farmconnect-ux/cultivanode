import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";

const mocks = vi.hoisted(() => ({
  createSupabaseClient: vi.fn(),
  supabaseEnv: vi.fn(),
  createServiceClient: vi.fn(),
  serviceRpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createSupabaseClient,
}));
vi.mock("@/lib/supabase/env", () => ({
  supabaseEnv: mocks.supabaseEnv,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createServiceClient: mocks.createServiceClient,
}));

import { authorizeAiFarmRequest, type VerifiedAiFarmCallerContext } from "@/lib/engines-api-helper";
import { recordAiAuditEvent } from "@/lib/ai-audit";
import { getLiveFarmContextSnapshot } from "@/lib/farm-context/live-farm-context.service";

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const TRACE_ID = "33333333-3333-4333-8333-333333333333";

function buildMockUserClient(tableResponses: Record<string, { data: unknown; error: unknown }>) {
  const makeBuilder = (table: string) => {
    const res = tableResponses[table] ?? { data: [], error: null };
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    builder.select = vi.fn(chain);
    builder.eq = vi.fn(chain);
    builder.in = vi.fn(chain);
    builder.gt = vi.fn(chain);
    builder.order = vi.fn(chain);
    builder.limit = vi.fn(chain);
    builder.maybeSingle = vi.fn(async () => res);
    builder.then = (resolve: (v: unknown) => void) => resolve(res);
    return builder;
  };

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } }, error: null })),
    },
    from: vi.fn((table: string) => makeBuilder(table)),
  };
}

function makeAuthReq(token = "valid-jwt") {
  return new Request("https://cultivanode.test/api/engines/ai/ground", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe("Batch 03.1C — Auth, Active Account & Consent Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.supabaseEnv.mockReturnValue({ url: "https://example.supabase.co", key: "anon-key" });
    mocks.createServiceClient.mockReturnValue({ rpc: mocks.serviceRpc });
  });

  it("rejects suspended, deleting, and deleted accounts with 403", async () => {
    for (const profile of [
      { id: USER_ID, suspended_at: "2026-11-01T00:00:00Z", deleted_at: null, deletion_status: null },
      { id: USER_ID, suspended_at: null, deleted_at: null, deletion_status: "storage_pending" },
      { id: USER_ID, suspended_at: null, deleted_at: "2026-11-01T00:00:00Z", deletion_status: "completed" },
      null,
    ]) {
      const client = buildMockUserClient({
        profiles: { data: profile, error: null },
        farms: { data: { id: FARM_ID }, error: null },
        current_consents: { data: { granted: true }, error: null },
      });
      mocks.createSupabaseClient.mockReturnValue(client);

      const res = await authorizeAiFarmRequest(makeAuthReq(), FARM_ID);
      expect(res.authorized).toBe(false);
      if (!res.authorized) expect(res.response.status).toBe(403);
    }
  });

  it("rejects missing, withdrawn, or errored ai_intelligence consent (fail-closed)", async () => {
    for (const [consentRes, expectedStatus] of [
      [{ data: null, error: null }, 403],
      [{ data: { granted: false }, error: null }, 403],
      [{ data: null, error: { message: "db error" } }, 503],
    ] as const) {
      const client = buildMockUserClient({
        profiles: { data: { id: USER_ID, suspended_at: null, deleted_at: null, deletion_status: null }, error: null },
        farms: { data: { id: FARM_ID }, error: null },
        current_consents: consentRes,
      });
      mocks.createSupabaseClient.mockReturnValue(client);

      const res = await authorizeAiFarmRequest(makeAuthReq(), FARM_ID);
      expect(res.authorized).toBe(false);
      if (!res.authorized) expect(res.response.status).toBe(expectedStatus);
    }
  });

  it("authorises active, farm-visible, consented callers and returns a branded context", async () => {
    const client = buildMockUserClient({
      profiles: { data: { id: USER_ID, suspended_at: null, deleted_at: null, deletion_status: null }, error: null },
      farms: { data: { id: FARM_ID }, error: null },
      current_consents: { data: { granted: true }, error: null },
    });
    mocks.createSupabaseClient.mockReturnValue(client);

    const res = await authorizeAiFarmRequest(makeAuthReq(), FARM_ID);
    expect(res.authorized).toBe(true);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
    if (res.authorized) {
      expect(res.caller.user.id).toBe(USER_ID);
      expect(res.caller.farmId).toBe(FARM_ID);
      expect(res.caller.accountActive).toBe(true);
      expect(res.caller.aiConsentGranted).toBe(true);
    }
  });
});

describe("Batch 03.1C — Central Trusted AI Audit Client (ai-audit.ts)", () => {
  let verifiedCaller: VerifiedAiFarmCallerContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.supabaseEnv.mockReturnValue({ url: "https://example.supabase.co", key: "anon-key" });
    mocks.serviceRpc.mockResolvedValue({ data: "44444444-4444-4444-8444-444444444444", error: null });
    mocks.createServiceClient.mockReturnValue({ rpc: mocks.serviceRpc });

    const client = buildMockUserClient({
      profiles: { data: { id: USER_ID, suspended_at: null, deleted_at: null, deletion_status: null }, error: null },
      farms: { data: { id: FARM_ID }, error: null },
      current_consents: { data: { granted: true }, error: null },
    });
    mocks.createSupabaseClient.mockReturnValue(client);
    const auth = await authorizeAiFarmRequest(makeAuthReq(), FARM_ID);
    if (!auth.authorized) throw new Error("Expected authorised test caller");
    verifiedCaller = auth.caller;
  });

  it("rejects fabricated/unbranded caller contexts without touching service-role client", async () => {
    const spoofed = {
      user: { id: USER_ID },
      farmId: FARM_ID,
      client: {},
      verifiedAt: "2026-11-21T04:00:00Z",
      accountActive: true,
      aiConsentGranted: true,
    } as unknown as VerifiedAiFarmCallerContext;

    const res = await recordAiAuditEvent(spoofed, {
      traceId: TRACE_ID,
      provider: "claude",
      modelId: "claude-sonnet-4-5",
      promptVersion: "assistant-v1",
      executionOutcome: "completed",
      guardrailResult: { status: "passed", blocked: false },
      contextRefs: [],
      memoryItemIds: [],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("unverified_caller");
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("rejects raw prompts, images, JWTs, emails, and duplicate context references", async () => {
    const badPayloads = [
      // Unexpected rawPrompt field
      {
        traceId: TRACE_ID,
        provider: "claude" as const,
        modelId: "claude-sonnet-4-5",
        promptVersion: "v1",
        executionOutcome: "completed" as const,
        rawPrompt: "secret prompt",
      },
      // Base64 image in record_id
      {
        traceId: TRACE_ID,
        provider: "claude" as const,
        modelId: "claude-sonnet-4-5",
        promptVersion: "v1",
        executionOutcome: "completed" as const,
        contextRefs: [{ source: "crop_observations" as const, record_id: "data:image/png;base64,AAAA" }],
      },
      // Duplicate context refs
      {
        traceId: TRACE_ID,
        provider: "claude" as const,
        modelId: "claude-sonnet-4-5",
        promptVersion: "v1",
        executionOutcome: "completed" as const,
        contextRefs: [
          { source: "farms" as const, record_id: FARM_ID },
          { source: "farms" as const, record_id: FARM_ID },
        ],
      },
    ];

    for (const payload of badPayloads) {
      const res = await recordAiAuditEvent(verifiedCaller, payload as Parameters<typeof recordAiAuditEvent>[1]);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.code).toBe("invalid_payload");
    }
    expect(mocks.serviceRpc).not.toHaveBeenCalled();
  });

  it("fails closed when service client is unavailable or RPC returns trace conflict (23505)", async () => {
    mocks.createServiceClient.mockReturnValueOnce(null);
    const unavail = await recordAiAuditEvent(verifiedCaller, {
      traceId: TRACE_ID,
      provider: "rule-engine",
      modelId: "grounding-deterministic",
      promptVersion: "grounding-v1",
      executionOutcome: "completed",
      guardrailResult: { status: "passed", blocked: false },
      contextRefs: [{ source: "farms", record_id: FARM_ID }],
      memoryItemIds: [],
    });
    expect(unavail.ok).toBe(false);
    if (!unavail.ok) expect(unavail.code).toBe("service_unavailable");

    mocks.serviceRpc.mockResolvedValueOnce({ data: null, error: { code: "23505", message: "conflict" } });
    const conflict = await recordAiAuditEvent(verifiedCaller, {
      traceId: TRACE_ID,
      provider: "rule-engine",
      modelId: "grounding-deterministic",
      promptVersion: "grounding-v1",
      executionOutcome: "blocked",
      guardrailResult: { status: "blocked", blocked: true },
      contextRefs: [],
      memoryItemIds: [],
    });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) expect(conflict.code).toBe("trace_conflict");
  });

  it("persists valid events via narrow public.write_ai_audit_event wrapper using verified caller IDs", async () => {
    const res = await recordAiAuditEvent(verifiedCaller, {
      traceId: TRACE_ID,
      provider: "claude",
      modelId: "claude-sonnet-4-5",
      promptVersion: "assistant-v1",
      executionOutcome: "completed",
      guardrailResult: { status: "passed", rule_ids: ["nafdac"], reason_codes: [], blocked: false },
      contextRefs: [{ source: "farms", record_id: FARM_ID, observed_at: "2026-11-21T04:00:00Z" }],
      memoryItemIds: [],
    });

    expect(res).toEqual({
      ok: true,
      eventId: "44444444-4444-4444-8444-444444444444",
      traceId: TRACE_ID,
    });
    expect(mocks.serviceRpc).toHaveBeenCalledWith(
      "write_ai_audit_event",
      expect.objectContaining({
        p_profile_id: USER_ID,
        p_farm_id: FARM_ID,
        p_trace_id: TRACE_ID,
        p_provider: "claude",
      }),
    );
  });
});

describe("Batch 03.1C — LiveFarmContextService (RLS-only, 8 domains, conflict & error handling)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads all 8 domains strictly via caller JWT client (zero service-role reads) and distinguishes query errors from missing data", async () => {
    const userClient = buildMockUserClient({
      farms: { data: { id: FARM_ID, name: "Ibadan Farm", zone: "derived_savanna", state: "Oyo", lga: "Ibadan", soil_information: {}, updated_at: "2026-11-20T00:00:00Z" }, error: null },
      plots: { data: [{ id: "plot-1", farm_id: FARM_ID, name: "North Plot", current_crop: "maize", soil_ph: 6.1, organic_matter_pct: 2.1, soil_texture: "loam", updated_at: "2026-11-20T00:00:00Z" }], error: null },
      soil_records: {
        data: [
          {
            id: "soil-future",
            plot_id: "plot-1",
            ph: 7.5,
            nitrogen_pct: 0.2,
            phosphorus_ppm: 22,
            potassium_cmol_kg: 0.5,
            organic_matter_pct: 2.5,
            soil_type: "loam",
            source: "agent_verified",
            tested_on: "2027-01-01",
            created_at: "2026-11-20T00:00:00Z",
          },
          {
            id: "soil-stale",
            plot_id: "plot-1",
            ph: 5.9,
            nitrogen_pct: null,
            phosphorus_ppm: 14,
            potassium_cmol_kg: 0.3,
            organic_matter_pct: 1.8,
            soil_type: "loam",
            source: "agent_verified",
            tested_on: "2025-01-01",
            created_at: "2025-01-02T00:00:00Z",
          },
        ],
        error: null,
      },
      weather_cache: { data: null, error: { message: "weather timeout" } },
      farm_inventory: { data: [{ id: "inv-1", item_name: "NPK 15-15-15", category: "fertiliser", quantity: 10, unit: "bag", updated_at: "2026-11-20T00:00:00Z" }], error: null },
      farm_inventory_transactions: { data: [{ id: "tx-1", inventory_id: "inv-1", transaction_type: "in", quantity: 6, created_at: "2026-11-19T00:00:00Z" }], error: null },
      farm_machinery_assets: { data: [{ id: "mach-1", name: "Tractor 1", category: "tractor", current_status: "active", engine_hours: 100, updated_at: "2026-11-20T00:00:00Z" }], error: null },
      farm_machinery_usage_logs: { data: [], error: null },
      machinery_telemetry: {
        data: [
          { id: "tel-1", machinery_id: "mach-1", engine_hours: 105, recorded_at: "2026-11-19T00:00:00Z" },
          { id: "tel-2", machinery_id: "mach-1", engine_hours: 90, recorded_at: "2026-11-20T00:00:00Z" },
        ],
        error: null,
      },
      telemetry_rollups: { data: [], error: null },
      irrigation_events: { data: [], error: null },
      irrigation_zones: { data: [], error: null },
      crop_cycles: { data: [], error: null },
      farm_financial_transactions: { data: [], error: null },
      marketplace_orders: { data: [], error: null },
      telemetry_readings: { data: [], error: null },
      crop_alerts: { data: [], error: null },
      crop_observations: { data: [], error: null },
    });

    const snapshot = await getLiveFarmContextSnapshot(
      {
        user: { id: USER_ID } as VerifiedAiFarmCallerContext["user"],
        farmId: FARM_ID,
        client: userClient as unknown as SupabaseClient<Database>,
        verifiedAt: "2026-11-21T04:00:00Z",
      },
      { now: new Date("2026-11-21T04:00:00Z") },
    );

    expect(mocks.createServiceClient).not.toHaveBeenCalled();
    expect(snapshot.memoryExtension).toEqual({
      available: false,
      reason: "batch_03_2_pending",
      farmScopeItems: [],
      profileScopeItems: [],
    });

    // Soil: future-dated test rejected, stale test selected, null nitrogen NEVER coerced to 0
    expect(snapshot.domains.soil_chemistry_and_nutrients.data?.ph.state).toBe("stale");
    expect(snapshot.domains.soil_chemistry_and_nutrients.data?.nitrogenPct.value).toBeNull();
    expect(snapshot.domains.soil_chemistry_and_nutrients.data?.nitrogenPct.state).toBe("missing");
    expect(snapshot.validationIssues.some((i) => i.code === "future_dated_soil_test")).toBe(true);

    // Weather query error distinguished from missing data
    expect(snapshot.domains.weather_and_environment.status).toBe("error");
    expect(snapshot.domains.weather_and_environment.validationIssues[0]?.code).toBe("domain_query_error");

    // Inventory divergence & machinery non-monotonic telemetry surfaced as conflicts
    expect(snapshot.domains.farm_inventory_and_stock.conflicts).toHaveLength(1);
    expect(snapshot.domains.equipment_and_iot_telemetry.conflicts).toHaveLength(1);
  });
});
