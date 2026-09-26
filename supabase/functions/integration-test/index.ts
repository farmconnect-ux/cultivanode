// "Send test" for the admin Integrations page (integrations.manage only).
import { readEnv } from '../_shared/env.ts';
import { handleIntegrationTest } from '../_shared/handlers/integration-test.ts';

const env = readEnv(Deno.env);

Deno.serve((req) => handleIntegrationTest(req, { env }));
