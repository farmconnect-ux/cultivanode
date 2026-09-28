// Booking SMS worker. pg_cron wakes it (private.wake_notify_worker) when messages are due; it claims a batch
// from sms_outbox, words each message in the recipient's language and sends it through whichever SMS provider
// staff made active. Deployed with JWT verification off: a shared secret from Vault authorises the call.
import { renderBookingSms } from '../booking-sms.ts';
import { fail, json } from '../http.ts';
import { smsProvider } from '../providers/sms.ts';
import type { FetchFn, ProviderErrorCode } from '../providers/types.ts';
import { getRuntime, logEvent, rpc, runtimeProblem, type ServerEnv } from '../server.ts';

export type SendNotificationsDeps = {
  env: ServerEnv;
  fetchFn?: FetchFn;
  batchSize?: number;
};

type OutboxRow = { id: string; kind: string; data: Record<string, unknown>; phone: string | null; language: string | null; attempts: number };

// Worth trying again later: the provider was down or its wallet was empty. Anything else will fail the same way.
const RETRYABLE: ProviderErrorCode[] = ['unavailable', 'billing'];

export async function handleSendNotifications(req: Request, deps: SendNotificationsDeps): Promise<Response> {
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
    rt = await getRuntime(env, 'sms', undefined, fetchFn);
  } catch {
    return fail('unavailable', 503);
  }
  const problem = runtimeProblem(rt, env.appEnv);
  const provider = problem ? null : smsProvider(rt, fetchFn);
  if (!provider || !provider.ok) {
    // Leave the queue alone (no attempt used up); the next wake-up tries again once staff fix the provider.
    await logEvent(env, { kind: 'sms', provider: rt.provider, mode: rt.mode, operation: 'booking_sms', success: false,
      error_code: problem ?? 'not_available' }, fetchFn);
    return json({ claimed: 0, sent: 0, failed: 0, error: problem ?? 'not_available' }, 503);
  }

  let rows: OutboxRow[];
  try {
    rows = await rpc<OutboxRow[]>(env, 'claim_sms_outbox', { p_limit: deps.batchSize ?? 20 }, fetchFn);
  } catch {
    return fail('unavailable', 503);
  }

  let sent = 0;
  let failed = 0;
  // One at a time: a small pilot volume, and it keeps provider rate limits out of the picture.
  for (const row of rows) {
    const phone = (row.phone ?? '').replace(/[^0-9]/g, '');
    const text = renderBookingSms(row.kind, row.data ?? {}, row.language);
    let ok = false;
    let error: string | undefined;
    let messageId: string | undefined;
    let retry = false;

    if (!text || !/^[0-9]{8,15}$/.test(phone)) {
      error = 'bad_message';
    } else {
      const started = Date.now();
      const result = await provider.value.send(phone, text);
      await logEvent(env, {
        kind: 'sms', provider: rt.provider, mode: rt.mode, operation: 'booking_sms', success: result.ok,
        http_status: result.httpStatus, error_code: result.ok ? undefined : result.error, duration_ms: Date.now() - started,
      }, fetchFn);
      ok = result.ok;
      if (result.ok) messageId = result.value.messageId;
      else {
        error = result.error;
        retry = RETRYABLE.includes(result.error);
      }
    }

    try {
      await rpc(env, 'finish_sms_outbox', {
        p_id: row.id, p_ok: ok, p_provider: rt.provider, p_message_id: messageId ?? null, p_error: error ?? null, p_retry: retry,
      }, fetchFn);
    } catch {
      /* the row is re-queued after 10 minutes in 'sending'; nothing else to do here */
    }
    if (ok) sent++;
    else failed++;
  }

  return json({ claimed: rows.length, sent, failed });
}
