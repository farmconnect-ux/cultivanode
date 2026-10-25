import type { FarmerContext, GroundedPrompt, GuardrailCheckResult, GroundedKnowledgeSnippet } from './types';
import type { AppLanguage } from '../../roles';
import { buildGroundedPrompt } from './prompt-builder';
import { checkChemicalSafetyGuardrails } from './chemical-guardrail';

export interface GroundedAiAssistantRequest {
  query: string;
  context: FarmerContext;
  language?: AppLanguage | 'pcm';
  imageBase64?: string;
  imageMimeType?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  primaryModel?: string;
  fallbackModel?: string;
  timeoutMs?: number;
}

export interface GroundedAiAssistantResponse {
  answer: string;
  language: AppLanguage | 'pcm';
  providerUsed: 'gemini' | 'openai' | 'rule-engine';
  passedSafetyGuardrail: boolean;
  bannedChemicalsDetected: string[];
  approvedChemicalsDetected: string[];
  safetyAppendices: string[];
  sources: GroundedKnowledgeSnippet[];
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

  // 2. Fall Armyworm (FAW) on Maize
  if ((q.includes('armyworm') || q.includes('kokoro') || q.includes('faw')) && (context.cropId === 'maize' || q.includes('maize'))) {
    if (lang === 'yo') {
      return `Fun iṣakoso Kokoro Armyworm (Fall Armyworm) lori oko Àgbàdo rẹ:
1. Ṣayẹwo aarin ewe àgbàdo (whorl) ni kutukutu owurọ fun idọti kokoro (frass).
2. Lo oogun ti a fọwọsi gẹgẹbi Emamectin Benzoate (Ampligo / Proclaim) ni iwọn 250g fun hektari kan (tabi 15-20ml ninu knapsack sprayer 16L).
3. Fọ́n oogun naa taara sinu iho aarin ewe (funnel) nibi ti kokoro naa fi pamọ si.
4. Pa ofin NAFDAC mọ: Akoko idaduro ṣaaju ikore (PHI) jẹ ọjọ meje (7 days). Maṣe jẹ ki ẹranko tabi eniyan wọle si oko laarin wakati mejila (12 hours REI).`;
    }
    if (lang === 'pcm') {
      return `To stop Fall Armyworm from destroying your Maize:
1. Check inside the maize leaf funnel early morning for their dirt and holes.
2. Spray approved chemical like Emamectin benzoate (Ampligo or Proclaim) with 250g per hectare or 15-20ml inside one 16L knapsack sprayer.
3. Target the spray direct inside the center of the maize leaf where the caterpillar dey hide.
4. Obey NAFDAC rule: Make you wait 7 days before harvest (PHI 7 days), and nobody must enter the farm for 12 hours after spraying (REI 12 hours).`;
    }
    return `To effectively manage Fall Armyworm (Spodoptera frugiperda) on your Maize crop:
1. Scouting: Inspect the leaf whorls (funnels) twice weekly in early morning for sawdust-like frass and windowpane feeding signs.
2. Approved Treatment: Apply Emamectin Benzoate (e.g. Ampligo or Proclaim 5 SG) at 250g/ha (or 15-20ml per 16-litre knapsack).
3. Application Technique: Direct the spray nozzle directly into the central whorl of each maize plant where larvae conceal themselves.
4. Safety & Intervals: Pre-Harvest Interval (PHI) is 7 days. Restricted-Entry Interval (REI) is 12 hours. Always wear full personal protective equipment (PPE).`;
  }

  // 3. Fertiliser questions
  if (q.includes('fertiliser') || q.includes('fertilizer') || q.includes('npk') || q.includes('urea') || q.includes('ajile') || q.includes('iye')) {
    if (lang === 'yo') {
      return `Eto Ajilẹ ti o peye fun ${context.cropId ?? 'oko rẹ'} ni South-West Nigeria:
1. Ajilẹ Ibẹrẹ (Basal): Lo NPK 15:15:15 (báàgì mẹrin si mẹfa fun hektari kan) lakoko gbigbin tabi ọsẹ meji lẹhin gbigbin.
2. Ajilẹ Ekeji (Top-dressing): Lo Urea (46% N) báàgì meji si mẹta fun hektari kan ni ọsẹ mẹrin si mẹfa (4-6 weeks) nigbati ohun ọgbin ba n ga de ekun.
3. Rii daju pe ilẹ tutu ṣaaju ki o to fi ajilẹ si, ki o si bo o pẹlu iye erupẹ diẹ lati dẹkun pipadanu nitrogen.`;
    }
    if (lang === 'pcm') {
      return `Correct Fertiliser guide for your ${context.cropId ?? 'farm'} for South-West Nigeria:
1. First Fertiliser (Basal): Put NPK 15:15:15 (around 4 to 6 bags per hectare) during planting or 2 weeks after planting. Put am 5cm away from the crop stem.
2. Second Fertiliser (Top-dressing): Put Urea (46% Nitrogen) 2 to 3 bags per hectare at 4 to 6 weeks when the plant reach knee height.
3. Make sure the soil get small water before you put fertilizer, and cover am small with sand make sun no blow the nitrogen go.`;
    }
    return `Scientifically grounded fertiliser protocol for ${context.cropId ?? 'crops'} in South-West Nigeria:
1. Basal Application: Apply NPK 15:15:15 at 200–300 kg/ha (4–6 bags of 50kg per hectare) at planting or 10–14 days after emergence. Place fertiliser 5cm away from seed/stem in a ring or band.
2. Top-Dressing: Side-dress Urea (46% N) at 100–150 kg/ha (2–3 bags/ha) at vegetative knee-high stage (4–6 weeks after planting).
3. Moisture Requirement: Apply fertiliser only on moist soil and lightly incorporate into topsoil to prevent volatile nitrogen losses.`;
  }

