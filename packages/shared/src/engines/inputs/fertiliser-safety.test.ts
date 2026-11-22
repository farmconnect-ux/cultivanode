import { describe, expect, it } from 'vitest';
import {
  CMOL_KG_TO_MG_KG_K,
  K_TO_K2O_FACTOR,
  P_TO_P2O5_FACTOR,
  SUPPORTED_FERTILISER_CROP_IDS,
  SUPPORTED_FERTILISER_PROTOCOLS,
  calculateFertiliserRecommendation,
  convertSoilPhosphorus,
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
  phosphorus: {
    value: 12,
    unit: 'ppm' as const,
    basis: 'elemental_P' as const,
    extractionMethod: 'bray_1' as const,
  },
  potassium: {
    value: 0.25,
    unit: 'cmol_kg' as const,
    basis: 'elemental_K' as const,
    extractionMethod: 'ammonium_acetate_1M' as const,
  },
  organicMatterPercent: 1.8,
  provenance: 'lab_confirmed' as const,
  extractionMethod: 'bray_1' as const,
  samplingDepthCm: 15,
  testDate: '2026-10-01',
};

function makeApprovedProtocolFixture(cropId: (typeof SUPPORTED_FERTILISER_CROP_IDS)[number]) {
  const base = SUPPORTED_FERTILISER_PROTOCOLS[cropId];
  return {
    approvalStatus: 'agronomist_approved' as const,
    approvalRecord: {
      reviewerName: 'Dr. A. Reviewer (Test Fixture)',
      reviewerCredentials: 'Registered Agronomist / PhD Soil Fertility (Test Fixture)',
      competenceScope: `${cropId} nutrient calibration — Nigeria savanna & rainforest`,
      approvalDate: '2026-09-15',
      status: 'active' as const,
      expiresAt: '2027-09-15',
      sourceEvidence: 'Test fixture citation — NOT a production agronomic approval',
      protocolVersion: base.protocolVersion,
      applicableCropId: cropId,
      applicableZones: ['derived_savanna', 'rainforest'],
    },
  };
}

