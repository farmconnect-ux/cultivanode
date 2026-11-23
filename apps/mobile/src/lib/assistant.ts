// The farm assistant on the phone. It calls the same audited endpoint as the website
// (POST /api/ai/assistant): the server checks the session, the farm, the farmer's consent,
// reads the farm's records, and keeps an audit record of every answer. The phone only sends
// the question, the farm and (optionally) the chosen crop. It never sends a zone or growth stage.
import { getCropById, LEGAL_VERSION } from '@cultivanode/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { reportError } from './monitoring';
import { SITE_URL } from './site';
import { supabase } from './supabase';

const loose = supabase as unknown as SupabaseClient;

export type AssistantCycle = { id: string; plotId: string | null; cropId: string; stage: string | null; cropName: string; cropLocal: string | null };

export type AssistantAnswer = {
  answer: string;
  traceId: string | null;
  usedBasicAdvice: boolean;
  safetyNotes: string[];
  /** LFC-AC-04: several active crops matched and none was chosen. The farmer picks one to ask again. */
  candidates: AssistantCandidate[];
};

export type AssistantCandidate = { cycleId: string; cropId: string; plotId: string | null; plotName: string | null };

function readCandidates(value: unknown): AssistantCandidate[] {
  const list = (value as { candidates?: unknown } | null)?.candidates;
  if (!Array.isArray(list)) return [];
  return list.flatMap((c) => {
    const r = c as Record<string, unknown>;
    if (typeof r.cycleId !== 'string' || typeof r.cropId !== 'string') return [];
    return [{
      cycleId: r.cycleId,
      cropId: r.cropId,
      plotId: typeof r.plotId === 'string' ? r.plotId : null,
      plotName: typeof r.plotName === 'string' ? r.plotName : null,
    }];
  });
}

export type AskResult =
  | { outcome: 'ok'; answer: AssistantAnswer }
  | { outcome: 'consent' | 'offline' | 'signed_out' | 'failed'; ref?: string };

export type FeedbackOutcome = 'accepted' | 'rejected' | 'modified';

/** Active crop cycles the farmer can ask about. Planning, completed and abandoned cycles are left out. */
export const ACTIVE_CYCLE_STATUSES = ['land_preparation', 'planting', 'establishment', 'maintenance', 'harvesting'] as const;

export async function loadAssistantCycles(farmId: string): Promise<AssistantCycle[]> {
  const { data, error } = await loose
    .from('crop_cycles')
    .select('id, plot_id, crop_id, current_stage')
    .eq('farm_id', farmId)
    .in('status', ACTIVE_CYCLE_STATUSES as unknown as string[])
    .order('planting_date', { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as Array<{ id: string; plot_id: string | null; crop_id: string; current_stage: string | null }>).map((r) => ({
    id: r.id,
    plotId: r.plot_id,
    cropId: r.crop_id,
    stage: r.current_stage,
    cropName: getCropById(r.crop_id)?.commonName ?? r.crop_id.replace(/_/g, ' '),
    cropLocal: getCropById(r.crop_id)?.localNames?.yo?.split(' / ')[0] ?? null,
  }));
}

/** True only when the latest ai_intelligence consent is a grant. Unknown counts as not granted. */
export async function hasAiConsent(userId: string): Promise<boolean> {
  const { data, error } = await loose
    .from('current_consents')
    .select('granted')
    .eq('profile_id', userId)
    .eq('consent_type', 'ai_intelligence')
    .maybeSingle();
  if (error) return false;
  return (data as { granted?: boolean } | null)?.granted === true;
}

export async function grantAiConsent(): Promise<boolean> {
  const { error } = await loose
    .from('consents')
    .insert({ consent_type: 'ai_intelligence', granted: true, document_version: LEGAL_VERSION, channel: 'mobile' });
  if (error) {
    reportError('mobile_ai_consent_failed', error, { reason: error.code ?? 'unknown' });
    return false;
  }
  return true;
}

/** Builds the request body. Exported for tests: the context carries ids only. */
export function assistantRequestBody(input: { query: string; language: 'en' | 'yo'; farmId: string; cycle?: AssistantCycle | null }) {
  const { cycle } = input;
  return {
    query: input.query.trim().slice(0, 2000),
    language: input.language,
    context: {
      farmId: input.farmId,
      ...(cycle ? { cycleId: cycle.id, cropId: cycle.cropId, ...(cycle.plotId ? { plotId: cycle.plotId } : {}) } : {}),
    },
  };
}

/** Maps the endpoint's reply to what the screen shows. Exported for tests. */
export function interpretAssistantResponse(status: number, json: unknown): AskResult {
  const body = (json ?? {}) as {
    answer?: string;
    traceId?: string;
    providerUsed?: string;
    safetyAppendices?: string[];
    subjectAmbiguity?: unknown;
    error?: string;
  };
  const ref = typeof body.traceId === 'string' ? body.traceId.slice(0, 8) : undefined;
  if (status >= 200 && status < 300 && typeof body.answer === 'string') {
    return {
      outcome: 'ok',
      answer: {
        answer: body.answer,
        traceId: typeof body.traceId === 'string' ? body.traceId : null,
        usedBasicAdvice: body.providerUsed === 'rule-engine',
        safetyNotes: Array.isArray(body.safetyAppendices) ? body.safetyAppendices.filter((x) => typeof x === 'string') : [],
        candidates: readCandidates(body.subjectAmbiguity),
      },
    };
  }
  if (status === 401) return { outcome: 'signed_out' };
  if (status === 403 && /consent/i.test(body.error ?? '')) return { outcome: 'consent' };
  return { outcome: 'failed', ref };
}

export async function askAssistant(input: { query: string; language: 'en' | 'yo'; farmId: string; cycle?: AssistantCycle | null }): Promise<AskResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { outcome: 'signed_out' };
  let res: Response;
  try {
    res = await fetch(`${SITE_URL}/api/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(assistantRequestBody(input)),
    });
  } catch {
    return { outcome: 'offline' };
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  const result = interpretAssistantResponse(res.status, json);
  if (result.outcome === 'failed') reportError('mobile_assistant_failed', null, { reason: String(res.status) });
  return result;
}

/** UI-AC-04: one rating per person per answer. A second rating is reported as already saved. */
export async function recordAssistantFeedback(traceId: string, outcome: FeedbackOutcome, note?: string): Promise<'saved' | 'already' | 'failed'> {
  const trimmed = note?.trim();
  const { error } = await loose.rpc('record_ai_feedback', {
    p_trace_id: traceId,
    p_outcome: outcome,
    ...(trimmed ? { p_note: trimmed.slice(0, 1000) } : {}),
  });
  if (!error) return 'saved';
  if (error.code === '23505') return 'already';
  reportError('mobile_ai_feedback_failed', error, { reason: error.code ?? 'unknown' });
  return 'failed';
}

/** The AI writes light Markdown; the phone shows plain text. */
export function plainAnswer(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/^#{1,4}\s+/, '').replace(/^\s*[-*]\s+/, '• ').replace(/\*\*([^*]+)\*\*/g, '$1'))
    .join('\n')
    .trim();
}
