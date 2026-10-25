// Dates as farmers read them: "Due today", "In 3 days", "12 Nov".
import { fill } from '../i18n';
import type { Dictionary } from '../i18n/en';

const DAY = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function daysFromToday(iso: string, now = new Date()): number {
  return Math.round((Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) - Date.parse(`${isoDay(now)}T00:00:00Z`)) / DAY);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "30 Jan" (the year only when it isn't this year). */
export function shortDate(iso: string, now = new Date()): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]}${y !== now.getUTCFullYear() ? ` ${y}` : ''}`;
}

/** "Due today", "1 day late", "Tomorrow", "In 4 days", or the date when it is more than a week away. */
export function whenLabel(iso: string, t: Dictionary['home'], now = new Date()): string {
  const n = daysFromToday(iso, now);
  if (n === 0) return t.dueToday;
  if (n === -1) return t.lateOne;
  if (n < 0) return fill(t.late, { n: -n });
  if (n === 1) return t.tomorrow;
  if (n <= 7) return fill(t.inDays, { n });
  return shortDate(iso, now);
}

export function greeting(t: Dictionary['home'], now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? t.morning : h < 17 ? t.afternoon : t.evening;
}
