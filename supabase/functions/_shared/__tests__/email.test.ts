import { describe, expect, it } from 'vitest';
import enAccount from '../../../../apps/web/src/i18n/dictionaries/en-account.ts';
import yoAccount from '../../../../apps/web/src/i18n/dictionaries/yo-account.ts';
import { ALERT_TEXT, FARM_ALERT_KINDS, alertSentence, renderFarmAlertEmail } from '../farm-alert-email.ts';
import { handleSendEmail } from '../handlers/send-email.ts';
import { base64Utf8, buildMime, emailProvider, isEmailAddress, resend, smtp, type SmtpConn, type SmtpConnector } from '../providers/email.ts';
import type { Runtime } from '../providers/types.ts';
import type { ServerEnv } from '../server.ts';

const env: ServerEnv = { url: 'https://proj.supabase.co', serviceKey: 'service', anonKey: 'anon', appEnv: 'production' };
const SECRET = 'w'.repeat(40);
const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const rt = (over: Partial<Runtime> = {}): Runtime => ({
  provider: 'resend', kind: 'email', mode: 'live', implemented: true, test_only: false, missing: [],
  config: { from_email: 'alerts@cultivanode.com', from_name: 'CultivaNode', reply_to: null },
  secrets: { api_key: 're_test' }, ...over,
});
const message = { to: 'ada@example.com', subject: 'Hello', text: 'Plain', html: '<p>Plain</p>' };

describe('email addresses', () => {
  it('accepts normal addresses and refuses header tricks', () => {
    expect(isEmailAddress('ada.obi@farm.com.ng')).toBe(true);
    expect(isEmailAddress('ada@farm')).toBe(false);
    expect(isEmailAddress('ada@farm.com\r\nBcc: x@y.com')).toBe(false);
    expect(isEmailAddress('"a"@b.com')).toBe(false);
    expect(isEmailAddress(null)).toBe(false);
  });
});

describe('Resend adapter', () => {
  it('sends from the configured address and returns the message id', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fn = (async (url: RequestInfo | URL, init: RequestInit = {}) => {
      calls.push({ url: String(url), init });
      return jsonRes({ id: 'msg_1' });
    }) as typeof fetch;
    const r = await resend(rt({ config: { from_email: 'alerts@cultivanode.com', from_name: 'CultivaNode', reply_to: 'help@cultivanode.com' } }), fn).send(message);
    expect(r).toMatchObject({ ok: true, value: { messageId: 'msg_1' } });
    expect(calls[0]!.url).toBe('https://api.resend.com/emails');
    expect((calls[0]!.init.headers as Record<string, string>).Authorization).toBe('Bearer re_test');
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      from: 'CultivaNode <alerts@cultivanode.com>', to: ['ada@example.com'], subject: 'Hello', text: 'Plain', html: '<p>Plain</p>',
      reply_to: 'help@cultivanode.com',
    });
  });

  it('maps errors: a bad key is rejected, an outage is worth retrying', async () => {
    const bad = (async () => jsonRes({ name: 'invalid_api_key', message: 'API key is invalid' }, 401)) as typeof fetch;
    expect(await resend(rt(), bad).send(message)).toMatchObject({ ok: false, error: 'rejected', detail: 'invalid_api_key' });
    const down = (async () => jsonRes({}, 503)) as typeof fetch;
    expect(await resend(rt(), down).send(message)).toMatchObject({ ok: false, error: 'unavailable' });
    const busy = (async () => jsonRes({ name: 'rate_limit_exceeded' }, 429)) as typeof fetch;
    expect(await resend(rt(), busy).send(message)).toMatchObject({ ok: false, error: 'unavailable' });
    const offline = (async () => { throw new Error('offline'); }) as typeof fetch;
    expect(await resend(rt(), offline).send(message)).toMatchObject({ ok: false, error: 'unavailable' });
  });

  it('does not call Resend without a key or a valid sender', async () => {
    let called = false;
    const fn = (async () => { called = true; return jsonRes({ id: 'x' }); }) as typeof fetch;
    expect(await resend(rt({ secrets: {} }), fn).send(message)).toMatchObject({ ok: false, error: 'not_configured' });
    expect(await resend(rt({ config: { from_email: 'nope' } }), fn).send(message)).toMatchObject({ ok: false, error: 'not_configured' });
    expect(called).toBe(false);
  });
});

