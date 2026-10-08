import { LivestockAnimalState, HealthTreatmentRecord } from './types';

export class FarmLivestockEngine {
  /**
   * Calculates Feed Conversion Ratio (FCR)
   * FCR = Total Feed Consumed (kg) / Total Liveweight Gain (kg)
   */
  public static calculateFCR(totalFeedConsumedKg: number, liveweightGainKg: number): number {
    if (liveweightGainKg <= 0) {
      return 0;
    }
    return Number((totalFeedConsumedKg / liveweightGainKg).toFixed(2));
  }

  /**
   * Calculates Average Daily Gain (ADG) in kg/day
   */
  public static calculateADG(initialWeightKg: number, finalWeightKg: number, days: number): number {
    if (days <= 0) return 0;
    const gain = finalWeightKg - initialWeightKg;
    return Number((gain / days).toFixed(3));
  }

  /**
   * Evaluates medical withdrawal clearance for food safety (meat/milk)
   */
  public static evaluateHealthWithdrawal(
    treatment: HealthTreatmentRecord,
    targetDate: Date = new Date()
  ): {
    cleared: boolean;
    withdrawalEndDate: Date;
    daysRemaining: number;
  } {
    const administered = new Date(treatment.administeredAt);
    const endDate = new Date(administered);
    endDate.setDate(endDate.getDate() + treatment.withdrawalDays);

    const diffMs = endDate.getTime() - targetDate.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      cleared: daysRemaining === 0,
      withdrawalEndDate: endDate,
      daysRemaining,
    };
  }

  /**
   * Validates if an animal is safe for sale or slaughter
   */
  public static canSellOrSlaughter(
    animal: LivestockAnimalState,
    activeTreatments: HealthTreatmentRecord[],
    checkDate: Date = new Date()
  ): {
    permitted: boolean;
    activeRestrictions: Array<{ medication: string; daysRemaining: number }>;
  } {
    if (animal.status !== 'active') {
      return {
        permitted: false,
        activeRestrictions: [{ medication: `Animal status is ${animal.status}`, daysRemaining: -1 }],
      };
    }

    const restrictions: Array<{ medication: string; daysRemaining: number }> = [];

    for (const treatment of activeTreatments) {
      const evaluation = this.evaluateHealthWithdrawal(treatment, checkDate);
      if (!evaluation.cleared) {
        restrictions.push({
          medication: treatment.medicationName,
          daysRemaining: evaluation.daysRemaining,
        });
      }
    }

    return {
      permitted: restrictions.length === 0,
      activeRestrictions: restrictions,
    };
  }
}
