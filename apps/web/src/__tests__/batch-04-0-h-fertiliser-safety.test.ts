import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/account/session", () => ({
  requireAccount: vi.fn(async () => ({ userId: "11111111-1111-4111-8111-111111111111" })),
}));
vi.mock("@/lib/ai-config", () => ({
  aiConfig: () => ({
    anthropicApiKey: "test-key",
    claudeModels: ["claude-test"],
    geminiApiKey: undefined,
    openaiApiKey: undefined,
    primaryModel: "claude-test",
    fallbackModel: "gpt-4o-mini",
    timeoutMs: 5000,
  }),
}));
vi.mock("@/lib/engines-api-helper", async () => {
  const actual = await vi.importActual<typeof import("@/lib/engines-api-helper")>("@/lib/engines-api-helper");
  return {
    ...actual,
    authorizeRequest: vi.fn(async () => ({ authorized: true })),
  };
});

import { POST as fertiliserPost } from "@/app/api/engines/agronomy/fertiliser/route";
import { askFarmAssistantAction } from "@/actions/ai-assistant";

afterEach(() => vi.unstubAllGlobals());

describe("Batch 04.0-H — Server Action & Fertiliser API Safety Enforcement", () => {
  it("POST /api/engines/agronomy/fertiliser rejects lettuce, modelled soil, and farmer-reported soil, and converts typed cmol_kg lab soil", async () => {
    const lettuceReq = new Request("http://localhost/api/engines/agronomy/fertiliser", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cropId: "lettuce",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        soil: { pH: 6.2, organicMatterPercent: 2.0, phosphorusPpm: 12, potassiumPpm: 120 },
      }),
    });
    const lettuceRes = await fertiliserPost(lettuceReq);
    expect(lettuceRes.status).toBe(400);

    const modelledReq = new Request("http://localhost/api/engines/agronomy/fertiliser", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        soil: {
          pH: 6.2,
          organicMatterPercent: 2.0,
          phosphorusPpm: 12,
          potassium: { value: 0.25, unit: "cmol_kg", basis: "elemental_K" },
          provenance: "modelled_estimate",
        },
      }),
    });
    const modelledRes = await fertiliserPost(modelledReq);
    expect(modelledRes.status).toBe(422);
    const modelledBody = (await modelledRes.json()) as { reasonCode: string };
    expect(modelledBody.reasonCode).toBe("soil_modelled_not_allowed");

    const validLabReq = new Request("http://localhost/api/engines/agronomy/fertiliser", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        cropId: "maize",
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 2,
        zone: "derived_savanna",
        growthStage: "basal",
        requireStrictSoilProvenance: true,
        soil: {
          pH: 6.2,
          organicMatterPercent: 1.8,
          phosphorusPpm: 12,
          potassium: { value: 0.25, unit: "cmol_kg", basis: "elemental_K" },
          provenance: "lab_confirmed",
          extractionMethod: "bray_1",
          samplingDepthCm: 15,
          testDate: "2026-10-15",
        },
      }),
    });
    const validLabRes = await fertiliserPost(validLabReq);
    expect(validLabRes.status).toBe(200);
    const validBody = (await validLabRes.json()) as {
      recommendationStatus: string;
      potassiumConversion: { derivedElementalMgKg: number; originalUnit: string };
    };
    expect(validBody.recommendationStatus).toBe("approved_calculation");
    expect(validBody.potassiumConversion.originalUnit).toBe("cmol_kg");
    expect(validBody.potassiumConversion.derivedElementalMgKg).toBe(97.75);
  });

  it("askFarmAssistantAction does not default missing cropId to maize and blocks LLM-invented lettuce rates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            content: [{ type: "text", text: "Apply NPK 15:15:15 at 300 kg/ha and Urea at 150 kg/ha." }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    // Missing cropId must NOT silently default to maize
    const missingCropRes = await askFarmAssistantAction({
      query: "How much NPK should I apply?",
      language: "en",
    });
    expect(missingCropRes.passedSafetyGuardrail).toBe(false);
    expect(missingCropRes.numericGuardrailBlocked).toBe(true);
    expect(missingCropRes.numericGuardrailReasonCode).toBe("crop_not_identified");
    expect(missingCropRes.answer).not.toContain("300 kg/ha");
    expect(missingCropRes.answer.toLowerCase()).not.toContain("maize");

    // Unsupported crop (lettuce) blocked server-side even when LLM emits rates
    const lettuceRes = await askFarmAssistantAction({
      query: "How much fertiliser for lettuce?",
      context: { cropId: "lettuce", zone: "derived_savanna" },
      language: "en",
    });
    expect(lettuceRes.passedSafetyGuardrail).toBe(false);
    expect(lettuceRes.recommendationStatus).toBe("unsupported_crop");
    expect(lettuceRes.answer).not.toContain("300 kg/ha");
  });
});
