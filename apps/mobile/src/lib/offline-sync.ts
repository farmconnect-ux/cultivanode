// Offline sync queue for field agents and farmers in rural low-connectivity areas.
// Stores pending scouting logs, measurements, and completed operations locally
// and synchronizes deterministically once an internet connection is re-established.

export type SyncItemKind = 'scouting_observation' | 'complete_operation' | 'crop_measurement' | 'harvest_record';

export interface PendingSyncItem {
  id: string;
  kind: SyncItemKind;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export interface SyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const STORAGE_KEY = 'cn_offline_sync_queue_v1';

export class OfflineSyncQueue {
  private storage: SyncStorage;

  constructor(storage: SyncStorage) {
    this.storage = storage;
  }

  async getQueue(): Promise<PendingSyncItem[]> {
    try {
      const raw = await this.storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as PendingSyncItem[];
    } catch {
      return [];
    }
  }

  async enqueue(kind: SyncItemKind, payload: Record<string, unknown>): Promise<PendingSyncItem> {
    const queue = await this.getQueue();
    const item: PendingSyncItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      kind,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    queue.push(item);
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return item;
  }

  async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((i) => i.id !== id);
    await this.storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  async processSync(
    handler: (item: PendingSyncItem) => Promise<boolean>
  ): Promise<{ synced: number; failed: number }> {
    const queue = await this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: PendingSyncItem[] = [];

    for (const item of queue) {
      try {
        const success = await handler(item);
        if (success) {
          synced++;
        } else {
          item.attempts += 1;
          remaining.push(item);
          failed++;
        }
      } catch (err) {
        item.attempts += 1;
        item.lastError = String(err);
        remaining.push(item);
        failed++;
      }
    }

    await this.storage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    return { synced, failed };
  }
}
