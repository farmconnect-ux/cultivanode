import {
  SUPPORTED_FERTILISER_PROTOCOLS,
  __evaluateFertiliserWithTestProtocolFixture,
  type SupportedFertiliserCropId,
} from '../fertiliser';
import type {
  AgronomicApprovalRecord,
  FertiliserCalculationRequest,
  FertiliserProtocolMetadata,
  FertiliserRecommendationResult,
} from '../types';

/**
 * TEST-ONLY approved protocol fixture harness.
 *
 * Not exported from `@cultivanode/shared` or `packages/shared/src/engines/inputs/index.ts`.
 * Refuses to execute outside test runtime (`VITEST=true` or `NODE_ENV=test`).
 * Does NOT represent any real agronomic approval.
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

export function evaluateWithTestApprovedProtocol(
  request: FertiliserCalculationRequest,
  protocolPatch: Partial<FertiliserProtocolMetadata>,
): FertiliserRecommendationResult {
  return __evaluateFertiliserWithTestProtocolFixture(request, protocolPatch);
}
