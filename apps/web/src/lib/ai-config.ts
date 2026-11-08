import "server-only";
import { DEFAULT_CLAUDE_MODELS } from "@cultivanode/shared";

// One place for the AI keys and models, read on the server only (keys never reach the browser).
// Order of use: Claude (CLAUDE_MODEL, then CLAUDE_FALLBACK_MODEL), then Gemini, then OpenAI, then the
// built-in rule-based advice. Set ANTHROPIC_API_KEY in Vercel to switch Claude on.
export function aiConfig() {
  const claudeModels = [process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODELS[0], process.env.CLAUDE_FALLBACK_MODEL || DEFAULT_CLAUDE_MODELS[1]].filter(
    (m, i, all): m is string => Boolean(m) && all.indexOf(m) === i,
  );
  return {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || undefined,
    claudeModels,
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || undefined,
    openaiApiKey: process.env.OPENAI_API_KEY || undefined,
    primaryModel: process.env.AI_PRIMARY_MODEL || "gemini-flash-latest",
    fallbackModel: process.env.AI_FALLBACK_MODEL || "gpt-4o-mini",
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
  };
}
