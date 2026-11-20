import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkChemicalSafetyGuardrails: vi.fn(),
}));

vi.mock('./chemical-guardrail', () => ({
  checkChemicalSafetyGuardrails: mocks.checkChemicalSafetyGuardrails,
}));

import { askGroundedAiAssistant } from './llm-adapter';

afterEach(() => vi.unstubAllGlobals());

describe('AI assistant chemical guardrail failure handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fall back to another provider when safety evaluation throws', async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ content: [{ type: 'text', text: 'Apply a recommended fertiliser.' }] }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', fetchMock);
    mocks.checkChemicalSafetyGuardrails.mockImplementation(() => {
      throw new Error('guardrail evaluation unavailable');
    });

    await expect(askGroundedAiAssistant({
      query: 'How should I fertilise maize?',
      context: { farmerId: 'farm-user', cropId: 'maize', zone: 'rainforest' },
      anthropicApiKey: 'test-key',
      geminiApiKey: 'gemini-test-key',
      openaiApiKey: 'openai-test-key',
    })).rejects.toThrow('guardrail evaluation unavailable');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.checkChemicalSafetyGuardrails).toHaveBeenCalledTimes(1);
  });

  it('retains provider fallback for ordinary provider transport failures', async () => {
    const fetchMock = vi.fn(async () => new Response('provider unavailable', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    mocks.checkChemicalSafetyGuardrails.mockReturnValue({
      passed: true,
      bannedChemicalsDetected: [],
      approvedChemicalsDetected: [],
      safetyAppendices: [],
      sanitizedResponseText: 'GAP agronomic guidance.',
    });

    const result = await askGroundedAiAssistant({
      query: 'How should I fertilise maize?',
      context: { farmerId: 'farm-user', cropId: 'maize', zone: 'rainforest' },
      anthropicApiKey: 'test-key',
    });

    expect(result.providerUsed).toBe('rule-engine');
    expect(result.passedSafetyGuardrail).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
