// =============================================================================
// Unit Tests: Cryptography & Security Helpers
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert';
import {
  hashToken,
  computeHmacSha256,
  timingSafeCompare,
  verifySignature
} from '../src/security/crypto.js';

test('Security: hashToken produces deterministic sha256 hex', () => {
  const hash1 = hashToken('secret-key-abc');
  const hash2 = hashToken('secret-key-abc');
  const hashDifferent = hashToken('secret-key-xyz');

  assert.strictEqual(hash1, hash2);
  assert.notStrictEqual(hash1, hashDifferent);
  assert.strictEqual(hash1.length, 64);
});

test('Security: timingSafeCompare matches equal strings safely', () => {
  const str1 = '4f8b9a2c3d4e5f607182';
  const str2 = '4f8b9a2c3d4e5f607182';
  const str3 = '4f8b9a2c3d4e5f607183';

  assert.strictEqual(timingSafeCompare(str1, str2), true);
  assert.strictEqual(timingSafeCompare(str1, str3), false);
  assert.strictEqual(timingSafeCompare(str1, 'short'), false);
  assert.strictEqual(timingSafeCompare('', ''), false);
});

test('Security: verifySignature validates authentic HMAC-SHA256 signatures', () => {
  const payload = JSON.stringify({ deviceSerial: 'CN-001', seq: 42 });
  const secretKey = 'super-secret-pre-shared-key';

  const validSig = computeHmacSha256(payload, secretKey);
  assert.strictEqual(verifySignature(payload, validSig, secretKey), true);

  // Tampered payload
  const tamperedPayload = JSON.stringify({ deviceSerial: 'CN-001', seq: 43 });
  assert.strictEqual(verifySignature(tamperedPayload, validSig, secretKey), false);

  // Wrong secret
  assert.strictEqual(verifySignature(payload, validSig, 'wrong-key'), false);
});
