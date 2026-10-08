import type {
  AgronomicStandardDefinition,
  VarianceCalculationInput,
  VarianceReport,
} from './types';

/**
 * Standard -> Plan -> Actual Engine
 *
 * Core Principle:
 * "CultivaNode recommends. The farmer decides. The farmer records. CultivaNode learns from the difference."
 *
 * CultivaNode recommendations are strictly advisory. A farmer's real practice is never overwritten,
 * judged, or blocked. The system independently stores:
 *  1. STANDARD (the agronomic benchmark)
 *  2. PLAN (the farmer's intention)
 *  3. ACTUAL (the real-world field result)
 */
export class StandardPlanActualEngine {
  private standards: Map<string, AgronomicStandardDefinition> = new Map();

  constructor(initialStandards: AgronomicStandardDefinition[] = []) {
    for (const std of initialStandards) {
      this.registerStandard(std);
    }
  }

  /**
   * Registers or updates a standard definition.
   * If a version is published, it becomes immutable for historical audits.
   */
  registerStandard(standard: AgronomicStandardDefinition): void {
    const existing = this.standards.get(standard.id);
    if (existing && existing.status === 'published' && existing.version === standard.version) {
      // Versioned immutability check
      if (JSON.stringify(existing.baselineParameters) !== JSON.stringify(standard.baselineParameters)) {
        throw new Error(
          `IMMUTABLE_STANDARD_VIOLATION: Published standard "${standard.id}" v${standard.version} cannot be mutated in place. Bump the version number instead.`
        );
      }
    }
    this.standards.set(standard.id, { ...standard });
  }

  getStandard(id: string): AgronomicStandardDefinition | undefined {
    const std = this.standards.get(id);
    return std ? { ...std } : undefined;
  }

  /**
   * Generates advisory recommendation for a given crop or livestock enterprise.
   * Recommendations never force farmer adherence.
   */
  generateRecommendation(standardId: string, enterpriseAreaHa: number): Record<string, number> {
    const standard = this.standards.get(standardId);
    if (!standard) {
      return {};
    }

    const recs: Record<string, number> = {};
    for (const [key, value] of Object.entries(standard.baselineParameters)) {
      if (typeof value === 'number') {
        // Scale per hectare if relevant
        if (key.includes('_ha')) {
          recs[key] = Math.round(value * enterpriseAreaHa * 100) / 100;
        } else {
          recs[key] = value;
        }
      }
    }
    return recs;
  }

  /**
   * Calculates deterministic variance across Standard, Plan, and Actual.
   * Standard vs Plan: deviation of farmer's plan from scientific recommendation.
   * Standard vs Actual: overall deviation of field reality from scientific recommendation.
   * Plan vs Actual: operational execution deviation from the farmer's own target.
   */
  static calculateVariance(input: VarianceCalculationInput): VarianceReport {
    const standardVsPlan = Math.round((input.planValue - input.standardValue) * 100) / 100;
    const standardVsActual = Math.round((input.actualValue - input.standardValue) * 100) / 100;
    const planVsActual = Math.round((input.actualValue - input.planValue) * 100) / 100;

    const planDeviationPct =
      input.standardValue > 0
        ? Math.round(((input.planValue - input.standardValue) / input.standardValue) * 1000) / 10
        : 0;

    const actualDeviationPct =
      input.planValue > 0
        ? Math.round(((input.actualValue - input.planValue) / input.planValue) * 1000) / 10
        : input.standardValue > 0
          ? Math.round(((input.actualValue - input.standardValue) / input.standardValue) * 1000) / 10
          : 0;

    return {
      metricName: input.metricName,
      unit: input.unit,
      standardValue: input.standardValue,
      planValue: input.planValue,
      actualValue: input.actualValue,
      standardVsPlanVariance: standardVsPlan,
      standardVsActualVariance: standardVsActual,
      planVsActualVariance: planVsActual,
      planDeviationPct,
      actualDeviationPct,
      isFarmerOverride: Boolean(input.isFarmerOverride),
      deviationReason: input.deviationReason,
    };
  }
}
