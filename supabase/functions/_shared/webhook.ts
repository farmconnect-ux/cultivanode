// Standard Webhooks signature check, as used by Supabase Auth hooks.
// Secret format from the dashboard: "v1,whsec_<base64>". Signed content: "<id>.<timestamp>.<body>".
import { base64ToBytes, bytesToBase64, hmacSha256, safeEqual } from './crypto.ts';

const TOLERANCE_SECONDS = 5 * 60;

export type WebhookHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

export function webhookHeaders(h: Headers): WebhookHeaders {
  return {
    id: h.get('webhook-id'),
    timestamp: h.get('webhook-timestamp'),
    signature: h.get('webhook-signature'),
  };
}

function secretBytes(secret: string): Uint8Array<ArrayBuffer> {
  const trimmed = secret.trim().replace(/^v1,/, '').replace(/^whsec_/, '');
  return base64ToBytes(trimmed);
}

export async function signWebhook(secret: string, id: string, timestamp: string, body: string): Promise<string> {
  const sig = await hmacSha256(secretBytes(secret), `${id}.${timestamp}.${body}`);
  return `v1,${bytesToBase64(sig)}`;
}

/** True only for a correctly signed, recent request. */
export async function verifyWebhook(
  secret: string,
  headers: WebhookHeaders,
  body: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;
  const ts = Number(headers.timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) return false;
  let expected: string;
  try {
    expected = await signWebhook(secret, headers.id, headers.timestamp, body);
  } catch {
    return false;
  }
  // The header may carry several space-separated signatures (key rotation).
  return headers.signature.split(' ').some((candidate) => safeEqual(candidate, expected));
}
