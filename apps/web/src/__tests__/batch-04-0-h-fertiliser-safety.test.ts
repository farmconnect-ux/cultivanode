import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { SUPPORTED_FERTILISER_CROP_IDS } from "@cultivanode/shared";

const mocks = vi.hoisted(() => ({
  authorizeFarmRequest: vi.fn(),
  verifyFarmPlotAccess: vi.fn(),
  requireAccount: vi.fn(),
  aiConfig: vi.fn(),
  createClient: vi.fn(),
  getLiveFarmContextSnapshot: vi.fn(),
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
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/farm-context/live-farm-context.service", () => ({
  getLiveFarmContextSnapshot: mocks.getLiveFarmContextSnapshot,
}));

import { POST as fertiliserPost } from "@/app/api/engines/agronomy/fertiliser/route";
import { askFarmAssistantAction } from "@/actions/ai-assistant";
import { resolveServerVerifiedAgronomicContext } from "@/lib/farm-context/verified-agronomic-context.service";

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
    mocks.requireAccount.mockResolvedValue({
      userId: "user-1",
      role: "farmer",
      profile: { suspended_at: null },
    });
    mocks.createClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: FARM_OWNED }, error: null }),
          }),
        }),
      }),
    });
    mocks.getLiveFarmContextSnapshot.mockResolvedValue({
      farmId: FARM_OWNED,
      farmZone: "derived_savanna",
      farmQueryStatus: "ok",
      retrievedAt: new Date().toISOString(),
      domains: {
        crop_identity_variety_and_stage: {
          status: "ok",
          data: {
            activeCycles: [
              {
                cycleId: "cycle-1",
                plotId: PLOT_OWNED,
                cropId: "maize",
                currentStage: "vegetative",
                state: "verified_current",
              },
            ],
          },
        },
      },
      auditContextRefs: [],
    });
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

  it("Revision 5: askFarmAssistantAction enforces active account, RLS farm ownership, and blocks client zone/stage overrides", async () => {
    // 1. Suspended account -> rejected
    mocks.requireAccount.mockResolvedValueOnce({
      userId: "user-1",
      profile: { suspended_at: "2026-11-01T00:00:00Z" },
    });
    await expect(
      askFarmAssistantAction({ query: "Advise on maize", language: "en" }),
    ).rejects.toThrow("Account is not active");

    // 2. Unauthorised cross-tenant farmId -> rejected
    mocks.createClient.mockResolvedValueOnce({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
    await expect(
      askFarmAssistantAction({
        query: "Advise on maize",
        context: { cropId: "maize", farmId: FARM_OTHER },
        language: "en",
      }),
    ).rejects.toThrow("Farm not found or access denied");

    // 3. Client attempts to override verified growth stage ("vegetative") with "flowering" -> rejected
    await expect(
      askFarmAssistantAction({
        query: "Advise on maize",
        context: { cropId: "maize", farmId: FARM_OWNED, stageName: "flowering" },
        language: "en",
      }),
    ).rejects.toThrow("GROWTH_STAGE_MISMATCH");

    // 4. Client attempts to override verified farm zone ("derived_savanna") with "rainforest" -> rejected
    await expect(
      askFarmAssistantAction({
        query: "Advise on maize",
        context: { cropId: "maize", farmId: FARM_OWNED, zone: "rainforest" },
        language: "en",
      }),
    ).rejects.toThrow("ZONE_MISMATCH");

    // 5. Client supplies valid zone & stage WITHOUT farmId -> never elevated to verified context; LLM rates blocked
    let capturedBody = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: unknown, init?: RequestInit) => {
        capturedBody = String(init?.body ?? "");
        return new Response(
          JSON.stringify({ content: [{ type: "text", text: "Apply 200 kg/ha NPK." }] }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );
    const noFarmRes = await askFarmAssistantAction({
      query: "How much NPK for maize?",
      context: { cropId: "maize", zone: "derived_savanna", stageName: "basal" },
      language: "en",
    });
    expect(capturedBody).toContain("- Zone: unverified (not provided)");
    expect(capturedBody).not.toContain("- Zone: derived_savanna");
    expect(capturedBody).not.toContain("- Current Stage: basal");
    expect(noFarmRes.numericGuardrailBlocked).toBe(true);
    expect(noFarmRes.answer).not.toContain("200 kg/ha");
  });

  it("Revision 6: resolveServerVerifiedAgronomicContext fails closed on unverified farms.zone and ambiguous active crop cycles", async () => {
    const caller = {
      user: { id: "user-1" } as never,
      farmId: FARM_OWNED,
      client: fakeRlsClient as never,
      verifiedAt: new Date().toISOString(),
    };

    // 1. Stored farms.zone alone does NOT mint a verifiedContext (fails closed with geographic_zone_unverified)
    const unverifiedGeoRes = await resolveServerVerifiedAgronomicContext({
      caller,
      snapshot: {
        farmId: FARM_OWNED,
        farmZone: "derived_savanna",
        farmQueryStatus: "ok",
        retrievedAt: new Date().toISOString(),
        domains: {
          crop_identity_variety_and_stage: {
            status: "ok",
            data: {
              activeCycles: [
                {
                  cycleId: "cycle-1",
                  plotId: PLOT_OWNED,
                  cropId: "maize",
                  status: "maintenance",
                  currentStage: "vegetative",
                  state: "verified_current",
                },
              ],
            },
          },
        },
        auditContextRefs: [],
      } as never,
    });
    expect(unverifiedGeoRes.conflict).toBe(false);
    if (!unverifiedGeoRes.conflict) {
      expect(unverifiedGeoRes.verifiedContext).toBeNull();
      expect(unverifiedGeoRes.unavailableReasonCode).toBe("geographic_zone_unverified");
    }

    // 2. Multiple active crop cycles on different plots with omitted plotId -> crop_cycle_ambiguous (never .find()[0])
    const ambiguousRes = await resolveServerVerifiedAgronomicContext({
      caller,
      snapshot: {
        farmId: FARM_OWNED,
        farmZone: "derived_savanna",
        farmQueryStatus: "ok",
        retrievedAt: new Date().toISOString(),
        domains: {
          crop_identity_variety_and_stage: {
            status: "ok",
            data: {
              activeCycles: [
                {
                  cycleId: "cycle-1",
                  plotId: PLOT_OWNED,
                  cropId: "maize",
                  status: "maintenance",
                  currentStage: "vegetative",
                  state: "verified_current",
                },
                {
                  cycleId: "cycle-2",
                  plotId: PLOT_OTHER,
                  cropId: "cassava",
                  status: "planting",
                  currentStage: "basal",
                  state: "verified_current",
                },
              ],
            },
          },
        },
        auditContextRefs: [],
      } as never,
    });
    expect(ambiguousRes.conflict).toBe(false);
    if (!ambiguousRes.conflict) {
      expect(ambiguousRes.verifiedContext).toBeNull();
      expect(ambiguousRes.verifiedCropId).toBeUndefined();
      expect(ambiguousRes.verifiedGrowthStage).toBeUndefined();
      expect(ambiguousRes.unavailableReasonCode).toBe("crop_cycle_ambiguous");
      expect(ambiguousRes.ambiguousCycleCount).toBe(2);
    }
  });

  it("Revision 7: requires explicit cycle selection and resolves the exact matching active crop cycle", async () => {
    const caller = {
      user: { id: "user-1" } as never,
      farmId: FARM_OWNED,
      client: fakeRlsClient as never,
      verifiedAt: new Date().toISOString(),
    };
    const makeSnapshot = (cycles: Array<Record<string, unknown>>) => ({
      farmId: FARM_OWNED,
      farmZone: "derived_savanna",
      farmQueryStatus: "ok",
      retrievedAt: new Date().toISOString(),
      domains: {
        crop_identity_variety_and_stage: {
          status: "ok",
          data: { activeCycles: cycles },
        },
      },
      auditContextRefs: [],
    } as never);
    const cycles = [
      {
        cycleId: "cycle-1",
        plotId: PLOT_OWNED,
        cropId: "maize",
        status: "maintenance",
        currentStage: "vegetative",
        state: "unverified_provisional",
      },
      {
        cycleId: "cycle-2",
        plotId: PLOT_OWNED,
        cropId: "maize",
        status: "planting",
        currentStage: "basal",
        state: "unverified_provisional",
      },
    ];

    const missingCycle = await resolveServerVerifiedAgronomicContext({
      caller,
      snapshot: makeSnapshot(cycles),
      assertions: { plotId: PLOT_OWNED, cropId: "maize" },
    });
    expect(missingCycle.conflict).toBe(false);
    if (!missingCycle.conflict) {
      expect(missingCycle.verifiedContext).toBeNull();
      expect(missingCycle.unavailableReasonCode).toBe("crop_cycle_ambiguous");
      expect(missingCycle.ambiguousCycleCount).toBe(2);
    }

    const explicitCycle = await resolveServerVerifiedAgronomicContext({
      caller,
      snapshot: makeSnapshot(cycles),
      assertions: { plotId: PLOT_OWNED, cropId: "maize", cycleId: "cycle-2" },
    });
    expect(explicitCycle.conflict).toBe(false);
    if (!explicitCycle.conflict) {
      expect(explicitCycle.verifiedContext).toBeNull();
      expect(explicitCycle.verifiedGrowthStage).toBe("basal");
      expect(explicitCycle.ambiguousCycleCount).toBeUndefined();
      // Geographic verification remains unavailable, so the exact cycle still cannot authorise a prescription.
      expect(explicitCycle.unavailableReasonCode).toBe("geographic_zone_unverified");
    }

    const mismatchedCycle = await resolveServerVerifiedAgronomicContext({
      caller,
      snapshot: makeSnapshot(cycles),
      assertions: { plotId: PLOT_OWNED, cropId: "maize", cycleId: "99999999-9999-4999-8999-999999999999" },
    });
    expect(mismatchedCycle.conflict).toBe(false);
    if (!mismatchedCycle.conflict) {
      expect(mismatchedCycle.verifiedContext).toBeNull();
      expect(mismatchedCycle.verifiedGrowthStage).toBeUndefined();
      expect(mismatchedCycle.unavailableReasonCode).toBe("crop_cycle_missing");
    }

    const missingPlot = await resolveServerVerifiedAgronomicContext({
      caller,
      snapshot: makeSnapshot(cycles),
      assertions: { cropId: "maize", cycleId: "cycle-2" },
    });
    expect(missingPlot.conflict).toBe(false);
    if (!missingPlot.conflict) {
      expect(missingPlot.verifiedContext).toBeNull();
      expect(missingPlot.unavailableReasonCode).toBe("crop_cycle_selection_required");
    }
  });
});