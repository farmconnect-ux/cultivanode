import { describe, it, expect } from "vitest";
import { DurableOutboxQueue } from "./outbox-queue";
import { OfflineSyncManager } from "./sync-manager";
import type { SyncExecutor } from "./sync-manager";

describe("DurableOutboxQueue", () => {
  it("enqueues field mutations with idempotent keys and pending status", () => {
    const queue = new DurableOutboxQueue();
    const mutation = queue.enqueue("scouting_log", "insert", {
      plot_id: "plot-123",
      observed_issue: "Fall Armyworm early instar",
      severity: "medium",
    });

    expect(mutation.id).toBeDefined();
    expect(mutation.idempotencyKey).toBe(`idemp_${mutation.id}`);
    expect(mutation.status).toBe("queued");
    expect(mutation.retryCount).toBe(0);

    const pending = queue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].entity).toBe("scouting_log");
  });

  it("calculates exponential backoff with ceiling", () => {
    const queue = new DurableOutboxQueue();
    const b0 = queue.calculateBackoffMs(0, 1000, 30000);
    const b1 = queue.calculateBackoffMs(1, 1000, 30000);
    const b2 = queue.calculateBackoffMs(2, 1000, 30000);
    const b10 = queue.calculateBackoffMs(10, 1000, 30000);

    expect(b0).toBeGreaterThanOrEqual(1000);
    expect(b1).toBeGreaterThanOrEqual(2000);
    expect(b2).toBeGreaterThanOrEqual(4000);
    expect(b10).toBeLessThanOrEqual(33000); // 30000 max + 10% jitter
  });

  it("resolves conflicts using Last-Write-Wins", () => {
    const queue = new DurableOutboxQueue();
    const clientRecord = {
      id: "task-1",
      title: "Client Offline Title",
      updated_at: "2026-10-12T10:00:00Z",
    };
    const serverRecord = {
      id: "task-1",
      title: "Server Newer Title",
      updated_at: "2026-10-12T10:05:00Z",
    };

    const resolution = queue.resolveConflict(clientRecord, serverRecord, "last_write_wins");
    expect(resolution.resolvedPayload.title).toBe("Server Newer Title");
    expect(resolution.requiresReview).toBe(false);
  });

  it("processes queue with OfflineSyncManager", async () => {
    const queue = new DurableOutboxQueue();
    queue.enqueue("worker_attendance", "insert", {
      worker_id: "worker-1",
      date: "2026-10-12",
      status: "present",
    });

    const mockExecutor: SyncExecutor = {
      syncMutation: async (m) => {
        return { success: true, serverRecordId: `srv_${m.id}` };
      },
    };

    const manager = new OfflineSyncManager(queue, mockExecutor);
    const batchResult = await manager.processSyncQueue();

    expect(batchResult.processed).toBe(1);
    expect(batchResult.successful).toBe(1);
    expect(batchResult.failed).toBe(0);

    const pendingAfter = queue.getPending();
    expect(pendingAfter).toHaveLength(0);
  });
});
