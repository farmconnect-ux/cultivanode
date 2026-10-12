import type {
  QueuedMutation,
  SyncConflictStrategy,
  ConflictResolution,
} from "./types";

export class DurableOutboxQueue {
  private queue: QueuedMutation[] = [];

  constructor(initialItems: QueuedMutation[] = []) {
    this.queue = [...initialItems];
  }

  enqueue<T>(
    entity: QueuedMutation["entity"],
    action: QueuedMutation["action"],
    payload: T,
    options?: { id?: string; maxRetries?: number }
  ): QueuedMutation<T> {
    const id = options?.id || `mut_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const mutation: QueuedMutation<T> = {
      id,
      entity,
      action,
      payload,
      clientTimestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: options?.maxRetries ?? 5,
      status: "queued",
      idempotencyKey: `idemp_${id}`,
    };

    this.queue.push(mutation as QueuedMutation);
    return mutation;
  }

  getPending(): QueuedMutation[] {
    return this.queue.filter((m) => m.status === "queued" || m.status === "failed");
  }

  getAll(): QueuedMutation[] {
    return [...this.queue];
  }

  markSyncing(id: string): void {
    const item = this.queue.find((m) => m.id === id);
    if (item) {
      item.status = "syncing";
    }
  }

  markSuccess(id: string): void {
    const item = this.queue.find((m) => m.id === id);
    if (item) {
      item.status = "synced";
      item.lastError = undefined;
    }
  }

  markFailed(id: string, error: string): void {
    const item = this.queue.find((m) => m.id === id);
    if (item) {
      item.retryCount += 1;
      item.lastError = error;
      item.status = item.retryCount >= item.maxRetries ? "failed" : "queued";
    }
  }

  clearSynced(): void {
    this.queue = this.queue.filter((m) => m.status !== "synced");
  }

  calculateBackoffMs(retryCount: number, baseMs = 1000, maxMs = 30000): number {
    const backoff = Math.min(maxMs, baseMs * Math.pow(2, retryCount));
    // Add 10% jitter
    const jitter = backoff * (Math.random() * 0.1);
    return Math.round(backoff + jitter);
  }

  resolveConflict<T extends { updated_at?: string }>(
    clientRecord: T,
    serverRecord: T,
    strategy: SyncConflictStrategy = "last_write_wins"
  ): ConflictResolution<T> {
    if (strategy === "server_authoritative") {
      return {
        resolvedPayload: serverRecord,
        strategyUsed: strategy,
        requiresReview: false,
      };
    }

    if (strategy === "manual_review") {
      return {
        resolvedPayload: clientRecord,
        strategyUsed: strategy,
        requiresReview: true,
      };
    }

    // Default: Last-Write-Wins based on ISO timestamps
    const clientTime = clientRecord.updated_at ? new Date(clientRecord.updated_at).getTime() : 0;
    const serverTime = serverRecord.updated_at ? new Date(serverRecord.updated_at).getTime() : 0;

    const winner = clientTime >= serverTime ? clientRecord : serverRecord;
    return {
      resolvedPayload: winner,
      strategyUsed: "last_write_wins",
      requiresReview: false,
    };
  }
}
