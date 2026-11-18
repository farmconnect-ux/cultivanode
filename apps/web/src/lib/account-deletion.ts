import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";
import { logger } from "@/lib/logger";

export type StorageCleanupSummary = {
  attempted: number;
  removed: number;
  failed: number;
  recordFailed: number;
  lastRemainingCount: number | null;
};

export type ReconciliationSummary = {
  storage: StorageCleanupSummary;
  inspected: number;
  finalized: number;
  stillPending: number;
  errors: number;
};

function isAuthNotFoundError(error: { status?: number; code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.status === 404 || error.code === "user_not_found") return true;
  return /not found/i.test(error.message ?? "");
}

function parseRemainingCount(data: unknown): number | null {
  if (!data || typeof data !== "object" || !("remaining_count" in data)) return null;
  const val = (data as { remaining_count?: unknown }).remaining_count;
  return typeof val === "number" && Number.isFinite(val) ? val : null;
}

/**
 * Claims pending, failed, or lease-expired processing Storage cleanup items from the
 * durable `account_deletion_storage_cleanup` queue and deletes each object via Storage API.
 * Every `record_account_deletion_storage_result` RPC result is checked explicitly so an
 * unrecorded deletion is never counted as completed.
 */
export async function processPendingStorageCleanup(
  supabaseAdmin: SupabaseClient<Database>,
  userId?: string,
  leaseSeconds?: number,
): Promise<StorageCleanupSummary> {
  const claimArgs: { p_user_id?: string; p_lease_seconds?: number } = {};
  if (userId) claimArgs.p_user_id = userId;
  if (typeof leaseSeconds === "number") claimArgs.p_lease_seconds = leaseSeconds;

  const { data: claimed, error: claimErr } = await supabaseAdmin.rpc(
    "claim_account_deletion_storage_cleanup",
    claimArgs,
  );

  if (claimErr) {
    throw new Error(claimErr.message || "Failed to claim Storage cleanup items.");
  }

  const rows = Array.isArray(claimed) ? claimed : [];
  let removed = 0;
  let failed = 0;
  let recordFailed = 0;
  let lastRemainingCount: number | null = null;

  for (const row of rows) {
    const { error: rmErr } = await supabaseAdmin.storage
      .from(row.bucket_id)
      .remove([row.storage_path]);

    if (rmErr) {
      failed += 1;
      const { data: recData, error: recErr } = await supabaseAdmin.rpc(
        "record_account_deletion_storage_result",
        {
          p_cleanup_id: row.id,
          p_status: "failed",
          p_error: rmErr.message || "Storage removal failed",
        },
      );
      if (recErr) {
        recordFailed += 1;
        logger.error("account_delete_record_storage_failure_failed", {
          code: recErr.code ?? "unknown",
        });
      } else {
        const parsed = parseRemainingCount(recData);
        if (parsed !== null) lastRemainingCount = parsed;
      }
      continue;
    }

    const { data: recData, error: recErr } = await supabaseAdmin.rpc(
      "record_account_deletion_storage_result",
      {
        p_cleanup_id: row.id,
        p_status: "completed",
      },
    );

    if (recErr || !recData || typeof recData !== "object") {
      recordFailed += 1;
      logger.error("account_delete_record_storage_completion_failed", {
        code: recErr?.code ?? "invalid_response",
      });
      continue;
    }

    const parsed = parseRemainingCount(recData);
    if (parsed !== null) lastRemainingCount = parsed;
    removed += 1;
  }

  return {
    attempted: rows.length,
    removed,
    failed,
    recordFailed,
    lastRemainingCount,
  };
}

/**
 * Service-side recovery worker for incomplete account deletions, including cases where
 * Supabase Auth deletion succeeded but final database finalisation failed.
 */
export async function reconcileIncompleteAccountDeletions(
  supabaseAdmin: SupabaseClient<Database>,
  limit = 50,
): Promise<ReconciliationSummary> {
  const storage = await processPendingStorageCleanup(supabaseAdmin);

  const { data: incomplete, error: listErr } = await supabaseAdmin.rpc(
    "list_incomplete_account_deletions",
    { p_limit: limit },
  );

  if (listErr) {
    throw new Error(listErr.message || "Failed to list incomplete account deletions.");
  }

  const profiles = Array.isArray(incomplete) ? incomplete : [];
  let finalized = 0;
  let stillPending = 0;
  let errors = 0;

  for (const row of profiles) {
    try {
      const userStorage = await processPendingStorageCleanup(supabaseAdmin, row.profile_id);
      if (
        userStorage.failed > 0 ||
        userStorage.recordFailed > 0 ||
        (userStorage.lastRemainingCount !== null && userStorage.lastRemainingCount > 0) ||
        (userStorage.attempted === 0 && row.pending_storage_count > 0)
      ) {
        await supabaseAdmin.rpc("finalize_account_deletion", {
          p_user_id: row.profile_id,
          p_auth_deleted: false,
          p_auth_error: "Storage cleanup still pending during background reconciliation",
        });
        stillPending += 1;
        continue;
      }

      const { data: authLookup, error: authLookupErr } = await supabaseAdmin.auth.admin.getUserById(
        row.profile_id,
      );

      let authDeleted = false;
      if (authLookup?.user) {
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(row.profile_id);
        if (!delErr || isAuthNotFoundError(delErr)) {
          authDeleted = true;
        } else {
          await supabaseAdmin.rpc("finalize_account_deletion", {
            p_user_id: row.profile_id,
            p_auth_deleted: false,
            p_auth_error: delErr.message || "Auth deleteUser failed during reconciliation",
          });
          stillPending += 1;
          continue;
        }
      } else if (isAuthNotFoundError(authLookupErr)) {
        authDeleted = true;
      } else {
        errors += 1;
        logger.error("account_delete_reconcile_auth_lookup_failed", {
          status: authLookupErr?.status ?? 500,
        });
        continue;
      }

      if (!authDeleted) {
        stillPending += 1;
        continue;
      }

      const { data: finData, error: finErr } = await supabaseAdmin.rpc("finalize_account_deletion", {
        p_user_id: row.profile_id,
        p_auth_deleted: true,
      });

      const finalStatus =
        finData && typeof finData === "object" && "deletion_status" in finData
          ? String((finData as { deletion_status?: unknown }).deletion_status)
          : null;

      if (finErr || finalStatus !== "completed") {
        if (finErr) {
          errors += 1;
          logger.error("account_delete_reconcile_finalize_failed", {
            code: finErr.code ?? "unknown",
          });
        } else {
          stillPending += 1;
        }
        continue;
      }

      finalized += 1;
    } catch (err) {
      errors += 1;
      logger.error("account_delete_reconcile_item_failed", {
        message: err instanceof Error ? err.message : "unknown_error",
      });
    }
  }

  return {
    storage,
    inspected: profiles.length,
    finalized,
    stillPending,
    errors,
  };
}
