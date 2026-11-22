import {
  convertSoilPhosphorus,
  convertSoilPotassium,
  type SoilExtractionMethod,
} from './nutrient-units';
import type {
  FertiliserCalculationRequest,
  FertiliserProtocolMetadata,
  FertiliserRecommendation,
  FertiliserRecommendationResult,
  SoilNutrientProfile,
  VerifiedLaboratoryReportRecord,
} from './types';

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object') return value;
  const obj = value as unknown as object;
  if (seen.has(obj)) return value;
  seen.add(obj);
  for (const prop of Reflect.ownKeys(obj)) {
    const child = (obj as Record<PropertyKey, unknown>)[prop];
    if (child !== null && typeof child === 'object') {
      deepFreeze(child, seen);
    }
  }
  return Object.freeze(value);
}

export const SUPPORTED_FERTILISER_CROP_IDS = Object.freeze([
  'maize',
  'tomato',
  'cassava',
  'yam',
  'rice',
] as const);
export type SupportedFertiliserCropId = (typeof SUPPORTED_FERTILISER_CROP_IDS)[number];

/**
 * Module-private unforgeable identity registry & brand symbol for trusted calculation results
 * (Batch 04.0-H Revision 4, Finding 4). Every trusted calculation is deep-frozen before being
 * registered so neither top-level properties, nested objects, nor arrays can be mutated.
 */
const TRUSTED_CALCULATION_BRAND = Symbol('cultivanode.trusted_fertiliser_calculation');
const TRUSTED_CALCULATION_REGISTRY = new WeakSet<FertiliserRecommendation>();

export function isTrustedFertiliserCalculation(value: unknown): value is FertiliserRecommendation {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as FertiliserRecommendation;
  return (
    TRUSTED_CALCULATION_REGISTRY.has(candidate) &&
    (value as Record<symbol, unknown>)[TRUSTED_CALCULATION_BRAND] === true &&
    Object.isFrozen(candidate) &&
    Object.isFrozen(candidate.productApplications) &&
    Boolean(candidate.binding && Object.isFrozen(candidate.binding))
  );
}

/**
 * Module-private unforgeable identity registry & brand symbol for server-verified laboratory
 * reports (Batch 04.0-H Revision 4, Finding 2). No production factory currently mints entries
 * into this registry because accredited laboratory report verification is not yet implemented;
 * caller-declared `provenance: 'lab_confirmed'` therefore always fails closed.
 */
const TRUSTED_LAB_REPORT_BRAND = Symbol('cultivanode.trusted_lab_report');
const TRUSTED_LAB_REPORTS = new WeakSet<VerifiedLaboratoryReportRecord>();

export function isTrustedLaboratoryReport(value: unknown): value is VerifiedLaboratoryReportRecord {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as VerifiedLaboratoryReportRecord;
  return (
    TRUSTED_LAB_REPORTS.has(candidate) &&
    (value as Record<symbol, unknown>)[TRUSTED_LAB_REPORT_BRAND] === true &&
    Object.isFrozen(candidate)
  );
}

const STRICT_ISO_DATE_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/;

function parseStrictIsoDate(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const match = trimmed.match(STRICT_ISO_DATE_RE);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ts = Date.parse(trimmed);
  if (Number.isNaN(ts)) return null;
  // Verify calendar round-trip (rejects e.g. 2026-02-31)
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return ts;
}

interface CropProtocolEntry extends FertiliserProtocolMetadata {
  uptakePerTonne: { nPerTonne: number; pPerTonne: number; kPerTonne: number };
  supportedExtractionMethods: readonly SoilExtractionMethod[];
}

const DEFAULT_NG_ZONES = [
  'rainforest',
  'derived_savanna',
  'southern_guinea_savanna',
  'northern_guinea_savanna',
  'sudan_savanna',
  'sahel_savanna',
  'mangrove_swamp',
  'mid_altitude',
] as const;

const DEFAULT_EXTRACTION_METHODS: readonly SoilExtractionMethod[] = [
  'bray_1',
  'olsen',
  'mehlich_3',
  'ammonium_acetate_1M',
];

/**
 * Private authoritative crop-specific fertiliser protocol registry (Batch 04.0-H Revision 4).
 *
 * - Kept private to this module and recursively deep-frozen at load time so no consumer
 *   can obtain a mutable reference or alter approval metadata, zones, or uptake coefficients.
 * - All five built-in protocols remain `provisional_software_validated` with `approvalRecord: null`
 *   and therefore fail closed for public numerical prescriptions.
 */
