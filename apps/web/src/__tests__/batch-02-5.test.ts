import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAdminGetUser = vi.fn();
const mockAdminGetUserById = vi.fn();
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

describe('Batch 02.5 /api/account/delete route (durable 3-phase flow)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCookieGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockStorageRemove.mockResolvedValue({ data: [], error: null });
    mockAdminDeleteUser.mockResolvedValue({ data: { user: null }, error: null });
    mockAdminGetUserById.mockResolvedValue({ data: { user: null }, error: { status: 404, message: 'User not found' } });
    mockCreateServiceClient.mockReturnValue({
      auth: {
        getUser: mockAdminGetUser,
        admin: { deleteUser: mockAdminDeleteUser, getUserById: mockAdminGetUserById },
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

  it('rejects unauthenticated requests (401), invalid confirmation (400), and stale sessions (403)', async () => {
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

    mockAdminGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', last_sign_in_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() } },
      error: null,
    });
    const stale = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(stale.status).toBe(403);
    expect((await stale.json()).error).toBe('reauth_required');
    expect(mockAdminRpc).not.toHaveBeenCalled();
  });

  it('returns 409 when active bookings/fulfilments/escrows/settlements block deletion', async () => {
    const { POST } = await import('@/app/api/account/delete/route');
    mockAdminGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', last_sign_in_at: new Date().toISOString() } },
      error: null,
    });
    mockAdminRpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'P0001', message: 'Complete or resolve active seller fulfilments before deleting your account.' },
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

  it('handles partial Storage failure without deleting Auth, then recovers on retry', async () => {
    const { POST } = await import('@/app/api/account/delete/route');
    const freshUser = { id: 'u1', last_sign_in_at: new Date().toISOString() };

    // Attempt 1: 2 files queued; 1st succeeds, 2nd fails -> Auth deleteUser must NOT run.
    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc
      .mockResolvedValueOnce({ data: { status: 'anonymized', request_id: 'req-1', pending_storage_count: 2 }, error: null })
      .mockResolvedValueOnce({
        data: [
          { id: 'c1', profile_id: 'u1', bucket_id: 'verification-documents', storage_path: 'u1/a.pdf', attempts: 1, lease_token: 'lt-1' },
          { id: 'c2', profile_id: 'u1', bucket_id: 'verification-documents', storage_path: 'u1/b.jpg', attempts: 1, lease_token: 'lt-2' },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: { status: 'completed', remaining_count: 1 }, error: null })
      .mockResolvedValueOnce({ data: { status: 'failed', remaining_count: 1 }, error: null })
      .mockResolvedValueOnce({ data: { deletion_status: 'storage_pending' }, error: null });

    mockStorageRemove
      .mockResolvedValueOnce({ data: [{ name: 'u1/a.pdf' }], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Storage 503' } });

    const partialRes = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(partialRes.status).toBe(500);
    expect((await partialRes.json()).error).toBe('storage_cleanup_incomplete');
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();

    // Attempt 2 (retry): claims only remaining failed item c2, removes it, deletes Auth, finalizes.
    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc
      .mockResolvedValueOnce({ data: { status: 'already_anonymized', request_id: 'req-1', pending_storage_count: 1 }, error: null })
      .mockResolvedValueOnce({
        data: [{ id: 'c2', profile_id: 'u1', bucket_id: 'verification-documents', storage_path: 'u1/b.jpg', attempts: 2, lease_token: 'lt-3' }],
        error: null,
      })
      .mockResolvedValueOnce({ data: { status: 'completed', remaining_count: 0 }, error: null })
      .mockResolvedValueOnce({ data: { deletion_status: 'completed', remaining_storage_count: 0 }, error: null });

    mockStorageRemove.mockResolvedValueOnce({ data: [{ name: 'u1/b.jpg' }], error: null });
    mockAdminDeleteUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const retryRes = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(retryRes.status).toBe(200);
    expect(await retryRes.json()).toEqual({ status: 'deleted', request_id: 'req-1', storage_removed_count: 1 });
    expect(mockAdminRpc).toHaveBeenCalledWith('record_account_deletion_storage_result', {
      p_cleanup_id: 'c2',
      p_status: 'completed',
      p_lease_token: 'lt-3',
    });
    expect(mockAdminDeleteUser).toHaveBeenCalledWith('u1');
  });

  it('handles Auth deletion failure and idempotent retry', async () => {
    const { POST } = await import('@/app/api/account/delete/route');
    const freshUser = { id: 'u1', last_sign_in_at: new Date().toISOString() };

    // Auth deletion fails after Storage completes
    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc
      .mockResolvedValueOnce({ data: { status: 'anonymized', request_id: 'req-2', pending_storage_count: 0 }, error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: { deletion_status: 'auth_pending' }, error: null });
    mockAdminDeleteUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 500, message: 'Auth down' } });

    const authFail = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(authFail.status).toBe(500);
    expect((await authFail.json()).error).toBe('auth_deletion_incomplete');

    // Retry succeeds even if Auth returns 404
    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc
      .mockResolvedValueOnce({ data: { status: 'already_deleted', request_id: 'req-2', pending_storage_count: 0 }, error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: { deletion_status: 'completed' }, error: null });
    mockAdminDeleteUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 404, message: 'Not found' } });

    const retryOk = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(retryOk.status).toBe(200);
    expect((await retryOk.json()).status).toBe('already_deleted');
  });

  it('does not proceed to Auth deletion when record_account_deletion_storage_result fails', async () => {
    const { POST } = await import('@/app/api/account/delete/route');
    const freshUser = { id: 'u1', last_sign_in_at: new Date().toISOString() };

    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc
      .mockResolvedValueOnce({ data: { status: 'anonymized', request_id: 'req-3', pending_storage_count: 1 }, error: null })
      .mockResolvedValueOnce({
        data: [{ id: 'c1', profile_id: 'u1', bucket_id: 'verification-documents', storage_path: 'u1/a.pdf', attempts: 1 }],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { code: '57014', message: 'statement timeout' } })
      .mockResolvedValueOnce({ data: { deletion_status: 'storage_pending' }, error: null });

    mockStorageRemove.mockResolvedValueOnce({ data: [{ name: 'u1/a.pdf' }], error: null });

    const res = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('storage_cleanup_incomplete');
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();
  });

  it('does not proceed to Auth deletion when another worker holds an active processing lease', async () => {
    const { POST } = await import('@/app/api/account/delete/route');
    const freshUser = { id: 'u1', last_sign_in_at: new Date().toISOString() };

    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc
      .mockResolvedValueOnce({ data: { status: 'already_anonymized', request_id: 'req-4', pending_storage_count: 1 }, error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: { deletion_status: 'storage_pending' }, error: null });

    const res = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('storage_cleanup_incomplete');
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();
  });

  it('returns 500 when finalize_account_deletion fails or returns an invalid payload after Auth deletion', async () => {
    const { POST } = await import('@/app/api/account/delete/route');
    const freshUser = { id: 'u1', last_sign_in_at: new Date().toISOString() };

    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc
      .mockResolvedValueOnce({ data: { status: 'anonymized', request_id: 'req-5', pending_storage_count: 0 }, error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: { code: 'XX000', message: 'db error' } });
    mockAdminDeleteUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const errRes = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(errRes.status).toBe(500);
    expect((await errRes.json()).error).toBe('finalization_incomplete');

    mockAdminGetUser.mockResolvedValueOnce({ data: { user: freshUser }, error: null });
    mockAdminRpc
      .mockResolvedValueOnce({ data: { status: 'already_anonymized', request_id: 'req-5', pending_storage_count: 0 }, error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    mockAdminDeleteUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 404, message: 'Not found' } });

    const invalidRes = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok-1' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      }),
    );
    expect(invalidRes.status).toBe(500);
    expect((await invalidRes.json()).error).toBe('finalization_incomplete');
  });

  it('reconciles post-Auth incomplete deletions via /api/cron/account-deletions', async () => {
    const prevSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'cron-secret-test';
    try {
      const { GET } = await import('@/app/api/cron/account-deletions/route');

      const unauth = await GET(new Request('http://localhost/api/cron/account-deletions'));
      expect(unauth.status).toBe(401);

      mockAdminRpc
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({
          data: [{ profile_id: 'u-orphaned', deletion_status: 'auth_pending', deleted_at: '2026-11-18T12:00:00Z', pending_storage_count: 0 }],
          error: null,
        })
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: { deletion_status: 'completed' }, error: null });
      mockAdminGetUserById.mockResolvedValueOnce({ data: { user: null }, error: { status: 404, message: 'User not found' } });

      const okRes = await GET(
        new Request('http://localhost/api/cron/account-deletions', {
          headers: { Authorization: 'Bearer cron-secret-test' },
        }),
      );
      expect(okRes.status).toBe(200);
      const body = await okRes.json();
      expect(body.finalized).toBe(1);
      expect(body.stillPending).toBe(0);
    } finally {
      if (prevSecret === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prevSecret;
    }
  });
});