describe('Batch 04.0-H Revision 2 — Finding 5: Typed Nutrient Unit & Basis Validation', () => {
  it('converts cmol(+)/kg and meq/100g exchangeable K accurately and preserves original lab metadata', () => {
    const cmolRes = convertSoilPotassium({
      value: 0.25,
      unit: 'cmol_kg',
      basis: 'elemental_K',
      extractionMethod: 'ammonium_acetate_1M',
      provenance: 'lab_confirmed',
    });
    expect(cmolRes.ok).toBe(true);
    if (cmolRes.ok) {
      expect(cmolRes.originalValue).toBe(0.25);
      expect(cmolRes.originalUnit).toBe('cmol_kg');
      expect(cmolRes.originalBasis).toBe('elemental_K');
      expect(cmolRes.originalExtractionMethod).toBe('ammonium_acetate_1M');
      expect(cmolRes.originalProvenance).toBe('lab_confirmed');
      expect(cmolRes.derivedElementalMgKg).toBe(97.75);
      expect(cmolRes.derivedK2oMgKg).toBe(117.75);
      expect(cmolRes.conversionFactor).toBe(CMOL_KG_TO_MG_KG_K);
      expect(cmolRes.agronomicInterpretationApplied).toBe(false);
    }

    const meqRes = convertSoilPotassium({ value: 0.5, unit: 'meq_100g' });
    expect(meqRes.ok).toBe(true);
    if (meqRes.ok) {
      expect(meqRes.derivedElementalMgKg).toBe(195.49);
    }
  });

  it('converts elemental K <-> K2O and elemental P <-> P2O5 accurately when basis is explicitly declared', () => {
    expect(K_TO_K2O_FACTOR).toBe(1.2046);
    expect(P_TO_P2O5_FACTOR).toBe(2.2914);
    expect(elementalKToK2O(100)).toBe(120.46);
    expect(k2OToElementalK(120.46)).toBe(100);
    expect(elementalPToP2O5(100)).toBe(229.14);
    expect(p2O5ToElementalP(229.14)).toBe(100);

    const k2oRes = convertSoilPotassium({ value: 120.46, unit: 'mg_kg', basis: 'K2O' });
    expect(k2oRes.ok).toBe(true);
    if (k2oRes.ok) {
      expect(k2oRes.originalBasis).toBe('K2O');
      expect(k2oRes.derivedElementalMgKg).toBe(100);
      expect(k2oRes.derivedK2oMgKg).toBe(120.46);
    }
  });

  it('fails closed on missing basis for mg_kg/ppm, incompatible cmol_kg+K2O, unknown units, and legacy untyped potassiumPpm', () => {
    // Missing basis on mg_kg and ppm MUST fail closed (never silently assume elemental_K)
    const missingBasisPpm = convertSoilPotassium({ value: 120, unit: 'ppm' });
    expect(missingBasisPpm.ok).toBe(false);
    if (!missingBasisPpm.ok) expect(missingBasisPpm.code).toBe('soil_basis_unknown');

    const missingBasisMgKg = convertSoilPotassium({ value: 120, unit: 'mg_kg' });
    expect(missingBasisMgKg.ok).toBe(false);
    if (!missingBasisMgKg.ok) expect(missingBasisMgKg.code).toBe('soil_basis_unknown');

    // Incompatible cmol_kg + K2O
    const badBasis = convertSoilPotassium({ value: 0.3, unit: 'cmol_kg', basis: 'K2O' });
    expect(badBasis.ok).toBe(false);
    if (!badBasis.ok) expect(badBasis.code).toBe('soil_basis_unknown');

    // Unknown unit & negative value
    const badUnit = convertSoilPotassium({ value: 120, unit: 'bags_per_ha' });
    expect(badUnit.ok).toBe(false);
    if (!badUnit.ok) expect(badUnit.code).toBe('soil_unit_incompatible');

    const neg = convertSoilPotassium({ value: -5, unit: 'mg_kg', basis: 'elemental_K' });
    expect(neg.ok).toBe(false);
    if (!neg.ok) expect(neg.code).toBe('soil_value_invalid');

    // Legacy untyped potassiumPpm and phosphorusPpm MUST fail closed in evaluateFertiliserRecommendation
    const legacyKRes = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: {
        pH: 6.2,
        phosphorus: { value: 12, unit: 'ppm', basis: 'elemental_P' },
        potassiumPpm: 140,
        organicMatterPercent: 1.8,
        provenance: 'lab_confirmed',
        extractionMethod: 'bray_1',
        samplingDepthCm: 15,
        testDate: '2026-10-01',
      },
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: makeApprovedProtocolFixture('maize'),
    });
    expect(legacyKRes.ok).toBe(false);
    if (!legacyKRes.ok) {
      expect(legacyKRes.status).toBe('invalid_input');
      expect(legacyKRes.reasonCode).toBe('soil_basis_unknown');
    }

    // Missing phosphorus basis & legacy untyped phosphorusPpm MUST fail closed
    const missingPBasis = convertSoilPhosphorus({ value: 12, unit: 'ppm' });
    expect(missingPBasis.ok).toBe(false);
    if (!missingPBasis.ok) expect(missingPBasis.code).toBe('soil_basis_unknown');

    const p2o5Res = convertSoilPhosphorus({ value: 22.914, unit: 'mg_kg', basis: 'P2O5' });
    expect(p2o5Res.ok).toBe(true);
    if (p2o5Res.ok) {
      expect(p2o5Res.derivedElementalMgKg).toBe(10);
      expect(p2o5Res.agronomicInterpretationApplied).toBe(false);
    }

    const legacyPRes = evaluateFertiliserRecommendation({
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
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: makeApprovedProtocolFixture('maize'),
    });
    expect(legacyPRes.ok).toBe(false);
    if (!legacyPRes.ok) expect(legacyPRes.reasonCode).toBe('soil_basis_unknown');

    expect(() => elementalKToK2O(-1)).toThrow(RangeError);
    expect(() => elementalPToP2O5(Number.NaN)).toThrow(RangeError);
  });
});

