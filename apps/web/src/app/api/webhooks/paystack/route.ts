import { NextResponse } from "next/server";
import crypto from "crypto";
import type { Json } from "@cultivanode/shared";
import { createServiceClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Paystack Webhook Ingestion Endpoint
 *
 * Endpoint: POST /api/webhooks/paystack
 * Paystack sends signature in header: `x-paystack-signature` (HMAC SHA512 of raw body)
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const configuredSecret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET;

    // Reject anything that isn't signed with our Paystack secret (HMAC SHA512 of the raw body).
    if (!configuredSecret || !signature) {
      logger.warn("paystack_webhook_unsigned");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const hash = crypto.createHmac("sha512", configuredSecret).update(rawBody).digest("hex");
    if (hash.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))) {
      logger.warn("paystack_webhook_invalid_signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      const parsed = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
      }
      payload = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    logger.info("paystack_webhook_received", { event: payload?.event });

    if (payload.event !== "charge.success") {
      return NextResponse.json({ status: "ignored", event: payload.event ?? null }, { status: 200 });
    }

    if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
      return NextResponse.json({ error: "Missing payment data" }, { status: 400 });
    }

    const data = payload.data as Record<string, unknown>;
    const metadata = (data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
      ? data.metadata
      : {}) as Record<string, unknown>;
    const reference = typeof data.reference === "string" ? data.reference.trim() : "";
    if (!reference) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    }

    const rawAmount = Number(data.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }
    const amountKobo = Math.round(rawAmount); // Paystack amounts are already in kobo
    if (amountKobo <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      logger.error("paystack_webhook_no_service_key");
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    let orderId: string | null = null;

    if (typeof metadata.orderId === "string" && metadata.orderId.trim()) {
      orderId = metadata.orderId.trim();
    } else if (typeof metadata.order_id === "string" && metadata.order_id.trim()) {
      orderId = metadata.order_id.trim();
    } else if (reference.startsWith("PSTK_")) {
      const parts = reference.split("_");
      if (parts.length >= 2 && parts[1]) {
        orderId = parts[1].trim();
      }
    }

    if (!orderId) {
      const { data: pRec, error: lookupErr } = await supabase
        .from("marketplace_payments")
        .select("order_id")
        .eq("payment_reference", reference)
        .maybeSingle();

      if (lookupErr) {
        logger.error("paystack_webhook_lookup_failed", { code: lookupErr.code });
        return NextResponse.json({ error: "Payment lookup failed" }, { status: 500 });
      }
      if (pRec?.order_id) {
        orderId = pRec.order_id;
      }
    }

    if (!orderId || !UUID_RE.test(orderId)) {
      logger.warn("paystack_webhook_unresolvable_order", { reference });
      return NextResponse.json({ error: "Unresolvable order reference" }, { status: 422 });
    }

    const { data: rpcData, error: rpcErr } = await supabase.rpc("process_payment_webhook", {
      p_reference: reference,
      p_provider: "paystack",
      p_amount_kobo: amountKobo,
      p_order_id: orderId,
      p_gateway_data: data as Json,
    });

    if (rpcErr) {
      logger.error("paystack_webhook_rpc_failed", { code: rpcErr.code });
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
    logger.info("paystack_payment_cleared", { orderId, amountKobo, reference, alreadyProcessed });
    return NextResponse.json({ status: "success", already_processed: alreadyProcessed }, { status: 200 });
  } catch (error) {
    logger.error("paystack_webhook_error", { error: String(error) });
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: "active",
      provider: "paystack",
      service: "CultivaNode Marketplace Escrow Clearing Webhook",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
