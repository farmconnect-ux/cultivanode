// Reads the Edge Function environment. Supabase provides SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and
// SUPABASE_ANON_KEY. APP_ENV is optional.
//
// Fail closed: test-only providers (mock SMS, mock identity checks) are refused unless this is clearly a local
// or development setup. A hosted project counts as production whether or not APP_ENV is set, so a forgotten
// secret can never turn a fake NIN check into a real verification.
import type { ServerEnv } from './server.ts';

type EnvReader = { get(name: string): string | undefined };

/** Local Supabase (CLI / Docker) URLs. Everything else is treated as hosted. */
export function isLocalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1' ||
      host === 'kong' || host === 'host.docker.internal' || host.endsWith('.localhost')
    );
  } catch {
    return false;
  }
}

/**
 * 'development' only when APP_ENV says so explicitly, or when running against a local Supabase with APP_ENV unset.
 * An explicit APP_ENV=development on a hosted URL is honoured (for a staging project), but it has to be deliberate.
 */
export function resolveAppEnv(appEnv: string | undefined, url: string): 'production' | 'development' {
  const v = appEnv?.trim().toLowerCase();
  if (v === 'development' || v === 'test') return 'development';
  if (v) return 'production';
  return isLocalUrl(url) ? 'development' : 'production';
}

export function readEnv(env: EnvReader): ServerEnv {
  const url = env.get('SUPABASE_URL');
  const serviceKey = env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  return {
    url: url.replace(/\/+$/, ''),
    serviceKey,
    anonKey: env.get('SUPABASE_ANON_KEY'),
    appEnv: resolveAppEnv(env.get('APP_ENV'), url),
  };
}
