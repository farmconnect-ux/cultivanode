import type { MachineryEfficiencyMetrics } from './types';

export interface MaintenanceDueCheck {
  machineryId: string;
  isDue: boolean;
  dueReason?: 'engine_hours_exceeded' | 'calendar_date_passed';
  hoursRemaining?: number;
  daysRemaining?: number;
}

export class MachineryFleetEngine {
  /**
   * Computes machinery operational efficiency and cost metrics.
   */
  static computeEfficiencyMetrics(params: {
    hoursOperated: number;
    areaCoveredHa: number;
    fuelConsumedLiters: number;
    totalCostKobo: number;
  }): MachineryEfficiencyMetrics {
    const hours = Math.max(0.1, params.hoursOperated);
    const ha = Math.max(0.01, params.areaCoveredHa);

    const fuelPerHour = Math.round((params.fuelConsumedLiters / hours) * 100) / 100;
    const fuelPerHa = Math.round((params.fuelConsumedLiters / ha) * 100) / 100;
    const costPerHour = Math.round(params.totalCostKobo / hours);
    const costPerHa = Math.round(params.totalCostKobo / ha);

    return {
      hoursOperated: params.hoursOperated,
      areaCoveredHa: params.areaCoveredHa,
      fuelConsumedLiters: params.fuelConsumedLiters,
      fuelLitersPerHour: fuelPerHour,
      fuelLitersPerHectare: fuelPerHa,
      costPerHourKobo: costPerHour,
      costPerHectareKobo: costPerHa,
    };
  }

  /**
   * Checks whether preventive or scheduled maintenance is due for a machine.
   */
  static checkMaintenanceDue(params: {
    machineryId: string;
    currentEngineHours: number;
    nextServiceDueHours?: number;
    nextServiceDueDate?: string;
    currentDate?: string;
  }): MaintenanceDueCheck {
    const today = params.currentDate ? new Date(params.currentDate) : new Date();

    // Check engine hours limit
    if (params.nextServiceDueHours !== undefined && params.nextServiceDueHours > 0) {
      const remainingHours = params.nextServiceDueHours - params.currentEngineHours;
      if (remainingHours <= 0) {
        return {
          machineryId: params.machineryId,
          isDue: true,
          dueReason: 'engine_hours_exceeded',
          hoursRemaining: remainingHours,
        };
      }
    }

    // Check calendar date limit
    if (params.nextServiceDueDate) {
      const dueDate = new Date(params.nextServiceDueDate);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        return {
          machineryId: params.machineryId,
          isDue: true,
          dueReason: 'calendar_date_passed',
          daysRemaining: diffDays,
        };
      }
    }

    return {
      machineryId: params.machineryId,
      isDue: false,
    };
  }

  /**
   * Calculates fleet utilization rate percentage.
   */
  static computeUtilizationPct(actualOperatingHours: number, availableWorkingHours: number): number {
    if (availableWorkingHours <= 0) return 0;
    return Math.min(100, Math.round((actualOperatingHours / availableWorkingHours) * 1000) / 10);
  }
}
