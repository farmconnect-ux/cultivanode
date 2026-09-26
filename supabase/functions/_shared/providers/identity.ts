// Identity adapters (NIN, BVN, bank account). Add a provider: write an adapter here, register it in
// identityProvider(), and add its row to public.integration_providers in a migration.
import {
  type BankAccountRecord,
  type FetchFn,
  type IdentityProvider,
  joinName,
  type PersonRecord,
  type Result,
  type Runtime,
  TIMEOUT_MS,
} from './types.ts';

/** Development provider. Any 11-digit number passes with the profile's own name; 00000000000 is "not found". */
export const mockIdentity: IdentityProvider = {
  async verifyNin(nin, ctx) {
    return { ok: true, value: { found: !/^0+$/.test(nin), fullName: ctx.profileName, reference: `mock-${crypto.randomUUID()}` } };
  },
  async verifyBvn(bvn, ctx) {
    return { ok: true, value: { found: !/^0+$/.test(bvn), fullName: ctx.profileName, reference: `mock-${crypto.randomUUID()}` } };
  },
  async verifyBankAccount(accountNumber, bankCode, ctx) {
    return {
      ok: true,
      value: {
        found: !/^0+$/.test(accountNumber),
        accountName: ctx.profileName,
        bankName: TEST_BANKS.find((b) => b.code === bankCode)?.name ?? 'Test Bank',
        reference: `mock-${crypto.randomUUID()}`,
      },
    };
  },
  async listBanks() {
    return { ok: true, value: TEST_BANKS };
  },
};

const TEST_BANKS = [
  { code: '044', name: 'Access Bank (test)' },
  { code: '058', name: 'GTBank (test)' },
  { code: '033', name: 'UBA (test)' },
];

type PremblyBody = {
  status?: boolean;
  response_code?: string;
  detail?: string;
  message?: string;
  data?: Record<string, unknown> | Record<string, unknown>[];
  nin_data?: Record<string, unknown>;
  verification?: { status?: string; reference?: string };
};

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Prembly: same base URL for sandbox and live; the API key decides which one runs. */
export function prembly(rt: Runtime, fetchFn: FetchFn = fetch): IdentityProvider {
  const base = (rt.config.base_url ?? '').replace(/\/+$/, '');

  async function call(path: string, method: 'GET' | 'POST', payload?: Record<string, string>): Promise<Result<PremblyBody>> {
    const apiKey = rt.secrets.api_key;
    if (!apiKey || !base || !path) return { ok: false, error: 'not_configured' };
    const headers: Record<string, string> = { 'x-api-key': apiKey, Accept: 'application/json' };
    if (rt.secrets.app_id) headers['app-id'] = rt.secrets.app_id;
    if (payload) headers['Content-Type'] = 'application/json';

    let res: Response;
    try {
      res = await fetchFn(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return { ok: false, error: 'unavailable' };
    }
    let body: PremblyBody;
    try {
      body = (await res.json()) as PremblyBody;
    } catch {
      return { ok: false, error: res.status >= 500 ? 'unavailable' : 'bad_response', httpStatus: res.status };
    }
    if (res.status === 401 || res.status === 403) return { ok: false, error: 'rejected', detail: 'key refused', httpStatus: res.status };
    if (res.status >= 500) return { ok: false, error: 'unavailable', httpStatus: res.status };
    // Prembly returns HTTP 200 with its own response_code: 00 ok, 01 not found, 02 try later, 03 wallet empty.
    switch (body.response_code) {
      case '00':
      case '01':
        return { ok: true, value: body, httpStatus: res.status };
      case '02':
        return { ok: false, error: 'unavailable', httpStatus: res.status };
      case '03':
        return { ok: false, error: 'billing', httpStatus: res.status };
      default:
        return res.ok && body.status === true
          ? { ok: true, value: body, httpStatus: res.status }
          : { ok: false, error: 'rejected', detail: (body.detail ?? body.message ?? '').slice(0, 80), httpStatus: res.status };
    }
  }

  function person(body: PremblyBody, pick: (d: Record<string, unknown>) => string): PersonRecord {
    const data = (body.nin_data ?? (Array.isArray(body.data) ? body.data[0] : body.data) ?? {}) as Record<string, unknown>;
    const found = body.response_code === '00' || (body.status === true && body.response_code !== '01');
    return { found, fullName: found ? pick(data) : '', reference: body.verification?.reference?.trim() };
  }

  return {
    async verifyNin(nin) {
      const r = await call(rt.config.nin_path ?? '', 'POST', { number_nin: nin, number: nin });
      if (!r.ok) return r;
      return { ok: true, httpStatus: r.httpStatus, value: person(r.value, (d) =>
        joinName(str(d.firstname), str(d.middlename), str(d.surname)) ||
        joinName(str(d.first_name), str(d.middle_name), str(d.last_name))) };
    },
    async verifyBvn(bvn) {
      const r = await call(rt.config.bvn_path ?? '', 'POST', { number: bvn });
      if (!r.ok) return r;
      return { ok: true, httpStatus: r.httpStatus, value: person(r.value, (d) =>
        joinName(str(d.firstName), str(d.middleName), str(d.lastName)) ||
        joinName(str(d.first_name), str(d.middle_name), str(d.last_name))) };
    },
    async verifyBankAccount(accountNumber, bankCode): Promise<Result<BankAccountRecord>> {
      const r = await call(rt.config.bank_account_path ?? '', 'POST', {
        number: accountNumber,
        account_number: accountNumber,
        bank_code: bankCode,
      });
      if (!r.ok) return r;
      const data = (Array.isArray(r.value.data) ? r.value.data[0] : r.value.data) ?? {};
      const accountName = str(data.account_name) || str(data.accountName) || str(data.name);
      const found = r.value.response_code !== '01' && accountName !== '';
      return {
        ok: true,
        httpStatus: r.httpStatus,
        value: { found, accountName, bankName: str(data.bank_name) || undefined, reference: r.value.verification?.reference?.trim() },
      };
    },
    async listBanks() {
      const r = await call('/identitypass/verification/bank_account/bank_code', 'GET');
      if (!r.ok) return r;
      const list = Array.isArray(r.value.data) ? r.value.data : [];
      const banks = list
        .map((b) => ({ code: str(b.code), name: str(b.name) }))
        .filter((b) => b.code && b.name)
        .sort((a, b) => a.name.localeCompare(b.name));
      return banks.length ? { ok: true, value: banks } : { ok: false, error: 'bad_response' };
    },
  };
}

export function identityProvider(rt: Runtime, fetchFn: FetchFn = fetch): Result<IdentityProvider> {
  switch (rt.provider) {
    case 'mock_identity':
      return { ok: true, value: mockIdentity };
    case 'prembly':
      return { ok: true, value: prembly(rt, fetchFn) };
    default:
      return { ok: false, error: 'not_available', detail: `no identity adapter for ${rt.provider}` };
  }
}
