import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  authorizeAiFarmRequest: vi.fn(),
  parseJsonBody: vi.fn(),
  buildGroundedPrompt: vi.fn(),
  getLiveFarmContextSnapshot: vi.fn(),
  recordAiAuditEvent: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/engines-api-helper", () => ({
  authorizeAiFarmRequest: mocks.authorizeAiFarmRequest,
  parseJsonBody: mocks.parseJsonBody,
}));
vi.mock("@/lib/farm-context/live-farm-context.service", () => ({
  getLiveFarmContextSnapshot: mocks.getLiveFarmContextSnapshot,
}));
vi.mock("@/lib/ai-audit", () => ({
  recordAiAuditEvent: mocks.recordAiAuditEvent,
}));
vi.mock("@cultivanode/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@cultivanode/shared")>();
  return {
    ...actual,
    buildGroundedPrompt: mocks.buildGroundedPrompt,
  };
});

import { POST } from "@/app/api/engines/ai/ground/route";

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const VERIFIED_USER_ID = "verified-user-123";

describe("grounding endpoint farm identity binding, live context and audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorizeAiFarmRequest.mockResolvedValue({
      authorized: true,
      caller: {
        user: { id: VERIFIED_USER_ID },
        farmId: FARM_ID,
        client: {},
        verifiedAt: "2026-11-21T04:00:00Z",
        accountActive: true,
        aiConsentGranted: true,
      },
    });
    mocks.getLiveFarmContextSnapshot.mockResolvedValue({
      farmId: FARM_ID,
      farmName: "Demo Farm",
      farmZone: "rainforest",
      farmState: "Oyo",
      farmLga: "Ibadan",
      retrievedAt: "2026-11-21T04:00:00Z",
      scope: "farm",
      domains: {
        crop_identity_variety_and_stage: {
          domain: "crop_identity_variety_and_stage",
          status: "ok",
          data: { activeCycles: [], fallbackPlotCrops: [] },
          sourceRefs: [],
          conflicts: [],
          missingFields: [],
          validationIssues: [],
        },
      },
      auditContextRefs: [{ source: "farms", record_id: FARM_ID, observed_at: "2026-11-21T04:00:00Z" }],
      conflicts: [],
      missingInformation: [],
      validationIssues: [],
      memoryExtension: { available: false, reason: "batch_03_2_pending", farmScopeItems: [], profileScopeItems: [] },
    });
    mocks.recordAiAuditEvent.mockResolvedValue({
      ok: true,
      eventId: "33333333-3333-4333-8333-333333333333",
      traceId: "44444444-4444-4444-8444-444444444444",
    });
    mocks.parseJsonBody.mockImplementation(async (req: Request, schema: z.ZodType) => {
      const parsed = schema.safeParse(await req.json());
      if (!parsed.success) {
        return { ok: false, response: NextResponse.json({ error: "Invalid request" }, { status: 400 }) };
      }
      return { ok: true, data: parsed.data };
    });
    mocks.buildGroundedPrompt.mockImplementation((_query: string, context: { farmerId: string }) => ({
      farmerId: context.farmerId,
    }));
  });

  it("uses the verified Supabase user identity, never a client-supplied farmerId, and records audit", async () => {
    const req = new Request("https://cultivanode.test/api/engines/ai/ground", {
      method: "POST",
      headers: { Authorization: "Bearer valid-user-jwt", "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "How should I manage maize?",
        context: {
          farmId: FARM_ID,
          farmerId: "attacker-controlled-user",
          cropId: "maize",
          zone: "rainforest",
        },
        language: "en",
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(mocks.authorizeAiFarmRequest).toHaveBeenCalledWith(req, FARM_ID);
    expect(mocks.buildGroundedPrompt).toHaveBeenCalledWith(
      "How should I manage maize?",
      expect.objectContaining({ farmerId: VERIFIED_USER_ID, cropId: "maize" }),
      "en",
      expect.objectContaining({ farmId: FARM_ID, untrustedContentSanitized: true }),
    );
    expect(mocks.recordAiAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ farmId: FARM_ID, accountActive: true, aiConsentGranted: true }),
      expect.objectContaining({
        provider: "rule-engine",
        executionOutcome: "completed",
        contextRefs: [{ source: "farms", record_id: FARM_ID, observed_at: "2026-11-21T04:00:00Z" }],
      }),
    );
    const body = await response.json();
    expect(body.farmerId).toBe(VERIFIED_USER_ID);
    expect(body.farmContext.farmId).toBe(FARM_ID);
  });

  it("fails closed with 503 when AI audit persistence fails", async () => {
    mocks.recordAiAuditEvent.mockResolvedValueOnce({
      ok: false,
      code: "service_unavailable",
      error: "AI audit service is temporarily unavailable.",
    });

    const req = new Request("https://cultivanode.test/api/engines/ai/ground", {
      method: "POST",
      headers: { Authorization: "Bearer valid-user-jwt", "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "How should I manage maize?",
        context: { farmId: FARM_ID },
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(503);
  });
});
