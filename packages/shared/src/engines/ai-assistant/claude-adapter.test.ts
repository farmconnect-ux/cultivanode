import { afterEach, describe, expect, it, vi } from 'vitest';
import { askGroundedAiAssistant } from './llm-adapter';

const context = { farmerId: 'f1', cropId: 'maize', zone: 'rainforest' as const, stageName: 'Vegetative' };

function claudeReply(text: string) {
  return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), { status: 200, headers: { 'content-type': 'application/json' } });
}

afterEach(() => vi.unstubAllGlobals());

describe('Claude as the farm assistant', () => {
  it('answers with Claude Sonnet first and sends the photo and grounded prompt', async () => {
    const fetchMock = vi.fn(async () => claudeReply('Scout the whorls early in the morning.'));
    vi.stubGlobal('fetch', fetchMock);
    const res = await askGroundedAiAssistant({ query: 'What is eating my maize?', context, anthropicApiKey: 'k', imageBase64: 'data:image/jpeg;base64,QUJD', imageMimeType: 'image/jpeg' });

    expect(res.providerUsed).toBe('claude');
    expect(res.modelUsed).toBe('claude-sonnet-5-5');
    expect(res.answer).toContain('Scout the whorls');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('k');
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('claude-sonnet-5-5');
    expect(body.system).toBeTruthy();
    expect(body.temperature).toBeUndefined(); // current Claude models reject it
    expect(body.messages[0].content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' } });
  });

  it('falls back to Claude Haiku when Sonnet fails, then to the rule engine when Claude is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => (JSON.parse(String(init.body)).model === 'claude-sonnet-5-5' ? new Response('overloaded', { status: 529 }) : claudeReply('Haiku answer'))));
    const haiku = await askGroundedAiAssistant({ query: 'Fertiliser for maize?', context, anthropicApiKey: 'k' });
    expect(haiku.modelUsed).toBe('claude-haiku-5-5');
    expect(haiku.providerErrors.some((e) => e.includes('claude claude-sonnet-5-5') && e.includes('529'))).toBe(true);

    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 500 })));
    const rules = await askGroundedAiAssistant({ query: 'Fertiliser for maize?', context, anthropicApiKey: 'k' });
    expect(rules.providerUsed).toBe('rule-engine');
    expect(rules.answer).not.toMatch(/\d+\s*kg\/ha/i);
    expect(rules.answer.toLowerCase()).toContain('soil');
  });

  it('still runs the NAFDAC guardrail on Claude answers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => claudeReply('Spray paraquat before planting.')));
    const res = await askGroundedAiAssistant({ query: 'Weeds?', context, anthropicApiKey: 'k' });
    expect(res.passedSafetyGuardrail).toBe(false);
    expect(res.answer).toContain('SAFETY BLOCK');
    expect(res.answer.toLowerCase()).not.toContain('spray paraquat');
  });
});

describe('NAFDAC guardrail reads the sentence, not just the word', async () => {
  const { checkChemicalSafetyGuardrails } = await import('./chemical-guardrail');
  it('blocks even a warning against a banned product', () => {
    const text = 'Apply NPK 15:15:15 at planting. Never use paraquat for weeding; it is banned in Nigeria.';
    const r = checkChemicalSafetyGuardrails(text);
    expect(r.passed).toBe(false);
    expect(r.sanitizedResponseText).toContain('SAFETY BLOCK');
    expect(r.sanitizedResponseText).not.toContain('NPK 15:15:15');
    expect(r.bannedChemicalsDetected).toContain('paraquat');
  });
  it('still blocks a sentence that recommends one, even next to a warning', () => {
    const r = checkChemicalSafetyGuardrails('Avoid DDT. Spray carbofuran around the stems to kill the borers.');
    expect(r.passed).toBe(false);
    expect(r.sanitizedResponseText).toContain('carbofuran');
    expect(r.sanitizedResponseText).not.toContain('DDT');
  });
  it('does not match parts of other words', () => {
    expect(checkChemicalSafetyGuardrails('Additional ddtx notes and paraquatic plants.').passed).toBe(true);
  });
});
