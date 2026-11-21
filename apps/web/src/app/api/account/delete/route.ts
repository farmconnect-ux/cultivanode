import { NextResponse } from "next/server";
import { z } from "zod";
import { runAccountDeletion } from "@/lib/account-deletion";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const RECENT_AUTH_WINDOW_MS = 15 * 60 * 1000;

const DeleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
  reason: z.string().trim().max(1000).optional(),
});

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

  const outcome = await runAccountDeletion(supabaseAdmin, user.id, parsed.data.reason);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error, message: outcome.message }, { status: outcome.httpStatus });
  }

  return NextResponse.json(
    {
      status: outcome.alreadyDeleted ? "already_deleted" : "deleted",
      request_id: outcome.requestId,
      storage_removed_count: outcome.storageRemovedCount,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
