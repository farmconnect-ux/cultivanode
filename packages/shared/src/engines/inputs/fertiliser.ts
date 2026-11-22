import {
  convertSoilPotassium,
  type SoilExtractionMethod,
} from './nutrient-units';
import type {
  FertiliserCalculationRequest,
  FertiliserProtocolMetadata,
  FertiliserRecommendation,
  FertiliserRecommendationResult,
  SoilNutrientProfile,
} from './types';

export const SUPPORTED_FERTILISER_CROP_IDS = ['maize', 'tomato', 'cassava', 'yam', 'rice'] as const;
export type SupportedFertiliserCropId = (typeof SUPPORTED_FERTILISER_CROP_IDS)[number];

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
 * Versioned crop-specific fertiliser protocols (Batch 04.0-H).
 *
 * IMPORTANT: `approvalStatus: 'provisional_software_validated'` explicitly records that these
 * legacy uptake coefficients passed software validation only and still await formal agronomic
 * sign-off under Decision D-A5 (see `02_FERTILISER_SAFETY_FINDING.md`).
 */
export const SUPPORTED_FERTILISER_PROTOCOLS: Readonly<Record<SupportedFertiliserCropId, CropProtocolEntry>> = {
  maize: {
    cropId: 'maize',
    protocolVersion: 'prov-ng-maize-v1.0',
    approvalStatus: 'provisional_software_validated',
    approvalRecord: null,
    sourceCitation: 'CultivaNode Provisional NG Maize Uptake Table (pending D-A5 agronomic sign-off)',
    maxNitrogenKgPerHa: 180,
    supportedZones: DEFAULT_NG_ZONES,
    supportedExtractionMethods: DEFAULT_EXTRACTION_METHODS,
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
    supportedZones: DEFAULT_NG_ZONES,
    supportedExtractionMethods: DEFAULT_EXTRACTION_METHODS,
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
    supportedZones: DEFAULT_NG_ZONES,
    supportedExtractionMethods: DEFAULT_EXTRACTION_METHODS,
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
    supportedZones: DEFAULT_NG_ZONES,
    supportedExtractionMethods: DEFAULT_EXTRACTION_METHODS,
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
    supportedZones: DEFAULT_NG_ZONES,
    supportedExtractionMethods: DEFAULT_EXTRACTION_METHODS,
    nutrientBasis: { nitrogen: 'elemental_N', phosphorus: 'P2O5', potassium: 'K2O' },
    uptakePerTonne: { nPerTonne: 18, pPerTonne: 7, kPerTonne: 22 },
  },
};

export function isSupportedFertiliserCrop(cropId: string | null | undefined): cropId is SupportedFertiliserCropId {
  if (!cropId || typeof cropId !== 'string') return false;
  return (SUPPORTED_FERTILISER_CROP_IDS as readonly string[]).includes(cropId.trim().toLowerCase());
}

const SOIL_TEST_MAX_AGE_DAYS = 365;

/**
 * Fail-closed deterministic fertiliser recommendation evaluator (Batch 04.0-H, ADR-020).
 *
 * Enforces:
 * - No silent default coefficients for unknown/unsupported crops (e.g. lettuce).
 * - No silent defaulting of missing crop identity or missing organic matter.
 * - Explicit typed potassium unit handling (cmol(+)/kg, meq/100g, mg/kg, ppm; elemental K vs K2O).
 * - Soil provenance, extraction method, sampling depth, expiry, zone, and growth-stage checks.
 * - Maximum nitrogen safety ceiling enforcement.
 */
