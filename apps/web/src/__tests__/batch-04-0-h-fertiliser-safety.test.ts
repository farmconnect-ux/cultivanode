import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUPPORTED_FERTILISER_CROP_IDS } from "@cultivanode/shared";

const mocks = vi.hoisted(() => ({
  authorizeRequest: vi.fn(),
  requireAccount: vi.fn(),
  aiConfig: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/engines-api-helper", async () => {
  const actual = await vi.importActual<typeof import("@/lib/engines-api-helper")>("@/lib/engines-api-helper");
  return {
    ...actual,
    authorizeRequest: mocks.authorizeRequest,
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

function makeReq(body: unknown) {
  return new Request("http://localhost/api/engines/agronomy/fertiliser", {
    method: "POST",
    headers: { "content-type": "application/json" },
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
  farmId: "farm-123",
};

describe("Batch 04.0-H Revision 2 — Server Action & Fertiliser API Safety Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorizeRequest.mockResolvedValue({ authorized: true, userId: "user-1" });
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

  it("fails closed (422 protocol_provisional_not_approved) for ALL FIVE built-in provisional crops on /api/engines/agronomy/fertiliser", async () => {
    for (const cropId of SUPPORTED_FERTILISER_CROP_IDS) {
      const res = await fertiliserPost(
        makeReq({
          cropId,
          targetYieldTonnesPerHa: 5,
          farmAreaHectares: 1,
          farmId: "farm-123",
          zone: "derived_savanna",
          growthStage: "basal",
          soil: VALID_LAB_SOIL,
        }),
      );
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.status).toBe("insufficient_evidence");
      expect(json.reasonCode).toBe("protocol_provisional_not_approved");
    }
  });

  it("rejects provenance bypasses, caller protocol overrides, missing farm/plot soil association, and unsupported crops", async () => {
    // Omission of provenance/method/depth/date/zone/stage/farmId -> 400
    const missingRes = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        soil: { pH: 6.2, phosphorusPpm: 12, potassiumPpm: 120, organicMatterPercent: 1.8 },
      }),
    );
    expect(missingRes.status).toBe(400);

    // Deliberate submission of requireStrictSoilProvenance: false -> 400
    const bypassRes = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: "farm-123",
        zone: "derived_savanna",
        growthStage: "basal",
        requireStrictSoilProvenance: false,
        soil: VALID_LAB_SOIL,
      }),
    );
    expect(bypassRes.status).toBe(400);

    // Deliberate submission of protocolOverride / approvalRecord -> 400
    const overrideRes = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: "farm-123",
        zone: "derived_savanna",
        growthStage: "basal",
        protocolOverride: { approvalStatus: "agronomist_approved" },
        soil: VALID_LAB_SOIL,
      }),
    );
    expect(overrideRes.status).toBe(400);

    // Missing soil.farmId -> 400
    const { farmId: _omit, ...soilNoFarm } = VALID_LAB_SOIL;
    const noSoilFarmRes = await fertiliserPost(
      makeReq({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: "farm-123",
        zone: "derived_savanna",
        growthStage: "basal",
        soil: soilNoFarm,
      }),
    );
    expect(noSoilFarmRes.status).toBe(400);

    // Unsupported crop -> 400
    const lettuceRes = await fertiliserPost(
      makeReq({
        cropId: "lettuce",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: "farm-123",
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

    // Missing cropId & missing zone must NOT default to maize or derived_savanna
    const missingCtxRes = await askFarmAssistantAction({
      query: "How much should I apply?",
      language: "en",
    });
    expect(capturedPromptBody).not.toContain("derived_savanna");
    expect(capturedPromptBody).toContain("unverified (not provided)");
    expect(missingCtxRes.passedSafetyGuardrail).toBe(false);
    expect(missingCtxRes.numericGuardrailBlocked).toBe(true);
    expect(missingCtxRes.answer).not.toContain("200 kg/ha");

    // Invalid zone must throw fail-closed error
    await expect(
      askFarmAssistantAction({
        query: "Advise on maize",
        context: { cropId: "maize", zone: "fabricated_zone" as never },
        language: "en",
      }),
    ).rejects.toThrow("Invalid agro-ecological zone");
  });
});
