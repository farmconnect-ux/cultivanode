"use server";

import {
  askGroundedAiAssistant,
  type FarmerContext,
  type AppLanguage,
  type GroundedKnowledgeSnippet,
} from "@cultivanode/shared";
import { requireAccount } from "@/lib/account/session";
import { aiConfig } from "@/lib/ai-config";
import { logger } from "@/lib/logger";

export interface AskAssistantParams {
  query: string;
  context: FarmerContext;
  language?: AppLanguage | "pcm";
  imageBase64?: string;
  imageMimeType?: string;
}

export interface AssistantResponse {
  answer: string;
  language: AppLanguage | "pcm";
  providerUsed: "claude" | "gemini" | "openai" | "rule-engine";
  passedSafetyGuardrail: boolean;
  bannedChemicalsDetected: string[];
  approvedChemicalsDetected: string[];
  safetyAppendices: string[];
  sources: GroundedKnowledgeSnippet[];
}

export async function askFarmAssistantAction(
  params: AskAssistantParams
): Promise<AssistantResponse> {
  const lang = params.language ?? "en";
  await requireAccount(lang === "yo" ? "yo" : "en");

  const result = await askGroundedAiAssistant({
    query: params.query,
    context: params.context,
    language: lang,
    imageBase64: params.imageBase64,
    imageMimeType: params.imageMimeType,
    ...aiConfig(),
  });

  if (result.providerUsed === "rule-engine") logger.warn("ai_assistant_fallback", { reasons: result.providerErrors.join("; ") });
  else if (result.providerErrors.some((e) => !e.endsWith("no key"))) logger.info("ai_assistant_provider_skipped", { used: result.modelUsed, reasons: result.providerErrors.join("; ") });

  return {
    answer: result.answer,
    language: result.language,
    providerUsed: result.providerUsed,
    passedSafetyGuardrail: result.passedSafetyGuardrail,
    bannedChemicalsDetected: result.bannedChemicalsDetected,
    approvedChemicalsDetected: result.approvedChemicalsDetected,
    safetyAppendices: result.safetyAppendices,
    sources: result.sources,
  };
}
