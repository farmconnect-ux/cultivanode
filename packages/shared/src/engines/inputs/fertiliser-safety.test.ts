import { describe, expect, it } from 'vitest';
import {
  CMOL_KG_TO_MG_KG_K,
  K_TO_K2O_FACTOR,
  P_TO_P2O5_FACTOR,
  SUPPORTED_FERTILISER_CROP_IDS,
  calculateFertiliserRecommendation,
  convertSoilPotassium,
  elementalKToK2O,
  elementalPToP2O5,
  evaluateFertiliserRecommendation,
  k2OToElementalK,
  p2O5ToElementalP,
} from './index';
import { CultivaNodeEnginesClient } from '../api-gateway/client';

const LAB_SOIL_VALID = {
  pH: 6.2,
  phosphorusPpm: 12,
  potassium: { value: 0.25, unit: 'cmol_kg' as const, basis: 'elemental_K' as const, extractionMethod: 'ammonium_acetate_1M' as const },
  organicMatterPercent: 1.8,
  provenance: 'lab_confirmed' as const,
  extractionMethod: 'bray_1' as const,
  samplingDepthCm: 15,
  testDate: '2026-10-01',
};

describe('Batch 04.0-H — Typed Nutrient Unit Conversions (Reference Verification)', () => {
  it('converts cmol(+)/kg and meq/100g exchangeable K accurately and preserves original laboratory values', () => {
    // Reference: K atomic weight = 39.0983 g/mol, valence +1 -> 0.25 cmol(+)/kg = 97.74575 -> 97.75 mg/kg
    const res = convertSoilPotassium({ value: 0.25, unit: 'cmol_kg', basis: 'elemental_K' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.originalValue).toBe(0.25);
      expect(res.originalUnit).toBe('cmol_kg');
      expect(res.originalBasis).toBe('elemental_K');
      expect(res.derivedElementalMgKg).toBe(97.75);
      expect(res.derivedK2oMgKg).toBe(Number((97.75 * K_TO_K2O_FACTOR).toFixed(2)));
      expect(res.conversionApplied).toBe(true);
      expect(res.conversionFactor).toBe(CMOL_KG_TO_MG_KG_K);
    }

    const meq = convertSoilPotassium({ value: 1.0, unit: 'meq_100g' });
    expect(meq.ok).toBe(true);
    if (meq.ok) {
      expect(meq.derivedElementalMgKg).toBe(390.98);
    }
  });

  it('distinguishes elemental K from K2O and elemental P from P2O5 accurately', () => {
    const k2o = convertSoilPotassium({ value: 120.46, unit: 'mg_kg', basis: 'K2O' });
    expect(k2o.ok).toBe(true);
    if (k2o.ok) {
      expect(k2o.derivedElementalMgKg).toBe(100);
      expect(k2o.derivedK2oMgKg).toBe(120.46);
    }
    expect(elementalKToK2O(100)).toBe(120.46);
    expect(k2OToElementalK(120.46)).toBe(100);
    expect(elementalPToP2O5(100)).toBe(Number((100 * P_TO_P2O5_FACTOR).toFixed(2)));
    expect(p2O5ToElementalP(229.14)).toBe(100);
  });

  it('rejects incompatible, ambiguous, or out-of-range potassium units instead of silently converting', () => {
    const cmolAsK2O = convertSoilPotassium({ value: 0.25, unit: 'cmol_kg', basis: 'K2O' });
    expect(cmolAsK2O.ok).toBe(false);
    if (!cmolAsK2O.ok) expect(cmolAsK2O.code).toBe('soil_basis_unknown');

    const badUnit = convertSoilPotassium({ value: 100, unit: 'lbs_acre', basis: 'elemental_K' });
    expect(badUnit.ok).toBe(false);
    if (!badUnit.ok) expect(badUnit.code).toBe('soil_unit_incompatible');

    const badBasis = convertSoilPotassium({ value: 100, unit: 'mg_kg', basis: 'unknown' });
    expect(badBasis.ok).toBe(false);
    if (!badBasis.ok) expect(badBasis.code).toBe('soil_basis_unknown');

    expect(convertSoilPotassium({ value: -5, unit: 'mg_kg' }).ok).toBe(false);
    expect(convertSoilPotassium({ value: Number.NaN, unit: 'mg_kg' }).ok).toBe(false);
  });
});

