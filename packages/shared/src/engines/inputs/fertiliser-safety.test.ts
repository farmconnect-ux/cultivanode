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
  getFertiliserProtocolSnapshot,
  isTrustedFertiliserCalculation,
  isTrustedLaboratoryReport,
  k2OToElementalK,
  p2O5ToElementalP,
} from './index';
import {
  evaluateWithTestApprovedProtocol,
  makeTestApprovedProtocolFixture,
  makeTestVerifiedLabReport,
} from './__testing__/approved-protocol-test-harness';
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
  farmId: 'farm-123',
  plotId: 'plot-456',
  soilReportId: 'lab-report-001',
  verifiedLabReport: makeTestVerifiedLabReport({ farmId: 'farm-123', plotId: 'plot-456' }),
};

describe('Batch 04.0-H Revision 3 — Nutrient Unit & Basis Validation', () => {
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
    if (meqRes.ok) expect(meqRes.derivedElementalMgKg).toBe(195.49);
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
    if (k2oRes.ok) expect(k2oRes.derivedElementalMgKg).toBe(100);

    const p2o5Res = convertSoilPhosphorus({ value: 22.914, unit: 'mg_kg', basis: 'P2O5' });
    expect(p2o5Res.ok).toBe(true);
    if (p2o5Res.ok) {
      expect(p2o5Res.derivedElementalMgKg).toBe(10);
      expect(p2o5Res.agronomicInterpretationApplied).toBe(false);
    }
  });

  it('fails closed on missing K/P basis, incompatible units, and legacy untyped potassiumPpm/phosphorusPpm', () => {
    expect(convertSoilPotassium({ value: 120, unit: 'ppm' }).ok).toBe(false);
    expect(convertSoilPotassium({ value: 120, unit: 'mg_kg' }).ok).toBe(false);
    expect(convertSoilPotassium({ value: 0.3, unit: 'cmol_kg', basis: 'K2O' }).ok).toBe(false);
    expect(convertSoilPotassium({ value: 120, unit: 'bags_per_ha' }).ok).toBe(false);
    expect(convertSoilPotassium({ value: -5, unit: 'mg_kg', basis: 'elemental_K' }).ok).toBe(false);
    expect(convertSoilPhosphorus({ value: 12, unit: 'ppm' }).ok).toBe(false);
    expect(() => elementalKToK2O(-1)).toThrow(RangeError);
    expect(() => elementalPToP2O5(Number.NaN)).toThrow(RangeError);

    const legacyK = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: 'farm-123',
        plotId: 'plot-456',
        soil: { ...LAB_SOIL_VALID, potassium: undefined, potassiumPpm: 140 },
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
      },
      makeTestApprovedProtocolFixture('maize'),
    );
    expect(legacyK.ok).toBe(false);
    if (!legacyK.ok) expect(legacyK.reasonCode).toBe('soil_basis_unknown');

    const legacyP = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: 'farm-123',
        plotId: 'plot-456',
        soil: { ...LAB_SOIL_VALID, phosphorus: undefined, phosphorusPpm: 12 },
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
      },
      makeTestApprovedProtocolFixture('maize'),
    );
    expect(legacyP.ok).toBe(false);
    if (!legacyP.ok) expect(legacyP.reasonCode).toBe('soil_basis_unknown');
  });
});

