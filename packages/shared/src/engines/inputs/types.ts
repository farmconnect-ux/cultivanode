import type {
  ConvertedPhosphorusValue,
  ConvertedPotassiumValue,
  NutrientBasis,
  SoilExtractionMethod,
  TypedSoilPhosphorusInput,
  TypedSoilPotassiumInput,
} from './nutrient-units';

export type SoilEvidenceClass =
  | 'lab_confirmed'
  | 'field_kit'
  | 'farmer_reported'
  | 'modelled_estimate';

export type AgriculturalRecommendationStatus =
  | 'approved_calculation'
  | 'source_information'
  | 'general_guidance'
  | 'insufficient_evidence'
  | 'unsupported_crop'
  | 'invalid_input'
  | 'calculation_failure';

export interface SoilNutrientProfile {
  pH: number;
  nitrogenPercent?: number; // Organic matter / total N % (e.g. 0.15%)
  /** Legacy untyped phosphorus ppm — rejected fail-closed because basis (elemental_P vs P2O5) is ambiguous. */
  phosphorusPpm?: number;
  /** Preferred explicit typed phosphorus input preserving original lab value, unit, and basis. */
  phosphorus?: TypedSoilPhosphorusInput;
  /** Legacy untyped potassium ppm — rejected fail-closed because basis (elemental_K vs K2O) is ambiguous. */
  potassiumPpm?: number;
  /** Preferred explicit typed potassium input preserving original lab value, unit, and basis. */
  potassium?: TypedSoilPotassiumInput;
  organicMatterPercent?: number;
  /** Mandatory provenance metadata enforced unconditionally server-side (ADR-018, ADR-020). */
  provenance?: SoilEvidenceClass;
  extractionMethod?: SoilExtractionMethod | string;
  samplingDepthCm?: number;
  testDate?: string; // ISO date string
  /** Mandatory farm association on the soil report; must match request farmId. */
  farmId?: string;
  /** Mandatory plot association when recommendation or soil report is plot-specific. */
  plotId?: string;
  /** Optional laboratory report identifier preserved in the calculation binding for traceability. */
  soilReportId?: string;
}

export interface AgronomicApprovalRecord {
  reviewerName: string;
  reviewerCredentials: string;
  competenceScope: string;
  /** Strict ISO date string (YYYY-MM-DD or full ISO-8601). */
  approvalDate: string;
  /** Mandatory approval lifecycle status; only 'active' may authorise prescriptions. */
  status: 'active' | 'withdrawn' | 'superseded' | 'revoked' | 'suspended';
  /** Mandatory strict ISO expiry date; indefinite validity is never inferred. */
  expiresAt: string;
  sourceEvidence: string;
  protocolVersion: string;
  applicableCropId: string;
  applicableZones: readonly string[];
}

export interface FertiliserProtocolMetadata {
  cropId: string;
  protocolVersion: string;
  /**
   * Software validation (`provisional_software_validated`), document publication, or
   * administrative approval NEVER authorises a public numerical fertiliser prescription.
   * Only `agronomist_approved` with an active, non-expired `approvalRecord` may do so.
   */
  approvalStatus: 'provisional_software_validated' | 'agronomist_approved';
  approvalRecord?: AgronomicApprovalRecord | null;
  sourceCitation: string;
  maxNitrogenKgPerHa: number;
  supportedZones: readonly string[];
  nutrientBasis: {
    nitrogen: NutrientBasis;
    phosphorus: NutrientBasis;
    potassium: NutrientBasis;
  };
}

export interface FertiliserCalculationBinding {
  cropId: string;
  farmId: string;
  plotId?: string;
  requestId?: string;
  zone: string;
  growthStage: string;
  protocolVersion: string;
  protocolApprovalStatus: 'agronomist_approved';
  calculatedAt: string; // ISO timestamp
  soilAssociation: {
    farmId: string;
    plotId?: string;
    soilReportId?: string;
    provenance: 'lab_confirmed';
    extractionMethod: string;
    testDate: string;
  };
}

