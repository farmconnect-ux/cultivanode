import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseJs, type SupabaseClient, type User } from "@supabase/supabase-js";
import { askGroundedAiAssistant, type Database, type FarmerContext } from "@cultivanode/shared";
import { createClient } from "@/lib/supabase/server";
import { aiConfig } from "@/lib/ai-config";
import { recordAiAuditEvent } from "@/lib/ai-audit";
import {
  authorizeAiFarmRequest,
  verifyActiveAccount,
  verifyAiIntelligenceConsent,
  type VerifiedAiFarmCallerContext,
} from "@/lib/engines-api-helper";
import { getLiveFarmContextSnapshot } from "@/lib/farm-context/live-farm-context.service";
import { logger } from "@/lib/logger";
import { supabaseEnv } from "@/lib/supabase/env";

const AssistantBodySchema = z.object({
  query: z.string().max(4000).optional(),
  language: z.enum(["en", "yo", "pcm"]).optional(),
  imageBase64: z.string().max(8_000_000).optional(),
  imageMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  context: z
    .object({
      farmId: z.string().uuid().optional(),
      cropId: z.string().max(80).optional(),
      zone: z.string().max(80).optional(),
      stageName: z.string().max(80).optional(),
      daysAfterPlanting: z.number().int().min(0).max(3650).optional(),
    })
    .optional(),
});

function mapAuditProvider(providerUsed: string): "claude" | "gemini" | "openai" | "rule-engine" {
  const lower = providerUsed.toLowerCase();
  if (lower.includes("claude") || lower.includes("anthropic")) return "claude";
  if (lower.includes("gemini") || lower.includes("google")) return "gemini";
  if (lower.includes("openai") || lower.includes("gpt")) return "openai";
  return "rule-engine";
}

export async function POST(req: Request) {
  try {
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

    const farmId = body.context?.farmId;
    let verifiedFarmCaller: VerifiedAiFarmCallerContext | null = null;
    let authenticatedUserId: string | null = null;

    if (farmId) {
      // Farm-scoped AI intelligence requires Bearer JWT -> active account -> farm RLS -> AI consent.
      const farmAuth = await authorizeAiFarmRequest(req, farmId);
      if (!farmAuth.authorized) return farmAuth.response;
      verifiedFarmCaller = farmAuth.caller;
      authenticatedUserId = farmAuth.caller.user.id;
    } else {
      let user: User | null = null;
      let userClient: SupabaseClient<Database> | null = null;

      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        if (token) {
          const { url, key } = supabaseEnv();
          const client = createSupabaseJs<Database>(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const { data } = await client.auth.getUser(token);
          if (data.user) {
            user = data.user;
            userClient = client;
          }
        }
      }

      if (!user) {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          user = data.user;
          userClient = supabase;
        }
      }

      if (!user || !userClient) {
        return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
      }

      const activeCheck = await verifyActiveAccount(userClient, user.id);
      if (!activeCheck.ok) return activeCheck.response;

      const consentCheck = await verifyAiIntelligenceConsent(userClient, user.id);
      if (!consentCheck.ok) return consentCheck.response;

      authenticatedUserId = user.id;
    }

    const snapshot = verifiedFarmCaller ? await getLiveFarmContextSnapshot(verifiedFarmCaller) : null;
    const activeCycle = snapshot?.domains.crop_identity_variety_and_stage.data?.activeCycles[0];

    const c = aiConfig();
    const result = await askGroundedAiAssistant({
      query: body.query?.trim() || "Please examine this crop photo and advise what to do.",
      // Always bind farmerId to the authenticated caller; never trust client-supplied farmerId
      context: {
        ...(body.context ?? {}),
        cropId: body.context?.cropId ?? activeCycle?.cropId,
        zone: body.context?.zone ?? snapshot?.farmZone ?? undefined,
        stageName: body.context?.stageName ?? activeCycle?.currentStage,
        farmerId: authenticatedUserId,
      } as FarmerContext,
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

    const traceId = randomUUID();
    if (verifiedFarmCaller && snapshot) {
      const executionOutcome = !result.passedSafetyGuardrail
        ? "blocked"
        : result.providerErrors.length > 0
          ? "fallback"
          : "completed";

      const audit = await recordAiAuditEvent(verifiedFarmCaller, {
        traceId,
        provider: mapAuditProvider(result.providerUsed),
        modelId: (result.modelUsed || "rule-engine").slice(0, 128),
        promptVersion: "assistant-v1",
        executionOutcome,
        guardrailResult: {
          status: result.passedSafetyGuardrail ? "passed" : "blocked",
          rule_ids: ["nafdac_chemical_guardrail"],
          reason_codes: result.passedSafetyGuardrail ? [] : ["prohibited_chemical"],
          blocked: !result.passedSafetyGuardrail,
        },
        contextRefs: snapshot.auditContextRefs,
        memoryItemIds: [],
      });

      if (!audit.ok) {
        return NextResponse.json({ error: "Unable to record AI audit trace." }, { status: 503 });
      }
    }

    if (result.providerErrors.length > 0) {
      logger.warn("ai_assistant_fallback", {
        provider: result.providerUsed,
        errors: result.providerErrors.length,
      });
    } else {
      logger.info("ai_assistant_ok", { provider: result.providerUsed, model: result.modelUsed });
    }

    return NextResponse.json(verifiedFarmCaller ? { ...result, traceId } : result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process AI request.";
    logger.error("ai_assistant_error", { message });
    return NextResponse.json({ error: "Failed to process AI request." }, { status: 500 });
  }
}
