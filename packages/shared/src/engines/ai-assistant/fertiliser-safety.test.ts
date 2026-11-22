import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  askGroundedAiAssistant,
  detectFertiliserIntent,
  generateAgronomicAdvisorAnswer,
  validateAssistantNumericalOutput,
} from './index';
import { evaluateFertiliserRecommendation } from '../inputs/fertiliser';

afterEach(() => vi.unstubAllGlobals());

describe('Batch 04.0-H — Multilingual Intent Detection & Server-Side Numerical Fertiliser Validator', () => {
  it('fixes the Yoruba `iye` false trigger and clarifies ambiguous multilingual quantity queries', () => {
    // Ordinary Yoruba market/price query with `iye` must NOT trigger fertiliser advice
    const yorubaPrice = detectFertiliserIntent('Elo ni iye owo agbado ni oja loni?');
    expect(yorubaPrice.intent).toBe('other');

    // Ambiguous quantity-only query asks for clarification instead of emitting rates
    const ambiguousYo = detectFertiliserIntent('Iye melo ni mo le lo?');
    expect(ambiguousYo.intent).toBe('ambiguous_quantity');

    const ambiguousEn = detectFertiliserIntent('How many bags should I use?');
    expect(ambiguousEn.intent).toBe('ambiguous_quantity');

    // Genuine multilingual fertiliser terms ARE detected
    expect(detectFertiliserIntent('Bawo ni mo se le lo ajilẹ fun agbado mi?').intent).toBe('fertiliser');
    expect(detectFertiliserIntent('Which NPK fertilizer should I apply?').intent).toBe('fertiliser');
    expect(detectFertiliserIntent('Yaya zan yi amfani da takin zamani?').intent).toBe('fertiliser');
    expect(detectFertiliserIntent('Kedu ka m ga-esi tinye nri ala?').intent).toBe('fertiliser');

    // Rule-engine fallback on Yoruba price query does NOT emit NPK or bag rates
    const answerPrice = generateAgronomicAdvisorAnswer(
      'Elo ni iye owo agbado ni oja loni?',
      { farmerId: 'f1', cropId: 'maize', zone: 'rainforest' },
      'yo',
    );
    expect(answerPrice).not.toContain('NPK');
    expect(answerPrice).not.toMatch(/báàgì\s+(mẹrin|meji|\d+)/i);

    // Rule-engine fallback on ambiguous query asks for clarification
    const answerAmbig = generateAgronomicAdvisorAnswer(
      'Iye melo ni mo le lo?',
      { farmerId: 'f1', cropId: 'maize', zone: 'rainforest' },
      'yo',
    );
    expect(answerAmbig).not.toContain('NPK');
    expect(answerAmbig).toContain('alaye');
  });

  it('never emits numerical fertiliser prescriptions from rule-engine fallback for lettuce or maize', async () => {
    for (const cropId of ['lettuce', 'maize', '']) {
      for (const language of ['en', 'yo', 'pcm'] as const) {
        const res = await askGroundedAiAssistant({
          query: 'How much NPK and urea fertiliser should I apply per hectare?',
          context: { farmerId: 'f1', cropId, zone: 'derived_savanna' },
          language,
        });
        expect(res.providerUsed).toBe('rule-engine');
        expect(res.answer).not.toMatch(/\d+\s*(?:[-–]\s*\d+\s*)?(?:kg\/ha|bags?\/ha|kg\s+per\s+ha)/i);
        expect(res.answer).not.toMatch(/báàgì\s+(?:mẹrin|mẹfa|meji|mẹta|\d+)/i);
      }
    }
  });

  it('blocks LLM-generated unsupported numerical fertiliser prescriptions for lettuce and for maize without engine calculation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            content: [{ type: 'text', text: 'Apply NPK 15:15:15 at 250 kg/ha and Urea at 100 kg/ha to your lettuce.' }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    const lettuceRes = await askGroundedAiAssistant({
      query: 'Fertiliser rate for lettuce?',
      context: { farmerId: 'f1', cropId: 'lettuce', zone: 'derived_savanna' },
      anthropicApiKey: 'test-key',
      claudeModels: ['claude-test'],
    });
    expect(lettuceRes.passedSafetyGuardrail).toBe(false);
    expect(lettuceRes.numericGuardrailBlocked).toBe(true);
    expect(lettuceRes.recommendationStatus).toBe('unsupported_crop');
    expect(lettuceRes.numericGuardrailReasonCode).toBe('crop_not_supported');
    expect(lettuceRes.answer).not.toContain('250 kg/ha');
    expect(lettuceRes.answer).not.toContain('100 kg/ha');

    const maizeNoCalc = await askGroundedAiAssistant({
      query: 'Fertiliser rate for maize?',
      context: { farmerId: 'f1', cropId: 'maize', zone: 'derived_savanna' },
      anthropicApiKey: 'test-key',
      claudeModels: ['claude-test'],
    });
    expect(maizeNoCalc.passedSafetyGuardrail).toBe(false);
    expect(maizeNoCalc.numericGuardrailBlocked).toBe(true);
    expect(maizeNoCalc.recommendationStatus).toBe('insufficient_evidence');
    expect(maizeNoCalc.answer).not.toContain('250 kg/ha');
  });

  it('allows numerical fertiliser prescription ONLY when backed by a validated deterministic engine calculation, and separates licensed source_information', () => {
    const calc = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
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
      referenceDate: '2026-11-22',
      growthStage: 'basal',
      requireStrictSoilProvenance: true,
    });
    expect(calc.ok).toBe(true);
    if (!calc.ok) return;

    const validWithEngine = validateAssistantNumericalOutput(
      'Based on your lab soil test, apply NPK 15:15:15 at 220 kg/ha at planting.',
      { cropId: 'maize', language: 'en', approvedCalculation: calc.recommendation },
    );
    expect(validWithEngine.passed).toBe(true);
    expect(validWithEngine.recommendationStatus).toBe('approved_calculation');

    const sourceQuote = validateAssistantNumericalOutput(
      'General published source information (not a farm-specific prescription): IITA 2021 manual notes baseline NPK 15:15:15 at 200 kg/ha for trials.',
      { cropId: 'maize', language: 'en', allowSourceInformationQuote: true },
    );
    expect(sourceQuote.passed).toBe(true);
    expect(sourceQuote.recommendationStatus).toBe('source_information');
  });
});
