import "server-only";
import { checkChemicalSafetyGuardrails } from "@cultivanode/shared";
import { logger } from "@/lib/logger";

// Crop photo analysis with a vision model. Gemini answers first, OpenAI is the fallback (the same setup as
// the farm assistant: GEMINI_API_KEY, OPENAI_API_KEY, AI_PRIMARY_MODEL, AI_FALLBACK_MODEL, AI_TIMEOUT_MS).
// The keys stay on the server. Every answer passes the NAFDAC chemical guardrail before anyone sees it.

export type CropImage = { mime: string; base64: string };

export type Diagnosis = {
  summary: string;
  likely: { name: string; confidence: "low" | "medium" | "high"; why: string }[];
  checks: string[];
  actions: string[];
  urgent: boolean;
  see_expert_if: string;
  /** NAFDAC safety notes added by the guardrail for any approved product the answer names. */
  safety: string[];
  /** The photos were too unclear to say anything useful. */
  unclear: boolean;
};

export type DiagnosisResult = { ok: true; diagnosis: Diagnosis; model: string } | { ok: false; error: "not_configured" | "failed" };

type Context = { crop: string; category: string; title: string; description: string; state: string | null; language: "en" | "yo" };

function prompt(c: Context): string {
  return [
    "You are an agronomist helping a smallholder farmer in Nigeria (South-West pilot) understand photos from a crop walk.",
    `Crop: ${c.crop}. Location: ${c.state ?? "Nigeria"}. The farmer filed this under "${c.category}" titled "${c.title}".`,
    `What the farmer wrote: ${c.description || "(nothing)"}`,
    "",
    "Look at the photos and reply with JSON only, in this shape:",
    '{"summary": string, "likely": [{"name": string, "confidence": "low"|"medium"|"high", "why": string}], "checks": [string], "actions": [string], "urgent": boolean, "see_expert_if": string, "unclear": boolean}',
    "",
    "Rules:",
    "- At most 3 likely causes, most likely first. Say \"low\" confidence when you are not sure. If the photos are too blurred, dark or far away, set unclear to true and say what photo to take instead.",
    "- checks: 2 to 4 simple things the farmer can look at in the field to confirm (for example: look inside the leaf funnel for frass).",
    "- actions: practical steps, cultural and mechanical first. Only name pesticides registered by NAFDAC in Nigeria, with the active ingredient, and remind them to follow the label and wear protection. Never suggest paraquat, carbofuran, DDT, endosulfan, lindane, aldrin or any banned product.",
    "- urgent: true only if the crop could be lost within days without action.",
    "- see_expert_if: when they should call an extension agent or agronomist.",
    `- Write every text value in ${c.language === "yo" ? "Yoruba" : "plain English"}, short sentences a farmer can follow.`,
  ].join("\n");
}

function timeout(): AbortSignal {
  return AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS) || 20000);
}

async function gemini(images: CropImage[], text: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.AI_PRIMARY_MODEL || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    signal: timeout(),
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text }, ...images.map((i) => ({ inline_data: { mime_type: i.mime, data: i.base64 } }))] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 1200 },
    }),
  });
  if (!res.ok) throw new Error(`gemini_${res.status}`);
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? null;
}

async function openai(images: CropImage[], text: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.AI_FALLBACK_MODEL || "gpt-4.1-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    signal: timeout(),
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [{ type: "text", text }, ...images.map((i) => ({ type: "image_url", image_url: { url: `data:${i.mime};base64,${i.base64}` } }))],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai_${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? null;
}

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, n: number) => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean).slice(0, n) : []);

/** Shape-checks the model's JSON and runs the chemical guardrail over every word of it. */
function clean(raw: string): Diagnosis | null {
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "")) as Record<string, unknown>;
  } catch {
    return null;
  }
  const likely = (Array.isArray(j.likely) ? j.likely : [])
    .map((x) => x as Record<string, unknown>)
    .map((x) => ({
      name: str(x.name, 120),
      confidence: (["low", "medium", "high"].includes(String(x.confidence)) ? x.confidence : "low") as Diagnosis["likely"][number]["confidence"],
      why: str(x.why),
    }))
    .filter((x) => x.name)
    .slice(0, 3);
  const d: Diagnosis = {
    summary: str(j.summary, 600),
    likely,
    checks: list(j.checks, 4),
    actions: list(j.actions, 6),
    urgent: j.urgent === true,
    see_expert_if: str(j.see_expert_if),
    safety: [],
    unclear: j.unclear === true,
  };
  const all = [d.summary, ...d.likely.map((l) => `${l.name} ${l.why}`), ...d.checks, ...d.actions, d.see_expert_if].join("\n");
  const guard = checkChemicalSafetyGuardrails(all);
  if (!guard.passed) {
    // A banned product slipped in: drop the actions entirely and send the farmer to an extension agent.
    d.actions = [guard.sanitizedResponseText];
  }
  d.safety = guard.safetyAppendices.slice(0, 4);
  return d;
}

export function visionConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
}

export async function diagnoseCropPhotos(images: CropImage[], context: Context): Promise<DiagnosisResult> {
  if (!visionConfigured()) return { ok: false, error: "not_configured" };
  if (!images.length) return { ok: false, error: "failed" };
  const text = prompt(context);
  const tries: [string, () => Promise<string | null>][] = [
    [process.env.AI_PRIMARY_MODEL || "gemini-2.5-flash", () => gemini(images, text)],
    [process.env.AI_FALLBACK_MODEL || "gpt-4.1-mini", () => openai(images, text)],
  ];
  for (const [model, run] of tries) {
    try {
      const raw = await run();
      if (!raw) continue;
      const diagnosis = clean(raw);
      if (diagnosis) return { ok: true, diagnosis, model };
      logger.warn("ai_vision_bad_json", { model });
    } catch (err) {
      logger.warn("ai_vision_failed", { model, reason: err instanceof Error ? err.message : "unknown" });
    }
  }
  return { ok: false, error: "failed" };
}