const AUTHORITATIVE_FERTILISER_PROTOCOLS: Readonly<Record<SupportedFertiliserCropId, CropProtocolEntry>> =
  deepFreeze({
    maize: {
      cropId: 'maize',
      protocolVersion: 'prov-ng-maize-v1.0',
      approvalStatus: 'provisional_software_validated',
      approvalRecord: null,
      sourceCitation: 'CultivaNode Provisional NG Maize Uptake Table (pending D-A5 agronomic sign-off)',
      maxNitrogenKgPerHa: 180,
      supportedZones: [...DEFAULT_NG_ZONES],
      supportedExtractionMethods: [...DEFAULT_EXTRACTION_METHODS],
      nutrientBasis: { nitrogen: 'elemental_N', phosphorus: 'P2O5', potassium: 'K2O' },
      uptakePerTonne: { nPerTonne: 20, pPerTonne: 8, kPerTonne: 16 },
    },
    tomato: {
      cropId: 'tomato',
      protocolVersion: 'prov-ng-tomato-v1.0',
      approvalStatus: 'provisional_software_validated',
      approvalRecord: null,
      sourceCitation: 'CultivaNode Provisional NG Tomato Uptake Table (pending D-A5 agronomic sign-off)',
      maxNitrogenKgPerHa: 150,
      supportedZones: [...DEFAULT_NG_ZONES],
      supportedExtractionMethods: [...DEFAULT_EXTRACTION_METHODS],
      nutrientBasis: { nitrogen: 'elemental_N', phosphorus: 'P2O5', potassium: 'K2O' },
      uptakePerTonne: { nPerTonne: 3.0, pPerTonne: 1.0, kPerTonne: 4.5 },
    },
    cassava: {
      cropId: 'cassava',
      protocolVersion: 'prov-ng-cassava-v1.0',
      approvalStatus: 'provisional_software_validated',
      approvalRecord: null,
      sourceCitation: 'CultivaNode Provisional NG Cassava Uptake Table (pending D-A5 agronomic sign-off)',
      maxNitrogenKgPerHa: 120,
      supportedZones: [...DEFAULT_NG_ZONES],
      supportedExtractionMethods: [...DEFAULT_EXTRACTION_METHODS],
      nutrientBasis: { nitrogen: 'elemental_N', phosphorus: 'P2O5', potassium: 'K2O' },
      uptakePerTonne: { nPerTonne: 5.0, pPerTonne: 1.5, kPerTonne: 6.0 },
    },
    yam: {
      cropId: 'yam',
      protocolVersion: 'prov-ng-yam-v1.0',
      approvalStatus: 'provisional_software_validated',
      approvalRecord: null,
      sourceCitation: 'CultivaNode Provisional NG Yam Uptake Table (pending D-A5 agronomic sign-off)',
      maxNitrogenKgPerHa: 120,
      supportedZones: [...DEFAULT_NG_ZONES],
      supportedExtractionMethods: [...DEFAULT_EXTRACTION_METHODS],
      nutrientBasis: { nitrogen: 'elemental_N', phosphorus: 'P2O5', potassium: 'K2O' },
      uptakePerTonne: { nPerTonne: 4.5, pPerTonne: 1.2, kPerTonne: 5.5 },
    },
    rice: {
      cropId: 'rice',
      protocolVersion: 'prov-ng-rice-v1.0',
      approvalStatus: 'provisional_software_validated',
      approvalRecord: null,
      sourceCitation: 'CultivaNode Provisional NG Rice Uptake Table (pending D-A5 agronomic sign-off)',
      maxNitrogenKgPerHa: 150,
      supportedZones: [...DEFAULT_NG_ZONES],
      supportedExtractionMethods: [...DEFAULT_EXTRACTION_METHODS],
      nutrientBasis: { nitrogen: 'elemental_N', phosphorus: 'P2O5', potassium: 'K2O' },
      uptakePerTonne: { nPerTonne: 18, pPerTonne: 7, kPerTonne: 22 },
    },
  });

function cloneProtocolMetadataSnapshot(entry: CropProtocolEntry): FertiliserProtocolMetadata {
  return deepFreeze({
    cropId: entry.cropId,
    protocolVersion: entry.protocolVersion,
    approvalStatus: entry.approvalStatus,
    approvalRecord: entry.approvalRecord ? { ...entry.approvalRecord, applicableZones: [...entry.approvalRecord.applicableZones] } : null,
    sourceCitation: entry.sourceCitation,
    maxNitrogenKgPerHa: entry.maxNitrogenKgPerHa,
    supportedZones: [...entry.supportedZones],
    nutrientBasis: { ...entry.nutrientBasis },
  });
}

/**
 * Immutable read-only public snapshot of supported crop protocol metadata.
 * Detached from the private `AUTHORITATIVE_FERTILISER_PROTOCOLS` consumed by the engine.
 */
export const SUPPORTED_FERTILISER_PROTOCOLS: Readonly<Record<SupportedFertiliserCropId, FertiliserProtocolMetadata>> =
  deepFreeze({
    maize: cloneProtocolMetadataSnapshot(AUTHORITATIVE_FERTILISER_PROTOCOLS.maize),
    tomato: cloneProtocolMetadataSnapshot(AUTHORITATIVE_FERTILISER_PROTOCOLS.tomato),
    cassava: cloneProtocolMetadataSnapshot(AUTHORITATIVE_FERTILISER_PROTOCOLS.cassava),
    yam: cloneProtocolMetadataSnapshot(AUTHORITATIVE_FERTILISER_PROTOCOLS.yam),
    rice: cloneProtocolMetadataSnapshot(AUTHORITATIVE_FERTILISER_PROTOCOLS.rice),
  });

/**
 * Safe immutable accessor returning a fresh deep-frozen snapshot of protocol metadata.
 */
export function getFertiliserProtocolSnapshot(
  cropId: string | null | undefined,
): Readonly<FertiliserProtocolMetadata> | null {
  if (!isSupportedFertiliserCrop(cropId)) return null;
  return cloneProtocolMetadataSnapshot(AUTHORITATIVE_FERTILISER_PROTOCOLS[cropId.trim().toLowerCase() as SupportedFertiliserCropId]);
}

export function isSupportedFertiliserCrop(cropId: string | null | undefined): cropId is SupportedFertiliserCropId {
  if (!cropId || typeof cropId !== 'string') return false;
  return (SUPPORTED_FERTILISER_CROP_IDS as readonly string[]).includes(cropId.trim().toLowerCase());
}

const SOIL_TEST_MAX_AGE_DAYS = 365;

/**
 * Fail-closed deterministic fertiliser recommendation evaluator (Batch 04.0-H Revision 3).
 *
 * Trust-boundary invariants:
 * - Resolves protocols ONLY from built-in server-controlled `SUPPORTED_FERTILISER_PROTOCOLS`.
 * - Rejects any caller-supplied `protocolOverride` property at runtime.
 * - Requires `agronomist_approved` status with mandatory `status: 'active'`, strict ISO
 *   `approvalDate`, and mandatory non-expired strict ISO `expiresAt`.
 * - Enforces mandatory farm association (`farmId` + `soil.farmId`), plot association when
 *   plot-scoped (`plotId` + `soil.plotId`), strict laboratory soil provenance, geographic
 *   applicability, and explicit phosphorus & potassium nutrient basis unconditionally.
 */
