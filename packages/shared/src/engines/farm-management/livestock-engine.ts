import type {
  AnimalType,
  WithdrawalSafetyCheck,
} from './types';

export const GESTATION_DAYS_BY_SPECIES: Record<AnimalType, number> = {
  cattle: 283,
  goat: 150,
  sheep: 147,
  pig: 114,
  rabbit: 31,
  poultry: 21, // Incubation
  fish: 0,
  snail: 28,
  other: 100,
};

export class LivestockAnalyticsEngine {
  /**
   * Computes Feed Conversion Ratio (FCR).
   * Lower FCR indicates higher feed efficiency.
   * Standard broiler target: ~1.6 - 1.8.
   * Standard pig target: ~2.8 - 3.2.
   */
  static computeFeedConversionRatio(totalFeedConsumedKg: number, totalWeightGainKg: number): number {
    if (totalWeightGainKg <= 0 || totalFeedConsumedKg <= 0) {
      return 0;
    }
    return Math.round((totalFeedConsumedKg / totalWeightGainKg) * 100) / 100;
  }

  /**
   * Calculates flock/herd mortality percentage over a given period.
   */
  static computeMortalityRate(initialCount: number, mortalityCount: number): {
    ratePct: number;
    severity: 'normal' | 'warning' | 'critical';
  } {
    if (initialCount <= 0) {
      return { ratePct: 0, severity: 'normal' };
    }
    const ratePct = Math.round((mortalityCount / initialCount) * 1000) / 10;
    let severity: 'normal' | 'warning' | 'critical' = 'normal';

    if (ratePct > 5.0) {
      severity = 'critical';
    } else if (ratePct > 2.5) {
      severity = 'warning';
    }

    return { ratePct, severity };
  }

  /**
   * Verifies food safety withdrawal periods for livestock treatments or vaccinations.
   * Ensures meat, eggs, or milk are not harvested before the drug has metabolized.
   */
  static verifyWithdrawalPeriod(
    administeredOn: string,
    withdrawalDays: number,
    medicationName: string,
    currentDate: string = new Date().toISOString().slice(0, 10)
  ): WithdrawalSafetyCheck {
    const adminDate = new Date(administeredOn);
    const endDate = new Date(adminDate);
    endDate.setDate(endDate.getDate() + withdrawalDays);
    const endDateStr = endDate.toISOString().slice(0, 10);

    const curr = new Date(currentDate);
    const diffMs = endDate.getTime() - curr.getTime();
    const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      medicationName,
      administeredOn,
      withdrawalDays,
      withdrawalEndDate: endDateStr,
      isSafeForHarvestOrConsumption: remainingDays === 0,
      remainingDays,
    };
  }

  /**
   * Calculates expected birth date from service/mating date based on species gestation.
   */
  static estimateBirthDate(species: AnimalType, serviceDate: string): string {
    const gestationDays = GESTATION_DAYS_BY_SPECIES[species] ?? 100;
    const date = new Date(serviceDate);
    date.setDate(date.getDate() + gestationDays);
    return date.toISOString().slice(0, 10);
  }
}
