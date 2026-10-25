// The phone's outbox. Every record a farmer saves (books, store, animals, crop checks) is tried right away;
// with no signal it waits here and is sent as soon as the phone is back online: when the app comes to the
// front, and every 20 seconds while it is open and something is waiting. Each record carries its own id, so
// sending it twice (a retry after a dropped connection) never makes a duplicate.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { reportError } from './monitoring';
import { supabase } from './supabase';

const db = supabase as unknown as SupabaseClient;
const KEY = 'cn.outbox.v1';
const LEGACY_KEY = 'cn_offline_sync_queue_v1';
const MAX_ATTEMPTS = 5;
const RETRY_MS = 20_000;

export type OutboxKind = 'inventory_add' | 'book_entry' | 'herd_add' | 'herd_feed' | 'herd_health' | 'herd_loss' | 'scout';

export type OutboxItem = {
  id: string;
  kind: OutboxKind;
  userId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
};

type Outcome = 'ok' | 'offline' | 'rejected';
type Handler = (item: OutboxItem) => Promise<Outcome>;

export const newId = () => Crypto.randomUUID();

const isNetwork = (e: unknown) => {
  const err = e as { message?: string; code?: string } | null;
  return Boolean(err) && !err?.code && /network|fetch|timed? ?out|abort/i.test(err?.message ?? '');
};

/** Insert one row with the record's own id. Already there (sent before the connection dropped) counts as sent. */
async function insertOnce(table: string, row: Record<string, unknown>): Promise<Outcome | 'fresh'> {
  const { error } = await db.from(table).insert(row);
  if (!error) return 'fresh';
  if (error.code === '23505') return 'ok';
  if (isNetwork(error)) return 'offline';
  reportError('mobile_outbox_rejected', error, { table, reason: error.code ?? 'unknown' });
  return 'rejected';
}

const simple = (table: string): Handler => async (item) => {
  const r = await insertOnce(table, { id: item.id, ...item.payload });
  return r === 'fresh' ? 'ok' : r;
};

const handlers: Record<OutboxKind, Handler> = {
  inventory_add: simple('farm_inventory'),
  book_entry: async (item) => {
    const r = await insertOnce('farm_financial_transactions', { id: item.id, recorded_by: item.userId, ...item.payload });
    return r === 'fresh' ? 'ok' : r;
  },
  herd_add: simple('farm_livestock_groups'),
  herd_feed: simple('farm_livestock_feedings'),
  herd_health: simple('farm_livestock_health_events'),
  herd_loss: async (item) => {
    // A loss is a health event, and the herd gets smaller, but only the first time it arrives.
    const r = await insertOnce('farm_livestock_health_events', { id: item.id, event_type: 'mortality', ...item.payload });
    if (r !== 'fresh') return r;
    const groupId = item.payload.group_id as string;
    const lost = Number(item.payload.head_affected) || 0;
    const { data } = await db.from('farm_livestock_groups').select('population').eq('id', groupId).maybeSingle();
    if (data) await db.from('farm_livestock_groups').update({ population: Math.max(0, Number(data.population) - lost) }).eq('id', groupId);
    return 'ok';
  },
  scout: async (item) => {
    // Lazy import: scout.ts imports this file to queue observations.
    const { analyse, sendObservation } = await import('./scout');
    const r = await sendObservation(item.userId, item.id, item.payload);
    if (r === 'ok' && Array.isArray(item.payload.photos) && item.payload.photos.length) {
      analyse(item.id, item.payload.lang === 'yo' ? 'yo' : 'en').catch(() => undefined); // the AI's answer shows on the farm's scouting log
    }
    return r;
  },
};

// ---- storage and change notifications ----

const listeners = new Set<(items: OutboxItem[]) => void>();
let cache: OutboxItem[] | null = null;

async function read(): Promise<OutboxItem[]> {
  if (cache) return cache;
  try {
    cache = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]') as OutboxItem[];
  } catch {
    cache = [];
  }
  return cache;
}

async function write(items: OutboxItem[]) {
  cache = items;
  await AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => undefined);
  listeners.forEach((l) => l(items));
}

