import type { FarmerContext, GroundedPrompt, GuardrailCheckResult, GroundedKnowledgeSnippet } from './types';
import type { AppLanguage } from '../../roles';
import type { GroundedEvidencePackage } from '../memory-rag/types';
import type { AgriculturalRecommendationStatus, FertiliserRecommendation } from '../inputs/types';
import { buildGroundedPrompt } from './prompt-builder';
import { checkChemicalSafetyGuardrails } from './chemical-guardrail';
import {
  buildAmbiguousQueryClarification,
  buildSafeNonNumericalFertiliserGuidance,
  detectFertiliserIntent,
  validateAssistantNumericalOutput,
} from './fertiliser-safety';

export type AiProvider = 'claude' | 'gemini' | 'openai' | 'rule-engine';

export const DEFAULT_CLAUDE_MODELS = ['claude-sonnet-5-5', 'claude-haiku-5-5'];

export interface GroundedAiAssistantRequest {
  query: string;
  context: FarmerContext;
  groundedEvidence?: GroundedEvidencePackage | null;
  language?: AppLanguage | 'pcm';
  imageBase64?: string;
  imageMimeType?: string;
  /** Anthropic (Claude) API key. Claude is tried first when it is set. */
  anthropicApiKey?: string;
  /** Claude models, best first (defaults: claude-sonnet-5-5, then claude-haiku-5-5). */
  claudeModels?: string[];
  geminiApiKey?: string;
  openaiApiKey?: string;
  primaryModel?: string;
  fallbackModel?: string;
  timeoutMs?: number;
  /** Validated deterministic engine calculation, if one was run for this request (Batch 04.0-H). */
  approvedFertiliserCalculation?: FertiliserRecommendation | null;
}

export interface GroundedAiAssistantResponse {
  answer: string;
  language: AppLanguage | 'pcm';
  providerUsed: AiProvider;
  /** The exact model that answered (empty for the rule engine). */
  modelUsed: string;
  /** Why the AI providers were skipped or failed (for server logs; never shown to farmers). */
  providerErrors: string[];
  passedSafetyGuardrail: boolean;
  bannedChemicalsDetected: string[];
  approvedChemicalsDetected: string[];
  safetyAppendices: string[];
  sources: GroundedKnowledgeSnippet[];
  /** Batch 04.0-H recommendation contract status. */
  recommendationStatus: AgriculturalRecommendationStatus;
  /** True when server-side numeric validator blocked an unsupported numerical fertiliser prescription. */
  numericGuardrailBlocked: boolean;
  numericGuardrailReasonCode: string | null;
}

/**
 * Deterministic agronomic advisor responses grounded in South-West Nigeria GAP standards (IITA & NIHORT).
 * Used when offline, during network timeouts, or when LLM API keys are unavailable.
 */
