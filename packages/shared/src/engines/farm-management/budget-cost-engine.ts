import type { CostAllocationEntry, EnterpriseProfitabilityReport } from './types';

export interface BudgetVarianceReport {
  budgetId: string;
  totalBudgetedKobo: number;
  totalActualKobo: number;
  varianceKobo: number; // positive = over budget for expenses, or under budget for income
  variancePct: number;
  status: 'under_budget' | 'on_track' | 'over_budget';
}

export class FarmBudgetCostEngine {
  /**
   * Allocates direct costs to specific enterprises and operations.
   */
  static aggregateEnterpriseDirectCosts(entries: CostAllocationEntry[], enterpriseId: string): number {
    return entries
      .filter((e) => e.enterpriseId === enterpriseId)
      .reduce((sum, e) => sum + e.amountKobo, 0);
  }

  /**
   * Calculates comprehensive enterprise profitability including gross and net margins.
   */
  static computeEnterpriseProfitability(params: {
    enterpriseId: string;
    enterpriseType: 'crop' | 'livestock';
    totalRevenueKobo: number;
    totalDirectCostKobo: number;
    allocatedOverheadKobo?: number;
  }): EnterpriseProfitabilityReport {
    const grossMarginKobo = params.totalRevenueKobo - params.totalDirectCostKobo;
    const grossMarginPct =
      params.totalRevenueKobo > 0
        ? Math.round((grossMarginKobo / params.totalRevenueKobo) * 1000) / 10
        : 0;

    const overhead = params.allocatedOverheadKobo ?? 0;
    const netMarginKobo = grossMarginKobo - overhead;

    return {
      enterpriseId: params.enterpriseId,
      enterpriseType: params.enterpriseType,
      totalRevenueKobo: params.totalRevenueKobo,
      totalDirectCostKobo: params.totalDirectCostKobo,
      grossMarginKobo,
      grossMarginPct,
      allocatedOverheadKobo: overhead,
      netMarginKobo,
    };
  }

  /**
   * Computes budget vs actual variance for cost controls.
   */
  static computeBudgetVariance(
    budgetId: string,
    budgetedExpenseKobo: number,
    actualExpenseKobo: number
  ): BudgetVarianceReport {
    const varianceKobo = actualExpenseKobo - budgetedExpenseKobo;
    const variancePct =
      budgetedExpenseKobo > 0
        ? Math.round(((actualExpenseKobo - budgetedExpenseKobo) / budgetedExpenseKobo) * 1000) / 10
        : 0;

    let status: 'under_budget' | 'on_track' | 'over_budget' = 'on_track';
    if (variancePct > 5.0) {
      status = 'over_budget';
    } else if (variancePct < -5.0) {
      status = 'under_budget';
    }

    return {
      budgetId,
      totalBudgetedKobo: budgetedExpenseKobo,
      totalActualKobo: actualExpenseKobo,
      varianceKobo,
      variancePct,
      status,
    };
  }
}
