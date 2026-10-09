// =============================================================================
// CultivaNode Farm Intelligence: Packet & Security Validation
// =============================================================================

import { Device } from '../types/iot.js';

export interface ValidationResult {
  isValid: boolean;
  isDuplicate: boolean;
  errorCode?: string;
  errorMessage?: string;
}

// Configurable timestamp skew tolerance (default: 15 minutes = 900,000 ms)
export const DEFAULT_MAX_TIMESTAMP_SKEW_MS = 15 * 60 * 1000;

/**
 * Validates timestamp skew against current server time
 */
export function validateTimestampSkew(
  sourceTimestampIso: string,
  nowMs: number = Date.now(),
  maxSkewMs: number = DEFAULT_MAX_TIMESTAMP_SKEW_MS
): ValidationResult {
  const sourceMs = new Date(sourceTimestampIso).getTime();

  if (isNaN(sourceMs)) {
    return {
      isValid: false,
      isDuplicate: false,
      errorCode: 'INVALID_TIMESTAMP_FORMAT',
      errorMessage: `Malformed source timestamp: ${sourceTimestampIso}`
    };
  }

  const deltaMs = Math.abs(nowMs - sourceMs);

  if (deltaMs > maxSkewMs) {
    const skewMinutes = Math.round(deltaMs / 60000);
    return {
      isValid: false,
      isDuplicate: false,
      errorCode: 'TIMESTAMP_SKEW_EXCEEDED',
      errorMessage: `Timestamp skew of ${skewMinutes} minutes exceeds allowed tolerance of ${Math.round(maxSkewMs / 60000)} minutes.`
    };
  }

  return { isValid: true, isDuplicate: false };
}

/**
 * Checks sequence counter for anti-replay attack protection and duplicate handling
 */
export function validateSequenceNumber(
  packetSeq: number,
  lastRecordedSeq: number
): ValidationResult {
  if (typeof packetSeq !== 'number' || packetSeq < 0) {
    return {
      isValid: false,
      isDuplicate: false,
      errorCode: 'MALFORMED_SEQUENCE_NUMBER',
      errorMessage: `Invalid sequence counter: ${packetSeq}`
    };
  }

  // Exact duplicate packet (e.g. cellular TCP retry or LoRaWAN gateway duplicate)
  if (packetSeq === lastRecordedSeq) {
    return {
      isValid: false,
      isDuplicate: true,
      errorCode: 'DUPLICATE_SEQUENCE_NUMBER',
      errorMessage: `Sequence ${packetSeq} already processed. Dropping duplicate idempotently.`
    };
  }

  // Replay of older packet or out-of-order packet
  if (packetSeq < lastRecordedSeq) {
    return {
      isValid: false,
      isDuplicate: false,
      errorCode: 'REPLAYED_SEQUENCE_NUMBER',
      errorMessage: `Received sequence ${packetSeq} is older than last recorded sequence ${lastRecordedSeq}. Potential replay attack.`
    };
  }

  return { isValid: true, isDuplicate: false };
}

/**
 * Validates that the device is active and not revoked or retired
 */
export function validateDeviceOperationalStatus(device: Device): ValidationResult {
  if (device.revokedAt) {
    return {
      isValid: false,
      isDuplicate: false,
      errorCode: 'DEVICE_REVOKED',
      errorMessage: `Device ${device.serialNumber} credentials have been revoked.`
    };
  }

  if (device.status === 'retired') {
    return {
      isValid: false,
      isDuplicate: false,
      errorCode: 'DEVICE_RETIRED',
      errorMessage: `Device ${device.serialNumber} is permanently retired.`
    };
  }

  if (device.status === 'maintenance') {
    return {
      isValid: false,
      isDuplicate: false,
      errorCode: 'DEVICE_IN_MAINTENANCE',
      errorMessage: `Device ${device.serialNumber} is marked in maintenance. Telemetry rejected.`
    };
  }

  return { isValid: true, isDuplicate: false };
}
