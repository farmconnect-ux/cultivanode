import crypto from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

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
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    logger.info("flutterwave_webhook_received", { event: payload?.event });

    // Handle charge.completed
    if (payload?.event === "charge.completed" && (payload?.data as Record<string, unknown> | undefined)?.status === "successful") {
      const data = payload.data as Record<string, unknown>;
      const txRef: string = String(data.tx_ref || "");
      const flwRef: string = String(data.id || data.flw_ref || txRef);
      const amountKobo: number = Math.round(Number(data.amount || data.charged_amount || 0) * 100);

      const supabase = createServiceClient();
      if (!supabase) {
        logger.error("flutterwave_webhook_no_service_key");
        return NextResponse.json({ error: "Not configured" }, { status: 503 });
      }

      // Find the order: either from tx_ref pattern (FLW_<orderId>_<timestamp>) or lookup in marketplace_payments
      let orderId: string | null = null;

      if (txRef.startsWith("FLW_")) {
        const parts = txRef.split("_");
        if (parts.length >= 2) {
          orderId = parts[1];
        }
      }

      if (!orderId && txRef) {
        const { data: pRec } = await supabase
          .from("marketplace_payments")
          .select("order_id")
          .eq("payment_reference", txRef)
          .maybeSingle();

        if (pRec?.order_id) {
          orderId = pRec.order_id;
        }
      }

      if (orderId && amountKobo > 0) {
        // Trigger double-entry cryptographic ledger and escrow state machine
        const { error: rpcErr } = await supabase.rpc("process_payment_webhook", {
          p_reference: flwRef,
          p_provider: "flutterwave",
          p_amount_kobo: amountKobo,
          p_order_id: orderId,
          p_gateway_data: data,
        });

        if (rpcErr) {
          logger.error("flutterwave_webhook_rpc_failed", { code: rpcErr.code });
          const isDomainErr = rpcErr.code === "22023" || rpcErr.code === "P0002";
          return NextResponse.json(
            { error: "Payment processing failed" },
            { status: isDomainErr ? 422 : 500 },
          );
        }
        logger.info("flutterwave_payment_cleared", { orderId, amountKobo, flwRef });
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
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
