// Reads the Edge Function environment. Supabase provides SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and
// SUPABASE_ANON_KEY; APP_ENV is set by us (Edge Functions > Secrets) to "production" before real users arrive.
import type { ServerEnv } from './server.ts';

type EnvReader = { get(name: string): string | undefined };

export function readEnv(env: EnvReader): ServerEnv {
  const url = env.get('SUPABASE_URL');
  const serviceKey = env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  return {
    url: url.replace(/\/+$/, ''),
    serviceKey,
    anonKey: env.get('SUPABASE_ANON_KEY'),
    appEnv: env.get('APP_ENV') ?? 'development',
  };
}
