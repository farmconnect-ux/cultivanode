import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin/staff";
import { aiConfig } from "@/lib/ai-config";

// Staff-only AI check: which keys this deployment can see, and a tiny live call to each provider with the
// exact error if it fails. Keys are never returned, only their length and first characters.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Check = { provider: string; model: string; configured: boolean; key?: string; ok?: boolean; status?: number; ms?: number; error?: string };

const hint = (k?: string) => (k ? `${k.slice(0, 7)}… (${k.length} chars${/\s|^["']|["']$/.test(k) ? ", HAS SPACES OR QUOTES" : ""})` : undefined);

async function probe(provider: string, model: string, key: string | undefined, call: () => Promise<Response>): Promise<Check> {
  if (!key) return { provider, model, configured: false };
  const t = Date.now();
  try {
    const res = await call();
    const text = await res.text();
    return { provider, model, configured: true, key: hint(key), ok: res.ok, status: res.status, ms: Date.now() - t, error: res.ok ? undefined : text.slice(0, 300) };
  } catch (e) {
    return { provider, model, configured: true, key: hint(key), ok: false, ms: Date.now() - t, error: e instanceof Error ? `${e.name}: ${e.message}` : "unknown" };
  }
}

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Staff only" }, { status: 403 });
  const c = aiConfig();
  const signal = () => AbortSignal.timeout(20000);
  const checks = await Promise.all([
    ...c.claudeModels.map((model) =>
      probe("claude", model, c.anthropicApiKey, () =>
        fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal: signal(),
          headers: { "Content-Type": "application/json", "x-api-key": c.anthropicApiKey!, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model, max_tokens: 5, messages: [{ role: "user", content: "Reply OK" }] }),
        }),
      ),
    ),
    probe("gemini", c.primaryModel, c.geminiApiKey, () =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.primaryModel)}:generateContent`, {
        method: "POST",
        signal: signal(),
        headers: { "Content-Type": "application/json", "x-goog-api-key": c.geminiApiKey! },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply OK" }] }], generationConfig: { maxOutputTokens: 5 } }),
      }),
    ),
    probe("openai", c.fallbackModel, c.openaiApiKey, () =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: signal(),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.openaiApiKey}` },
        body: JSON.stringify({ model: c.fallbackModel, max_tokens: 5, messages: [{ role: "user", content: "Reply OK" }] }),
      }),
    ),
  ]);
  return NextResponse.json(
    { deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local", env: process.env.VERCEL_ENV ?? "local", timeoutMs: c.timeoutMs, checks },
    { headers: { "Cache-Control": "no-store" } },
  );
}
