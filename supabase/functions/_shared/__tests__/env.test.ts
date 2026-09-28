import { describe, expect, it } from 'vitest';
import { isLocalUrl, readEnv, resolveAppEnv } from '../env.ts';
import { runtimeProblem } from '../server.ts';
import type { Runtime } from '../providers/types.ts';

const HOSTED = 'https://vqbtnftnxyfaembwgfrk.supabase.co';
const reader = (vars: Record<string, string | undefined>) => ({ get: (k: string) => vars[k] });

const mockIdentity: Runtime = {
  provider: 'mock_identity', kind: 'identity', mode: 'test', implemented: true, test_only: true,
  missing: [], config: {}, secrets: {},
};

describe('fail-closed environment', () => {
  it('treats a hosted project as production when APP_ENV is missing', () => {
    expect(resolveAppEnv(undefined, HOSTED)).toBe('production');
    expect(resolveAppEnv('', HOSTED)).toBe('production');
    expect(readEnv(reader({ SUPABASE_URL: HOSTED, SUPABASE_SERVICE_ROLE_KEY: 'k' })).appEnv).toBe('production');
  });

  it('is development only locally or when said explicitly', () => {
    expect(resolveAppEnv(undefined, 'http://127.0.0.1:54321')).toBe('development');
    expect(resolveAppEnv(undefined, 'http://kong:8000')).toBe('development');
    expect(resolveAppEnv('development', HOSTED)).toBe('development');
    expect(resolveAppEnv('production', 'http://127.0.0.1:54321')).toBe('production');
    expect(resolveAppEnv('staging', HOSTED)).toBe('production'); // anything unknown fails closed
  });

  it('recognises local URLs only', () => {
    expect(isLocalUrl('http://localhost:54321')).toBe(true);
    expect(isLocalUrl(HOSTED)).toBe(false);
    expect(isLocalUrl('https://localhost.evil.com')).toBe(false);
    expect(isLocalUrl('not a url')).toBe(false);
  });

  it('refuses mock providers on a hosted project with APP_ENV unset', () => {
    const appEnv = readEnv(reader({ SUPABASE_URL: HOSTED, SUPABASE_SERVICE_ROLE_KEY: 'k' })).appEnv;
    expect(runtimeProblem(mockIdentity, appEnv)).toBe('not_available');
    expect(runtimeProblem(mockIdentity, 'development')).toBeNull();
    expect(runtimeProblem({ ...mockIdentity, test_only: false }, appEnv)).toBeNull();
  });
});
