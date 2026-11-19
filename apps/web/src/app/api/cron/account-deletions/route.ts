import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { reconcileIncompleteAccountDeletions } from "@/lib/account-deletion";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/admin";

function hasValidCronSecret(req: Request, expectedSecret: string): boolean {
  const authHeader = req.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const provided = match[1].trim();
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expectedSecret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function handleReconciliation(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error("cron_account_deletions_missing_secret");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  if (!hasValidCronSecret(req, cronSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createServiceClient();
  if (!supabaseAdmin) {
    logger.error("cron_account_deletions_no_service_key");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const summary = await reconcileIncompleteAccountDeletions(supabaseAdmin);
    logger.info("cron_account_deletions_completed", {
      inspected: summary.inspected,
      finalized: summary.finalized,
      stillPending: summary.stillPending,
      errors: summary.errors,
    });
    return NextResponse.json({ status: "ok", ...summary }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logger.error("cron_account_deletions_failed", {
      message: err instanceof Error ? err.message : "unknown_error",
    });
    return NextResponse.json({ error: "reconciliation_failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleReconciliation(req);
}

export async function POST(req: Request) {
  return handleReconciliation(req);
}
