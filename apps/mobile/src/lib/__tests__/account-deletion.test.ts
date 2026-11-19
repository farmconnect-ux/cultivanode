import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRemoveItem = vi.fn().mockResolvedValue(undefined);
const mockGetSession = vi.fn();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: mockRemoveItem,
  },
}));

vi.mock('expo-crypto', () => ({
  randomUUID: () => '00000000-0000-4000-8000-000000000099',
}));

vi.mock('../supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn(), getSession: mockGetSession },
    from: vi.fn(),
    rpc: vi.fn(),
    storage: { from: vi.fn() },
  },
}));

describe('mobile account deletion workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('enforces recent sign-in window', async () => {
    const { isRecentSignIn, RECENT_AUTH_WINDOW_MS } = await import('../account');
    const now = Date.parse('2026-11-18T10:00:00Z');
    expect(isRecentSignIn('2026-11-18T09:50:00Z', now)).toBe(true);
    expect(isRecentSignIn('2026-11-18T09:40:00Z', now)).toBe(false);
    expect(isRecentSignIn(new Date(now - RECENT_AUTH_WINDOW_MS).toISOString(), now)).toBe(true);
    expect(isRecentSignIn(null, now)).toBe(false);
    expect(isRecentSignIn('not-a-date', now)).toBe(false);
  });

  it('rejects missing confirmation or token before calling server', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { deleteMyAccount } = await import('../account');

    const badConfirm = await deleteMyAccount({
      userId: 'u1',
      confirmation: 'delete',
      accessToken: 'jwt-1',
    });
    expect(badConfirm.ok).toBe(false);
    if (!badConfirm.ok) expect(badConfirm.code).toBe('invalid_confirmation');

    const noToken = await deleteMyAccount({
      userId: 'u1',
      confirmation: 'DELETE',
      accessToken: '',
    });
    expect(noToken.ok).toBe(false);
    if (!noToken.ok) expect(noToken.code).toBe('unauthenticated');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('surfaces reauth_required, deletion_blocked, and network/partial failures without clearing cache', async () => {
    const { deleteMyAccount } = await import('../account');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'reauth_required', message: 'Verify OTP again.' }), { status: 403 }),
      ),
    );
    const reauth = await deleteMyAccount({ userId: 'u1', confirmation: 'DELETE', accessToken: 'jwt-1' });
    expect(reauth).toEqual({ ok: false, code: 'reauth_required', error: 'Verify OTP again.' });
    expect(mockRemoveItem).not.toHaveBeenCalled();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'deletion_blocked', message: 'Active booking in progress.' }), { status: 409 }),
      ),
    );
    const blocked = await deleteMyAccount({ userId: 'u1', confirmation: 'DELETE', accessToken: 'jwt-1' });
    expect(blocked).toEqual({ ok: false, code: 'deletion_blocked', error: 'Active booking in progress.' });
    expect(mockRemoveItem).not.toHaveBeenCalled();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network failed')));
    const netErr = await deleteMyAccount({ userId: 'u1', confirmation: 'DELETE', accessToken: 'jwt-1' });
    expect(netErr.ok).toBe(false);
    if (!netErr.ok) expect(netErr.code).toBe('network');
    expect(mockRemoveItem).not.toHaveBeenCalled();
  });

  it('clears local caches on successful deletion', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'deleted', storage_removed_count: 2 }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { deleteMyAccount } = await import('../account');

    const ok = await deleteMyAccount({
      userId: 'user-123',
      confirmation: 'DELETE',
      reason: 'No longer needed',
      accessToken: 'jwt-valid',
    });
    expect(ok).toEqual({ ok: true, status: 'deleted', storageRemovedCount: 2 });
    expect(mockRemoveItem).toHaveBeenCalledWith('cache_account_user-123');
    expect(mockRemoveItem).toHaveBeenCalledWith('cn.activeFarm');
    expect(mockRemoveItem).toHaveBeenCalledWith('cn.outbox');
  });

  it('retrieves the latest access token after OTP re-authentication and falls back safely on error', async () => {
    const { getFreshAccessToken } = await import('../account');

    mockGetSession.mockResolvedValueOnce({ data: { session: { access_token: 'fresh-post-otp-jwt' } } });
    expect(await getFreshAccessToken('stale-jwt')).toBe('fresh-post-otp-jwt');

    mockGetSession.mockRejectedValueOnce(new Error('Storage read failed'));
    expect(await getFreshAccessToken('fallback-jwt')).toBe('fallback-jwt');
  });
});