describe('Batch 04.0-H Revision 3 — Finding 1 & 2: Mandatory Approval Lifecycle & Zero Caller Overrides', () => {
  it('blocks ALL FIVE built-in provisional protocols and rejects caller-supplied protocolOverride on public entry points', async () => {
    for (const cropId of SUPPORTED_FERTILISER_CROP_IDS) {
      expect(SUPPORTED_FERTILISER_PROTOCOLS[cropId].approvalStatus).toBe('provisional_software_validated');
      expect(SUPPORTED_FERTILISER_PROTOCOLS[cropId].approvalRecord).toBeNull();

      const res = evaluateFertiliserRecommendation({
        cropId,
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 2,
        farmId: 'farm-123',
        plotId: 'plot-456',
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

      // Public calculateFertiliserRecommendation & CultivaNodeEnginesClient MUST also fail closed
      expect(() =>
        calculateFertiliserRecommendation(cropId, 5, 2, LAB_SOIL_VALID, {
          farmId: 'farm-123',
          plotId: 'plot-456',
          zone: 'derived_savanna',
          growthStage: 'basal',
          referenceDate: '2026-11-22',
        }),
      ).toThrow('protocol_provisional_not_approved');

      const client = new CultivaNodeEnginesClient({ mode: 'in_memory' });
      await expect(
        client.calculateFertiliserRecommendation(cropId, 5, 2, LAB_SOIL_VALID),
      ).rejects.toThrow('protocol_provisional_not_approved');
    }

    // Adversarial caller attempting to inject `protocolOverride` at runtime -> MUST fail closed!
    const forgedRequest = {
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      farmId: 'farm-123',
      plotId: 'plot-456',
      soil: LAB_SOIL_VALID,
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
      protocolOverride: makeTestApprovedProtocolFixture('maize'),
    } as unknown as Parameters<typeof evaluateFertiliserRecommendation>[0];

    const overrideAttempt = evaluateFertiliserRecommendation(forgedRequest);
    expect(overrideAttempt.ok).toBe(false);
    if (!overrideAttempt.ok) {
      expect(overrideAttempt.status).toBe('invalid_input');
      expect(overrideAttempt.reasonCode).toBe('caller_protocol_override_forbidden');
    }
  });

  it('enforces mandatory active status, strict ISO approvalDate, and mandatory non-expired expiresAt', () => {
    const baseReq = {
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      farmId: 'farm-123',
      plotId: 'plot-456',
      soil: LAB_SOIL_VALID,
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
    };

    // Valid active approved fixture succeeds and is branded trusted
    const valid = evaluateWithTestApprovedProtocol(baseReq, makeTestApprovedProtocolFixture('maize'));
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(isTrustedFertiliserCalculation(valid.recommendation)).toBe(true);
      expect(valid.recommendation.binding?.soilAssociation.farmId).toBe('farm-123');
      expect(valid.recommendation.binding?.soilAssociation.plotId).toBe('plot-456');
      expect(valid.recommendation.binding?.soilAssociation.soilReportId).toBe('lab-report-001');
    }

    // 1. Missing status MUST fail closed (Revision 3 Critical Finding 1)
    const missingStatusFixture = makeTestApprovedProtocolFixture('maize');
    delete (missingStatusFixture.approvalRecord as unknown as Record<string, unknown>).status;
    const missingStatus = evaluateWithTestApprovedProtocol(baseReq, missingStatusFixture);
    expect(missingStatus.ok).toBe(false);
    if (!missingStatus.ok) expect(missingStatus.reasonCode).toBe('approval_status_missing');

    // 2. Missing expiresAt MUST fail closed (never infer indefinite validity)
    const missingExpiryFixture = makeTestApprovedProtocolFixture('maize');
    delete (missingExpiryFixture.approvalRecord as unknown as Record<string, unknown>).expiresAt;
    const missingExpiry = evaluateWithTestApprovedProtocol(baseReq, missingExpiryFixture);
    expect(missingExpiry.ok).toBe(false);
    if (!missingExpiry.ok) expect(missingExpiry.reasonCode).toBe('approval_expiry_missing');

    // 3. Unknown, withdrawn, revoked, suspended, superseded statuses MUST fail closed
    for (const badStatus of ['unknown_status', 'withdrawn', 'revoked', 'suspended', 'superseded']) {
      const res = evaluateWithTestApprovedProtocol(
        baseReq,
        makeTestApprovedProtocolFixture('maize', { status: badStatus as never }),
      );
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.reasonCode).toBe('approval_record_not_active');
    }

    // 4. Expired approval MUST fail closed
    const expired = evaluateWithTestApprovedProtocol(
      baseReq,
      makeTestApprovedProtocolFixture('maize', { expiresAt: '2026-10-01' }),
    );
    expect(expired.ok).toBe(false);
    if (!expired.ok) expect(expired.reasonCode).toBe('approval_record_expired');

    // 5. Future-dated approval MUST fail closed
    const futureApproval = evaluateWithTestApprovedProtocol(
      baseReq,
      makeTestApprovedProtocolFixture('maize', { approvalDate: '2027-01-01', expiresAt: '2028-01-01' }),
    );
    expect(futureApproval.ok).toBe(false);
    if (!futureApproval.ok) expect(futureApproval.reasonCode).toBe('approval_date_future');

    // 6. Non-strict ISO date MUST fail closed
    const nonIsoDate = evaluateWithTestApprovedProtocol(
      baseReq,
      makeTestApprovedProtocolFixture('maize', { approvalDate: 'Sep 15 2026' }),
    );
    expect(nonIsoDate.ok).toBe(false);
    if (!nonIsoDate.ok) expect(nonIsoDate.reasonCode).toBe('approval_record_incomplete');

    // 7. Administrative approval MUST fail closed
    const adminApproved = evaluateWithTestApprovedProtocol(baseReq, {
      ...makeTestApprovedProtocolFixture('maize'),
      approvalStatus: 'administrative_approved' as never,
    });
    expect(adminApproved.ok).toBe(false);
    if (!adminApproved.ok) expect(adminApproved.reasonCode).toBe('protocol_provisional_not_approved');
  });

  it('preserves unsupported-crop rejection across all entry points', async () => {
    for (const crop of ['lettuce', 'bell-pepper', 'spinach']) {
      const evalRes = evaluateFertiliserRecommendation({
        cropId: crop,
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: 'farm-123',
        soil: LAB_SOIL_VALID,
        zone: 'derived_savanna',
        growthStage: 'vegetative',
      });
      expect(evalRes.ok).toBe(false);
      if (!evalRes.ok) {
        expect(evalRes.status).toBe('unsupported_crop');
        expect(evalRes.reasonCode).toBe('crop_not_supported');
      }

      const client = new CultivaNodeEnginesClient({ mode: 'in_memory' });
      await expect(
        client.calculateFertiliserRecommendation(crop, 5, 1, LAB_SOIL_VALID),
      ).rejects.toThrow('crop_not_supported');
    }
  });
});

