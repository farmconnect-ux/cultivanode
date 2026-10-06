import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt, decodeJwt } from './jwt';

describe('Stateless JWT Engine', () => {
  const secret = 'super-secret-test-key-cultivanode-2026';

  it('signs and verifies a valid JWT payload', async () => {
    const payload = {
      sub: 'user_123',
      roles: ['crop_farmer'],
      tier: 2,
      orgId: 'org_abc',
      permissions: ['bookings.create', 'farms.manage'],
    };

    const token = await signJwt(payload, secret);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const result = await verifyJwt(token, secret);
    expect(result.valid).toBe(true);
    expect(result.payload?.sub).toBe('user_123');
    expect(result.payload?.tier).toBe(2);
    expect(result.payload?.roles).toEqual(['crop_farmer']);
    expect(result.payload?.permissions).toContain('bookings.create');
  });

  it('fails verification with an incorrect secret', async () => {
    const token = await signJwt({ sub: 'user_123' }, secret);
    const result = await verifyJwt(token, 'wrong-secret-key');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_signature');
  });

  it('detects an expired token', async () => {
    const token = await signJwt({ sub: 'user_123', expiresInSeconds: -10 }, secret);
    const result = await verifyJwt(token, secret);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('expired');
  });

  it('safely decodes a token payload without verifying', async () => {
    const token = await signJwt({ sub: 'farmer_quadri', tier: 1 }, secret);
    const decoded = decodeJwt(token);
    expect(decoded?.sub).toBe('farmer_quadri');
    expect(decoded?.tier).toBe(1);
  });

  it('gracefully handles malformed token strings', async () => {
    const result = await verifyJwt('invalid.token', secret);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('malformed');

    expect(decodeJwt('not.a.jwt')).toBe(null);
  });
});
