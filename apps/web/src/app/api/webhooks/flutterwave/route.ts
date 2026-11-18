import crypto from "crypto";
import { NextResponse } from "next/server";
import type { Json } from "@cultivanode/shared";
import { createServiceClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Flutterwave Webhook Ingestion Endpoint
 *
 * Endpoint: POST /api/webhooks/flutterwave
 * Flutterwave sends signature verification in the header: `verif-hash`
 * The secret hash is set by the admin in the Flutterwave Dashboard (Settings > Webhooks > Secret hash)
 * and pasted into CultivaNode's Admin Integrations page (or set as FLUTTERWAVE_WEBHOOK_HASH).
 */
export async function POST(req: Request) {
  try {
    const signature = req.headers.get("verif-hash") || req.headers.get("Verif-Hash");
    const configuredSecret = process.env.FLUTTERWAVE_WEBHOOK_HASH || process.env.FLUTTERWAVE_SECRET_KEY;

    // Verify secret hash if configured in environment
    if (!configuredSecret || !signature || signature.length !== configuredSecret.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(configuredSecret))) {
      logger.warn("flutterwave_webhook_invalid_signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      const parsed = await req.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
      }
      payload = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    logger.info("flutterwave_webhook_received", { event: payload?.event });

    if (payload.event !== "charge.completed") {
      return NextResponse.json({ status: "ignored", event: payload.event ?? null }, { status: 200 });
    }

    if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
      return NextResponse.json({ error: "Missing payment data" }, { status: 400 });
    }

    const data = payload.data as Record<string, unknown>;
    if (data.status !== "successful") {
      return NextResponse.json({ status: "ignored", payment_status: data.status ?? null }, { status: 200 });
    }

    const txRef = typeof data.tx_ref === "string" ? data.tx_ref.trim() : "";
    const flwId = data.id !== undefined && data.id !== null ? String(data.id).trim() : "";
    const flwRefRaw = typeof data.flw_ref === "string" ? data.flw_ref.trim() : "";
    const flwRef = flwId || flwRefRaw || txRef;
    if (!flwRef) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    const rawAmount = Number(data.amount ?? data.charged_amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }
    const amountKobo = Math.round(rawAmount * 100);
    if (amountKobo <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      logger.error("flutterwave_webhook_no_service_key");
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    // Find the order: either from tx_ref pattern (FLW_<orderId>_<timestamp>) or lookup in marketplace_payments
    let orderId: string | null = null;

    if (txRef.startsWith("FLW_")) {
      const parts = txRef.split("_");
      if (parts.length >= 2 && parts[1]) {
        orderId = parts[1].trim();
      }
    }

    if (!orderId && txRef) {
      const { data: pRec, error: lookupErr } = await supabase
        .from("marketplace_payments")
        .select("order_id")
        .eq("payment_reference", txRef)
        .maybeSingle();

      if (lookupErr) {
        logger.error("flutterwave_webhook_lookup_failed", { code: lookupErr.code });
        return NextResponse.json({ error: "Payment lookup failed" }, { status: 500 });
      }
      if (pRec?.order_id) {
        orderId = pRec.order_id;
      }
    }

    if (!orderId || !UUID_RE.test(orderId)) {
      logger.warn("flutterwave_webhook_unresolvable_order", { txRef, flwRef });
      return NextResponse.json({ error: "Unresolvable order reference" }, { status: 422 });
    }

    // Trigger double-entry cryptographic ledger and escrow state machine
    const { data: rpcData, error: rpcErr } = await supabase.rpc("process_payment_webhook", {
      p_reference: flwRef,
      p_provider: "flutterwave",
      p_amount_kobo: amountKobo,
      p_order_id: orderId,
      p_gateway_data: data as Json,
    });

    if (rpcErr) {
      logger.error("flutterwave_webhook_rpc_failed", { code: rpcErr.code });
      const isDomainErr =
        rpcErr.code === "22023" ||
        rpcErr.code === "P0002" ||
        rpcErr.code === "23503" ||
        rpcErr.code === "23505";
      return NextResponse.json(
        { error: "Payment processing failed" },
        { status: isDomainErr ? 422 : 500 },
      );
    }

    const alreadyProcessed = Boolean((rpcData as Record<string, unknown> | null)?.already_processed);
    logger.info("flutterwave_payment_cleared", { orderId, amountKobo, flwRef, alreadyProcessed });
    return NextResponse.json({ status: "success", already_processed: alreadyProcessed }, { status: 200 });
  } catch (error) {
    logger.error("flutterwave_webhook_error", { error: String(error) });
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: "active",
      provider: "flutterwave",
      service: "CultivaNode Marketplace Escrow Clearing Webhook",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
