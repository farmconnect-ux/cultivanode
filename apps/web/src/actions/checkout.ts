"use server";

// Marketplace cart pricing and checkout. Prices, units, sellers and stock always come from the
// database, never from the browser: the cart only carries listing ids and quantities.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isOn } from "@/lib/flags";
import { createServiceClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { hasLocale } from "@/i18n/config";

export type CartLine = { listingId: string; quantity: number };
export type PricedLine = {
  listingId: string;
  title: string;
  unit: string;
  unitPriceKobo: number;
  quantity: number;
  minQuantity: number;
  available: number;
  sellerId: string;
  sellerName: string;
  location: string;
  problem: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DELIVERY_PER_SELLER_KOBO = 300_000; // ₦3,000 flat per seller until logistics quotes are live
const COMMISSION_BPS = 500; // 5% taken from the seller's side, not added to the buyer's bill

function clean(lines: CartLine[]): CartLine[] {
  const merged = new Map<string, number>();
  for (const l of Array.isArray(lines) ? lines.slice(0, 30) : []) {
    const q = Number(l?.quantity);
    if (!UUID.test(String(l?.listingId)) || !Number.isFinite(q) || q <= 0) continue;
    merged.set(l.listingId, (merged.get(l.listingId) ?? 0) + q);
  }
  return [...merged.entries()].map(([listingId, quantity]) => ({ listingId, quantity }));
}

/** Current price, stock and seller for each cart line. Lines whose listing is gone are dropped. */
export async function quoteCart(lines: CartLine[]): Promise<PricedLine[]> {
  const wanted = clean(lines);
  if (!wanted.length) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketplace_listings")
    .select("id, title, unit, base_price_kobo, min_order_quantity, status, location_lga, location_state, seller_id, marketplace_sellers ( business_name ), marketplace_inventory_lots ( physical_quantity, reserved_quantity, allocated_quantity )")
    .in("id", wanted.map((w) => w.listingId));
  const byId = new Map((data ?? []).map((l) => [l.id, l]));
  const out: PricedLine[] = [];
  for (const w of wanted) {
    const l = byId.get(w.listingId);
    if (!l) continue;
    const lots = l.marketplace_inventory_lots ?? [];
    const available = lots.reduce((s, x) => s + Number(x.physical_quantity) - Number(x.reserved_quantity ?? 0) - Number(x.allocated_quantity ?? 0), 0);
    const min = Number(l.min_order_quantity ?? 1);
    const problem =
      l.status !== "active" ? "No longer on sale" : lots.length && w.quantity > available ? `Only ${available} ${l.unit} available` : w.quantity < min ? `Minimum order is ${min} ${l.unit}` : null;
    out.push({
      listingId: l.id,
      title: l.title,
      unit: l.unit,
      unitPriceKobo: Number(l.base_price_kobo),
      quantity: w.quantity,
      minQuantity: min,
      available,
      sellerId: l.seller_id,
      sellerName: l.marketplace_sellers?.business_name ?? "Seller",
      location: [l.location_lga, l.location_state].filter(Boolean).join(", "),
      problem,
    });
  }
  return out;
}

export type CheckoutInput = {
  lang: string;
  lines: CartLine[];
  address: string;
  state: string;
  lga: string;
  phone: string;
  notes?: string;
};
export type CheckoutResult = { ok: true; orderId: string; redirectUrl: string } | { ok: false; error: string; signIn?: boolean };

export async function checkoutCart(input: CheckoutInput): Promise<CheckoutResult> {
  const lang = hasLocale(input.lang) ? input.lang : "en";
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Sign in to place your order.", signIn: true };

  const address = String(input.address ?? "").trim().slice(0, 200);
  const state = String(input.state ?? "").trim().slice(0, 60);
  const lga = String(input.lga ?? "").trim().slice(0, 60);
  const phone = String(input.phone ?? "").replace(/[^\d+]/g, "").slice(0, 20);
  if (address.length < 5 || !state || phone.length < 10) return { ok: false, error: "Enter a delivery address, state and a phone number we can call." };

  const priced = await quoteCart(input.lines);
  if (!priced.length) return { ok: false, error: "Your cart is empty." };
  const blocked = priced.find((p) => p.problem);
  if (blocked) return { ok: false, error: `${blocked.title}: ${blocked.problem}.` };
  const { data: mine } = await supabase.from("marketplace_sellers").select("id").eq("profile_id", auth.user.id);
  const mySellerIds = new Set((mine ?? []).map((m) => m.id));
  if (priced.some((p) => mySellerIds.has(p.sellerId))) return { ok: false, error: "You can't buy your own listing." };

  const sellers = [...new Set(priced.map((p) => p.sellerId))];

  // While escrow is switched off (Admin → Feature switches), the buyer pays each seller's bank account
  // directly and the seller confirms the money arrived. Every seller must have added that account.
  // The new columns and functions are newer than the generated types, hence the untyped client.
  const loose = supabase as unknown as SupabaseClient;
  const escrow = await isOn("escrow_payments");
  if (!escrow) {
    const { data: ready } = await loose.rpc("sellers_with_payout_account", { p_seller_ids: sellers });
    const readyIds = new Set(((ready ?? []) as string[]).map(String));
    const missing = priced.find((p) => !readyIds.has(p.sellerId));
    if (missing) {
      return { ok: false, error: `${missing.title}: this seller hasn't added the bank account buyers pay into yet. Remove it from your cart or try again later.` };
    }
  }

  const itemsSubtotal = priced.reduce((s, p) => s + Math.round(p.unitPriceKobo * p.quantity), 0);
  const delivery = DELIVERY_PER_SELLER_KOBO * sellers.length;
  const total = itemsSubtotal + delivery;
  const orderNumber = `ORD-${new Date().toISOString().slice(0, 7)}-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const { data: order, error: orderErr } = await loose
    .from("marketplace_orders")
    .insert({
      payment_mode: escrow ? "escrow" : "direct",
      order_number: orderNumber,
      buyer_id: auth.user.id,
      order_type: itemsSubtotal >= 50_000_000 ? "bulk" : "retail",
      items_subtotal_kobo: itemsSubtotal,
      delivery_fee_kobo: delivery,
      platform_fee_kobo: 0,
      total_amount_kobo: total,
      status: escrow ? "placed" : "payment_pending",
      payment_status: "pending",
      delivery_address: { line: address, state, lga, phone },
      buyer_notes: input.notes ? String(input.notes).slice(0, 1000) : null,
      placed_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();
  if (orderErr || !order) {
    logger.warn("checkout_order_failed", { code: orderErr?.code });
    return { ok: false, error: "Couldn't create the order. Please try again." };
  }

  const { error: itemsErr } = await supabase.from("marketplace_order_items").insert(
    priced.map((p) => {
      const subtotal = Math.round(p.unitPriceKobo * p.quantity);
      const commission = Math.round((subtotal * COMMISSION_BPS) / 10_000);
      return {
        order_id: order.id,
        listing_id: p.listingId,
        seller_id: p.sellerId,
        title: p.title.slice(0, 140),
        unit: p.unit,
        quantity: p.quantity,
        unit_price_kobo: p.unitPriceKobo,
        subtotal_kobo: subtotal,
        commission_bps: COMMISSION_BPS,
        commission_kobo: commission,
        seller_earnings_kobo: subtotal - commission,
      };
    }),
  );
  if (itemsErr) {
    logger.warn("checkout_items_failed", { code: itemsErr.code });
    return { ok: false, error: "Couldn't save the order lines. Please try again." };
  }

  const { error: fulErr } = await loose.from("marketplace_fulfilments").insert(
    sellers.map((sid, i) => ({
      direct_payment_status: escrow ? null : "awaiting_payment",
      order_id: order.id,
      seller_id: sid,
      fulfilment_number: `${orderNumber}-F${i + 1}`,
      status: "placed",
      subtotal_kobo: priced.filter((p) => p.sellerId === sid).reduce((s, p) => s + Math.round(p.unitPriceKobo * p.quantity), 0),
      delivery_fee_kobo: DELIVERY_PER_SELLER_KOBO,
      delivery_method: "seller_delivery",
    })),
  );
  if (fulErr) logger.warn("checkout_fulfilments_failed", { code: fulErr.code });

  const { error: resErr } = await supabase.rpc("reserve_inventory_for_order", { p_order_id: order.id });
  if (resErr) {
    logger.warn("checkout_reserve_failed", { code: resErr.code });
    return { ok: false, error: "Some items sold out while you were checking out. Refresh your cart and try again." };
  }

  const orderUrl = `/${lang}/account/marketplace/orders/${order.id}`;
  // Direct payment: no gateway. The order page shows each seller's bank details and the reference to use.
  if (!escrow) return { ok: true, orderId: order.id, redirectUrl: `${orderUrl}?placed=1` };
  const runtime = await getPaymentRuntime(order.id);

  let payUrl: string | null = null;
  if (runtime.provider === "flutterwave" && runtime.secretKey) {
    const flwRes = await startFlutterwave({
      orderId: order.id,
      orderNumber,
      amountKobo: total,
      email: auth.user.email ?? null,
      phone,
      fullName: (auth.user.user_metadata?.full_name as string) || (auth.user.user_metadata?.name as string) || undefined,
      returnPath: orderUrl,
      secretKey: runtime.secretKey,
      baseUrl: runtime.baseUrl || undefined,
    });
    payUrl = flwRes.url ?? null;
  } else if (runtime.provider === "paystack" && runtime.secretKey) {
    payUrl = await startPaystack({
      orderId: order.id,
      amountKobo: total,
      email: auth.user.email ?? null,
      returnPath: orderUrl,
      secretKey: runtime.secretKey,
      baseUrl: runtime.baseUrl || undefined,
    });
  } else if (process.env.PAYSTACK_SECRET_KEY) {
    payUrl = await startPaystack({
      orderId: order.id,
      amountKobo: total,
      email: auth.user.email ?? null,
      returnPath: orderUrl,
      secretKey: process.env.PAYSTACK_SECRET_KEY,
    });
  }

  return { ok: true, orderId: order.id, redirectUrl: payUrl ?? `${orderUrl}?payment=pending` };
}

type PaymentRuntime = {
  provider: "flutterwave" | "paystack" | "direct_transfer" | "test_adapter";
  mode: "test" | "live";
  secretKey: string | null;
  baseUrl: string | null;
  publicKey?: string | null;
};

/**
 * Resolves the active payment gateway and decrypted secret key from Supabase Vault (Admin Integrations),
 * falling back to process.env credentials.
 */
async function getPaymentRuntime(orderId?: string): Promise<PaymentRuntime> {
  // 1. Try authenticated buyer RPC (works directly with user session)
  try {
    const supabase = await createClient();
    const { data: creds, error } = await supabase.rpc("get_checkout_payment_credentials", {
      p_order_id: orderId || null,
    });
    if (!error && creds && typeof creds === "object") {
      const active = (creds.provider ?? "flutterwave") as "flutterwave" | "paystack" | "direct_transfer" | "test_adapter";
      const mode = (creds.mode ?? "live") as "test" | "live";
      const secrets = (creds.secrets as Record<string, string> | undefined) ?? {};
      const config = (creds.config as Record<string, string> | undefined) ?? {};

      const secretKey =
        secrets.secret_key ??
        (active === "flutterwave"
          ? process.env.FLUTTERWAVE_SECRET_KEY || null
          : process.env.PAYSTACK_SECRET_KEY || null);

      const baseUrl =
        config.base_url ??
        (active === "flutterwave" ? "https://api.flutterwave.com/v3" : "https://api.paystack.co");

      if (secretKey) {
        return {
          provider: active,
          mode,
          secretKey,
          baseUrl,
          publicKey: config.public_key,
        };
      }
    }
  } catch (rpcErr) {
    logger.warn("get_checkout_payment_credentials_fallback", { error: String(rpcErr) });
  }

  // 2. Try admin service client
  const admin = createServiceClient();
  if (admin) {
    try {
      const { data: settings } = await admin
        .from("integration_settings")
        .select("active_provider")
        .eq("kind", "payment")
        .maybeSingle();

      const active = (settings?.active_provider ?? "flutterwave") as "flutterwave" | "paystack" | "direct_transfer" | "test_adapter";

      const { data: rt } = await admin.rpc("integration_runtime", {
        p_kind: "payment",
        p_provider: active,
      });

      const mode = (rt?.mode ?? "test") as "test" | "live";
      const secrets = (rt?.secrets as Record<string, string> | undefined) ?? {};
      const config = (rt?.config as Record<string, string> | undefined) ?? {};

      const secretKey =
        secrets.secret_key ??
        (active === "flutterwave"
          ? process.env.FLUTTERWAVE_SECRET_KEY || null
          : process.env.PAYSTACK_SECRET_KEY || null);

      const baseUrl =
        config.base_url ??
        (active === "flutterwave" ? "https://api.flutterwave.com/v3" : "https://api.paystack.co");

      return {
        provider: active,
        mode,
        secretKey,
        baseUrl,
        publicKey: config.public_key,
      };
    } catch (err) {
      logger.warn("payment_runtime_lookup_failed", { error: String(err) });
    }
  }

  // 3. Fallback to process.env credentials
  const isFlutterwave = Boolean(process.env.FLUTTERWAVE_SECRET_KEY) || !process.env.PAYSTACK_SECRET_KEY;
  const provider = isFlutterwave ? "flutterwave" : "paystack";
  const secretKey = isFlutterwave
    ? process.env.FLUTTERWAVE_SECRET_KEY || null
    : process.env.PAYSTACK_SECRET_KEY || null;

  return {
    provider,
    mode: "live",
    secretKey,
    baseUrl: provider === "flutterwave" ? "https://api.flutterwave.com/v3" : "https://api.paystack.co",
  };
}

/**
 * Opens a Flutterwave Standard v3 transaction and returns its hosted checkout page URL,
 * or null when Flutterwave isn't configured or errors.
 */
async function startFlutterwave(params: {
  orderId: string;
  orderNumber: string;
  amountKobo: number;
  email: string | null;
  phone: string;
  fullName?: string;
  returnPath: string;
  secretKey: string;
  baseUrl?: string;
}): Promise<{ url?: string; error?: string }> {
  const { orderId, orderNumber, amountKobo, email, phone, fullName, returnPath, secretKey, baseUrl } = params;
  if (!secretKey) return { error: "Secret key is missing." };
  const reference = `FLW_${orderId}_${Date.now()}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const amountNaira = amountKobo / 100;
  const endpoint = `${(baseUrl || "https://api.flutterwave.com/v3").replace(/\/+$/, "")}/payments`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: amountNaira,
        currency: "NGN",
        redirect_url: site ? `${site}${returnPath}` : undefined,
        customer: {
          email: email || "customer@cultivanode.com",
          phonenumber: phone || undefined,
          name: fullName || "CultivaNode Customer",
        },
        customizations: {
          title: "CultivaNode Marketplace Escrow",
          description: `Escrow payment for order ${orderNumber}`,
          logo: site ? `${site}/icon-192.png` : undefined,
        },
        meta: {
          order_id: orderId,
          order_number: orderNumber,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const body = (await res.json()) as { status?: string; message?: string; data?: { link?: string } };
    if (!res.ok || body.status !== "success" || !body.data?.link) {
      logger.warn("flutterwave_initialize_failed", { status: res.status, msg: body.message });
      return { error: body.message || `Flutterwave API returned status ${res.status}` };
    }

    const admin = createServiceClient();
    if (admin) {
      await admin.from("marketplace_payments").insert({
        order_id: orderId,
        payment_reference: reference,
        provider: "flutterwave",
        amount_kobo: amountKobo,
        status: "pending",
      });
      await admin.from("marketplace_orders").update({ status: "payment_pending" }).eq("id", orderId);
    }
    return { url: body.data.link };
  } catch (error) {
    logger.warn("flutterwave_initialize_error", { reason: error instanceof Error ? error.name : "unknown" });
    return { error: error instanceof Error ? error.message : "Network error contacting Flutterwave" };
  }
}

/**
 * Opens a Paystack transaction and returns its hosted payment page, or null when Paystack isn't
 * configured (the order then waits as "payment pending"). The webhook marks the order paid.
 */
async function startPaystack(params: {
  orderId: string;
  amountKobo: number;
  email: string | null;
  returnPath: string;
  secretKey: string;
  baseUrl?: string;
}): Promise<string | null> {
  const { orderId, amountKobo, email, returnPath, secretKey, baseUrl } = params;
  if (!secretKey || !email) return null;
  const reference = `PSTK_${orderId}_${Date.now()}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const endpoint = `${(baseUrl || "https://api.paystack.co").replace(/\/+$/, "")}/transaction/initialize`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: "NGN",
        reference,
        callback_url: site ? `${site}${returnPath}` : undefined,
        metadata: { order_id: orderId },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json()) as { status?: boolean; data?: { authorization_url?: string } };
    if (!res.ok || !body.status || !body.data?.authorization_url) {
      logger.warn("paystack_initialize_failed", { status: res.status });
      return null;
    }
    const admin = createServiceClient();
    if (admin) {
      await admin.from("marketplace_payments").insert({ order_id: orderId, payment_reference: reference, provider: "paystack", amount_kobo: amountKobo, status: "pending" });
      await admin.from("marketplace_orders").update({ status: "payment_pending" }).eq("id", orderId);
    }
    return body.data.authorization_url;
  } catch (error) {
    logger.warn("paystack_initialize_error", { reason: error instanceof Error ? error.name : "unknown" });
    return null;
  }
}

/**
 * Initiates payment for an existing placed order using the active payment provider (Flutterwave or Paystack).
 */
export async function initiateOrderPayment(orderId: string, lang = "en"): Promise<{ ok: boolean; redirectUrl?: string; error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Sign in to complete payment." };
  if (!(await isOn("escrow_payments"))) {
    return { ok: false, error: "Paying through CultivaNode is coming soon. For now, pay the seller's bank account directly, as shown on your order." };
  }

  const { data: order, error } = await supabase
    .from("marketplace_orders")
    .select("id, order_number, total_amount_kobo, status, payment_status, delivery_address")
    .eq("id", orderId)
    .single();

  if (error || !order) return { ok: false, error: "Order not found." };
  if (order.payment_status === "paid" || order.payment_status === "escrowed") {
    return { ok: false, error: "Order is already paid." };
  }

  const orderUrl = `/${lang}/account/marketplace/orders/${order.id}`;
  const runtime = await getPaymentRuntime(order.id);
  const phone = (order.delivery_address as { phone?: string } | null)?.phone || "";

  let payUrl: string | null = null;
  let gatewayError: string | null = null;

  if (runtime.provider === "flutterwave" && runtime.secretKey) {
    const flwRes = await startFlutterwave({
      orderId: order.id,
      orderNumber: order.order_number,
      amountKobo: Number(order.total_amount_kobo),
      email: auth.user.email ?? null,
      phone,
      fullName: (auth.user.user_metadata?.full_name as string) || (auth.user.user_metadata?.name as string) || undefined,
      returnPath: orderUrl,
      secretKey: runtime.secretKey,
      baseUrl: runtime.baseUrl || undefined,
    });
    payUrl = flwRes.url ?? null;
    gatewayError = flwRes.error ?? null;
  } else if (runtime.provider === "paystack" && runtime.secretKey) {
    payUrl = await startPaystack({
      orderId: order.id,
      amountKobo: Number(order.total_amount_kobo),
      email: auth.user.email ?? null,
      returnPath: orderUrl,
      secretKey: runtime.secretKey,
      baseUrl: runtime.baseUrl || undefined,
    });
  } else if (process.env.PAYSTACK_SECRET_KEY) {
    payUrl = await startPaystack({
      orderId: order.id,
      amountKobo: Number(order.total_amount_kobo),
      email: auth.user.email ?? null,
      returnPath: orderUrl,
      secretKey: process.env.PAYSTACK_SECRET_KEY,
    });
  }

  if (!payUrl) {
    const detail = gatewayError ? `: ${gatewayError}` : ". Please verify live keys in Admin Integrations.";
    return { ok: false, error: `Could not connect to payment gateway (${runtime.provider})${detail}` };
  }

  return { ok: true, redirectUrl: payUrl };
}

