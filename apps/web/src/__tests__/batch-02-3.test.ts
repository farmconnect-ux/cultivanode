import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockServiceRpc = vi.fn();
const mockCreateServiceClient = vi.fn<() => unknown>(() => ({
  rpc: mockServiceRpc,
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => ({ data: null })),
      })),
    })),
  })),
}));

vi.mock('server-only', () => ({}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => mockCreateServiceClient(),
}));

function signEngineJwt(secret: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: 'user-1', iat: now, exp: now + 300, roles: ['crop_farmer'], permissions: [] }),
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

describe('Batch 02.3 API hardening: cancellation, disputes & payment webhooks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ENGINE_JWT_SECRET = 'test-engine-secret-key';
    process.env.PAYSTACK_SECRET_KEY = 'test-paystack-secret';
    process.env.FLUTTERWAVE_WEBHOOK_HASH = 'test-flw-hash';
    mockCreateServiceClient.mockImplementation(() => ({
      rpc: mockServiceRpc,
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null })),
          })),
        })),
      })),
    }));
  });

  it('/api/engines/cancellation enforces auth, Zod validation and deterministic calculation', async () => {
    const { POST } = await import('@/app/api/engines/cancellation/route');
    const token = signEngineJwt(process.env.ENGINE_JWT_SECRET!);

    expect(
      (await POST(new Request('http://localhost/api/engines/cancellation', { method: 'POST', body: '{}' }))).status,
    ).toBe(401);

    const invalid = await POST(
      new Request('http://localhost/api/engines/cancellation', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: 'b1', agreedPriceKobo: -100 }),
      }),
    );
    expect(invalid.status).toBe(400);

    const now = Date.now();
    const ok = await POST(
      new Request('http://localhost/api/engines/cancellation', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingId: 'b1',
          actor: 'farmer',
          agreedPriceKobo: 100_000,
          jobDate: '2026-12-01',
          requestTimestamp: now,
          jobStartTimestamp: now + 72 * 3600 * 1000,
          reason: 'Schedule changed',
        }),
      }),
    );
    expect(ok.status).toBe(200);
    const json = await ok.json();
    expect(json.allowed).toBe(true);
    expect(json.refundFarmerKobo).toBe(100_000);
  });

  it('/api/engines/disputes enforces auth, Zod validation and deterministic arbitration', async () => {
    const { POST } = await import('@/app/api/engines/disputes/route');
    const token = signEngineJwt(process.env.ENGINE_JWT_SECRET!);

    expect(
      (await POST(new Request('http://localhost/api/engines/disputes', { method: 'POST', body: '{}' }))).status,
    ).toBe(401);

    const bad = await POST(
      new Request('http://localhost/api/engines/disputes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disputeId: 'd1' }),
      }),
    );
    expect(bad.status).toBe(400);

    const now = Date.now();
    const ok = await POST(
      new Request('http://localhost/api/engines/disputes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          disputeId: 'd1',
          bookingId: 'b1',
          category: 'job_not_done',
          agreedPriceKobo: 50_000,
          farmLocation: { lat: 7.3775, lng: 3.947 },
          evidences: [],
          disputeOpenedAt: now,
        }),
      }),
    );
    expect(ok.status).toBe(200);
    const json = await ok.json();
    expect(json.disputeId).toBe('d1');
  });

  it('/api/webhooks/paystack rejects bad signatures, malformed JSON, and surfaces RPC errors honestly', async () => {
    const { POST } = await import('@/app/api/webhooks/paystack/route');

    const badSig = await POST(
      new Request('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': 'wrong' },
        body: '{}',
      }),
    );
    expect(badSig.status).toBe(401);

    const sign = (raw: string) =>
      createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(raw).digest('hex');

    const badJsonRaw = '{broken';
    const badJson = await POST(
      new Request('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': sign(badJsonRaw) },
        body: badJsonRaw,
      }),
    );
    expect(badJson.status).toBe(400);

    const validBody = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'PSTK_11111111-1111-4111-8111-111111111111_1',
        amount: 50_000,
        metadata: { orderId: '11111111-1111-4111-8111-111111111111' },
      },
    });
    mockServiceRpc.mockResolvedValueOnce({ error: { code: 'P0002', message: 'Order not found' } });
    const rpcFail = await POST(
      new Request('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': sign(validBody) },
        body: validBody,
      }),
    );
    expect(rpcFail.status).toBe(422);

    mockServiceRpc.mockResolvedValueOnce({ error: null });
    const ok = await POST(
      new Request('http://localhost/api/webhooks/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': sign(validBody) },
        body: validBody,
      }),
    );
    expect(ok.status).toBe(200);
  });

  it('/api/webhooks/flutterwave rejects bad signatures, malformed JSON, and surfaces RPC errors honestly', async () => {
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');

    const badSig = await POST(
      new Request('http://localhost/api/webhooks/flutterwave', {
        method: 'POST',
        headers: { 'verif-hash': 'wrong' },
        body: '{}',
      }),
    );
    expect(badSig.status).toBe(401);

    const badJson = await POST(
      new Request('http://localhost/api/webhooks/flutterwave', {
        method: 'POST',
        headers: { 'verif-hash': 'test-flw-hash' },
        body: '{broken',
      }),
    );
    expect(badJson.status).toBe(400);

    const validBody = JSON.stringify({
      event: 'charge.completed',
      data: {
        id: 9991,
        tx_ref: 'FLW_11111111-1111-4111-8111-111111111111_1',
        status: 'successful',
        amount: 500,
      },
    });
    mockServiceRpc.mockResolvedValueOnce({ error: { code: '22023', message: 'Amount mismatch' } });
    const rpcFail = await POST(
      new Request('http://localhost/api/webhooks/flutterwave', {
        method: 'POST',
        headers: { 'verif-hash': 'test-flw-hash' },
        body: validBody,
      }),
    );
    expect(rpcFail.status).toBe(422);

    mockServiceRpc.mockResolvedValueOnce({ error: null });
    const ok = await POST(
      new Request('http://localhost/api/webhooks/flutterwave', {
        method: 'POST',
        headers: { 'verif-hash': 'test-flw-hash' },
        body: validBody,
      }),
    );
    expect(ok.status).toBe(200);
  });
});