describe('Batch 04.0-H Revision 2 — Finding 1: Provisional Protocols Must Fail Closed', () => {
  it('blocks ALL FIVE built-in provisional_software_validated protocols from authorising public numerical prescriptions', () => {
    for (const cropId of SUPPORTED_FERTILISER_CROP_IDS) {
      expect(SUPPORTED_FERTILISER_PROTOCOLS[cropId].approvalStatus).toBe('provisional_software_validated');
      expect(SUPPORTED_FERTILISER_PROTOCOLS[cropId].approvalRecord).toBeNull();

      const res = evaluateFertiliserRecommendation({
        cropId,
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 2,
        soil: LAB_SOIL_VALID,
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.status).toBe('insufficient_evidence');
        expect(res.reasonCode).toBe('protocol_provisional_not_approved');
      }
    }
  });

  it('succeeds ONLY when an agronomist_approved protocol has a complete, matching approval record', () => {
    for (const cropId of SUPPORTED_FERTILISER_CROP_IDS) {
      const okRes = evaluateFertiliserRecommendation({
        cropId,
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 2,
        soil: LAB_SOIL_VALID,
        zone: 'derived_savanna',
        growthStage: 'basal',
        farmId: 'farm-123',
        plotId: 'plot-456',
        requestId: 'req-789',
        referenceDate: '2026-11-22',
        protocolOverride: makeApprovedProtocolFixture(cropId),
      });
      expect(okRes.ok).toBe(true);
      if (okRes.ok) {
        expect(okRes.status).toBe('approved_calculation');
        expect(okRes.protocol.approvalStatus).toBe('agronomist_approved');
        expect(okRes.recommendation.binding?.cropId).toBe(cropId);
        expect(okRes.recommendation.binding?.farmId).toBe('farm-123');
        expect(okRes.recommendation.binding?.plotId).toBe('plot-456');
        expect(okRes.recommendation.binding?.requestId).toBe('req-789');
        expect(okRes.recommendation.binding?.zone).toBe('derived_savanna');
      }
    }

    // Missing approvalRecord even if approvalStatus is set to agronomist_approved -> fail closed
    const noRecord = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: { approvalStatus: 'agronomist_approved', approvalRecord: null },
    });
    expect(noRecord.ok).toBe(false);
    if (!noRecord.ok) expect(noRecord.reasonCode).toBe('approval_record_incomplete');

    // Mismatched crop in approvalRecord -> fail closed
    const badCropRecord = evaluateFertiliserRecommendation({
      cropId: 'tomato',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: {
        ...makeApprovedProtocolFixture('maize'),
        protocolVersion: SUPPORTED_FERTILISER_PROTOCOLS.tomato.protocolVersion,
      },
    });
    expect(badCropRecord.ok).toBe(false);
    if (!badCropRecord.ok) expect(badCropRecord.reasonCode).toBe('approval_record_incomplete');

    // Withdrawn, expired, and administrative approvals MUST fail closed
    const withdrawn = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: {
        ...makeApprovedProtocolFixture('maize'),
        approvalRecord: { ...makeApprovedProtocolFixture('maize').approvalRecord, status: 'withdrawn' },
      },
    });
    expect(withdrawn.ok).toBe(false);
    if (!withdrawn.ok) expect(withdrawn.reasonCode).toBe('approval_record_not_active');

    const expired = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: {
        ...makeApprovedProtocolFixture('maize'),
        approvalRecord: { ...makeApprovedProtocolFixture('maize').approvalRecord, expiresAt: '2026-01-01' },
      },
    });
    expect(expired.ok).toBe(false);
    if (!expired.ok) expect(expired.reasonCode).toBe('approval_record_expired');

    const adminApproved = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: {
        ...makeApprovedProtocolFixture('maize'),
        approvalStatus: 'administrative_approved',
      },
    });
    expect(adminApproved.ok).toBe(false);
    if (!adminApproved.ok) expect(adminApproved.reasonCode).toBe('protocol_provisional_not_approved');

    // Cross-farm soil report reuse MUST fail closed
    const crossFarmSoil = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      farmId: 'farm-alpha',
      soil: { ...LAB_SOIL_VALID, farmId: 'farm-beta' },
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: makeApprovedProtocolFixture('maize'),
    });
    expect(crossFarmSoil.ok).toBe(false);
    if (!crossFarmSoil.ok) expect(crossFarmSoil.reasonCode).toBe('soil_context_mismatch');
  });

  it('preserves unsupported-crop rejection across evaluator, calculateFertiliserRecommendation, and CultivaNodeEnginesClient', async () => {
    for (const crop of ['lettuce', 'bell-pepper', 'spinach']) {
      const evalRes = evaluateFertiliserRecommendation({
        cropId: crop,
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        soil: LAB_SOIL_VALID,
        zone: 'derived_savanna',
        growthStage: 'vegetative',
      });
      expect(evalRes.ok).toBe(false);
      if (!evalRes.ok) {
        expect(evalRes.status).toBe('unsupported_crop');
        expect(evalRes.reasonCode).toBe('crop_not_supported');
      }

      expect(() =>
        calculateFertiliserRecommendation(crop, 5, 1, LAB_SOIL_VALID, {
          zone: 'derived_savanna',
          growthStage: 'vegetative',
        }),
      ).toThrow('crop_not_supported');

      const client = new CultivaNodeEnginesClient({ mode: 'in_memory' });
      await expect(
        client.calculateFertiliserRecommendation(crop, 5, 1, LAB_SOIL_VALID),
      ).rejects.toThrow('crop_not_supported');
    }
  });
});