export function generateAgronomicAdvisorAnswer(
  query: string,
  context: FarmerContext,
  lang: AppLanguage | 'pcm'
): string {
  const q = query.toLowerCase();

  // 1. Explicit check if user asks about banned chemical directly
  if (q.includes('paraquat') || q.includes('carbofuran') || q.includes('ddt') || q.includes('endosulfan')) {
    return `WARNING: The chemical mentioned (Paraquat / Carbofuran / DDT) is strictly BANNED by NAFDAC across Nigeria due to lethal toxicity and long-term soil hazards. Do not use this substance. For land clearing and weed control in ${context.cropId || 'crops'}, use approved glyphosate (for non-crop areas) or mechanical tillage / selective hoe weeding.`;
  }

  // 2. Fall Armyworm (FAW) on Maize (non-numerical label-directed guidance)
  if ((q.includes('armyworm') || q.includes('kokoro') || q.includes('faw')) && (context.cropId === 'maize' || q.includes('maize'))) {
    if (lang === 'yo') {
      return `Fun iṣakoso Kokoro Armyworm (Fall Armyworm) lori oko Àgbàdo rẹ:
1. Ṣayẹwo aarin ewe àgbàdo (whorl) ni kutukutu owurọ fun idọti kokoro (frass).
2. Lo oogun ti NAFDAC fọwọsi gẹgẹbi Emamectin Benzoate (Ampligo / Proclaim) ni ibamu pẹlu itọsọna iwọn lilo lori aami ọja (product label) ati itọsọna alamọran ogbin.
3. Fọ́n oogun naa taara sinu iho aarin ewe (funnel) nibi ti kokoro naa fi pamọ si.
4. Pa ofin NAFDAC mọ: Tẹle akoko idaduro ṣaaju ikore (PHI) ati akoko idaduro wiwọle (REI) lori aami oogun ki o si wọ aṣọ aabo (PPE).`;
    }
    if (lang === 'pcm') {
      return `To stop Fall Armyworm from destroying your Maize:
1. Check inside the maize leaf funnel early morning for their dirt and holes.
2. Spray NAFDAC-approved Emamectin benzoate (Ampligo or Proclaim) strictly following the product label rate and extension guidance.
3. Target the spray direct inside the center of the maize leaf where the caterpillar dey hide.
4. Obey NAFDAC rule: Follow the Pre-Harvest Interval (PHI) and Restricted-Entry Interval (REI) printed on the product label and wear full PPE.`;
    }
    return `To effectively manage Fall Armyworm (Spodoptera frugiperda) on your Maize crop:
1. Scouting: Inspect the leaf whorls (funnels) twice weekly in early morning for sawdust-like frass and windowpane feeding signs.
2. Approved Treatment: Apply a NAFDAC-registered Emamectin Benzoate product (e.g. Ampligo or Proclaim) strictly following the manufacturer label rate and local extension guidance.
3. Application Technique: Direct the spray nozzle directly into the central whorl of each maize plant where larvae conceal themselves.
4. Safety & Intervals: Follow the Pre-Harvest Interval (PHI) and Restricted-Entry Interval (REI) printed on the product label and always wear full personal protective equipment (PPE).`;
  }

  // 3. Fertiliser questions & ambiguous multilingual quantity queries (Batch 04.0-H: ADR-020)
  // NEVER emit hardcoded NPK/urea numerical rates, and NEVER false-trigger on Yoruba `iye`.
  const intent = detectFertiliserIntent(query);
  if (intent.intent === 'fertiliser') {
    return buildSafeNonNumericalFertiliserGuidance({
      cropId: context.cropId,
      language: lang,
      reasonCode: context.cropId ? 'deterministic_calculation_required' : 'crop_not_identified',
    });
  }
  if (intent.intent === 'ambiguous_quantity') {
    return buildAmbiguousQueryClarification(lang);
  }

  // 4. Weeding and Herbicide (non-numerical label-directed guidance)
  if (q.includes('weed') || q.includes('koriko') || q.includes('herbicide') || q.includes('clearing')) {
    if (lang === 'yo') {
      return `Eto Iṣakoso Koriko fun ${context.cropId || 'oko rẹ'}:
1. Ṣaaju ki irugbin to hu (Pre-emergence): Lo oogun koriko ti NAFDAC fọwọsi (gẹgẹbi Atrazine fun àgbàdo) ni ibamu pẹlu itọsọna iwọn lilo lori aami ọja lori ilẹ to tutu.
2. Maṣe lo Paraquat rárá - NAFDAC ti fofinde e patapata!
3. Nigbati irugbin ba ti hu: Ṣe itọju koriko pẹlu ọwọ ṣaaju ki koriko to gba agbara lori ohun ọgbin.`;
    }
    if (lang === 'pcm') {
      return `Weed control protocol for your ${context.cropId || 'crop'}:
1. Before seeds sprout: Use a NAFDAC-approved selective herbicide (such as Atrazine for maize) strictly following the product label rate on damp soil.
2. Never use Paraquat at all - NAFDAC don ban am completely for Nigeria!
3. After crops grow: Do timely manual hoe weeding before weeds block sun and nutrients from your crop.`;
    }
    return `Weed control guidelines for ${context.cropId || 'crops'} (NAFDAC & IITA compliant):
1. Pre-Emergence: Use a NAFDAC-registered selective herbicide (such as Atrazine for maize/sorghum) strictly according to the manufacturer label rate on damp soil.
2. Safety Warning: Do NOT use Paraquat — it is strictly prohibited and banned by NAFDAC nationwide.
3. Post-Emergence: Perform timely primary hoe weeding before canopy closure.`;
  }

  // 5. Default grounded GAP advice (NEVER invent an agro-ecological zone when context.zone is missing)
  const zoneLabelYo = context.zone ? context.zone : 'A ko ti fi idi agbegbe oju-ọjọ oko rẹ mulẹ (jọwọ jẹrisi agbegbe oko rẹ)';
  const zoneLabelPcm = context.zone ? context.zone : 'Farm agro-ecological zone never confirm yet (please confirm your farm zone)';
  const zoneLabelEn = context.zone ? context.zone : 'Not yet verified (please confirm your farm agro-ecological zone before site-specific prescriptions)';

  if (lang === 'yo') {
    return `Imọran Ogbin IITA/NIHORT fun ${context.cropId || 'ohun ogbin rẹ'}:
- Agbegbe oju-ọjọ (Zone): ${zoneLabelYo}.
- Rii daju pe o gbin irugbin ti o ni iwe-ẹri (certified seed/seedlings) lati yago fun arun.
- Tẹle ilana aaye gbigbin ti o peye ki o si ṣe idanwo ilẹ (soil test) lati mọ eto ajilẹ to yẹ.
- Kan si alamọran oko (Field Agent) CultivaNode fun atilẹyin afikun.`;
  }

  if (lang === 'pcm') {
    return `General IITA/NIHORT agricultural guidance for your ${context.cropId || 'crop'}:
- Agro-ecological Zone: ${zoneLabelPcm}.
- Always buy certified seeds and clean planting materials make disease no enter your farm.
- Follow proper spacing and test your soil for lab before applying any fertiliser rate.
- Talk to your CultivaNode Field Agent if you need tractor or spraying services.`;
  }

  return `General GAP Agronomic Guidance for ${context.cropId || 'your crop'}:
- Agro-Ecological Zone: ${zoneLabelEn}.
- Certified Planting Material: Use high-yielding, disease-resistant varieties vetted by IITA/NIHORT.
- Timely Operations: Follow your operations schedule for land preparation, soil-tested nutrient management, and pest scouting.
- Need mechanization? You can directly book tractors, ridgers, or spraying providers through your CultivaNode dashboard.`;
}