/** A scripted SMTP server: each command the client writes gets the next reply. */
function fakeSmtp(replies: Record<string, string>, opts: { greeting?: string } = {}) {
  const written: string[] = [];
  const events: string[] = [];
  const make = (label: string): SmtpConn => {
    const queue: string[] = [];
    let waiting: ((s: string) => void) | null = null;
    const push = (s: string) => (waiting ? (waiting(s), (waiting = null)) : queue.push(s));
    if (label === 'plain' || label === 'tls') push(opts.greeting ?? '220 mail.example.com ESMTP\r\n');
    let pending = '';
    return {
      async read(buf) {
        const s = queue.shift() ?? (await new Promise<string>((r) => (waiting = r)));
        const b = new TextEncoder().encode(s);
        buf.set(b);
        return b.length;
      },
      async write(data) {
        pending += new TextDecoder().decode(data);
        // DATA body ends with "\r\n.\r\n"; commands end with "\r\n".
        const inData = written.at(-1) === 'DATA';
        if (inData ? !pending.endsWith('\r\n.\r\n') : !pending.endsWith('\r\n')) return data.length;
        const line = inData ? '<body>' : pending.trimEnd();
        if (inData) events.push(pending);
        pending = '';
        written.push(line);
        const key = Object.keys(replies).find((k) => line.startsWith(k));
        if (key) push(replies[key]!);
        return data.length;
      },
      close() {
        events.push(`close:${label}`);
      },
    };
  };
  const connector: SmtpConnector = {
    async connect(host, port, tls) {
      events.push(`connect:${host}:${port}:${tls ? 'tls' : 'plain'}`);
      return make(tls ? 'tls' : 'plain');
    },
    async startTls() {
      events.push('starttls');
      return make('upgraded');
    },
  };
  return { connector, written, events };
}

const smtpRt = (config: Record<string, string | null> = {}) => rt({
  provider: 'smtp', secrets: { password: 'pw' },
  config: { host: 'smtp.example.com', port: '465', security: 'tls', username: 'user@example.com', from_email: 'alerts@cultivanode.com', from_name: 'CultivaNode', ...config },
});

const OK_REPLIES = {
  EHLO: '250-mail.example.com\r\n250-AUTH LOGIN PLAIN\r\n250 8BITMIME\r\n',
  'AUTH PLAIN': '235 ok\r\n',
  'MAIL FROM': '250 ok\r\n',
  'RCPT TO': '250 ok\r\n',
  DATA: '354 go ahead\r\n',
  '<body>': '250 2.0.0 Ok: queued as ABC123XYZ\r\n',
};

describe('SMTP adapter', () => {
  it('sends over TLS with AUTH PLAIN and returns the queue id', async () => {
    const s = fakeSmtp(OK_REPLIES);
    const r = await smtp(smtpRt(), s.connector, 2000).send(message);
    expect(r).toMatchObject({ ok: true, value: { messageId: 'ABC123XYZ' } });
    expect(s.events[0]).toBe('connect:smtp.example.com:465:tls');
    expect(s.written).toEqual([
      'EHLO cultivanode', `AUTH PLAIN ${base64Utf8('\u0000user@example.com\u0000pw')}`,
      'MAIL FROM:<alerts@cultivanode.com>', 'RCPT TO:<ada@example.com>', 'DATA', '<body>', 'QUIT',
    ]);
    expect(s.events).toContain('close:tls');
  });

  it('upgrades with STARTTLS and uses AUTH LOGIN when that is all the server offers', async () => {
    const s = fakeSmtp({
      ...OK_REPLIES,
      EHLO: '250-mail.example.com\r\n250-STARTTLS\r\n250 AUTH LOGIN\r\n',
      STARTTLS: '220 go\r\n',
      'AUTH LOGIN': '334 VXNlcm5hbWU6\r\n',
      [base64Utf8('user@example.com')]: '334 UGFzc3dvcmQ6\r\n',
      [base64Utf8('pw')]: '235 ok\r\n',
    });
    const r = await smtp(smtpRt({ port: '2525', security: 'starttls' }), s.connector, 2000).send(message);
    expect(r.ok).toBe(true);
    expect(s.events.slice(0, 2)).toEqual(['connect:smtp.example.com:2525:plain', 'starttls']);
    expect(s.written.slice(0, 6)).toEqual(['EHLO cultivanode', 'STARTTLS', 'EHLO cultivanode', 'AUTH LOGIN',
      base64Utf8('user@example.com'), base64Utf8('pw')]);
  });

  it('reports a refused login as rejected and a busy server as worth retrying', async () => {
    const bad = fakeSmtp({ ...OK_REPLIES, 'AUTH PLAIN': '535 5.7.8 bad credentials\r\n' });
    expect(await smtp(smtpRt(), bad.connector, 2000).send(message)).toMatchObject({ ok: false, error: 'rejected', detail: 'smtp 535' });
    const busy = fakeSmtp(OK_REPLIES, { greeting: '421 try later\r\n' });
    expect(await smtp(smtpRt(), busy.connector, 2000).send(message)).toMatchObject({ ok: false, error: 'unavailable', detail: 'smtp 421' });
  });

  it('refuses ports the Edge network blocks, and incomplete settings, without connecting', async () => {
    const s = fakeSmtp(OK_REPLIES);
    expect(await smtp(smtpRt({ port: '587' }), s.connector).send(message)).toMatchObject({ ok: false, error: 'not_available', detail: 'port_blocked' });
    expect(await smtp(smtpRt({ host: 'bad host' }), s.connector).send(message)).toMatchObject({ ok: false, error: 'not_configured' });
    expect(s.events).toEqual([]);
  });

  it('gives up after the timeout', async () => {
    const s = fakeSmtp({}, { greeting: '' });
    expect(await smtp(smtpRt(), s.connector, 50).send(message)).toMatchObject({ ok: false, error: 'unavailable', detail: 'timeout' });
  });
});

