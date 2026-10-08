// Phone sign-in. Codes are sent by the Supabase Auth Send SMS hook through the SMS provider chosen in the
// admin console (same flow as the website). A new number gets an account; onboarding follows.
import { reportError } from './monitoring';
import { SESSION_KEY, sessionStorage, supabase } from './supabase';

export type AuthErrorKey = 'errorPhone' | 'errorEmail' | 'errorCode' | 'errorWrongCode' | 'errorBusy' | 'errorSend' | 'offline';

function isNetworkError(error: { name?: string; message?: string; status?: number }): boolean {
  return error.name === 'AuthRetryableFetchError' || error.status === 0 || /network|fetch/i.test(error.message ?? '');
}

/** Texts a 6-digit code to a normalised 234XXXXXXXXXX number. */
export async function sendCode(phone: string): Promise<AuthErrorKey | null> {
  const { error } = await supabase.auth.signInWithOtp({ phone: `+${phone}`, options: { shouldCreateUser: true } });
  if (!error) return null;
  if (isNetworkError(error)) return 'offline';
  if (error.status === 429) return 'errorBusy';
  reportError('sign_in_code_failed', error, { reason: error.code ?? error.name, status: error.status ?? 0 });
  return 'errorSend';
}

/** Sends a 6-digit code to an email address. */
export async function sendEmailCode(email: string): Promise<AuthErrorKey | null> {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (!error) return null;
  if (isNetworkError(error)) return 'offline';
  if (error.status === 429) return 'errorBusy';
  reportError('sign_in_email_code_failed', error, { reason: error.code ?? error.name, status: error.status ?? 0 });
  return 'errorSend';
}

/** Checks the SMS code; on success Supabase stores the (encrypted) session and fires onAuthStateChange. */
export async function verifyCode(phone: string, code: string): Promise<AuthErrorKey | null> {
  const token = code.replace(/\s+/g, '');
  if (!/^[0-9]{6,10}$/.test(token)) return 'errorCode';
  const { data, error } = await supabase.auth.verifyOtp({ phone: `+${phone}`, token, type: 'sms' });
  if (error && isNetworkError(error)) return 'offline';
  if (error?.status === 429) return 'errorBusy';
  if (error || !data.session) return 'errorWrongCode';
  return null;
}

/** Checks the email code; on success Supabase stores the (encrypted) session and fires onAuthStateChange. */
export async function verifyEmailCode(email: string, code: string): Promise<AuthErrorKey | null> {
  const token = code.replace(/\s+/g, '');
  if (!/^[0-9]{6,10}$/.test(token)) return 'errorCode';
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error && isNetworkError(error)) return 'offline';
  if (error?.status === 429) return 'errorBusy';
  if (error || !data.session) return 'errorWrongCode';
  return null;
}

/**
 * 'local' always clears this phone's session (even offline). 'global' needs the server to end every
 * session, so it returns false when that could not be confirmed and the person stays signed in here.
 */
export async function signOut(scope: 'local' | 'global' = 'local'): Promise<boolean> {
  const { error } = await supabase.auth.signOut({ scope });
  if (error && scope === 'local') {
    // Offline: the server could not be told, but the session must still leave this phone.
    await sessionStorage.removeItem(SESSION_KEY).catch(() => undefined);
    return true;
  }
  return !error;
}
