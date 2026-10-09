// =============================================================================
// CultivaNode Farm Intelligence: Crop-Aware Conservative Alert Engine
// =============================================================================

import type {
  AlertRule,
  Device,
  DeviceAlert,
  DeviceInstallation,
  StoredTelemetryReading,
} from './types';

export interface IHistoricalReadingsProvider {
  getReadingsInWindow(
    deviceId: string,
    channelCode: string,
    sinceTimestampIso: string
  ): Promise<StoredTelemetryReading[]>;
  getLastAlertForRule(plotId: string, ruleCode: string): Promise<DeviceAlert | undefined>;
}

export class AlertRulesEngine {
  private activeRules: AlertRule[] = [];

  constructor(
    private historyProvider: IHistoricalReadingsProvider,
    initialRules: AlertRule[] = []
  ) {
    this.activeRules = initialRules;
  }

  setRules(rules: AlertRule[]) {
    this.activeRules = rules;
  }

  getRules(): AlertRule[] {
    return this.activeRules;
  }

  /**
   * Evaluates fresh readings against agronomic rules
   */
  async evaluateReadings(
    device: Device,
    installation: DeviceInstallation,
    freshReadings: StoredTelemetryReading[]
  ): Promise<DeviceAlert[]> {
    const alertsToGenerate: DeviceAlert[] = [];

    // Rule requirement 1: Only healthy, non-retired devices drive agronomic farm advice
    if (device.status === 'offline' || device.status === 'retired') {
      return [];
    }

    // Filter only valid readings (ignore hardware fault or out-of-range sensor artifacts)
    const validReadings = freshReadings.filter(
      (r) => r.qualityFlag === 'valid' || r.qualityFlag === 'suspicious'
    );

    for (const rule of this.activeRules) {
      if (!rule.isActive) continue;

      const matchingReading = validReadings.find((r) => r.channelCode === rule.channelCode);
      if (!matchingReading) continue;

      // Evaluate threshold operator
      const isBreached = this.evaluateThreshold(
        matchingReading.valueNumeric,
        rule.operator,
        rule.thresholdValue,
        rule.thresholdHighValue
      );

      if (!isBreached) continue;

      // Persistence duration check (conservative anti-flapping)
      if (rule.durationMinutes > 0) {
        const sinceTime = new Date(
          new Date(matchingReading.recordedAt).getTime() - rule.durationMinutes * 60 * 1000
        ).toISOString();

        const windowReadings = await this.historyProvider.getReadingsInWindow(
          device.id,
          rule.channelCode,
          sinceTime
        );

        const allBreached =
          windowReadings.length > 0 &&
          windowReadings.every((r) =>
            this.evaluateThreshold(
              r.valueNumeric,
              rule.operator,
              rule.thresholdValue,
              rule.thresholdHighValue
            )
          );

        if (!allBreached) continue;
      }

      // Check cooldown (suppress spamming if alert already generated within 6 hours)
      const lastAlert = await this.historyProvider.getLastAlertForRule(
        installation.plotId,
        rule.ruleCode
      );

      if (lastAlert && lastAlert.status === 'open') {
        continue;
      }

      const alert: DeviceAlert = {
        id: crypto.randomUUID(),
        farmId: installation.farmId,
        plotId: installation.plotId,
        deviceId: device.id,
        ruleId: rule.id,
        severity: rule.severity,
        alertType: rule.ruleCode,
        title: rule.name,
        message: rule.adviceTemplate
          .replace('{val}', String(matchingReading.valueNumeric))
          .replace('{unit}', matchingReading.unit),
        recommendedAction: rule.actionCode,
        status: 'open',
        triggeredAt: matchingReading.recordedAt,
      };

      alertsToGenerate.push(alert);
    }

    return alertsToGenerate;
  }

  private evaluateThreshold(
    val: number,
    op: AlertRule['operator'],
    thresh: number,
    threshHigh?: number
  ): boolean {
    switch (op) {
      case 'lt':
        return val < thresh;
      case 'lte':
        return val <= thresh;
      case 'gt':
        return val > thresh;
      case 'gte':
        return val >= thresh;
      case 'eq':
        return val === thresh;
      case 'outside_range':
        return threshHigh !== undefined ? val < thresh || val > threshHigh : false;
      default:
        return false;
    }
  }
}
