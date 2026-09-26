// "Send test" button on the admin Integrations page. Staff with integrations.manage only.
// SMS: sends a harmless test message. Identity: in test mode runs the provider's sandbox NIN;
// in live mode only fetches the bank list (free, no personal data).
import { BRAND_NAME } from '../brand.ts';
import { fail, json, preflight } from '../http.ts';
import { identityProvider } from '../providers/identity.ts';
import { smsProvider } from '../providers/sms.ts';
import type { FetchFn } from '../providers/types.ts';
import { currentUserId, getRuntime, logEvent, rpcAsUser, runtimeProblem, type ServerEnv } from '../server.ts';

export type IntegrationTestDeps = { env: ServerEnv; fetchFn?: FetchFn };

/** Prembly's documented sandbox NIN; the mock provider accepts it too. */
export const SANDBOX_NIN = '12345678901';

function normalizeNgPhone(input: string): string | null {
  const d = input.replace(/[^0-9]/g, '');
  if (/^0[0-9]{10}$/.test(d)) return `234${d.slice(1)}`;
  if (/^234[0-9]{10}$/.test(d)) return d;
  return null;
}

export async function handleIntegrationTest(req: Request, deps: IntegrationTestDeps): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return fail('method_not_allowed', 405);
  const { env } = deps;
  const fetchFn = deps.fetchFn ?? fetch;
  const auth = req.headers.get('Authorization');

  const userId = await currentUserId(env, auth, fetchFn);
  if (!userId || !auth) return fail('not_signed_in', 401);
  const allowed = await rpcAsUser<boolean>(env, auth, 'has_permission', { p_permission: 'integrations.manage' }, fetchFn)
    .catch(() => false);
  if (allowed !== true) return fail('forbidden', 403);

  let body: { kind?: unknown; provider?: unknown; to?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail('invalid_request', 400);
  }
  if ((body.kind !== 'sms' && body.kind !== 'identity') || typeof body.provider !== 'string') {
    return fail('invalid_request', 400);
  }

  let rt;
  try {
    rt = await getRuntime(env, body.kind, body.provider, fetchFn);
  } catch {
    return fail('unknown_provider', 404);
  }
  const problem = runtimeProblem(rt, env.appEnv);
  if (problem) return json({ ok: false, error: problem, missing: rt.missing });

  const started = Date.now();
  if (body.kind === 'sms') {
    const to = typeof body.to === 'string' ? normalizeNgPhone(body.to) : null;
    if (!to) return fail('invalid_phone', 400);
    const adapter = smsProvider(rt, fetchFn);
    if (!adapter.ok) return json({ ok: false, error: adapter.error });
    const r = await adapter.value.send(to, `Test message from ${BRAND_NAME} admin. No action needed.`);
    await logEvent(env, { kind: 'sms', provider: rt.provider, mode: rt.mode, operation: 'test', success: r.ok,
      http_status: r.httpStatus, error_code: r.ok ? undefined : r.error, duration_ms: Date.now() - started }, fetchFn);
    return json(r.ok ? { ok: true, mode: rt.mode } : { ok: false, error: r.error, detail: r.detail, mode: rt.mode });
  }

  const adapter = identityProvider(rt, fetchFn);
  if (!adapter.ok) return json({ ok: false, error: adapter.error });
  if (rt.mode === 'live') {
    const r = await adapter.value.listBanks();
    await logEvent(env, { kind: 'identity', provider: rt.provider, mode: rt.mode, operation: 'test', success: r.ok,
      http_status: r.httpStatus, error_code: r.ok ? undefined : r.error, duration_ms: Date.now() - started }, fetchFn);
    return json(r.ok ? { ok: true, mode: rt.mode, check: 'bank_list', banks: r.value.length }
                     : { ok: false, error: r.error, detail: r.detail, mode: rt.mode });
  }
  const r = await adapter.value.verifyNin(SANDBOX_NIN, { profileName: 'Test Person' });
  await logEvent(env, { kind: 'identity', provider: rt.provider, mode: rt.mode, operation: 'test', success: r.ok,
    http_status: r.httpStatus, error_code: r.ok ? undefined : r.error, duration_ms: Date.now() - started }, fetchFn);
  return json(r.ok ? { ok: true, mode: rt.mode, check: 'sandbox_nin', found: r.value.found, name_returned: r.value.fullName !== '' }
                   : { ok: false, error: r.error, detail: r.detail, mode: rt.mode });
}
