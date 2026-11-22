import type { AppLanguage } from '../../roles';
import type { AgriculturalRecommendationStatus, FertiliserRecommendation } from '../inputs/types';
import { isSupportedFertiliserCrop, isTrustedFertiliserCalculation } from '../inputs/fertiliser';

/**
 * Module-private unforgeable brand symbol for trusted source quotations.
 * No production factory currently mints this symbol because Batch 04.1 source
 * registry verification is not yet implemented. Consequently, NO caller-supplied
 * plain object can activate the numerical source-quotation pathway in production.
 */
const TRUSTED_SOURCE_QUOTE_BRAND = Symbol('cultivanode.trusted_source_quotation');

/**
 * Test-only helper for unit testing Section 2 metadata checks on branded source quotes.
 * Refuses to execute outside test runtime and is NOT exported from `@cultivanode/shared`.
 * @internal
 */
export function __mintTestVerifiedSourceQuote(
  quote: VerifiedSourceQuotationContext,
): VerifiedSourceQuotationContext {
  if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
    throw new Error('Test source-quotation helper is strictly forbidden outside test runtime.');
  }
  const branded = { ...quote };
  Object.defineProperty(branded, TRUSTED_SOURCE_QUOTE_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return branded;
}

/**
 * CultivaNode Batch 04.0-H (Revision 2) — Multilingual Fertiliser Intent Detection,
 * Deterministic Calculation Formatter, and Server-Side Numerical Output Validator.
 *
 * Security & Safety Invariants (ADR-016, ADR-020):
 * - Fixes the Yoruba `iye` substring false trigger: ordinary Yoruba market/price queries
 *   containing `iye` NEVER trigger fertiliser advice.
 * - Ambiguous multilingual queries request clarification instead of emitting rates.
 * - Checks ALL numerical agricultural application quantities (kg/ha, kg/acre, bags, tonnes/ha,
 *   g/plant, L/ha, ml/L, concentrations, multilingual units) even when explicit NPK/fertiliser
 *   keywords are omitted, while distinguishing legitimate market prices, harvest yields, and
 *   inventory counts on a per-clause basis.
 * - Binds any permitted numerical recommendation to an independently `agronomist_approved`
 *   deterministic calculation matching crop, farm, plot, request, zone, protocol version,
 *   product identity, nutrient composition, kg/ha, total kg, bags, units, timing, and freshness.
 * - Keeps numerical source-information quotation disabled unless backed by a complete
 *   `VerifiedSourceQuotationContext` (verified source/document ID, passage ref, licence
 *   permission, crop/geographic applicability, attribution, and non-prescription separation).
 *
 * Important limitation:
 * Regular-expression and lexical checks are a defense-in-depth server-side guardrail and do
 * NOT provide comprehensive semantic validation. Structured deterministic calculation output
 * (`formatApprovedFertiliserCalculation`) is the authoritative source for numerical rates.
 */

export type QueryIntentClassification =
  | { intent: 'fertiliser'; confidence: 'high'; matchedTerm: string }
  | { intent: 'ambiguous_quantity'; needsClarification: true; reason: string }
  | { intent: 'other' };

export interface VerifiedSourceQuotationContext {
  verified: true;
  sourceId: string;
  documentTitle: string;
  passageRef: string;
  licenceIdentifier: string;
  licencePermitsQuotation: true;
  approvedForCommercialAiUse: true;
  publicationDate: string; // ISO date
  effectiveDate: string; // ISO date
  expiresAt?: string; // ISO date
  supportsSpecificClaim: true;
  applicableCropId: string;
  applicableRegion: string;
  attribution: string;
  explicitNonPrescriptionSeparation: true;
}

