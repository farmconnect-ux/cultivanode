// Scouting from the phone: save what you saw, attach photos (private, only you can see them), and ask the
// website's server to have the AI look at them. The AI keys stay on the server; the request carries the
// farmer's own session, so it can only touch their own observations.
import type { SupabaseClient } from '@supabase/supabase-js';
import { reportError } from './monitoring';
import { SITE_URL } from './site';
import { enqueue, newId } from './outbox';
import { supabase } from './supabase';

const loose = supabase as unknown as SupabaseClient;
const isNetwork = (e: { message?: string; code?: string } | null) => Boolean(e) && !e?.code && /network|fetch/i.test(e?.message ?? '');

export const CATEGORIES = ['pest', 'disease', 'nutrient_deficiency', 'weed_infestation', 'water_stress', 'general'] as const;
export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export type Diagnosis = {
  summary: string;
  likely: { name: string; confidence: 'low' | 'medium' | 'high'; why: string }[];
  checks: string[];
  actions: string[];
  urgent: boolean;
  see_expert_if: string;
  safety: string[];
  unclear: boolean;
};

export type NewObservation = {
  cycleId: string;
  category: (typeof CATEGORIES)[number];
  severity: (typeof SEVERITIES)[number];
  title: string;
  description: string;
  photos: string[];
  /** Language for the AI's answer when it is sent later. */
  lang?: 'en' | 'yo';
};

async function upload(userId: string, obsId: string, uri: string): Promise<string | null> {
  try {
    const res = await fetch(uri);
    const bytes = await res.arrayBuffer();
    const type = res.headers.get('content-type') ?? 'image/jpeg';
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    const path = `${userId}/${obsId}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage.from('scouting-photos').upload(path, bytes, { contentType: type.startsWith('image/') ? type : 'image/jpeg', upsert: false });
    return error ? null : path;
  } catch {
    return null;
  }
}

/** Sends one observation (and its photos) with a known id. Used directly and by the outbox. */
export async function sendObservation(userId: string, id: string, payload: Record<string, unknown>): Promise<'ok' | 'offline' | 'rejected'> {
  const o = payload as unknown as NewObservation & { lang?: 'en' | 'yo' };
  const { error } = await supabase
    .from('crop_observations')
    .insert({ id, crop_cycle_id: o.cycleId, category: o.category, severity: o.severity, title: o.title.slice(0, 140), description: o.description.slice(0, 2000), created_by: userId });
  if (error && error.code !== '23505') {
    if (isNetwork(error)) return 'offline';
    reportError('mobile_scout_save_failed', error, { reason: error.code ?? 'unknown' });
    return 'rejected';
  }
  const paths: string[] = [];
  for (const uri of (o.photos ?? []).slice(0, 4)) {
    const p = await upload(userId, id, uri);
    if (p) paths.push(p);
  }
  if (paths.length) await loose.from('crop_observations').update({ photo_urls: paths }).eq('id', id);
  lastPhotoCount.set(id, paths.length);
  return 'ok';
}

const lastPhotoCount = new Map<string, number>();

/** Saves an observation now, or keeps it on the phone (with its photos) to send when there is signal. */
export async function saveObservation(userId: string, o: NewObservation): Promise<{ id: string; photos: number } | { queued: true } | { error: 'errorGeneric' }> {
  const id = newId();
  const res = await sendObservation(userId, id, o);
  if (res === 'ok') return { id, photos: lastPhotoCount.get(id) ?? 0 };
  if (res === 'offline') {
    await enqueue('scout', userId, o, id);
    return { queued: true };
  }
  return { error: 'errorGeneric' };
}

export type AnalyseResult = { outcome: 'done'; diagnosis: Diagnosis } | { outcome: 'off' | 'not_configured' | 'no_photos' | 'not_found' | 'failed' | 'offline' };

export async function analyse(observationId: string, language: 'en' | 'yo'): Promise<AnalyseResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { outcome: 'failed' };
  try {
    const res = await fetch(`${SITE_URL}/api/scouting/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ observation_id: observationId, language }),
    });
    const json = (await res.json()) as { outcome?: string; ai_diagnosis?: Diagnosis };
    if (json.outcome === 'done' && json.ai_diagnosis) return { outcome: 'done', diagnosis: json.ai_diagnosis };
    const known = ['off', 'not_configured', 'no_photos', 'not_found', 'failed'] as const;
    return { outcome: (known as readonly string[]).includes(json.outcome ?? '') ? (json.outcome as (typeof known)[number]) : 'failed' };
  } catch {
    return { outcome: 'offline' };
  }
}
