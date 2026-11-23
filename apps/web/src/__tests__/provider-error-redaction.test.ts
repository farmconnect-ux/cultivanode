import { describe, expect, it } from "vitest";
import { redactProviderError } from "@/lib/provider-error";

describe("AI provider error logging", () => {
  it("keeps the status and message but masks anything key-like", () => {
    const out = redactProviderError(
      'openai: OpenAI API error status 401: {"error":{"message":"Incorrect API key provided: sk-proj-abcDEF1234567890xyz"}}',
    );
    expect(out).toContain("status 401");
    expect(out).toContain("Incorrect API key provided");
    expect(out).not.toContain("abcDEF1234567890xyz");
    expect(redactProviderError("gemini: key AIzaSyA1234567890abcdefgh rejected")).not.toContain("SyA1234567890");
    expect(redactProviderError("x sb_secret_YEXwtABCDEFG y")).not.toContain("ABCDEFG");
    expect(redactProviderError("claude claude-sonnet-5-5: Claude error status 404: model not found")).toBe(
      "claude claude-sonnet-5-5: Claude error status 404: model not found",
    );
  });
});
