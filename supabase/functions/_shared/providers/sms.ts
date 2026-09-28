// SMS adapters. Add a provider: write an adapter here, register it in smsProvider(), and add a row to
// public.integration_providers (config_fields / secret_fields) in a migration. Staff then switch in the admin.
import { BRAND_NAME } from '../brand.ts';
import { type FetchFn, type Result, type Runtime, type SmsProvider, TIMEOUT_MS } from './types.ts';

/** Development provider: accepts everything and sends nothing. Never logs the message (it holds the code). */
export const mockSms: SmsProvider = {
  send: async () => ({ ok: true, value: { messageId: `mock-${crypto.randomUUID()}` } }),
};

/** Termii: POST {base_url}/api/sms/send */
export function termii(rt: Runtime, fetchFn: FetchFn = fetch): SmsProvider {
  return {
    async send(to, text) {
      const apiKey = rt.secrets.api_key;
      const base = (rt.config.base_url ?? '').replace(/\/+$/, '');
      const from = rt.config.sender_id ?? '';
      if (!apiKey || !base || !from) return { ok: false, error: 'not_configured' };

      let res: Response;
      try {
        res = await fetchFn(`${base}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            to,
            from,
            sms: text,
            type: 'plain',
            channel: rt.config.channel || 'dnd',
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        return { ok: false, error: 'unavailable' };
      }

      let body: Record<string, unknown> = {};
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {
        /* keep empty */
      }
      if (res.ok && (body.code === 'ok' || typeof body.message_id === 'string')) {
        return { ok: true, value: { messageId: String(body.message_id ?? '') }, httpStatus: res.status };
      }
      const message = String(body.message ?? '').toLowerCase();
      const error = res.status >= 500 ? 'unavailable' : message.includes('balance') ? 'billing' : 'rejected';
      // Termii error messages describe the request, not the recipient; safe to keep a short version.
      return { ok: false, error, detail: String(body.message ?? '').slice(0, 80) || undefined, httpStatus: res.status };
    },
  };
}

// Twilio error codes we map specially (https://www.twilio.com/docs/api/errors).
const TWILIO_BILLING = new Set([10001, 20005, 30002]); // account not active / suspended (balance at zero)
const TWILIO_RATE_LIMIT = new Set([20429, 14107]); // too many requests

/** Accepts +234..., 234... or any other international number; Twilio wants E.164 with a plus. */
export function toE164(international: string): string {
  return `+${international.replace(/[^0-9]/g, '')}`;
}

/**
 * Twilio Programmable Messaging: POST {base_url}/2010-04-01/Accounts/{AccountSid}/Messages.json,
 * form-encoded, HTTP Basic auth with the Account SID and Auth Token. `from` is a Twilio number (+1...),
 * an approved alphanumeric sender ID, or a Messaging Service SID (MG...), which Twilio then routes.
 * Test mode uses Twilio's test credentials: requests are checked but nothing is sent or charged.
 */
export function twilio(rt: Runtime, fetchFn: FetchFn = fetch): SmsProvider {
  return {
    async send(to, text) {
      const sid = (rt.config.account_sid ?? '').trim();
      const token = rt.secrets.auth_token;
      const from = (rt.config.from ?? '').trim();
      const base = (rt.config.base_url || 'https://api.twilio.com').replace(/\/+$/, '');
      if (!/^AC[0-9a-fA-F]{32}$/.test(sid) || !token || !from) return { ok: false, error: 'not_configured' };

      const form = new URLSearchParams({ To: toE164(to), Body: text });
      if (/^MG[0-9a-fA-F]{32}$/.test(from)) form.set('MessagingServiceSid', from);
      else form.set('From', from);

      let res: Response;
      try {
        res = await fetchFn(`${base}/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: form.toString(),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        return { ok: false, error: 'unavailable' };
      }

      let body: Record<string, unknown> = {};
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {
        /* keep empty */
      }
      if (res.ok && typeof body.sid === 'string') {
        // A message Twilio already marks failed/undelivered on creation did not go out.
        if (body.status === 'failed' || body.status === 'undelivered') {
          return { ok: false, error: 'rejected', detail: `twilio ${String(body.error_code ?? '')}`.trim(), httpStatus: res.status };
        }
        return { ok: true, value: { messageId: body.sid }, httpStatus: res.status };
      }
      if (res.ok) return { ok: false, error: 'bad_response', httpStatus: res.status };

      const code = Number(body.code);
      const error = TWILIO_BILLING.has(code) ? 'billing'
        : res.status >= 500 || res.status === 429 || TWILIO_RATE_LIMIT.has(code) ? 'unavailable'
        : 'rejected';
      // Only the numeric code is kept: Twilio's message text can repeat the recipient's number.
      return { ok: false, error, detail: Number.isFinite(code) && code > 0 ? `twilio ${code}` : undefined, httpStatus: res.status };
    },
  };
}

export function smsProvider(rt: Runtime, fetchFn: FetchFn = fetch): Result<SmsProvider> {
  switch (rt.provider) {
    case 'mock_sms':
      return { ok: true, value: mockSms };
    case 'termii':
      return { ok: true, value: termii(rt, fetchFn) };
    case 'twilio':
      return { ok: true, value: twilio(rt, fetchFn) };
    default:
      return { ok: false, error: 'not_available', detail: `no SMS adapter for ${rt.provider}` };
  }
}

/** Fills the admin-editable template. Unknown placeholders are left as they are. */
export function renderOtpMessage(template: string | null | undefined, code: string): string {
  const t = template?.trim() || 'Your {brand} code is {code}. Do not share it with anyone.';
  return t.replaceAll('{brand}', BRAND_NAME).replaceAll('{code}', code);
}
