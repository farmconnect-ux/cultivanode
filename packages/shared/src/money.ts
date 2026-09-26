// All money is stored and calculated in kobo (1 naira = 100 kobo) as whole numbers.
// Never use floating-point naira for prices, commissions or balances.

const KOBO_PER_NAIRA = 100;

/** Converts a naira amount typed by a user (e.g. "25,000.50") into kobo. Returns null if invalid. */
export function nairaToKobo(input: string | number): number | null {
  const text = typeof input === 'number' ? input.toString() : input.replace(/[,\s₦]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const kobo = Number(whole) * KOBO_PER_NAIRA + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(kobo) ? kobo : null;
}

/** Formats kobo for display, e.g. 2500000 -> "₦25,000". Shows kobo only when there are any. */
export function formatNaira(kobo: number): string {
  if (!Number.isSafeInteger(kobo)) throw new RangeError('Amount must be a whole number of kobo.');
  const negative = kobo < 0;
  const abs = Math.abs(kobo);
  const naira = Math.floor(abs / KOBO_PER_NAIRA);
  const rest = abs % KOBO_PER_NAIRA;
  const nairaText = naira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const text = rest === 0 ? nairaText : `${nairaText}.${rest.toString().padStart(2, '0')}`;
  return `${negative ? '-' : ''}₦${text}`;
}

/** Percentage of an amount in kobo, rounded to the nearest kobo (half away from zero). */
export function percentOfKobo(kobo: number, percent: number): number {
  if (!Number.isSafeInteger(kobo)) throw new RangeError('Amount must be a whole number of kobo.');
  return Math.round((kobo * percent) / 100);
}
