import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  authorizeAiFarmRequest: vi.fn(),
  verifyActiveAccount: vi.fn(),
  verifyAiIntelligenceConsent: vi.fn(),
  getLiveFarmContextSnapshot: vi.fn(),
  askGroundedAiAssistant: vi.fn(),
  recordAiAuditEvent: vi.fn(),
  createServerClient: vi.fn(),
  createSupabaseJs: vi.fn(),
  supabaseEnv: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@cultivanode/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@cultivanode/shared")>();
  return {
    ...actual,
    askGroundedAiAssistant: mocks.askGroundedAiAssistant,
  };
});
vi.mock("@/lib/engines-api-helper", () => ({
  authorizeAiFarmRequest: mocks.authorizeAiFarmRequest,
  verifyActiveAccount: mocks.verifyActiveAccount,
  verifyAiIntelligenceConsent: mocks.verifyAiIntelligenceConsent,
}));
vi.mock("@/lib/farm-context/live-farm-context.service", () => ({
  getLiveFarmContextSnapshot: mocks.getLiveFarmContextSnapshot,
}));
vi.mock("@/lib/ai-audit", () => ({
  recordAiAuditEvent: mocks.recordAiAuditEvent,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createServerClient,
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createSupabaseJs,
}));
vi.mock("@/lib/supabase/env", () => ({
  supabaseEnv: mocks.supabaseEnv,
}));

import { POST } from "@/app/api/ai/assistant/route";

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const TRACE_ID = "33333333-3333-4333-8333-333333333333";
const RETRY_TRACE_ID = "44444444-4444-4444-8444-444444444444";

