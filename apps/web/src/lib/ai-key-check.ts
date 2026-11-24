import "server-only";
import { aiConfig, resetAiConfigCache } from "@/lib/ai-config";

export type AiProvider = "claude" | "gemini" | "openai";
export type AiKeyCheck =
  | { ok: true; model: string; source: "admin" | "env" }
  | { ok: false; reason: "no_key" | "bad_key" | "model_not_found" | "unavailable"; model: string; status?: number };

/**
 * Checks a provider's key and model with a 1-token request, the same call the assistant makes.
 * Uses the key the assistant would use right now (the admin key, or the Vercel variable).
 */
export async function checkAiKey(provider: AiProvider, fetchFn: typeof fetch = fetch): Promise<AiKeyCheck> {
  resetAiConfigCache();
  const c = await aiConfig();
  const source = c.sources[provider];
  const model = provider === "claude" ? c.claudeModels[0]! : provider === "gemini" ? c.primaryModel : c.fallbackModel;
  const key = provider === "claude" ? c.anthropicApiKey : provider === "gemini" ? c.geminiApiKey : c.openaiApiKey;
  if (!key || source === "none") return { ok: false, reason: "no_key", model };

  const signal = AbortSignal.timeout(20000);
  let res: Response;
  try {
    res =
      provider === "claude"
        ? await fetchFn("https://api.anthropic.com/v1/messages", {
            method: "POST", signal,
            headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: "user", content: "Reply OK" }] }),
          })
        : provider === "gemini"
          ? await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
              method: "POST", signal,
              headers: { "Content-Type": "application/json", "x-goog-api-key": key },
              body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply OK" }] }], generationConfig: { maxOutputTokens: 1 } }),
            })
          : await fetchFn("https://api.openai.com/v1/chat/completions", {
              method: "POST", signal,
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
              body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: "user", content: "Reply OK" }] }),
            });
  } catch {
    return { ok: false, reason: "unavailable", model };
  }
  if (res.ok) return { ok: true, model, source };
  // Gemini answers a bad key with 400 API_KEY_INVALID.
  const text = await res.text().catch(() => "");
  if (res.status === 401 || res.status === 403 || /API_KEY_INVALID|invalid.api.key/i.test(text)) {
    return { ok: false, reason: "bad_key", model, status: res.status };
  }
  if (res.status === 404 || /model_not_found|not_found_error|is not found/i.test(text)) {
    return { ok: false, reason: "model_not_found", model, status: res.status };
  }
  return { ok: false, reason: "unavailable", model, status: res.status };
}
