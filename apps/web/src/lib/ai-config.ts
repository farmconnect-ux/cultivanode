import "server-only";
import { DEFAULT_CLAUDE_MODELS } from "@cultivanode/shared";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/admin";

// One place for the AI keys and models, read on the server only (keys never reach the browser).
// Order of use: Claude (model, then second model), then Gemini, then OpenAI, then the built-in rule-based advice.
//
// Keys and models come from Admin > Integrations > AI (Vault, read through ai_provider_runtime) and are cached
// for a minute, so a changed key works within a minute without a redeploy. For each provider with no key saved
// there, the Vercel variables are used (ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY, CLAUDE_MODEL...).

export type AiConfig = {
  anthropicApiKey: string | undefined;
  claudeModels: string[];
  geminiApiKey: string | undefined;
  openaiApiKey: string | undefined;
  primaryModel: string;
  fallbackModel: string;
  timeoutMs: number;
  /** Where each key came from, for the health check. Never the key itself. */
  sources: Record<"claude" | "gemini" | "openai", "admin" | "env" | "none">;
};

type ProviderRuntime = { mode?: string; config?: Record<string, string | null>; secrets?: Record<string, string> };
export type AiRuntime = Partial<Record<"claude" | "gemini" | "openai", ProviderRuntime>>;

const CACHE_MS = 60_000;
let cache: { at: number; value: AiRuntime } | null = null;

const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** Builds the config from what staff saved in the admin (if anything) and the environment. */
export function buildAiConfig(rt: AiRuntime, env: Record<string, string | undefined> = process.env): AiConfig {
  const key = (p: keyof AiRuntime) => clean(rt[p]?.secrets?.api_key);
  const model = (p: keyof AiRuntime, field = "model") => clean(rt[p]?.config?.[field]);

  const anthropicAdmin = key("claude");
  const geminiAdmin = key("gemini");
  const openaiAdmin = key("openai");
  const anthropicApiKey = anthropicAdmin ?? clean(env.ANTHROPIC_API_KEY) ?? clean(env.CLAUDE_API_KEY);
  const geminiApiKey = geminiAdmin ?? clean(env.GEMINI_API_KEY) ?? clean(env.AI_API_KEY);
  const openaiApiKey = openaiAdmin ?? clean(env.OPENAI_API_KEY);

  const claudeModels = [
    model("claude") ?? clean(env.CLAUDE_MODEL) ?? DEFAULT_CLAUDE_MODELS[0],
    model("claude", "fallback_model") ?? clean(env.CLAUDE_FALLBACK_MODEL) ?? DEFAULT_CLAUDE_MODELS[1],
  ].filter((m, i, all): m is string => Boolean(m) && all.indexOf(m) === i);

  const source = (admin: string | undefined, any: string | undefined): "admin" | "env" | "none" => (admin ? "admin" : any ? "env" : "none");
  return {
    anthropicApiKey,
    claudeModels,
    geminiApiKey,
    openaiApiKey,
    primaryModel: model("gemini") ?? clean(env.AI_PRIMARY_MODEL) ?? "gemini-flash-latest",
    fallbackModel: model("openai") ?? clean(env.AI_FALLBACK_MODEL) ?? "gpt-4o-mini",
    timeoutMs: Number(env.AI_TIMEOUT_MS) || 30000,
    sources: {
      claude: source(anthropicAdmin, anthropicApiKey),
      gemini: source(geminiAdmin, geminiApiKey),
      openai: source(openaiAdmin, openaiApiKey),
    },
  };
}

async function loadRuntime(): Promise<AiRuntime> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const service = createServiceClient();
  if (!service) return {};
  try {
    const { data, error } = await service.rpc("ai_provider_runtime");
    if (error) throw new Error(error.message);
    const value = (data ?? {}) as AiRuntime;
    cache = { at: Date.now(), value };
    return value;
  } catch (err) {
    // Fall back to the environment, and to the last good read if there is one.
    logger.warn("ai_config_runtime_failed", { reason: err instanceof Error ? err.message.slice(0, 120) : "unknown" });
    return cache?.value ?? {};
  }
}

export async function aiConfig(): Promise<AiConfig> {
  return buildAiConfig(await loadRuntime());
}

/** Forget the cached keys (after staff change them, or in tests). */
export function resetAiConfigCache() {
  cache = null;
}
