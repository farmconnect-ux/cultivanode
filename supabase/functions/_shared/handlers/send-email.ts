// Farm alert email worker. pg_cron wakes it (private.wake_email_worker) when emails are due; it claims a batch
// from email_outbox, groups the rows per person into one email in their language and sends it through the
// email provider staff made active (Resend, SMTP...). Deployed with JWT verification off: a shared secret
// from Vault authorises the call.
import { renderFarmAlertEmail } from '../farm-alert-email.ts';
import { fail, json } from '../http.ts';
import { emailProvider, isEmailAddress, type SmtpConnector } from '../providers/email.ts';
import type { FetchFn, ProviderErrorCode } from '../providers/types.ts';
import { getRuntime, logEvent, rpc, runtimeProblem, type ServerEnv } from '../server.ts';

export type SendEmailDeps = { env: ServerEnv; fetchFn?: FetchFn; connector?: SmtpConnector; batchSize?: number };

type OutboxRow = {
  id: string;
  profile_id: string;
  kind: string;
  data: Record<string, unknown> | null;
  email: string | null;
  full_name: string | null;
  language: string | null;
  attempts: number;
};

// Worth trying again later: the provider was down or its wallet was empty. Anything else will fail the same way.
const RETRYABLE: ProviderErrorCode[] = ['unavailable', 'billing'];

export async function handleSendEmail(req: Request, deps: SendEmailDeps): Promise<Response> {
  const fetchFn = deps.fetchFn ?? fetch;
  const env = deps.env;
  if (req.method !== 'POST') return fail('method_not_allowed', 405);

  const secret = req.headers.get('x-worker-secret') ?? '';
  let authorized = false;
  try {
    authorized = secret.length >= 32 && (await rpc<boolean>(env, 'notify_worker_authorized', { p_secret: secret }, fetchFn)) === true;
  } catch {
    return fail('unavailable', 503);
  }
  if (!authorized) return fail('unauthorized', 401);

  let rt;
  try {
    rt = await getRuntime(env, 'email', undefined, fetchFn);
  } catch {
    return fail('unavailable', 503);
  }
  const problem = runtimeProblem(rt, env.appEnv);
  const provider = problem ? null : emailProvider(rt, fetchFn, deps.connector);
  if (!provider || !provider.ok) {
    // Leave the queue alone (no attempt used up); the next wake-up tries again once staff fix the provider.
    await logEvent(env, { kind: 'email', provider: rt.provider, mode: rt.mode, operation: 'farm_alert_email', success: false,
      error_code: problem ?? 'not_available' }, fetchFn);
    return json({ claimed: 0, sent: 0, failed: 0, error: problem ?? 'not_available' }, 503);
  }

  let rows: OutboxRow[];
  try {
    rows = await rpc<OutboxRow[]>(env, 'claim_email_outbox', { p_limit: deps.batchSize ?? 100 }, fetchFn);
  } catch {
    return fail('unavailable', 503);
  }

  // One email per person.
  const people = new Map<string, OutboxRow[]>();
  for (const r of rows) people.set(r.profile_id, [...(people.get(r.profile_id) ?? []), r]);

  let sent = 0;
  let failed = 0;
  for (const group of people.values()) {
    const head = group[0]!;
    const ids = group.map((r) => r.id);
    const to = (head.email ?? '').trim();
    const message = isEmailAddress(to) ? renderFarmAlertEmail(to, group, head.language, head.full_name) : null;
    let ok = false;
    let error: string | undefined;
    let messageId: string | undefined;
    let retry = false;

    if (!message) {
      error = 'bad_message';
    } else {
      const started = Date.now();
      const result = await provider.value.send(message);
      await logEvent(env, {
        kind: 'email', provider: rt.provider, mode: rt.mode, operation: 'farm_alert_email', success: result.ok,
        http_status: result.httpStatus, error_code: result.ok ? undefined : result.error, duration_ms: Date.now() - started,
      }, fetchFn);
      ok = result.ok;
      if (result.ok) messageId = result.value.messageId;
      else {
        error = result.detail ? `${result.error}:${result.detail}` : result.error;
        retry = RETRYABLE.includes(result.error);
      }
    }

    try {
      await rpc(env, 'finish_email_outbox', {
        p_ids: ids, p_ok: ok, p_provider: rt.provider, p_message_id: messageId ?? null, p_error: error ?? null, p_retry: retry,
      }, fetchFn);
    } catch {
      /* the rows are re-queued after 10 minutes in 'sending'; nothing else to do here */
    }
    if (ok) sent++;
    else failed++;
  }

  return json({ claimed: rows.length, emails: people.size, sent, failed });
}
