import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createEncryptedStorage, decrypt, encrypt, keystoreName } from '../encrypted-storage';
import { checkAboutYou, checkConsents, checkRoles, firstError, onboardingArgs, type OnboardingForm } from '../onboarding';
import { redact, redactString } from '../redact';

function memoryStores() {
  const keys = new Map<string, string>();
  const data = new Map<string, string>();
  return {
    keys,
    data,
    deps: {
      keyStore: {
        get: async (k: string) => keys.get(k) ?? null,
        set: async (k: string, v: string) => void keys.set(k, v),
        remove: async (k: string) => void keys.delete(k),
      },
      dataStore: {
        getItem: async (k: string) => data.get(k) ?? null,
        setItem: async (k: string, v: string) => void data.set(k, v),
        removeItem: async (k: string) => void data.delete(k),
      },
      randomBytes: (n: number) => new Uint8Array(randomBytes(n)),
    },
  };
}

const SESSION = JSON.stringify({ access_token: 'eyJhbGciOi.payload.sig', refresh_token: 'r3fr3sh', user: { phone: '2348031234567' } });

describe('encrypted session storage', () => {
  it('round-trips a session and never stores it in plain text', async () => {
    const m = memoryStores();
    const s = createEncryptedStorage(m.deps);
    await s.setItem('cn-auth', SESSION);
    const stored = m.data.get('cn-auth')!;
    expect(stored.startsWith('v1:')).toBe(true);
    expect(stored).not.toContain('r3fr3sh');
    expect(stored).not.toContain('2348031234567');
    expect(m.keys.get(keystoreName('cn-auth'))).toMatch(/^[0-9a-f]{64}$/);
    expect(await s.getItem('cn-auth')).toBe(SESSION);
  });

  it('uses a fresh key and IV on every write', async () => {
    const m = memoryStores();
    const s = createEncryptedStorage(m.deps);
    await s.setItem('cn-auth', SESSION);
    const [first, key1] = [m.data.get('cn-auth'), m.keys.get(keystoreName('cn-auth'))];
    await s.setItem('cn-auth', SESSION);
    expect(m.data.get('cn-auth')).not.toBe(first);
    expect(m.keys.get(keystoreName('cn-auth'))).not.toBe(key1);
  });

  it('returns nothing without the keystore key (copied app storage is useless)', async () => {
    const m = memoryStores();
    const s = createEncryptedStorage(m.deps);
    await s.setItem('cn-auth', SESSION);
    m.keys.clear();
    expect(await s.getItem('cn-auth')).toBeNull();
  });

  it('drops a value encrypted under a different key instead of returning noise', async () => {
    const m = memoryStores();
    const s = createEncryptedStorage(m.deps);
    await s.setItem('cn-auth', SESSION);
    m.keys.set(keystoreName('cn-auth'), 'ab'.repeat(32));
    expect(await s.getItem('cn-auth')).toBeNull();
    expect(m.data.has('cn-auth')).toBe(false);
  });

  it('rejects malformed values and removes both parts on sign-out', async () => {
    const key = new Uint8Array(32).fill(7);
    expect(decrypt('plain-json', key)).toBeNull();
    expect(decrypt(encrypt('x', key, new Uint8Array(16)), key)).toBe('x');
    const m = memoryStores();
    const s = createEncryptedStorage(m.deps);
    await s.setItem('cn-auth', SESSION);
    await s.removeItem('cn-auth');
    expect(m.data.size + m.keys.size).toBe(0);
  });

  it('makes keystore-safe names', () => {
    expect(keystoreName('sb-abc-auth-token')).toBe('cn.key.sb-abc-auth-token');
    expect(keystoreName('a b/c')).toBe('cn.key.a_b_c');
  });
});

describe('redaction', () => {
  it('removes phones, emails, codes, ID numbers and tokens', () => {
    const out = redactString('user 08031234567 a@b.com code 123456 nin 12345678901 jwt eyJa.bc.de');
    expect(out).not.toMatch(/08031234567|a@b\.com|123456|12345678901|eyJa\.bc\.de/);
    expect(out).toContain('***4567');
  });

  it('blanks sensitive keys in objects', () => {
    expect(redact({ phone: '0803', data: { token: 'x', ok: 'fine' } })).toEqual({
      phone: '[redacted]',
      data: { token: '[redacted]', ok: 'fine' },
    });
  });
});

const base: OnboardingForm = {
  fullName: '  Bisi Adeyemi ',
  accountType: 'individual',
  businessName: 'Ignored Ltd',
  cacNumber: 'RC1',
  state: 'Oyo',
  lga: 'Iseyin',
  language: 'yo',
  roles: ['crop_farmer', 'crop_farmer'],
  providerType: '',
  consents: { terms_of_use: true, privacy_policy: true, data_processing: false, marketing_messages: false },
};

describe('onboarding', () => {
  it('checks each step', () => {
    expect(checkAboutYou({ ...base, fullName: 'B' })).toBe('errorName');
    expect(checkAboutYou({ ...base, accountType: 'business', businessName: '' })).toBe('errorBusiness');
    expect(checkRoles({ ...base, roles: [] })).toBe('errorRoles');
    expect(checkRoles({ ...base, roles: ['service_provider'], providerType: 'wizard' })).toBe('errorProviderType');
    expect(checkRoles({ ...base, roles: ['service_provider'], providerType: 'mechanic' })).toBeNull();
    expect(checkConsents({ ...base, consents: { ...base.consents, privacy_policy: false } })).toBe('errorConsent');
    expect(firstError(base)).toBeNull();
  });

  it('builds complete_onboarding arguments for the mobile channel', () => {
    const args = onboardingArgs(base, '2026-09 (draft)');
    expect(args).toMatchObject({
      p_full_name: 'Bisi Adeyemi',
      p_account_type: 'individual',
      p_business_name: '',
      p_cac_number: '',
      p_state: 'Oyo',
      p_lga: 'Iseyin',
      p_language: 'yo',
      p_roles: [{ role: 'crop_farmer' }],
      p_document_version: '2026-09 (draft)',
      p_channel: 'mobile',
    });
  });

  it('drops unknown states and languages, and attaches the provider type', () => {
    const args = onboardingArgs(
      { ...base, state: 'Atlantis', language: 'fr', roles: ['service_provider'], providerType: 'vet' },
      'v',
    );
    expect(args.p_state).toBe('');
    expect(args.p_lga).toBe('');
    expect(args.p_language).toBe('en');
    expect(args.p_roles).toEqual([{ role: 'service_provider', provider_type: 'vet' }]);
  });
});
