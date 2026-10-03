import { describe, expect, it } from 'vitest';
import { clip, renderBookingSms, smsDate } from '../booking-sms.ts';
import { handleSendNotifications } from '../handlers/send-notifications.ts';
import type { Runtime } from '../providers/types.ts';
import type { ServerEnv } from '../server.ts';

const SECRET = 'a'.repeat(64);
const env: ServerEnv = { url: 'https://proj.supabase.co', serviceKey: 'service', anonKey: 'anon', appEnv: 'production' };
const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const data = { title: 'Lanre 75hp tractor', job_date: '2026-10-02', name: 'Kemi' };

describe('booking SMS wording', () => {
  it('words each booking change in English', () => {
    expect(renderBookingSms('booking_requested', data, 'en')).toBe(
      'CultivaNode: Kemi wants Lanre 75hp tractor on 2 Oct. Accept or decline: cultivanode.com/en/account/bookings');
    expect(renderBookingSms('booking_accepted', data, 'en')).toContain('accepted your request');
    expect(renderBookingSms('booking_declined', data, 'en')).toContain('/en/account/find');
    expect(renderBookingSms('booking_cancelled', data, 'pcm')).toContain('called off'); // Pidgin readers get English
    expect(renderBookingSms('booking_expired', data, null)).toContain('got no answer');
  });

  it('words them in Yorùbá with a numeric date', () => {
    const yo = renderBookingSms('booking_accepted', data, 'yo');
    expect(yo).toContain('Kemi ti gba ìbéèrè rẹ');
    expect(yo).toContain('02/10');
    expect(yo).toContain('/yo/account/bookings');
  });

  it('keeps messages short and never fills in text people typed', () => {
    const long = renderBookingSms('booking_requested', { ...data, title: 'A {date} tractor with a very long name indeed' }, 'en')!;
    expect(long).toContain('A {date} tractor with a ver...');
    for (const kind of ['booking_requested', 'booking_accepted', 'booking_declined', 'booking_cancelled', 'booking_expired',
                        'job_checked_in', 'proof_submitted', 'booking_confirmed', 'booking_disputed', 'booking_completed',
                        'payment_marked', 'payment_mismatch']) {
      expect(renderBookingSms(kind, { title: 'x'.repeat(80), job_date: '2026-12-31', name: 'y'.repeat(40) }, 'en')!.length)
        .toBeLessThanOrEqual(160);
    }
  });

  it('words every kind the database queues by SMS (week 3 job flow included), in both languages', () => {
    // Kinds that private.notify(..., true) can queue; rating_received and booking_auto_confirmed are inbox-only.
    const queued = ['booking_requested', 'booking_accepted', 'booking_declined', 'booking_cancelled', 'booking_expired',
      'job_checked_in', 'proof_submitted', 'booking_confirmed', 'booking_disputed', 'booking_completed',
      'payment_marked', 'payment_mismatch'];
    for (const kind of queued) {
      expect(renderBookingSms(kind, data, 'en'), kind).toMatch(/^CultivaNode: /);
      expect(renderBookingSms(kind, data, 'yo'), kind).toContain('/yo/account/');
    }
    expect(renderBookingSms('proof_submitted', data, 'en')).toContain('48 hours');
  });

  it('refuses unknown kinds and missing facts', () => {
    expect(renderBookingSms('password_reset', data, 'en')).toBeNull();
    expect(renderBookingSms('booking_accepted', { ...data, job_date: 'soon' }, 'en')).toBeNull();
    expect(renderBookingSms('booking_accepted', { ...data, title: '  ' }, 'en')).toBeNull();
    expect(renderBookingSms('booking_accepted', { ...data, name: '' }, 'en')).toContain('Someone accepted');
  });

  it('formats dates and clips text', () => {
    expect(smsDate('2026-09-30', 'en')).toBe('30 Sep');
    expect(smsDate('2026-13-01', 'en')).toBe('');
    expect(clip('line\nbreak\ttab', 40)).toBe('line break tab');
  });
});

type Row = { id: string; kind: string; data: Record<string, unknown>; phone: string | null; language: string | null; attempts: number };

