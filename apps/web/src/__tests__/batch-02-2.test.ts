import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockRequireStaff = vi.fn();
const mockServiceRpc = vi.fn();
const mockCreateServiceClient = vi.fn<() => unknown>(() => ({ rpc: mockServiceRpc }));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/admin/staff', () => ({
  requireStaff: () => mockRequireStaff(),
  can: (staff: { permissions: string[] } | null, perm: string) =>
    Boolean(staff?.permissions.includes(perm)),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => mockCreateServiceClient(),
}));

function signEngineJwt(secret: string, permissions: string[] = []) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: 'user-1', iat: now, exp: now + 300, roles: ['crop_farmer'], permissions }),
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

describe('Batch 02.2 API, Finance & Support integrity', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.ENGINE_JWT_SECRET;
    mockCreateServiceClient.mockImplementation(() => ({ rpc: mockServiceRpc }));
  });

  it('engines-api-helper fails closed when ENGINE_JWT_SECRET is unset and handles malformed JSON', async () => {
    const { authorizeRequest, parseJsonBody } = await import('@/lib/engines-api-helper');
    const { z } = await import('zod');

    const res = await authorizeRequest(new Request('http://localhost/api/engines/test'));
    expect(res.authorized).toBe(false);
    if (!res.authorized) {
      expect(res.response.status).toBe(503);
    }

    const badJson = await parseJsonBody(
      new Request('http://localhost/api/engines/test', { method: 'POST', body: '{bad-json' }),
      z.object({ a: z.string() }),
    );
    expect(badJson.ok).toBe(false);
    if (!badJson.ok) {
      expect(badJson.response.status).toBe(400);
    }
  });

  it('/api/ai/health returns 401 when unauthenticated and 403 when non-staff', async () => {
    const { GET } = await import('@/app/api/ai/health/route');
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const unauth = await GET();
    expect(unauth.status).toBe(401);

    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockRpc.mockResolvedValueOnce({ data: [] });
    const nonStaff = await GET();
    expect(nonStaff.status).toBe(403);
  });

  it('/api/ai/assistant returns 400 on malformed JSON and 401 when unauthenticated', async () => {
    const { POST } = await import('@/app/api/ai/assistant/route');
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const unauth = await POST(
      new Request('http://localhost/api/ai/assistant', {
        method: 'POST',
        body: JSON.stringify({ query: 'Hello' }),
      }),
    );
    expect(unauth.status).toBe(401);

    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const badJson = await POST(
      new Request('http://localhost/api/ai/assistant', {
        method: 'POST',
        body: '{invalid-json',
      }),
    );
    expect(badJson.status).toBe(400);
  });

  it('/api/engines/ledger/transact fails closed (503) without service client, enforces ledger.write, and persists via RPC', async () => {
    const secret = 'test-engine-secret-key';
    process.env.ENGINE_JWT_SECRET = secret;
    const noPermToken = signEngineJwt(secret, []);
    const token = signEngineJwt(secret, ['ledger.write']);
    const { POST } = await import('@/app/api/engines/ledger/transact/route');

    const body = JSON.stringify({
      referenceId: 'ORD-1',
      referenceType: 'adjustment',
      description: 'Test adjustment',
      postings: [
        { account_id: 'ASSET_PAYMENT_CLEARING', direction: 'DEBIT', amount_kobo: 1000 },
        { account_id: 'LIABILITY_SELLER_PAYABLE', direction: 'CREDIT', amount_kobo: 1000 },
      ],
    });

    const forbidden = await POST(
      new Request('http://localhost/api/engines/ledger/transact', {
        method: 'POST',
        headers: { Authorization: `Bearer ${noPermToken}` },
        body,
      }),
    );
    expect(forbidden.status).toBe(403);

    mockCreateServiceClient.mockReturnValueOnce(null);
    const unconfigured = await POST(
      new Request('http://localhost/api/engines/ledger/transact', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
    );
    expect(unconfigured.status).toBe(503);

    mockServiceRpc.mockResolvedValueOnce({ data: 'entry-uuid-1', error: null });
    const ok = await POST(
      new Request('http://localhost/api/engines/ledger/transact', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
    );
    expect(ok.status).toBe(200);
    expect(mockServiceRpc).toHaveBeenCalledWith('record_marketplace_journal_entry', expect.any(Object));
  });

  it('/api/engines/agronomy/* and /api/engines/ai/* enforce auth and Zod validation', async () => {
    const secret = 'test-engine-secret-key';
    process.env.ENGINE_JWT_SECRET = secret;
    const token = signEngineJwt(secret);

    const { POST: schedPost, GET: schedGet } = await import('@/app/api/engines/agronomy/schedule/route');
    const { POST: weatherPost } = await import('@/app/api/engines/agronomy/weather-alerts/route');
    const { POST: fertPost } = await import('@/app/api/engines/agronomy/fertiliser/route');
    const { POST: sprayPost } = await import('@/app/api/engines/agronomy/spray/route');
    const { POST: groundPost } = await import('@/app/api/engines/ai/ground/route');
    const { POST: guardPost } = await import('@/app/api/engines/ai/guardrail/route');

    const csvRes = await schedGet();
    expect(csvRes.status).toBe(200);
    const csv = await csvRes.text();
    expect(csv).toContain('Crop_ID,Crop_Name');
    expect(csv).toContain('maize');

    const unauthReq = () => new Request('http://localhost/api/engines/test', { method: 'POST', body: JSON.stringify({}) });
    expect((await schedPost(unauthReq())).status).toBe(401);

    const badReq = () =>
      new Request('http://localhost/api/engines/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
    expect((await schedPost(badReq())).status).toBe(400);
    expect((await weatherPost(badReq())).status).toBe(400);
    expect((await fertPost(badReq())).status).toBe(400);
    expect((await sprayPost(badReq())).status).toBe(400);
    expect((await groundPost(badReq())).status).toBe(400);
    expect((await guardPost(badReq())).status).toBe(400);
  });

  it('/api/documents/[type] returns 404 for unknown document type', async () => {
    const { GET } = await import('@/app/api/documents/[type]/route');
    const res = await GET(new Request('http://localhost/api/documents/nonexistent'), {
      params: Promise.resolve({ type: 'nonexistent' }),
    });
    expect(res.status).toBe(404);
  });

  it('Admin Finance processSettlementAction enforces payouts.approve permission', async () => {
    const { processSettlementAction } = await import('@/actions/admin-finance');
    mockRequireStaff.mockResolvedValueOnce({ userId: 'staff-1', permissions: ['ledger.read'] });
    const fd = new FormData();
    fd.set('settlement_id', '11111111-1111-4111-8111-111111111111');
    fd.set('status', 'completed');
    const denied = await processSettlementAction(null, fd);
    expect(denied.ok).toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();

    mockRequireStaff.mockResolvedValueOnce({ userId: 'staff-1', permissions: ['payouts.approve'] });
    mockRpc.mockResolvedValueOnce({ error: null });
    const allowed = await processSettlementAction(null, fd);
    expect(allowed.ok).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('admin_process_marketplace_settlement', {
      p_settlement_id: '11111111-1111-4111-8111-111111111111',
      p_status: 'completed',
      p_note: undefined,
    });
  });

  it('Admin Support actions call atomic DB RPCs and enforce website_inbox.manage', async () => {
    const { updateSupportTicketAction, postSupportMessageAction } = await import('@/actions/admin-support');
    mockRequireStaff.mockResolvedValueOnce({ userId: 'staff-2', permissions: [] });
    const fd = new FormData();
    fd.set('ticket_id', '22222222-2222-4222-8222-222222222222');
    fd.set('status', 'resolved');
    fd.set('priority', 'high');
    expect((await updateSupportTicketAction(null, fd)).ok).toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();

    mockRequireStaff.mockResolvedValueOnce({ userId: 'staff-2', permissions: ['website_inbox.manage'] });
    mockRpc.mockResolvedValueOnce({ error: { message: 'Cannot move ticket from closed to pending.' } });
    fd.set('status', 'pending');
    const badTransition = await updateSupportTicketAction(null, fd);
    expect(badTransition.ok).toBe(false);

    mockRequireStaff.mockResolvedValueOnce({ userId: 'staff-2', permissions: ['website_inbox.manage'] });
    mockRpc.mockResolvedValueOnce({ error: null });
    const msgFd = new FormData();
    msgFd.set('ticket_id', '22222222-2222-4222-8222-222222222222');
    msgFd.set('body', 'Internal triage note');
    msgFd.set('is_internal', 'true');
    const msgRes = await postSupportMessageAction(null, msgFd);
    expect(msgRes.ok).toBe(true);
    expect(mockRpc).toHaveBeenLastCalledWith('admin_post_support_message', {
      p_ticket_id: '22222222-2222-4222-8222-222222222222',
      p_body: 'Internal triage note',
      p_is_internal: true,
    });
  });
});
