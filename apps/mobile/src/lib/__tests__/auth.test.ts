import { describe, expect, it, vi } from 'vitest';
import { sendCode, sendEmailCode, verifyCode, verifyEmailCode } from '../auth';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
  SESSION_KEY: 'cn-auth',
  sessionStorage: { removeItem: vi.fn() },
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('../monitoring', () => ({
  reportError: vi.fn(),
}));

describe('mobile auth with phone and email', () => {
  it('sends phone code via signInWithOtp with + prefix', async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValueOnce({ data: {}, error: null } as any);
    const result = await sendCode('2348031234567');
    expect(result).toBeNull();
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      phone: '+2348031234567',
      options: { shouldCreateUser: true },
    });
  });

  it('sends email code via signInWithOtp', async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValueOnce({ data: {}, error: null } as any);
    const result = await sendEmailCode('farmer@example.com');
    expect(result).toBeNull();
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'farmer@example.com',
      options: { shouldCreateUser: true },
    });
  });

  it('handles rate limit (429) for email code request', async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValueOnce({
      data: {},
      error: { status: 429, name: 'AuthApiError', message: 'Too many requests' },
    } as any);
    const result = await sendEmailCode('farmer@example.com');
    expect(result).toBe('errorBusy');
  });

  it('verifies phone code', async () => {
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);
    const result = await verifyCode('2348031234567', '123456');
    expect(result).toBeNull();
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+2348031234567',
      token: '123456',
      type: 'sms',
    });
  });

  it('verifies email code', async () => {
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { session: { access_token: 'tok' } },
      error: null,
    } as any);
    const result = await verifyEmailCode('farmer@example.com', '654321');
    expect(result).toBeNull();
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'farmer@example.com',
      token: '654321',
      type: 'email',
    });
  });

  it('rejects malformed code before calling API', async () => {
    const resultPhone = await verifyCode('2348031234567', '123');
    expect(resultPhone).toBe('errorCode');

    const resultEmail = await verifyEmailCode('farmer@example.com', 'abc');
    expect(resultEmail).toBe('errorCode');
  });
});