describe('MIME message', () => {
  it('encodes Yorùbá subjects and bodies as UTF-8 and keeps headers on one line each', () => {
    const mime = buildMime({ ...message, subject: 'Ìkìlọ̀ oko\r\nBcc: x@y.com', text: 'Ẹ n lẹ́' },
      { from: 'alerts@cultivanode.com', name: 'CultivaNode', replyTo: null }, new Date('2026-11-24T05:00:00Z'), 'id1');
    const headers = mime.split('\r\n\r\n')[0]!.split('\r\n');
    expect(headers.some((h) => h.startsWith('Bcc'))).toBe(false);
    expect(headers).toContain(`Subject: =?UTF-8?B?${base64Utf8('Ìkìlọ̀ oko Bcc: x@y.com')}?=`);
    expect(headers).toContain('Message-ID: <id1@cultivanode.com>');
    expect(mime).toContain(base64Utf8('Ẹ n lẹ́'));
    expect(mime.endsWith('--b-id1--\r\n')).toBe(true);
  });
});

describe('email provider choice', () => {
  it('picks the adapter by provider code', () => {
    expect(emailProvider(rt({ provider: 'mock_email' })).ok).toBe(true);
    expect(emailProvider(rt({ provider: 'smtp' })).ok).toBe(true);
    expect(emailProvider(rt({ provider: 'pigeon' }))).toMatchObject({ ok: false, error: 'not_available' });
  });
});

describe('farm alert email wording', () => {
  it('matches the website inbox sentences in both languages', () => {
    const web = { en: enAccount.acct.inbox.kinds as Record<string, string>, yo: yoAccount.acct.inbox.kinds as Record<string, string> };
    for (const lang of ['en', 'yo'] as const) {
      for (const k of FARM_ALERT_KINDS) expect(ALERT_TEXT[lang][k], `${lang}.${k}`).toBe(web[lang][k]);
    }
  });

  it('fills in the alert and skips kinds it does not know', () => {
    expect(alertSentence({ kind: 'farm_stock_expiring', data: { title: 'Herbicide', name: 'North farm', job_date: '2026-12-03' } }, 'en'))
      .toBe('Herbicide on North farm expires on 3 Dec. Use it before then or set it aside.');
    expect(alertSentence({ kind: 'booking_requested', data: {} }, 'en')).toBeNull();
  });

  it('writes one digest per person with a link to the inbox, escaping what farmers typed', () => {
    const m = renderFarmAlertEmail('ada@example.com', [
      { kind: 'farm_stock_low', data: { title: '<b>Urea</b>', name: 'Ada & Sons', note: '2 bags' } },
      { kind: 'farm_task_overdue', data: { title: 'Weeding', name: 'Ada & Sons', job_date: '2026-11-20' } },
    ], 'en', 'Ada Obi')!;
    expect(m.subject).toBe('CultivaNode: 2 farm alerts');
    expect(m.text).toContain('Hello Ada,');
    expect(m.text).toContain('- Low stock on Ada & Sons: <b>Urea</b> is down to 2 bags.');
    expect(m.html).toContain('&lt;b&gt;Urea&lt;/b&gt;');
    expect(m.html).not.toContain('<b>Urea');
    expect(m.html).toContain('href="https://cultivanode.com/en/account/inbox"');
  });

  it('writes in Yorùbá for Yorùbá speakers', () => {
    const m = renderFarmAlertEmail('ada@example.com', [{ kind: 'farm_stock_low', data: { title: 'NPK', name: 'Oko', note: '1' } }], 'yo', null)!;
    expect(m.subject.startsWith('Ìkìlọ̀ oko CultivaNode:')).toBe(true);
    expect(m.text).toContain('Ẹ n lẹ́ àgbẹ̀,');
    expect(m.text).toContain('/yo/account/inbox');
  });

  it('sends nothing when no alert can be worded', () => {
    expect(renderFarmAlertEmail('ada@example.com', [{ kind: 'other', data: null }], 'en', null)).toBeNull();
  });
});

