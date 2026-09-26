// Supabase Auth "Send SMS" hook: Auth generates the sign-in code, this delivers it through whichever
// SMS provider staff have made active in the admin console.
import { smsProvider, renderOtpMessage } from '../providers/sms.ts';
import type { FetchFn } from '../providers/types.ts';
import { getRuntime, logEvent, runtimeProblem, type ServerEnv } from '../server.ts';
import { verifyWebhook, webhookHeaders } from '../webhook.ts';

export type SendSmsDeps = {
  env: ServerEnv;
  hookSecret: string;
  fetchFn?: FetchFn;
  nowSeconds?: number;
};

type HookPayload = { user?: { phone?: string }; sms?: { otp?: string } };

// Auth shows `message` to the person signing in, so it stays generic.
function hookError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleSendSms(req: Request, deps: SendSmsDeps): Promise<Response> {
  const fetchFn = deps.fetchFn ?? fetch;
  if (req.method !== 'POST') return hookError(405, 'Method not allowed');

  const body = await req.text();
  if (!(await verifyWebhook(deps.hookSecret, webhookHeaders(req.headers), body, deps.nowSeconds))) {
    return hookError(401, 'Invalid signature');
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(body) as HookPayload;
  } catch {
    return hookError(400, 'Invalid request');
  }
  const phone = (payload.user?.phone ?? '').replace(/[^0-9]/g, '');
  const otp = payload.sms?.otp ?? '';
  if (!/^[0-9]{8,15}$/.test(phone) || !/^[0-9]{4,10}$/.test(otp)) return hookError(400, 'Invalid request');

  let rt;
  try {
    rt = await getRuntime(deps.env, 'sms', undefined, fetchFn);
  } catch {
    return hookError(500, 'We could not send your code. Please try again shortly.');
  }
  const provider = runtimeProblem(rt, deps.env.appEnv) ? null : smsProvider(rt, fetchFn);
  if (!provider || !provider.ok) {
    await logEvent(deps.env, { kind: 'sms', provider: rt.provider, mode: rt.mode, operation: 'otp', success: false,
      error_code: 'not_configured' }, fetchFn);
    return hookError(500, 'We could not send your code. Please try again shortly.');
  }

  const started = Date.now();
  const result = await provider.value.send(phone, renderOtpMessage(rt.config.message_template, otp));
  await logEvent(deps.env, {
    kind: 'sms', provider: rt.provider, mode: rt.mode, operation: 'otp', success: result.ok,
    http_status: result.httpStatus, error_code: result.ok ? undefined : result.error, duration_ms: Date.now() - started,
  }, fetchFn);

  if (!result.ok) return hookError(502, 'We could not send your code. Please try again shortly.');
  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
}
