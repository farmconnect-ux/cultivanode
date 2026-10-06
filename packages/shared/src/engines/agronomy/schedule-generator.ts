import type {
  PlantingSchedule,
  ScheduledOperation,
  AgronomySeason,
} from './types';
import type { FarmZone } from '../../roles';
import { getCropById } from './catalogue';
import { getCropTemplate } from './templates';

function addDaysToDate(baseDateStr: string, days: number): string {
  const [year, month, day] = baseDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0]!;
}

export interface GenerateScheduleParams {
  cropId: string;
  varietyId: string;
  farmAreaHectares: number;
  plantingDate: string; // YYYY-MM-DD
  zone: FarmZone;
  season?: AgronomySeason;
  standardId?: string;
}

/**
 * Deterministically generates an agronomic calendar schedule from crop templates
 * without database or third-party API dependencies.
 */
export function generatePlantingSchedule(params: GenerateScheduleParams): PlantingSchedule {
  const crop = getCropById(params.cropId);
  if (!crop) {
    throw new Error(`Crop not recognized in catalogue: ${params.cropId}`);
  }

  const variety = crop.varieties.find((v) => v.id === params.varietyId) ?? crop.varieties[0]!;
  const template = getCropTemplate(params.cropId);
  const season = params.season ?? 'early_rainy';

  const scheduledOps: ScheduledOperation[] = template.operations.map((op) => ({
    id: `sched_${op.id}`,
    name: op.name,
    stage: op.stageName,
    startDate: addDaysToDate(params.plantingDate, op.relativeStartDay),
    endDate: addDaysToDate(params.plantingDate, op.relativeEndDay),
    relativeStartDay: op.relativeStartDay,
    relativeEndDay: op.relativeEndDay,
    description: op.description,
    requirements: op.requirements,
  }));

  const estimatedHarvestDate = addDaysToDate(params.plantingDate, variety.daysToMaturity);

  return {
    cropId: crop.id,
    varietyId: variety.id,
    farmAreaHectares: params.farmAreaHectares,
    plantingDate: params.plantingDate,
    harvestEstimatedDate: estimatedHarvestDate,
    zone: params.zone,
    season,
    operations: scheduledOps,
    standardsCompliance: {
      standardId: params.standardId ?? 'GAP-NG-2026-V1',
      version: 1,
      source: 'IITA / NIHORT Technical Guides 2026',
      approvedBy: 'IITA / CultivaNode Agronomy Board',
      approvedAt: '2026-01-15',
    },
  };
}
