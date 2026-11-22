import type {
  ConvertedPotassiumValue,
  NutrientBasis,
  SoilExtractionMethod,
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
  phosphorusPpm: number; // Available P (Bray-1, e.g. 8 ppm)
  potassiumPpm?: number; // Legacy elemental K in mg/kg (ppm)
  /** Preferred explicit typed potassium input preserving original lab value, unit, and basis. */
  potassium?: TypedSoilPotassiumInput;
  organicMatterPercent?: number;
  /** Optional provenance metadata enforced when strict validation is enabled (ADR-018, ADR-020). */
  provenance?: SoilEvidenceClass;
  extractionMethod?: SoilExtractionMethod | string;
  samplingDepthCm?: number;
  testDate?: string; // ISO date string
}

export interface FertiliserProtocolMetadata {
  cropId: string;
  protocolVersion: string;
  /** Software validation does NOT constitute independent agronomic certification (Batch 04.0-H). */
  approvalStatus: 'provisional_software_validated' | 'agronomist_approved';
  sourceCitation: string;
  maxNitrogenKgPerHa: number;
  supportedZones: readonly string[];
  nutrientBasis: {
    nitrogen: NutrientBasis;
    phosphorus: NutrientBasis;
    potassium: NutrientBasis;
  };
}

export interface FertiliserRecommendation {
  cropId: string;
  targetYieldTonnesPerHa: number;
  farmAreaHectares: number;
  protocolVersion?: string;
  protocolApprovalStatus?: FertiliserProtocolMetadata['approvalStatus'];
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
  referenceDate?: string;
  /** When true (default in Batch 04.0-H API/assistant), requires lab-confirmed soil provenance, extraction method, depth, and non-expired test date. */
  requireStrictSoilProvenance?: boolean;
  /** Optional explicit protocol override for testing missing/unapproved protocol scenarios. */
  protocolOverride?: Partial<FertiliserProtocolMetadata> | null;
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
