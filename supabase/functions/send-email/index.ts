// Farm alert email worker, woken by pg_cron (private.wake_email_worker) when emails are waiting.
// Deployed with JWT verification OFF: the x-worker-secret header is checked against Vault instead.
import { readEnv } from '../_shared/env.ts';
import { handleSendEmail } from '../_shared/handlers/send-email.ts';

const env = readEnv(Deno.env);

Deno.serve((req) => handleSendEmail(req, { env }));