function makeReq(body: unknown, authHeader = "Bearer valid-jwt") {
  return new Request("http://localhost/api/ai/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("Finding 09: /api/ai/assistant Explicit Audit Coverage Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.supabaseEnv.mockReturnValue({ url: "https://example.supabase.co", key: "anon-key" });
    mocks.createSupabaseJs.mockReturnValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } } })) },
    });
    mocks.createServerClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    });
    mocks.verifyActiveAccount.mockResolvedValue({ ok: true });
    mocks.verifyAiIntelligenceConsent.mockResolvedValue({ ok: true });
    mocks.authorizeAiFarmRequest.mockResolvedValue({
      authorized: true,
      caller: {
        user: { id: USER_ID },
        farmId: FARM_ID,
        client: {},
        verifiedAt: "2026-11-21T04:00:00Z",
        accountActive: true,
        aiConsentGranted: true,
      },
    });
    mocks.getLiveFarmContextSnapshot.mockResolvedValue({
      farmId: FARM_ID,
      farmZone: "derived_savanna",
      domains: { crop_identity_variety_and_stage: { data: { activeCycles: [{ cropId: "maize", currentStage: "vegetative" }] } } },
      auditContextRefs: [{ source: "farms", record_id: FARM_ID, observed_at: "2026-11-21T04:00:00Z" }],
    });
    mocks.askGroundedAiAssistant.mockResolvedValue({
      answer: "Irrigate early morning.",
      providerUsed: "claude",
      modelUsed: "claude-sonnet-4-5",
      passedSafetyGuardrail: true,
      providerErrors: [],
    });
    mocks.recordAiAuditEvent.mockResolvedValue({
      ok: true,
      eventId: "55555555-5555-4555-8555-555555555555",
      traceId: TRACE_ID,
    });
  });

  it("executes and persists audit record for valid farm-specific request with consent", async () => {
    const res = await POST(makeReq({ traceId: TRACE_ID, query: "When to irrigate?", context: { farmId: FARM_ID } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.traceId).toBe(TRACE_ID);
    expect(json.auditStatus).toBe("persisted");
    expect(mocks.recordAiAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ farmId: FARM_ID }),
      expect.objectContaining({ traceId: TRACE_ID, executionOutcome: "completed" }),
    );
  });

  it("rejects farm-specific request without consent (403) without invoking AI provider", async () => {
    mocks.authorizeAiFarmRequest.mockResolvedValueOnce({
      authorized: false,
      response: NextResponse.json({ error: "AI consent required.", code: "AI_CONSENT_REQUIRED" }, { status: 403 }),
    });
    const res = await POST(makeReq({ query: "Advise on maize", context: { farmId: FARM_ID } }));
    expect(res.status).toBe(403);
    expect(mocks.askGroundedAiAssistant).not.toHaveBeenCalled();
  });

  it("fails closed (422) on farm-independent / missing-farmId requests so no unaudited AI execution occurs", async () => {
    const res = await POST(makeReq({ query: "General crop question" }));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.code).toBe("FARM_CONTEXT_REQUIRED_FOR_AUDIT");
    expect(json.auditPolicy).toBe("fail_closed_farm_audit_required");
    expect(mocks.askGroundedAiAssistant).not.toHaveBeenCalled();
    expect(mocks.recordAiAuditEvent).not.toHaveBeenCalled();
  });

  it("rejects invalid farmId (400) and malformed traceId (400)", async () => {
    const badFarm = await POST(makeReq({ query: "Hello", context: { farmId: "not-a-uuid" } }));
    expect(badFarm.status).toBe(400);

    const badTrace = await POST(makeReq({ traceId: "malformed-trace", query: "Hello", context: { farmId: FARM_ID } }));
    expect(badTrace.status).toBe(400);
    expect(mocks.askGroundedAiAssistant).not.toHaveBeenCalled();
  });

  it("rejects cross-farm request (403) before AI execution", async () => {
    mocks.authorizeAiFarmRequest.mockResolvedValueOnce({
      authorized: false,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    });
    const res = await POST(makeReq({ query: "Hello", context: { farmId: FARM_ID } }));
    expect(res.status).toBe(403);
    expect(mocks.askGroundedAiAssistant).not.toHaveBeenCalled();
  });

  it("records failed executionOutcome on model provider failure and allows retry with a fresh traceId", async () => {
    mocks.askGroundedAiAssistant.mockRejectedValueOnce(new Error("Upstream provider 503"));
    const failedRes = await POST(makeReq({ traceId: TRACE_ID, query: "Advise", context: { farmId: FARM_ID } }));
    expect(failedRes.status).toBe(502);
    const failedJson = await failedRes.json();
    expect(failedJson.traceId).toBe(TRACE_ID);
    expect(failedJson.auditStatus).toBe("persisted_failed_outcome");
    expect(mocks.recordAiAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ traceId: TRACE_ID, executionOutcome: "failed" }),
    );

    // Retry with new traceId succeeds
    mocks.recordAiAuditEvent.mockResolvedValueOnce({ ok: true, eventId: "66666666-6666-4666-8666-666666666666", traceId: RETRY_TRACE_ID });
    const retryRes = await POST(makeReq({ traceId: RETRY_TRACE_ID, query: "Advise", context: { farmId: FARM_ID } }));
    expect(retryRes.status).toBe(200);
    expect((await retryRes.json()).traceId).toBe(RETRY_TRACE_ID);
  });

  it("fails closed with 503 on audit writer failure and 409 on duplicate traceId conflict", async () => {
    mocks.recordAiAuditEvent.mockResolvedValueOnce({
      ok: false,
      code: "persistence_failed",
      error: "Unable to persist AI audit event.",
    });
    const auditErr = await POST(makeReq({ traceId: TRACE_ID, query: "Advise", context: { farmId: FARM_ID } }));
    expect(auditErr.status).toBe(503);

    mocks.recordAiAuditEvent.mockResolvedValueOnce({
      ok: false,
      code: "trace_conflict",
      error: "Audit trace identifier conflict.",
    });
    const conflict = await POST(makeReq({ traceId: TRACE_ID, query: "Advise", context: { farmId: FARM_ID } }));
    expect(conflict.status).toBe(409);
  });

  it("records blocked outcome when safety guardrail rejects response", async () => {
    mocks.askGroundedAiAssistant.mockResolvedValueOnce({
      answer: "Blocked chemical response.",
      providerUsed: "claude",
      modelUsed: "claude-sonnet-4-5",
      passedSafetyGuardrail: false,
      providerErrors: [],
    });
    const res = await POST(makeReq({ traceId: TRACE_ID, query: "Use paraquat", context: { farmId: FARM_ID } }));
    expect(res.status).toBe(200);
    expect(mocks.recordAiAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ executionOutcome: "blocked" }),
    );
  });

  it("records fertiliser_numeric_guardrail and unsupported_numerical_prescription when numeric guardrail blocks response", async () => {
    mocks.askGroundedAiAssistant.mockResolvedValueOnce({
      answer: "No approved CultivaNode fertiliser protocol is available for lettuce.",
      providerUsed: "claude",
      modelUsed: "claude-sonnet-4-5",
      passedSafetyGuardrail: false,
      bannedChemicalsDetected: [],
      providerErrors: [],
      recommendationStatus: "unsupported_crop",
      numericGuardrailBlocked: true,
      numericGuardrailReasonCode: "unsupported_numerical_prescription",
    });
    const res = await POST(makeReq({ traceId: TRACE_ID, query: "How much NPK for lettuce?", context: { farmId: FARM_ID } }));
    expect(res.status).toBe(200);
    expect(mocks.recordAiAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        executionOutcome: "blocked",
        guardrailResult: expect.objectContaining({
          status: "blocked",
          blocked: true,
          rule_ids: expect.arrayContaining(["fertiliser_numeric_guardrail"]),
          reason_codes: expect.arrayContaining(["unsupported_numerical_prescription"]),
        }),
      }),
    );
  });

  it("rejects client-supplied invalid zone (400) and mismatched zone (422) to prevent farm-context spoofing", async () => {
    const invalidZoneRes = await POST(
      makeReq({
        traceId: TRACE_ID,
        query: "Advise on maize",
        context: { farmId: FARM_ID, zone: "arctic_tundra" },
      }),
    );
    expect(invalidZoneRes.status).toBe(400);
    expect((await invalidZoneRes.json()).code).toBe("INVALID_AGRO_ZONE");
    expect(mocks.askGroundedAiAssistant).not.toHaveBeenCalled();

    // Snapshot farmZone is "derived_savanna"; client attempts to spoof "rainforest"
    const mismatchRes = await POST(
      makeReq({
        traceId: TRACE_ID,
        query: "Advise on maize",
        context: { farmId: FARM_ID, zone: "rainforest" },
      }),
    );
    expect(mismatchRes.status).toBe(422);
    expect((await mismatchRes.json()).code).toBe("ZONE_MISMATCH");
    expect(mocks.askGroundedAiAssistant).not.toHaveBeenCalled();

    // Revision 5: Client attempts to override verified active crop-cycle stage ("vegetative") with "flowering" -> 422
    const stageOverrideRes = await POST(
      makeReq({
        traceId: TRACE_ID,
        query: "Advise on maize",
        context: { farmId: FARM_ID, stageName: "flowering" },
      }),
    );
    expect(stageOverrideRes.status).toBe(422);
    expect((await stageOverrideRes.json()).code).toBe("GROWTH_STAGE_MISMATCH");
    expect(mocks.askGroundedAiAssistant).not.toHaveBeenCalled();

    // Revision 5: Client supplies invalid growth stage -> 400
    const badStageRes = await POST(
      makeReq({
        traceId: TRACE_ID,
        query: "Advise on maize",
        context: { farmId: FARM_ID, stageName: "invalid_stage_999" },
      }),
    );
    expect(badStageRes.status).toBe(400);
    expect((await badStageRes.json()).code).toBe("INVALID_GROWTH_STAGE");
    expect(mocks.askGroundedAiAssistant).not.toHaveBeenCalled();

    // Revision 5: Client supplies stage when NO active crop cycle exists -> 422
    mocks.getLiveFarmContextSnapshot.mockResolvedValueOnce({
      farmId: FARM_ID,
      farmZone: "derived_savanna",
      farmQueryStatus: "ok",
      retrievedAt: new Date().toISOString(),
      domains: { crop_identity_variety_and_stage: { status: "empty", data: { activeCycles: [] } } },
      auditContextRefs: [{ source: "farms", record_id: FARM_ID, observed_at: "2026-11-21T04:00:00Z" }],
    });
    const noCycleStageRes = await POST(
      makeReq({
        traceId: TRACE_ID,
        query: "Advise on maize",
        context: { farmId: FARM_ID, stageName: "vegetative" },
      }),
    );
    expect(noCycleStageRes.status).toBe(422);
    expect((await noCycleStageRes.json()).code).toBe("GROWTH_STAGE_MISMATCH");
    expect(mocks.askGroundedAiAssistant).not.toHaveBeenCalled();
  });
});
