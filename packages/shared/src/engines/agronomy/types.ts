import type { FarmZone, EquipmentType, ProviderType } from '../../roles';

export type AgronomySeason = 'early_rainy' | 'late_rainy' | 'dry_irrigated';

export interface CropVariety {
  id: string;
  name: string;
  daysToMaturity: number;
  expectedYieldTonnesPerHa: number;
  description: string;
  droughtTolerant?: boolean;
}

export interface CropDefinition {
  id: string;
  commonName: string;
  scientificName: string;
  category: 'cereal' | 'tuber' | 'vegetable' | 'legume' | 'tree_crop';
  suitableZones: FarmZone[];
  varieties: CropVariety[];
}

export interface OperationRequirement {
  equipment?: EquipmentType[];
  providers?: ProviderType[];
  inputCategory?: 'seed' | 'fertiliser' | 'herbicide' | 'insecticide' | 'fungicide';
}

export interface CropOperationTemplate {
  id: string;
  name: string;
  stageName: string;
  relativeStartDay: number; // e.g. -7 (7 days before planting)
  relativeEndDay: number; // e.g. 0 (planting day)
  description: string;
  requirements: OperationRequirement;
}

export interface CropLifecycleTemplate {
  cropId: string;
  zone: FarmZone;
  season: AgronomySeason;
  version: number;
  operations: CropOperationTemplate[];
}

export interface ScheduledOperation {
  id: string;
  name: string;
  stage: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  relativeStartDay: number;
  relativeEndDay: number;
  description: string;
  requirements: OperationRequirement;
}

export interface PlantingSchedule {
  cropId: string;
  varietyId: string;
  farmAreaHectares: number;
  plantingDate: string; // YYYY-MM-DD
  harvestEstimatedDate: string; // YYYY-MM-DD
  zone: FarmZone;
  season: AgronomySeason;
  operations: ScheduledOperation[];
  standardsCompliance: {
    standardId: string;
    version: number;
    source: string;
    approvedBy: string;
    approvedAt: string;
  };
}

export interface AgronomicStandard {
  id: string;
  cropId: string;
  title: string;
  version: number;
  status: 'published' | 'draft' | 'archived';
  mandatedOperations: string[];
  restrictedChemicals: string[];
  maxFertiliserNitrogenKgPerHa: number;
  approvedBy: string;
  approvedAt: string;
}
