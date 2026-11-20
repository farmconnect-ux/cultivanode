import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  supabaseEnv: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/supabase/env", () => ({
  supabaseEnv: mocks.supabaseEnv,
}));

import { authorizeFarmRequest } from "@/lib/engines-api-helper";

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

function request(authorization?: string) {
  return new Request("https://cultivanode.test/api/engines/ai/ground", {
    headers: authorization ? { Authorization: authorization } : {},
  });
}

function configureClient({
  user = { id: USER_ID },
  authError = null,
  farm = { id: FARM_ID },
  farmError = null,
}: {
  user?: { id: string } | null;
  authError?: { message: string } | null;
  farm?: { id: string } | null;
  farmError?: { message: string } | null;
} = {}) {
  mocks.getUser.mockResolvedValue({ data: { user }, error: authError });
  mocks.maybeSingle.mockResolvedValue({ data: farm, error: farmError });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.createClient.mockReturnValue({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  });
}

describe("authorizeFarmRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.supabaseEnv.mockReturnValue({
      url: "https://example.supabase.co",
      key: "public-anon-or-publishable-key",
    });
    configureClient();
  });

  it("rejects a missing bearer token without creating a Supabase client", async () => {
    const result = await authorizeFarmRequest(request(), FARM_ID);
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects invalid or expired JWTs before querying farm visibility", async () => {
    configureClient({ user: null, authError: { message: "JWT expired" } });
    const result = await authorizeFarmRequest(request("Bearer invalid-token"), FARM_ID);
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("authorises a farm visible to the verified caller through the caller JWT", async () => {
    const result = await authorizeFarmRequest(request("Bearer valid-token"), FARM_ID);
    expect(result.authorized).toBe(true);
    expect(mocks.createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "public-anon-or-publishable-key",
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer valid-token" } },
        auth: expect.objectContaining({ persistSession: false, autoRefreshToken: false }),
      }),
    );
    expect(mocks.getUser).toHaveBeenCalledWith("valid-token");
    expect(mocks.from).toHaveBeenCalledWith("farms");
    expect(mocks.select).toHaveBeenCalledWith("id");
    expect(mocks.eq).toHaveBeenCalledWith("id", FARM_ID);
    expect(mocks.createClient.mock.calls[0]?.[1]).not.toMatch(/service.role/i);
  });

  it("denies a caller whose RLS-scoped query cannot see the farm", async () => {
    configureClient({ farm: null });
    const result = await authorizeFarmRequest(request("Bearer valid-token"), FARM_ID);
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(404);
  });

  it("returns a generic access error when the farm query fails", async () => {
    configureClient({ farmError: { message: "internal database detail" } });
    const result = await authorizeFarmRequest(request("Bearer valid-token"), FARM_ID);
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(500);
      await expect(result.response.json()).resolves.toEqual({ error: "Unable to verify farm access." });
    }
  });

  it("fails closed when Supabase environment configuration is unavailable", async () => {
    mocks.supabaseEnv.mockImplementation(() => {
      throw new Error("missing environment");
    });
    const result = await authorizeFarmRequest(request("Bearer valid-token"), FARM_ID);
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("fails closed when Supabase auth throws", async () => {
    mocks.getUser.mockRejectedValueOnce(new Error("network failure"));
    const result = await authorizeFarmRequest(request("Bearer valid-token"), FARM_ID);
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns a generic access error when the farm query throws", async () => {
    mocks.maybeSingle.mockRejectedValueOnce(new Error("internal database detail"));
    const result = await authorizeFarmRequest(request("Bearer valid-token"), FARM_ID);
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(500);
  });
});
