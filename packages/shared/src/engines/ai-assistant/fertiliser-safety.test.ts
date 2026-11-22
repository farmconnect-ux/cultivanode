import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __mintTestVerifiedSourceQuote,
  detectFertiliserIntent,
  formatApprovedFertiliserCalculation,
  isValidVerifiedSourceQuote,
  validateAssistantNumericalOutput,
  type VerifiedSourceQuotationContext,
} from './fertiliser-safety';
import {
  isTrustedVerifiedFarmContext,
  resolveVerifiedAgronomicFarmContextFromSnapshot,
} from './verified-farm-context';
import type { LiveFarmContextSnapshot } from '../farm-context/types';
import { askGroundedAiAssistant, generateAgronomicAdvisorAnswer } from './llm-adapter';
import {
  evaluateWithTestApprovedProtocol,
  makeTestApprovedProtocolFixture,
  makeTestVerifiedLabReport,
} from '../inputs/__testing__/approved-protocol-test-harness';

afterEach(() => vi.unstubAllGlobals());

function makeLiveSnapshot(overrides?: {
  farmId?: string;
  farmZone?: string | null;
  retrievedAt?: string;
  plotId?: string;
  cropId?: string;
  cycleId?: string;
  currentStage?: string | null;
  cycleState?: 'verified_current' | 'unverified_provisional';
  noCycles?: boolean;
}): LiveFarmContextSnapshot {
  const farmId = overrides?.farmId ?? 'farm-alpha';
  const plotId = overrides?.plotId ?? 'plot-01';
  const cropId = overrides?.cropId ?? 'maize';
  const retrievedAt = overrides?.retrievedAt ?? '2026-11-22T12:25:00Z';
  const activeCycles = overrides?.noCycles
    ? []
    : [
        {
          cycleId: overrides?.cycleId ?? 'cycle-001',
          plotId,
          cropId,
          currentStage: overrides && 'currentStage' in overrides ? overrides.currentStage : 'basal',
          plantingDate: '2026-11-15',
          expectedHarvestDate: '2027-02-20',
          healthStatus: 'healthy',
          healthScore: 90,
          state: overrides?.cycleState ?? 'verified_current',
        },
      ];

  return {
    farmId,
    farmName: 'Test Farm',
    farmZone: overrides && 'farmZone' in overrides ? overrides.farmZone ?? null : 'derived_savanna',
    farmState: 'Oyo',
    farmLga: 'Ibadan North',
    farmQueryStatus: 'ok',
    plotsQueryStatus: 'ok',
    coreQueryErrors: [],
    retrievedAt,
    scope: 'farm',
    domains: {
      crop_identity_variety_and_stage: {
        domain: 'crop_identity_variety_and_stage',
        status: activeCycles.length > 0 ? 'ok' : 'empty',
        data: { activeCycles, fallbackPlotCrops: [] },
        sourceRefs: [],
        conflicts: [],
        missingFields: [],
        validationIssues: [],
      },
    } as unknown as LiveFarmContextSnapshot['domains'],
    auditContextRefs: [],
    conflicts: [],
    missingInformation: [],
    validationIssues: [],
    memoryExtension: { available: false, reason: 'batch_03_2_pending', farmScopeItems: [], profileScopeItems: [] },
  };
}

function makeVerifiedFarmContext(overrides?: Parameters<typeof makeLiveSnapshot>[0]) {
  const snap = makeLiveSnapshot(overrides);
  const res = resolveVerifiedAgronomicFarmContextFromSnapshot(snap, {
    plotId: overrides?.plotId ?? 'plot-01',
    cropId: overrides?.cropId ?? 'maize',
    referenceDate: '2026-11-22T12:30:00Z',
  });
  if (!res.ok) throw new Error(`Expected verified farm context fixture, got ${res.reasonCode}`);
  return res.context;
}

