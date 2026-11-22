import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { SUPPORTED_FERTILISER_CROP_IDS } from "@cultivanode/shared";

const mocks = vi.hoisted(() => ({
  authorizeFarmRequest: vi.fn(),
  verifyFarmPlotAccess: vi.fn(),
  requireAccount: vi.fn(),
  aiConfig: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/engines-api-helper", async () => {
  const actual = await vi.importActual<typeof import("@/lib/engines-api-helper")>("@/lib/engines-api-helper");
  return {
    ...actual,
    authorizeFarmRequest: mocks.authorizeFarmRequest,
    verifyFarmPlotAccess: mocks.verifyFarmPlotAccess,
  };
});
vi.mock("@/lib/account/session", () => ({
  requireAccount: mocks.requireAccount,
}));
vi.mock("@/lib/ai-config", () => ({
  aiConfig: mocks.aiConfig,
}));

import { POST as fertiliserPost } from "@/app/api/engines/agronomy/fertiliser/route";
import { askFarmAssistantAction } from "@/actions/ai-assistant";

const FARM_OWNED = "11111111-1111-4111-8111-111111111111";
const FARM_OTHER = "22222222-2222-4222-8222-222222222222";
const PLOT_OWNED = "33333333-3333-4333-8333-333333333333";
const PLOT_OTHER = "44444444-4444-4444-8444-444444444444";

const fakeRlsClient = { __isCallerRlsClient: true };

function makeReq(body: unknown, authHeader: string | null = "Bearer valid-user-jwt") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (authHeader) headers.Authorization = authHeader;
  return new Request("http://localhost/api/engines/agronomy/fertiliser", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const VALID_LAB_SOIL = {
  pH: 6.2,
  phosphorus: { value: 12, unit: "ppm", basis: "elemental_P" },
  potassium: { value: 0.25, unit: "cmol_kg", basis: "elemental_K" },
  organicMatterPercent: 1.8,
  provenance: "lab_confirmed",
  extractionMethod: "bray_1",
  samplingDepthCm: 15,
  testDate: "2026-10-01",
  farmId: FARM_OWNED,
};

describe("Batch 04.0-H Revision 4 — Farm/Plot Ownership & Fertiliser API Safety Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorizeFarmRequest.mockResolvedValue({
      authorized: true,
      user: { id: "user-1" },
      farmId: FARM_OWNED,
      client: fakeRlsClient,
      verifiedAt: "2026-11-22T22:00:00Z",
    });
    mocks.verifyFarmPlotAccess.mockResolvedValue({
      ok: true,
      plotId: PLOT_OWNED,
      farmId: FARM_OWNED,
    });
    mocks.requireAccount.mockResolvedValue({ userId: "user-1", role: "farmer" });
    mocks.aiConfig.mockReturnValue({
      anthropicApiKey: "test-key",
      claudeModels: ["claude-sonnet-5-5"],
      geminiApiKey: "",
      openaiApiKey: "",
      primaryModel: "",
      fallbackModel: "",
      timeoutMs: 5000,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("enforces caller-scoped farm ownership, active account, and plot-to-farm ownership without service-role bypass", async () => {
    // 1. Missing Bearer token -> 401 before touching DB
    const unauth = await fertiliserPost(
      makeReq(
        {
          cropId: "maize",
          targetYieldTonnesPerHa: 5,
          farmAreaHectares: 1,
          farmId: FARM_OWNED,
          zone: "derived_savanna",
          growthStage: "basal",
          soil: VALID_LAB_SOIL,
        },
        null,
      ),
    );
    expect(unauth.status).toBe(401);
    expect(mocks.authorizeFarmRequest).not.toHaveBeenCalled();

    // 2. Inactive account -> 403 rejected by authorizeFarmRequest
    mocks.authorizeFarmRequest.mockResolvedValueOnce({
      authorized: false,
      response: NextResponse.json({ error: "Account is not active." }, { status: 403 }),
    });
    const inactive = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: FARM_OWNED,
        zone: "derived_savanna",
        growthStage: "basal",
        soil: VALID_LAB_SOIL,
      }),
    );
    expect(inactive.status).toBe(403);

    // 3. Cross-tenant attack: caller submits matching farmId & soil.farmId for ANOTHER user's farm -> 404
    mocks.authorizeFarmRequest.mockResolvedValueOnce({
      authorized: false,
      response: NextResponse.json({ error: "Farm not found or access denied." }, { status: 404 }),
    });
    const crossTenant = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: FARM_OTHER,
        zone: "derived_savanna",
        growthStage: "basal",
        soil: { ...VALID_LAB_SOIL, farmId: FARM_OTHER },
      }),
    );
    expect(crossTenant.status).toBe(404);
    expect(mocks.authorizeFarmRequest).toHaveBeenCalledWith(expect.any(Request), FARM_OTHER, {
      requireActiveAccount: true,
    });

    // 4. Cross-farm plot attack: caller owns FARM_OWNED but submits PLOT_OTHER belonging to another farm -> 404
    mocks.verifyFarmPlotAccess.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: "Plot not found or access denied." }, { status: 404 }),
    });
    const crossPlot = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: FARM_OWNED,
        plotId: PLOT_OTHER,
        zone: "derived_savanna",
        growthStage: "basal",
        soil: { ...VALID_LAB_SOIL, plotId: PLOT_OTHER },
      }),
    );
    expect(crossPlot.status).toBe(404);
    expect(mocks.verifyFarmPlotAccess).toHaveBeenCalledWith(fakeRlsClient, FARM_OWNED, PLOT_OTHER);

    // 5. Missing soil.plotId when plotId is supplied -> 422 fail closed
    const missingSoilPlot = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: FARM_OWNED,
        plotId: PLOT_OWNED,
        zone: "derived_savanna",
        growthStage: "basal",
        soil: VALID_LAB_SOIL, // no plotId
      }),
    );
    expect(missingSoilPlot.status).toBe(422);
    expect((await missingSoilPlot.json()).reasonCode).toBe("soil_plot_association_missing");
  });

  it("authorised farm + plot reaches engine via caller RLS and fails closed (422) for ALL FIVE built-in provisional crops", async () => {
    for (const cropId of SUPPORTED_FERTILISER_CROP_IDS) {
      const res = await fertiliserPost(
        makeReq({
          cropId,
          targetYieldTonnesPerHa: 5,
          farmAreaHectares: 1,
          farmId: FARM_OWNED,
          plotId: PLOT_OWNED,
          zone: "derived_savanna",
          growthStage: "basal",
          soil: { ...VALID_LAB_SOIL, plotId: PLOT_OWNED },
        }),
      );
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.status).toBe("insufficient_evidence");
      expect(json.reasonCode).toBe("protocol_provisional_not_approved");
    }
    expect(mocks.authorizeFarmRequest).toHaveBeenCalledWith(expect.any(Request), FARM_OWNED, {
      requireActiveAccount: true,
    });
    expect(mocks.verifyFarmPlotAccess).toHaveBeenCalledWith(fakeRlsClient, FARM_OWNED, PLOT_OWNED);
  });

  it("rejects provenance bypasses, caller protocol overrides, caller-supplied verifiedLabReport, and unsupported crops", async () => {
    const missingRes = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        soil: { pH: 6.2, phosphorusPpm: 12, potassiumPpm: 120, organicMatterPercent: 1.8 },
      }),
    );
    expect(missingRes.status).toBe(400);

    const bypassRes = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: FARM_OWNED,
        zone: "derived_savanna",
        growthStage: "basal",
        requireStrictSoilProvenance: false,
        soil: VALID_LAB_SOIL,
      }),
    );
    expect(bypassRes.status).toBe(400);

    const overrideRes = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: FARM_OWNED,
        zone: "derived_savanna",
        growthStage: "basal",
        protocolOverride: { approvalStatus: "agronomist_approved" },
        soil: VALID_LAB_SOIL,
      }),
    );
    expect(overrideRes.status).toBe(400);

    const forgedLabRes = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: FARM_OWNED,
        zone: "derived_savanna",
        growthStage: "basal",
        soil: { ...VALID_LAB_SOIL, verifiedLabReport: { verificationStatus: "verified" } },
      }),
    );
    expect(forgedLabRes.status).toBe(400);

    const lettuceRes = await fertiliserPost(
      makeReq({
        cropId: "lettuce",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: FARM_OWNED,
        zone: "derived_savanna",
        growthStage: "vegetative",
        soil: VALID_LAB_SOIL,
      }),
    );
    expect(lettuceRes.status).toBe(400);
  });

  it("askFarmAssistantAction preserves missing zone (never defaults to derived_savanna), rejects invalid zone, and blocks LLM rates", async () => {
    let capturedPromptBody = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: unknown, init?: RequestInit) => {
        capturedPromptBody = String(init?.body ?? "");
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: "Apply 200 kg/ha right after rain." }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );

    const missingCtxRes = await askFarmAssistantAction({
      query: "How much should I apply?",
      language: "en",
    });
    expect(capturedPromptBody).not.toContain("derived_savanna");
    expect(capturedPromptBody).toContain("unverified (not provided)");
    expect(missingCtxRes.passedSafetyGuardrail).toBe(false);
    expect(missingCtxRes.numericGuardrailBlocked).toBe(true);
    expect(missingCtxRes.answer).not.toContain("200 kg/ha");

    await expect(
      askFarmAssistantAction({
        query: "Advise on maize",
        context: { cropId: "maize", zone: "fabricated_zone" as never },
        language: "en",
      }),
    ).rejects.toThrow("Invalid agro-ecological zone");
  });
});
