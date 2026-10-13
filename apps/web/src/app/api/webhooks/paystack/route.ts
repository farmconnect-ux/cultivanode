import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

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

    const payload = JSON.parse(rawBody);
    logger.info("paystack_webhook_received", { event: payload?.event });

    if (payload?.event === "charge.success") {
      const { data } = payload;
      const reference: string = data.reference || "";
      const amountKobo: number = Math.round(Number(data.amount || 0)); // Paystack amounts are already in kobo

      const supabase = createServiceClient();
      if (!supabase) {
        logger.error("paystack_webhook_no_service_key");
        return NextResponse.json({ error: "Not configured" }, { status: 503 });
      }

      let orderId: string | null = null;

      if (data.metadata?.orderId || data.metadata?.order_id) {
        orderId = data.metadata.orderId || data.metadata.order_id;
      } else if (reference.startsWith("PSTK_")) {
        const parts = reference.split("_");
        if (parts.length >= 2) {
          orderId = parts[1];
        }
      }

      if (!orderId && reference) {
        const { data: pRec } = await supabase
          .from("marketplace_payments")
          .select("order_id")
          .eq("payment_reference", reference)
          .maybeSingle();

        if (pRec?.order_id) {
          orderId = pRec.order_id;
        }
      }

      if (orderId && amountKobo > 0) {
        const { error: rpcErr } = await supabase.rpc("process_payment_webhook", {
          p_reference: reference,
          p_provider: "paystack",
          p_amount_kobo: amountKobo,
          p_order_id: orderId,
          p_gateway_data: data,
        });

        if (rpcErr) {
          logger.error("paystack_webhook_rpc_failed", { code: rpcErr.code });
        } else {
          logger.info("paystack_payment_cleared", { orderId, amountKobo, reference });
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
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
