// Booking SMS worker, woken every minute by pg_cron when messages are due (private.wake_notify_worker).
// Deployed with JWT verification OFF: the x-worker-secret header is checked against Vault instead.
import { readEnv } from '../_shared/env.ts';
import { handleSendNotifications } from '../_shared/handlers/send-notifications.ts';

const env = readEnv(Deno.env);

Deno.serve((req) => handleSendNotifications(req, { env }));
