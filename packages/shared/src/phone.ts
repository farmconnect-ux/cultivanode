// Nigerian phone numbers, normalised to 234XXXXXXXXXX (13 digits, no plus).
// Mirrors private.normalize_ng_phone() in the database so the website can show errors before sending.

/** Returns 234XXXXXXXXXX, null for empty input, or 'invalid'. */
export function normalizeNgPhone(input: string | null | undefined): string | null | 'invalid' {
  const d = (input ?? '').replace(/[^0-9]/g, '');
  if (d === '') return null;
  if (/^0[0-9]{10}$/.test(d)) return `234${d.slice(1)}`;
  if (/^234[0-9]{10}$/.test(d)) return d;
  if (/^[789][01][0-9]{8}$/.test(d)) return `234${d}`;
  return 'invalid';
}

/** 2348031234567 -> "0803 123 4567" for display. */
export function formatNgPhone(normalized: string): string {
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

export function isValidEmail(input: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.trim());
}
