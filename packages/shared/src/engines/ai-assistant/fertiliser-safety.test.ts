import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectFertiliserIntent,
  formatApprovedFertiliserCalculation,
  validateAssistantNumericalOutput,
  type VerifiedSourceQuotationContext,
} from './fertiliser-safety';
import { askGroundedAiAssistant, generateAgronomicAdvisorAnswer } from './llm-adapter';
import { evaluateFertiliserRecommendation, SUPPORTED_FERTILISER_PROTOCOLS } from '../inputs/fertiliser';

afterEach(() => vi.unstubAllGlobals());

function makeApprovedMaizeCalc(overrides?: {
  farmId?: string;
  plotId?: string;
  requestId?: string;
  zone?: string;
  referenceDate?: string;
}) {
  const res = evaluateFertiliserRecommendation({
    cropId: 'maize',
    targetYieldTonnesPerHa: 5,
    farmAreaHectares: 2,
    soil: {
      pH: 6.2,
      phosphorusPpm: 12,
      potassium: { value: 0.25, unit: 'cmol_kg', basis: 'elemental_K' },
      organicMatterPercent: 1.8,
      provenance: 'lab_confirmed',
      extractionMethod: 'bray_1',
      samplingDepthCm: 15,
      testDate: '2026-10-01',
    },
    zone: overrides?.zone ?? 'derived_savanna',
    growthStage: 'basal',
    farmId: overrides?.farmId ?? 'farm-alpha',
    plotId: overrides?.plotId ?? 'plot-01',
    requestId: overrides?.requestId ?? 'req-001',
    referenceDate: overrides?.referenceDate ?? '2026-11-22T12:00:00Z',
    protocolOverride: {
      approvalStatus: 'agronomist_approved',
      approvalRecord: {
        reviewerName: 'Dr. Test Agronomist',
        reviewerCredentials: 'PhD Soil Science (Test Fixture)',
        competenceScope: 'Maize savanna nutrient calibration',
        approvalDate: '2026-09-15',
        sourceEvidence: 'Test fixture evidence',
        protocolVersion: SUPPORTED_FERTILISER_PROTOCOLS.maize.protocolVersion,
        applicableCropId: 'maize',
        applicableZones: ['derived_savanna', 'rainforest'],
      },
    },
  });
  if (!res.ok) throw new Error(`Expected approved test fixture calc, got ${res.reasonCode}`);
  return res.recommendation;
}

describe('Batch 04.0-H Revision 2 — Yoruba `iye`, Ambiguous Queries & Rule-Engine Fallback', () => {
  it('does NOT false-trigger fertiliser advice on Yoruba price queries containing `iye`', () => {
    const query = 'Elo ni iye agbado ni oja loni?';
    expect(detectFertiliserIntent(query).intent).toBe('other');

    const answer = generateAgronomicAdvisorAnswer(
      query,
      { farmerId: 'f1', cropId: 'maize', zone: 'derived_savanna' },
      'yo',
    );
    expect(answer).not.toMatch(/\b\d+\s*kg\/ha/i);
    expect(answer).not.toMatch(/báàgì\s+(?:kan|meji|mẹta|mẹrin|\d+)/i);
  });

  it('asks for clarification on ambiguous quantity queries and emits zero numeric rates across en/yo/pcm', () => {
    const ambiguous = detectFertiliserIntent('How much should I apply?');
    expect(ambiguous.intent).toBe('ambiguous_quantity');

    for (const lang of ['en', 'yo', 'pcm'] as const) {
      const answer = generateAgronomicAdvisorAnswer(
        'How much fertiliser should I apply for lettuce?',
        { farmerId: 'f1', cropId: 'lettuce' },
        lang,
      );
      expect(answer).not.toMatch(/\d+\s*kg\/ha/i);
      expect(answer).not.toMatch(/báàgì\s+\d+/i);
    }
  });
});