export function evaluateFertiliserRecommendation(
  request: FertiliserCalculationRequest,
): FertiliserRecommendationResult {
  if (
    request &&
    typeof request === 'object' &&
    'protocolOverride' in (request as unknown as Record<string, unknown>) &&
    (request as unknown as Record<string, unknown>).protocolOverride !== undefined
  ) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: 'caller_protocol_override_forbidden',
      message: 'Caller-supplied protocol overrides or approval records are strictly forbidden.',
      missingRequirements: ['server_controlled_agronomic_protocol'],
      guidance: 'Agronomic protocol approval can only come from a protected server-controlled registry, never from caller input.',
    };
  }

  return evaluateFertiliserCore(request, null);
}

/**
 * Internal test-only harness entrypoint. Refuses to execute outside test runtime and is NOT
 * exported from `@cultivanode/shared` or `packages/shared/src/engines/inputs/index.ts`.
 * @internal
 */
function isTestRuntime(): boolean {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.VITEST === 'true' || env?.NODE_ENV === 'test';
}

export function __evaluateFertiliserWithTestProtocolFixture(
  request: FertiliserCalculationRequest,
  testProtocolPatch: Partial<FertiliserProtocolMetadata>,
): FertiliserRecommendationResult {
  if (!isTestRuntime()) {
    throw new Error('Test protocol fixture harness is strictly forbidden outside test runtime.');
  }
  return evaluateFertiliserCore(request, testProtocolPatch);
}

/**
 * Internal test-only helper for minting a trusted, deep-frozen VerifiedLaboratoryReportRecord.
 * Refuses to execute outside test runtime and is NOT exported from `@cultivanode/shared`.
 * @internal
 */
