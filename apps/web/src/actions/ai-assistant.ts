"use server";

import { randomUUID } from "node:crypto";
import {
  FARM_ZONES,
  VALID_GROWTH_STAGES,
  askGroundedAiAssistant,
  type FarmerContext,
  type GroundedAiAssistantResponse,
  type VerifiedAgronomicFarmContext,
} from "@cultivanode/shared";
import type { User } from "@supabase/supabase-js";
import { requireAccount } from "@/lib/account/session";
import { aiConfig } from "@/lib/ai-config";
import { resolveServerVerifiedAgronomicContext } from "@/lib/farm-context/verified-agronomic-context.service";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type AssistantResponse = GroundedAiAssistantResponse;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Web Farm Assistant Server Action (hardened in Batch 04.0-H Revision 5):
 * - Authenticates the caller and verifies active (non-suspended) account status.
 * - NEVER trusts client-supplied `zone` or `stageName` as verified farm context.
 * - When `farmId` is provided, verifies farm ownership via the caller's RLS-scoped Supabase
 *   client and delegates to the exact same `resolveServerVerifiedAgronomicContext()` used by
 *   `POST /api/ai/assistant` (zero divergence).
 * - Rejects invalid or conflicting client `zone` / `stageName` assertions.
 * - When farm context is absent or unverified, passes `verifiedFarmContext: null` so numerical
 *   fertiliser prescriptions fail closed unconditionally.
 */
export async function askFarmAssistantAction(params: {
  query: string;
  context?: Omit<FarmerContext, "farmerId"> & { farmerId?: string };
  language?: "en" | "yo" | "pcm";
  imageBase64?: string;
  imageMimeType?: string;
}) {
  const account = await requireAccount(params.language === "yo" ? "yo" : "en");
  if (account.profile?.suspended_at) {
    throw new Error("Account is not active.");
  }

  const query = typeof params.query === "string" ? params.query.trim().slice(0, 4000) : "";
  if (!query && !params.imageBase64) {
    throw new Error("Please enter a question or attach a photo.");
  }

  const traceId = randomUUID();
  const c = aiConfig();
  const rawFarmId = typeof params.context?.farmId === "string" ? params.context.farmId.trim() : "";
  const rawPlotId = typeof params.context?.plotId === "string" ? params.context.plotId.trim() : "";
  const rawCropId = typeof params.context?.cropId === "string" ? params.context.cropId.trim() : "";
  const rawCycleId = typeof params.context?.cycleId === "string" ? params.context.cycleId.trim() : "";

  let resolvedZone: FarmerContext["zone"] = undefined;
  let resolvedStageName: string | undefined = undefined;
  let resolvedCropId = rawCropId;
  let resolvedPlotId: string | undefined = undefined;
  let resolvedFarmId: string | undefined = undefined;
  let verifiedFarmContext: VerifiedAgronomicFarmContext | null = null;

  if (rawFarmId) {
    if (!UUID_RE.test(rawFarmId)) {
      throw new Error("Invalid farmId format.");
    }
    if (rawPlotId && !UUID_RE.test(rawPlotId)) {
      throw new Error("Invalid plotId format.");
    }

    const supabase = await createClient();
    const { data: farm, error: farmErr } = await supabase
      .from("farms")
      .select("id")
      .eq("id", rawFarmId)
      .maybeSingle();

    if (farmErr || !farm) {
      throw new Error("Farm not found or access denied.");
    }

    const verifiedCtxRes = await resolveServerVerifiedAgronomicContext({
      caller: {
        user: { id: account.userId } as User,
        farmId: farm.id,
        client: supabase,
        verifiedAt: new Date().toISOString(),
      },
      assertions: {
        plotId: rawPlotId || undefined,
        cropId: rawCropId || undefined,
        cycleId: rawCycleId || undefined,
        zone: params.context?.zone,
        stageName: params.context?.stageName,
      },
    });

    if (verifiedCtxRes.conflict) {
      throw new Error(`[${verifiedCtxRes.code}] ${verifiedCtxRes.error}`);
    }

    resolvedFarmId = farm.id;
    resolvedPlotId = verifiedCtxRes.verifiedPlotId;
    resolvedZone = verifiedCtxRes.verifiedZone;
    resolvedStageName = verifiedCtxRes.verifiedGrowthStage;
    resolvedCropId = verifiedCtxRes.verifiedCropId ?? rawCropId;
    verifiedFarmContext = verifiedCtxRes.verifiedContext;
  } else {
    // No farmId: validate syntax of any client assertions to fail fast on garbage,
    // but NEVER elevate client-supplied zone or stageName to verified context.
    if (params.context?.zone !== undefined && String(params.context.zone).trim() !== "") {
      const candidateZone = String(params.context.zone).trim().toLowerCase();
      if (!(FARM_ZONES as readonly string[]).includes(candidateZone)) {
        throw new Error(`Invalid agro-ecological zone "${String(params.context.zone)}".`);
      }
    }
    if (params.context?.stageName !== undefined && params.context.stageName.trim() !== "") {
      const candidateStage = params.context.stageName.trim().toLowerCase();
      if (!VALID_GROWTH_STAGES.has(candidateStage)) {
        throw new Error(`Invalid crop growth stage "${params.context.stageName}".`);
      }
    }
    // Without a verified farm record, zone, stageName, and verifiedFarmContext remain unverified/null.
    resolvedZone = undefined;
    resolvedStageName = undefined;
    verifiedFarmContext = null;
  }

  const result = await askGroundedAiAssistant({
    query: query || "Please examine this crop photo and advise what to do.",
    context: {
      cropId: resolvedCropId,
      zone: resolvedZone,
      stageName: resolvedStageName,
      farmerId: account.userId,
      farmId: resolvedFarmId,
      plotId: resolvedPlotId,
      cycleId: verifiedFarmContext?.cropCycleId,
      requestId: traceId,
    },
    verifiedFarmContext,
    language: params.language ?? "en",
    imageBase64: params.imageBase64,
    imageMimeType: params.imageMimeType,
    anthropicApiKey: c.anthropicApiKey,
    claudeModels: c.claudeModels,
    geminiApiKey: c.geminiApiKey,
    openaiApiKey: c.openaiApiKey,
    primaryModel: c.primaryModel,
    fallbackModel: c.fallbackModel,
    timeoutMs: c.timeoutMs,
  });

  if (result.numericGuardrailBlocked) {
    logger.warn("ai_assistant_numeric_prescription_blocked", {
      traceId,
      provider: result.providerUsed,
      recommendationStatus: result.recommendationStatus,
      reasonCode: result.numericGuardrailReasonCode,
    });
  } else if (result.providerErrors.length > 0) {
    logger.warn("ai_assistant_fallback", {
      traceId,
      provider: result.providerUsed,
      errors: result.providerErrors.length,
      recommendationStatus: result.recommendationStatus,
    });
  } else {
    logger.info("ai_assistant_ok", {
      traceId,
      provider: result.providerUsed,
      model: result.modelUsed,
      recommendationStatus: result.recommendationStatus,
    });
  }
  return result;
}
