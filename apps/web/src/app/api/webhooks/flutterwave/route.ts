import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    if (configuredSecret && signature && signature !== configuredSecret) {
      logger.warn("flutterwave_webhook_invalid_signature", { signature });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = await req.json();
    logger.info("flutterwave_webhook_received", { event: payload?.event });

    // Handle charge.completed
    if (payload?.event === "charge.completed" && payload?.data?.status === "successful") {
      const { data } = payload;
      const txRef: string = data.tx_ref || "";
      const flwRef: string = String(data.id || data.flw_ref || txRef);
      const amountKobo: number = Math.round(Number(data.amount || data.charged_amount || 0) * 100);

      const supabase = await createClient();

      // Find the order: either from tx_ref pattern (FLW_<orderId>_<timestamp>) or lookup in marketplace_payments
      let orderId: string | null = null;

      if (txRef.startsWith("FLW_")) {
        const parts = txRef.split("_");
        if (parts.length >= 2) {
          orderId = parts[1];
        }
      }

      if (!orderId && txRef) {
        const { data: pRec } = await (supabase as any)
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
        const { error: rpcErr } = await (supabase as any).rpc("process_payment_webhook", {
          p_reference: flwRef,
          p_provider: "flutterwave",
          p_amount_kobo: amountKobo,
          p_order_id: orderId,
          p_gateway_data: data,
        });

        if (rpcErr) {
          logger.error("flutterwave_webhook_rpc_failed", rpcErr);
        } else {
          logger.info("flutterwave_payment_cleared", { orderId, amountKobo, flwRef });
        }
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