describe('Batch 04.0-H Revision 3 — Finding 3: Mandatory Farm & Plot Soil Association', () => {
  it('rejects missing farmId, missing soil.farmId, missing soil.plotId, cross-farm, and cross-plot soil reuse', () => {
    const approvedMaize = makeTestApprovedProtocolFixture('maize');

    // Missing request farmId -> rejected
    const noReqFarm = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        soil: { ...LAB_SOIL_VALID, plotId: undefined },
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
      },
      approvedMaize,
    );
    expect(noReqFarm.ok).toBe(false);
    if (!noReqFarm.ok) expect(noReqFarm.reasonCode).toBe('farm_id_missing');

    // Missing soil.farmId -> rejected (NOT skipped!)
    const noSoilFarm = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: 'farm-123',
        soil: { ...LAB_SOIL_VALID, farmId: undefined, plotId: undefined },
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
      },
      approvedMaize,
    );
    expect(noSoilFarm.ok).toBe(false);
    if (!noSoilFarm.ok) expect(noSoilFarm.reasonCode).toBe('soil_farm_association_missing');

    // Plot-specific calculation with soil missing plotId -> rejected (NOT skipped!)
    const noSoilPlot = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: 'farm-123',
        plotId: 'plot-456',
        soil: { ...LAB_SOIL_VALID, plotId: undefined },
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
      },
      approvedMaize,
    );
    expect(noSoilPlot.ok).toBe(false);
    if (!noSoilPlot.ok) expect(noSoilPlot.reasonCode).toBe('soil_plot_association_missing');

    // Cross-farm soil reuse -> rejected
    const crossFarm = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: 'farm-alpha',
        soil: { ...LAB_SOIL_VALID, farmId: 'farm-beta', plotId: undefined },
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
      },
      approvedMaize,
    );
    expect(crossFarm.ok).toBe(false);
    if (!crossFarm.ok) expect(crossFarm.reasonCode).toBe('soil_farm_mismatch');

    // Cross-plot soil reuse -> rejected
    const crossPlot = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 1,
        farmId: 'farm-123',
        plotId: 'plot-A',
        soil: { ...LAB_SOIL_VALID, farmId: 'farm-123', plotId: 'plot-B' },
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
      },
      approvedMaize,
    );
    expect(crossPlot.ok).toBe(false);
    if (!crossPlot.ok) expect(crossPlot.reasonCode).toBe('soil_plot_mismatch');
  });
});

