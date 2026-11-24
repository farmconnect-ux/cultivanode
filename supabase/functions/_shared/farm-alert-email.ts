// Farm alert email wording. The database queues facts (email_outbox.data); this turns one person's queued
// alerts into one email (a digest) in their language. The alert sentences match the website inbox
// (apps/web/src/i18n/dictionaries/*-account.ts, inbox.kinds); a unit test fails if they drift apart.
// Yorùbá wording is pending native review.
import { BRAND_NAME } from './brand.ts';
import type { EmailMessage } from './providers/types.ts';

export const FARM_ALERT_KINDS = [
  'farm_operation_upcoming',
  'farm_operation_overdue',
  'farm_task_overdue',
  'farm_soil_test_needed',
  'farm_weather_risk',
  'farm_stock_low',
  'farm_stock_expiring',
] as const;
export type FarmAlertKind = (typeof FARM_ALERT_KINDS)[number];
export type EmailLanguage = 'en' | 'yo';

export const SITE_URL = 'https://cultivanode.com';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ALERT_TEXT: Record<EmailLanguage, Record<FarmAlertKind, string>> = {
  en: {
    farm_operation_upcoming: 'Coming up on {name}: {title} is planned for {date}.',
    farm_operation_overdue: 'Overdue on {name}: {title} was planned for {date} and is not marked done.',
    farm_task_overdue: 'Overdue task on {name}: {title} was due on {date}.',
    farm_soil_test_needed: '{title} on {name} is planned for {date}, but this plot has no soil test from the last 2 years. Test the soil first so the right amount can be worked out.',
    farm_weather_risk: 'Weather risk on {name}: {title} is planned for {date}, and the forecast shows {note}. Consider moving it to a drier, calmer day.',
    farm_stock_low: 'Low stock on {name}: {title} is down to {note}. Restock before your next job needs it.',
    farm_stock_expiring: '{title} on {name} expires on {date}. Use it before then or set it aside.',
  },
  yo: {
    farm_operation_upcoming: 'Ó ń bọ̀ ní {name}: a ti ṣètò {title} fún {date}.',
    farm_operation_overdue: 'Ó ti pẹ́ ní {name}: a ṣètò {title} fún {date}, a kò sì tíì sàmì sí i pé ó ti parí.',
    farm_task_overdue: 'Iṣẹ́ tó ti pẹ́ ní {name}: {title} yẹ kó parí ní {date}.',
    farm_soil_test_needed: 'A ti ṣètò {title} ní {name} fún {date}, ṣùgbọ́n kò sí àyẹ̀wò ilẹ̀ fún oko yìí láàrin ọdún méjì sẹ́yìn. Ṣe àyẹ̀wò ilẹ̀ kí a lè mọ ìwọ̀n tó tọ́.',
    farm_weather_risk: 'Ewu ojú ọjọ́ ní {name}: a ti ṣètò {title} fún {date}, àsọtẹ́lẹ̀ ojú ọjọ́ sì fi {note} hàn. Ronú láti sún un sí ọjọ́ tí ó gbẹ, tí afẹ́fẹ́ kò le.',
    farm_stock_low: 'Ohun èlò ti fẹ́ tán ní {name}: {title} kù sí {note}. Ra òmíràn kí iṣẹ́ rẹ tó ń bọ̀ tó nílò rẹ̀.',
    farm_stock_expiring: '{title} ní {name} yóò bàjẹ́ ní {date}. Lò ó ṣáájú ọjọ́ náà tàbí kí o yà á sọ́tọ̀.',
  },
};

