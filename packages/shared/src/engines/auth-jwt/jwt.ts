// Stateless JWT implementation using the Web Crypto API (HMAC-SHA256).
// Zero external dependencies; works in Node.js, Next.js, Edge Functions, and modern web environments.

export interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

export interface JwtPayload {
  sub: string; // User ID or subject
  iss?: string; // Issuer
  aud?: string; // Audience
  exp: number; // Expiration timestamp (seconds since epoch)
  nbf?: number; // Not before (seconds since epoch)
  iat: number; // Issued at (seconds since epoch)
  roles?: string[]; // Application roles
  tier?: number; // Verification tier (0, 1, 2, 3)
  orgId?: string; // Organization / business ID
  permissions?: string[]; // Granular permissions
  [key: string]: unknown;
}

export interface VerifyJwtResult<T extends JwtPayload = JwtPayload> {
  valid: boolean;
  payload?: T;
  error?: 'expired' | 'invalid_signature' | 'malformed' | 'not_yet_valid' | 'missing_secret';
}

function toBase64(binary: string): string {
  if (typeof btoa !== 'undefined') return btoa(binary);
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(binary, 'binary').toString('base64');
  }
  throw new Error('No base64 encoder available');
}

function fromBase64(b64: string): string {
  if (typeof atob !== 'undefined') return atob(b64);
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(b64, 'base64').toString('binary');
  }
  throw new Error('No base64 decoder available');
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof buffer === 'string') {
    bytes = new TextEncoder().encode(buffer);
  } else if (buffer instanceof Uint8Array) {
    bytes = buffer;
  } else {
    bytes = new Uint8Array(buffer);
  }

  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  const base64 = toBase64(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = fromBase64(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecodeString(str: string): string {
  const bytes = base64UrlDecode(str);
  return new TextDecoder().decode(bytes);
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Signs a stateless JWT with HMAC-SHA256 (HS256). */
export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'> & { exp?: number; expiresInSeconds?: number },
  secret: string
): Promise<string> {
  if (!secret) throw new Error('JWT secret is required');

  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = payload.exp ?? nowSeconds + (payload.expiresInSeconds ?? 3600); // Default 1 hour
  const { expiresInSeconds: _omit, ...restPayload } = payload;

  const fullPayload: JwtPayload = {
    ...restPayload,
    iat: nowSeconds,
    exp,
    sub: String(payload.sub),
  };

  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  );

  const encodedSignature = base64UrlEncode(signatureBuffer);
  return `${message}.${encodedSignature}`;
}

/** Verifies a stateless JWT token signature and expiration. */
export async function verifyJwt<T extends JwtPayload = JwtPayload>(
  token: string,
  secret: string
): Promise<VerifyJwtResult<T>> {
  if (!secret) return { valid: false, error: 'missing_secret' };
  if (!token || typeof token !== 'string') return { valid: false, error: 'malformed' };

  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, error: 'malformed' };

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  try {
    const key = await getHmacKey(secret);
    const message = `${headerB64}.${payloadB64}`;
    const signatureBytes = base64UrlDecode(signatureB64);

    const isSigValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      new TextEncoder().encode(message)
    );

    if (!isSigValid) {
      return { valid: false, error: 'invalid_signature' };
    }

    const payloadJson = base64UrlDecodeString(payloadB64);
    const payload = JSON.parse(payloadJson) as T;

    const nowSeconds = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < nowSeconds) {
      return { valid: false, error: 'expired', payload };
    }

    if (payload.nbf && payload.nbf > nowSeconds) {
      return { valid: false, error: 'not_yet_valid', payload };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'malformed' };
  }
}

/** Decodes payload without signature verification (useful for client inspection). */
export function decodeJwt<T extends JwtPayload = JwtPayload>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = base64UrlDecodeString(parts[1]!);
    return JSON.parse(payloadJson) as T;
  } catch {
    return null;
  }
}