describe('Batch 04.0-H Revision 4 — Finding 2: Server-Verified Laboratory Provenance', () => {
  it('rejects caller-declared lab_confirmed, unbranded lab reports, missing lab/report IDs, cross-farm/plot lab reports, and expired lab reports', () => {
    const approvedMaize = makeTestApprovedProtocolFixture('maize');
    const baseReq = {
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      farmId: 'farm-123',
      plotId: 'plot-456',
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
    };

    // 1. Caller-declared `lab_confirmed` WITHOUT verifiedLabReport -> MUST fail closed
    const selfDeclared = evaluateWithTestApprovedProtocol(
      { ...baseReq, soil: { ...LAB_SOIL_VALID, verifiedLabReport: undefined } },
      approvedMaize,
    );
    expect(selfDeclared.ok).toBe(false);
    if (!selfDeclared.ok) expect(selfDeclared.reasonCode).toBe('soil_lab_provenance_unverified');

    // 2. Caller-crafted plain JSON object claiming verificationStatus: 'verified' -> MUST fail closed
    const forgedLabReport = {
      laboratoryName: 'Fake Lab',
      laboratoryId: 'lab-fake',
      reportId: 'rep-fake',
      farmId: 'farm-123',
      plotId: 'plot-456',
      sampleCollectionDate: '2026-09-25',
      analysisDate: '2026-10-01',
      expiresAt: '2027-10-01',
      extractionMethod: 'bray_1',
      samplingDepthCm: 15,
      verificationStatus: 'verified' as const,
      provenanceRecordId: 'prov-fake',
    };
    expect(isTrustedLaboratoryReport(forgedLabReport)).toBe(false);
    const forgedAttempt = evaluateWithTestApprovedProtocol(
      { ...baseReq, soil: { ...LAB_SOIL_VALID, verifiedLabReport: forgedLabReport } },
      approvedMaize,
    );
    expect(forgedAttempt.ok).toBe(false);
    if (!forgedAttempt.ok) expect(forgedAttempt.reasonCode).toBe('soil_lab_provenance_unverified');

    // 3. Missing laboratory identity -> fails closed
    const missingLabId = evaluateWithTestApprovedProtocol(
      {
        ...baseReq,
        soil: { ...LAB_SOIL_VALID, verifiedLabReport: makeTestVerifiedLabReport({ laboratoryId: '' }) },
      },
      approvedMaize,
    );
    expect(missingLabId.ok).toBe(false);
    if (!missingLabId.ok) expect(missingLabId.reasonCode).toBe('soil_lab_provenance_incomplete');

    // 4. Missing report ID -> fails closed
    const missingReportId = evaluateWithTestApprovedProtocol(
      {
        ...baseReq,
        soil: { ...LAB_SOIL_VALID, verifiedLabReport: makeTestVerifiedLabReport({ reportId: '' }) },
      },
      approvedMaize,
    );
    expect(missingReportId.ok).toBe(false);
    if (!missingReportId.ok) expect(missingReportId.reasonCode).toBe('soil_lab_provenance_incomplete');

    // 5. Verified lab report belonging to another farm -> fails closed
    const wrongFarmLab = evaluateWithTestApprovedProtocol(
      {
        ...baseReq,
        soil: { ...LAB_SOIL_VALID, verifiedLabReport: makeTestVerifiedLabReport({ farmId: 'farm-other' }) },
      },
      approvedMaize,
    );
    expect(wrongFarmLab.ok).toBe(false);
    if (!wrongFarmLab.ok) expect(wrongFarmLab.reasonCode).toBe('soil_lab_farm_mismatch');

    // 6. Verified lab report belonging to another plot -> fails closed
    const wrongPlotLab = evaluateWithTestApprovedProtocol(
      {
        ...baseReq,
        soil: { ...LAB_SOIL_VALID, verifiedLabReport: makeTestVerifiedLabReport({ plotId: 'plot-other' }) },
      },
      approvedMaize,
    );
    expect(wrongPlotLab.ok).toBe(false);
    if (!wrongPlotLab.ok) expect(wrongPlotLab.reasonCode).toBe('soil_lab_plot_mismatch');

    // 7. Modelled soil and farmer observations remain distinguishable
    const modelled = evaluateWithTestApprovedProtocol(
      { ...baseReq, soil: { ...LAB_SOIL_VALID, provenance: 'modelled_estimate' } },
      approvedMaize,
    );
    expect(modelled.ok).toBe(false);
    if (!modelled.ok) expect(modelled.reasonCode).toBe('soil_modelled_not_allowed');

    const farmerObs = evaluateWithTestApprovedProtocol(
      { ...baseReq, soil: { ...LAB_SOIL_VALID, provenance: 'farmer_reported' } },
      approvedMaize,
    );
    expect(farmerObs.ok).toBe(false);
    if (!farmerObs.ok) expect(farmerObs.reasonCode).toBe('soil_not_lab_confirmed');
  });
});

