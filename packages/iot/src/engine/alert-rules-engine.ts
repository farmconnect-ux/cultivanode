// =============================================================================
// CultivaNode Farm Intelligence: Crop-Aware Conservative Alert Engine
// =============================================================================

import {
  AlertRule,
  Device,
  DeviceAlert,
  DeviceInstallation,
  StoredTelemetryReading
} from '../types/iot.js';

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
    const validReadings = freshReadings.filter(r => r.qualityFlag === 'valid' || r.qualityFlag === 'suspicious');

    for (const rule of this.activeRules) {
      if (!rule.isActive) continue;

      // Match channel
      const matchingReading = validReadings.find(r => r.channelCode === rule.channelCode);
      if (!matchingReading) continue;

      // Check crop applicability if specified
      // For instance, a tomato flowering rule only matches if the installation has crop = tomato
      const plotCrop = installation.siteSurvey?.cropType as string | undefined;
      if (rule.cropType && plotCrop && rule.cropType.toLowerCase() !== plotCrop.toLowerCase()) {
        continue;
      }

      // Check Cooldown: Has an alert already fired within the cooldown period?
      const lastAlert = await this.historyProvider.getLastAlertForRule(
        installation.plotId,
        rule.ruleCode
      );

      if (lastAlert) {
        const lastAlertTime = new Date(lastAlert.triggeredAt).getTime();
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        const nowMs = new Date(matchingReading.sourceTimestamp).getTime();

        if (nowMs - lastAlertTime < cooldownMs) {
          // Still in cooldown period, suppress notification
          continue;
        }

        // Hysteresis Check: If previous alert was open, ensure condition has fully crossed hysteresis
        if (lastAlert.status === 'open') {
          if (rule.operator === 'sustained_below' || rule.operator === '<') {
            const recoveryThreshold = rule.thresholdValue + rule.hysteresisDelta;
            if (matchingReading.calibratedValue < recoveryThreshold) {
              // Still depressed, avoid spamming duplicate alert
              continue;
            }
          }
        }
      }

      // Evaluate Sustained Condition
      const isConditionMet = await this.checkRuleCondition(
        rule,
        device.id,
        matchingReading
      );

      if (isConditionMet) {
        const observationText = rule.observationTemplate
          .replace('{threshold}', String(rule.thresholdValue))
          .replace('{value}', String(matchingReading.calibratedValue))
          .replace('{duration}', String(Math.round(rule.sustainedDurationMinutes / 60)));

        const actionText = rule.suggestedAction.replace('{plot_name}', `Plot ${installation.plotId.slice(0, 4)}`);

        const newAlert: DeviceAlert = {
          id: crypto.randomUUID(),
          farmId: installation.farmId,
          plotId: installation.plotId,
          deviceId: device.id,
          ruleId: rule.id,
          channelCode: rule.channelCode,
          observation: observationText,
          confidence: 0.95,
          suggestedAction: actionText,
          source: 'sensor reading',
          severity: rule.severity,
          status: 'open',
          triggeredAt: matchingReading.sourceTimestamp,
          cooldownUntil: new Date(
            new Date(matchingReading.sourceTimestamp).getTime() + rule.cooldownMinutes * 60000
          ).toISOString(),
          metadata: {
            ruleCode: rule.ruleCode,
            triggerValue: matchingReading.calibratedValue,
            thresholdValue: rule.thresholdValue,
            sustainedDurationMinutes: rule.sustainedDurationMinutes
          }
        };

        alertsToGenerate.push(newAlert);
      }
    }

    return alertsToGenerate;
  }

  /**
   * Validates whether condition has been sustained over required time window
   */
  private async checkRuleCondition(
    rule: AlertRule,
    deviceId: string,
    currentReading: StoredTelemetryReading
  ): Promise<boolean> {
    const val = currentReading.calibratedValue;

    // Instant checks (duration = 0)
    if (rule.sustainedDurationMinutes === 0) {
      if (rule.operator === '<') return val < rule.thresholdValue;
      if (rule.operator === '<=') return val <= rule.thresholdValue;
      if (rule.operator === '>') return val > rule.thresholdValue;
      if (rule.operator === '>=') return val >= rule.thresholdValue;
      return false;
    }

    // Sustained checks
    const windowStartMs =
      new Date(currentReading.sourceTimestamp).getTime() -
      rule.sustainedDurationMinutes * 60 * 1000;
    const sinceTimestampIso = new Date(windowStartMs).toISOString();

    const historicalReadings = await this.historyProvider.getReadingsInWindow(
      deviceId,
      rule.channelCode,
      sinceTimestampIso
    );

    // Append current reading
    const allReadings = [...historicalReadings, currentReading];

    // Must have enough historical density over the window (at least 2 samples spanning near the window start)
    if (allReadings.length < 2) {
      // Conservative: Not enough temporal proof of sustained condition yet
      return false;
    }

    const earliestSample = allReadings[0];
    const spanMinutes =
      (new Date(currentReading.sourceTimestamp).getTime() -
        new Date(earliestSample.sourceTimestamp).getTime()) /
      60000;

    // Check if temporal span covers at least 80% of required sustained duration
    if (spanMinutes < rule.sustainedDurationMinutes * 0.8) {
      return false;
    }

    if (rule.operator === 'sustained_below') {
      // All valid samples in the window must be below threshold
      return allReadings.every(r => r.calibratedValue < rule.thresholdValue);
    }

    if (rule.operator === 'sustained_above') {
      return allReadings.every(r => r.calibratedValue > rule.thresholdValue);
    }

    return false;
  }
}
