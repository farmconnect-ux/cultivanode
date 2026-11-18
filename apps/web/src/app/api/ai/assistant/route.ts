import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { askGroundedAiAssistant, type FarmerContext } from "@cultivanode/shared";
import { aiConfig } from "@/lib/ai-config";
import { logger } from "@/lib/logger";
import { supabaseEnv } from "@/lib/supabase/env";

const AssistantBodySchema = z.object({
  query: z.string().max(4000).optional(),
  language: z.enum(["en", "yo", "pcm"]).optional(),
  imageBase64: z.string().max(8_000_000).optional(),
  imageMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  context: z
    .object({
      cropId: z.string().max(80).optional(),
      zone: z.string().max(80).optional(),
      stageName: z.string().max(80).optional(),
      daysAfterPlanting: z.number().int().min(0).max(3650).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    let authenticatedUserId: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const { url, key } = supabaseEnv();
        const client = createSupabaseJs(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data } = await client.auth.getUser(token);
        if (data.user) authenticatedUserId = data.user.id;
      }
    }

    if (!authenticatedUserId) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) authenticatedUserId = data.user.id;
    }

    if (!authenticatedUserId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const parsed = AssistantBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request payload." },
        { status: 400 },
      );
    }

    const body = parsed.data;
    if (!body.query?.trim() && !body.imageBase64) {
      return NextResponse.json(
        { error: "Please provide a question or attach a photo." },
        { status: 400 },
      );
    }

    const c = aiConfig();
    const result = await askGroundedAiAssistant({
      query: body.query?.trim() || "Please examine this crop photo and advise what to do.",
      // Always bind farmerId to the authenticated caller; never trust client-supplied farmerId
      context: { ...(body.context ?? {}), farmerId: authenticatedUserId } as FarmerContext,
      language: body.language ?? "en",
      imageBase64: body.imageBase64,
      imageMimeType: body.imageMimeType,
      anthropicApiKey: c.anthropicApiKey,
      claudeModels: c.claudeModels,
      geminiApiKey: c.geminiApiKey,
      openaiApiKey: c.openaiApiKey,
      primaryModel: c.primaryModel,
      fallbackModel: c.fallbackModel,
      timeoutMs: c.timeoutMs,
    });

    if (result.providerErrors.length > 0) {
      logger.warn("ai_assistant_fallback", {
        provider: result.providerUsed,
        errors: result.providerErrors.length,
      });
    } else {
      logger.info("ai_assistant_ok", { provider: result.providerUsed, model: result.modelUsed });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process AI request.";
    logger.error("ai_assistant_error", { message });
    return NextResponse.json({ error: "Failed to process AI request." }, { status: 500 });
  }
}
