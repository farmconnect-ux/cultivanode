import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockServiceRpc = vi.fn();
const mockLookupMaybeSingle = vi.fn();
const mockCreateServiceClient = vi.fn<() => unknown>(() => ({
  rpc: mockServiceRpc,
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: mockLookupMaybeSingle,
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

const ORDER_ID = '11111111-1111-4111-8111-111111111111';

describe('Batch 02.3 API hardening: cancellation, disputes & payment webhooks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ENGINE_JWT_SECRET = 'test-engine-secret-key';
    process.env.PAYSTACK_SECRET_KEY = 'test-paystack-secret';
    process.env.FLUTTERWAVE_WEBHOOK_HASH = 'test-flw-hash';
    mockLookupMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockCreateServiceClient.mockImplementation(() => ({
      rpc: mockServiceRpc,
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: mockLookupMaybeSingle,
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

  it('/api/webhooks/paystack covers all 10 validation, idempotency, and error cases', async () => {
    const { POST } = await import('@/app/api/webhooks/paystack/route');
    const sign = (raw: string) =>
      createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(raw).digest('hex');
    const postSigned = (raw: string) =>
      POST(
        new Request('http://localhost/api/webhooks/paystack', {
          method: 'POST',
          headers: { 'x-paystack-signature': sign(raw) },
          body: raw,
        }),
      );

    // 1. Invalid signature
    expect(
      (await POST(new Request('http://localhost/api/webhooks/paystack', { method: 'POST', headers: { 'x-paystack-signature': 'wrong' }, body: '{}' }))).status,
    ).toBe(401);

    // 2. Malformed JSON
    expect((await postSigned('{broken')).status).toBe(400);

    // 2b. Non-actionable event
    const ignored = await postSigned(JSON.stringify({ event: 'transfer.success', data: { reference: 'TRF_1' } }));
    expect(ignored.status).toBe(200);
    expect(await ignored.json()).toEqual({ status: 'ignored', event: 'transfer.success' });
    expect(mockServiceRpc).not.toHaveBeenCalled();

    // 3. Missing transaction reference
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.success', data: { amount: 50_000, metadata: { orderId: ORDER_ID } } }))).status,
    ).toBe(400);

    // 4. Missing order ID
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.success', data: { reference: 'UNMAPPED_REF', amount: 50_000 } }))).status,
    ).toBe(422);

    // 4b. marketplace_payments lookup database error
    mockLookupMaybeSingle.mockResolvedValueOnce({ data: null, error: { code: '08006', message: 'Lookup failed' } });
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.success', data: { reference: 'UNMAPPED_REF', amount: 50_000 } }))).status,
    ).toBe(500);
    expect(mockServiceRpc).not.toHaveBeenCalled();

    // 5. Unknown / non-UUID order reference
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.success', data: { reference: 'PSTK_not-a-uuid_1', amount: 50_000 } }))).status,
    ).toBe(422);
    expect(mockServiceRpc).not.toHaveBeenCalled();

    // 6. Zero / negative / invalid amount
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.success', data: { reference: `PSTK_${ORDER_ID}_1`, amount: 0 } }))).status,
    ).toBe(400);
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.success', data: { reference: `PSTK_${ORDER_ID}_1`, amount: -500 } }))).status,
    ).toBe(400);
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.success', data: { reference: `PSTK_${ORDER_ID}_1`, amount: 'NaN' } }))).status,
    ).toBe(400);
    expect(mockServiceRpc).not.toHaveBeenCalled();

    const validBody = JSON.stringify({
      event: 'charge.success',
      data: { reference: `PSTK_${ORDER_ID}_1`, amount: 50_000, metadata: { orderId: ORDER_ID } },
    });

    // 7. Successful valid payment
    mockServiceRpc.mockResolvedValueOnce({ data: { success: true, order_id: ORDER_ID }, error: null });
    const ok = await postSigned(validBody);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ status: 'success', already_processed: false });

    // 8. Duplicate payment notification
    mockServiceRpc.mockResolvedValueOnce({ data: { success: true, already_processed: true, order_id: ORDER_ID }, error: null });
    const dup = await postSigned(validBody);
    expect(dup.status).toBe(200);
    expect(await dup.json()).toEqual({ status: 'success', already_processed: true });

    // 9. Domain validation failure from settlement RPC
    mockServiceRpc.mockResolvedValueOnce({ data: null, error: { code: '22023', message: 'Amount mismatch' } });
    expect((await postSigned(validBody)).status).toBe(422);

    // 10. Unexpected database failure (retryable 500)
    mockServiceRpc.mockResolvedValueOnce({ data: null, error: { code: '08006', message: 'Connection lost' } });
    expect((await postSigned(validBody)).status).toBe(500);
  });

  it('/api/webhooks/flutterwave covers all 10 validation, idempotency, and error cases', async () => {
    const { POST } = await import('@/app/api/webhooks/flutterwave/route');
    const postSigned = (raw: string) =>
      POST(
        new Request('http://localhost/api/webhooks/flutterwave', {
          method: 'POST',
          headers: { 'verif-hash': 'test-flw-hash' },
          body: raw,
        }),
      );

    // 1. Invalid signature
    expect(
      (await POST(new Request('http://localhost/api/webhooks/flutterwave', { method: 'POST', headers: { 'verif-hash': 'wrong' }, body: '{}' }))).status,
    ).toBe(401);

    // 2. Malformed JSON
    expect((await postSigned('{broken')).status).toBe(400);

    // 2b. Non-actionable events
    const ignoredEvent = await postSigned(JSON.stringify({ event: 'transfer.completed', data: { id: 998 } }));
    expect(ignoredEvent.status).toBe(200);
    expect(await ignoredEvent.json()).toEqual({ status: 'ignored', event: 'transfer.completed' });
    const ignoredStatus = await postSigned(
      JSON.stringify({ event: 'charge.completed', data: { id: 998, tx_ref: `FLW_${ORDER_ID}_1`, status: 'failed', amount: 500 } }),
    );
    expect(ignoredStatus.status).toBe(200);
    expect(await ignoredStatus.json()).toEqual({ status: 'ignored', payment_status: 'failed' });
    expect(mockServiceRpc).not.toHaveBeenCalled();

    // 3. Missing transaction reference
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.completed', data: { status: 'successful', amount: 500 } }))).status,
    ).toBe(400);

    // 4. Missing order ID (unmapped tx_ref)
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.completed', data: { id: 999, tx_ref: 'UNMAPPED', status: 'successful', amount: 500 } }))).status,
    ).toBe(422);

    // 4b. marketplace_payments lookup database error
    mockLookupMaybeSingle.mockResolvedValueOnce({ data: null, error: { code: '08006', message: 'Lookup failed' } });
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.completed', data: { id: 999, tx_ref: 'UNMAPPED', status: 'successful', amount: 500 } }))).status,
    ).toBe(500);
    expect(mockServiceRpc).not.toHaveBeenCalled();

    // 5. Unknown / non-UUID order reference
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.completed', data: { id: 999, tx_ref: 'FLW_bad-uuid_1', status: 'successful', amount: 500 } }))).status,
    ).toBe(422);
    expect(mockServiceRpc).not.toHaveBeenCalled();

    // 6. Zero / negative / invalid amount
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.completed', data: { id: 999, tx_ref: `FLW_${ORDER_ID}_1`, status: 'successful', amount: 0 } }))).status,
    ).toBe(400);
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.completed', data: { id: 999, tx_ref: `FLW_${ORDER_ID}_1`, status: 'successful', amount: -50 } }))).status,
    ).toBe(400);
    expect(
      (await postSigned(JSON.stringify({ event: 'charge.completed', data: { id: 999, tx_ref: `FLW_${ORDER_ID}_1`, status: 'successful', amount: 'NaN' } }))).status,
    ).toBe(400);
    expect(mockServiceRpc).not.toHaveBeenCalled();

    const validBody = JSON.stringify({
      event: 'charge.completed',
      data: { id: 9991, tx_ref: `FLW_${ORDER_ID}_1`, status: 'successful', amount: 500 },
    });

    // 7. Successful valid payment
    mockServiceRpc.mockResolvedValueOnce({ data: { success: true, order_id: ORDER_ID }, error: null });
    const ok = await postSigned(validBody);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ status: 'success', already_processed: false });

    // 8. Duplicate payment notification
    mockServiceRpc.mockResolvedValueOnce({ data: { success: true, already_processed: true, order_id: ORDER_ID }, error: null });
    const dup = await postSigned(validBody);
    expect(dup.status).toBe(200);
    expect(await dup.json()).toEqual({ status: 'success', already_processed: true });

    // 9. Domain validation failure from settlement RPC
    mockServiceRpc.mockResolvedValueOnce({ data: null, error: { code: 'P0002', message: 'Order not found' } });
    expect((await postSigned(validBody)).status).toBe(422);

    // 10. Unexpected database failure (retryable 500)
    mockServiceRpc.mockResolvedValueOnce({ data: null, error: { code: 'XX000', message: 'Unexpected DB failure' } });
    expect((await postSigned(validBody)).status).toBe(500);
  });
});
