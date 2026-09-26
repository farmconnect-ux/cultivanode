import { describe, expect, it } from 'vitest';
import { identityProvider, mockIdentity, prembly } from '../providers/identity.ts';
import { renderOtpMessage, smsProvider, termii } from '../providers/sms.ts';
import type { Runtime } from '../providers/types.ts';

type Call = { url: string; init: RequestInit };

function fakeFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    return respond(url, init);
  }) as typeof fetch;
  return { fn, calls };
}

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const termiiRt: Runtime = {
  provider: 'termii', kind: 'sms', mode: 'live', implemented: true, test_only: false, missing: [],
  config: { base_url: 'https://v3.api.termii.com/', sender_id: 'CultivaNode', channel: 'dnd', message_template: null },
  secrets: { api_key: 'TL-key' },
};

const premblyRt: Runtime = {
  provider: 'prembly', kind: 'identity', mode: 'test', implemented: true, test_only: false, missing: [],
  config: { base_url: 'https://api.prembly.com', nin_path: '/verification/vnin', bvn_path: '/verification/bvn_validation',
            bank_account_path: '/verification/bank_account/basic' },
  secrets: { api_key: 'sandbox-key' },
};

describe('Termii', () => {
  it('sends a plain DND message with the key in the body', async () => {
    const { fn, calls } = fakeFetch(() => jsonRes({ code: 'ok', message_id: '9122821270554876574', message: 'Successfully Sent' }));
    const r = await termii(termiiRt, fn).send('2348031234567', 'Your code is 123456');
    expect(r).toMatchObject({ ok: true, value: { messageId: '9122821270554876574' } });
    expect(calls[0].url).toBe('https://v3.api.termii.com/api/sms/send');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      api_key: 'TL-key', to: '2348031234567', from: 'CultivaNode', sms: 'Your code is 123456', type: 'plain', channel: 'dnd',
    });
  });

  it('reports an unapproved sender ID as rejected', async () => {
    const { fn } = fakeFetch(() => jsonRes({ message: 'ApplicationSenderId not found' }, 404));
    expect(await termii(termiiRt, fn).send('2348031234567', 'x')).toMatchObject({ ok: false, error: 'rejected' });
  });

  it('reports an empty balance as billing', async () => {
    const { fn } = fakeFetch(() => jsonRes({ message: 'Insufficient balance' }, 400));
    expect(await termii(termiiRt, fn).send('2348031234567', 'x')).toMatchObject({ ok: false, error: 'billing' });
  });

  it('reports network failures as unavailable', async () => {
    const { fn } = fakeFetch(() => { throw new TypeError('network down'); });
    expect(await termii(termiiRt, fn).send('2348031234567', 'x')).toMatchObject({ ok: false, error: 'unavailable' });
  });

  it('refuses to send without a key', async () => {
    const { fn, calls } = fakeFetch(() => jsonRes({}));
    const r = await termii({ ...termiiRt, secrets: {} }, fn).send('2348031234567', 'x');
    expect(r).toMatchObject({ ok: false, error: 'not_configured' });
    expect(calls).toHaveLength(0);
  });
});

describe('SMS registry and message', () => {
  it('picks the adapter named by the database', () => {
    expect(smsProvider(termiiRt).ok).toBe(true);
    expect(smsProvider({ ...termiiRt, provider: 'mock_sms' }).ok).toBe(true);
    expect(smsProvider({ ...termiiRt, provider: 'twilio' })).toMatchObject({ ok: false, error: 'not_available' });
  });

  it('fills the template and falls back to the default', () => {
    expect(renderOtpMessage('{brand}: {code}', '123456')).toBe('CultivaNode: 123456');
    expect(renderOtpMessage('', '654321')).toContain('654321');
  });
});

