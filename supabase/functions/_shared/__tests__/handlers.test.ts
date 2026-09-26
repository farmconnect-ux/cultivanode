import { describe, expect, it } from 'vitest';
import { handleIntegrationTest } from '../handlers/integration-test.ts';
import { handleSendSms } from '../handlers/send-sms.ts';
import { handleVerifyIdentity, MAX_ATTEMPTS_PER_DAY } from '../handlers/verify-identity.ts';
import type { Runtime } from '../providers/types.ts';
import type { ServerEnv } from '../server.ts';
import { signWebhook } from '../webhook.ts';

const env: ServerEnv = { url: 'https://proj.supabase.co', serviceKey: 'service', anonKey: 'anon', appEnv: 'development' };
const HOOK_SECRET = 'v1,whsec_' + btoa('hook-secret-for-tests-0123456789');
const USER = '11111111-1111-1111-1111-111111111111';

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

type Backend = {
  runtime: Runtime;
  consent?: boolean;
  fullName?: string | null;
  recent?: number;
  alreadyVerified?: boolean;
  isStaff?: boolean;
  providerResponse?: (url: string, init: RequestInit) => Response;
};

/** A fake Supabase (auth, database API) plus a fake provider, recording every call. */
function backend(b: Backend) {
  const calls: { url: string; body: unknown }[] = [];
  const fn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body });
    if (url.endsWith('/auth/v1/user')) {
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === 'Bearer user-token' ? jsonRes({ id: USER }) : jsonRes({ msg: 'bad jwt' }, 401);
    }
    if (url.endsWith('/rpc/integration_runtime')) return jsonRes(b.runtime);
    if (url.endsWith('/rpc/has_permission')) return jsonRes(b.isStaff ?? false);
    if (url.endsWith('/rest/v1/integration_events')) return new Response(null, { status: 201 });
    if (url.includes('/rest/v1/current_consents')) return jsonRes(b.consent === false ? [] : [{ granted: true }]);
    if (url.includes('/rest/v1/profiles') && url.includes('select=full_name')) return jsonRes([{ full_name: b.fullName ?? 'Ada Obi' }]);
    if (url.includes('/rest/v1/profiles') && url.includes('select=verification_tier')) return jsonRes([{ verification_tier: 1 }]);
    if (url.includes('status=eq.verified')) return jsonRes(b.alreadyVerified ? [{ id: 'x' }] : []);
    if (url.includes('/rest/v1/verifications') || url.includes('/rest/v1/bank_accounts')) {
      return jsonRes(Array.from({ length: b.recent ?? 0 }, (_, i) => ({ id: i })));
    }
    if (url.endsWith('/rpc/record_identity_verification') || url.endsWith('/rpc/record_bank_account_verification')) {
      return jsonRes({ status: body.p_verified ? 'verified' : 'failed', failure_reason: body.p_failure ?? null });
    }
    if (b.providerResponse) return b.providerResponse(url, init);
    return jsonRes({ unexpected: url }, 500);
  }) as typeof fetch;
  return { fn, calls };
}

const smsRuntime = (over: Partial<Runtime> = {}): Runtime => ({
  provider: 'termii', kind: 'sms', mode: 'live', implemented: true, test_only: false, missing: [],
  config: { base_url: 'https://v3.api.termii.com', sender_id: 'CultivaNode', channel: 'dnd', message_template: 'Code {code}' },
  secrets: { api_key: 'TL-key' }, ...over,
});

const idRuntime = (over: Partial<Runtime> = {}): Runtime => ({
  provider: 'mock_identity', kind: 'identity', mode: 'test', implemented: true, test_only: true, missing: [],
  config: {}, secrets: {}, hash_pepper: 'pepper', ...over,
});

async function hookRequest(payload: unknown, secret = HOOK_SECRET) {
  const body = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  const signature = await signWebhook(secret, 'msg_1', ts, body);
  return new Request('https://x/send-sms', {
    method: 'POST', body,
    headers: { 'webhook-id': 'msg_1', 'webhook-timestamp': ts, 'webhook-signature': signature },
  });
}

