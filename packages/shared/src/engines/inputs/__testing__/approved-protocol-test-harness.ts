import {
  SUPPORTED_FERTILISER_PROTOCOLS,
  __evaluateFertiliserWithTestProtocolFixture,
  __mintTestVerifiedLabReport,
  type SupportedFertiliserCropId,
} from '../fertiliser';
import type {
  AgronomicApprovalRecord,
  FertiliserCalculationRequest,
  FertiliserProtocolMetadata,
  FertiliserRecommendationResult,
  VerifiedLaboratoryReportRecord,
} from '../types';

/**
 * TEST-ONLY approved protocol & verified lab report fixture harness.
 *
 * Not exported from `@cultivanode/shared` or `packages/shared/src/engines/inputs/index.ts`.
 * Refuses to execute outside test runtime (`VITEST=true` or `NODE_ENV=test`).
 * Does NOT represent any real agronomic approval or accredited laboratory verification.
 */
export function makeTestApprovedProtocolFixture(
  cropId: SupportedFertiliserCropId,
  recordOverrides?: Partial<AgronomicApprovalRecord>,
): Partial<FertiliserProtocolMetadata> {
  const base = SUPPORTED_FERTILISER_PROTOCOLS[cropId];
  return {
    approvalStatus: 'agronomist_approved',
    approvalRecord: {
      reviewerName: 'Dr. Test Agronomist (Unit Test Fixture Only)',
      reviewerCredentials: 'Registered Agronomist / PhD Soil Fertility (Unit Test Fixture)',
      competenceScope: `${cropId} nutrient calibration — Nigeria savanna & rainforest`,
      approvalDate: '2026-09-15',
      status: 'active',
      expiresAt: '2027-09-15',
      sourceEvidence: 'Internal unit test fixture — NOT a production agronomic approval',
      protocolVersion: base.protocolVersion,
      applicableCropId: cropId,
      applicableZones: ['derived_savanna', 'rainforest'],
      ...recordOverrides,
    },
  };
}

export function makeTestVerifiedLabReport(
  overrides?: Partial<VerifiedLaboratoryReportRecord>,
): VerifiedLaboratoryReportRecord {
  return __mintTestVerifiedLabReport({
    laboratoryName: 'IITA Soil Analytical Lab (Unit Test Fixture Only)',
    laboratoryId: 'lab-iita-test-001',
    reportId: 'lab-report-001',
    farmId: 'farm-123',
    plotId: 'plot-456',
    sampleCollectionDate: '2026-09-25',
    analysisDate: '2026-10-01',
    expiresAt: '2027-10-01',
    extractionMethod: 'bray_1',
    samplingDepthCm: 15,
    verificationStatus: 'verified',
    provenanceRecordId: 'prov-rec-test-001',
    ...overrides,
  });
}

export function evaluateWithTestApprovedProtocol(
  request: FertiliserCalculationRequest,
  protocolPatch: Partial<FertiliserProtocolMetadata>,
): FertiliserRecommendationResult {
  return __evaluateFertiliserWithTestProtocolFixture(request, protocolPatch);
}
