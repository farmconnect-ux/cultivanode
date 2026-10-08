/**
 * CultivaNode Farm Management Types
 * Domain contracts for Farms, Fields, Standard->Plan->Actual,
 * Livestock, Staff, Machinery, Multi-Location Inventory & Budgets.
 */

export type OwnershipType = 'owned' | 'leased' | 'family' | 'partnership' | 'community_land' | 'managed';

export type StandardCategory =
  | 'planting'
  | 'fertiliser'
  | 'spray'
  | 'irrigation'
  | 'livestock_feed'
  | 'vaccination'
  | 'machinery_benchmark'
  | 'yield_benchmark'
  | 'cost_benchmark'
  | 'general';

export interface AgronomicStandardDefinition {
  id: string;
  category: StandardCategory;
  cropId?: string;
  livestockType?: string;
  title: string;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  baselineParameters: Record<string, number | string | boolean>;
  mandatedOperations: string[];
  restrictedInputs: string[];
  approvedBy: string;
  status: 'draft' | 'published' | 'superseded' | 'deprecated';
}

export interface VarianceCalculationInput {
  entityType: 'crop_cycle' | 'crop_operation' | 'livestock_event' | 'machinery_usage' | 'input_application' | 'budget_line';
  metricName: string;
  unit: string;
  standardValue: number;
  planValue: number;
  actualValue: number;
  isFarmerOverride?: boolean;
  deviationReason?: string;
}

export interface VarianceReport {
  metricName: string;
  unit: string;
  standardValue: number;
  planValue: number;
  actualValue: number;
  standardVsPlanVariance: number;
  standardVsActualVariance: number;
  planVsActualVariance: number;
  planDeviationPct: number;
  actualDeviationPct: number;
  isFarmerOverride: boolean;
  deviationReason?: string;
}

/* ------------------------------------------------------------------ Livestock Types */

export type AnimalType = 'cattle' | 'goat' | 'sheep' | 'pig' | 'poultry' | 'fish' | 'rabbit' | 'snail' | 'other';
export type AnimalSex = 'male' | 'female';
export type HealthEventType = 'vaccination' | 'treatment' | 'disease_symptom' | 'vet_visit' | 'routine_check';
export type BreedingMethod = 'natural' | 'artificial_insemination';
export type PregnancyStatus = 'pending' | 'confirmed' | 'not_pregnant';

export interface WithdrawalSafetyCheck {
  medicationName: string;
  administeredOn: string;
  withdrawalDays: number;
  withdrawalEndDate: string;
  isSafeForHarvestOrConsumption: boolean;
  remainingDays: number;
}

/* ------------------------------------------------------------------ Machinery Types */

export type MachineryType =
  | 'tractor'
  | 'plough'
  | 'harrow'
  | 'ridger'
  | 'planter'
  | 'harvester'
  | 'sprayer'
  | 'pump'
  | 'generator'
  | 'trailer'
  | 'truck'
  | 'processing';

export type MachineryStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'RESERVED'
  | 'UNDER_MAINTENANCE'
  | 'OUT_OF_SERVICE'
  | 'HIRED_OUT'
  | 'SOLD'
  | 'LOST';

export interface MachineryEfficiencyMetrics {
  hoursOperated: number;
  areaCoveredHa: number;
  fuelConsumedLiters: number;
  fuelLitersPerHour: number;
  fuelLitersPerHectare: number;
  costPerHourKobo: number;
  costPerHectareKobo: number;
}

/* ------------------------------------------------------------------ Inventory Types */

export type FarmInventoryTransactionType =
  | 'PURCHASE'
  | 'RECEIPT'
  | 'TRANSFER'
  | 'ISSUE'
  | 'CONSUMPTION'
  | 'ADJUSTMENT'
  | 'RETURN'
  | 'LOSS'
  | 'DAMAGE'
  | 'SALE'
  | 'RESERVATION'
  | 'RELEASE';

export interface FarmInventoryItemLot {
  id: string;
  farmId: string;
  locationId?: string;
  sku: string;
  itemName: string;
  category: string;
  quantityOnHand: number;
  reservedQuantity: number;
  unit: string;
  reorderThreshold: number;
  unitCostKobo: number;
  expiryDate?: string;
}

/* ------------------------------------------------------------------ Budget & Cost Allocation */

export interface CostAllocationEntry {
  farmId: string;
  plotId?: string;
  enterpriseType: 'crop' | 'livestock' | 'machinery' | 'overhead';
  enterpriseId?: string;
  operationId?: string;
  costCategory: string;
  amountKobo: number;
  notes?: string;
}

export interface EnterpriseProfitabilityReport {
  enterpriseId: string;
  enterpriseType: 'crop' | 'livestock';
  totalRevenueKobo: number;
  totalDirectCostKobo: number;
  grossMarginKobo: number;
  grossMarginPct: number;
  allocatedOverheadKobo: number;
  netMarginKobo: number;
}