/**
 * Calls the Anthropic Messages API (Claude) with optional image input.
 */
async function callClaude(
  prompt: GroundedPrompt,
  imageBase64: string | undefined,
  mimeType: string,
  apiKey: string,
  model: string,
  timeoutMs: number
): Promise<string> {
  const content: Array<Record<string, unknown>> = [];
  if (imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: imageBase64.replace(/^data:[^;]+;base64,/, '') },
    });
  }
  content.push({ type: 'text', text: prompt.userPrompt });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        // No temperature: current Claude models reject it.
        system: prompt.systemPrompt,
        messages: [{ role: 'user', content }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Claude ${model} error status ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const answer = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
    if (!answer.trim()) throw new Error(`Empty response from Claude ${model}`);
    return answer.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls Google Gemini REST API with optional multimodal image support.
 */
async function callGemini(
  prompt: GroundedPrompt,
  imageBase64: string | undefined,
  mimeType: string,
  apiKey: string,
  model: string,
  timeoutMs: number
): Promise<string> {
  // The key goes in a header, not the URL, so it never lands in request logs.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: `${prompt.systemPrompt}\n\n${prompt.userPrompt}` }
  ];

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    });
  }

  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
      // Gemini 2.5 models "think" before answering and that counts against the output budget; without this a
      // long answer can come back empty. Advice answers don't need it.
      ...(model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini API error status ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const answer = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
    if (!answer) throw new Error('Empty response from Gemini');
    return answer.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls OpenAI Chat Completions REST API with optional multimodal vision support.
 */
async function callOpenAI(
  prompt: GroundedPrompt,
  imageBase64: string | undefined,
  mimeType: string,
  apiKey: string,
  model: string,
  timeoutMs: number
): Promise<string> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: prompt.userPrompt }
  ];

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${cleanBase64}`;
    userContent.push({
      type: 'image_url',
      image_url: { url: dataUri },
    });
  }

  const payload = {
    model: model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
    max_tokens: 1200,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI API error status ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const answer = data.choices?.[0]?.message?.content;
    if (!answer) throw new Error('Empty response from OpenAI');
    return answer.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Orchestrates grounded AI generation: Claude (Sonnet, then Haiku) -> Gemini -> OpenAI -> Rule Engine.
 * Enforces mandatory NAFDAC chemical safety guardrails on the final generated text.
 */
export async function askGroundedAiAssistant(
  params: GroundedAiAssistantRequest
): Promise<GroundedAiAssistantResponse> {
  const lang = params.language ?? 'en';
  const timeoutMs = params.timeoutMs ?? 20000;
  const mimeType = params.imageMimeType ?? 'image/jpeg';

  const groundedPrompt = buildGroundedPrompt(params.query, params.context, lang, params.groundedEvidence);

  let rawAnswer = '';
  let providerUsed: AiProvider = 'rule-engine';
  let modelUsed = '';
  const providerErrors: string[] = [];
  const reason = (e: unknown) => (e instanceof Error ? (e.name === 'AbortError' ? 'timeout' : e.message) : 'unknown').slice(0, 160);
  if (!params.anthropicApiKey) providerErrors.push('claude: no key');
  if (!params.geminiApiKey) providerErrors.push('gemini: no key');
  if (!params.openaiApiKey) providerErrors.push('openai: no key');

  // 1. Claude: the best model first, then the faster, cheaper one.
  if (params.anthropicApiKey) {
    for (const model of params.claudeModels?.length ? params.claudeModels : DEFAULT_CLAUDE_MODELS) {
      try {
        rawAnswer = await callClaude(groundedPrompt, params.imageBase64, mimeType, params.anthropicApiKey, model, timeoutMs);
        providerUsed = 'claude';
        modelUsed = model;
        break;
      } catch (e) {
        providerErrors.push(`claude ${model}: ${reason(e)}`);
        rawAnswer = '';
      }
    }
  }

  // 2. Gemini
  if (!rawAnswer && params.geminiApiKey) {
    try {
      rawAnswer = await callGemini(
        groundedPrompt,
        params.imageBase64,
        mimeType,
        params.geminiApiKey,
        params.primaryModel || 'gemini-flash-latest',
        timeoutMs
      );
      providerUsed = 'gemini';
      modelUsed = params.primaryModel || 'gemini-flash-latest';
    } catch (e) {
      providerErrors.push(`gemini: ${reason(e)}`);
      rawAnswer = '';
    }
  }

  // 3. OpenAI
  if (!rawAnswer && params.openaiApiKey) {
    try {
      rawAnswer = await callOpenAI(
        groundedPrompt,
        params.imageBase64,
        mimeType,
        params.openaiApiKey,
        params.fallbackModel || 'gpt-4o-mini',
        timeoutMs
      );
      providerUsed = 'openai';
      modelUsed = params.fallbackModel || 'gpt-4o-mini';
    } catch (e) {
      providerErrors.push(`openai: ${reason(e)}`);
      rawAnswer = '';
    }
  }

  // 4. Fallback to deterministic agronomic advisor
  if (!rawAnswer) {
    rawAnswer = generateAgronomicAdvisorAnswer(params.query, params.context, lang);
    providerUsed = 'rule-engine';
  }

  // 5. Pass output through mandatory NAFDAC chemical safety guardrails
  const guardrailResult: GuardrailCheckResult = checkChemicalSafetyGuardrails(rawAnswer);

  // 6. Pass output through server-side numerical application validator (Batch 04.0-H Revision 2)
  // Numerical source-information quotation remains disabled here (`verifiedSourceQuote: null`)
  // until the evidence package carries verified licence permissions and Section 8 attribution.
  const numericValidation = validateAssistantNumericalOutput(guardrailResult.sanitizedResponseText, {
    cropId: params.context.cropId,
    farmId: params.context.farmId ?? params.groundedEvidence?.verifiedCurrentFarmFacts?.farmId ?? null,
    plotId: params.context.plotId ?? null,
    requestId: params.context.requestId ?? null,
    zone: params.context.zone ?? params.groundedEvidence?.verifiedCurrentFarmFacts?.farmZone ?? null,
    growthStage: params.context.stageName ?? null,
    language: lang,
    approvedCalculation: params.approvedFertiliserCalculation ?? null,
    verifiedSourceQuote: null,
  });

  const finalPassed = guardrailResult.passed && numericValidation.passed;
  const finalAnswer = guardrailResult.passed ? numericValidation.sanitizedText : guardrailResult.sanitizedResponseText;

  return {
    answer: finalAnswer,
    language: lang,
    providerUsed,
    modelUsed,
    providerErrors,
    passedSafetyGuardrail: finalPassed,
    bannedChemicalsDetected: guardrailResult.bannedChemicalsDetected,
    approvedChemicalsDetected: guardrailResult.approvedChemicalsDetected,
    safetyAppendices: guardrailResult.safetyAppendices,
    sources: groundedPrompt.contextSources,
    recommendationStatus: numericValidation.recommendationStatus,
    numericGuardrailBlocked: !numericValidation.passed,
    numericGuardrailReasonCode: numericValidation.reasonCode,
  };
}