describe('Batch 04.0-H — Fail-Closed Deterministic Fertiliser Engine & Contract', () => {
  it.each(SUPPORTED_FERTILISER_CROP_IDS)(
    'produces approved_calculation with protocol version for supported crop %s with complete lab soil data',
    (cropId) => {
      const res = evaluateFertiliserRecommendation({
        cropId,
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 2,
        soil: LAB_SOIL_VALID,
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
        requireStrictSoilProvenance: true,
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.status).toBe('approved_calculation');
        expect(res.protocol.protocolVersion).toContain(cropId);
        expect(res.protocol.approvalStatus).toBe('provisional_software_validated');
        expect(res.recommendation.potassiumConversion?.originalUnit).toBe('cmol_kg');
      }
    },
  );

  it('blocks unsupported crops (lettuce, bell-pepper) across evaluate, calculate, and EngineClient local mode', async () => {
    for (const crop of ['lettuce', 'bell-pepper', 'spinach']) {
      const evalRes = evaluateFertiliserRecommendation({
        cropId: crop,
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        soil: LAB_SOIL_VALID,
        requireStrictSoilProvenance: true,
      });
      expect(evalRes.ok).toBe(false);
      if (!evalRes.ok) {
        expect(evalRes.status).toBe('unsupported_crop');
        expect(evalRes.reasonCode).toBe('crop_not_supported');
      }

      expect(() =>
        calculateFertiliserRecommendation(crop, 5, 1, {
          pH: 6.2,
          phosphorusPpm: 12,
          potassiumPpm: 120,
          organicMatterPercent: 1.8,
        }),
      ).toThrow('crop_not_supported');

      const client = new CultivaNodeEnginesClient({ mode: 'in_memory' });
      await expect(
        client.calculateFertiliserRecommendation(crop, 5, 1, {
          pH: 6.2,
          phosphorusPpm: 12,
          potassiumPpm: 120,
          organicMatterPercent: 1.8,
        }),
      ).rejects.toThrow('crop_not_supported');
    }
  });

  it('fails closed on missing crop, missing/expired/modelled/farmer-reported soil, missing method/depth/stage, geographic mismatch, and unapproved coefficients', () => {
    const missingCrop = evaluateFertiliserRecommendation({
      cropId: '',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
    });
    expect(missingCrop.ok).toBe(false);
    if (!missingCrop.ok) expect(missingCrop.reasonCode).toBe('crop_not_identified');

    const missingSoil = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: null,
    });
    expect(missingSoil.ok).toBe(false);
    if (!missingSoil.ok) expect(missingSoil.reasonCode).toBe('soil_test_missing');

    const modelledSoil = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: { ...LAB_SOIL_VALID, provenance: 'modelled_estimate' },
    });
    expect(modelledSoil.ok).toBe(false);
    if (!modelledSoil.ok) expect(modelledSoil.reasonCode).toBe('soil_modelled_not_allowed');

    const farmerSoil = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: { ...LAB_SOIL_VALID, provenance: 'farmer_reported' },
    });
    expect(farmerSoil.ok).toBe(false);
    if (!farmerSoil.ok) expect(farmerSoil.reasonCode).toBe('soil_not_lab_confirmed');

    const expiredSoil = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: { ...LAB_SOIL_VALID, testDate: '2024-01-01' },
      referenceDate: '2026-11-22',
    });
    expect(expiredSoil.ok).toBe(false);
    if (!expiredSoil.ok) expect(expiredSoil.reasonCode).toBe('soil_test_expired');

    const missingMethod = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: { ...LAB_SOIL_VALID, extractionMethod: undefined },
      growthStage: 'basal',
      requireStrictSoilProvenance: true,
    });
    expect(missingMethod.ok).toBe(false);
    if (!missingMethod.ok) expect(missingMethod.reasonCode).toBe('soil_method_missing');

    const missingDepth = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: { ...LAB_SOIL_VALID, samplingDepthCm: undefined },
      growthStage: 'basal',
      requireStrictSoilProvenance: true,
    });
    expect(missingDepth.ok).toBe(false);
    if (!missingDepth.ok) expect(missingDepth.reasonCode).toBe('soil_depth_missing');

    const missingStage = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      requireStrictSoilProvenance: true,
    });
    expect(missingStage.ok).toBe(false);
    if (!missingStage.ok) expect(missingStage.reasonCode).toBe('growth_stage_missing');

    const badZone = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      zone: 'arctic_tundra',
    });
    expect(badZone.ok).toBe(false);
    if (!badZone.ok) expect(badZone.reasonCode).toBe('geographic_mismatch');

    const unapprovedProtocol = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      protocolOverride: { protocolVersion: '' },
    });
    expect(unapprovedProtocol.ok).toBe(false);
    if (!unapprovedProtocol.ok) expect(unapprovedProtocol.reasonCode).toBe('coefficients_unapproved');
  });
});
