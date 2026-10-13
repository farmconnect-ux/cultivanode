// Number formatting shared by the live account pages. Money is stored in kobo (1/100 naira).

const ng = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat("en-NG", opts);
const whole = ng({ maximumFractionDigits: 0 });
const one = ng({ maximumFractionDigits: 1 });
const two = ng({ maximumFractionDigits: 2 });

/** Kobo to "₦1,234,500". */
export function naira(kobo: number | null | undefined): string {
  return `₦${whole.format(Math.round(Number(kobo ?? 0) / 100))}`;
}

/** Kobo to a short naira figure: ₦4.9m, ₦312k, ₦850. */
export function nairaShort(kobo: number | null | undefined): string {
  const n = Number(kobo ?? 0) / 100;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `₦${one.format(n / 1e9)}bn`;
  if (abs >= 1e6) return `₦${one.format(n / 1e6)}m`;
  if (abs >= 1e3) return `₦${whole.format(n / 1e3)}k`;
  return `₦${whole.format(n)}`;
}

export function num(n: number | null | undefined, digits: 0 | 1 | 2 = 0): string {
  const v = Number(n ?? 0);
  return (digits === 0 ? whole : digits === 1 ? one : two).format(v);
}

/** Kilograms, switching to tonnes from 1,000 kg. */
export function mass(kg: number | null | undefined): string {
  const v = Number(kg ?? 0);
  return v >= 1000 ? `${one.format(v / 1000)} t` : `${whole.format(v)} kg`;
}

export function pct(n: number | null | undefined, digits: 0 | 1 = 0): string {
  return `${(digits ? one : whole).format(Number(n ?? 0))}%`;
}

/** Share of a whole as 0–100, safe for a zero whole. */
export function share(part: number, total: number): number {
  return total > 0 ? Math.max(0, Math.min(100, (part / total) * 100)) : 0;
}

/** Whole days from today to an ISO date (negative when in the past). */
export function daysFromToday(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime();
  const t = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime();
  return Math.round((d - t) / 86_400_000);
}

/** "in 3 days", "today", "2 days ago". */
export function relDays(iso: string | null | undefined): string {
  const n = daysFromToday(iso);
  if (n === null) return "—";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** "3 h ago" style for timestamps. */
export function ago(iso: string | null | undefined): string {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

/** snake_case to "Sentence case". */
export function label(v: string | null | undefined): string {
  if (!v) return "—";
  const s = v.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Request-time clock for server components (keeps render helpers free of direct Date.now calls). */
export function nowMs(): number {
  return Date.now();
}
