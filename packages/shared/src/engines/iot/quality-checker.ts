// =============================================================================
// CultivaNode Farm Intelligence: Telemetry Quality & Anomaly Checker
// =============================================================================

import type { SensorChannel, TelemetryQualityFlag } from './types';

export interface QualityCheckResult {
  flag: TelemetryQualityFlag;
  calibratedValue: number;
  reason?: string;
  isAcceptableForRollup: boolean;
}

/**
 * Checks raw sensor reading against channel physical constraints,
 * probe electrical faults, and rate-of-change anomalies.
 */
export function checkReadingQuality(
  rawValue: number,
  unit: string,
  channel: SensorChannel,
  lastReadingValue?: number
): QualityCheckResult {
  // 1. Hardware Fault / Disconnect detection
  if (
    Number.isNaN(rawValue) ||
    !Number.isFinite(rawValue) ||
    rawValue === -999 ||
    rawValue === -9999 ||
    rawValue === 9999
  ) {
    return {
      flag: 'hardware_fault',
      calibratedValue: rawValue,
      reason: 'Sensor returned hardware fault code or open circuit float value.',
      isAcceptableForRollup: false,
    };
  }

  // 2. Unit mismatch check
  if (unit.trim().toLowerCase() !== channel.unit.trim().toLowerCase()) {
    if (channel.unit === '°C' && (unit === '°F' || unit === 'F')) {
      const converted = ((rawValue - 32) * 5) / 9;
      return checkReadingQuality(converted, '°C', channel, lastReadingValue);
    }

    return {
      flag: 'out_of_range',
      calibratedValue: rawValue,
      reason: `Expected unit '${channel.unit}', received '${unit}'`,
      isAcceptableForRollup: false,
    };
  }

  // 3. Physical sensor boundary check
  if (rawValue < channel.minValidValue || rawValue > channel.maxValidValue) {
    return {
      flag: 'out_of_range',
      calibratedValue: rawValue,
      reason: `Value ${rawValue} outside physics limits [${channel.minValidValue}, ${channel.maxValidValue}] for channel ${channel.channelCode}`,
      isAcceptableForRollup: false,
    };
  }

  // 4. Rate-of-change / Spike anomaly check
  if (lastReadingValue !== undefined && !Number.isNaN(lastReadingValue)) {
    const delta = Math.abs(rawValue - lastReadingValue);

    // Soil moisture cannot physically change > 30% in a single 15-minute interval
    if (channel.channelCode.includes('moisture') && delta > 30.0) {
      return {
        flag: 'suspicious',
        calibratedValue: rawValue,
        reason: `Rapid soil moisture delta (${delta}%) exceeds maximum natural hydraulic infiltration rate.`,
        isAcceptableForRollup: true,
      };
    }

    // Air temperature delta > 15°C in single reading is flagged
    if (channel.channelCode.includes('temp') && delta > 15.0) {
      return {
        flag: 'suspicious',
        calibratedValue: rawValue,
        reason: `Temperature jump of ${delta}°C in single sample flagged as abnormal thermal transient.`,
        isAcceptableForRollup: true,
      };
    }
  }

  // 5. Valid reading passed all quality gates
  return {
    flag: 'valid',
    calibratedValue: rawValue,
    isAcceptableForRollup: true,
  };
}