// Explicit whole-word / phrase fertiliser indicators across English, Nigerian English,
// Yoruba (ajile/ajilẹ/àjílẹ̀), Hausa (takin zamani), Igbo (nri ala), and Pidgin.
const EXPLICIT_FERTILISER_INTENT_RE =
  /(?:^|[\s,.;:!?("'/-])(fertilis(?:er|ers|ing|ation)|fertiliz(?:er|ers|ing|ation)|npk(?:\s*\d{1,2}[:\-]\d{1,2}[:\-]\d{1,2})?|urea|dap|ssp|mop|top[- ]?dress(?:ing)?|basal\s+(?:application|fertilis\w*|fertiliz\w*)|side[- ]?dress(?:ing)?|ajil[eẹ]|àjílẹ̀|aajil[eẹ]|takin\s+zamani|nri\s+ala|manure\s+rate)(?=$|[\s,.;:!?)"'/-])/i;

// Ambiguous quantity-only questions (e.g. Yoruba "iye" without a fertiliser/crop-rate noun,
// or bare "how many bags" without specifying fertiliser vs harvest vs seed).
const AMBIGUOUS_QUANTITY_RE =
  /(?:^|[\s,.;:!?("'/-])(iye(?:\s+wo)?|elo\s+ni\s+iye|how\s+many\s+bags\b|how\s+much\s+should\s+i\s+apply\b)(?=$|[\s,.;:!?)"'/-])/i;

// Non-fertiliser Yoruba/Hausa/Igbo/English price/count contexts where `iye` means price/cost/count
const PRICE_OR_MARKET_QUERY_RE =
  /(?:^|[\s,.;:!?("'/-])(owo|ọjà|oja|tita|ra|ẹyin|eyin|iṣu|isu|ẹ̀fọ́|efo|agbado\s+ni\s+ọja|price|cost|sell|market|farashi|kasuwa|ọnụ\s+ahịa|ahịa)(?=$|[\s,.;:!?)"'/-])/i;

export function detectFertiliserIntent(query: string): QueryIntentClassification {
  const normalized = (query ?? '').trim();
  if (!normalized) return { intent: 'other' };

  const fertMatch = normalized.match(EXPLICIT_FERTILISER_INTENT_RE);
  if (fertMatch?.[1]) {
    return { intent: 'fertiliser', confidence: 'high', matchedTerm: fertMatch[1].trim() };
  }

  if (PRICE_OR_MARKET_QUERY_RE.test(normalized)) {
    return { intent: 'other' };
  }

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

interface ParsedRateSnippet {
  raw: string;
  clause: string;
  value: number | null;
  isRange: boolean;
  unitKind:
    | 'kg_per_ha'
    | 'total_kg'
    | 'bags'
    | 'other_application_unit';
}

// Application-action verbs across English, Pidgin, Yoruba, Hausa, and Igbo
const APPLICATION_ACTION_RE =
  /\b(apply|applying|use|using|put|putting|spread|spreading|broadcast|broadcasting|spray|spraying|mix|mixing|dissolve|top[- ]?dress|side[- ]?dress|basal|inject|fertigat\w*|dose|dosage|rate|lo|fọ́n|fon|fi\s+s[ií]|saka|zuba|watsa|fesa|tinye|wụsa|wusa|gbaa)\b/i;

// Legitimate non-prescriptive numerical contexts (market price, harvest/yield, inventory/stock)
const MARKET_PRICE_CLAUSE_RE =
  /(?:₦|\bngn\b|\bnaira\b|\bkobo\b|\$\s*\d|\busd\b|\bprice\b|\bcost\b|\bsell(?:ing)?\b|\bbuy(?:ing)?\b|\bmarket\b|\bowo\b|\bọjà\b|\boja\b|\bfarashi\b|\bọnụ\s+ahịa\b)/i;

const HARVEST_OR_INVENTORY_CLAUSE_RE =
  /\b(harvest(?:ed|ing)?|yield(?:ed|s|ing)?|expected\s+yield|typical\s+yield|in\s+stock|inventory|on\s+hand|balance|stored|warehouse|store\s+has|remaining\s+stock|produced|output)\b/i;

// Explicit per-area, per-plant, volume, concentration, and multilingual application-rate patterns
// (intentionally independent of NPK/fertiliser keywords — Finding 6)
const APPLICATION_RATE_PATTERNS: ReadonlyArray<{
  re: RegExp;
  unitKind: ParsedRateSnippet['unitKind'];
}> = [
  // kg/ha variants (spacing, slash, dot, superscript, ranges)
  {
    re: /\b(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*(?:kg\s*\/\s*(?:ha|hectare)|kg\s+per\s+(?:ha|hectare)|kilograms?\s+per\s+(?:ha|hectare)|kg\s*\.?\s*ha(?:\s*-1|⁻¹))\b/gi,
    unitKind: 'kg_per_ha',
  },
  // Nutrient-annotated rates (e.g. "120 kg N/ha", "60 kg P2O5 per hectare", "40 kg K2O/ha")
  {
    re: /\b(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*kg\s+(?:n|p|k|p2o5|p₂o₅|k2o|k₂o|npk|urea|nitrogen|phosphorus|potassium|lime)\s*(?:\/\s*(?:ha|hectare|acre)|per\s+(?:ha|hectare|acre))\b/gi,
    unitKind: 'other_application_unit',
  },
  // Natural-language written-number rates and household measure prescriptions
  {
    re: /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|half(?:\s+a)?|quarter(?:\s+a)?|fifty|hundred|two\s+hundred|three\s+hundred)\s+(?:kg|kilograms?|bags?|litres?|liters?|bottle\s*caps?|milk\s*tins?|match\s*boxes?|teaspoons?|tablespoons?)\s+(?:per|\/|for\s+(?:one|each|every))\s+(?:ha|hectare|acre|plot|plant|stand|hole|hill)\b/gi,
    unitKind: 'other_application_unit',
  },
  {
    re: /\b(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*(?:bottle\s*caps?|milk\s*tins?|match\s*boxes?|teaspoons?|tablespoons?)\s+(?:per|\/)\s*(?:plant|stand|hole|hill)\b/gi,
    unitKind: 'other_application_unit',
  },
  // Application interval & frequency prescriptions (e.g. "apply every 7 days", "repeat every 2 weeks", "apply at 10-14 DAP")
  {
    re: /\b(?:apply|applying|repeat|repeating|re-apply|spray|spraying|fertigate|top[- ]?dress|side[- ]?dress|dose)\s+(?:every\s+(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*(?:days?|weeks?|months?)|at\s+(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*(?:dap|wap|days?\s+after\s+planting|weeks?\s+after\s+planting))\b/gi,
    unitKind: 'other_application_unit',
  },
  // Other per-area / per-plant / volume / concentration units (never produced directly by standard NPK/Urea kg/ha engine)
  {
    re: /\b(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*(?:kg\s*\/\s*(?:acre|ac)|kg\s+per\s+(?:acre|ac)|g\s*\/\s*(?:ha|hectare|plant|stand|hole|hill|l|litre|liter|16\s*l)|grams?\s+per\s+(?:ha|hectare|plant|stand|hole|hill|litre|liter)|tonnes?\s*\/\s*(?:ha|hectare|acre)|tons?\s*\/\s*(?:ha|hectare|acre)|m?t\s*\/\s*(?:ha|hectare)|tonnes?\s+per\s+(?:ha|hectare|acre)|l\s*\/\s*(?:ha|hectare|acre)|litres?\s*\/\s*(?:ha|hectare|acre)|liters?\s*\/\s*(?:ha|hectare|acre)|litres?\s+per\s+(?:ha|hectare|acre)|liters?\s+per\s+(?:ha|hectare|acre)|ml\s*\/\s*(?:l|litre|liter|16\s*l|ha)|ml\s+per\s+(?:l|litre|liter|16[- ]?(?:l|litre|liter)\s*(?:knapsack|sprayer)?)|%\s*(?:v\/v|w\/v|w\/w|solution))\b/gi,
    unitKind: 'other_application_unit',
  },
  // Bag-per-area variants (English & Pidgin)
  {
    re: /\b(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*(?:50\s*kg\s+)?bags?\s*(?:of\s*50\s*kg\s*)?(?:\/|\bper\b|\bfor\s+(?:one|1)\b)\s*(?:ha|hectare|acre|plot)\b/gi,
    unitKind: 'bags',
  },
  // Bag count paired with application verb or explicit 50kg bag wording
  {
    re: /\b(?:apply|applying|use|using|put|putting|spread|broadcast|top[- ]?dress|side[- ]?dress|need|needs|requiring|total\s+of|give|add)\s+(?:about\s+|around\s+)?(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*(?:×\s*)?(?:50\s*kg\s+)?bags?\b/gi,
    unitKind: 'bags',
  },
  // Parenthetical or explicit "(N x 50kg bags)" / "N bags (50kg)"
  {
    re: /\b(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*(?:×\s*50\s*kg\s+bags?|bags?\s*\(\s*50\s*kg\s*\)|50\s*kg\s+bags?)\b/gi,
    unitKind: 'bags',
  },
  // Total kg paired with application verb or product name (excluding "50 kg bag")
  {
    re: /\b(?:apply|applying|use|using|put|putting|spread|broadcast|top[- ]?dress|side[- ]?dress|total(?:\s+of)?|give|add|npk\s*\d{1,2}[:\-]\d{1,2}[:\-]\d{1,2}|urea(?:\s*\(46%\s*n\))?|dap|ssp|mop|limestone|lime)\s*(?:at|@|:|-|of)?\s*(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*kg\b(?!\s*(?:\/|\bper\b|\bbags?\b))/gi,
    unitKind: 'total_kg',
  },
  // Multilingual bag/kg/litre application expressions (Unicode-safe boundaries for diacritics):
  // Yoruba (báàgì / baagi / kilo ... fun hektari / lita ... fun hektari)
  {
    re: /(?:^|[\s,.;:!?("'/-])(?:báàgì|baagi)\s+(?:(\d+(?:\.\d+)?)|kan|meji|mẹta|meta|mẹrin|merin|marun|mẹfa|mefa|meje|mẹjọ|mejo|mẹsan|mesan|mẹwa|mewa)(?=$|[\s,.;:!?)"'/-])/gi,
    unitKind: 'bags',
  },
  {
    re: /(?:^|[\s,.;:!?("'/-])(\d+(?:\.\d+)?)\s*(?:kilo(?:gram)?|kg|lita|litres?)\s+(?:fun|ni)\s+(?:hektari|eka|oko)(?=$|[\s,.;:!?)"'/-])/gi,
    unitKind: 'other_application_unit',
  },
  // Hausa (buhu / buhuna / kilo ... a hekta / lita ... a hekta)
  {
    re: /(?:^|[\s,.;:!?("'/-])(?:buhu|buhuna)\s+(?:(\d+(?:\.\d+)?)|daya|biyu|uku|hudu|biyar|shida|bakwai|takwas|tara|goma)(?=$|[\s,.;:!?)"'/-])/gi,
    unitKind: 'bags',
  },
  {
    re: /(?:^|[\s,.;:!?("'/-])(\d+(?:\.\d+)?)\s*(?:kilo(?:gram)?|kg|lita)\s+(?:a\s+(?:kowace\s+)?(?:hekta|eka))(?=$|[\s,.;:!?)"'/-])/gi,
    unitKind: 'other_application_unit',
  },
  // Igbo (akpa / kilo ... n'otu hekta / lita ... n'otu hekta)
  {
    re: /(?:^|[\s,.;:!?("'/-])(?:akpa)\s+(?:(\d+(?:\.\d+)?)|otu|abụọ|abuo|atọ|ato|anọ|ano|ise|isii|asaa|asatọ|asato|itoolu|iri)(?=$|[\s,.;:!?)"'/-])/gi,
    unitKind: 'bags',
  },
  {
    re: /(?:^|[\s,.;:!?("'/-])(\d+(?:\.\d+)?)\s*(?:kilo(?:gram)?|kg|lita)\s+(?:n['’]otu\s+(?:hekta|eka))(?=$|[\s,.;:!?)"'/-])/gi,
    unitKind: 'other_application_unit',
  },
  // Concentration ppm in application context
  {
    re: /\b(\d+(?:\.\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?))?\s*ppm\b/gi,
    unitKind: 'other_application_unit',
  },
];

// Named fertiliser products that may appear in LLM output
const NAMED_FERTILISER_PRODUCT_RE =
  /\b(npk\s*\d{1,2}\s*[:\-]\s*\d{1,2}\s*[:\-]\s*\d{1,2}|urea(?:\s*\(?\s*46%\s*n\s*\)?)?|dap|ssp|tsp|mop|muriate\s+of\s+potash|calcium\s+nitrate|ammonium\s+sulphate|ammonium\s+sulfate|limestone|agricultural\s+lime)\b/gi;

const MAX_CALCULATION_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function normalizeProductToken(raw: string): string {
  const lower = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  if (lower.startsWith('npk')) {
    return lower.replace(/\s*[:\-]\s*/g, ':').replace(/^npk\s*/, 'npk ');
  }
  if (lower.startsWith('urea')) return 'urea';
  if (lower.includes('lime')) return 'lime';
  return lower;
}

function isPurelyLegitimateNonPrescriptionClause(clause: string, unitKind: ParsedRateSnippet['unitKind']): boolean {
  // Per-area application units with application verbs are NEVER exempt
  if (APPLICATION_ACTION_RE.test(clause)) {
    return false;
  }
  // Market price clauses (e.g. "Maize sells for ₦45,000 per bag" or "Cost is NGN 35,000")
  if (MARKET_PRICE_CLAUSE_RE.test(clause) && unitKind !== 'kg_per_ha') {
    return true;
  }
  // Harvest / yield / inventory statements (e.g. "You harvested 4 tonnes/ha" or "Inventory has 12 bags in stock")
  if (HARVEST_OR_INVENTORY_CLAUSE_RE.test(clause)) {
    return true;
  }
  return false;
}

function extractApplicationRateSnippets(rawAnswer: string): ParsedRateSnippet[] {
  const clauses = rawAnswer
    .split(/(?:[.!?\n;]+)+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const snippets: ParsedRateSnippet[] = [];

  for (const clause of clauses) {
    for (const { re, unitKind } of APPLICATION_RATE_PATTERNS) {
      re.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(clause)) !== null) {
        const raw = match[0].trim();

        // Special guard for `ppm`: only treat as application concentration if paired with application/mix/fertigation context
        if (/\bppm\b/i.test(raw) && !/\b(apply|mix|dissolve|spray|fertigat\w*|solution|concentrat\w*|feed|inject)\b/i.test(clause)) {
          continue;
        }

        if (isPurelyLegitimateNonPrescriptionClause(clause, unitKind)) {
          continue;
        }

        const firstNum = match[1] !== undefined ? Number.parseFloat(match[1]) : null;
        const secondNum = match[2] !== undefined ? Number.parseFloat(match[2]) : null;
        const isRange = secondNum !== null && Number.isFinite(secondNum);

        snippets.push({
          raw,
          clause,
          value: firstNum !== null && Number.isFinite(firstNum) ? firstNum : null,
          isRange,
          unitKind,
        });
      }
    }
  }

  return snippets;
}

/**
 * Verifies that a source quotation satisfies ALL Section 8 requirements before any numerical
 * published source figure may be displayed. LLM self-disclosure text alone is NEVER sufficient.
 */
export function isValidVerifiedSourceQuote(
  quote: VerifiedSourceQuotationContext | null | undefined,
  cropId?: string | null,
  referenceDate?: string,
): quote is VerifiedSourceQuotationContext {
  if (!quote || typeof quote !== 'object') return false;
  // Unforgeable server-trust brand check: arbitrary caller-supplied objects ALWAYS fail closed.
  if ((quote as unknown as Record<symbol, unknown>)[TRUSTED_SOURCE_QUOTE_BRAND] !== true) {
    return false;
  }
  if (quote.verified !== true) return false;
  if (quote.licencePermitsQuotation !== true) return false;
  if (quote.approvedForCommercialAiUse !== true) return false;
  if (quote.supportsSpecificClaim !== true) return false;
  if (quote.explicitNonPrescriptionSeparation !== true) return false;
  if (!quote.sourceId?.trim() || !quote.documentTitle?.trim()) return false;
  if (!quote.passageRef?.trim()) return false;
  if (!quote.licenceIdentifier?.trim()) return false;
  if (!quote.applicableCropId?.trim() || !quote.applicableRegion?.trim()) return false;
  if (!quote.attribution?.trim()) return false;

  const refTs = referenceDate ? new Date(referenceDate).getTime() : Date.now();
  const pubTs = new Date(quote.publicationDate).getTime();
  const effTs = new Date(quote.effectiveDate).getTime();
  if (Number.isNaN(pubTs) || Number.isNaN(effTs) || Number.isNaN(refTs)) return false;
  if (effTs > refTs + 86_400_000) return false;
  if (quote.expiresAt !== undefined) {
    const expTs = new Date(quote.expiresAt).getTime();
    if (Number.isNaN(expTs) || expTs < refTs) return false;
  }

  const reqCrop = cropId?.trim().toLowerCase();
  const quoteCrop = quote.applicableCropId.trim().toLowerCase();
  if (reqCrop && quoteCrop !== 'general' && quoteCrop !== reqCrop) {
    return false;
  }
  return true;
}

/**
 * Generates deterministic, non-LLM-invented numerical product application text directly from
 * an independently `agronomist_approved` calculation result.
 */
export function formatApprovedFertiliserCalculation(
  calculation: FertiliserRecommendation,
  language: AppLanguage | 'pcm' = 'en',
): string {
  const lines: string[] = [];
  if (calculation.productApplications.length === 0) {
    lines.push(
      language === 'yo'
        ? `Abajade iṣiro ajilẹ (${calculation.protocolVersion ?? 'approved'}) fun ${calculation.cropId}: ko si aipe N/P to nilo NPK tabi Urea.`
        : `Approved deterministic fertiliser calculation (${calculation.protocolVersion ?? 'approved'}) for ${calculation.cropId}: no N/P deficit requiring NPK or Urea application.`,
    );
  } else {
    lines.push(
      `Approved deterministic fertiliser calculation (${calculation.protocolVersion ?? 'approved'}) for ${calculation.cropId} (${calculation.farmAreaHectares} ha):`,
    );
    for (const app of calculation.productApplications) {
      const timingLabel =
        app.timing === 'basal_planting'
          ? 'basal planting'
          : app.timing === 'top_dress_vegetative'
            ? 'top-dress vegetative'
            : 'split';
      lines.push(
        `- ${app.productName}: ${app.kgPerHa} kg/ha (${app.totalKg} kg total, ${app.fiftyKgBags} x 50kg bags) at ${timingLabel}.`,
      );
    }
  }
  if (calculation.limeRecommendationKgPerHa > 0) {
    lines.push(
      `- Agricultural limestone: ${calculation.limeRecommendationKgPerHa} kg/ha (2-4 weeks before planting).`,
    );
  }
  return lines.join('\n');
}

function validateCalculationBindingAndValues(
  snippets: ParsedRateSnippet[],
  calculation: FertiliserRecommendation,
  options: {
    cropId?: string | null;
    farmId?: string | null;
    plotId?: string | null;
    requestId?: string | null;
    zone?: string | null;
    growthStage?: string | null;
    referenceDate?: string;
  },
): { ok: true } | { ok: false; reasonCode: string } {
  // 0. Unforgeable engine-origin brand check: callers cannot manufacture a fake calculation binding.
  if (!isTrustedFertiliserCalculation(calculation)) {
    return { ok: false, reasonCode: 'calculation_untrusted_origin' };
  }

  // 1. Approval & binding integrity checks (Finding 1 + Finding 2 + Revision 3)
  const binding = calculation.binding;
  if (
    calculation.protocolApprovalStatus !== 'agronomist_approved' ||
    !binding ||
    binding.protocolApprovalStatus !== 'agronomist_approved' ||
    !calculation.protocolVersion?.trim() ||
    binding.protocolVersion !== calculation.protocolVersion ||
    !binding.farmId?.trim() ||
    !binding.soilAssociation?.farmId?.trim() ||
    binding.soilAssociation.farmId !== binding.farmId ||
    (binding.plotId && binding.soilAssociation.plotId !== binding.plotId)
  ) {
    return { ok: false, reasonCode: 'calculation_not_agronomist_approved' };
  }

  // 2. Crop binding check
  const reqCrop = options.cropId?.trim().toLowerCase() ?? '';
  const calcCrop = calculation.cropId?.trim().toLowerCase() ?? '';
  const boundCrop = binding.cropId?.trim().toLowerCase() ?? '';
  if (!reqCrop || !isSupportedFertiliserCrop(calcCrop) || reqCrop !== calcCrop || boundCrop !== calcCrop) {
    return { ok: false, reasonCode: 'calculation_crop_mismatch' };
  }

  // 3. Farm / plot / request / zone binding checks
  const reqFarm = options.farmId?.trim() ?? '';
  const boundFarm = binding.farmId?.trim() ?? '';
  if ((reqFarm || boundFarm) && reqFarm !== boundFarm) {
    return { ok: false, reasonCode: 'calculation_farm_mismatch' };
  }

  const reqPlot = options.plotId?.trim() ?? '';
  const boundPlot = binding.plotId?.trim() ?? '';
  if ((reqPlot || boundPlot) && reqPlot !== boundPlot) {
    return { ok: false, reasonCode: 'calculation_plot_mismatch' };
  }

  const reqId = options.requestId?.trim() ?? '';
  const boundReqId = binding.requestId?.trim() ?? '';
  if ((reqId || boundReqId) && reqId !== boundReqId) {
    return { ok: false, reasonCode: 'calculation_request_mismatch' };
  }

  const boundZone = binding.zone?.trim().toLowerCase() ?? '';
  const reqZone = options.zone?.trim().toLowerCase() ?? '';
  if (!boundZone || (reqZone && reqZone !== boundZone)) {
    return { ok: false, reasonCode: 'calculation_zone_mismatch' };
  }

  const boundStage = binding.growthStage?.trim().toLowerCase() ?? '';
  const reqStage = options.growthStage?.trim().toLowerCase() ?? '';
  if (!boundStage || (reqStage && reqStage !== boundStage)) {
    return { ok: false, reasonCode: 'calculation_growth_stage_mismatch' };
  }

  // 4. Freshness check (reject stale or future-dated calculation objects)
  const calcTs = new Date(binding.calculatedAt).getTime();
  const refTs = options.referenceDate ? new Date(options.referenceDate).getTime() : Date.now();
  if (Number.isNaN(calcTs) || Number.isNaN(refTs)) {
    return { ok: false, reasonCode: 'calculation_timestamp_invalid' };
  }
  const ageMs = refTs - calcTs;
  if (ageMs > MAX_CALCULATION_AGE_MS || ageMs < -60_000) {
    return { ok: false, reasonCode: 'calculation_stale_or_invalid' };
  }

  // 5. Validate every numerical snippet against the exact deterministic calculation values
  const allowedProducts = new Map<
    string,
    { kgPerHa: number; totalKg: number; bags: number; timing: string }
  >();
  for (const app of calculation.productApplications) {
    allowedProducts.set(normalizeProductToken(app.productName), {
      kgPerHa: app.kgPerHa,
      totalKg: app.totalKg,
      bags: app.fiftyKgBags,
      timing: app.timing,
    });
  }
  if (calculation.limeRecommendationKgPerHa > 0) {
    const limeTotal = Math.round(calculation.limeRecommendationKgPerHa * calculation.farmAreaHectares);
    allowedProducts.set('lime', {
      kgPerHa: calculation.limeRecommendationKgPerHa,
      totalKg: limeTotal,
      bags: Math.ceil(limeTotal / 50),
      timing: 'pre_planting',
    });
  }

  const allAllowedKgPerHa = new Set(Array.from(allowedProducts.values()).map((v) => v.kgPerHa));
  const allAllowedTotalKg = new Set(Array.from(allowedProducts.values()).map((v) => v.totalKg));
  const allAllowedBags = new Set(Array.from(allowedProducts.values()).map((v) => v.bags));

  const valuesMatch = (candidate: number, allowed: Set<number>): boolean => {
    for (const v of allowed) {
      if (Math.abs(candidate - v) <= 0.01) return true;
    }
    return false;
  };

  for (const snippet of snippets) {
    // Reject ranges and non-engine application units (kg/acre, L/ha, g/plant, ml/L, etc.)
    if (snippet.isRange || snippet.value === null) {
      return { ok: false, reasonCode: 'calculation_value_mismatch' };
    }
    if (snippet.unitKind === 'other_application_unit') {
      return { ok: false, reasonCode: 'calculation_unit_mismatch' };
    }

    // Check product mentions in this clause
    NAMED_FERTILISER_PRODUCT_RE.lastIndex = 0;
    const mentionedProducts: string[] = [];
    let pm: RegExpExecArray | null;
    while ((pm = NAMED_FERTILISER_PRODUCT_RE.exec(snippet.clause)) !== null) {
      mentionedProducts.push(normalizeProductToken(pm[1]!));
    }

    for (const prod of mentionedProducts) {
      if (!allowedProducts.has(prod)) {
        return { ok: false, reasonCode: 'calculation_product_mismatch' };
      }
    }

    // If a single product is named in the clause, bind the number and timing to THAT exact product
    if (mentionedProducts.length === 1) {
      const prodSpec = allowedProducts.get(mentionedProducts[0]!)!;
      if (snippet.unitKind === 'kg_per_ha' && Math.abs(snippet.value - prodSpec.kgPerHa) > 0.01) {
        return { ok: false, reasonCode: 'calculation_value_mismatch' };
      }
      if (snippet.unitKind === 'total_kg' && Math.abs(snippet.value - prodSpec.totalKg) > 0.01) {
        return { ok: false, reasonCode: 'calculation_value_mismatch' };
      }
      if (snippet.unitKind === 'bags' && Math.abs(snippet.value - prodSpec.bags) > 0.01) {
        return { ok: false, reasonCode: 'calculation_value_mismatch' };
      }

      // Check timing contradictions
      const lowerClause = snippet.clause.toLowerCase();
      if (
        prodSpec.timing === 'basal_planting' &&
        /\btop[- ]?dress(?:ing)?\b/.test(lowerClause) &&
        !/\bbasal\b|\bplanting\b/.test(lowerClause)
      ) {
        return { ok: false, reasonCode: 'calculation_timing_mismatch' };
      }
      if (
        prodSpec.timing === 'top_dress_vegetative' &&
        (/\bbasal\b|\bat\s+planting\b/.test(lowerClause)) &&
        !/\btop[- ]?dress(?:ing)?\b|\bvegetative\b/.test(lowerClause)
      ) {
        return { ok: false, reasonCode: 'calculation_timing_mismatch' };
      }
    } else {
      // No single product named in clause: value must still exactly match one of the engine's outputs for that unit
      if (snippet.unitKind === 'kg_per_ha' && !valuesMatch(snippet.value, allAllowedKgPerHa)) {
        return { ok: false, reasonCode: 'calculation_value_mismatch' };
      }
      if (snippet.unitKind === 'total_kg' && !valuesMatch(snippet.value, allAllowedTotalKg)) {
        return { ok: false, reasonCode: 'calculation_value_mismatch' };
      }
      if (snippet.unitKind === 'bags' && !valuesMatch(snippet.value, allAllowedBags)) {
        return { ok: false, reasonCode: 'calculation_value_mismatch' };
      }
    }
  }

  return { ok: true };
}

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
      `Lati fun yin ni iye ajilẹ to peye fun ${cropLabel}, CultivaNode nilo abajade idanwo ilẹ (laboratory soil test) ati ilana ti alamọran ogbin fọwọsi (agronomist-approved protocol). ` +
      'Jọwọ ṣe idanwo ilẹ (pH, organic matter, P, K) ki o si kan si alamọran ogbin fun itọsọna to peye.'
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
      `Before CultivaNode fit give exact fertilizer rate for ${cropLabel}, we need your laboratory soil test (pH, organic matter, phosphorus, potassium) and an agronomist-approved protocol run through the verified fertiliser calculator. ` +
      'Please test your soil for lab or contact a qualified extension agent.'
    );
  }

  if (!cropLabel) {
    return (
      'CultivaNode cannot provide a farm-specific numerical fertiliser prescription without knowing your crop identity, agro-ecological zone, and a laboratory-confirmed soil test. ' +
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
    `A farm-specific numerical fertiliser prescription for ${cropLabel} requires an independently agronomist-approved protocol and a laboratory-confirmed soil test (pH, organic matter, available phosphorus, exchangeable potassium with explicit units and nutrient basis) validated through CultivaNode's deterministic fertiliser engine. ` +
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
 * Server-side numerical agricultural application validator (Batch 04.0-H Revision 2).
 *
 * Blocks ANY numerical agricultural application rate/dose/bag/concentration quantity — even
 * when explicit NPK/fertiliser keywords are omitted — unless:
 * 1. Backed by an independently `agronomist_approved` deterministic calculation whose binding
 *    (crop, farm, plot, request, zone, protocol version, freshness) AND exact numerical values,
 *    products, units, and timing match every rate in the response, OR
 * 2. Backed by a complete `VerifiedSourceQuotationContext` (verified source/document ID,
 *    passage ref, licence permission, crop/geographic applicability, attribution, and
 *    explicit non-prescription separation). LLM text phrases alone NEVER enable quotation.
 */
export function validateAssistantNumericalOutput(
  rawAnswer: string,
  options: {
    cropId?: string | null;
    farmId?: string | null;
    plotId?: string | null;
    requestId?: string | null;
    zone?: string | null;
    growthStage?: string | null;
    language: AppLanguage | 'pcm';
    approvedCalculation?: FertiliserRecommendation | null;
    verifiedSourceQuote?: VerifiedSourceQuotationContext | null;
    referenceDate?: string;
  },
): NumericPrescriptionValidationResult {
  const snippets = extractApplicationRateSnippets(rawAnswer);
  const detectedRateSnippets = snippets.map((s) => s.raw);

  if (snippets.length === 0) {
    return {
      passed: true,
      recommendationStatus: 'general_guidance',
      reasonCode: null,
      detectedRateSnippets: [],
      sanitizedText: rawAnswer,
    };
  }

  // Case 1: Backed by a validated, agronomist-approved deterministic calculation AND exact value/binding match
  if (options.approvedCalculation) {
    const matchCheck = validateCalculationBindingAndValues(snippets, options.approvedCalculation, options);
    if (matchCheck.ok) {
      return {
        passed: true,
        recommendationStatus: 'approved_calculation',
        reasonCode: null,
        detectedRateSnippets,
        sanitizedText: rawAnswer,
      };
    }

    // Mismatched, stale, cross-farm, cross-crop, wrong-product, or altered numerical output -> FAIL CLOSED
    const cropId = options.cropId?.trim() || '';
    return {
      passed: false,
      recommendationStatus: !cropId
        ? 'insufficient_evidence'
        : !isSupportedFertiliserCrop(cropId)
          ? 'unsupported_crop'
          : 'insufficient_evidence',
      reasonCode: matchCheck.reasonCode,
      detectedRateSnippets,
      sanitizedText: buildSafeNonNumericalFertiliserGuidance({
        cropId,
        language: options.language,
        reasonCode: matchCheck.reasonCode,
      }),
    };
  }

  // Case 2: Verified, licensed, attributed published source quotation (disabled unless ALL Section 2 metadata is verified)
  if (isValidVerifiedSourceQuote(options.verifiedSourceQuote, options.cropId, options.referenceDate)) {
    return {
      passed: true,
      recommendationStatus: 'source_information',
      reasonCode: null,
      detectedRateSnippets,
      sanitizedText: rawAnswer,
    };
  }

  // Fail closed: block unsupported numerical agricultural prescription
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
