import { describe, expect, it, vi } from 'vitest';

// Keep this pure-logic evaluation isolated from the native Supabase/React Native runtime.
vi.mock('../supabase', () => ({
  sessionStorage: { getItem: vi.fn(), setItem: vi.fn() },
  supabase: {},
}));

import {
  classifyDispatchError,
  hasProviderAccess,
  isValidJobId,
  validateDeclineReason,
} from '../provider-dispatch';

describe('provider dispatch acceptance evaluations', () => {
  describe('provider identity and deep-link input', () => {
    it.each([
      ['lowercase UUID', '11111111-1111-4111-8111-111111111111', true],
      ['uppercase UUID', 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA', true],
      ['UUID with surrounding whitespace', ' 11111111-1111-4111-8111-111111111111 ', true],
      ['empty input', '', false],
      ['non-string input', 123, false],
      ['truncated UUID', '11111111-1111-4111-8111', false],
      ['UUID with invalid version/shape', 'not-a-job-id', false],
    ])('evaluates %s', (_label, value, expected) => {
      expect(isValidJobId(value)).toBe(expected);
    });

    it.each([
      ['equipment provider', [{ role: 'equipment_provider' }], true],
      ['service provider', [{ role: 'service_provider' }], true],
      ['farmer only', [{ role: 'farmer' }], false],
      ['administrator only', [{ role: 'admin' }], false],
      ['empty roles', [], false],
      ['missing roles', undefined, false],
      ['null roles', null, false],
    ])('evaluates provider access for %s', (_label, roles, expected) => {
      expect(hasProviderAccess(roles as never)).toBe(expected);
    });
  });

  describe('decline reason validation', () => {
    it('rejects whitespace-only input', () => {
      expect(validateDeclineReason('   ')).toMatchObject({ valid: false });
    });

    it('rejects a reason shorter than three characters', () => {
      expect(validateDeclineReason('No')).toMatchObject({ valid: false });
    });

    it('accepts and trims the minimum valid reason', () => {
      expect(validateDeclineReason('  Yes  ')).toEqual({ valid: true, trimmed: 'Yes' });
    });

    it('accepts a reason of exactly 300 characters', () => {
      expect(validateDeclineReason('a'.repeat(300))).toEqual({
        valid: true,
        trimmed: 'a'.repeat(300),
      });
    });

    it('rejects a reason longer than 300 characters', () => {
      expect(validateDeclineReason('a'.repeat(301))).toMatchObject({ valid: false });
    });
  });

  describe('failure classification', () => {
    it.each([
      ['expired JWT', { code: 'PGRST301', message: 'JWT expired' }, 'unauthenticated'],
      ['HTTP unauthorised', { status: 401, message: 'Unauthorised' }, 'unauthenticated'],
      ['permission denial', { code: '42501', message: 'permission denied' }, 'forbidden'],
      ['policy denial', { message: 'row-level security policy violation' }, 'forbidden'],
      ['network fetch failure', { message: 'Failed to fetch' }, 'network'],
      ['request timeout', { message: 'Request timeout' }, 'network'],
      ['database error', { code: '23505', message: 'duplicate key value' }, 'database'],
      ['unknown structured error', { code: 'XX000', message: 'server error' }, 'database'],
      ['empty error', {}, 'network'],
    ])('classifies %s', (_label, error, expected) => {
      expect(classifyDispatchError(error)).toMatchObject({ kind: expected });
    });
  });
});
