// Nigerian phone numbers to 234XXXXXXXXXX. Same rules as packages/shared/src/phone.ts and
// private.normalize_ng_phone() in the database (kept here because Edge Functions deploy on their own).
export function normalizeNgPhone(input: string | null | undefined): string | null | 'invalid' {
  const d = (input ?? '').replace(/[^0-9]/g, '');
  if (d === '') return null;
  if (/^0[0-9]{10}$/.test(d)) return `234${d.slice(1)}`;
  if (/^234[0-9]{10}$/.test(d)) return d;
  if (/^[789][01][0-9]{8}$/.test(d)) return `234${d}`;
  return 'invalid';
}
