// =============================================================================
// CultivaNode Farm Intelligence: Telemetry Quality & Anomaly Checker
// =============================================================================

import { SensorChannel, TelemetryQualityFlag } from '../types/iot.js';

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
  // Standard agricultural sensor ADC faults: -999, 9999, NaN, or electrical open circuit
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
      isAcceptableForRollup: false
    };
  }

  // 2. Unit mismatch check
  if (unit.trim().toLowerCase() !== channel.unit.trim().toLowerCase()) {
    // Provide unit conversion if standard (e.g. Fahrenheit to Celsius)
    if (channel.unit === '°C' && (unit === '°F' || unit === 'F')) {
      const converted = ((rawValue - 32) * 5) / 9;
      return checkReadingQuality(converted, '°C', channel, lastReadingValue);
    }

    return {
      flag: 'out_of_range',
      calibratedValue: rawValue,
      reason: `Expected unit '${channel.unit}', received '${unit}'`,
      isAcceptableForRollup: false
    };
  }

  // 3. Physical sensor boundary check
  if (rawValue < channel.minValidValue || rawValue > channel.maxValidValue) {
    return {
      flag: 'out_of_range',
      calibratedValue: rawValue,
      reason: `Value ${rawValue} is outside valid sensor range [${channel.minValidValue}, ${channel.maxValidValue}] ${channel.unit}`,
      isAcceptableForRollup: false
    };
  }

  // Round according to channel precision
  const factor = Math.pow(10, channel.precisionDecimals);
  const calibratedValue = Math.round(rawValue * factor) / factor;

  // 4. Rate of change / Spike anomaly detection (Suspicious flag)
  if (lastReadingValue !== undefined && !Number.isNaN(lastReadingValue)) {
    const delta = Math.abs(calibratedValue - lastReadingValue);

    // Soil moisture cannot physically change by > 30% in a single telemetry cycle
    if (channel.channelCode === 'soil_moisture_pct' && delta > 30.0) {
      return {
        flag: 'suspicious',
        calibratedValue,
        reason: `Abrupt moisture jump of ${delta}% detected without verified saturation event.`,
        isAcceptableForRollup: true // Rollups can still log with suspicious flag
      };
    }

    // Air temperature jumping > 15°C within 15 minutes
    if (channel.channelCode === 'air_temperature_c' && delta > 15.0) {
      return {
        flag: 'suspicious',
        calibratedValue,
        reason: `Abrupt temperature delta of ${delta}°C in short interval.`,
        isAcceptableForRollup: true
      };
    }
  }

  return {
    flag: 'valid',
    calibratedValue,
    isAcceptableForRollup: true
  };
}
