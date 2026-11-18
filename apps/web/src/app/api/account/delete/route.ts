import { NextResponse } from "next/server";
import { z } from "zod";
import { processPendingStorageCleanup } from "@/lib/account-deletion";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const RECENT_AUTH_WINDOW_MS = 15 * 60 * 1000;

const DeleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
  reason: z.string().trim().max(1000).optional(),
});

type ExecutionResult = {
  status?: "anonymized" | "already_anonymized" | "already_deleted";
  deletion_status?: string;
  user_id?: string;
  request_id?: string | null;
  pending_storage_count?: number;
};

export async function POST(req: Request) {
  const supabaseAdmin = createServiceClient();
  if (!supabaseAdmin) {
    logger.error("account_delete_no_service_key");
    return NextResponse.json({ error: "not_configured", message: "Account deletion service is unavailable." }, { status: 503 });
  }

  let user: { id: string; last_sign_in_at?: string | null } | null = null;
  const authHeader = req.headers.get("authorization") ?? "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (bearerToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
    if (!error && data.user) {
      user = data.user;
    }
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      user = data.user;
    }
  }

  if (!user) {
    return NextResponse.json({ error: "not_signed_in", message: "Please sign in again." }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Invalid request payload." }, { status: 400 });
  }

  const parsed = DeleteAccountSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_confirmation", message: "Type DELETE to confirm permanent account deletion." },
      { status: 400 },
    );
  }

  const lastSignInMs = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : Number.NaN;
  if (!Number.isFinite(lastSignInMs) || Date.now() - lastSignInMs > RECENT_AUTH_WINDOW_MS) {
    return NextResponse.json(
      {
        error: "reauth_required",
        message: "Please verify your identity with a fresh sign-in code before deleting your account.",
      },
      { status: 403 },
    );
  }

  // Phase 1: DB blocker check, durable Storage queue capture, and PII anonymisation.
  const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc("execute_account_deletion", {
    p_user_id: user.id,
    p_reason: parsed.data.reason || undefined,
  });

  if (rpcErr) {
    if (rpcErr.code === "P0001") {
      return NextResponse.json({ error: "deletion_blocked", message: rpcErr.message }, { status: 409 });
    }
    if (rpcErr.code === "22023" || rpcErr.code === "P0002") {
      return NextResponse.json({ error: "invalid_deletion_request", message: rpcErr.message }, { status: 422 });
    }
    logger.error("account_delete_rpc_failed", { code: rpcErr.code });
    return NextResponse.json(
      { error: "deletion_failed", message: "Could not complete account deletion. Please try again." },
      { status: 500 },
    );
  }

  const result = (rpcData && typeof rpcData === "object" ? rpcData : {}) as ExecutionResult;

  // Phase 2: Durable, recoverable private Storage cleanup BEFORE deleting Auth identity.
  let storageSummary: Awaited<ReturnType<typeof processPendingStorageCleanup>>;
  try {
    storageSummary = await processPendingStorageCleanup(supabaseAdmin, user.id);
  } catch {
    const { error: finErr } = await supabaseAdmin.rpc("finalize_account_deletion", {
      p_user_id: user.id,
      p_auth_deleted: false,
      p_auth_error: "Storage cleanup claim failed",
    });
    if (finErr) {
      logger.error("account_delete_finalize_on_claim_error_failed", { code: finErr.code ?? "unknown" });
    }
    logger.error("account_delete_storage_claim_failed");
    return NextResponse.json(
      {
        error: "storage_cleanup_incomplete",
        message: "Your profile was anonymized, but private document cleanup did not finish. Please retry.",
      },
      { status: 500 },
    );
  }

  const hasRemainingStorage =
    storageSummary.failed > 0 ||
    storageSummary.recordFailed > 0 ||
    (storageSummary.lastRemainingCount !== null && storageSummary.lastRemainingCount > 0) ||
    (storageSummary.attempted === 0 && (result.pending_storage_count ?? 0) > 0);

  if (hasRemainingStorage) {
    const { error: finErr } = await supabaseAdmin.rpc("finalize_account_deletion", {
      p_user_id: user.id,
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
    return NextResponse.json(
      {
        error: "storage_cleanup_incomplete",
        message: "Some private verification documents could not be removed yet. Please retry to finish account deletion.",
      },
      { status: 500 },
    );
  }

  // Phase 3: Remove Supabase Auth identity only after private Storage cleanup succeeds.
  const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (authDeleteErr && authDeleteErr.status !== 404) {
    const { error: finErr } = await supabaseAdmin.rpc("finalize_account_deletion", {
      p_user_id: user.id,
      p_auth_deleted: false,
      p_auth_error: authDeleteErr.message || "Auth deleteUser failed",
    });
    if (finErr) {
      logger.error("account_delete_finalize_on_auth_error_failed", { code: finErr.code ?? "unknown" });
    }
    logger.error("account_delete_auth_failed", { status: authDeleteErr.status ?? 500 });
    return NextResponse.json(
      {
        error: "auth_deletion_incomplete",
        message: "Your personal profile and documents were removed, but authentication removal did not finish. Please retry.",
      },
      { status: 500 },
    );
  }

  const { data: finalized, error: finalizeErr } = await supabaseAdmin.rpc("finalize_account_deletion", {
    p_user_id: user.id,
    p_auth_deleted: true,
  });

  if (finalizeErr) {
    logger.error("account_delete_finalize_failed", { code: finalizeErr.code ?? "unknown" });
    return NextResponse.json(
      {
        error: "finalization_incomplete",
        message: "Your profile and authentication were removed, but finalization did not complete. Background recovery will finish it.",
      },
      { status: 500 },
    );
  }

  const finalStatus =
    finalized && typeof finalized === "object" && "deletion_status" in finalized
      ? String((finalized as { deletion_status?: unknown }).deletion_status)
      : null;

  if (!finalStatus) {
    logger.error("account_delete_finalize_invalid_response");
    return NextResponse.json(
      {
        error: "finalization_incomplete",
        message: "Account deletion finalization returned an invalid status.",
      },
      { status: 500 },
    );
  }

  if (finalStatus !== "completed") {
    logger.warn("account_delete_still_incomplete", { finalStatus });
    return NextResponse.json(
      {
        error: finalStatus === "storage_pending" ? "storage_cleanup_incomplete" : "finalization_incomplete",
        message: "Private document cleanup or finalization is still pending.",
      },
      { status: 500 },
    );
  }

  logger.info("account_deleted", {
    priorStatus: result.status ?? "anonymized",
    storageRemovedCount: storageSummary.removed,
  });

  return NextResponse.json(
    {
      status: result.status === "already_deleted" ? "already_deleted" : "deleted",
      request_id: result.request_id ?? null,
      storage_removed_count: storageSummary.removed,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
