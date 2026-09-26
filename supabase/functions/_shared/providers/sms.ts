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

export function smsProvider(rt: Runtime, fetchFn: FetchFn = fetch): Result<SmsProvider> {
  switch (rt.provider) {
    case 'mock_sms':
      return { ok: true, value: mockSms };
    case 'termii':
      return { ok: true, value: termii(rt, fetchFn) };
    default:
      return { ok: false, error: 'not_available', detail: `no SMS adapter for ${rt.provider}` };
  }
}

/** Fills the admin-editable template. Unknown placeholders are left as they are. */
export function renderOtpMessage(template: string | null | undefined, code: string): string {
  const t = template?.trim() || 'Your {brand} code is {code}. Do not share it with anyone.';
  return t.replaceAll('{brand}', BRAND_NAME).replaceAll('{code}', code);
}
