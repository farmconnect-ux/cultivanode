"use server";

import { askGroundedAiAssistant, type FarmerContext } from "@cultivanode/shared";
import { requireAccount } from "@/lib/account/session";
import { aiConfig } from "@/lib/ai-config";
import { logger } from "@/lib/logger";

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

  const c = aiConfig();
  const result = await askGroundedAiAssistant({
    query: query || "Please examine this crop photo and advise what to do.",
    // Always bind farmerId to the signed-in account
    context: { ...(params.context ?? {}), farmerId: account.userId },
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
  if (result.meta?.fallbackUsed) {
    logger.warn("ai_assistant_fallback", { provider: result.meta.provider, attempts: result.meta.attempts });
  } else {
    logger.info("ai_assistant_ok", { provider: result.meta?.provider, model: result.meta?.model });
  }
  return result;
}
