// Booking SMS wording. The database queues facts (sms_outbox.data); this turns them into one short message in the
// recipient's language. No phone numbers, prices or reasons go in an SMS: the details are in the app.
// Yorùbá wording is pending native review (see docs/ROADMAP.md, W4).
import { BRAND_NAME } from './brand.ts';

export type BookingSmsKind = 'booking_requested' | 'booking_accepted' | 'booking_declined' | 'booking_cancelled' | 'booking_expired';
export type SmsLanguage = 'en' | 'yo';

export type BookingSmsData = { title?: unknown; job_date?: unknown; name?: unknown };

const SITE = 'cultivanode.com';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TEMPLATES: Record<SmsLanguage, Record<BookingSmsKind, string>> = {
  en: {
    booking_requested: '{brand}: {name} wants {title} on {date}. Accept or decline: {site}/en/account/bookings',
    booking_accepted: '{brand}: {name} accepted your request for {title} on {date}. Their number: {site}/en/account/bookings',
    booking_declined: '{brand}: {name} cannot do {title} on {date}. Find another provider: {site}/en/account/find',
    booking_cancelled: '{brand}: {name} called off {title} on {date}. Details: {site}/en/account/bookings',
    booking_expired: '{brand}: Your request for {title} on {date} got no answer. Search again: {site}/en/account/find',
  },
  yo: {
    booking_requested: '{brand}: {name} fẹ́ {title} ní {date}. Gbà á tàbí kọ̀ ọ́ kí àkókò tó tán: {site}/yo/account/bookings',
    booking_accepted: '{brand}: {name} ti gba ìbéèrè rẹ fún {title} ní {date}. Wo nọ́mbà fóònù rẹ̀: {site}/yo/account/bookings',
    booking_declined: '{brand}: {name} kò lè ṣe {title} ní {date}. Wá ẹlòmíì: {site}/yo/account/find',
    booking_cancelled: '{brand}: {name} ti fagi lé {title} ní {date}. Wo àlàyé: {site}/yo/account/bookings',
    booking_expired: '{brand}: Kò sí ìdáhùn sí ìbéèrè rẹ fún {title} ní {date}, ó ti parí. Tún wá: {site}/yo/account/find',
  },
};

const FALLBACK_NAME: Record<SmsLanguage, string> = { en: 'Someone', yo: 'Ẹnìkan' };

export function isBookingSmsKind(kind: string): kind is BookingSmsKind {
  return kind in TEMPLATES.en;
}

/** One line, no control characters, at most `max` characters (ASCII dots so the message stays GSM-7 where it can). */
export function clip(value: unknown, max: number): string {
  const s = String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 3).trimEnd()}...` : s;
}

/** 2026-09-30 -> "30 Sep" (English) or "30/09" (Yorùbá). Anything else -> "". */
export function smsDate(isoDate: unknown, lang: SmsLanguage): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate ?? ''));
  if (!m) return '';
  const month = Number(m[2]);
  if (month < 1 || month > 12) return '';
  return lang === 'yo' ? `${m[3]}/${m[2]}` : `${Number(m[3])} ${MONTHS[month - 1]}`;
}

/** The message for a queued booking SMS, or null when the kind is unknown or the facts are missing. */
export function renderBookingSms(kind: string, data: BookingSmsData, language: string | null | undefined): string | null {
  if (!isBookingSmsKind(kind)) return null;
  const lang: SmsLanguage = language === 'yo' ? 'yo' : 'en'; // Pidgin readers get English for now.
  const title = clip(data.title, 30);
  const date = smsDate(data.job_date, lang);
  if (!title || !date) return null;
  const name = clip(data.name, 20) || FALLBACK_NAME[lang];
  const values: Record<string, string> = { brand: BRAND_NAME, site: SITE, name, title, date };
  // One pass, so text typed by people (a title with "{date}" in it) is never filled in again.
  return TEMPLATES[lang][kind].replace(/\{(brand|site|name|title|date)\}/g, (_, k: string) => values[k]);
}
