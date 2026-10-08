import { EnterpriseMarginResult } from './types';

export class FarmBudgetCostEngine {
  /**
   * Computes unit cost of production and enterprise margins
   */
  public static calculateEnterpriseMargin(params: {
    enterpriseName: string;
    grossRevenueMinor: number;
    variableCostsMinor: number;
    fixedOverheadMinor: number;
    unitsProduced: number;
    unitLabel: string;
  }): EnterpriseMarginResult {
    const {
      enterpriseName,
      grossRevenueMinor,
      variableCostsMinor,
      fixedOverheadMinor,
      unitsProduced,
      unitLabel,
    } = params;

    const totalCostMinor = variableCostsMinor + fixedOverheadMinor;
    const grossMarginMinor = grossRevenueMinor - variableCostsMinor;
    const netOperatingProfitMinor = grossRevenueMinor - totalCostMinor;

    const costPerUnitMinor = unitsProduced > 0
      ? Math.round(totalCostMinor / unitsProduced)
      : 0;

    return {
      enterpriseName,
      grossRevenueMinor,
      variableCostsMinor,
      fixedOverheadMinor,
      totalCostMinor,
      grossMarginMinor,
      netOperatingProfitMinor,
      costPerUnitMinor,
      unitProduced: unitsProduced,
      unitLabel,
    };
  }

  /**
   * Evaluates budget line variance
   */
  public static evaluateBudgetVariance(
    plannedMinor: number,
    actualMinor: number
  ): {
    varianceMinor: number;
    percentageDeviation: number;
    isOverBudget: boolean;
  } {
    const varianceMinor = actualMinor - plannedMinor;
    const percentageDeviation = plannedMinor > 0
      ? Number(((varianceMinor / plannedMinor) * 100).toFixed(2))
      : 0;

    return {
      varianceMinor,
      percentageDeviation,
      isOverBudget: varianceMinor > 0,
    };
  }
}
