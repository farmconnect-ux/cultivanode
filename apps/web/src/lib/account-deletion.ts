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

export type AccountDeletionOutcome =
  | {
      ok: true;
      alreadyDeleted: boolean;
      priorStatus: string;
      requestId: string | null;
      storageRemovedCount: number;
    }
  | { ok: false; httpStatus: number; error: string; message: string };

type ExecutionResult = {
  status?: "anonymized" | "already_anonymized" | "already_deleted";
  deletion_status?: string;
  user_id?: string;
  request_id?: string | null;
  pending_storage_count?: number;
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
          p_lease_token: row.lease_token,
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
        p_lease_token: row.lease_token,
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
 * Runs the durable three-phase deletion for one account: database blocker check and
 * anonymisation, private Storage cleanup, then Auth identity removal and finalisation.
 * Callers must have already established that `userId` may be deleted.
 */
export async function runAccountDeletion(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
  reason?: string,
): Promise<AccountDeletionOutcome> {
  // Phase 1: DB blocker check, durable Storage queue capture, and PII anonymisation.
  const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc("execute_account_deletion", {
    p_user_id: userId,
    p_reason: reason || undefined,
  });

  if (rpcErr) {
    if (rpcErr.code === "P0001") {
      return { ok: false, httpStatus: 409, error: "deletion_blocked", message: rpcErr.message };
    }
    if (rpcErr.code === "22023" || rpcErr.code === "P0002") {
      return { ok: false, httpStatus: 422, error: "invalid_deletion_request", message: rpcErr.message };
    }
    logger.error("account_delete_rpc_failed", { code: rpcErr.code });
    return {
      ok: false,
      httpStatus: 500,
      error: "deletion_failed",
      message: "Could not complete account deletion. Please try again.",
    };
  }

  const result = (rpcData && typeof rpcData === "object" ? rpcData : {}) as ExecutionResult;

  // Phase 2: Durable, recoverable private Storage cleanup BEFORE deleting Auth identity.
  let storageSummary: StorageCleanupSummary;
  try {
    storageSummary = await processPendingStorageCleanup(supabaseAdmin, userId);
  } catch {
    const { error: finErr } = await supabaseAdmin.rpc("finalize_account_deletion", {
      p_user_id: userId,
      p_auth_deleted: false,
      p_auth_error: "Storage cleanup claim failed",
    });
    if (finErr) {
      logger.error("account_delete_finalize_on_claim_error_failed", { code: finErr.code ?? "unknown" });
    }
    logger.error("account_delete_storage_claim_failed");
    return {
      ok: false,
      httpStatus: 500,
      error: "storage_cleanup_incomplete",
      message: "Your profile was anonymized, but private document cleanup did not finish. Please retry.",
    };
  }

  const hasRemainingStorage =
    storageSummary.failed > 0 ||
    storageSummary.recordFailed > 0 ||
    (storageSummary.lastRemainingCount !== null && storageSummary.lastRemainingCount > 0) ||
    (storageSummary.attempted === 0 && (result.pending_storage_count ?? 0) > 0);

  if (hasRemainingStorage) {
    const { error: finErr } = await supabaseAdmin.rpc("finalize_account_deletion", {
      p_user_id: userId,
      p_auth_deleted: false,
      p_auth_error:
        storageSummary.recordFailed > 0
          ? `Storage cleanup result recording failed for ${storageSummary.recordFailed} item(s)`
          : `Storage cleanup incomplete (${storageSummary.failed || storageSummary.lastRemainingCount || result.pending_storage_count || 1} item(s) remaining)`,
    });
    if (finErr) {
      logger.error("account_delete_finalize_on_storage_error_failed", { code: finErr.code ?? "unknown" });
    }
    logger.warn("account_delete_storage_cleanup_incomplete", {
      attempted: storageSummary.attempted,
      removed: storageSummary.removed,
      failed: storageSummary.failed,
      recordFailed: storageSummary.recordFailed,
    });
    return {
      ok: false,
      httpStatus: 500,
      error: "storage_cleanup_incomplete",
      message: "Some private verification documents could not be removed yet. Please retry to finish account deletion.",
    };
  }

  // Phase 3: Remove Supabase Auth identity only after private Storage cleanup succeeds.
  const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authDeleteErr && authDeleteErr.status !== 404) {
    const { error: finErr } = await supabaseAdmin.rpc("finalize_account_deletion", {
      p_user_id: userId,
      p_auth_deleted: false,
      p_auth_error: authDeleteErr.message || "Auth deleteUser failed",
    });
    if (finErr) {
      logger.error("account_delete_finalize_on_auth_error_failed", { code: finErr.code ?? "unknown" });
    }
    logger.error("account_delete_auth_failed", { status: authDeleteErr.status ?? 500 });
    return {
      ok: false,
      httpStatus: 500,
      error: "auth_deletion_incomplete",
      message: "Your personal profile and documents were removed, but authentication removal did not finish. Please retry.",
    };
  }

  const { data: finalized, error: finalizeErr } = await supabaseAdmin.rpc("finalize_account_deletion", {
    p_user_id: userId,
    p_auth_deleted: true,
  });

  if (finalizeErr) {
    logger.error("account_delete_finalize_failed", { code: finalizeErr.code ?? "unknown" });
    return {
      ok: false,
      httpStatus: 500,
      error: "finalization_incomplete",
      message: "Your profile and authentication were removed, but finalization did not complete. Background recovery will finish it.",
    };
  }

  const finalStatus =
    finalized && typeof finalized === "object" && "deletion_status" in finalized
      ? String((finalized as { deletion_status?: unknown }).deletion_status)
      : null;

  if (!finalStatus) {
    logger.error("account_delete_finalize_invalid_response");
    return {
      ok: false,
      httpStatus: 500,
      error: "finalization_incomplete",
      message: "Account deletion finalization returned an invalid status.",
    };
  }

  if (finalStatus !== "completed") {
    logger.warn("account_delete_still_incomplete", { finalStatus });
    return {
      ok: false,
      httpStatus: 500,
      error: finalStatus === "storage_pending" ? "storage_cleanup_incomplete" : "finalization_incomplete",
      message: "Private document cleanup or finalization is still pending.",
    };
  }

  logger.info("account_deleted", {
    priorStatus: result.status ?? "anonymized",
    storageRemovedCount: storageSummary.removed,
  });

  return {
    ok: true,
    alreadyDeleted: result.status === "already_deleted",
    priorStatus: result.status ?? "anonymized",
    requestId: result.request_id ?? null,
    storageRemovedCount: storageSummary.removed,
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
