import { MachineryAssetState } from './types';

export class FarmMachineryEngine {
  /**
   * Calculates total direct operating cost for a machinery operation session
   */
  public static calculateOperationCost(params: {
    operatingHours: number;
    fuelUsedLitres: number;
    fuelCostPerLitreMinor: number;
    operatorHourlyRateMinor: number;
    hourlyDepreciationCostMinor?: number;
  }): {
    fuelCostMinor: number;
    operatorCostMinor: number;
    depreciationCostMinor: number;
    totalOperationCostMinor: number;
    effectiveHourlyCostMinor: number;
  } {
    const {
      operatingHours,
      fuelUsedLitres,
      fuelCostPerLitreMinor,
      operatorHourlyRateMinor,
      hourlyDepreciationCostMinor = 0,
    } = params;

    const fuelCostMinor = Math.round(fuelUsedLitres * fuelCostPerLitreMinor);
    const operatorCostMinor = Math.round(operatingHours * operatorHourlyRateMinor);
    const depreciationCostMinor = Math.round(operatingHours * hourlyDepreciationCostMinor);
    const totalOperationCostMinor = fuelCostMinor + operatorCostMinor + depreciationCostMinor;

    const effectiveHourlyCostMinor = operatingHours > 0
      ? Math.round(totalOperationCostMinor / operatingHours)
      : totalOperationCostMinor;

    return {
      fuelCostMinor,
      operatorCostMinor,
      depreciationCostMinor,
      totalOperationCostMinor,
      effectiveHourlyCostMinor,
    };
  }

  /**
   * Evaluates maintenance alerts based on engine hours
   */
  public static evaluateMaintenanceStatus(
    machine: MachineryAssetState,
    warningLeadHours: number = 20
  ): {
    serviceDue: boolean;
    serviceOverdue: boolean;
    hoursUntilService: number | null;
  } {
    if (machine.nextServiceHours === undefined || machine.nextServiceHours === null) {
      return { serviceDue: false, serviceOverdue: false, hoursUntilService: null };
    }

    const hoursUntilService = machine.nextServiceHours - machine.totalOperatingHours;
    const serviceOverdue = hoursUntilService <= 0;
    const serviceDue = hoursUntilService <= warningLeadHours;

    return {
      serviceDue,
      serviceOverdue,
      hoursUntilService,
    };
  }
}