describe('Batch 04.0-H Revision 2 — Finding 2: Numerical Calculation Binding & Exact Value Verification', () => {
  it('accepts deterministic calculation output when crop, farm, plot, request, zone, product, values, units, and timing match', () => {
    const calc = makeApprovedMaizeCalc();
    const deterministicText = formatApprovedFertiliserCalculation(calc, 'en');

    const res = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(res.passed).toBe(true);
    expect(res.recommendationStatus).toBe('approved_calculation');
  });

  it('rejects LLM attempts to inflate, deflate, range, swap product, swap unit, or alter timing of a calculated rate', () => {
    const calc = makeApprovedMaizeCalc();
    const npk = calc.productApplications.find((p) => p.productName.includes('NPK'))!;
    const urea = calc.productApplications.find((p) => p.productName.includes('Urea'))!;
    const baseOpts = {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      language: 'en' as const,
      approvedCalculation: calc,
      referenceDate: '2026-11-22T12:30:00Z',
    };

    // Higher rate than engine
    const higher = validateAssistantNumericalOutput(
      `Apply NPK 15:15:15 at ${npk.kgPerHa + 50} kg/ha at basal planting.`,
      baseOpts,
    );
    expect(higher.passed).toBe(false);
    expect(higher.reasonCode).toBe('calculation_value_mismatch');

    // Lower rate than engine
    const lower = validateAssistantNumericalOutput(
      `Apply NPK 15:15:15 at ${Math.max(10, npk.kgPerHa - 50)} kg/ha at basal planting.`,
      baseOpts,
    );
    expect(lower.passed).toBe(false);
    expect(lower.reasonCode).toBe('calculation_value_mismatch');

    // LLM invents a range
    const ranged = validateAssistantNumericalOutput(
      `Apply NPK 15:15:15 at ${npk.kgPerHa - 20}-${npk.kgPerHa + 20} kg/ha.`,
      baseOpts,
    );
    expect(ranged.passed).toBe(false);
    expect(ranged.reasonCode).toBe('calculation_value_mismatch');

    // Wrong product (DAP or NPK 20:10:10) with same number
    const wrongProd = validateAssistantNumericalOutput(
      `Apply DAP at ${npk.kgPerHa} kg/ha at planting.`,
      baseOpts,
    );
    expect(wrongProd.passed).toBe(false);
    expect(wrongProd.reasonCode).toBe('calculation_product_mismatch');

    const wrongFormula = validateAssistantNumericalOutput(
      `Apply NPK 20:10:10 at ${npk.kgPerHa} kg/ha at planting.`,
      baseOpts,
    );
    expect(wrongFormula.passed).toBe(false);
    expect(wrongFormula.reasonCode).toBe('calculation_product_mismatch');

    // Wrong unit (kg/acre instead of kg/ha)
    const wrongUnit = validateAssistantNumericalOutput(
      `Apply NPK 15:15:15 at ${npk.kgPerHa} kg/acre.`,
      baseOpts,
    );
    expect(wrongUnit.passed).toBe(false);
    expect(wrongUnit.reasonCode).toBe('calculation_unit_mismatch');

    // Contradictory timing (Urea at basal planting instead of top_dress_vegetative)
    const wrongTiming = validateAssistantNumericalOutput(
      `Apply Urea (46% N) at ${urea.kgPerHa} kg/ha at basal planting.`,
      baseOpts,
    );
    expect(wrongTiming.passed).toBe(false);
    expect(wrongTiming.reasonCode).toBe('calculation_timing_mismatch');
  });

  it('rejects cross-crop, cross-farm, cross-plot, cross-request, wrong-zone, stale, or provisional calculation bindings', () => {
    const calc = makeApprovedMaizeCalc();
    const deterministicText = formatApprovedFertiliserCalculation(calc, 'en');

    const wrongCrop = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'tomato',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(wrongCrop.passed).toBe(false);
    expect(wrongCrop.reasonCode).toBe('calculation_crop_mismatch');

    const wrongFarm = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-beta',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(wrongFarm.passed).toBe(false);
    expect(wrongFarm.reasonCode).toBe('calculation_farm_mismatch');

    const wrongPlot = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-99',
      requestId: 'req-001',
      zone: 'derived_savanna',
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(wrongPlot.passed).toBe(false);
    expect(wrongPlot.reasonCode).toBe('calculation_plot_mismatch');

    const stale = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-25T12:30:00Z', // > 24h stale
    });
    expect(stale.passed).toBe(false);
    expect(stale.reasonCode).toBe('calculation_stale_or_invalid');

    const provisionalCalc = {
      ...calc,
      protocolApprovalStatus: 'provisional_software_validated' as const,
    };
    const provisionalRes = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      language: 'en',
      approvedCalculation: provisionalCalc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(provisionalRes.passed).toBe(false);
    expect(provisionalRes.reasonCode).toBe('calculation_not_agronomist_approved');
  });
});