export function evaluateFertiliserRecommendation(
  request: FertiliserCalculationRequest,
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

  const baseProtocol = SUPPORTED_FERTILISER_PROTOCOLS[rawCropId];
  const protocol: CropProtocolEntry = request.protocolOverride
    ? { ...baseProtocol, ...request.protocolOverride }
    : baseProtocol;

  const refTs = request.referenceDate ? new Date(request.referenceDate).getTime() : Date.now();
  const effectiveRefTs = Number.isNaN(refTs) ? Date.now() : refTs;

  // Finding 1: Software validation (`provisional_software_validated`) NEVER authorises a public
  // numerical prescription. Only an independently recorded `agronomist_approved` protocol with a
  // complete approval record may authorise a farm-specific numerical prescription.
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
      message: `Crop protocol "${protocol.protocolVersion}" for "${rawCropId}" is marked "${protocol.approvalStatus}" (software-validated only) and has not received independent agronomic approval.`,
      missingRequirements: [`agronomist_approved_protocol:${rawCropId}`, 'agronomic_approval_record'],
      guidance:
        `CultivaNode does not issue farm-specific numerical fertiliser prescriptions from provisional coefficients for ${rawCropId}. ` +
        'Obtain a laboratory soil test and consult a qualified agronomist or extension officer until an independently approved protocol is recorded.',
    };
  }

  const approvalRecord = protocol.approvalRecord;
  const missingApprovalFields: string[] = [];
  if (!approvalRecord) {
    missingApprovalFields.push('approvalRecord');
  } else {
    if (!approvalRecord.reviewerName?.trim()) missingApprovalFields.push('approvalRecord.reviewerName');
    if (!approvalRecord.reviewerCredentials?.trim()) missingApprovalFields.push('approvalRecord.reviewerCredentials');
    if (!approvalRecord.competenceScope?.trim()) missingApprovalFields.push('approvalRecord.competenceScope');
    if (!approvalRecord.sourceEvidence?.trim()) missingApprovalFields.push('approvalRecord.sourceEvidence');
    if (!approvalRecord.approvalDate?.trim() || Number.isNaN(new Date(approvalRecord.approvalDate).getTime())) {
      missingApprovalFields.push('approvalRecord.approvalDate');
    } else if (new Date(approvalRecord.approvalDate).getTime() > effectiveRefTs + 86_400_000) {
      missingApprovalFields.push('approvalRecord.approvalDate(non-future)');
    }
    if (approvalRecord.protocolVersion !== protocol.protocolVersion) {
      missingApprovalFields.push('approvalRecord.protocolVersion(match)');
    }
    if (approvalRecord.applicableCropId?.trim().toLowerCase() !== rawCropId) {
      missingApprovalFields.push('approvalRecord.applicableCropId(match)');
    }
    if (!Array.isArray(approvalRecord.applicableZones) || approvalRecord.applicableZones.length === 0) {
      missingApprovalFields.push('approvalRecord.applicableZones');
    }
  }

  if (missingApprovalFields.length > 0) {
    return {
      ok: false,
      status: 'insufficient_evidence',
      reasonCode: 'approval_record_incomplete',
      message: `Protocol "${protocol.protocolVersion}" for "${rawCropId}" lacks a complete independent agronomic approval record.`,
      missingRequirements: missingApprovalFields,
      guidance: 'An independently recorded agronomic approval (reviewer identity, credentials, competence scope, approval date, source evidence, version, and crop/geographic scope) is required.',
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
    typeof soil.phosphorusPpm !== 'number' ||
    !Number.isFinite(soil.phosphorusPpm) ||
    soil.phosphorusPpm < 0 ||
    soil.phosphorusPpm > 10_000
  ) {
    return {
      ok: false,
      status: 'invalid_input',
      reasonCode: 'invalid_soil_phosphorus',
      message: 'Soil phosphorus (ppm) must be a finite non-negative number.',
      missingRequirements: ['soil.phosphorusPpm'],
      guidance: 'Provide a valid available soil phosphorus reading in mg/kg (ppm).',
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
  const soilPCredit = soil.phosphorusPpm * 0.6;
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
    ...(request.farmId?.trim() ? { farmId: request.farmId.trim() } : {}),
    ...(request.plotId?.trim() ? { plotId: request.plotId.trim() } : {}),
    ...(request.requestId?.trim() ? { requestId: request.requestId.trim() } : {}),
    zone: normalizedZone,
    protocolVersion: protocol.protocolVersion,
    protocolApprovalStatus: 'agronomist_approved' as const,
    calculatedAt,
  };

  return {
    ok: true,
    status: 'approved_calculation',
    protocol: {
      cropId: protocol.cropId,
      protocolVersion: protocol.protocolVersion,
      approvalStatus: protocol.approvalStatus,
      approvalRecord: approvalRecord!,
      sourceCitation: protocol.sourceCitation,
      maxNitrogenKgPerHa: protocol.maxNitrogenKgPerHa,
      supportedZones: protocol.supportedZones,
      nutrientBasis: protocol.nutrientBasis,
    },
    recommendation: {
      cropId: rawCropId,
      targetYieldTonnesPerHa: request.targetYieldTonnesPerHa,
      farmAreaHectares: request.farmAreaHectares,
      protocolVersion: protocol.protocolVersion,
      protocolApprovalStatus: protocol.approvalStatus,
      binding,
      potassiumConversion: kConv,
      deficitKgPerHa: {
        nitrogenKg: nDeficitKgPerHa,
        phosphorusKg: pDeficitKgPerHa,
        potassiumKg: kDeficitKgPerHa,
      },
      productApplications,
      limeRecommendationKgPerHa: limeKgPerHa,
      warning,
    },
    assumptions: [
      `Approved protocol ${protocol.protocolVersion} (approved by ${approvalRecord!.reviewerName}, ${approvalRecord!.reviewerCredentials} on ${approvalRecord!.approvalDate}).`,
      kConv.conversionNote,
      'Fertiliser formulations assume NPK 15:15:15 (15% N, 15% P2O5, 15% K2O) and Urea (46% N).',
      'Soil provenance limitation: laboratory provenance ("lab_confirmed") is caller-declared; independent accredited laboratory certificate verification is not yet implemented.',
    ],
    missingInformation: [],
  };
}

/**
 * Legacy-compatible deterministic entrypoint hardened to fail closed (Batch 04.0-H Revision 2).
 * Enforces the exact same mandatory approval, geographic, provenance, and nutrient-basis controls
 * as `evaluateFertiliserRecommendation` with no bypass flag.
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
    protocolOverride?: Partial<FertiliserProtocolMetadata> | null;
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
    protocolOverride: options?.protocolOverride,
  });

  if (!result.ok) {
    throw new Error(`[${result.reasonCode}] ${result.message}`);
  }
  return result.recommendation;
}