function makeApprovedMaizeCalc(overrides?: {
  farmId?: string;
  plotId?: string;
  requestId?: string;
  zone?: string;
  referenceDate?: string;
}) {
  const farmId = overrides?.farmId ?? 'farm-alpha';
  const plotId = overrides?.plotId ?? 'plot-01';
  const res = evaluateWithTestApprovedProtocol(
    {
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 2,
      soil: {
        pH: 6.2,
        phosphorus: { value: 12, unit: 'ppm', basis: 'elemental_P' },
        potassium: { value: 0.25, unit: 'cmol_kg', basis: 'elemental_K' },
        organicMatterPercent: 1.8,
        provenance: 'lab_confirmed',
        extractionMethod: 'bray_1',
        samplingDepthCm: 15,
        testDate: '2026-10-01',
        farmId,
        plotId,
        verifiedLabReport: makeTestVerifiedLabReport({ farmId, plotId }),
      },
      zone: overrides?.zone ?? 'derived_savanna',
      growthStage: 'basal',
      farmId,
      plotId,
      requestId: overrides?.requestId ?? 'req-001',
      referenceDate: overrides?.referenceDate ?? '2026-11-22T12:00:00Z',
    },
    makeTestApprovedProtocolFixture('maize'),
  );
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
  it('accepts deterministic calculation output when trusted verifiedFarmContext matches crop, farm, plot, request, zone, growthStage, product, values, units, and timing', () => {
    const calc = makeApprovedMaizeCalc();
    const vctx = makeVerifiedFarmContext();
    const deterministicText = formatApprovedFertiliserCalculation(calc, 'en');

    const res = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      growthStage: 'basal',
      verifiedFarmContext: vctx,
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(res.passed).toBe(true);
    expect(res.recommendationStatus).toBe('approved_calculation');

    // Cross-growth-stage reuse MUST fail closed
    const wrongStage = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      growthStage: 'flowering',
      verifiedFarmContext: makeVerifiedFarmContext({ currentStage: 'flowering' }),
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(wrongStage.passed).toBe(false);
    expect(wrongStage.reasonCode).toBe('calculation_growth_stage_mismatch');
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
      growthStage: 'basal',
      verifiedFarmContext: makeVerifiedFarmContext(),
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

  it('rejects cross-crop, cross-farm, cross-plot, cross-request, wrong-zone, stale, or forged calculation bindings', () => {
    const calc = makeApprovedMaizeCalc();
    const deterministicText = formatApprovedFertiliserCalculation(calc, 'en');

    const wrongCrop = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'tomato',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      growthStage: 'basal',
      verifiedFarmContext: makeVerifiedFarmContext({ cropId: 'tomato' }),
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
      growthStage: 'basal',
      verifiedFarmContext: makeVerifiedFarmContext({ farmId: 'farm-beta' }),
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
      growthStage: 'basal',
      verifiedFarmContext: makeVerifiedFarmContext({ plotId: 'plot-99' }),
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
      growthStage: 'basal',
      verifiedFarmContext: resolveVerifiedAgronomicFarmContextFromSnapshot(
        makeLiveSnapshot({ retrievedAt: '2026-11-25T12:25:00Z' }),
        { plotId: 'plot-01', cropId: 'maize', referenceDate: '2026-11-25T12:30:00Z' },
      ).ok
        ? (
            resolveVerifiedAgronomicFarmContextFromSnapshot(
              makeLiveSnapshot({ retrievedAt: '2026-11-25T12:25:00Z' }),
              { plotId: 'plot-01', cropId: 'maize', referenceDate: '2026-11-25T12:30:00Z' },
            ) as { ok: true; context: ReturnType<typeof makeVerifiedFarmContext> }
          ).context
        : null,
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-25T12:30:00Z', // > 24h stale calculation
    });
    expect(stale.passed).toBe(false);
    expect(stale.reasonCode).toBe('calculation_stale_or_invalid');

    // Hand-crafted (cloned / JSON-forged) calculation without unforgeable engine brand MUST fail closed!
    const forgedCalc = JSON.parse(JSON.stringify(calc));
    const forgedRes = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      growthStage: 'basal',
      verifiedFarmContext: makeVerifiedFarmContext(),
      language: 'en',
      approvedCalculation: forgedCalc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(forgedRes.passed).toBe(false);
    expect(forgedRes.reasonCode).toBe('calculation_untrusted_origin');

    // Shallow clone MUST also fail closed (not in WeakSet registry)
    const shallowRes = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      growthStage: 'basal',
      verifiedFarmContext: makeVerifiedFarmContext(),
      language: 'en',
      approvedCalculation: { ...calc },
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(shallowRes.passed).toBe(false);
    expect(shallowRes.reasonCode).toBe('calculation_untrusted_origin');
  });

  it('Revision 5: requires trusted immutable VerifiedAgronomicFarmContext and rejects missing, forged, cloned, mutated, stale, or mismatched context', () => {
    const calc = makeApprovedMaizeCalc();
    const vctx = makeVerifiedFarmContext();
    const deterministicText = formatApprovedFertiliserCalculation(calc, 'en');

    // 1. Missing verifiedFarmContext even when raw zone & growthStage strings are supplied -> fails closed
    const missingVctx = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      zone: 'derived_savanna',
      growthStage: 'basal',
      verifiedFarmContext: null,
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(missingVctx.passed).toBe(false);
    expect(missingVctx.reasonCode).toBe('verified_farm_context_missing');

    // 2. Caller-forged plain object claiming verificationState: 'verified_current' -> fails closed
    const forgedCtx = { ...vctx };
    expect(isTrustedVerifiedFarmContext(forgedCtx)).toBe(false);
    expect(isTrustedVerifiedFarmContext(structuredClone(vctx))).toBe(false);
    expect(isTrustedVerifiedFarmContext(JSON.parse(JSON.stringify(vctx)))).toBe(false);
    const forgedAttempt = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      verifiedFarmContext: forgedCtx,
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-22T12:30:00Z',
    });
    expect(forgedAttempt.passed).toBe(false);
    expect(forgedAttempt.reasonCode).toBe('verified_farm_context_untrusted');

    // 3. Verified context is deep-frozen (attempted mutation throws TypeError)
    expect(Object.isFrozen(vctx)).toBe(true);
    expect(() => {
      (vctx as unknown as Record<string, unknown>).growthStage = 'flowering';
    }).toThrow(TypeError);

    // 4. Stale verified context (> 15 minutes old) -> fails closed
    const staleCtxRes = validateAssistantNumericalOutput(deterministicText, {
      cropId: 'maize',
      farmId: 'farm-alpha',
      plotId: 'plot-01',
      requestId: 'req-001',
      verifiedFarmContext: vctx,
      language: 'en',
      approvedCalculation: calc,
      referenceDate: '2026-11-22T13:00:00Z', // 35 minutes after resolvedAt
    });
    expect(staleCtxRes.passed).toBe(false);
    expect(staleCtxRes.reasonCode).toBe('verified_farm_context_stale');

    // 5. Snapshot resolver fails closed on missing zone, missing cycle, plot mismatch, inactive cycle, missing/invalid stage, stale snapshot
    expect(
      resolveVerifiedAgronomicFarmContextFromSnapshot(makeLiveSnapshot({ farmZone: null }), {
        referenceDate: '2026-11-22T12:30:00Z',
      }),
    ).toMatchObject({ ok: false, reasonCode: 'farm_zone_unverified' });

    expect(
      resolveVerifiedAgronomicFarmContextFromSnapshot(makeLiveSnapshot({ noCycles: true }), {
        referenceDate: '2026-11-22T12:30:00Z',
      }),
    ).toMatchObject({ ok: false, reasonCode: 'crop_cycle_missing' });

    expect(
      resolveVerifiedAgronomicFarmContextFromSnapshot(makeLiveSnapshot({ plotId: 'plot-other' }), {
        plotId: 'plot-01',
        referenceDate: '2026-11-22T12:30:00Z',
      }),
    ).toMatchObject({ ok: false, reasonCode: 'crop_cycle_plot_mismatch' });

    expect(
      resolveVerifiedAgronomicFarmContextFromSnapshot(
        makeLiveSnapshot({ cycleState: 'unverified_provisional' }),
        { referenceDate: '2026-11-22T12:30:00Z' },
      ),
    ).toMatchObject({ ok: false, reasonCode: 'crop_cycle_inactive' });

    expect(
      resolveVerifiedAgronomicFarmContextFromSnapshot(makeLiveSnapshot({ currentStage: null }), {
        referenceDate: '2026-11-22T12:30:00Z',
      }),
    ).toMatchObject({ ok: false, reasonCode: 'growth_stage_missing' });

    expect(
      resolveVerifiedAgronomicFarmContextFromSnapshot(
        makeLiveSnapshot({ currentStage: 'invalid_stage_999' }),
        { referenceDate: '2026-11-22T12:30:00Z' },
      ),
    ).toMatchObject({ ok: false, reasonCode: 'growth_stage_invalid' });

    expect(
      resolveVerifiedAgronomicFarmContextFromSnapshot(
        makeLiveSnapshot({ retrievedAt: '2026-11-22T10:00:00Z' }),
        { referenceDate: '2026-11-22T12:30:00Z' },
      ),
    ).toMatchObject({ ok: false, reasonCode: 'farm_context_stale' });

    // 6. Non-numerical response without verifiedFarmContext continues to pass safely as general_guidance
    const nonNumeric = validateAssistantNumericalOutput(
      'Scout your maize whorls early in the morning and obtain a laboratory soil test.',
      { cropId: 'maize', language: 'en' },
    );
    expect(nonNumeric.passed).toBe(true);
    expect(nonNumeric.recommendationStatus).toBe('general_guidance');
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
    ['Nutrient-annotated N rate', 'Provide 120 kg N/ha across the plot.', 'en'],
    ['Nutrient-annotated P2O5 rate', 'Supply 60 kg P2O5 per hectare at planting.', 'en'],
    ['Natural-language written number', 'Spread four bags per hectare before rain.', 'en'],
    ['Household bottle-cap measure', 'Place 2 bottle caps per plant beside each stand.', 'en'],
    ['Application interval days', 'Apply every 7 days during vegetative growth.', 'en'],
    ['Application DAP timing interval', 'Top-dress at 10-14 DAP along the rows.', 'en'],
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

  it('rejects arbitrary caller-supplied source quotation objects (unbranded) and accepts ONLY server-trusted branded quotes', () => {
    const plainUnbrandedQuote: VerifiedSourceQuotationContext = {
      verified: true,
      sourceId: 'src-iita-2024-01',
      documentTitle: 'IITA Maize Production Guide (Open Access)',
      passageRef: 'Section 4.2, p. 18',
      licenceIdentifier: 'CC-BY-4.0',
      licencePermitsQuotation: true,
      approvedForCommercialAiUse: true,
      publicationDate: '2024-05-01',
      effectiveDate: '2024-06-01',
      expiresAt: '2028-06-01',
      supportsSpecificClaim: true,
      applicableCropId: 'maize',
      applicableRegion: 'derived_savanna',
      attribution: 'IITA (2024), CC-BY-4.0',
      explicitNonPrescriptionSeparation: true,
    };

    // Unbranded plain object MUST fail closed even when all Booleans & strings look valid!
    expect(isValidVerifiedSourceQuote(plainUnbrandedQuote, 'maize', '2026-11-22')).toBe(false);
    const unbrandedAttempt = validateAssistantNumericalOutput(
      'General published source information (not a farm-specific prescription): IITA (2024) p. 18 cites 200 kg/ha.',
      { cropId: 'maize', language: 'en', verifiedSourceQuote: plainUnbrandedQuote, referenceDate: '2026-11-22' },
    );
    expect(unbrandedAttempt.passed).toBe(false);

    // Branded test quote with complete metadata passes
    const brandedValidQuote = __mintTestVerifiedSourceQuote(plainUnbrandedQuote);
    const ok = validateAssistantNumericalOutput(
      'General published source information (not a farm-specific prescription): IITA (2024) p. 18 cites 200 kg/ha.',
      { cropId: 'maize', language: 'en', verifiedSourceQuote: brandedValidQuote, referenceDate: '2026-11-22' },
    );
    expect(ok.passed).toBe(true);
    expect(ok.recommendationStatus).toBe('source_information');

    // Expired branded quote -> rejected
    const expiredQuote = validateAssistantNumericalOutput(
      'General published source information: 200 kg/ha.',
      {
        cropId: 'maize',
        language: 'en',
        verifiedSourceQuote: __mintTestVerifiedSourceQuote({ ...plainUnbrandedQuote, expiresAt: '2025-01-01' }),
        referenceDate: '2026-11-22',
      },
    );
    expect(expiredQuote.passed).toBe(false);

    // Missing licenceIdentifier -> rejected
    const missingLicence = validateAssistantNumericalOutput(
      'General published source information: 200 kg/ha.',
      {
        cropId: 'maize',
        language: 'en',
        verifiedSourceQuote: __mintTestVerifiedSourceQuote({ ...plainUnbrandedQuote, licenceIdentifier: '' }),
        referenceDate: '2026-11-22',
      },
    );
    expect(missingLicence.passed).toBe(false);

    // Crop mismatch (maize source quoted for tomato) -> rejected
    const wrongCrop = validateAssistantNumericalOutput(
      'General published source information: 200 kg/ha.',
      {
        cropId: 'tomato',
        language: 'en',
        verifiedSourceQuote: brandedValidQuote,
        referenceDate: '2026-11-22',
      },
    );
    expect(wrongCrop.passed).toBe(false);
  });
});