export interface FertiliserRecommendation {
  cropId: string;
  targetYieldTonnesPerHa: number;
  farmAreaHectares: number;
  protocolVersion?: string;
  protocolApprovalStatus?: FertiliserProtocolMetadata['approvalStatus'];
  binding?: FertiliserCalculationBinding;
  phosphorusConversion?: ConvertedPhosphorusValue;
  potassiumConversion?: ConvertedPotassiumValue;
  deficitKgPerHa: {
    nitrogenKg: number;
    phosphorusKg: number;
    potassiumKg: number;
  };
  productApplications: {
    productName: string; // e.g. 'NPK 15:15:15', 'Urea 46%'
    kgPerHa: number;
    totalKg: number;
    fiftyKgBags: number;
    timing: 'basal_planting' | 'top_dress_vegetative' | 'split';
  }[];
  limeRecommendationKgPerHa: number;
  warning?: string;
}

export interface FertiliserCalculationRequest {
  cropId?: string | null;
  targetYieldTonnesPerHa: number;
  farmAreaHectares: number;
  soil?: SoilNutrientProfile | null;
  zone?: string | null;
  growthStage?: string | null;
  farmId?: string | null;
  plotId?: string | null;
  requestId?: string | null;
  referenceDate?: string;
}

export type FertiliserRecommendationResult =
  | {
      ok: true;
      status: 'approved_calculation';
      recommendation: FertiliserRecommendation;
      protocol: FertiliserProtocolMetadata;
      assumptions: string[];
      missingInformation: string[];
    }
  | {
      ok: false;
      status: Exclude<AgriculturalRecommendationStatus, 'approved_calculation'>;
      reasonCode: string;
      message: string;
      missingRequirements: string[];
      guidance: string;
    };

export interface ApprovedAgrochemical {
  id: string;
  brandName: string;
  activeIngredient: string;
  category: 'herbicide' | 'insecticide' | 'fungicide';
  recommendedRateLitersOrKgPerHa: number;
  sprayVolumeLitersPerHa: number;
  preHarvestIntervalDays: number; // PHI
  reEntryIntervalHours: number; // REI
  targetCrops: string[];
  targetPests: string[];
  isBannedInNigeria: boolean;
}

export interface SprayPlan {
  productName: string;
  activeIngredient: string;
  areaHectares: number;
  totalChemicalRequiredLitersOrKg: number;
  totalWaterVolumeLiters: number;
  knapsackTanksCount: number; // assuming standard 16L knapsack
  dosePerTankMlOrGrams: number;
  preHarvestIntervalDays: number;
  earliestSafeHarvestDate: string; // YYYY-MM-DD
  reEntryIntervalHours: number;
  safetyWarnings: string[];
}

export interface WeatherDayForecast {
  date: string; // YYYY-MM-DD
  tempMaxC: number;
  tempMinC: number;
  rainMm: number;
  windSpeedKmh: number;
  humidityPercent: number;
}

export interface CropWeatherAlert {
  date: string;
  alertType: 'drought_stress' | 'fertiliser_leaching' | 'lodging_wind' | 'fungal_blight_risk';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  headline: string;
  recommendation: string;
}

export interface InventoryItemLot {
  id: string;
  sku: string;
  name: string;
  category: 'seed' | 'fertiliser' | 'chemical' | 'fuel' | 'tool';
  unit: string; // 'kg', 'liter', 'bag', 'pack'
  quantityOnHand: number;
  costPerUnitKobo: number;
  expiryDate?: string;
}

export interface StockMovement {
  id: string;
  sku: string;
  movementType: 'receive' | 'issue_to_field' | 'damage_writeoff';
  quantity: number;
  unitCostKobo: number;
  plotId?: string;
  notes?: string;
  timestamp: number;
}

export interface FarmGrossMarginReport {
  cropId: string;
  plotId: string;
  areaHectares: number;
  totalYieldKg: number;
  revenueKobo: number;
  directCostsKobo: {
    machineryKobo: number;
    labourKobo: number;
    seedsKobo: number;
    fertiliserKobo: number;
    chemicalsKobo: number;
    otherKobo: number;
  };
  totalDirectCostKobo: number;
  grossMarginKobo: number;
  grossMarginPerHectareKobo: number;
  costOfProductionPerKgKobo: number;
  roiPercentage: number;
}
