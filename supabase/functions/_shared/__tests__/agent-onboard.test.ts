import { describe, expect, it } from 'vitest';
import { agentSmsText, codeHash, handleAgentOnboard, secureCode } from '../handlers/agent-onboard.ts';
import type { Runtime } from '../providers/types.ts';
import type { ServerEnv } from '../server.ts';

const env: ServerEnv = { url: 'https://proj.supabase.co', serviceKey: 'service', anonKey: 'anon', appEnv: 'development' };
const AGENT = '66666666-6666-6666-6666-666666666666';
const FARMER = '77777777-7777-7777-7777-777777777777';

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const termiiRuntime = (over: Partial<Runtime> = {}): Runtime => ({
  provider: 'termii', kind: 'sms', mode: 'live', implemented: true, test_only: false, missing: [],
  config: { base_url: 'https://v3.api.termii.com', sender_id: 'CultivaNode', channel: 'dnd' },
  secrets: { api_key: 'TL-key' }, ...over,
});

type Opts = {
  runtime?: Runtime;
  startError?: string;
  verifyOk?: boolean;
  verifyError?: string;
  createStatus?: number;
  completeError?: string;
};

function backend(o: Opts = {}) {
  const calls: { url: string; method: string; body: any }[] = [];
  const fn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method: init.method ?? 'GET', body });
    if (url.endsWith('/auth/v1/user')) {
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === 'Bearer agent-token' ? jsonRes({ id: AGENT }) : jsonRes({ msg: 'bad jwt' }, 401);
    }
    if (url.endsWith('/rpc/integration_runtime')) return jsonRes(o.runtime ?? termiiRuntime());
    if (url.endsWith('/rest/v1/integration_events')) return new Response(null, { status: 201 });
    if (url.endsWith('/rpc/agent_onboarding_start')) {
      return o.startError ? jsonRes({ message: o.startError }, 400) : jsonRes({ phone: body.p_phone, agent_name: 'Femi Agent' });
    }
    if (url.endsWith('/rpc/agent_onboarding_verify')) {
      return o.verifyError ? jsonRes({ message: o.verifyError }, 400) : jsonRes({ ok: o.verifyOk ?? true });
    }
    if (url.endsWith('/auth/v1/admin/users') && init.method === 'POST') {
      const status = o.createStatus ?? 200;
      return status === 200 ? jsonRes({ id: FARMER }) : jsonRes({ msg: 'Phone number already registered' }, status);
    }
    if (url.includes('/auth/v1/admin/users/') && init.method === 'DELETE') return jsonRes({});
    if (url.endsWith('/rpc/agent_onboarding_complete')) {
      return o.completeError ? jsonRes({ message: o.completeError }, 400) : jsonRes({ profile_id: body.p_profile });
    }
    if (url.startsWith('https://v3.api.termii.com')) return jsonRes({ code: 'ok', message_id: 'm-1' });
    return jsonRes({ unexpected: url }, 500);
  }) as typeof fetch;
  return { fn, calls };
}

