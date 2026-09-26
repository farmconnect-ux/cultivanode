// Field-agent assisted onboarding (REQ-AGT-001).
//
//   start:   the agent enters the farmer's phone number; the farmer gets an SMS code through the SMS provider
//            chosen in the admin console. Reading the code back to the agent is the farmer's agreement.
//   confirm: the agent types the code with the farmer's details; the function creates the farmer's sign-in
//            (phone already proven by the code), links the farmer to the agent and records the consents.
//
// Codes are never stored: only an HMAC of phone and code, keyed with the service key (server-only).
import { BRAND_NAME } from '../brand.ts';
import { hmacSha256, toHex } from '../crypto.ts';
import { fail, json, preflight } from '../http.ts';
import { normalizeNgPhone } from '../phone.ts';
import { smsProvider } from '../providers/sms.ts';
import type { FetchFn } from '../providers/types.ts';
import { currentUserId, getRuntime, logEvent, rpcResult, runtimeProblem, type ServerEnv } from '../server.ts';

export type AgentOnboardDeps = { env: ServerEnv; fetchFn?: FetchFn; randomCode?: () => string };

export const CODE_TTL_SECONDS = 600;

const FARMER_ROLES = new Set(['crop_farmer', 'animal_farmer']);
const LANGUAGES = new Set(['en', 'yo', 'pcm']);
const CONSENT_KEYS = new Set([
  'terms_of_use', 'privacy_policy', 'data_processing', 'marketing_messages',
  'share_with_lenders', 'share_with_buyers', 'share_with_investors', 'share_with_partners',
]);

// Database exception messages (agent_onboarding_* functions) -> app error codes and HTTP status.
const DB_ERRORS: Record<string, number> = {
  not_field_agent: 403,
  invalid_phone: 400,
  own_number: 400,
  already_registered: 409,
  rate_limited: 429,
  code_expired: 410,
  too_many_attempts: 429,
  profile_not_new: 409,
  invalid_name: 400,
  invalid_version: 400,
};

function dbFailure(message: string): Response {
  const code = Object.keys(DB_ERRORS).find((k) => message === k);
  return code ? fail(code, DB_ERRORS[code]!) : fail('server_error', 500);
}

export function secureCode(): string {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(n[0]! % 1_000_000).padStart(6, '0');
}

export async function codeHash(env: ServerEnv, phone: string, code: string): Promise<string> {
  return toHex(await hmacSha256(env.serviceKey, `agent-onboarding:${phone}:${code}`));
}

export function agentSmsText(agentName: string, code: string): string {
  const name = agentName.trim().slice(0, 40) || 'A field agent';
  return `${name} is registering you on ${BRAND_NAME}. If you agree, give them this code: ${code}. It expires in 10 minutes.`;
}

type Body = Record<string, unknown>;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function handleAgentOnboard(req: Request, deps: AgentOnboardDeps): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return fail('method_not_allowed', 405);
  const { env } = deps;
  const fetchFn = deps.fetchFn ?? fetch;

  const agentId = await currentUserId(env, req.headers.get('Authorization'), fetchFn);
  if (!agentId) return fail('not_signed_in', 401);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return fail('invalid_request', 400);
  }

  const phone = normalizeNgPhone(typeof body.phone === 'string' ? body.phone : '');
  if (!phone || phone === 'invalid') return fail('invalid_phone', 400);

  if (body.action === 'start') return start(env, fetchFn, agentId, phone, deps.randomCode ?? secureCode);
  if (body.action === 'confirm') return confirm(env, fetchFn, agentId, phone, body);
  return fail('invalid_request', 400);
}

async function start(env: ServerEnv, fetchFn: FetchFn, agentId: string, phone: string, randomCode: () => string) {
  // Check the SMS provider first, so no code is stored when it cannot be delivered.
  const rt = await getRuntime(env, 'sms', undefined, fetchFn);
  const adapter = runtimeProblem(rt, env.appEnv) ? null : smsProvider(rt, fetchFn);
  if (!adapter || !adapter.ok) return fail('service_not_ready', 503);

  const code = randomCode();
  const started = await rpcResult<{ phone: string; agent_name: string }>(env, 'agent_onboarding_start', {
    p_agent: agentId, p_phone: phone, p_code_hash: await codeHash(env, phone, code),
  }, fetchFn);
  if (!started.ok) return dbFailure(started.message);

  const t0 = Date.now();
  const sent = await adapter.value.send(phone, agentSmsText(started.value.agent_name, code));
  await logEvent(env, {
    kind: 'sms', provider: rt.provider, mode: rt.mode, operation: 'agent_onboarding', success: sent.ok,
    http_status: sent.httpStatus, error_code: sent.ok ? undefined : sent.error, duration_ms: Date.now() - t0,
  }, fetchFn);
  if (!sent.ok) return fail(sent.error === 'unavailable' ? 'provider_unavailable' : 'service_not_ready', 503);
  return json({ sent: true, expires_in: CODE_TTL_SECONDS });
}

async function confirm(env: ServerEnv, fetchFn: FetchFn, agentId: string, phone: string, body: Body) {
  const code = str(body.code, 10).replace(/\s+/g, '');
  if (!/^[0-9]{6}$/.test(code)) return fail('wrong_code', 400);

  // Check the farmer's details before using up the code.
  const fullName = str(body.full_name, 120);
  if (fullName.length < 2) return fail('invalid_name', 400);
  const language = LANGUAGES.has(String(body.language)) ? String(body.language) : 'en';
  const roles = Array.isArray(body.roles) ? body.roles.filter((r) => FARMER_ROLES.has(String(r))).map(String) : [];
  if (roles.length === 0) return fail('invalid_roles', 400);
  const consents: Record<string, boolean> = {};
  if (body.consents && typeof body.consents === 'object') {
    for (const [k, v] of Object.entries(body.consents as Record<string, unknown>)) {
      if (CONSENT_KEYS.has(k) && typeof v === 'boolean') consents[k] = v;
    }
  }
  if (!consents.terms_of_use || !consents.privacy_policy) return fail('consent_required', 400);
  const version = str(body.document_version, 40);
  if (!version) return fail('invalid_version', 400);

  const checked = await rpcResult<{ ok: boolean }>(env, 'agent_onboarding_verify', {
    p_agent: agentId, p_phone: phone, p_code_hash: await codeHash(env, phone, code),
  }, fetchFn);
  if (!checked.ok) return dbFailure(checked.message);
  if (!checked.value.ok) return fail('wrong_code', 400);

  // The code proves the farmer holds this phone, so the sign-in is created already confirmed.
  const created = await fetchFn(`${env.url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, phone_confirm: true, user_metadata: { full_name: fullName, preferred_language: language } }),
  });
  if (!created.ok) {
    return created.status === 422 || created.status === 409 ? fail('already_registered', 409) : fail('server_error', 500);
  }
  const user = (await created.json()) as { id?: string };
  if (!user.id) return fail('server_error', 500);

  const done = await rpcResult<{ profile_id: string }>(env, 'agent_onboarding_complete', {
    p_agent: agentId,
    p_profile: user.id,
    p_full_name: fullName,
    p_state: str(body.state, 60) || null,
    p_lga: str(body.lga, 60) || null,
    p_language: language,
    p_roles: roles.map((role) => ({ role })),
    p_consents: consents,
    p_document_version: version,
  }, fetchFn);
  if (!done.ok) {
    // Do not leave a half-registered sign-in behind.
    await fetchFn(`${env.url}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}` },
    }).catch(() => undefined);
    return dbFailure(done.message);
  }
  return json({ profile_id: done.value.profile_id });
}
