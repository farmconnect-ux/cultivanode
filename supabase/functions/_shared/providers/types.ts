// Contracts every provider adapter implements. The rest of the code never names a provider:
// it asks the database which one is active (integration_runtime) and calls it through these.

export type IntegrationKind = 'sms' | 'identity';
export type IntegrationMode = 'test' | 'live';

/** What public.integration_runtime() returns. */
export type Runtime = {
  provider: string;
  kind: IntegrationKind;
  mode: IntegrationMode;
  implemented: boolean;
  test_only: boolean;
  missing: string[];
  config: Record<string, string | null>;
  secrets: Record<string, string>;
  hash_pepper?: string | null;
};

export type ProviderErrorCode =
  | 'not_configured' // settings or key missing
  | 'not_available' // no adapter, or a test-only provider in production
  | 'unavailable' // provider down or timed out: try again later
  | 'rejected' // provider refused the request (bad key, bad sender ID, bad input)
  | 'billing' // provider wallet empty
  | 'bad_response'; // could not understand the provider's answer

export type Result<T> =
  | { ok: true; value: T; httpStatus?: number }
  | { ok: false; error: ProviderErrorCode; detail?: string; httpStatus?: number };

export type FetchFn = typeof fetch;

export interface SmsProvider {
  send(toInternational: string, text: string): Promise<Result<{ messageId?: string }>>;
}

export type PersonRecord = {
  /** false when the provider says the number does not exist */
  found: boolean;
  fullName: string;
  reference?: string;
};

export type BankAccountRecord = {
  found: boolean;
  accountName: string;
  bankName?: string;
  reference?: string;
};

export type IdentityContext = {
  /** Name on the profile. Only the test provider uses it (to fake a matching record). */
  profileName: string;
};

export interface IdentityProvider {
  verifyNin(nin: string, ctx: IdentityContext): Promise<Result<PersonRecord>>;
  verifyBvn(bvn: string, ctx: IdentityContext): Promise<Result<PersonRecord>>;
  verifyBankAccount(accountNumber: string, bankCode: string, ctx: IdentityContext): Promise<Result<BankAccountRecord>>;
  listBanks(): Promise<Result<{ code: string; name: string }[]>>;
}

export const TIMEOUT_MS = 15_000;

export function joinName(...parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(' ');
}
