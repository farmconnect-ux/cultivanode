import { describe, expect, it } from 'vitest';
import { OfflineSyncQueue, type SyncStorage } from '../offline-sync';

function createMockStorage(): SyncStorage {
  const store = new Map<string, string>();
  return {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
  };
}

describe('Offline Sync Queue (CM-15)', () => {
  it('enqueues offline items and persists in storage', async () => {
    const storage = createMockStorage();
    const queue = new OfflineSyncQueue(storage);

    const item1 = await queue.enqueue('scouting_observation', {
      cycleId: 'cycle_1',
      category: 'pest',
      severity: 'high',
      description: 'Fall armyworm in Block B',
    });

    const item2 = await queue.enqueue('complete_operation', {
      operationId: 'op_1',
      actualCostKobo: 500000,
    });

    const all = await queue.getQueue();
    expect(all).toHaveLength(2);
    expect(all[0]?.id).toBe(item1.id);
    expect(all[1]?.id).toBe(item2.id);
  });

  it('successfully processes queue items and removes synced records', async () => {
    const storage = createMockStorage();
    const queue = new OfflineSyncQueue(storage);

    await queue.enqueue('scouting_observation', { note: 'test 1' });
    await queue.enqueue('scouting_observation', { note: 'test 2' });

    const result = await queue.processSync(async (item) => {
      // simulate network upload success
      return true;
    });

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);

    const remaining = await queue.getQueue();
    expect(remaining).toHaveLength(0);
  });

  it('retains failed items with incremented attempt count', async () => {
    const storage = createMockStorage();
    const queue = new OfflineSyncQueue(storage);

    await queue.enqueue('scouting_observation', { note: 'offline failing item' });

    const result = await queue.processSync(async () => {
      // simulate network error
      return false;
    });

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);

    const remaining = await queue.getQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.attempts).toBe(1);
  });
});