const post = (body: unknown, token = 'agent-token') =>
  new Request('https://proj.supabase.co/functions/v1/agent-onboard', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const confirmBody = (over: Record<string, unknown> = {}) => ({
  action: 'confirm', phone: '0801 111 2222', code: '123456', full_name: 'Gbenga Farmer', state: 'Oyo', lga: 'Iseyin',
  language: 'yo', roles: ['crop_farmer', 'machinery_owner'],
  consents: { terms_of_use: true, privacy_policy: true, data_processing: true, evil: true }, document_version: 'v1', ...over,
});

describe('agent onboarding', () => {
  it('makes 6-digit codes', () => {
    for (let i = 0; i < 50; i++) expect(secureCode()).toMatch(/^[0-9]{6}$/);
  });

  it('writes a plain SMS naming the agent', () => {
    expect(agentSmsText('Femi Agent', '123456')).toBe(
      'Femi Agent is registering you on CultivaNode. If you agree, give them this code: 123456. It expires in 10 minutes.');
  });

  it('refuses callers who are not signed in', async () => {
    const b = backend();
    const res = await handleAgentOnboard(post({ action: 'start', phone: '08011112222' }, 'nope'), { env, fetchFn: b.fn });
    expect(res.status).toBe(401);
  });

  it('refuses a malformed phone number', async () => {
    const b = backend();
    const res = await handleAgentOnboard(post({ action: 'start', phone: '12345' }), { env, fetchFn: b.fn });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_phone' });
  });

  it('stores only a hash of the code and texts the farmer', async () => {
    const b = backend();
    const res = await handleAgentOnboard(post({ action: 'start', phone: '0801 111 2222' }), {
      env, fetchFn: b.fn, randomCode: () => '654321',
    });
    expect(res.status).toBe(200);
    const startCall = b.calls.find((c) => c.url.endsWith('/rpc/agent_onboarding_start'))!;
    expect(startCall.body.p_phone).toBe('2348011112222');
    expect(startCall.body.p_code_hash).toBe(await codeHash(env, '2348011112222', '654321'));
    expect(JSON.stringify(startCall.body)).not.toContain('654321');
    const sms = b.calls.find((c) => c.url.startsWith('https://v3.api.termii.com'))!;
    expect(sms.body.to).toBe('2348011112222');
    expect(sms.body.sms).toContain('654321');
    expect(sms.body.sms).toContain('Femi Agent');
    const event = b.calls.find((c) => c.url.endsWith('/integration_events'))!;
    expect(JSON.stringify(event.body)).not.toContain('2348011112222');
  });

  it('stores no code when SMS cannot be sent', async () => {
    const b = backend({ runtime: termiiRuntime({ missing: ['api_key'] }) });
    const res = await handleAgentOnboard(post({ action: 'start', phone: '08011112222' }), { env, fetchFn: b.fn });
    expect(res.status).toBe(503);
    expect(b.calls.some((c) => c.url.endsWith('/rpc/agent_onboarding_start'))).toBe(false);
  });

  it('maps database refusals to app codes and sends nothing', async () => {
    const b = backend({ startError: 'already_registered' });
    const res = await handleAgentOnboard(post({ action: 'start', phone: '08011112222' }), { env, fetchFn: b.fn });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'already_registered' });
    expect(b.calls.some((c) => c.url.startsWith('https://v3.api.termii.com'))).toBe(false);
  });

  it('needs the farmer to accept the terms and privacy policy before using the code', async () => {
    const b = backend();
    const res = await handleAgentOnboard(post(confirmBody({ consents: { terms_of_use: true } })), { env, fetchFn: b.fn });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'consent_required' });
    expect(b.calls.some((c) => c.url.endsWith('/rpc/agent_onboarding_verify'))).toBe(false);
  });

  it('refuses a wrong code', async () => {
    const b = backend({ verifyOk: false });
    const res = await handleAgentOnboard(post(confirmBody()), { env, fetchFn: b.fn });
    expect(await res.json()).toEqual({ error: 'wrong_code' });
    expect(b.calls.some((c) => c.url.endsWith('/auth/v1/admin/users'))).toBe(false);
  });

  it('reports an expired code', async () => {
    const b = backend({ verifyError: 'code_expired' });
    const res = await handleAgentOnboard(post(confirmBody()), { env, fetchFn: b.fn });
    expect(res.status).toBe(410);
  });

  it('creates a confirmed sign-in and registers only farmer roles', async () => {
    const b = backend();
    const res = await handleAgentOnboard(post(confirmBody()), { env, fetchFn: b.fn });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ profile_id: FARMER });
    const create = b.calls.find((c) => c.url.endsWith('/auth/v1/admin/users'))!;
    expect(create.body).toMatchObject({ phone: '2348011112222', phone_confirm: true });
    const complete = b.calls.find((c) => c.url.endsWith('/rpc/agent_onboarding_complete'))!;
    expect(complete.body.p_agent).toBe(AGENT);
    expect(complete.body.p_roles).toEqual([{ role: 'crop_farmer' }]);
    expect(complete.body.p_consents).toEqual({ terms_of_use: true, privacy_policy: true, data_processing: true });
  });

  it('removes the new sign-in if registration fails', async () => {
    const b = backend({ completeError: 'invalid_name' });
    const res = await handleAgentOnboard(post(confirmBody()), { env, fetchFn: b.fn });
    expect(res.status).toBe(400);
    expect(b.calls.some((c) => c.method === 'DELETE' && c.url.endsWith(`/auth/v1/admin/users/${FARMER}`))).toBe(true);
  });

  it('reports a number that already has an account', async () => {
    const b = backend({ createStatus: 422 });
    const res = await handleAgentOnboard(post(confirmBody()), { env, fetchFn: b.fn });
    expect(res.status).toBe(409);
  });
});