export function __mintTestVerifiedLabReport(
  record: VerifiedLaboratoryReportRecord,
): VerifiedLaboratoryReportRecord {
  if (!isTestRuntime()) {
    throw new Error('Test laboratory verification helper is strictly forbidden outside test runtime.');
  }
  const cloned: VerifiedLaboratoryReportRecord = { ...record };
  Object.defineProperty(cloned, TRUSTED_LAB_REPORT_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  deepFreeze(cloned);
  TRUSTED_LAB_REPORTS.add(cloned);
  return cloned;
}

function evaluateFertiliserCore(
  request: FertiliserCalculationRequest,
  internalTestProtocolPatch: Partial<FertiliserProtocolMetadata> | null,
): FertiliserRecommendationResult {
  const rawCropId = typeof request.cropId === 'string' ? request.cropId.trim().toLowerCase() : '';
  if (!rawCropId) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: 'crop_not_identified',
      message: 'Crop identity is required before a fertiliser calculation can be performed.',
      missingRequirements: ['cropId'],
      guidance: 'Specify the exact crop grown on this plot. CultivaNode will not assume a default crop.',
    };
  }

  if (!isSupportedFertiliserCrop(rawCropId)) {
    return {
      ok: false,
      status: 'unsupported_crop',
      reasonCode: 'crop_not_supported',
      message: `No approved CultivaNode fertiliser protocol is available for "${rawCropId}".`,
      missingRequirements: [`approved_crop_protocol:${rawCropId}`],
      guidance:
        `CultivaNode does not substitute maize or generic NPK/urea rates for ${rawCropId}. ` +
        'Obtain a laboratory soil test and consult a qualified agronomist or extension agent for a crop-specific plan.',
    };
  }

  const baseProtocol = AUTHORITATIVE_FERTILISER_PROTOCOLS[rawCropId];
  const protocol: CropProtocolEntry = internalTestProtocolPatch
    ? { ...baseProtocol, ...internalTestProtocolPatch }
    : baseProtocol;

  const refTs = request.referenceDate ? new Date(request.referenceDate).getTime() : Date.now();
  const effectiveRefTs = Number.isNaN(refTs) ? Date.now() : refTs;

  // Finding 1 (Revision 3): Mandatory approval lifecycle validation.
  if (!protocol.protocolVersion || !protocol.protocolVersion.trim() || !protocol.approvalStatus) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'coefficients_unapproved',
      message: `Crop protocol for "${rawCropId}" is missing a valid version or approval status.`,
      missingRequirements: ['protocolVersion', 'approvalStatus'],
      guidance: 'A versioned, independently agronomist-approved crop protocol is required before generating a numerical fertiliser prescription.',
    };
  }

  if (protocol.approvalStatus !== 'agronomist_approved') {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'protocol_provisional_not_approved',
      message: `Crop protocol "${protocol.protocolVersion}" for "${rawCropId}" is marked "${protocol.approvalStatus}" and has not received independent agronomic approval.`,
      missingRequirements: [`agronomist_approved_protocol:${rawCropId}`, 'agronomic_approval_record'],
      guidance:
        `CultivaNode does not issue farm-specific numerical fertiliser prescriptions from provisional or non-agronomic protocols for ${rawCropId}. ` +
        'Obtain a laboratory soil test and consult a qualified agronomist or extension officer until an independently approved protocol is recorded.',
    };
  }

  const approvalRecord = protocol.approvalRecord;
  if (!approvalRecord || typeof approvalRecord !== 'object') {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_record_incomplete',
      message: `Protocol "${protocol.protocolVersion}" for "${rawCropId}" lacks an independent agronomic approval record.`,
      missingRequirements: ['approvalRecord'],
      guidance: 'An independently recorded agronomic approval is required before generating a numerical fertiliser prescription.',
    };
  }

  // Mandatory explicit active lifecycle status (missing, null, empty, withdrawn, superseded, revoked, suspended, unknown -> fail closed)
  const rawApprovalStatus = (approvalRecord as unknown as Record<string, unknown>).status;
  if (typeof rawApprovalStatus !== 'string' || !rawApprovalStatus.trim()) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_status_missing',
      message: `Agronomic approval record for "${protocol.protocolVersion}" is missing a mandatory lifecycle status.`,
      missingRequirements: ['approvalRecord.status=active'],
      guidance: 'Only an approval record with an explicit active lifecycle status may authorise numerical prescriptions.',
    };
  }
  if (rawApprovalStatus !== 'active') {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_record_not_active',
      message: `Agronomic approval record for "${protocol.protocolVersion}" has status "${rawApprovalStatus}" and is not active.`,
      missingRequirements: ['approvalRecord.status=active'],
      guidance: 'Withdrawn, superseded, revoked, suspended, or unknown approval statuses cannot authorise numerical prescriptions.',
    };
  }

  // Strict ISO approvalDate validation (reject non-ISO, invalid, or future-dated approvals)
  const approvalDateTs = parseStrictIsoDate(approvalRecord.approvalDate);
  if (approvalDateTs === null) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_record_incomplete',
      message: `Agronomic approval record for "${protocol.protocolVersion}" has a missing or non-ISO approvalDate.`,
      missingRequirements: ['approvalRecord.approvalDate(strict ISO)'],
      guidance: 'A valid strict ISO approval date is required on the agronomic approval record.',
    };
  }
  if (approvalDateTs > effectiveRefTs + 86_400_000) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_date_future',
      message: `Agronomic approval record for "${protocol.protocolVersion}" is future-dated (${approvalRecord.approvalDate}).`,
      missingRequirements: ['approvalRecord.approvalDate(non-future)'],
      guidance: 'Future-dated agronomic approvals cannot authorise numerical fertiliser prescriptions.',
    };
  }

  // Mandatory strict ISO expiresAt validation (never infer indefinite validity!)
  const rawExpiresAt = (approvalRecord as unknown as Record<string, unknown>).expiresAt;
  if (typeof rawExpiresAt !== 'string' || !rawExpiresAt.trim()) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_expiry_missing',
      message: `Agronomic approval record for "${protocol.protocolVersion}" is missing a mandatory expiry date.`,
      missingRequirements: ['approvalRecord.expiresAt'],
      guidance: 'Agronomic approvals must declare an explicit expiry date; indefinite validity is not inferred.',
    };
  }
  const expiresAtTs = parseStrictIsoDate(rawExpiresAt);
  if (expiresAtTs === null || expiresAtTs <= approvalDateTs) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_expiry_invalid',
      message: `Agronomic approval record for "${protocol.protocolVersion}" has an invalid expiry date ("${rawExpiresAt}").`,
      missingRequirements: ['approvalRecord.expiresAt(valid strict ISO after approvalDate)'],
      guidance: 'Provide a valid strict ISO expiry date after the approval date.',
    };
  }
  if (expiresAtTs < effectiveRefTs) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_record_expired',
      message: `Agronomic approval record for "${protocol.protocolVersion}" expired on ${rawExpiresAt}.`,
      missingRequirements: ['current_agronomic_approval_record'],
      guidance: 'Renew independent agronomic approval before generating numerical fertiliser prescriptions.',
    };
  }

  const missingApprovalFields: string[] = [];
  if (!approvalRecord.reviewerName?.trim()) missingApprovalFields.push('approvalRecord.reviewerName');
  if (!approvalRecord.reviewerCredentials?.trim()) missingApprovalFields.push('approvalRecord.reviewerCredentials');
  if (!approvalRecord.competenceScope?.trim()) missingApprovalFields.push('approvalRecord.competenceScope');
  if (!approvalRecord.sourceEvidence?.trim()) missingApprovalFields.push('approvalRecord.sourceEvidence');
  if (approvalRecord.protocolVersion !== protocol.protocolVersion) {
    missingApprovalFields.push('approvalRecord.protocolVersion(match)');
  }
  if (approvalRecord.applicableCropId?.trim().toLowerCase() !== rawCropId) {
    missingApprovalFields.push('approvalRecord.applicableCropId(match)');
  }
  if (!Array.isArray(approvalRecord.applicableZones) || approvalRecord.applicableZones.length === 0) {
    missingApprovalFields.push('approvalRecord.applicableZones');
  }

  if (missingApprovalFields.length > 0) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_record_incomplete',
      message: `Protocol "${protocol.protocolVersion}" for "${rawCropId}" lacks a complete independent agronomic approval record.`,
      missingRequirements: missingApprovalFields,
      guidance: 'An independently recorded agronomic approval (reviewer identity, credentials, competence scope, approval date, expiry date, source evidence, version, and crop/geographic scope) is required.',
    };
  }

  if (
    typeof request.targetYieldTonnesPerHa !== 'number' ||
    !Number.isFinite(request.targetYieldTonnesPerHa) ||
    request.targetYieldTonnesPerHa <= 0 ||
    request.targetYieldTonnesPerHa > 100
  ) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: 'invalid_target_yield',
      message: 'targetYieldTonnesPerHa must be a finite number between 0 and 100.',
      missingRequirements: ['targetYieldTonnesPerHa'],
      guidance: 'Provide a realistic positive target yield in tonnes per hectare.',
    };
  }

  if (
    typeof request.farmAreaHectares !== 'number' ||
    !Number.isFinite(request.farmAreaHectares) ||
    request.farmAreaHectares <= 0 ||
    request.farmAreaHectares > 100_000
  ) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: 'invalid_farm_area',
      message: 'farmAreaHectares must be a finite number between 0 and 100,000.',
      missingRequirements: ['farmAreaHectares'],
      guidance: 'Provide a valid positive farm or plot area in hectares.',
    };
  }

  // Finding 4: Geographic applicability is MANDATORY and never invented.
  const normalizedZone = typeof request.zone === 'string' ? request.zone.trim().toLowerCase() : '';
  if (!normalizedZone) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'zone_missing',
      message: 'Agro-ecological zone is required before a numerical fertiliser prescription can be issued.',
      missingRequirements: ['zone'],
      guidance: 'Confirm your farm agro-ecological zone. CultivaNode will not invent a default geographic zone.',
    };
  }

  if (
    !protocol.supportedZones.includes(normalizedZone) ||
    !approvalRecord!.applicableZones.map((z) => z.trim().toLowerCase()).includes(normalizedZone)
  ) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'geographic_mismatch',
      message: `Agro-ecological zone "${request.zone}" is outside the approved applicability scope for "${rawCropId}".`,
      missingRequirements: ['applicable_agro_ecological_zone'],
      guidance: 'Confirm your farm agro-ecological zone or consult a local extension officer for zone-specific rates.',
    };
  }

  const soil = request.soil;
  if (!soil) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_test_missing',
      message: 'A laboratory soil test profile is required to calculate a farm-specific fertiliser recommendation.',
      missingRequirements: ['soil_test'],
      guidance: 'Submit a laboratory soil test (pH, organic matter %, available phosphorus, exchangeable potassium with explicit units and nutrient basis).',
    };
  }

  // Finding 3: Strict soil provenance is UNCONDITIONALLY mandatory server-side (no caller bypass flag).
  // Limitation: Caller-declared `lab_confirmed` provenance is not yet independently verified against an
  // accredited laboratory certificate; this limitation is disclosed in calculation assumptions.
  if (soil.provenance === 'modelled_estimate') {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_modelled_not_allowed',
      message: 'Modelled soil estimates cannot be used as laboratory measurements for a numerical fertiliser prescription.',
      missingRequirements: ['lab_confirmed_soil_test'],
      guidance: 'Conduct a laboratory soil analysis before applying a numerical fertiliser prescription.',
    };
  }

  if (soil.provenance !== 'lab_confirmed') {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_not_lab_confirmed',
      message: soil.provenance
        ? `Soil provenance "${soil.provenance}" is not laboratory-confirmed and cannot authorise a numerical prescription.`
        : 'Laboratory-confirmed soil provenance is mandatory for a numerical fertiliser prescription.',
      missingRequirements: ['soil.provenance=lab_confirmed'],
      guidance: 'Submit laboratory-confirmed soil test results (provenance, extraction method, sampling depth, test date).',
    };
  }

  if (!soil.extractionMethod || !soil.extractionMethod.trim()) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_method_missing',
      message: 'Soil extraction method (e.g. bray_1, olsen, mehlich_3) is required to interpret soil nutrient values.',
      missingRequirements: ['soil.extractionMethod'],
      guidance: 'Include the laboratory extraction method from your soil analysis report.',
    };
  }

  const normalizedExtraction = soil.extractionMethod.trim();
  if (!(protocol.supportedExtractionMethods as readonly string[]).includes(normalizedExtraction)) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_method_unsupported',
      message: `Soil extraction method "${soil.extractionMethod}" is not calibrated to protocol "${protocol.protocolVersion}".`,
      missingRequirements: ['calibrated_soil_extraction_method'],
      guidance: 'Use a soil extraction method calibrated to the crop protocol or consult a qualified agronomist.',
    };
  }

  if (
    typeof soil.samplingDepthCm !== 'number' ||
    !Number.isFinite(soil.samplingDepthCm) ||
    soil.samplingDepthCm <= 0 ||
    soil.samplingDepthCm > 100
  ) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_depth_missing',
      message: 'Valid soil sampling depth in cm (e.g. 15 or 20 cm) is required.',
      missingRequirements: ['soil.samplingDepthCm'],
      guidance: 'Record the topsoil sampling depth (typically 0–15 cm or 0–20 cm) from your soil test.',
    };
  }

  if (!soil.testDate || !soil.testDate.trim()) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_test_date_missing',
      message: 'A valid soil test date is required to verify that soil results are current.',
      missingRequirements: ['soil.testDate'],
      guidance: 'Provide the date when the laboratory soil sample was analysed.',
    };
  }

  const testTs = new Date(soil.testDate).getTime();
  if (Number.isNaN(testTs)) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: 'soil_test_date_invalid',
      message: 'Soil test date is not a valid ISO date.',
      missingRequirements: ['soil.testDate'],
      guidance: 'Provide a valid ISO date (YYYY-MM-DD) for the soil test.',
    };
  }

  const ageDays = (effectiveRefTs - testTs) / 86_400_000;
  if (ageDays > SOIL_TEST_MAX_AGE_DAYS) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_test_expired',
      message: `Soil test is ${Math.round(ageDays)} days old, exceeding the ${SOIL_TEST_MAX_AGE_DAYS}-day validity limit.`,
      missingRequirements: ['current_lab_soil_test'],
      guidance: 'Obtain a fresh laboratory soil test before calculating a new fertiliser prescription.',
    };
  }
  if (ageDays < -1) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: 'soil_test_future_date',
      message: 'Soil test date cannot be in the future.',
      missingRequirements: ['valid_soil_test_date'],
      guidance: 'Verify the analysis date printed on your laboratory report.',
    };
  }

  if (!request.growthStage || !request.growthStage.trim()) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'growth_stage_missing',
      message: 'Current crop growth stage is required to validate fertiliser application timing.',
      missingRequirements: ['growthStage'],
      guidance: 'Specify the crop growth stage (e.g. pre-planting, basal, vegetative) before requesting a fertiliser plan.',
    };
  }
  const normalizedGrowthStage = request.growthStage.trim().toLowerCase();

  // Revision 3: Mandatory farm & plot soil report association (never silently skip missing associations)
  const reqFarmId = typeof request.farmId === 'string' ? request.farmId.trim() : '';
  if (!reqFarmId) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'farm_id_missing',
      message: 'A verified farm identifier (farmId) is mandatory for a farm-specific fertiliser recommendation.',
      missingRequirements: ['farmId'],
      guidance: 'Associate this calculation with a verified farm before requesting a farm-specific prescription.',
    };
  }

  const soilFarmId = typeof soil.farmId === 'string' ? soil.farmId.trim() : '';
  if (!soilFarmId) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_farm_association_missing',
      message: 'The soil test report must carry a farm association (soil.farmId) matching the target farm.',
      missingRequirements: ['soil.farmId'],
      guidance: 'Link the laboratory soil report to the target farm before generating a farm-specific prescription.',
    };
  }

  if (soilFarmId !== reqFarmId) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_farm_mismatch',
      message: 'Soil test report farm association does not match the requested farm; soil reports cannot be reused across farms.',
      missingRequirements: ['matching_farm_soil_test'],
      guidance: 'Submit a laboratory soil test sampled from this specific farm.',
    };
  }

  const reqPlotId = typeof request.plotId === 'string' ? request.plotId.trim() : '';
  const soilPlotId = typeof soil.plotId === 'string' ? soil.plotId.trim() : '';
  if (reqPlotId && !soilPlotId) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_plot_association_missing',
      message: 'Plot-specific recommendations require the soil test report to carry a matching plot association (soil.plotId).',
      missingRequirements: ['soil.plotId'],
      guidance: 'Submit a laboratory soil test associated with the target plot.',
    };
  }
  if (!reqPlotId && soilPlotId) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'plot_id_missing',
      message: 'A plot-scoped soil report requires the matching target plotId on the calculation request.',
      missingRequirements: ['plotId'],
      guidance: 'Specify the target plotId corresponding to this plot soil report.',
    };
  }
  if (reqPlotId && soilPlotId && soilPlotId !== reqPlotId) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_plot_mismatch',
      message: 'Soil test report plot association does not match the requested plot; soil reports cannot be reused across plots.',
      missingRequirements: ['matching_plot_soil_test'],
      guidance: 'Submit a laboratory soil test sampled from this specific plot.',
    };
  }

  // Revision 4 Finding 2: Caller-declared `provenance: 'lab_confirmed'` is NOT verified provenance.
  // Require a server-trusted, deep-frozen `VerifiedLaboratoryReportRecord` registered in
  // `TRUSTED_LAB_REPORTS` with full laboratory identity, report ID, farm/plot association,
  // strict ISO dates, expiry, method, and depth verification.
  const labReport = soil.verifiedLabReport;
  if (!labReport || !isTrustedLaboratoryReport(labReport)) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_lab_provenance_unverified',
      message:
        'Caller-declared laboratory soil provenance cannot authorise a numerical fertiliser prescription. An independently verified server-side laboratory report record is required.',
      missingRequirements: ['verified_laboratory_report_record'],
      guidance:
        'Submit soil analysis through a verified laboratory integration or consult a qualified agronomist; CultivaNode does not treat self-declared laboratory claims as verified evidence.',
    };
  }

  const missingLabFields: string[] = [];
  if (!labReport.laboratoryName?.trim()) missingLabFields.push('verifiedLabReport.laboratoryName');
  if (!labReport.laboratoryId?.trim()) missingLabFields.push('verifiedLabReport.laboratoryId');
  if (!labReport.reportId?.trim()) missingLabFields.push('verifiedLabReport.reportId');
  if (!labReport.provenanceRecordId?.trim()) missingLabFields.push('verifiedLabReport.provenanceRecordId');
  if (labReport.verificationStatus !== 'verified') missingLabFields.push('verifiedLabReport.verificationStatus=verified');
  if (missingLabFields.length > 0) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_lab_provenance_incomplete',
      message: 'Verified laboratory report record is missing mandatory laboratory identity or verification fields.',
      missingRequirements: missingLabFields,
      guidance: 'Provide a complete verified laboratory report (laboratory identity, report ID, provenance record, and verification status).',
    };
  }

  if (labReport.farmId?.trim() !== reqFarmId) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_lab_farm_mismatch',
      message: 'Verified laboratory report belongs to a different farm and cannot be used for this calculation.',
      missingRequirements: ['matching_verified_farm_lab_report'],
      guidance: 'Use a verified laboratory report associated with the target farm.',
    };
  }
  if (reqPlotId && labReport.plotId?.trim() !== reqPlotId) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_lab_plot_mismatch',
      message: 'Verified laboratory report does not match the requested plot.',
      missingRequirements: ['matching_verified_plot_lab_report'],
      guidance: 'Use a verified laboratory report associated with the target plot.',
    };
  }
  const labSampleTs = parseStrictIsoDate(labReport.sampleCollectionDate);
  const labAnalysisTs = parseStrictIsoDate(labReport.analysisDate);
  const labExpiresTs = parseStrictIsoDate(labReport.expiresAt);
  if (labSampleTs === null || labAnalysisTs === null || labExpiresTs === null || labExpiresTs <= labAnalysisTs) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_lab_dates_invalid',
      message: 'Verified laboratory report contains missing or invalid strict ISO sample, analysis, or expiry dates.',
      missingRequirements: ['verifiedLabReport.dates(strict ISO)'],
      guidance: 'Verify sample collection, analysis, and validity dates on the laboratory report.',
    };
  }
  if (labExpiresTs < effectiveRefTs) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_lab_report_expired',
      message: `Verified laboratory report "${labReport.reportId}" expired on ${labReport.expiresAt}.`,
      missingRequirements: ['current_verified_lab_report'],
      guidance: 'Obtain a fresh verified laboratory soil analysis before generating a numerical prescription.',
    };
  }
  if (labReport.extractionMethod?.trim() !== normalizedExtraction || labReport.samplingDepthCm !== soil.samplingDepthCm) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_lab_metadata_mismatch',
      message: 'Soil extraction method or sampling depth does not match the verified laboratory report record.',
      missingRequirements: ['consistent_verified_lab_metadata'],
      guidance: 'Ensure analytical method and sampling depth match the verified laboratory report.',
    };
  }

  // Validate required scalar soil readings (never silently default missing organicMatterPercent!)
  if (typeof soil.pH !== 'number' || !Number.isFinite(soil.pH) || soil.pH < 0 || soil.pH > 14) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: 'invalid_soil_ph',
      message: 'Soil pH must be a finite number between 0 and 14.',
      missingRequirements: ['soil.pH'],
      guidance: 'Provide a valid laboratory soil pH value.',
    };
  }
  if (
    soil.organicMatterPercent === undefined ||
    typeof soil.organicMatterPercent !== 'number' ||
    !Number.isFinite(soil.organicMatterPercent) ||
    soil.organicMatterPercent < 0 ||
    soil.organicMatterPercent > 100
  ) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_organic_matter_missing',
      message: 'Soil organic matter (%) is required; CultivaNode does not substitute an assumed average.',
      missingRequirements: ['soil.organicMatterPercent'],
      guidance: 'Provide the measured soil organic matter percentage from your laboratory report.',
    };
  }

  // Finding 5: Require explicit typed phosphorus (elemental_P vs P2O5) — NEVER silently assume basis on legacy phosphorusPpm.
  if (!soil.phosphorus) {
    if (typeof soil.phosphorusPpm === 'number') {
      return {
        ok: false,
        status: 'invalid_input',
        reasonCode: 'soil_basis_unknown',
        message:
          'Legacy untyped phosphorusPpm cannot be used because its nutrient basis (elemental_P vs P2O5) is ambiguous. Submit typed soil.phosphorus with explicit unit and basis.',
        missingRequirements: ['soil.phosphorus.unit', 'soil.phosphorus.basis'],
        guidance: 'Confirm on your laboratory report whether available phosphorus is reported as elemental P or P2O5 and supply typed soil.phosphorus.',
      };
    }
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_phosphorus_missing',
      message: 'Soil phosphorus reading with explicit unit and nutrient basis is required.',
      missingRequirements: ['soil.phosphorus'],
      guidance: 'Provide laboratory available phosphorus with explicit unit (mg_kg or ppm) and basis (elemental_P or P2O5).',
    };
  }

  const pConv = convertSoilPhosphorus({
    ...soil.phosphorus,
    extractionMethod: soil.phosphorus.extractionMethod ?? soil.extractionMethod,
    provenance: soil.phosphorus.provenance ?? soil.provenance,
  });
  if (!pConv.ok) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: pConv.code,
      message: pConv.message,
      missingRequirements: ['valid_typed_soil_phosphorus'],
      guidance: 'Verify the phosphorus unit and nutrient basis (elemental P vs P2O5) on your laboratory report.',
    };
  }

  // Finding 5: NEVER silently assume legacy `potassiumPpm` represents elemental_K.
  // Require explicit typed `soil.potassium` with unit and basis metadata.
  if (!soil.potassium) {
    if (typeof soil.potassiumPpm === 'number') {
      return {
        ok: false,
        status: 'invalid_input',
        reasonCode: 'soil_basis_unknown',
        message:
          'Legacy untyped potassiumPpm cannot be used because its nutrient basis (elemental_K vs K2O) is ambiguous. Submit typed soil.potassium with explicit unit and basis.',
        missingRequirements: ['soil.potassium.unit', 'soil.potassium.basis'],
        guidance: 'Confirm on your laboratory report whether potassium is reported as elemental K or K2O and supply typed soil.potassium.',
      };
    }
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'soil_potassium_missing',
      message: 'Soil potassium reading with explicit unit and nutrient basis is required.',
      missingRequirements: ['soil.potassium'],
      guidance: 'Provide laboratory exchangeable potassium with explicit unit (cmol_kg, meq_100g, mg_kg, or ppm) and basis (elemental_K or K2O).',
    };
  }

  const kConv = convertSoilPotassium({
    ...soil.potassium,
    extractionMethod: soil.potassium.extractionMethod ?? soil.extractionMethod,
    provenance: soil.potassium.provenance ?? soil.provenance,
  });
  if (!kConv.ok) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: kConv.code,
      message: kConv.message,
      missingRequirements: ['valid_typed_soil_potassium'],
      guidance: 'Verify the potassium unit and nutrient basis (elemental K vs K2O) on your laboratory report.',
    };
  }

  // Deterministic calculation using the versioned crop protocol
  const { uptakePerTonne } = protocol;
  const totalNNeeded = uptakePerTonne.nPerTonne * request.targetYieldTonnesPerHa;
  const totalPNeeded = uptakePerTonne.pPerTonne * request.targetYieldTonnesPerHa;
  const totalKNeeded = uptakePerTonne.kPerTonne * request.targetYieldTonnesPerHa;

  const soilNCredit = soil.organicMatterPercent * 15;
  const soilPCredit = pConv.derivedElementalMgKg * 0.6;
  const soilKCredit = kConv.derivedElementalMgKg * 0.48;

  const nDeficitKgPerHa = Math.max(0, Math.round(totalNNeeded - soilNCredit));
  const pDeficitKgPerHa = Math.max(0, Math.round(totalPNeeded - soilPCredit));
  const kDeficitKgPerHa = Math.max(0, Math.round(totalKNeeded - soilKCredit));

  // Do NOT apply artificial minimum NPK/Urea rates when the calculated nutrient deficit is 0.
  const npkNeededKgPerHa = pDeficitKgPerHa > 0 ? Math.round(pDeficitKgPerHa / 0.15) : 0;
  const npkAppliedKgPerHa = Math.min(400, npkNeededKgPerHa);

  const nFromNpk = npkAppliedKgPerHa * 0.15;
  const remainingN = Math.max(0, nDeficitKgPerHa - nFromNpk);
  let ureaAppliedKgPerHa = remainingN > 0 ? Math.round(remainingN / 0.46) : 0;

  // Enforce protocol maxNitrogenKgPerHa safety cap
  const totalAppliedN = nFromNpk + ureaAppliedKgPerHa * 0.46;
  let cappedWarning: string | undefined;
  if (totalAppliedN > protocol.maxNitrogenKgPerHa) {
    const allowedUreaN = Math.max(0, protocol.maxNitrogenKgPerHa - nFromNpk);
    ureaAppliedKgPerHa = Math.floor(allowedUreaN / 0.46);
    cappedWarning = `Total nitrogen capped at protocol safety limit (${protocol.maxNitrogenKgPerHa} kg N/ha).`;
  }

  let limeKgPerHa = 0;
  if (soil.pH < 5.0) {
    limeKgPerHa = 1500;
  } else if (soil.pH < 5.5) {
    limeKgPerHa = 800;
  }

  const npkTotalKg = Math.round(npkAppliedKgPerHa * request.farmAreaHectares);
  const ureaTotalKg = Math.round(ureaAppliedKgPerHa * request.farmAreaHectares);

  const productApplications: FertiliserRecommendation['productApplications'] = [];
  if (npkAppliedKgPerHa > 0) {
    productApplications.push({
      productName: 'NPK 15:15:15',
      kgPerHa: npkAppliedKgPerHa,
      totalKg: npkTotalKg,
      fiftyKgBags: Math.ceil(npkTotalKg / 50),
      timing: 'basal_planting',
    });
  }
  if (ureaAppliedKgPerHa > 0) {
    productApplications.push({
      productName: 'Urea (46% N)',
      kgPerHa: ureaAppliedKgPerHa,
      totalKg: ureaTotalKg,
      fiftyKgBags: Math.ceil(ureaTotalKg / 50),
      timing: 'top_dress_vegetative',
    });
  }

  const phWarning =
    soil.pH < 5.5
      ? `Soil pH (${soil.pH}) is acidic. Apply agricultural limestone 2-4 weeks before planting to unlock fertiliser efficiency.`
      : undefined;

  const warning = [phWarning, cappedWarning].filter(Boolean).join(' ') || undefined;

  const calculatedAt = new Date(effectiveRefTs).toISOString();
  const binding = {
    cropId: rawCropId,
    farmId: reqFarmId,
    ...(reqPlotId ? { plotId: reqPlotId } : {}),
    ...(request.requestId?.trim() ? { requestId: request.requestId.trim() } : {}),
    zone: normalizedZone,
    growthStage: normalizedGrowthStage,
    protocolVersion: protocol.protocolVersion,
    protocolApprovalStatus: 'agronomist_approved' as const,
    calculatedAt,
    soilAssociation: {
      farmId: soilFarmId,
      ...(soilPlotId ? { plotId: soilPlotId } : {}),
      ...(soil.soilReportId?.trim() ? { soilReportId: soil.soilReportId.trim() } : {}),
      provenance: 'lab_confirmed' as const,
      extractionMethod: normalizedExtraction,
      testDate: soil.testDate.trim(),
    },
  };

  const recommendation: FertiliserRecommendation = {
    cropId: rawCropId,
    targetYieldTonnesPerHa: request.targetYieldTonnesPerHa,
    farmAreaHectares: request.farmAreaHectares,
    protocolVersion: protocol.protocolVersion,
    protocolApprovalStatus: protocol.approvalStatus,
    binding,
    phosphorusConversion: pConv,
    potassiumConversion: kConv,
    deficitKgPerHa: {
      nitrogenKg: nDeficitKgPerHa,
      phosphorusKg: pDeficitKgPerHa,
      potassiumKg: kDeficitKgPerHa,
    },
    productApplications,
    limeRecommendationKgPerHa: limeKgPerHa,
    warning,
  };
  Object.defineProperty(recommendation, TRUSTED_CALCULATION_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  // Finding 4: Deep-freeze the complete calculation result and register its identity in the private WeakSet.
  deepFreeze(recommendation);
  TRUSTED_CALCULATION_REGISTRY.add(recommendation);

  return deepFreeze({
    ok: true,
    status: 'approved_calculation',
    protocol: cloneProtocolMetadataSnapshot(protocol),
    recommendation,
    assumptions: [
      `Approved protocol ${protocol.protocolVersion} (approved by ${approvalRecord!.reviewerName}, ${approvalRecord!.reviewerCredentials} on ${approvalRecord!.approvalDate}, expires ${approvalRecord!.expiresAt}).`,
      `Verified laboratory report ${labReport.reportId} (${labReport.laboratoryName}, ID: ${labReport.laboratoryId}, provenance: ${labReport.provenanceRecordId}).`,
      pConv.conversionNote,
      kConv.conversionNote,
      'Fertiliser formulations assume NPK 15:15:15 (15% N, 15% P2O5, 15% K2O) and Urea (46% N).',
    ],
    missingInformation: [],
  });
}

/**
 * Legacy-compatible deterministic entrypoint hardened to fail closed (Batch 04.0-H Revision 3).
 * Enforces the exact same mandatory server-controlled protocol approval, farm/plot soil association,
 * geographic, provenance, and nutrient-basis controls as `evaluateFertiliserRecommendation`.
 * Accepts ZERO protocol override parameters.
 */
export function calculateFertiliserRecommendation(
  cropId: string,
  targetYieldTonnesPerHa: number,
  farmAreaHectares: number,
  soil: SoilNutrientProfile,
  options?: {
    zone?: string | null;
    growthStage?: string | null;
    farmId?: string | null;
    plotId?: string | null;
    requestId?: string | null;
    referenceDate?: string;
  },
): FertiliserRecommendation {
  const result = evaluateFertiliserRecommendation({
    cropId,
    targetYieldTonnesPerHa,
    farmAreaHectares,
    soil,
    zone: options?.zone,
    growthStage: options?.growthStage,
    farmId: options?.farmId,
    plotId: options?.plotId,
    requestId: options?.requestId,
    referenceDate: options?.referenceDate,
  });

  if (!result.ok) {
    throw new Error(`[${result.reasonCode}] ${result.message}`);
  }
  return result.recommendation;
}
