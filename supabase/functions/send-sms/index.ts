// Supabase Auth "Send SMS" hook. Deployed with JWT verification OFF: the webhook signature is checked instead.
// Needs the secret SEND_SMS_HOOK_SECRET (the "v1,whsec_..." value from Authentication > Hooks).
import { readEnv } from '../_shared/env.ts';
import { handleSendSms } from '../_shared/handlers/send-sms.ts';

const env = readEnv(Deno.env);
const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '';

Deno.serve((req) => handleSendSms(req, { env, hookSecret }));
