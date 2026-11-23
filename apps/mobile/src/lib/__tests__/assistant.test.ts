import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSession = vi.fn();
const mockRpc = vi.fn();

vi.mock('../supabase', () => ({
  supabase: { auth: { getSession: mockGetSession }, from: vi.fn(), rpc: mockRpc },
}));
vi.mock('../monitoring', () => ({ reportError: vi.fn() }));

const cycle = { id: 'c1', plotId: 'p1', cropId: 'maize', stage: 'vegetative', cropName: 'Maize', cropLocal: 'Àgbàdo' };

describe('mobile farm assistant (Batch 03.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('sends ids only: never a zone or growth stage', async () => {
    const { assistantRequestBody } = await import('../assistant');
    const body = assistantRequestBody({ query: '  When should I top-dress?  ', language: 'yo', farmId: 'f1', cycle });
    expect(body).toEqual({ query: 'When should I top-dress?', language: 'yo', context: { farmId: 'f1', cycleId: 'c1', cropId: 'maize', plotId: 'p1' } });
    expect(JSON.stringify(body)).not.toMatch(/zone|stage/i);
    expect(assistantRequestBody({ query: 'x', language: 'en', farmId: 'f1' }).context).toEqual({ farmId: 'f1' });
  });

  it('calls the audited endpoint with the session token', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ answer: '**Yes**', traceId: '12345678-aaaa-4aaa-8aaa-aaaaaaaaaaaa', providerUsed: 'claude', safetyAppendices: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { askAssistant } = await import('../assistant');
    const res = await askAssistant({ query: 'Hi', language: 'en', farmId: 'f1' });
    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/api\/ai\/assistant$/);
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe('Bearer tok');
    expect(res).toEqual({ outcome: 'ok', answer: { answer: '**Yes**', traceId: '12345678-aaaa-4aaa-8aaa-aaaaaaaaaaaa', usedBasicAdvice: false, safetyNotes: [], candidates: [] } });
  });

  it('reads the crop choices when the question matched more than one crop (LFC-AC-04)', async () => {
    const { interpretAssistantResponse } = await import('../assistant');
    const res = interpretAssistantResponse(200, {
      answer: 'Which one?',
      traceId: 't',
      providerUsed: 'rule-engine',
      subjectAmbiguity: {
        status: 'subject_ambiguous',
        candidates: [
          { cycleId: 'c1', cropId: 'maize', plotId: 'p1', plotName: 'North plot' },
          { cycleId: 'c2', cropId: 'cassava', plotId: null },
          { cycleId: 3, cropId: 'bad' },
        ],
      },
    });
    expect(res.outcome === 'ok' && res.answer.candidates).toEqual([
      { cycleId: 'c1', cropId: 'maize', plotId: 'p1', plotName: 'North plot' },
      { cycleId: 'c2', cropId: 'cassava', plotId: null, plotName: null },
    ]);
  });

  it('maps failures to clear outcomes', async () => {
    const { interpretAssistantResponse } = await import('../assistant');
    expect(interpretAssistantResponse(403, { error: 'AI intelligence consent is required.' })).toEqual({ outcome: 'consent' });
    expect(interpretAssistantResponse(401, {})).toEqual({ outcome: 'signed_out' });
    expect(interpretAssistantResponse(503, { error: 'Unable to record AI audit trace.', traceId: 'cb7adc56-0000-4000-8000-000000000000' })).toEqual({
      outcome: 'failed',
      ref: 'cb7adc56',
    });
  });

  it('reports no network as offline, and no session as signed out', async () => {
    const { askAssistant } = await import('../assistant');
    mockGetSession.mockResolvedValue({ data: { session: null } });
    expect(await askAssistant({ query: 'Hi', language: 'en', farmId: 'f1' })).toEqual({ outcome: 'signed_out' });
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network request failed')));
    expect(await askAssistant({ query: 'Hi', language: 'en', farmId: 'f1' })).toEqual({ outcome: 'offline' });
  });

  it('records feedback through record_ai_feedback and treats a repeat as already saved', async () => {
    const { recordAssistantFeedback } = await import('../assistant');
    mockRpc.mockResolvedValueOnce({ data: 'id', error: null });
    expect(await recordAssistantFeedback('t1', 'rejected', '  wrong crop  ')).toBe('saved');
    expect(mockRpc).toHaveBeenCalledWith('record_ai_feedback', { p_trace_id: 't1', p_outcome: 'rejected', p_note: 'wrong crop' });
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: '23505' } });
    expect(await recordAssistantFeedback('t1', 'accepted')).toBe('already');
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    expect(await recordAssistantFeedback('t1', 'accepted')).toBe('failed');
  });

  it('shows the AI light Markdown as plain text', async () => {
    const { plainAnswer } = await import('../assistant');
    expect(plainAnswer('### Plan\n- **Apply** urea\n* Water')).toBe('Plan\n• Apply urea\n• Water');
  });
});