describe('Batch 04.0-H Revision 4 — Finding 3 & 4: Immutable Protocol Registry & Calculation Integrity', () => {
  it('deep-freezes the protocol registry and snapshots so runtime mutation throws and cannot alter engine behavior', () => {
    expect(Object.isFrozen(SUPPORTED_FERTILISER_CROP_IDS)).toBe(true);
    expect(Object.isFrozen(SUPPORTED_FERTILISER_PROTOCOLS)).toBe(true);
    expect(Object.isFrozen(SUPPORTED_FERTILISER_PROTOCOLS.maize)).toBe(true);
    expect(Object.isFrozen(SUPPORTED_FERTILISER_PROTOCOLS.maize.supportedZones)).toBe(true);
    expect(Object.isFrozen(SUPPORTED_FERTILISER_PROTOCOLS.maize.nutrientBasis)).toBe(true);

    // Attempted mutations at outer, nested object, and nested array levels MUST throw TypeError
    expect(() => {
      (SUPPORTED_FERTILISER_PROTOCOLS as Record<string, unknown>).maize = {};
    }).toThrow(TypeError);
    expect(() => {
      (SUPPORTED_FERTILISER_PROTOCOLS.maize as unknown as Record<string, unknown>).approvalStatus =
        'agronomist_approved';
    }).toThrow(TypeError);
    expect(() => {
      (SUPPORTED_FERTILISER_PROTOCOLS.maize.supportedZones as string[]).push('mars');
    }).toThrow(TypeError);

    // Safe accessor returns a distinct deep-frozen snapshot
    const snap = getFertiliserProtocolSnapshot('maize');
    expect(snap).not.toBeNull();
    expect(snap).not.toBe(SUPPORTED_FERTILISER_PROTOCOLS.maize);
    expect(Object.isFrozen(snap)).toBe(true);
    expect(snap?.approvalStatus).toBe('provisional_software_validated');

    // Subsequent engine call still fails closed on provisional protocol
    const check = evaluateFertiliserRecommendation({
      cropId: 'maize',
      targetYieldTonnesPerHa: 5,
      farmAreaHectares: 1,
      farmId: 'farm-123',
      plotId: 'plot-456',
      soil: LAB_SOIL_VALID,
      zone: 'derived_savanna',
      growthStage: 'basal',
      referenceDate: '2026-11-22',
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reasonCode).toBe('protocol_provisional_not_approved');
  });

  it('deep-freezes trusted calculations and rejects mutated, shallow-cloned, structuredClone, or reconstructed objects', () => {
    const res = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 5,
        farmAreaHectares: 2,
        farmId: 'farm-123',
        plotId: 'plot-456',
        soil: LAB_SOIL_VALID,
        zone: 'derived_savanna',
        growthStage: 'basal',
        referenceDate: '2026-11-22',
      },
      makeTestApprovedProtocolFixture('maize'),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const calc = res.recommendation;
    expect(isTrustedFertiliserCalculation(calc)).toBe(true);
    expect(Object.isFrozen(calc)).toBe(true);
    expect(Object.isFrozen(calc.binding)).toBe(true);
    expect(Object.isFrozen(calc.productApplications)).toBe(true);
    expect(Object.isFrozen(calc.productApplications[0])).toBe(true);

    // Top-level, nested object, and nested array mutations MUST throw TypeError
    expect(() => {
      (calc as unknown as Record<string, unknown>).cropId = 'tomato';
    }).toThrow(TypeError);
    expect(() => {
      (calc.binding as unknown as Record<string, unknown>).farmId = 'farm-hacked';
    }).toThrow(TypeError);
    expect(() => {
      (calc.productApplications[0] as unknown as Record<string, unknown>).kgPerHa = 999;
    }).toThrow(TypeError);
    expect(() => {
      calc.productApplications.push({
        productName: 'DAP',
        kgPerHa: 100,
        totalKg: 200,
        fiftyKgBags: 4,
        timing: 'basal_planting',
      });
    }).toThrow(TypeError);

    // Cloned, reconstructed, and JSON-copied objects MUST NOT be trusted
    expect(isTrustedFertiliserCalculation({ ...calc })).toBe(false);
    expect(isTrustedFertiliserCalculation(structuredClone(calc))).toBe(false);
    expect(isTrustedFertiliserCalculation(JSON.parse(JSON.stringify(calc)))).toBe(false);
  });
});