describe('Batch 04.0-H Revision 2 — Findings 3 & 4: Mandatory Soil Provenance & Geographic Applicability', () => {
  it('enforces mandatory soil provenance, method, depth, date, stage, and zone unconditionally', () => {
    const approvedMaize = makeApprovedProtocolFixture('maize');

    const missingZone = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: approvedMaize,
    });
    expect(missingZone.ok).toBe(false);
    if (!missingZone.ok) expect(missingZone.reasonCode).toBe('zone_missing');

    const badZone = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      zone: 'arctic_tundra',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: approvedMaize,
    });
    expect(badZone.ok).toBe(false);
    if (!badZone.ok) expect(badZone.reasonCode).toBe('geographic_mismatch');

    const unapprovedZone = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      zone: 'sahel_savanna', // Not in approvedMaize.approvalRecord.applicableZones
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: approvedMaize,
    });
    expect(unapprovedZone.ok).toBe(false);
    if (!unapprovedZone.ok) expect(unapprovedZone.reasonCode).toBe('geographic_mismatch');

    const missingProvenance = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: { ...LAB_SOIL_VALID, provenance: undefined },
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: approvedMaize,
    });
    expect(missingProvenance.ok).toBe(false);
    if (!missingProvenance.ok) expect(missingProvenance.reasonCode).toBe('soil_not_lab_confirmed');

    const modelledSoil = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: { ...LAB_SOIL_VALID, provenance: 'modelled_estimate' },
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: approvedMaize,
    });
    expect(modelledSoil.ok).toBe(false);
    if (!modelledSoil.ok) expect(modelledSoil.reasonCode).toBe('soil_modelled_not_allowed');

    const futureDate = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: { ...LAB_SOIL_VALID, testDate: '2027-06-01' },
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: approvedMaize,
    });
    expect(futureDate.ok).toBe(false);
    if (!futureDate.ok) expect(futureDate.reasonCode).toBe('soil_test_future_date');

    const expiredDate = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: { ...LAB_SOIL_VALID, testDate: '2024-01-01' },
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: approvedMaize,
    });
    expect(expiredDate.ok).toBe(false);
    if (!expiredDate.ok) expect(expiredDate.reasonCode).toBe('soil_test_expired');

    const missingStage = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      soil: LAB_SOIL_VALID,
      zone: 'derived_savanna',
      referenceDate: '2026-11-22',
      protocolOverride: approvedMaize,
    });
    expect(missingStage.ok).toBe(false);
    if (!missingStage.ok) expect(missingStage.reasonCode).toBe('growth_stage_missing');
  });
});
