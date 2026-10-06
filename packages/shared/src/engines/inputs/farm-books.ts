import type { FarmGrossMarginReport } from './types';

export interface ComputeGrossMarginParams {
  cropId: string;
  plotId: string;
  areaHectares: number;
  totalYieldKg: number;
  revenueKobo: number;
  costs: {
    machineryKobo: number;
    labourKobo: number;
    seedsKobo: number;
    fertiliserKobo: number;
    chemicalsKobo: number;
    otherKobo?: number;
  };
}

/**
 * Deterministically computes enterprise gross margin and unit cost of production in kobo.
 */
export function computeFarmGrossMargin(params: ComputeGrossMarginParams): FarmGrossMarginReport {
  const directCosts = {
    machineryKobo: params.costs.machineryKobo,
    labourKobo: params.costs.labourKobo,
    seedsKobo: params.costs.seedsKobo,
    fertiliserKobo: params.costs.fertiliserKobo,
    chemicalsKobo: params.costs.chemicalsKobo,
    otherKobo: params.costs.otherKobo ?? 0,
  };

  const totalDirectCostKobo =
    directCosts.machineryKobo +
    directCosts.labourKobo +
    directCosts.seedsKobo +
    directCosts.fertiliserKobo +
    directCosts.chemicalsKobo +
    directCosts.otherKobo;

  const grossMarginKobo = params.revenueKobo - totalDirectCostKobo;
  const grossMarginPerHectareKobo =
    params.areaHectares > 0 ? Math.round(grossMarginKobo / params.areaHectares) : grossMarginKobo;

  const costOfProductionPerKgKobo =
    params.totalYieldKg > 0 ? Math.round(totalDirectCostKobo / params.totalYieldKg) : 0;

  const roiPercentage =
    totalDirectCostKobo > 0
      ? Math.round(((params.revenueKobo - totalDirectCostKobo) / totalDirectCostKobo) * 1000) / 10
      : 0;

  return {
    cropId: params.cropId,
    plotId: params.plotId,
    areaHectares: params.areaHectares,
    totalYieldKg: params.totalYieldKg,
    revenueKobo: params.revenueKobo,
    directCostsKobo: directCosts,
    totalDirectCostKobo,
    grossMarginKobo,
    grossMarginPerHectareKobo,
    costOfProductionPerKgKobo,
    roiPercentage,
  };
}
