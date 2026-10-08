export type FarmEnterpriseType = 'crop' | 'livestock' | 'mixed' | 'aquaculture' | 'horticulture' | 'poultry';

export type CropCycleStatus = 'planning' | 'active' | 'harvesting' | 'completed' | 'abandoned';
export type OperationStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
export type LivestockStatus = 'active' | 'quarantine' | 'sold' | 'culled' | 'deceased';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'under_review' | 'completed' | 'cancelled';

export interface FarmAgronomicStandard {
  id: string;
  cropName: string;
  variety?: string;
  agroEcologicalZone?: string;
  version: number;
  expectedYieldKgPerHa: number;
  expectedDurationDays: number;
  seedRateKgPerHa: number;
  recommendedOperations: Array<{
    stage: string;
    dayOffset: number;
    activity: string;
    targetInputs?: Array<{ itemName: string; standardQuantityPerHa: number; unit: string }>;
  }>;
}

export interface CropPlanInput {
  farmId: string;
  plotId: string;
  cropName: string;
  variety?: string;
  plantedAreaHectares: number;
  startDate: string;
  targetHarvestDate?: string;
  targetYieldKg?: number;
  budgetCapMinor: number;
}

export interface StandardPlanActualVariance {
  cropCycleId: string;
  metric: 'yield_kg' | 'cost_minor' | 'duration_days' | 'fertilizer_kg' | 'seed_kg';
  standardValue: number;
  plannedValue: number;
  actualValue: number;
  varianceFromPlan: number;
  percentageVariance: number;
  assessment: 'favorable' | 'adverse' | 'on_target';
}

export interface InventoryItemState {
  id: string;
  farmId: string;
  locationId: string;
  itemCategory: 'seed' | 'fertilizer' | 'chemical' | 'feed' | 'fuel' | 'spare_part' | 'produce';
  itemName: string;
  sku?: string;
  lotNumber?: string;
  expiryDate?: string;
  currentQuantity: number;
  reservedQuantity: number;
  unit: string;
  averageCostMinor: number;
}

export interface StockMovementRequest {
  inventoryItemId: string;
  movementType: 'purchase_in' | 'usage_out' | 'transfer_out' | 'transfer_in' | 'adjustment' | 'harvest_in';
  quantity: number;
  unitCostMinor?: number;
  reason?: string;
  lotNumber?: string;
}

export interface LivestockAnimalState {
  id: string;
  tagNumber: string;
  species: string;
  breed?: string;
  sex: 'male' | 'female' | 'castrated';
  birthDate?: string;
  status: LivestockStatus;
  currentWeightKg: number;
  lastWeighedDate?: string;
  activeWithdrawalEndDate?: string; // If under medication withdrawal
}

export interface HealthTreatmentRecord {
  animalId: string;
  treatmentName: string;
  medicationName: string;
  withdrawalDays: number;
  administeredAt: Date;
}

export interface MachineryAssetState {
  id: string;
  name: string;
  category: 'tractor' | 'harvester' | 'planter' | 'sprayer' | 'irrigation_pump' | 'vehicle' | 'tool';
  totalOperatingHours: number;
  nextServiceHours?: number;
  fuelConsumptionLitresPerHour: number;
  hourlyRentalRateMinor?: number;
}

export interface EnterpriseMarginResult {
  enterpriseName: string;
  grossRevenueMinor: number;
  variableCostsMinor: number;
  fixedOverheadMinor: number;
  totalCostMinor: number;
  grossMarginMinor: number;
  netOperatingProfitMinor: number;
  costPerUnitMinor: number;
  unitProduced: number;
  unitLabel: string;
}
