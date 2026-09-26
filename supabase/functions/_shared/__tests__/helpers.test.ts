import { describe, expect, it } from 'vitest';
import { brand } from '../../../../packages/shared/src/brand';
import { BRAND_NAME } from '../brand.ts';
import { idFingerprint, maskId } from '../crypto.ts';
import { matchNames } from '../names.ts';
import { signWebhook, verifyWebhook } from '../webhook.ts';

const SECRET = 'v1,whsec_' + btoa('a-test-secret-of-32-bytes-length!');

describe('brand copy', () => {
  it('matches the central brand config', () => {
    expect(BRAND_NAME).toBe(brand.name);
  });
});

describe('webhook signatures (Standard Webhooks)', () => {
  const body = '{"user":{"phone":"2348031234567"},"sms":{"otp":"123456"}}';

  it('accepts a correctly signed, recent request', async () => {
    const sig = await signWebhook(SECRET, 'msg_1', '1700000000', body);
    expect(await verifyWebhook(SECRET, { id: 'msg_1', timestamp: '1700000000', signature: sig }, body, 1700000010)).toBe(true);
  });

  it('accepts one valid signature among several (key rotation)', async () => {
    const sig = await signWebhook(SECRET, 'msg_1', '1700000000', body);
    const headers = { id: 'msg_1', timestamp: '1700000000', signature: `v1,d3Jvbmc= ${sig}` };
    expect(await verifyWebhook(SECRET, headers, body, 1700000000)).toBe(true);
  });

  it('rejects a changed body', async () => {
    const sig = await signWebhook(SECRET, 'msg_1', '1700000000', body);
    const tampered = body.replace('123456', '654321');
    expect(await verifyWebhook(SECRET, { id: 'msg_1', timestamp: '1700000000', signature: sig }, tampered, 1700000000)).toBe(false);
  });

  it('rejects an old request (replay)', async () => {
    const sig = await signWebhook(SECRET, 'msg_1', '1700000000', body);
    expect(await verifyWebhook(SECRET, { id: 'msg_1', timestamp: '1700000000', signature: sig }, body, 1700000000 + 600)).toBe(false);
  });

  it('rejects when the secret is missing or wrong', async () => {
    const sig = await signWebhook(SECRET, 'msg_1', '1700000000', body);
    const headers = { id: 'msg_1', timestamp: '1700000000', signature: sig };
    expect(await verifyWebhook('', headers, body, 1700000000)).toBe(false);
    expect(await verifyWebhook('v1,whsec_' + btoa('another-secret'), headers, body, 1700000000)).toBe(false);
  });
});

describe('matchNames', () => {
  it('passes the same name in a different order with a middle name', () => {
    expect(matchNames('Adebayo Oluwaseun', 'OLUWASEUN KAYODE ADEBAYO').passed).toBe(true);
  });
  it('ignores tone marks and forgives one typo in a long name', () => {
    // "Adebayo Olusegun" written with Yoruba tone marks and under-dots
    const accented = String.fromCodePoint(65, 100, 0xe9, 98, 0xe1, 121, 0x1ecd, 0x300, 32, 79, 108, 117, 0x1e63, 0x1eb9, 103, 117, 110);
    expect(matchNames(accented, 'ADEBAYO OLUSEGUN').passed).toBe(true);
    expect(matchNames('Chukwuemeka Obi', 'CHUKWUEMEKA OBI').score).toBe(1);
    expect(matchNames('Chukwuemeka Nwosu', 'CHUKUEMEKA NWOSU').passed).toBe(true);
  });
  it('fails when only one of several names matches', () => {
    expect(matchNames('Tolu Adeyemi', 'TOLU BELLO').passed).toBe(false);
  });
  it('fails for a completely different person', () => {
    const m = matchNames('Ngozi Eze', 'MUSA ABUBAKAR');
    expect(m.passed).toBe(false);
    expect(m.score).toBe(0);
  });
  it('does not allow typos in short names', () => {
    expect(matchNames('Ade Obi', 'ADA OBI').passed).toBe(false);
  });
});

describe('ID fingerprints and masking', () => {
  it('masks all but the last four digits', () => {
    expect(maskId('12345678901')).toBe('*******8901');
    expect(maskId('0123456789')).toBe('******6789');
  });
  it('gives the same fingerprint for the same ID and a different one per kind or pepper', async () => {
    const a = await idFingerprint('pepper', 'nin', '12345678901');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await idFingerprint('pepper', 'nin', '1234 5678 901')).toBe(a);
    expect(await idFingerprint('pepper', 'bvn', '12345678901')).not.toBe(a);
    expect(await idFingerprint('other', 'nin', '12345678901')).not.toBe(a);
  });
});
