"use server";

import { randomUUID } from "node:crypto";
import { askGroundedAiAssistant, type FarmerContext, type GroundedAiAssistantResponse } from "@cultivanode/shared";
import { requireAccount } from "@/lib/account/session";
import { aiConfig } from "@/lib/ai-config";
import { logger } from "@/lib/logger";

export type AssistantResponse = GroundedAiAssistantResponse;

/**
 * Web Farm Assistant Server Action (hardened in Batch 04.0-H):
 * - NEVER defaults an unidentified crop to "maize" or an unknown zone to "rainforest".
 * - Passes every response through both the NAFDAC chemical guardrail and the server-side
 *   numerical fertiliser prescription validator inside `askGroundedAiAssistant()`.
 * - Logs structured correlation & outcome metadata without logging raw prompt text.
 */
export async function askFarmAssistantAction(params: {
  query: string;
  context?: Omit<FarmerContext, "farmerId"> & { farmerId?: string };
  language?: "en" | "yo" | "pcm";
  imageBase64?: string;
  imageMimeType?: string;
}) {
  const account = await requireAccount(params.language === "yo" ? "yo" : "en");
  const query = typeof params.query === "string" ? params.query.trim().slice(0, 4000) : "";
  if (!query && !params.imageBase64) {
    throw new Error("Please enter a question or attach a photo.");
  }

  const traceId = randomUUID();
  const c = aiConfig();
  const cropId = typeof params.context?.cropId === "string" ? params.context.cropId.trim() : "";

  const result = await askGroundedAiAssistant({
    query: query || "Please examine this crop photo and advise what to do.",
    // Always bind farmerId to the signed-in account; NEVER invent a default cropId ("maize").
    context: {
      ...(params.context ?? {}),
      cropId,
      zone: params.context?.zone ?? ("derived_savanna" as FarmerContext["zone"]),
      farmerId: account.userId,
    },
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