export async function pending(kind?: OutboxKind): Promise<OutboxItem[]> {
  const items = await read();
  return kind ? items.filter((i) => i.kind === kind) : items;
}

/** Records still on the phone, kept up to date as they are sent. */
export function useOutbox(kinds?: OutboxKind[]): OutboxItem[] {
  const [items, setItems] = useState<OutboxItem[]>(cache ?? []);
  const key = kinds?.join(',') ?? '';
  useEffect(() => {
    const want = key ? key.split(',') : null;
    const set = (all: OutboxItem[]) => setItems(want ? all.filter((i) => want.includes(i.kind)) : all);
    read().then(set);
    listeners.add(set);
    return () => {
      listeners.delete(set);
    };
  }, [key]);
  return items;
}

/**
 * Saves a record: sent now when there is signal, otherwise kept on the phone and sent later.
 * 'rejected' means the server refused it (bad data); nothing is kept in that case.
 */
export async function submit(kind: OutboxKind, userId: string, payload: Record<string, unknown>, id = newId()): Promise<'sent' | 'queued' | 'rejected'> {
  const item: OutboxItem = { id, kind, userId, payload, createdAt: new Date().toISOString(), attempts: 0 };
  let outcome: Outcome;
  try {
    outcome = await handlers[kind](item);
  } catch (e) {
    outcome = isNetwork(e) ? 'offline' : 'rejected';
  }
  if (outcome === 'ok') {
    flush().catch(() => undefined); // signal is back: send anything older too
    return 'sent';
  }
  if (outcome === 'rejected') return 'rejected';
  await write([...(await read()), item]);
  return 'queued';
}

/** Keeps a record on the phone to send later (the caller already found there is no signal). */
export async function enqueue(kind: OutboxKind, userId: string, payload: Record<string, unknown>, id = newId()): Promise<void> {
  await write([...(await read()), { id, kind, userId, payload, createdAt: new Date().toISOString(), attempts: 0 }]);
}

let running: Promise<{ sent: number; left: number }> | null = null;

/** Sends everything waiting, oldest first. Stops at the first sign of no signal. */
export function flush(): Promise<{ sent: number; left: number }> {
  if (running) return running;
  running = (async () => {
    const items = [...(await read())];
    if (!items.length) return { sent: 0, left: 0 };
    let sent = 0;
    const left: OutboxItem[] = [];
    let offline = false;
    for (const item of items) {
      if (offline) {
        left.push(item);
        continue;
      }
      let outcome: Outcome;
      try {
        outcome = await handlers[item.kind](item);
      } catch (e) {
        outcome = isNetwork(e) ? 'offline' : 'rejected';
      }
      if (outcome === 'ok') sent++;
      else if (outcome === 'offline') {
        offline = true;
        left.push(item);
      } else if (item.attempts + 1 < MAX_ATTEMPTS) left.push({ ...item, attempts: item.attempts + 1, lastError: 'rejected' });
      else reportError('mobile_outbox_dropped', new Error(item.kind), { kind: item.kind });
    }
    // Something may have been queued while we were sending.
    const now = await read();
    const handled = new Set(items.map((i) => i.id));
    await write([...left, ...now.filter((i) => !handled.has(i.id))]);
    return { sent, left: left.length };
  })().finally(() => {
    running = null;
  });
  return running;
}

type Extra = () => Promise<unknown>;

/**
 * Keeps the outbox moving while the app runs: on start, whenever the app returns to the front, and on a timer
 * while something is waiting. `extra` sends other queues (lots saved on the market screen).
 */
export function startAutoSync(extra?: Extra): () => void {
  const tick = async () => {
    if (AppState.currentState !== 'active') return;
    const waiting = (await read()).length;
    if (waiting) await flush().catch(() => undefined);
    if (extra) await extra().catch(() => undefined);
  };
  AsyncStorage.removeItem(LEGACY_KEY).catch(() => undefined); // the old queue was never sent and held unusable rows
  tick();
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active') tick();
  });
  const timer = setInterval(tick, RETRY_MS);
  return () => {
    sub.remove();
    clearInterval(timer);
  };
}
