import type { AppLanguage } from '../../roles';
import type { AgriculturalRecommendationStatus, FertiliserRecommendation } from '../inputs/types';
import { isSupportedFertiliserCrop } from '../inputs/fertiliser';

/**
 * CultivaNode Batch 04.0-H — Multilingual Fertiliser Intent Detection & Server-Side
 * Numerical Fertiliser Prescription Validator (ADR-016, ADR-020).
 *
 * Key invariants:
 * - Fixes the Yoruba `iye` substring false trigger: ordinary Yoruba questions containing
 *   `iye` ("price / how many / number / life") NEVER trigger fertiliser advice.
 * - Ambiguous multilingual queries request clarification instead of emitting rates.
 * - Server-side numerical validation blocks ANY farm-specific numerical fertiliser
 *   prescription in an LLM or rule-engine response unless backed by a validated
 *   deterministic engine calculation (`approvedCalculation`).
 */

export type QueryIntentClassification =
  | { intent: 'fertiliser'; confidence: 'high'; matchedTerm: string }
  | { intent: 'ambiguous_quantity'; needsClarification: true; reason: string }
  | { intent: 'other' };

// Explicit whole-word / phrase fertiliser indicators across English, Nigerian English,
// Yoruba (ajile/ajilẹ/àjílẹ̀), Hausa (takin zamani), Igbo (nri ala), and Pidgin.
const EXPLICIT_FERTILISER_INTENT_RE =
  /(?:^|[\s,.;:!?("'/-])(fertilis(?:er|ers|ing|ation)|fertiliz(?:er|ers|ing|ation)|npk(?:\s*\d{1,2}[:\-]\d{1,2}[:\-]\d{1,2})?|urea|dap|ssp|mop|top[- ]?dress(?:ing)?|basal\s+(?:application|fertilis\w*|fertiliz\w*)|side[- ]?dress(?:ing)?|ajil[eẹ]|àjílẹ̀|aajil[eẹ]|takin\s+zamani|nri\s+ala|manure\s+rate)(?=$|[\s,.;:!?)"'/-])/i;

// Ambiguous quantity-only questions (e.g. Yoruba "iye" without a fertiliser/crop-rate noun,
// or bare "how many bags" without specifying fertiliser vs harvest vs seed).
const AMBIGUOUS_QUANTITY_RE =
  /(?:^|[\s,.;:!?("'/-])(iye(?:\s+wo)?|elo\s+ni\s+iye|how\s+many\s+bags\b|how\s+much\s+should\s+i\s+apply\b)(?=$|[\s,.;:!?)"'/-])/i;

// Non-fertiliser Yoruba price/count contexts where `iye` clearly means price/cost/count
const YORUBA_PRICE_OR_COUNT_RE =
  /(?:^|[\s,.;:!?("'/-])(owo|ọjà|oja|tita|ra|ẹyin|eyin|iṣu|isu|ẹ̀fọ́|efo|agbado\s+ni\s+ọja|price|cost|sell|market)(?=$|[\s,.;:!?)"'/-])/i;

export function detectFertiliserIntent(query: string): QueryIntentClassification {
  const normalized = (query ?? '').trim();
  if (!normalized) return { intent: 'other' };

  const fertMatch = normalized.match(EXPLICIT_FERTILISER_INTENT_RE);
  if (fertMatch?.[1]) {
    return { intent: 'fertiliser', confidence: 'high', matchedTerm: fertMatch[1].trim() };
  }

  // Ordinary Yoruba price/market queries containing `iye` are NOT fertiliser questions.
  if (YORUBA_PRICE_OR_COUNT_RE.test(normalized)) {
    return { intent: 'other' };
  }

  // Bare ambiguous quantity questions (e.g. "iye melo ni mo le lo?" without naming fertiliser/chemical)
  if (AMBIGUOUS_QUANTITY_RE.test(normalized)) {
    return {
      intent: 'ambiguous_quantity',
      needsClarification: true,
      reason: 'Query asks about a quantity or amount without specifying whether it refers to fertiliser, seed, harvest, or price.',
    };
  }

  return { intent: 'other' };
}

export interface NumericPrescriptionValidationResult {
  passed: boolean;
  recommendationStatus: AgriculturalRecommendationStatus;
  reasonCode: string | null;
  detectedRateSnippets: string[];
  sanitizedText: string;
}

// Detects numerical fertiliser rate / bag / dosage prescriptions in English, Pidgin, and Yoruba.
const FERTILISER_CONTEXT_RE =
  /\b(npk|urea|dap|ssp|mop|fertilis(?:er|ers)|fertiliz(?:er|ers)|ajil[eẹ]|àjílẹ̀|nitrogen|phosphorus|potassium|basal|top[- ]?dress|side[- ]?dress|limestone|lime)\b/i;

const RATE_NUMBER_PATTERNS: readonly RegExp[] = [
  /\b\d+(?:\.\d+)?(?:\s*[-–to]+\s*\d+(?:\.\d+)?)?\s*(?:kg\/ha|kg\s+per\s+(?:ha|hectare|acre)|kg\/hectare|kg\/acre|bags?\/ha|bags?\s*(?:of\s*50\s*kg\s*)?(?:per|\/)\s*(?:ha|hectare|acre)|tonnes?\/ha|t\/ha|g\/plant|g\s+per\s+(?:plant|stand))\b/gi,
  /(?:npk\s*\d{1,2}[:\-]\d{1,2}[:\-]\d{1,2}|urea(?:\s*\(46%\s*n\))?)\s*(?:at|@|:|-)?\s*\d+(?:\.\d+)?(?:\s*[-–to]+\s*\d+(?:\.\d+)?)?\s*(?:kg|bags?|g)\b/gi,
  /\bbáàgì\s+(?:kan|meji|mẹta|mẹrin|marun|mẹfa|\d+)/gi,
];

// Explicit disclosure marker required if a licensed general source quotation includes a number
const EXPLICIT_SOURCE_INFO_DISCLOSURE_RE =
  /(general\s+published\s+source\s+information|published\s+source\s+reference|not\s+a\s+farm[- ]specific\s+prescription)/i;

export function buildSafeNonNumericalFertiliserGuidance(params: {
  cropId?: string | null;
  language: AppLanguage | 'pcm';
  reasonCode: string;
}): string {
  const cropLabel = params.cropId?.trim() || '';
  const isUnsupported = cropLabel ? !isSupportedFertiliserCrop(cropLabel) : false;

  if (params.language === 'yo') {
    if (!cropLabel) {
      return (
        'A ko le fun yin ni iye ajilẹ (kg/ha tabi báàgì) laisi mimọ irugbin ti ẹ n gbin ati abajade idanwo ilẹ (lab soil test). ' +
        'Jọwọ darukọ irugbin rẹ ki o si ṣe idanwo ilẹ tabi kan si alamọran ogbin (extension agent) fun imọran to peye.'
      );
    }
    if (isUnsupported) {
      return (
        `CultivaNode ko ni ilana ajilẹ ti a fọwọsi (approved fertiliser protocol) fun ${cropLabel} lọwọlọwọ, nitorinaa a ko le fun yin ni iye ajilẹ (kg/ha tabi báàgì). ` +
        'A ko lo ilana àgbàdo fun irugbin miran. Jọwọ ṣe idanwo ilẹ (laboratory soil test) ki o si kan si alamọran ogbin.'
      );
    }
    return (
      `Lati fun yin ni iye ajilẹ to peye fun ${cropLabel}, CultivaNode nilo abajade idanwo ilẹ (laboratory soil test) ati iṣiro lati inu ẹrọ ajilẹ ti a fọwọsi. ` +
      'Jọwọ ṣe idanwo ilẹ (pH, organic matter, P, K) ki o si kan si alamọran ogbin tabi lo ẹrọ iṣiro ajilẹ pẹlu abajade ilẹ rẹ.'
    );
  }

  if (params.language === 'pcm') {
    if (!cropLabel) {
      return (
        'CultivaNode no fit give you exact fertilizer rate (kg/ha or bags) without knowing your exact crop and lab soil test. ' +
        'Please tell us the crop you dey plant and do laboratory soil test or talk to certified extension agent.'
      );
    }
    if (isUnsupported) {
      return (
        `CultivaNode never get approved fertilizer protocol for ${cropLabel}, so we no go give you exact kg/ha or bags rate. ` +
        'We no dey use maize rate for another crop. Please do laboratory soil test and consult qualified agronomist or extension agent.'
      );
    }
    return (
      `Before CultivaNode fit give exact fertilizer rate for ${cropLabel}, we need your laboratory soil test (pH, organic matter, phosphorus, potassium) run through the verified fertiliser calculator. ` +
      'Please test your soil for lab or contact a qualified extension agent.'
    );
  }

  if (!cropLabel) {
    return (
      'CultivaNode cannot provide a farm-specific numerical fertiliser prescription without knowing your crop identity and a laboratory-confirmed soil test. ' +
      'Please specify your crop and consult a qualified agronomist or run a laboratory soil analysis.'
    );
  }
  if (isUnsupported) {
    return (
      `No approved CultivaNode fertiliser protocol is currently available for ${cropLabel}, so a numerical farm-specific fertiliser prescription cannot be generated. ` +
      `CultivaNode does not substitute maize or generic NPK/urea rates for ${cropLabel}. ` +
      'For safe nutrient management, obtain a laboratory soil test (pH, organic matter, P, K) and consult a qualified agronomist or extension agent.'
    );
  }
  return (
    `A farm-specific numerical fertiliser prescription for ${cropLabel} requires a laboratory-confirmed soil test (pH, organic matter, available phosphorus, exchangeable potassium with units and extraction method) validated through CultivaNode's deterministic fertiliser engine. ` +
    'Please provide a current lab soil report or consult a qualified extension agent for site-specific guidance.'
  );
}

export function buildAmbiguousQueryClarification(language: AppLanguage | 'pcm'): string {
  if (language === 'yo') {
    return (
      'Jọwọ ṣe alaye ibeere rẹ daradara: ṣe o n beere nipa iye owo ọja, iye ikore, tabi eto ajilẹ/oogun fun irugbin kan pato? ' +
      'Darukọ irugbin rẹ ati ohun ti o fẹ mọ ki a le ran yin lọwọ daradara.'
    );
  }
  if (language === 'pcm') {
    return (
      'Abeg clarify wetin you dey ask: you dey ask about market price, harvest bags, or fertilizer/chemical for one specific crop? ' +
      'Tell us the exact crop and wetin you need so we fit advise you well.'
    );
  }
  return (
    'Could you clarify your question? Please specify the exact crop and whether you are asking about market pricing, expected yield, or a soil-tested nutrient management plan.'
  );
}

/**
 * Server-side numerical fertiliser prescription validator (ADR-016, ADR-020).
 *
 * Blocks any numerical fertiliser rate/dose/bag prescription in LLM or rule-engine output
 * unless:
 * 1. An `approvedCalculation` from the deterministic engine was supplied AND the crop is supported, OR
 * 2. `allowSourceInformationQuote` is true AND the response explicitly labels the figure as
 *    general published source information (not a farm-specific prescription).
 */
export function validateAssistantNumericalOutput(
  rawAnswer: string,
  options: {
    cropId?: string | null;
    language: AppLanguage | 'pcm';
    approvedCalculation?: FertiliserRecommendation | null;
    allowSourceInformationQuote?: boolean;
  },
): NumericPrescriptionValidationResult {
  const hasFertiliserContext = FERTILISER_CONTEXT_RE.test(rawAnswer);
  if (!hasFertiliserContext) {
    return {
      passed: true,
      recommendationStatus: 'general_guidance',
      reasonCode: null,
      detectedRateSnippets: [],
      sanitizedText: rawAnswer,
    };
  }

  const detectedRateSnippets: string[] = [];
  for (const pattern of RATE_NUMBER_PATTERNS) {
    const matches = rawAnswer.match(pattern);
    if (matches) {
      detectedRateSnippets.push(...matches);
    }
  }

  if (detectedRateSnippets.length === 0) {
    return {
      passed: true,
      recommendationStatus: 'general_guidance',
      reasonCode: null,
      detectedRateSnippets: [],
      sanitizedText: rawAnswer,
    };
  }

  // Case 1: Backed by a validated deterministic engine calculation for a supported crop
  if (
    options.approvedCalculation &&
    isSupportedFertiliserCrop(options.approvedCalculation.cropId) &&
    (!options.cropId || options.cropId.trim().toLowerCase() === options.approvedCalculation.cropId.toLowerCase())
  ) {
    return {
      passed: true,
      recommendationStatus: 'approved_calculation',
      reasonCode: null,
      detectedRateSnippets,
      sanitizedText: rawAnswer,
    };
  }

  // Case 2: Explicitly labelled, licensed general published source information (never a farm prescription)
  if (options.allowSourceInformationQuote && EXPLICIT_SOURCE_INFO_DISCLOSURE_RE.test(rawAnswer)) {
    return {
      passed: true,
      recommendationStatus: 'source_information',
      reasonCode: null,
      detectedRateSnippets,
      sanitizedText: rawAnswer,
    };
  }

  // Fail closed: block unsupported numerical fertiliser prescription
  const cropId = options.cropId?.trim() || '';
  const recommendationStatus: AgriculturalRecommendationStatus = !cropId
    ? 'insufficient_evidence'
    : !isSupportedFertiliserCrop(cropId)
      ? 'unsupported_crop'
      : 'insufficient_evidence';

  const reasonCode = !cropId
    ? 'crop_not_identified'
    : !isSupportedFertiliserCrop(cropId)
      ? 'crop_not_supported'
      : 'unsupported_numerical_fertiliser_prescription';

  return {
    passed: false,
    recommendationStatus,
    reasonCode,
    detectedRateSnippets,
    sanitizedText: buildSafeNonNumericalFertiliserGuidance({
      cropId,
      language: options.language,
      reasonCode,
    }),
  };
}
