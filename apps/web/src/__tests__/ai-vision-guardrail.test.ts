import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkChemicalSafetyGuardrails: vi.fn(),
  aiConfig: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@cultivanode/shared", () => ({
  checkChemicalSafetyGuardrails: mocks.checkChemicalSafetyGuardrails,
}));
vi.mock("@/lib/ai-config", () => ({
  aiConfig: mocks.aiConfig,
}));
vi.mock("@/lib/logger", () => ({
  logger: { warn: mocks.loggerWarn, error: mocks.loggerError },
}));

import { diagnoseCropPhotos } from "@/lib/ai-vision";

const diagnosisWithBannedMentions = {
  summary: "Possible paraquat exposure.",
  likely: [{ name: "Carbofuran toxicity", confidence: "high", why: "Residue may indicate carbofuran." }],
  checks: ["Check for DDT residue."],
  actions: ["Never apply aldrin."],
  urgent: true,
  see_expert_if: "Contact an expert about lindane exposure.",
  unclear: false,
};

function claudeResponse() {
  return new Response(JSON.stringify({
    content: [{ type: "text", text: JSON.stringify(diagnosisWithBannedMentions) }],
  }), { status: 200, headers: { "content-type": "application/json" } });
}

describe("crop vision chemical safety guardrail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.aiConfig.mockReturnValue({
      anthropicApiKey: "test-anthropic-key",
      geminiApiKey: "test-gemini-key",
      openaiApiKey: "test-openai-key",
      claudeModels: ["claude-sonnet-test", "claude-haiku-test"],
      primaryModel: "gemini-test",
      fallbackModel: "openai-test",
      timeoutMs: 1000,
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("blocks the complete diagnosis when a banned chemical appears in any farmer-visible field", async () => {
    const fetchMock = vi.fn(async () => claudeResponse());
    vi.stubGlobal("fetch", fetchMock);
    mocks.checkChemicalSafetyGuardrails.mockReturnValue({
      passed: false,
      bannedChemicalsDetected: ["paraquat", "carbofuran", "ddt", "aldrin", "lindane"],
      approvedChemicalsDetected: [],
      safetyAppendices: [],
      sanitizedResponseText: "SAFETY BLOCK: prohibited pesticide reference detected.",
    });

    const result = await diagnoseCropPhotos(
      [{ mime: "image/jpeg", base64: "aGVsbG8=" }],
      { crop: "maize", category: "pest", title: "Leaf damage", description: "", state: "Oyo", language: "en" },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diagnosis.summary).toContain("potentially unsafe pesticide reference");
      expect(result.diagnosis.likely).toEqual([]);
      expect(result.diagnosis.checks).toEqual([]);
      expect(result.diagnosis.actions[0]).toContain("SAFETY BLOCK");
      expect(result.diagnosis.urgent).toBe(false);
      expect(result.diagnosis.see_expert_if).toContain("extension officer");
      expect(result.diagnosis.safety).toEqual([]);
      const visible = JSON.stringify(result.diagnosis).toLowerCase();
      for (const chemical of ["paraquat", "carbofuran", "ddt", "aldrin", "lindane"]) {
        expect(visible).not.toContain(chemical);
      }
    }
    expect(mocks.checkChemicalSafetyGuardrails).toHaveBeenCalledWith(expect.stringContaining("paraquat"));
  });

  it("stops provider fallback if chemical safety evaluation throws", async () => {
    const fetchMock = vi.fn(async () => claudeResponse());
    vi.stubGlobal("fetch", fetchMock);
    mocks.checkChemicalSafetyGuardrails.mockImplementation(() => {
      throw new Error("guardrail unavailable");
    });

    const result = await diagnoseCropPhotos(
      [{ mime: "image/jpeg", base64: "aGVsbG8=" }],
      { crop: "maize", category: "pest", title: "Leaf damage", description: "", state: "Oyo", language: "en" },
    );

    expect(result).toEqual({ ok: false, error: "failed" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.loggerError).toHaveBeenCalledWith("ai_vision_guardrail_failed", { model: "claude-sonnet-test" });
  });
});
