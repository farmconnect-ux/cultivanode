export type MutationAction = "insert" | "update" | "delete";

export type MutationStatus = "queued" | "syncing" | "failed" | "synced";

export type SyncConflictStrategy = "last_write_wins" | "server_authoritative" | "manual_review";

export interface QueuedMutation<T = unknown> {
  id: string;
  entity: "scouting_log" | "worker_attendance" | "harvest_batch" | "telemetry_reading" | "farm_task" | "offline_registration";
  action: MutationAction;
  payload: T;
  clientTimestamp: string;
  retryCount: number;
  maxRetries: number;
  status: MutationStatus;
  lastError?: string;
  idempotencyKey: string;
}

export interface SyncBatchResult {
  processed: number;
  successful: number;
  failed: number;
  conflicts: number;
  items: Array<{
    mutationId: string;
    success: boolean;
    error?: string;
    serverRecordId?: string;
  }>;
}

export interface ConflictResolution<T = unknown> {
  resolvedPayload: T;
  strategyUsed: SyncConflictStrategy;
  requiresReview: boolean;
}
