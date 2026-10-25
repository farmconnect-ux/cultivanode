// Farm records on the phone: the books (money in and out), the store (inputs and produce) and the animals.
// Lists are kept on the phone too, so they still open with no signal; anything saved offline waits in the
// outbox (lib/outbox.ts) and shows in the lists as "waiting to send".
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

const db = supabase as unknown as SupabaseClient;

async function cached<T>(key: string, load: () => Promise<T>): Promise<{ data: T; offline: boolean }> {
  try {
    const data = await load();
    AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => undefined);
    return { data, offline: false };
  } catch {
    const raw = await AsyncStorage.getItem(key).catch(() => null);
    if (raw) return { data: JSON.parse(raw) as T, offline: true };
    throw new Error('offline');
  }
}

async function rows<T>(q: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

// ---- books ----

export const INCOME_CATEGORIES = ['harvest_sale', 'livestock_sale', 'machinery_service', 'other'] as const;
export const EXPENSE_CATEGORIES = ['seeds', 'fertilisers', 'chemicals', 'labour_wages', 'feed', 'fuel', 'repairs', 'machinery_service', 'other'] as const;
export type BookCategory = (typeof INCOME_CATEGORIES)[number] | (typeof EXPENSE_CATEGORIES)[number];
export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'mobile_money'] as const;

export type BookEntry = { id: string; type: 'income' | 'expense'; category: string; description: string; amountKobo: number; date: string | null };

export const loadBook = (farmId: string) =>
  cached(`cn.book.${farmId}`, async () =>
    (
      await rows<{ id: string; type: 'income' | 'expense'; category: string; description: string; amount_kobo: number; transaction_date: string | null }>(
        db.from('farm_financial_transactions').select('id, type, category, description, amount_kobo, transaction_date').eq('farm_id', farmId).order('transaction_date', { ascending: false }).order('created_at', { ascending: false }).limit(100),
      )
    ).map((r) => ({ id: r.id, type: r.type, category: r.category, description: r.description, amountKobo: Number(r.amount_kobo), date: r.transaction_date })),
  );

// ---- store ----

export const STORE_CATEGORIES = ['seed', 'fertiliser', 'chemical', 'feed', 'harvest_produce', 'fuel', 'tool_equipment', 'other'] as const;
export const STORE_UNITS = ['bags', 'kg', 'tons', 'liters', 'crates', 'bundles', 'units'] as const;

export type StoreItem = { id: string; name: string; category: string; quantity: number; unit: string; low: boolean };

export const loadStore = (farmId: string) =>
  cached(`cn.store.${farmId}`, async () =>
    (
      await rows<{ id: string; item_name: string; category: string; quantity: number; unit: string; reorder_threshold: number | null }>(
        db.from('farm_inventory').select('id, item_name, category, quantity, unit, reorder_threshold').eq('farm_id', farmId).order('item_name').limit(200),
      )
    ).map((r) => ({
      id: r.id,
      name: r.item_name,
      category: r.category,
      quantity: Number(r.quantity) || 0,
      unit: r.unit,
      low: r.reorder_threshold != null && Number(r.quantity) <= Number(r.reorder_threshold),
    })),
  );

/** Changes how much of an item is in the store (online only: the number must be right). */
export async function setStoreQuantity(id: string, quantity: number): Promise<'ok' | 'offline' | 'error'> {
  const { error } = await db.from('farm_inventory').update({ quantity: Math.max(0, quantity), updated_at: new Date().toISOString() }).eq('id', id);
  if (!error) return 'ok';
  return !error.code && /network|fetch/i.test(error.message) ? 'offline' : 'error';
}

// ---- animals ----

export const ANIMAL_TYPES = ['poultry', 'fish', 'goats', 'sheep', 'cattle', 'pigs', 'rabbits', 'snails', 'other'] as const;
export const PURPOSES = ['meat', 'eggs', 'dairy', 'breeding', 'multi'] as const;
export const HEALTH_TYPES = ['vaccination', 'treatment', 'vet_visit', 'routine_check', 'disease_diagnosis'] as const;

export type Herd = { id: string; name: string; type: string; purpose: string | null; population: number; ageWeeks: number | null; health: string | null; breed: string | null };

type HerdRow = { id: string; group_name: string; animal_type: string; purpose: string | null; population: number; age_weeks: number | null; health_status: string | null; breed: string | null };
const herd = (r: HerdRow): Herd => ({ id: r.id, name: r.group_name, type: r.animal_type, purpose: r.purpose, population: Number(r.population) || 0, ageWeeks: r.age_weeks, health: r.health_status, breed: r.breed });
const HERD_COLS = 'id, group_name, animal_type, purpose, population, age_weeks, health_status, breed';

export const loadHerds = (farmId: string) =>
  cached(`cn.herds.${farmId}`, async () => (await rows<HerdRow>(db.from('farm_livestock_groups').select(HERD_COLS).eq('farm_id', farmId).order('created_at'))).map(herd));

export type HerdEvent = { id: string; kind: 'feed' | 'health' | 'loss'; title: string; detail: string | null; date: string };

export const loadHerd = (groupId: string) =>
  cached(`cn.herd.${groupId}`, async () => {
    const [g, feeds, health] = await Promise.all([
      rows<HerdRow>(db.from('farm_livestock_groups').select(HERD_COLS).eq('id', groupId).limit(1)),
      rows<{ id: string; feed_type: string; quantity_kg: number; feeding_date: string | null; created_at: string }>(
        db.from('farm_livestock_feedings').select('id, feed_type, quantity_kg, feeding_date, created_at').eq('group_id', groupId).order('created_at', { ascending: false }).limit(20),
      ),
      rows<{ id: string; event_type: string; medication_name: string | null; head_affected: number | null; notes: string | null; administered_on: string | null; created_at: string }>(
        db.from('farm_livestock_health_events').select('id, event_type, medication_name, head_affected, notes, administered_on, created_at').eq('group_id', groupId).order('created_at', { ascending: false }).limit(20),
      ),
    ]);
    if (!g[0]) throw new Error('not_found');
    const events: HerdEvent[] = [
      ...feeds.map((f) => ({ id: f.id, kind: 'feed' as const, title: f.feed_type, detail: `${Number(f.quantity_kg)} kg`, date: f.feeding_date ?? f.created_at })),
      ...health.map((h) => ({
        id: h.id,
        kind: h.event_type === 'mortality' ? ('loss' as const) : ('health' as const),
        title: h.event_type,
        detail: h.event_type === 'mortality' ? String(h.head_affected ?? 0) : h.medication_name ?? h.notes,
        date: h.administered_on ?? h.created_at,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    return { herd: herd(g[0]), events: events.slice(0, 30) };
  });

export const todayIso = () => new Date().toISOString().slice(0, 10);
