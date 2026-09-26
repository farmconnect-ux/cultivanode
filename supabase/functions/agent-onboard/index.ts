// Field agents register farmers who have no smartphone; the farmer confirms with an SMS code.
import { readEnv } from '../_shared/env.ts';
import { handleAgentOnboard } from '../_shared/handlers/agent-onboard.ts';

const env = readEnv(Deno.env);

Deno.serve((req) => handleAgentOnboard(req, { env }));
