// NIN, BVN and payout bank account checks for the signed-in user, through the active identity provider.
// Only a masked number, a keyed fingerprint and the outcome are stored; the provider's full response is discarded.
import { idFingerprint, maskId } from '../crypto.ts';
import { fail, json, preflight } from '../http.ts';
import { matchNames } from '../names.ts';
import { identityProvider } from '../providers/identity.ts';
import type { FetchFn, ProviderErrorCode } from '../providers/types.ts';
import { currentUserId, getRuntime, logEvent, rpc, runtimeProblem, select, type ServerEnv } from '../server.ts';

export type VerifyIdentityDeps = { env: ServerEnv; fetchFn?: FetchFn; now?: () => Date };

export const MAX_ATTEMPTS_PER_DAY = 5;

type Body = { action?: unknown; number?: unknown; bank_code?: unknown };

function providerFailure(code: ProviderErrorCode): Response {
  // Users never see provider names, billing trouble or configuration problems.
  return code === 'unavailable' ? fail('provider_unavailable', 503) : fail('service_not_ready', 503);
}

export async function handleVerifyIdentity(req: Request, deps: VerifyIdentityDeps): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return fail('method_not_allowed', 405);
  const { env } = deps;
  const fetchFn = deps.fetchFn ?? fetch;
  const now = deps.now ?? (() => new Date());

  const userId = await currentUserId(env, req.headers.get('Authorization'), fetchFn);
  if (!userId) return fail('not_signed_in', 401);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return fail('invalid_request', 400);
  }
  const action = body.action;
  if (action !== 'nin' && action !== 'bvn' && action !== 'bank_account' && action !== 'banks') {
    return fail('invalid_request', 400);
  }
  const number = typeof body.number === 'string' ? body.number.replace(/\s+/g, '') : '';
  const bankCode = typeof body.bank_code === 'string' ? body.bank_code.trim() : '';
  if ((action === 'nin' || action === 'bvn') && !/^[0-9]{11}$/.test(number)) return fail('invalid_number', 400);
  if (action === 'bank_account' && (!/^[0-9]{10}$/.test(number) || !/^[0-9A-Za-z]{2,10}$/.test(bankCode))) {
    return fail('invalid_number', 400);
  }

  const rt = await getRuntime(env, 'identity', undefined, fetchFn);
  const problem = runtimeProblem(rt, env.appEnv);
  const adapter = problem ? null : identityProvider(rt, fetchFn);
  if (!adapter || !adapter.ok) return fail('service_not_ready', 503);
  const provider = adapter.value;

  if (action === 'banks') {
    const banks = await provider.listBanks();
    return banks.ok ? json({ banks: banks.value }) : providerFailure(banks.error);
  }

  // Consent to data processing is required before any ID leaves the platform (NDPA 2023).
  const consent = await select<{ granted: boolean }[]>(env,
    `current_consents?profile_id=eq.${userId}&consent_type=eq.data_processing&select=granted`, fetchFn);
  if (!consent[0]?.granted) return fail('consent_required', 403);

  const profile = (await select<{ full_name: string | null }[]>(env, `profiles?id=eq.${userId}&select=full_name`, fetchFn))[0];
  const profileName = profile?.full_name?.trim() ?? '';
  if (!profileName) return fail('name_required', 400);

  // Each check costs money: limit attempts per person per day.
  const since = new Date(now().getTime() - 24 * 3600 * 1000).toISOString();
  const table = action === 'bank_account' ? 'bank_accounts' : 'verifications';
  const recent = await select<unknown[]>(env,
    `${table}?profile_id=eq.${userId}&created_at=gte.${encodeURIComponent(since)}&select=id`, fetchFn);
  if (recent.length >= MAX_ATTEMPTS_PER_DAY) return fail('too_many_attempts', 429);

  if (action !== 'bank_account') {
    const done = await select<unknown[]>(env,
      `verifications?profile_id=eq.${userId}&kind=eq.${action}&status=eq.verified&select=id`, fetchFn);
    if (done.length > 0) return fail('already_verified', 409);
  }

  const started = Date.now();
  const pepper = rt.hash_pepper ?? '';
  const fingerprint = pepper ? await idFingerprint(pepper, action, action === 'bank_account' ? `${bankCode}:${number}` : number) : null;
  const ctx = { profileName };

  if (action === 'bank_account') {
    const r = await provider.verifyBankAccount(number, bankCode, ctx);
    await logEvent(env, { kind: 'identity', provider: rt.provider, mode: rt.mode, operation: 'bank_account',
      success: r.ok, http_status: r.httpStatus, error_code: r.ok ? undefined : r.error, duration_ms: Date.now() - started }, fetchFn);
    if (!r.ok) return providerFailure(r.error);
    const match = r.value.found ? matchNames(profileName, r.value.accountName) : { score: 0, passed: false };
    const verified = r.value.found && match.passed;
    let bankName = r.value.bankName;
    if (!bankName) {
      const banks = await provider.listBanks();
      bankName = banks.ok ? banks.value.find((b) => b.code === bankCode)?.name : undefined;
    }
    const saved = await rpc<{ status: string; failure_reason: string | null }>(env, 'record_bank_account_verification', {
      p_profile: userId,
      p_bank_code: bankCode,
      p_bank_name: (bankName ?? bankCode).slice(0, 120),
      p_account_name: (r.value.accountName || 'Not found').slice(0, 160),
      p_last4: number.slice(-4),
      p_provider: rt.provider,
      p_verified: verified,
      p_id_hash: fingerprint,
      p_name_match: match.score,
      p_failure: verified ? null : r.value.found ? 'name_mismatch' : 'not_found',
    }, fetchFn);
    return json({ status: saved.status, failure_reason: saved.failure_reason, tier: await tier(env, userId, fetchFn) });
  }

  const r = action === 'nin' ? await provider.verifyNin(number, ctx) : await provider.verifyBvn(number, ctx);
  await logEvent(env, { kind: 'identity', provider: rt.provider, mode: rt.mode, operation: action,
    success: r.ok, http_status: r.httpStatus, error_code: r.ok ? undefined : r.error, duration_ms: Date.now() - started }, fetchFn);
  if (!r.ok) return providerFailure(r.error);

  const match = r.value.found ? matchNames(profileName, r.value.fullName) : { score: 0, passed: false };
  const verified = r.value.found && match.passed;
  const saved = await rpc<{ status: string; failure_reason: string | null }>(env, 'record_identity_verification', {
    p_profile: userId,
    p_kind: action,
    p_verified: verified,
    p_provider: rt.provider,
    p_reference: r.value.reference ?? null,
    p_masked: maskId(number),
    p_id_hash: fingerprint,
    p_name_match: match.score,
    p_failure: verified ? null : r.value.found ? 'name_mismatch' : 'not_found',
  }, fetchFn);
  return json({ status: saved.status, failure_reason: saved.failure_reason, tier: await tier(env, userId, fetchFn) });
}

async function tier(env: ServerEnv, userId: string, fetchFn: FetchFn): Promise<number | null> {
  const rows = await select<{ verification_tier: number }[]>(env, `profiles?id=eq.${userId}&select=verification_tier`, fetchFn);
  return rows[0]?.verification_tier ?? null;
}
