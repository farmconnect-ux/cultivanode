// =============================================================================
// Unit Tests: Packet & Security Validation
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert';
import {
  validateTimestampSkew,
  validateSequenceNumber,
  validateDeviceOperationalStatus
} from '../src/security/validation.js';
import { Device } from '../src/types/iot.js';

test('Validation: validateTimestampSkew accepts timestamps within 15 minutes', () => {
  const now = Date.now();

  // 2 minutes in past
  const past2m = new Date(now - 2 * 60000).toISOString();
  const resPast = validateTimestampSkew(past2m, now);
  assert.strictEqual(resPast.isValid, true);

  // 2 minutes in future (clock jitter tolerance)
  const future2m = new Date(now + 2 * 60000).toISOString();
  const resFuture = validateTimestampSkew(future2m, now);
  assert.strictEqual(resFuture.isValid, true);
});

test('Validation: validateTimestampSkew rejects skewed timestamps (> 15 mins)', () => {
  const now = Date.now();

  // 30 minutes in past
  const past30m = new Date(now - 30 * 60000).toISOString();
  const resPast = validateTimestampSkew(past30m, now);
  assert.strictEqual(resPast.isValid, false);
  assert.strictEqual(resPast.errorCode, 'TIMESTAMP_SKEW_EXCEEDED');

  // 2 hours in future
  const future2h = new Date(now + 2 * 3600000).toISOString();
  const resFuture = validateTimestampSkew(future2h, now);
  assert.strictEqual(resFuture.isValid, false);
  assert.strictEqual(resFuture.errorCode, 'TIMESTAMP_SKEW_EXCEEDED');

  // Malformed timestamp
  const malformed = validateTimestampSkew('not-a-valid-date', now);
  assert.strictEqual(malformed.isValid, false);
  assert.strictEqual(malformed.errorCode, 'INVALID_TIMESTAMP_FORMAT');
});

test('Validation: validateSequenceNumber prevents replay attacks and handles duplicates idempotently', () => {
  const lastRecordedSeq = 50;

  // Normal increment
  const seq51 = validateSequenceNumber(51, lastRecordedSeq);
  assert.strictEqual(seq51.isValid, true);
  assert.strictEqual(seq51.isDuplicate, false);

  // Exact duplicate (retransmission)
  const seq50 = validateSequenceNumber(50, lastRecordedSeq);
  assert.strictEqual(seq50.isValid, false);
  assert.strictEqual(seq50.isDuplicate, true);
  assert.strictEqual(seq50.errorCode, 'DUPLICATE_SEQUENCE_NUMBER');

  // Replay attack (older sequence)
  const seq40 = validateSequenceNumber(40, lastRecordedSeq);
  assert.strictEqual(seq40.isValid, false);
  assert.strictEqual(seq40.isDuplicate, false);
  assert.strictEqual(seq40.errorCode, 'REPLAYED_SEQUENCE_NUMBER');
});

test('Validation: validateDeviceOperationalStatus enforces status lifecycle and revocations', () => {
  const activeDevice: Device = {
    id: 'd1',
    serialNumber: 'CN-001',
    modelId: 'm1',
    status: 'active',
    firmwareVersion: '1.0.0',
    lastTelemetrySeq: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  assert.strictEqual(validateDeviceOperationalStatus(activeDevice).isValid, true);

  // Revoked credentials
  const revokedDevice: Device = {
    ...activeDevice,
    revokedAt: new Date().toISOString()
  };
  const resRevoked = validateDeviceOperationalStatus(revokedDevice);
  assert.strictEqual(resRevoked.isValid, false);
  assert.strictEqual(resRevoked.errorCode, 'DEVICE_REVOKED');

  // Retired status
  const retiredDevice: Device = {
    ...activeDevice,
    status: 'retired'
  };
  const resRetired = validateDeviceOperationalStatus(retiredDevice);
  assert.strictEqual(resRetired.isValid, false);
  assert.strictEqual(resRetired.errorCode, 'DEVICE_RETIRED');
});