describe('Batch 04.0-H Revision 2 — Finding 6: Keyword-Independent & Multilingual Numerical Guardrail', () => {
  it.each([
    ['English kg/ha without fertiliser keyword', 'Apply 200 kg/ha across the field.', 'en'],
    ['Spaced slash & range', 'Spread 150 - 200 kg / ha before rain.', 'en'],
    ['Scientific notation kg.ha-1', 'Use 180 kg.ha-1 on the plot.', 'en'],
    ['kg per acre', 'Put 75 kg per acre on the ridges.', 'en'],
    ['tonnes/ha', 'Broadcast 2.5 tonnes/ha into the topsoil.', 'en'],
    ['grams per plant', 'Place 10 g/plant beside each stem.', 'en'],
    ['litres/ha spray rate', 'Spray 3.0 L/ha across the field.', 'en'],
    ['ml per litre concentration', 'Mix 20 ml per litre of water and spray.', 'en'],
    ['percentage solution', 'Prepare a 2% w/v solution and spray.', 'en'],
    ['fertigation ppm', 'Inject 150 ppm through the drip lines.', 'en'],
    ['Yoruba bags without keyword', 'Lo báàgì mẹrin lori oko rẹ.', 'yo'],
    ['Yoruba kilo per hectare', 'Lo 200 kilo fun hektari kan.', 'yo'],
    ['Hausa bags without keyword', 'Saka buhu uku a gonarka.', 'en'],
    ['Hausa kilo per hectare', 'Zuba 150 kilo a kowace hekta.', 'en'],
    ['Igbo bags without keyword', 'Tinye akpa anọ n’ubi gị.', 'en'],
    ['Igbo kilo per hectare', "Wụsa 150 kilo n'otu hekta.", 'en'],
    ['Pidgin bags for one hectare', 'Just put 4 bags for one hectare.', 'pcm'],
  ])('blocks adversarial numerical application quantity: %s', (_label, text, lang) => {
    const res = validateAssistantNumericalOutput(text, {
      cropId: 'maize',
      language: lang as 'en' | 'yo' | 'pcm',
    });
    expect(res.passed).toBe(false);
    expect(res.detectedRateSnippets.length).toBeGreaterThan(0);
  });

  it('distinguishes legitimate market prices, harvest yields, and inventory balances from prescriptions', () => {
    const priceRes = validateAssistantNumericalOutput(
      'Current market price in Ibadan is ₦45,000 per bag of maize.',
      { cropId: 'maize', language: 'en' },
    );
    expect(priceRes.passed).toBe(true);

    const harvestRes = validateAssistantNumericalOutput(
      'Your plot harvested 4.5 tonnes/ha last season and your store inventory has 12 bags in stock.',
      { cropId: 'maize', language: 'en' },
    );
    expect(harvestRes.passed).toBe(true);

    // Mixed adversarial: legitimate yield sentence followed by illegal application sentence MUST still be blocked!
    const mixed = validateAssistantNumericalOutput(
      'Your plot harvested 4.5 tonnes/ha last season. Apply 200 kg/ha next week.',
      { cropId: 'maize', language: 'en' },
    );
    expect(mixed.passed).toBe(false);
  });

  it('blocks LLM-invented numerical rates for lettuce through askGroundedAiAssistant', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            content: [{ type: 'text', text: 'For lettuce, apply 180 kg/ha before transplanting.' }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    const lettuceRes = await askGroundedAiAssistant({
      query: 'How much should I apply for lettuce?',
      context: { farmerId: 'f1', cropId: 'lettuce' },
      anthropicApiKey: 'test-key',
    });
    expect(lettuceRes.passedSafetyGuardrail).toBe(false);
    expect(lettuceRes.numericGuardrailBlocked).toBe(true);
    expect(lettuceRes.recommendationStatus).toBe('unsupported_crop');
    expect(lettuceRes.answer).not.toContain('180 kg/ha');
  });
});

describe('Batch 04.0-H Revision 2 — Section 8: Source Information Safeguard', () => {
  it('rejects LLM self-declared source quotation phrases when no verified source context is provided', () => {
    const res = validateAssistantNumericalOutput(
      'General published source information (not a farm-specific prescription): standard rate is 200 kg/ha.',
      { cropId: 'maize', language: 'en', verifiedSourceQuote: null },
    );
    expect(res.passed).toBe(false);
  });

  it('rejects incomplete source quotation metadata and accepts ONLY fully verified licensed quotes', () => {
    const validQuote: VerifiedSourceQuotationContext = {
      verified: true,
      sourceId: 'src-iita-2024-01',
      documentTitle: 'IITA Maize Production Guide (Open Access)',
      passageRef: 'Section 4.2, p. 18',
      licenceIdentifier: 'CC-BY-4.0',
      licencePermitsQuotation: true,
      applicableCropId: 'maize',
      applicableRegion: 'derived_savanna',
      attribution: 'IITA (2024), CC-BY-4.0',
      explicitNonPrescriptionSeparation: true,
    };

    const ok = validateAssistantNumericalOutput(
      'General published source information (not a farm-specific prescription): IITA (2024) p. 18 cites 200 kg/ha.',
      { cropId: 'maize', language: 'en', verifiedSourceQuote: validQuote },
    );
    expect(ok.passed).toBe(true);
    expect(ok.recommendationStatus).toBe('source_information');

    // Missing licenceIdentifier -> rejected
    const missingLicence = validateAssistantNumericalOutput(
      'General published source information: 200 kg/ha.',
      {
        cropId: 'maize',
        language: 'en',
        verifiedSourceQuote: { ...validQuote, licenceIdentifier: '' },
      },
    );
    expect(missingLicence.passed).toBe(false);

    // Crop mismatch (maize source quoted for tomato) -> rejected
    const wrongCrop = validateAssistantNumericalOutput(
      'General published source information: 200 kg/ha.',
      {
        cropId: 'tomato',
        language: 'en',
        verifiedSourceQuote: validQuote,
      },
    );
    expect(wrongCrop.passed).toBe(false);
  });
});
