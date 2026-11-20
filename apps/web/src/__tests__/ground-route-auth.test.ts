import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  authorizeFarmRequest: vi.fn(),
  parseJsonBody: vi.fn(),
  buildGroundedPrompt: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/engines-api-helper", () => ({
  authorizeFarmRequest: mocks.authorizeFarmRequest,
  parseJsonBody: mocks.parseJsonBody,
}));
vi.mock("@cultivanode/shared", () => ({
  buildGroundedPrompt: mocks.buildGroundedPrompt,
}));

import { POST } from "@/app/api/engines/ai/ground/route";

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const VERIFIED_USER_ID = "verified-user-123";

describe("grounding endpoint farm identity binding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorizeFarmRequest.mockResolvedValue({
      authorized: true,
      user: { id: VERIFIED_USER_ID },
      client: {},
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

  it("uses the verified Supabase user identity, never a client-supplied farmerId", async () => {
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
    expect(mocks.authorizeFarmRequest).toHaveBeenCalledWith(req, FARM_ID);
    expect(mocks.buildGroundedPrompt).toHaveBeenCalledWith(
      "How should I manage maize?",
      expect.objectContaining({ farmerId: VERIFIED_USER_ID, cropId: "maize" }),
      "en",
    );
    await expect(response.json()).resolves.toEqual({ farmerId: VERIFIED_USER_ID });
  });
});
