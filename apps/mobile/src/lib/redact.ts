// Removes personal data from anything the app reports (crash reports, breadcrumbs).
// Same rules as the website logger: never send OTPs, tokens, ID numbers, full phone numbers or emails.
// No React Native imports, so it is unit-tested in Node.

const SECRET_KEYS = /pass(word)?|otp|code|token|secret|authorization|cookie|nin|bvn|account_?number|card|phone|email/i;
const PHONE = /(?:\+?234|0)[789][01]\d{8}/g;
const EMAIL = /[^\s@"]+@[^\s@"]+\.[^\s@"]+/g;
// OTPs, NIN/BVN and account numbers are runs of 6 or more digits once phones are handled.
const DIGITS = /\b\d{6,}\b/g;
const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

export function redactString(value: string): string {
  return value
    .replace(JWT, '[token]')
    .replace(PHONE, (m) => `***${m.slice(-4)}`)
    .replace(EMAIL, '[email]')
    .replace(DIGITS, '[number]');
}

export function redact<T>(value: T, depth = 0): T {
  if (depth > 6) return '[depth]' as T;
  if (typeof value === 'string') return redactString(value) as T;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEYS.test(k) ? '[redacted]' : redact(v, depth + 1);
    }
    return out as T;
  }
  return value;
}