describe('send-sms hook', () => {
  const payload = { user: { phone: '2348031234567' }, sms: { otp: '482913' } };

  it('delivers the code through the active provider and logs the call without the number', async () => {
    const { fn, calls } = backend({ runtime: smsRuntime(), providerResponse: () => jsonRes({ code: 'ok', message_id: '1' }) });
    const res = await handleSendSms(await hookRequest(payload), { env, hookSecret: HOOK_SECRET, fetchFn: fn });
    expect(res.status).toBe(200);
    const sent = calls.find((c) => c.url.includes('termii'));
    expect(sent?.body).toMatchObject({ to: '2348031234567', sms: 'Code 482913', from: 'CultivaNode' });
    const logged = calls.find((c) => c.url.endsWith('/integration_events'));
    expect(logged?.body).toMatchObject({ kind: 'sms', provider: 'termii', operation: 'otp', success: true });
    expect(JSON.stringify(logged?.body)).not.toContain('2348031234567');
    expect(JSON.stringify(logged?.body)).not.toContain('482913');
  });

  it('rejects an unsigned or wrongly signed request without calling anything', async () => {
    const { fn, calls } = backend({ runtime: smsRuntime() });
    const res = await handleSendSms(await hookRequest(payload, 'v1,whsec_' + btoa('wrong')), { env, hookSecret: HOOK_SECRET, fetchFn: fn });
    expect(res.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it('returns a generic error when the provider fails', async () => {
    const { fn } = backend({ runtime: smsRuntime(), providerResponse: () => jsonRes({ message: 'Insufficient balance' }, 400) });
    const res = await handleSendSms(await hookRequest(payload), { env, hookSecret: HOOK_SECRET, fetchFn: fn });
    expect(res.status).toBe(502);
    expect((await res.json()).error.message).not.toMatch(/balance|termii/i);
  });

  it('refuses a test-only provider in production', async () => {
    const { fn, calls } = backend({ runtime: smsRuntime({ provider: 'mock_sms', test_only: true }) });
    const res = await handleSendSms(await hookRequest(payload), { env: { ...env, appEnv: 'production' }, hookSecret: HOOK_SECRET, fetchFn: fn });
    expect(res.status).toBe(500);
    expect(calls.some((c) => c.url.endsWith('/integration_events'))).toBe(true);
  });
});

const idRequest = (body: unknown, token = 'user-token') =>
  new Request('https://x/verify-identity', {
    method: 'POST', body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

describe('verify-identity', () => {
  it('needs a signed-in user', async () => {
    const { fn } = backend({ runtime: idRuntime() });
    const res = await handleVerifyIdentity(idRequest({ action: 'nin', number: '12345678901' }, 'bad'), { env, fetchFn: fn });
    expect(res.status).toBe(401);
  });

  it('validates the number before spending anything', async () => {
    const { fn, calls } = backend({ runtime: idRuntime() });
    const res = await handleVerifyIdentity(idRequest({ action: 'nin', number: '123' }), { env, fetchFn: fn });
    expect(res.status).toBe(400);
    expect(calls.some((c) => c.url.includes('rpc/record'))).toBe(false);
  });

  it('requires data-processing consent', async () => {
    const { fn } = backend({ runtime: idRuntime(), consent: false });
    const res = await handleVerifyIdentity(idRequest({ action: 'nin', number: '12345678901' }), { env, fetchFn: fn });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'consent_required' });
  });

  it('limits attempts per day', async () => {
    const { fn } = backend({ runtime: idRuntime(), recent: MAX_ATTEMPTS_PER_DAY });
    const res = await handleVerifyIdentity(idRequest({ action: 'bvn', number: '12345678901' }), { env, fetchFn: fn });
    expect(res.status).toBe(429);
  });

  it('refuses a second NIN check once verified', async () => {
    const { fn } = backend({ runtime: idRuntime(), alreadyVerified: true });
    const res = await handleVerifyIdentity(idRequest({ action: 'nin', number: '12345678901' }), { env, fetchFn: fn });
    expect(res.status).toBe(409);
  });

  it('records a verified NIN with only a masked number and a fingerprint', async () => {
    const { fn, calls } = backend({ runtime: idRuntime() });
    const res = await handleVerifyIdentity(idRequest({ action: 'nin', number: '12345678901' }), { env, fetchFn: fn });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'verified', tier: 1 });
    const saved = calls.find((c) => c.url.endsWith('/rpc/record_identity_verification'))!.body as Record<string, unknown>;
    expect(saved).toMatchObject({ p_profile: USER, p_kind: 'nin', p_masked: '*******8901', p_verified: true });
    expect(saved.p_id_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(calls.map((c) => c.body))).not.toContain('12345678901');
  });

  it('fails a NIN whose name does not match the profile', async () => {
    const { fn, calls } = backend({
      runtime: idRuntime({ provider: 'prembly', test_only: false,
        config: { base_url: 'https://api.prembly.com', nin_path: '/verification/vnin' }, secrets: { api_key: 'k' } }),
      providerResponse: () => jsonRes({ status: true, response_code: '00', data: { firstname: 'MUSA', surname: 'BELLO' } }),
    });
    const res = await handleVerifyIdentity(idRequest({ action: 'nin', number: '12345678901' }), { env, fetchFn: fn });
    expect(await res.json()).toMatchObject({ status: 'failed', failure_reason: 'name_mismatch' });
    expect(calls.find((c) => c.url.endsWith('/rpc/record_identity_verification'))!.body).toMatchObject({ p_provider: 'prembly' });
  });

  it('does not record anything when the provider is down', async () => {
    const { fn, calls } = backend({
      runtime: idRuntime({ provider: 'prembly', test_only: false,
        config: { base_url: 'https://api.prembly.com', bvn_path: '/verification/bvn_validation' }, secrets: { api_key: 'k' } }),
      providerResponse: () => jsonRes({ status: false, response_code: '02' }),
    });
    const res = await handleVerifyIdentity(idRequest({ action: 'bvn', number: '12345678901' }), { env, fetchFn: fn });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'provider_unavailable' });
    expect(calls.some((c) => c.url.includes('rpc/record'))).toBe(false);
  });

  it('records a bank account with the last four digits only', async () => {
    const { fn, calls } = backend({ runtime: idRuntime() });
    const res = await handleVerifyIdentity(idRequest({ action: 'bank_account', number: '0123456789', bank_code: '044' }), { env, fetchFn: fn });
    expect(await res.json()).toMatchObject({ status: 'verified' });
    expect(calls.find((c) => c.url.endsWith('/rpc/record_bank_account_verification'))!.body)
      .toMatchObject({ p_last4: '6789', p_bank_name: 'Access Bank (test)', p_account_name: 'Ada Obi' });
    expect(JSON.stringify(calls.map((c) => c.body))).not.toContain('0123456789');
  });

  it('says the service is not ready when the active provider is missing its key', async () => {
    const { fn } = backend({ runtime: idRuntime({ provider: 'prembly', test_only: false, missing: ['key:api_key'] }) });
    const res = await handleVerifyIdentity(idRequest({ action: 'nin', number: '12345678901' }), { env, fetchFn: fn });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'service_not_ready' });
  });
});

