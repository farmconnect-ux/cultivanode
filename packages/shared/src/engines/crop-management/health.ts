import type {
  CropHealthStatus,
  CropObservation,
  CropCycleOperation,
  CropAlert,
} from './types';

export interface HealthAssessmentInput {
  operations: Pick<CropCycleOperation, 'status' | 'scheduledEndDate'>[];
  observations: Pick<CropObservation, 'resolved' | 'severity' | 'category' | 'description'>[];
  alerts: Pick<CropAlert, 'isDismissed' | 'severity' | 'title'>[];
  asOfDate?: string; // YYYY-MM-DD
}

export interface HealthFactor {
  code: string;
  message: string;
  deduction: number;
}

export interface HealthAssessmentResult {
  score: number;
  status: CropHealthStatus;
  factors: HealthFactor[];
}

/**
 * Deterministically computes crop health index H in [0.00, 1.00] based on
 * unresolved scouting issues, overdue field operations, and environmental alerts.
 */
export function calculateCropHealthScore(input: HealthAssessmentInput): HealthAssessmentResult {
  const currentDate = input.asOfDate ?? new Date().toISOString().split('T')[0]!;
  let totalDeduction = 0;
  const factors: HealthFactor[] = [];

  // 1. Overdue Operations
  const overdueOps = input.operations.filter(
    (op) =>
      op.status === 'pending' &&
      op.scheduledEndDate < currentDate
  );

  if (overdueOps.length > 0) {
    const deduction = Math.min(0.20, overdueOps.length * 0.05);
    totalDeduction += deduction;
    factors.push({
      code: 'OVERDUE_OPERATIONS',
      message: `${overdueOps.length} field operation(s) are overdue`,
      deduction,
    });
  }

  // 2. Unresolved Scouting Observations
  const unresolvedObs = input.observations.filter((obs) => !obs.resolved);
  for (const obs of unresolvedObs) {
    let deduction = 0;
    switch (obs.severity) {
      case 'severe':
        deduction = 0.25;
        break;
      case 'high':
        deduction = 0.15;
        break;
      case 'medium':
        deduction = 0.08;
        break;
      case 'low':
        deduction = 0.02;
        break;
    }
    totalDeduction += deduction;
    factors.push({
      code: `SCOUTING_${obs.severity.toUpperCase()}`,
      message: `Unresolved ${obs.category} (${obs.severity}): ${obs.description.slice(0, 60)}`,
      deduction,
    });
  }

  // 3. Active Environmental / Biosecurity Alerts
  const activeAlerts = input.alerts.filter((a) => !a.isDismissed);
  for (const alert of activeAlerts) {
    const deduction = alert.severity === 'critical' ? 0.15 : alert.severity === 'warning' ? 0.05 : 0;
    if (deduction > 0) {
      totalDeduction += deduction;
      factors.push({
        code: `ALERT_${alert.severity.toUpperCase()}`,
        message: alert.title,
        deduction,
      });
    }
  }

  const rawScore = Math.max(0.0, 1.0 - totalDeduction);
  const score = Math.round(rawScore * 100) / 100;

  let status: CropHealthStatus = 'excellent';
  if (score >= 0.85) {
    status = 'excellent';
  } else if (score >= 0.70) {
    status = 'good';
  } else if (score >= 0.50) {
    status = 'watch';
  } else {
    status = 'critical';
  }

  return {
    score,
    status,
    factors,
  };
}
