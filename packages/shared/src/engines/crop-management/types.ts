export type CropCycleStatus = 'planning' | 'active' | 'harvesting' | 'completed' | 'abandoned';
export type CropOperationStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
export type CropHealthStatus = 'excellent' | 'good' | 'watch' | 'critical';
export type ScoutingCategory = 'pest' | 'disease' | 'weed' | 'nutrient_deficiency' | 'water_stress' | 'general';
export type ScoutingSeverity = 'low' | 'medium' | 'high' | 'severe';
export type CropInputCategory = 'seed' | 'fertiliser' | 'herbicide' | 'insecticide' | 'fungicide' | 'irrigation' | 'other';
export type CropAlertCategory = 'weather' | 'pest_outbreak' | 'phi_violation' | 'harvest_window' | 'operation_overdue';
export type SoilTexture = 'sandy' | 'loamy_sand' | 'sandy_loam' | 'loam' | 'silt_loam' | 'clay_loam' | 'clay';
export type SoilDrainage = 'well_drained' | 'moderate' | 'poor' | 'waterlogged';
export type IrrigationType = 'rainfed' | 'drip' | 'sprinkler' | 'furrow' | 'manual';
export type HarvestQualityGrade = 'grade_a' | 'grade_b' | 'grade_c' | 'processing_grade';

export interface CropCycle {
  id: string;
  plotId: string;
  cropId: string;
  varietyId: string;
  season: string;
  status: CropCycleStatus;
  targetAreaHa: number;
  plantingDate: string; // YYYY-MM-DD
  expectedHarvestDate: string; // YYYY-MM-DD
  actualHarvestDate?: string | null;
  targetYieldKg: number;
  actualYieldKg: number;
  currentStage: string;
  healthScore: number; // 0.00 to 1.00
  healthStatus: CropHealthStatus;
  estimatedBudgetKobo: number;
  actualCostKobo: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CropCycleOperation {
  id: string;
  cycleId: string;
  name: string;
  stage: string;
  relativeStartDay: number;
  relativeEndDay: number;
  scheduledStartDate: string; // YYYY-MM-DD
  scheduledEndDate: string; // YYYY-MM-DD
  actualDate?: string | null;
  status: CropOperationStatus;
  notes?: string | null;
  bookingId?: string | null;
  requiredEquipment?: string | null;
  actualCostKobo: number;
  completedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CropObservation {
  id: string;
  cycleId: string;
  observerId: string;
  category: ScoutingCategory;
  severity: ScoutingSeverity;
  description: string;
  photoPaths: string[];
  location?: { latitude: number; longitude: number } | null;
  recommendedAction?: string | null;
  resolved: boolean;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface CropMeasurement {
  id: string;
  cycleId: string;
  metricName: string;
  metricValue: number;
  recordedAt: string;
  recordedBy?: string | null;
}

export interface CropInputApplication {
  id: string;
  cycleId: string;
  operationId?: string | null;
  category: CropInputCategory;
  chemicalId?: string | null;
  productName: string;
  activeIngredient?: string | null;
  ratePerHa: number;
  unit: 'liters' | 'kg' | 'bags' | 'grams';
  areaAppliedHa: number;
  totalQuantity: number;
  costKobo: number;
  preHarvestIntervalDays: number;
  reEntryIntervalHours: number;
  appliedDate: string; // YYYY-MM-DD
  appliedBy?: string | null;
  createdAt: string;
}

export interface CropHarvest {
  id: string;
  cycleId: string;
  batchCode: string;
  harvestDate: string; // YYYY-MM-DD
  quantityKg: number;
  qualityGrade: HarvestQualityGrade;
  moisturePct?: number | null;
  lossPct?: number | null;
  storageLocation?: string | null;
  notes?: string | null;
  recordedBy?: string | null;
  createdAt: string;
}

export interface CropAlert {
  id: string;
  cycleId: string;
  category: CropAlertCategory;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionUrl?: string | null;
  isDismissed: boolean;
  createdAt: string;
}
