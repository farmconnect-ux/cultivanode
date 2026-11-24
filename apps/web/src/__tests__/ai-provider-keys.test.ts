import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), service: true as boolean, warn: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logger", () => ({ logger: { warn: mocks.warn, error: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/supabase/admin", () => ({
  createServiceClient: () => (mocks.service ? { rpc: mocks.rpc } : null),
}));

import { aiConfig, buildAiConfig, resetAiConfigCache } from "@/lib/ai-config";
import { checkAiKey } from "@/lib/ai-key-check";

const live = (key?: string, config: Record<string, string | null> = {}) => ({
  mode: "live", config, secrets: (key ? { api_key: key } : {}) as Record<string, string>,
});

describe("AI keys from Admin > Integrations", () => {
  beforeEach(() => {
    resetAiConfigCache();
    mocks.rpc.mockReset();
    mocks.service = true;
    vi.unstubAllEnvs();
  });

  it("prefers keys and models saved in the admin over Vercel variables", () => {
    const c = buildAiConfig(
      { claude: live("sk-ant-admin", { model: "claude-opus-5-5", fallback_model: null }), gemini: live(), openai: live("sk-admin", { model: "gpt-5-mini" }) },
      { ANTHROPIC_API_KEY: "sk-ant-env", GEMINI_API_KEY: "g-env", CLAUDE_FALLBACK_MODEL: "claude-haiku-env" },
    );
    expect(c.anthropicApiKey).toBe("sk-ant-admin");
    expect(c.claudeModels).toEqual(["claude-opus-5-5", "claude-haiku-env"]);
    expect(c.geminiApiKey).toBe("g-env");
    expect(c.openaiApiKey).toBe("sk-admin");
    expect(c.fallbackModel).toBe("gpt-5-mini");
    expect(c.primaryModel).toBe("gemini-flash-latest");
    expect(c.sources).toEqual({ claude: "admin", gemini: "env", openai: "admin" });
  });

  it("works exactly as before when nothing is saved in the admin", () => {
    const c = buildAiConfig({}, { CLAUDE_API_KEY: "old", AI_PRIMARY_MODEL: "gemini-x", AI_TIMEOUT_MS: "5000" });
    expect(c).toMatchObject({ anthropicApiKey: "old", geminiApiKey: undefined, primaryModel: "gemini-x", timeoutMs: 5000,
      sources: { claude: "env", gemini: "none", openai: "none" } });
    expect(c.claudeModels).toEqual(["claude-sonnet-5-5", "claude-haiku-5-5"]);
  });

  it("reads the admin keys once a minute, not on every question", async () => {
    mocks.rpc.mockResolvedValue({ data: { claude: live("sk-ant-1") }, error: null });
    expect((await aiConfig()).anthropicApiKey).toBe("sk-ant-1");
    expect((await aiConfig()).anthropicApiKey).toBe("sk-ant-1");
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("ai_provider_runtime");
  });

  it("falls back to the Vercel variables when the database cannot be read", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-env");
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "permission denied" } });
    const c = await aiConfig();
    expect(c.openaiApiKey).toBe("sk-env");
    expect(mocks.warn).toHaveBeenCalledWith("ai_config_runtime_failed", expect.anything());
    mocks.service = false;
    resetAiConfigCache();
    expect((await aiConfig()).openaiApiKey).toBe("sk-env");
  });
});

describe("Check key", () => {
  beforeEach(() => {
    resetAiConfigCache();
    mocks.rpc.mockReset();
    mocks.service = true;
    vi.unstubAllEnvs();
  });

  const res = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });

  it("sends a 1-token request with the admin key and says where the key came from", async () => {
    mocks.rpc.mockResolvedValue({ data: { claude: live("sk-ant-admin") }, error: null });
    const fetchFn = vi.fn(async () => res(200, { content: [] }));
    expect(await checkAiKey("claude", fetchFn as unknown as typeof fetch)).toEqual({ ok: true, model: "claude-sonnet-5-5", source: "admin" });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("sk-ant-admin");
    expect(JSON.parse(String(init.body))).toMatchObject({ max_tokens: 1 });
  });

  it("explains a refused key, an unknown model and a missing key", async () => {
    mocks.rpc.mockResolvedValue({ data: { gemini: live("bad"), openai: live("sk", { model: "gpt-nope" }) }, error: null });
    const geminiBad = vi.fn(async () => res(400, { error: { status: "INVALID_ARGUMENT", details: [{ reason: "API_KEY_INVALID" }] } }));
    expect(await checkAiKey("gemini", geminiBad as unknown as typeof fetch)).toMatchObject({ ok: false, reason: "bad_key" });
    const openaiModel = vi.fn(async () => res(404, { error: { code: "model_not_found" } }));
    expect(await checkAiKey("openai", openaiModel as unknown as typeof fetch)).toMatchObject({ ok: false, reason: "model_not_found", model: "gpt-nope" });
    const never = vi.fn();
    expect(await checkAiKey("claude", never as unknown as typeof fetch)).toMatchObject({ ok: false, reason: "no_key" });
    expect(never).not.toHaveBeenCalled();
  });
});
