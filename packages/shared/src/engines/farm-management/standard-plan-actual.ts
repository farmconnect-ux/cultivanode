import { FarmAgronomicStandard, CropPlanInput, StandardPlanActualVariance } from './types';

/**
 * Standard -> Plan -> Actual Engine
 * Implements CultivaNode's advisory philosophy:
 * "CultivaNode recommends. The farmer decides. The farmer records. CultivaNode learns from the difference."
 */
export class StandardPlanActualEngine {
  /**
   * Generates a recommended baseline operational calendar based on agronomic standards
   */
  public static generatePlanFromStandard(
    standard: FarmAgronomicStandard,
    planInput: CropPlanInput
  ) {
    const area = planInput.plantedAreaHectares;
    const baseStartDate = new Date(planInput.startDate);

    const recommendedOperations = standard.recommendedOperations.map((op, idx) => {
      const scheduledDate = new Date(baseStartDate);
      scheduledDate.setDate(scheduledDate.getDate() + op.dayOffset);

      const scaledInputs = op.targetInputs?.map((input) => ({
        itemName: input.itemName,
        recommendedQuantity: Number((input.standardQuantityPerHa * area).toFixed(2)),
        unit: input.unit,
      })) ?? [];

      return {
        sequence: idx + 1,
        stage: op.stage,
        activity: op.activity,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        recommendedInputs: scaledInputs,
      };
    });

    const targetYieldKg = planInput.targetYieldKg ?? Number((standard.expectedYieldKgPerHa * area).toFixed(2));
    const targetHarvestDate = planInput.targetHarvestDate ?? (() => {
      const harvestDate = new Date(baseStartDate);
      harvestDate.setDate(harvestDate.getDate() + standard.expectedDurationDays);
      return harvestDate.toISOString().split('T')[0];
    })();

    return {
      cropCycleInput: {
        ...planInput,
        targetYieldKg,
        targetHarvestDate,
      },
      recommendedOperations,
      standardReference: {
        standardId: standard.id,
        version: standard.version,
        standardYieldPerHa: standard.expectedYieldKgPerHa,
      },
    };
  }

  /**
   * Computes variance between Plan and Actual, and compares to the advisory Standard
   */
  public static calculateVariance(params: {
    cropCycleId: string;
    metric: 'yield_kg' | 'cost_minor' | 'duration_days' | 'fertilizer_kg' | 'seed_kg';
    standardValue: number;
    plannedValue: number;
    actualValue: number;
  }): StandardPlanActualVariance {
    const { cropCycleId, metric, standardValue, plannedValue, actualValue } = params;
    const varianceFromPlan = actualValue - plannedValue;
    const percentageVariance = plannedValue !== 0 
      ? Number(((varianceFromPlan / plannedValue) * 100).toFixed(2)) 
      : 0;

    let assessment: 'favorable' | 'adverse' | 'on_target' = 'on_target';

    if (metric === 'yield_kg') {
      // For yield, higher actual than planned is favorable
      if (percentageVariance > 5) assessment = 'favorable';
      else if (percentageVariance < -5) assessment = 'adverse';
    } else if (metric === 'cost_minor' || metric === 'fertilizer_kg' || metric === 'seed_kg') {
      // For costs and resource consumption, lower actual than planned is favorable
      if (percentageVariance < -5) assessment = 'favorable';
      else if (percentageVariance > 5) assessment = 'adverse';
    } else if (metric === 'duration_days') {
      // For cycle days, faster completion without yield loss is favorable
      if (percentageVariance < -5) assessment = 'favorable';
      else if (percentageVariance > 5) assessment = 'adverse';
    }

    return {
      cropCycleId,
      metric,
      standardValue,
      plannedValue,
      actualValue,
      varianceFromPlan,
      percentageVariance,
      assessment,
    };
  }
}
