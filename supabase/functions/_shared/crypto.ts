// Small crypto helpers on the Web Crypto API (works in Deno, Node 22 and browsers).

const enc = new TextEncoder();

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (const b of view) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function hmacKey(key: Uint8Array<ArrayBuffer> | string): Promise<CryptoKey> {
  const raw = typeof key === 'string' ? enc.encode(key) : key;
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export async function hmacSha256(key: Uint8Array<ArrayBuffer> | string, message: string): Promise<Uint8Array> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(key), enc.encode(message));
  return new Uint8Array(sig);
}

/** Constant-time comparison of two strings of possibly different length. */
export function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * One-way fingerprint of an ID number, keyed with a secret pepper kept in Supabase Vault.
 * Lets the database spot one NIN/BVN/account on two profiles without ever storing the number.
 */
export async function idFingerprint(pepper: string, kind: string, value: string): Promise<string> {
  return toHex(await hmacSha256(pepper, `${kind}:${value.replace(/\s+/g, '')}`));
}

/** "12345678901" -> "*******8901" (the only form the database accepts). */
export function maskId(value: string): string {
  const v = value.replace(/\s+/g, '');
  return `${'*'.repeat(Math.max(v.length - 4, 1))}${v.slice(-4)}`;
}
