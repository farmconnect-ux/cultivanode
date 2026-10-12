import { DurableOutboxQueue } from "./outbox-queue";
import type { QueuedMutation, SyncBatchResult, SyncConflictStrategy } from "./types";

export interface SyncExecutor {
  syncMutation(mutation: QueuedMutation): Promise<{ success: boolean; error?: string; serverRecordId?: string }>;
}

export class OfflineSyncManager {
  private queue: DurableOutboxQueue;
  private executor?: SyncExecutor;

  constructor(queue: DurableOutboxQueue, executor?: SyncExecutor) {
    this.queue = queue;
    this.executor = executor;
  }

  setExecutor(executor: SyncExecutor): void {
    this.executor = executor;
  }

  async processSyncQueue(): Promise<SyncBatchResult> {
    const pending = this.queue.getPending();
    const result: SyncBatchResult = {
      processed: 0,
      successful: 0,
      failed: 0,
      conflicts: 0,
      items: [],
    };

    if (!this.executor) {
      throw new Error("No SyncExecutor registered with OfflineSyncManager.");
    }

    for (const mutation of pending) {
      result.processed += 1;
      this.queue.markSyncing(mutation.id);

      try {
        const syncRes = await this.executor.syncMutation(mutation);
        if (syncRes.success) {
          this.queue.markSuccess(mutation.id);
          result.successful += 1;
          result.items.push({
            mutationId: mutation.id,
            success: true,
            serverRecordId: syncRes.serverRecordId,
          });
        } else {
          this.queue.markFailed(mutation.id, syncRes.error || "Sync rejected by server");
          result.failed += 1;
          result.items.push({
            mutationId: mutation.id,
            success: false,
            error: syncRes.error,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.queue.markFailed(mutation.id, message);
        result.failed += 1;
        result.items.push({
          mutationId: mutation.id,
          success: false,
          error: message,
        });
      }
    }

    return result;
  }
}
