// Farm alerts on the phone (Batch 05). The daily farm monitors raise in-app notifications whose kind
// starts with "farm_". The phone shows the open ones for the chosen farm and lets the farmer answer
// Useful / Not useful / Done through respond_to_intelligence_event, the same path as the website.
import type { SupabaseClient } from '@supabase/supabase-js';
import { reportError } from './monitoring';
import { supabase } from './supabase';

const loose = supabase as unknown as SupabaseClient;

export const FARM_ALERT_KINDS = [
  'farm_operation_upcoming',
  'farm_operation_overdue',
  'farm_task_overdue',
  'farm_soil_test_needed',
  'farm_weather_risk',
  'farm_stock_low',
  'farm_stock_expiring',
] as const;

export type FarmAlertKind = (typeof FARM_ALERT_KINDS)[number];
export type AlertResponse = 'useful' | 'not_useful' | 'done';

export type FarmAlert = {
  id: string;
  eventId: string;
  kind: FarmAlertKind;
  title: string;
  name: string;
  date: string | null;
  note: string;
  createdAt: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isKind = (k: unknown): k is FarmAlertKind => typeof k === 'string' && (FARM_ALERT_KINDS as readonly string[]).includes(k);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

type Row = { id: string; kind: string; data: unknown; created_at: string };

/** Turns notification rows into alerts for one farm. Rows of other kinds, other farms or without an event are dropped. */
export function toFarmAlerts(rows: Row[], farmId: string): FarmAlert[] {
  return rows.flatMap((r) => {
    const d = (r.data ?? {}) as Record<string, unknown>;
    if (!isKind(r.kind) || d.farm_id !== farmId || typeof d.event_id !== 'string' || !UUID.test(d.event_id)) return [];
    const date = typeof d.job_date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d.job_date) ? d.job_date.slice(0, 10) : null;
    return [{
      id: r.id,
      eventId: d.event_id,
      kind: r.kind,
      title: str(d.title, 120),
      name: str(d.name, 120),
      date,
      note: str(d.note, 120),
      createdAt: r.created_at,
    }];
  });
}

/** Open (unanswered) farm alerts for a farm, newest first. */
export async function loadFarmAlerts(farmId: string): Promise<FarmAlert[]> {
  const { data, error } = await loose
    .from('notifications')
    .select('id, kind, data, created_at')
    .in('kind', FARM_ALERT_KINDS as unknown as string[])
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) {
    reportError('farm_alerts_load_failed', error);
    return [];
  }
  return toFarmAlerts((data ?? []) as Row[], farmId);
}

/** Saves the farmer's answer, then marks the notification read so it leaves the list. */
export async function answerFarmAlert(alert: Pick<FarmAlert, 'id' | 'eventId'>, response: AlertResponse): Promise<boolean> {
  const { error } = await loose.rpc('respond_to_intelligence_event', { p_event_id: alert.eventId, p_response: response });
  if (error) {
    reportError('farm_alerts_answer_failed', error, { response });
    return false;
  }
  await loose.rpc('mark_notifications_read', { p_ids: [alert.id] });
  return true;
}
