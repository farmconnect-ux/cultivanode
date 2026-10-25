import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory stand-ins for the phone: storage, the app state and the server.
const store = new Map<string, string>();
let server: 'up' | 'down' | 'duplicate' | 'reject' = 'up';
const inserted: { table: string; row: Record<string, unknown> }[] = [];
let uuid = 0;

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
  },
}));
vi.mock('expo-crypto', () => ({ randomUUID: () => `id-${++uuid}` }));
vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: () => ({ remove: () => undefined }) } }));
vi.mock('../monitoring', () => ({ reportError: () => undefined }));
vi.mock('../supabase', () => ({
  supabase: {
    from: (table: string) => ({
      insert: async (row: Record<string, unknown>) => {
        if (server === 'down') return { error: { message: 'TypeError: Network request failed' } };
        if (server === 'duplicate') return { error: { code: '23505', message: 'duplicate key' } };
        if (server === 'reject') return { error: { code: '23514', message: 'check constraint' } };
        inserted.push({ table, row });
        return { error: null };
      },
    }),
  },
}));

async function fresh() {
  vi.resetModules();
  return import('../outbox');
}

beforeEach(() => {
  store.clear();
  inserted.length = 0;
  server = 'up';
});

describe('outbox', () => {
  it('sends right away when there is signal', async () => {
    const o = await fresh();
    expect(await o.submit('book_entry', 'u1', { farm_id: 'f1', amount_kobo: 500 })).toBe('sent');
    expect(inserted).toHaveLength(1);
    expect(inserted[0].table).toBe('farm_financial_transactions');
    expect(inserted[0].row).toMatchObject({ recorded_by: 'u1', farm_id: 'f1' });
    expect(await o.pending()).toHaveLength(0);
  });

  it('keeps records on the phone with no signal and sends them, in order, when it is back', async () => {
    const o = await fresh();
    server = 'down';
    expect(await o.submit('inventory_add', 'u1', { item_name: 'NPK' })).toBe('queued');
    expect(await o.submit('herd_add', 'u1', { group_name: 'Broilers' })).toBe('queued');
    expect(await o.pending()).toHaveLength(2);
    expect((await o.flush()).left).toBe(2); // still no signal: nothing lost

    server = 'up';
    expect(await o.flush()).toEqual({ sent: 2, left: 0 });
    expect(inserted.map((i) => i.table)).toEqual(['farm_inventory', 'farm_livestock_groups']);
    // Each record went with the id it was given on the phone.
    expect(inserted.every((i) => typeof i.row.id === 'string')).toBe(true);
  });

  it('treats a record the server already has as sent (no duplicates after a dropped connection)', async () => {
    const o = await fresh();
    server = 'down';
    await o.submit('herd_feed', 'u1', { group_id: 'g1', quantity_kg: 5 });
    server = 'duplicate';
    expect(await o.flush()).toEqual({ sent: 1, left: 0 });
  });

  it('does not keep a record the server refuses when saving, and gives up on queued ones after a few tries', async () => {
    const o = await fresh();
    server = 'reject';
    expect(await o.submit('inventory_add', 'u1', { item_name: 'x' })).toBe('rejected');
    expect(await o.pending()).toHaveLength(0);

    server = 'down';
    await o.submit('inventory_add', 'u1', { item_name: 'NPK' });
    server = 'reject';
    for (let i = 0; i < 4; i++) expect((await o.flush()).left).toBe(1);
    expect((await o.flush()).left).toBe(0);
  });

  it('survives an app restart', async () => {
    let o = await fresh();
    server = 'down';
    await o.submit('book_entry', 'u1', { farm_id: 'f1' });
    o = await fresh(); // new process, same phone storage
    expect(await o.pending('book_entry')).toHaveLength(1);
    server = 'up';
    expect((await o.flush()).sent).toBe(1);
  });
});
