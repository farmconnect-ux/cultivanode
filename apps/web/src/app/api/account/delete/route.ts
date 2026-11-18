import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const RECENT_AUTH_WINDOW_MS = 15 * 60 * 1000;

const DeleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
  reason: z.string().trim().max(1000).optional(),
});

type ExecutionResult = {
  status?: "deleted" | "already_deleted";
  user_id?: string;
  request_id?: string | null;
  storage_paths?: unknown;
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
  const storagePaths = Array.isArray(result.storage_paths)
    ? result.storage_paths.filter((p): p is string => typeof p === "string" && p.length > 0)
    : [];

  let storageCleanupPartial = false;
  if (storagePaths.length > 0) {
    const { error: storageErr } = await supabaseAdmin.storage.from("verification-documents").remove(storagePaths);
    if (storageErr) {
      storageCleanupPartial = true;
      logger.warn("account_delete_storage_cleanup_partial", { count: storagePaths.length });
    }
  }

  const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (authDeleteErr && authDeleteErr.status !== 404) {
    logger.error("account_delete_auth_failed", { status: authDeleteErr.status ?? 500 });
    return NextResponse.json(
      {
        error: "auth_deletion_incomplete",
        message: "Your personal profile was anonymized, but authentication removal did not finish. Please retry or contact support.",
      },
      { status: 500 },
    );
  }

  logger.info("account_deleted", {
    status: result.status ?? "deleted",
    storageRemovedCount: storagePaths.length,
    storageCleanupPartial,
  });

  return NextResponse.json(
    {
      status: result.status === "already_deleted" ? "already_deleted" : "deleted",
      request_id: result.request_id ?? null,
      storage_removed_count: storagePaths.length,
      ...(storageCleanupPartial ? { storage_cleanup_partial: true } : {}),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