describe('Prembly', () => {
  it('verifies a NIN and builds the full name', async () => {
    const { fn, calls } = fakeFetch(() => jsonRes({
      status: true, response_code: '00',
      data: { firstname: 'CHIDERA', middlename: 'ANITA', surname: 'JOHNSON', nin: '12345678901' },
      verification: { status: 'VERIFIED', reference: 'ref-1 ' },
    }));
    const r = await prembly(premblyRt, fn).verifyNin('12345678901', { profileName: '' });
    expect(r).toMatchObject({ ok: true, value: { found: true, fullName: 'CHIDERA ANITA JOHNSON', reference: 'ref-1' } });
    expect(calls[0].url).toBe('https://api.prembly.com/verification/vnin');
    expect((calls[0].init.headers as Record<string, string>)['x-api-key']).toBe('sandbox-key');
    expect(JSON.parse(String(calls[0].init.body)).number_nin).toBe('12345678901');
  });

  it('treats response code 01 as not found (a result, not an error)', async () => {
    const { fn } = fakeFetch(() => jsonRes({ status: false, response_code: '01', message: 'Record not found' }));
    expect(await prembly(premblyRt, fn).verifyBvn('22222222222', { profileName: '' }))
      .toMatchObject({ ok: true, value: { found: false, fullName: '' } });
  });

  it('maps 02 to unavailable and 03 to billing', async () => {
    const busy = fakeFetch(() => jsonRes({ status: false, response_code: '02' }));
    expect(await prembly(premblyRt, busy.fn).verifyNin('1', { profileName: '' })).toMatchObject({ ok: false, error: 'unavailable' });
    const broke = fakeFetch(() => jsonRes({ status: false, response_code: '03' }));
    expect(await prembly(premblyRt, broke.fn).verifyNin('1', { profileName: '' })).toMatchObject({ ok: false, error: 'billing' });
  });

  it('maps a refused key to rejected', async () => {
    const { fn } = fakeFetch(() => jsonRes({ detail: 'Invalid API key' }, 401));
    expect(await prembly(premblyRt, fn).verifyNin('1', { profileName: '' })).toMatchObject({ ok: false, error: 'rejected' });
  });

  it('reads BVN names in camelCase', async () => {
    const { fn } = fakeFetch(() => jsonRes({ status: true, response_code: '00',
      data: { firstName: 'Musa', middleName: '', lastName: 'Bello' } }));
    expect(await prembly(premblyRt, fn).verifyBvn('22222222222', { profileName: '' }))
      .toMatchObject({ ok: true, value: { found: true, fullName: 'Musa Bello' } });
  });

  it('returns the account name for a bank account', async () => {
    const { fn, calls } = fakeFetch(() => jsonRes({ status: true, response_code: '00',
      data: { account_name: 'MUSA BELLO', bank_name: 'Access Bank' } }));
    const r = await prembly(premblyRt, fn).verifyBankAccount('0123456789', '044', { profileName: '' });
    expect(r).toMatchObject({ ok: true, value: { found: true, accountName: 'MUSA BELLO', bankName: 'Access Bank' } });
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({ number: '0123456789', bank_code: '044' });
  });

  it('sends app-id only when one is set', async () => {
    const { fn, calls } = fakeFetch(() => jsonRes({ status: true, response_code: '00', data: [] }));
    await prembly({ ...premblyRt, secrets: { api_key: 'k', app_id: 'app-1' } }, fn).listBanks();
    expect((calls[0].init.headers as Record<string, string>)['app-id']).toBe('app-1');
  });
});

describe('Test identity provider', () => {
  it('passes any 11-digit number with the profile name and fails all zeros', async () => {
    expect(await mockIdentity.verifyNin('12345678901', { profileName: 'Ada Obi' }))
      .toMatchObject({ ok: true, value: { found: true, fullName: 'Ada Obi' } });
    expect(await mockIdentity.verifyBvn('00000000000', { profileName: 'Ada Obi' }))
      .toMatchObject({ ok: true, value: { found: false } });
  });

  it('is chosen by name, and unknown providers are refused', () => {
    expect(identityProvider({ ...premblyRt, provider: 'mock_identity' }).ok).toBe(true);
    expect(identityProvider({ ...premblyRt, provider: 'dojah' })).toMatchObject({ ok: false, error: 'not_available' });
  });
});