  // 4. Weeding and Herbicide
  if (q.includes('weed') || q.includes('koriko') || q.includes('herbicide') || q.includes('clearing')) {
    if (lang === 'yo') {
      return `Eto Iṣakoso Koriko fun ${context.cropId ?? 'oko rẹ'}:
1. Ṣaaju ki irugbin to hu (Pre-emergence): Lo Atrazine 500 SC (lita 3 fun hektari kan) fun oko àgbàdo lori ilẹ to tutu.
2. Maṣe lo Paraquat rárá - NAFDAC ti fofinde e patapata!
3. Nigbati irugbin ba ti hu: Ṣe itọju koriko pẹlu ọwọ tabi ṣaaju ki koriko to gba agbara lori ohun ọgbin ni ọsẹ 3 si 4 lẹhin gbigbin.`;
    }
    if (lang === 'pcm') {
      return `Weed control protocol for your ${context.cropId ?? 'crop'}:
1. Before seeds sprout: Spray approved selective herbicide like Atrazine 500 SC (3 litres per hectare) on wet ground.
2. Never use Paraquat at all - NAFDAC don ban am completely for Nigeria!
3. After crops grow: Do manual hoe weeding around 3 to 4 weeks before the weed block sun and fertilizer from your crop.`;
    }
    return `Weed control guidelines for ${context.cropId ?? 'crops'} (NAFDAC & IITA compliant):
1. Pre-Emergence: For maize/sorghum, apply Atrazine 500 SC at 3.0 L/ha on damp soil within 48 hours of planting.
2. Safety Warning: Do NOT use Paraquat — it is strictly prohibited and banned by NAFDAC nationwide.
3. Post-Emergence: Perform primary hoe weeding between 21–28 days after planting before canopy closure.`;
  }

  // 5. Default grounded GAP advice
  if (lang === 'yo') {
    return `Imọran Ogbin IITA/NIHORT fun ${context.cropId ?? 'ohun ogbin rẹ'}:
- Zone: South-West Agro-ecological Zone (${context.zone ?? 'Rainforest / Derived Savanna'}).
- Rii daju pe o gbin irugbin ti o ni iwe-ẹri (certified seed/seedlings) lati yago fun arun.
- Tẹle ilana aaye gbigbin ti o peye ki o si ṣe idanwo ilẹ (soil test) lati mọ iye ajilẹ to yẹ.
- Kan si alamọran oko (Field Agent) CultivaNode fun atilẹyin afikun.`;
  }

  if (lang === 'pcm') {
    return `Official IITA/NIHORT agricultural advice for your ${context.cropId ?? 'crop'}:
- Zone: South-West Agro-ecological Zone (${context.zone ?? 'Rainforest / Derived Savanna'}).
- Always buy certified seeds and clean planting materials make disease no enter your farm.
- Follow proper spacing and test your soil so you go know the exact bags of fertilizer wey your farm need.
- Talk to your CultivaNode Field Agent if you need tractor or spraying services.`;
  }

  return `GAP Agronomic Advisory for ${context.cropId ?? 'your crop'} in South-West Nigeria:
- Agro-Ecological Suitability: Calibrated for ${context.zone ?? 'Rainforest / Derived Savanna'} conditions.
- Certified Planting Material: Use high-yielding, disease-resistant varieties vetted by IITA/NIHORT.
- Timely Operations: Adhere strictly to the operations schedule for land prep, basal fertiliser, and pest scouting.
- Need mechanization? You can directly book tractors, ridgers, or spraying providers through your CultivaNode dashboard.`;
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

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
      maxOutputTokens: 1200,
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
 * Orchestrates grounded AI generation across Gemini (primary) -> OpenAI (fallback) -> Rule Engine.
 * Enforces mandatory NAFDAC chemical safety guardrails on the final generated text.
 */
export async function askGroundedAiAssistant(
  params: GroundedAiAssistantRequest
): Promise<GroundedAiAssistantResponse> {
  const lang = params.language ?? 'en';
  const timeoutMs = params.timeoutMs ?? 20000;
  const mimeType = params.imageMimeType ?? 'image/jpeg';

  const groundedPrompt = buildGroundedPrompt(params.query, params.context, lang);

  let rawAnswer = '';
  let providerUsed: 'gemini' | 'openai' | 'rule-engine' = 'rule-engine';

  // 1. Try Primary: Gemini
  if (params.geminiApiKey) {
    try {
      rawAnswer = await callGemini(
        groundedPrompt,
        params.imageBase64,
        mimeType,
        params.geminiApiKey,
        params.primaryModel || 'gemini-2.5-flash',
        timeoutMs
      );
      providerUsed = 'gemini';
    } catch {
      rawAnswer = '';
    }
  }

  // 2. Try Fallback: OpenAI
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
    } catch {
      rawAnswer = '';
    }
  }

  // 3. Fallback to deterministic agronomic advisor
  if (!rawAnswer) {
    rawAnswer = generateAgronomicAdvisorAnswer(params.query, params.context, lang);
    providerUsed = 'rule-engine';
  }

  // 4. Pass output through mandatory NAFDAC chemical safety guardrails
  const guardrailResult: GuardrailCheckResult = checkChemicalSafetyGuardrails(rawAnswer);

  return {
    answer: guardrailResult.sanitizedResponseText,
    language: lang,
    providerUsed,
    passedSafetyGuardrail: guardrailResult.passed,
    bannedChemicalsDetected: guardrailResult.bannedChemicalsDetected,
    approvedChemicalsDetected: guardrailResult.approvedChemicalsDetected,
    safetyAppendices: guardrailResult.safetyAppendices,
    sources: groundedPrompt.contextSources,
  };
}