const FRAME: Record<EmailLanguage, { subjectOne: string; subjectMany: string; hello: string; intro: string; open: string; footer: string }> = {
  en: {
    subjectOne: '{brand} farm alert: {first}',
    subjectMany: '{brand}: {n} farm alerts',
    hello: 'Hello {person},',
    intro: 'Here is what needs your attention on your farm:',
    open: 'Open your inbox to mark each alert useful, not useful or done: {link}',
    footer: 'You get these emails because farm alerts are on for your {brand} account. To stop them, turn off "Email me farm alerts" in your inbox: {link}',
  },
  yo: {
    subjectOne: 'Ìkìlọ̀ oko {brand}: {first}',
    subjectMany: '{brand}: ìkìlọ̀ oko {n}',
    hello: 'Ẹ n lẹ́ {person},',
    intro: 'Èyí ni ohun tó nílò àkíyèsí rẹ lórí oko rẹ:',
    open: 'Ṣí àpótí ìfiránṣẹ́ rẹ láti sàmì sí ìkìlọ̀ kọ̀ọ̀kan pé ó wúlò, kò wúlò, tàbí ó ti parí: {link}',
    footer: 'O ń gba àwọn ímeèlì yìí nítorí pé ìkìlọ̀ oko wà ní títàn fún àkáǹtì {brand} rẹ. Láti dá wọn dúró, pa "Fi ìkìlọ̀ oko ránṣẹ́ sí ímeèlì mi" nínú àpótí ìfiránṣẹ́ rẹ: {link}',
  },
};

export type QueuedAlert = { kind: string; data: Record<string, unknown> | null };

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '');

function shortDate(v: unknown): string {
  const s = typeof v === 'string' ? v : '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return '';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ''}`.trim();
}

const fill = (t: string, values: Record<string, string>) => t.replace(/\{(\w+)\}/g, (all, k: string) => (k in values ? values[k]! : all));

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const isKind = (k: string): k is FarmAlertKind => (FARM_ALERT_KINDS as readonly string[]).includes(k);

/** One alert sentence, or null for a kind this email does not know. */
export function alertSentence(a: QueuedAlert, lang: EmailLanguage): string | null {
  if (!isKind(a.kind)) return null;
  const d = a.data ?? {};
  return fill(ALERT_TEXT[lang][a.kind], {
    title: text(d.title, 120),
    name: text(d.name, 120),
    note: text(d.note, 120),
    date: shortDate(d.job_date),
  });
}

/** The digest for one person, or null when none of the alerts can be worded. */
export function renderFarmAlertEmail(
  to: string,
  alerts: QueuedAlert[],
  language: string | null,
  fullName: string | null,
): EmailMessage | null {
  const lang: EmailLanguage = language === 'yo' ? 'yo' : 'en';
  const lines = alerts.map((a) => alertSentence(a, lang)).filter((s): s is string => !!s);
  if (!lines.length) return null;
  const f = FRAME[lang];
  const link = `${SITE_URL}/${lang}/account/inbox`;
  const person = text(fullName, 80).split(' ')[0] || (lang === 'yo' ? 'àgbẹ̀' : 'farmer');
  const first = lines[0]!.length > 70 ? `${lines[0]!.slice(0, 67)}...` : lines[0]!;
  const subject = lines.length === 1
    ? fill(f.subjectOne, { brand: BRAND_NAME, first })
    : fill(f.subjectMany, { brand: BRAND_NAME, n: String(lines.length) });
  const hello = fill(f.hello, { person });
  const open = fill(f.open, { link });
  const footer = fill(f.footer, { brand: BRAND_NAME, link });

  const plain = [hello, '', f.intro, '', ...lines.map((l) => `- ${l}`), '', open, '', '--', footer].join('\n');
  const html = [
    `<!doctype html><html lang="${lang}"><body style="font-family:Arial,Helvetica,sans-serif;color:#0b1c30;line-height:1.5;max-width:560px">`,
    `<p>${escapeHtml(hello)}</p>`,
    `<p>${escapeHtml(f.intro)}</p>`,
    `<ul>${lines.map((l) => `<li style="margin-bottom:8px">${escapeHtml(l)}</li>`).join('')}</ul>`,
    `<p><a href="${link}" style="color:#00694c;font-weight:bold">${escapeHtml(open.replace(`: ${link}`, ''))}</a></p>`,
    `<hr style="border:none;border-top:1px solid #d5dbe1"><p style="font-size:12px;color:#5b6670">${escapeHtml(footer.replace(`: ${link}`, '.'))}</p>`,
    '</body></html>',
  ].join('');
  return { to, subject, text: plain, html };
}