function backend(opts: { runtime?: Partial<Runtime>; rows?: Row[]; authorized?: boolean; provider?: (body: unknown) => Response }) {
  const calls: { url: string; body: unknown }[] = [];
  const fn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    let body: unknown;
    try { body = init.body ? JSON.parse(String(init.body)) : undefined; } catch { body = String(init.body); }
    calls.push({ url, body });
    if (url.endsWith('/rpc/notify_worker_authorized')) return jsonRes(opts.authorized ?? (body as { p_secret: string }).p_secret === SECRET);
    if (url.endsWith('/rpc/integration_runtime')) {
      return jsonRes({ provider: 'termii', kind: 'sms', mode: 'live', implemented: true, test_only: false, missing: [],
        config: { base_url: 'https://v3.api.termii.com', sender_id: 'CultivaNode', channel: 'dnd' }, secrets: { api_key: 'k' }, ...opts.runtime });
    }
    if (url.endsWith('/rpc/claim_sms_outbox')) return jsonRes(opts.rows ?? []);
    if (url.endsWith('/rpc/finish_sms_outbox')) return new Response(null, { status: 204 });
    if (url.endsWith('/rest/v1/integration_events')) return new Response(null, { status: 201 });
    if (url.includes('termii.com')) return (opts.provider ?? (() => jsonRes({ code: 'ok', message_id: 'm1' })))(body);
    return jsonRes({ unexpected: url }, 500);
  }) as typeof fetch;
  return { fn, calls };
}

const wake = (secret = SECRET) =>
  new Request('https://x/send-notifications', { method: 'POST', headers: { 'x-worker-secret': secret }, body: '{}' });

const rows: Row[] = [
  { id: 'r1', kind: 'booking_requested', data, phone: '2348031234567', language: 'en', attempts: 1 },
  { id: 'r2', kind: 'booking_accepted', data, phone: '2348031234568', language: 'yo', attempts: 1 },
];

describe('send-notifications worker', () => {
  it('refuses callers without the worker secret', async () => {
    const b = backend({});
    expect((await handleSendNotifications(wake('b'.repeat(64)), { env, fetchFn: b.fn })).status).toBe(401);
    expect((await handleSendNotifications(wake('short'), { env, fetchFn: b.fn })).status).toBe(401);
    expect(b.calls.some((c) => c.url.endsWith('/rpc/claim_sms_outbox'))).toBe(false);
  });

  it('sends each claimed message in its language and records the result', async () => {
    const b = backend({ rows });
    const res = await handleSendNotifications(wake(), { env, fetchFn: b.fn });
    expect(await res.json()).toEqual({ claimed: 2, sent: 2, failed: 0 });
    const sms = b.calls.filter((c) => c.url.includes('termii.com')).map((c) => c.body as { to: string; sms: string });
    expect(sms.map((s) => s.to)).toEqual(['2348031234567', '2348031234568']);
    expect(sms[1].sms).toContain('ti gba ìbéèrè rẹ');
    const finished = b.calls.filter((c) => c.url.endsWith('/rpc/finish_sms_outbox')).map((c) => c.body);
    expect(finished[0]).toEqual({ p_id: 'r1', p_ok: true, p_provider: 'termii', p_message_id: 'm1', p_error: null, p_retry: false });
    // The health log never holds the number or the text.
    const logs = JSON.stringify(b.calls.filter((c) => c.url.endsWith('/integration_events')));
    expect(logs).not.toContain('803123');
    expect(logs).not.toContain('tractor');
  });

  it('puts messages back for a retry when the provider is down, and fails bad ones for good', async () => {
    const b = backend({
      rows: [...rows, { id: 'r3', kind: 'booking_expired', data, phone: null, language: 'en', attempts: 1 }],
      provider: () => jsonRes({ message: 'server error' }, 503),
    });
    const res = await handleSendNotifications(wake(), { env, fetchFn: b.fn });
    expect(await res.json()).toEqual({ claimed: 3, sent: 0, failed: 3 });
    const finished = b.calls.filter((c) => c.url.endsWith('/rpc/finish_sms_outbox')).map((c) => c.body as Record<string, unknown>);
    expect(finished.map((f) => [f.p_id, f.p_error, f.p_retry])).toEqual([
      ['r1', 'unavailable', true], ['r2', 'unavailable', true], ['r3', 'bad_message', false]]);
  });

  it('leaves the queue alone when no working provider is active', async () => {
    const b = backend({ rows, runtime: { provider: 'mock_sms', test_only: true } });
    const res = await handleSendNotifications(wake(), { env, fetchFn: b.fn });
    expect(res.status).toBe(503);
    expect(b.calls.some((c) => c.url.endsWith('/rpc/claim_sms_outbox'))).toBe(false);
  });

  it('only answers POST', async () => {
    const b = backend({});
    expect((await handleSendNotifications(new Request('https://x/send-notifications'), { env, fetchFn: b.fn })).status).toBe(405);
  });
});
