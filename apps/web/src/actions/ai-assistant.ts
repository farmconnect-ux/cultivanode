"use server";

import {
  askGroundedAiAssistant,
  type FarmerContext,
  type AppLanguage,
  type GroundedKnowledgeSnippet,
} from "@cultivanode/shared";
import { requireAccount } from "@/lib/account/session";
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
  providerUsed: "gemini" | "openai" | "rule-engine";
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

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const primaryModel = process.env.AI_PRIMARY_MODEL || "gemini-2.5-flash";
  const fallbackModel = process.env.AI_FALLBACK_MODEL || "gpt-4o-mini";
  const timeoutMs = process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : 20000;

  const result = await askGroundedAiAssistant({
    query: params.query,
    context: params.context,
    language: lang,
    imageBase64: params.imageBase64,
    imageMimeType: params.imageMimeType,
    geminiApiKey,
    openaiApiKey,
    primaryModel,
    fallbackModel,
    timeoutMs,
  });

  if (result.providerUsed === "rule-engine") logger.warn("ai_assistant_fallback", { reasons: result.providerErrors.join("; ") });

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
