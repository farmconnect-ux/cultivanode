import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockRequireStaff = vi.fn();
const mockAdminRpc = vi.fn();
const mockSupportEq = vi.fn();
const mockSupportSelect = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mockSupportEq })) }));
const mockSupportUpdate = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
const mockSupportMsgInsert = vi.fn(async () => ({ error: null }));
const mockAdminActionsInsert = vi.fn(async () => ({ error: null }));

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
    from: (table: string) => {
      if (table === 'support_tickets') {
        return { select: mockSupportSelect, update: mockSupportUpdate };
      }
      if (table === 'support_ticket_messages') {
        return { insert: mockSupportMsgInsert };
      }
      if (table === 'admin_actions') {
        return { insert: mockAdminActionsInsert };
      }
      return {};
    },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => ({ rpc: mockAdminRpc }),
}));

describe('Batch 02.2 API, Finance & Support integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ENGINE_JWT_SECRET;
  });

  it('engines-api-helper fails closed when ENGINE_JWT_SECRET is unset', async () => {
    const { authorizeRequest, getEngineSecret } = await import('@/lib/engines-api-helper');
    expect(getEngineSecret()).toBeNull();
    const res = await authorizeRequest(new Request('http://localhost/api/engines/ledger/transact'));
    expect(res.authorized).toBe(false);
    if (!res.authorized) expect(res.response.status).toBe(503);
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
    const unauth = await POST(new Request('http://localhost/api/ai/assistant', { method: 'POST', body: '{}' }));
    expect(unauth.status).toBe(401);

    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const badJson = await POST(
      new Request('http://localhost/api/ai/assistant', { method: 'POST', body: '{bad-json' }),
    );
    expect(badJson.status).toBe(400);
  });

  it('/api/engines/agronomy/schedule GET serves dynamic CROP_CATALOGUE CSV', async () => {
    const { GET } = await import('@/app/api/engines/agronomy/schedule/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain('Crop_ID,Crop_Name');
    expect(csv).toContain('maize');
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

  it('Admin Support actions enforce website_inbox.manage and valid transitions', async () => {
    const { updateSupportTicketAction, postSupportMessageAction } = await import('@/actions/admin-support');
    mockRequireStaff.mockResolvedValueOnce({ userId: 'staff-2', permissions: [] });
    const fd = new FormData();
    fd.set('ticket_id', '22222222-2222-4222-8222-222222222222');
    fd.set('status', 'resolved');
    fd.set('priority', 'high');
    expect((await updateSupportTicketAction(null, fd)).ok).toBe(false);

    mockRequireStaff.mockResolvedValueOnce({ userId: 'staff-2', permissions: ['website_inbox.manage'] });
    mockSupportEq.mockResolvedValueOnce({ data: { id: '22222222-2222-4222-8222-222222222222', status: 'closed' }, error: null });
    fd.set('status', 'pending'); // invalid transition from closed -> pending
    const badTransition = await updateSupportTicketAction(null, fd);
    expect(badTransition.ok).toBe(false);

    mockRequireStaff.mockResolvedValueOnce({ userId: 'staff-2', permissions: ['website_inbox.manage'] });
    const msgFd = new FormData();
    msgFd.set('ticket_id', '22222222-2222-4222-8222-222222222222');
    msgFd.set('body', 'Internal triage note');
    msgFd.set('is_internal', 'true');
    const msgRes = await postSupportMessageAction(null, msgFd);
    expect(msgRes.ok).toBe(true);
    expect(mockSupportMsgInsert).toHaveBeenCalledWith({
      ticket_id: '22222222-2222-4222-8222-222222222222',
      author_id: 'staff-2',
      body: 'Internal triage note',
      is_internal: true,
    });
  });
});