describe('integration-test', () => {
  const req = (body: unknown) => new Request('https://x/integration-test', {
    method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer user-token' } });

  it('is for integrations.manage only', async () => {
    const { fn } = backend({ runtime: smsRuntime(), isStaff: false });
    expect((await handleIntegrationTest(req({ kind: 'sms', provider: 'termii', to: '08031234567' }), { env, fetchFn: fn })).status).toBe(403);
  });

  it('sends a test SMS through the named provider', async () => {
    const { fn, calls } = backend({ runtime: smsRuntime(), isStaff: true, providerResponse: () => jsonRes({ code: 'ok', message_id: '1' }) });
    const res = await handleIntegrationTest(req({ kind: 'sms', provider: 'termii', to: '0803 123 4567' }), { env, fetchFn: fn });
    expect(await res.json()).toMatchObject({ ok: true });
    expect(calls.find((c) => c.url.endsWith('/rpc/integration_runtime'))!.body).toEqual({ p_kind: 'sms', p_provider: 'termii' });
    expect(calls.find((c) => c.url.includes('termii'))!.body).toMatchObject({ to: '2348031234567' });
  });

  it('shows the provider message to staff when a test fails', async () => {
    const { fn } = backend({ runtime: smsRuntime(), isStaff: true, providerResponse: () => jsonRes({ message: 'ApplicationSenderId not found' }, 404) });
    const res = await handleIntegrationTest(req({ kind: 'sms', provider: 'termii', to: '08031234567' }), { env, fetchFn: fn });
    expect(await res.json()).toMatchObject({ ok: false, error: 'rejected', detail: 'ApplicationSenderId not found' });
  });

  it('lists what is missing instead of calling the provider', async () => {
    const { fn } = backend({ runtime: smsRuntime({ missing: ['key:api_key'] }), isStaff: true });
    const res = await handleIntegrationTest(req({ kind: 'sms', provider: 'termii', to: '08031234567' }), { env, fetchFn: fn });
    expect(await res.json()).toMatchObject({ ok: false, error: 'not_configured', missing: ['key:api_key'] });
  });

  it('never runs a real ID check in live mode', async () => {
    const { fn, calls } = backend({
      runtime: idRuntime({ provider: 'prembly', mode: 'live', test_only: false,
        config: { base_url: 'https://api.prembly.com', nin_path: '/verification/vnin' }, secrets: { api_key: 'k' } }),
      isStaff: true,
      providerResponse: () => jsonRes({ status: true, response_code: '00', data: [{ code: '044', name: 'Access Bank' }] }),
    });
    const res = await handleIntegrationTest(req({ kind: 'identity', provider: 'prembly' }), { env, fetchFn: fn });
    expect(await res.json()).toMatchObject({ ok: true, check: 'bank_list', banks: 1 });
    expect(calls.some((c) => c.url.includes('/verification/vnin'))).toBe(false);
  });
});
