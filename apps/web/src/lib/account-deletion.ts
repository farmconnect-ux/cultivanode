import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";

export type StorageCleanupSummary = {
  attempted: number;
  removed: number;
  failed: number;
};

/**
 * Claims pending or previously failed Storage cleanup items from the durable
 * `account_deletion_storage_cleanup` queue and deletes each object via Storage API.
 * Safe to run during user-initiated deletion OR in an out-of-band retry worker
 * after Auth identity removal.
 */
export async function processPendingStorageCleanup(
  supabaseAdmin: SupabaseClient<Database>,
  userId?: string,
): Promise<StorageCleanupSummary> {
  const { data: claimed, error: claimErr } = await supabaseAdmin.rpc(
    "claim_account_deletion_storage_cleanup",
    userId ? { p_user_id: userId } : {},
  );

  if (claimErr) {
    throw new Error(claimErr.message || "Failed to claim Storage cleanup items.");
  }

  const rows = Array.isArray(claimed) ? claimed : [];
  let removed = 0;
  let failed = 0;

  for (const row of rows) {
    const { error: rmErr } = await supabaseAdmin.storage
      .from(row.bucket_id)
      .remove([row.storage_path]);

    if (rmErr) {
      failed += 1;
      await supabaseAdmin.rpc("record_account_deletion_storage_result", {
        p_cleanup_id: row.id,
        p_status: "failed",
        p_error: rmErr.message || "Storage removal failed",
      });
    } else {
      removed += 1;
      await supabaseAdmin.rpc("record_account_deletion_storage_result", {
        p_cleanup_id: row.id,
        p_status: "completed",
      });
    }
  }

  return { attempted: rows.length, removed, failed };
}
