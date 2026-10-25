import { NextResponse } from "next/server";
import {
  askGroundedAiAssistant,
  type FarmerContext,
  type AppLanguage,
} from "@cultivanode/shared";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

interface RequestPayload {
  query: string;
  context?: Partial<FarmerContext>;
  language?: AppLanguage | "pcm";
  imageBase64?: string;
  imageMimeType?: string;
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate user via Supabase session or Bearer token
    const authHeader = req.headers.get("Authorization");
    const supabase = await createClient();

    let authenticatedUserId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        authenticatedUserId = data.user.id;
      }
    }

    if (!authenticatedUserId) {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        authenticatedUserId = data.user.id;
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // 2. Parse request
    const body = (await req.json()) as RequestPayload;
    if (!body.query?.trim() && !body.imageBase64) {
      return NextResponse.json(
        { error: "Query or image is required." },
        { status: 400 }
      );
    }

    const context: FarmerContext = {
      farmerId: body.context?.farmerId || authenticatedUserId,
      cropId: body.context?.cropId || "maize",
      zone: body.context?.zone || "rainforest",
      stageName: body.context?.stageName || "General",
      daysAfterPlanting: body.context?.daysAfterPlanting,
    };

    const lang: AppLanguage | "pcm" = body.language || "en";

    // 3. Environment configuration
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const primaryModel = process.env.AI_PRIMARY_MODEL || "gemini-2.5-flash";
    const fallbackModel = process.env.AI_FALLBACK_MODEL || "gpt-4o-mini";
    const timeoutMs = process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : 20000;

    // 4. Run Grounded Assistant with Guardrails
    const result = await askGroundedAiAssistant({
      query: body.query || "Analyze this crop image and recommend verified treatments.",
      context,
      language: lang,
      imageBase64: body.imageBase64,
      imageMimeType: body.imageMimeType,
      geminiApiKey,
      openaiApiKey,
      primaryModel,
      fallbackModel,
      timeoutMs,
    });

    if (result.providerUsed === "rule-engine") logger.warn("ai_assistant_fallback", { reasons: result.providerErrors.join("; ") });

    return NextResponse.json({
      answer: result.answer,
      language: result.language,
      providerUsed: result.providerUsed,
      passedSafetyGuardrail: result.passedSafetyGuardrail,
      bannedChemicalsDetected: result.bannedChemicalsDetected,
      approvedChemicalsDetected: result.approvedChemicalsDetected,
      safetyAppendices: result.safetyAppendices,
      sources: result.sources,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
