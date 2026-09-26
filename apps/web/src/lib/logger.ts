// Structured server logs (one JSON line per event, readable in Vercel logs).
// Personal data is redacted before anything is written: never log OTPs, passwords, ID numbers,
// full phone numbers, emails or payment secrets.

type Level = "debug" | "info" | "warn" | "error";

const SECRET_KEYS = /pass(word)?|otp|token|secret|authorization|cookie|nin|bvn|account_?number|card/i;
const PHONE = /(?:\+?234|0)[789][01]\d{8}/g;
const EMAIL = /[^\s@"]+@[^\s@"]+\.[^\s@"]+/g;

function redactString(value: string): string {
  return value.replace(PHONE, (m) => `***${m.slice(-4)}`).replace(EMAIL, "[email]");
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[depth]";
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEYS.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function write(level: Level, event: string, data?: Record<string, unknown>) {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...(redact(data ?? {}) as object) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") write("debug", event, data);
  },
  info: (event: string, data?: Record<string, unknown>) => write("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => write("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => write("error", event, data),
};