type Row = { id: string; profile_id: string; kind: string; data: Record<string, unknown>; email: string | null; full_name: string | null; language: string | null; attempts: number };
const outRow = (id: string, profile: string, over: Partial<Row> = {}): Row => ({
  id, profile_id: profile, kind: 'farm_stock_low', data: { title: 'Urea', name: 'North farm', note: '2 bags' },
  email: `${profile}@example.com`, full_name: 'Ada Obi', language: 'en', attempts: 0, ...over,
});

function worker(o: { rt?: Partial<Runtime>; rows?: Row[]; resendStatus?: number } = {}) {
  const calls: { url: string; body?: unknown }[] = [];
  const fn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body });
    if (url.endsWith('/rpc/notify_worker_authorized')) return jsonRes((body as { p_secret: string }).p_secret === SECRET);
    if (url.endsWith('/rpc/integration_runtime')) return jsonRes({ ...rt(), ...o.rt });
    if (url.endsWith('/rpc/claim_email_outbox')) return jsonRes(o.rows ?? []);
    if (url.endsWith('/rpc/finish_email_outbox')) return jsonRes(null);
    if (url.endsWith('/rest/v1/integration_events')) return new Response(null, { status: 201 });
    if (url === 'https://api.resend.com/emails') {
      return o.resendStatus ? jsonRes({ name: 'application_error' }, o.resendStatus) : jsonRes({ id: `m-${calls.length}` });
    }
    return jsonRes({ unexpected: url }, 500);
  }) as typeof fetch;
  return { fn, calls };
}
const workerReq = (secret: string | null = SECRET) =>
  new Request('https://proj.supabase.co/functions/v1/send-email', { method: 'POST', headers: secret ? { 'x-worker-secret': secret } : {} });

describe('send-email worker', () => {
  it('refuses callers without the worker secret', async () => {
    const w = worker();
    expect((await handleSendEmail(workerReq(null), { env, fetchFn: w.fn })).status).toBe(401);
    expect((await handleSendEmail(new Request('https://x', { method: 'GET' }), { env, fetchFn: w.fn })).status).toBe(405);
    expect(w.calls.some((c) => c.url.includes('claim_email_outbox'))).toBe(false);
  });

  it('leaves the queue alone while the provider is missing its key', async () => {
    const w = worker({ rt: { missing: ['key:api_key'] } });
    const res = await handleSendEmail(workerReq(), { env, fetchFn: w.fn });
    expect(res.status).toBe(503);
    expect(w.calls.some((c) => c.url.includes('claim_email_outbox'))).toBe(false);
  });

  it('sends one email per person and records each batch', async () => {
    const w = worker({ rows: [outRow('a1', 'ada'), outRow('b1', 'bola'), outRow('a2', 'ada', { kind: 'farm_task_overdue' })] });
    const res = await handleSendEmail(workerReq(), { env, fetchFn: w.fn });
    expect(await res.json()).toEqual({ claimed: 3, emails: 2, sent: 2, failed: 0 });
    const sends = w.calls.filter((c) => c.url === 'https://api.resend.com/emails');
    expect(sends.map((c) => (c.body as { to: string[] }).to[0])).toEqual(['ada@example.com', 'bola@example.com']);
    const finishes = w.calls.filter((c) => c.url.endsWith('/rpc/finish_email_outbox')).map((c) => c.body as Record<string, unknown>);
    expect(finishes[0]).toMatchObject({ p_ids: ['a1', 'a2'], p_ok: true, p_provider: 'resend', p_retry: false });
    expect(JSON.stringify(w.calls.filter((c) => c.url.endsWith('integration_events')).map((c) => c.body))).not.toContain('@example.com');
  });

  it('asks for a retry when the provider is down, and not when the address is bad', async () => {
    const down = worker({ rows: [outRow('a1', 'ada')], resendStatus: 503 });
    await handleSendEmail(workerReq(), { env, fetchFn: down.fn });
    expect(down.calls.find((c) => c.url.endsWith('/rpc/finish_email_outbox'))!.body).toMatchObject({ p_ok: false, p_retry: true });

    const bad = worker({ rows: [outRow('a1', 'ada', { email: 'not-an-address' })] });
    const res = await handleSendEmail(workerReq(), { env, fetchFn: bad.fn });
    expect(await res.json()).toMatchObject({ sent: 0, failed: 1 });
    expect(bad.calls.find((c) => c.url.endsWith('/rpc/finish_email_outbox'))!.body).toMatchObject({ p_error: 'bad_message', p_retry: false });
    expect(bad.calls.some((c) => c.url === 'https://api.resend.com/emails')).toBe(false);
  });
});
