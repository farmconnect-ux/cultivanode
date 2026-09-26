// NIN / BVN / bank account checks for the signed-in user, through the provider chosen in the admin console.
import { readEnv } from '../_shared/env.ts';
import { handleVerifyIdentity } from '../_shared/handlers/verify-identity.ts';

const env = readEnv(Deno.env);

Deno.serve((req) => handleVerifyIdentity(req, { env }));
