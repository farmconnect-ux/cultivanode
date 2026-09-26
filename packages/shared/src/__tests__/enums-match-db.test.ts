import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_LANGUAGES, APP_ROLES, FARM_ZONES, ORG_MEMBER_ROLES, PROVIDER_TYPES } from '../roles';

// Guards against the TypeScript constants and the Postgres enums drifting apart.
const sql = readFileSync(
  resolve(__dirname, '../../../../supabase/migrations/20260926020957_extensions_and_types.sql'),
  'utf8',
);

function enumValues(name: string): string[] {
  const match = sql.match(new RegExp(`create type public\\.${name} as enum \\(([^)]*)\\)`, 'i'));
  if (!match) throw new Error(`enum ${name} not found in migration`);
  return [...match[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
}

describe('TypeScript constants match the database enums', () => {
  it.each([
    ['app_role', APP_ROLES],
    ['provider_type', PROVIDER_TYPES],
    ['org_member_role', ORG_MEMBER_ROLES],
    ['farm_zone', FARM_ZONES],
    ['app_language', APP_LANGUAGES],
  ] as const)('%s', (name, values) => {
    expect([...values]).toEqual(enumValues(name));
  });
});
