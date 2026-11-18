import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAdminGetUser = vi.fn();
const mockAdminRpc = vi.fn();
const mockStorageRemove = vi.fn();
const mockAdminDeleteUser = vi.fn();
const mockCreateServiceClient = vi.fn<() => unknown>();
const mockCookieGetUser = vi.fn();

vi.mock('server-only', () => ({}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: () => mockCreateServiceClient(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockCookieGetUser },
  }),
}));

describe('Batch 02.5 /api/account/delete route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCookieGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockStorageRemove.mockResolvedValue({ data: [], error: null });
    mockAdminDeleteUser.mockResolvedValue({ data: { user: null }, error: null });
    mockCreateServiceClient.mockReturnValue({
      auth: {
        getUser: mockAdminGetUser,
        admin: { deleteUser: mockAdminDeleteUser },
      },
      rpc: mockAdminRpc,
      storage: {
        from: vi.fn(() => ({ remove: mockStorageRemove })),
      },
    });
  });

  it('fails closed with 503 when service client is missing', async () => {
    mockCreateServiceClient.mockReturnValueOnce(null);
    const { POST } = await import('@/app/api/account/delete/route');
    const res = await POST(new Request('http://localhost/api/account/delete', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(503);
  });

  it('rejects unauthenticated requests with 401 and invalid confirmation with 400', async () => {
    const { POST } = await import('@/app/api/account/delete/route');

    const noAuth = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(noAuth.status).toBe(401);

    mockAdminGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', last_sign_in_at: new Date().toISOString() } },
      error: null,
    });
    const badConfirm = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'NOPE' }),
      }),
    );
    expect(badConfirm.status).toBe(400);
    expect(mockAdminRpc).not.toHaveBeenCalled();
  });

  it('requires recent sign-in (403 reauth_required) when session is stale', async () => {
    const { POST } = await import('@/app/api/account/delete/route');
    const staleIso = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    mockAdminGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', last_sign_in_at: staleIso } },
      error: null,
    });

    const res = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('reauth_required');
    expect(mockAdminRpc).not.toHaveBeenCalled();
  });

  it('returns 409 when active bookings/escrows/settlements block deletion without touching storage or auth', async () => {
    const { POST } = await import('@/app/api/account/delete/route');
    mockAdminGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', last_sign_in_at: new Date().toISOString() } },
      error: null,
    });
    mockAdminRpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'P0001', message: 'Complete or resolve active service bookings before deleting your account.' },
    });

    const res = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(res.status).toBe(409);
    expect(mockStorageRemove).not.toHaveBeenCalled();
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();
  });

  it('executes deletion, removes verification documents from storage, deletes Auth user, and handles partial failures', async () => {
    const { POST } = await import('@/app/api/account/delete/route');
    const freshUser = { id: 'u1', last_sign_in_at: new Date().toISOString() };

    // 1. Full success
    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc.mockResolvedValueOnce({
      data: { status: 'deleted', request_id: 'req-1', storage_paths: ['u1/doc1.pdf', 'u1/doc2.jpg'] },
      error: null,
    });

    const ok = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE', reason: 'Closing farm account' }),
      }),
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ status: 'deleted', request_id: 'req-1', storage_removed_count: 2 });
    expect(mockAdminRpc).toHaveBeenCalledWith('execute_account_deletion', {
      p_user_id: 'u1',
      p_reason: 'Closing farm account',
    });
    expect(mockStorageRemove).toHaveBeenCalledWith(['u1/doc1.pdf', 'u1/doc2.jpg']);
    expect(mockAdminDeleteUser).toHaveBeenCalledWith('u1');

    // 2. Auth deleteUser partial failure returns 500 auth_deletion_incomplete
    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc.mockResolvedValueOnce({
      data: { status: 'deleted', request_id: 'req-1', storage_paths: [] },
      error: null,
    });
    mockAdminDeleteUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 500, message: 'Auth down' } });

    const partial = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(partial.status).toBe(500);
    expect((await partial.json()).error).toBe('auth_deletion_incomplete');

    // 3. Idempotent retry when already_deleted and Auth user already 404
    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc.mockResolvedValueOnce({
      data: { status: 'already_deleted', request_id: null, storage_paths: [] },
      error: null,
    });
    mockAdminDeleteUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 404, message: 'User not found' } });

    const retry = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(retry.status).toBe(200);
    expect((await retry.json()).status).toBe('already_deleted');
  });
});
