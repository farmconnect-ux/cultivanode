"use server";

// Marketplace cart pricing and checkout. Prices, units, sellers and stock always come from the
// database, never from the browser: the cart only carries listing ids and quantities.
import { createClient } from "@/lib/supabase/server";
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
  const itemsSubtotal = priced.reduce((s, p) => s + Math.round(p.unitPriceKobo * p.quantity), 0);
  const delivery = DELIVERY_PER_SELLER_KOBO * sellers.length;
  const total = itemsSubtotal + delivery;
  const orderNumber = `ORD-${new Date().toISOString().slice(0, 7)}-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const { data: order, error: orderErr } = await supabase
    .from("marketplace_orders")
    .insert({
      order_number: orderNumber,
      buyer_id: auth.user.id,
      order_type: itemsSubtotal >= 50_000_000 ? "bulk" : "retail",
      items_subtotal_kobo: itemsSubtotal,
      delivery_fee_kobo: delivery,
      platform_fee_kobo: 0,
      total_amount_kobo: total,
      status: "placed",
      payment_status: "pending",
      delivery_address: { line: address, state, lga, phone },
      buyer_notes: input.notes ? String(input.notes).slice(0, 1000) : null,
      placed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
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

  const { error: fulErr } = await supabase.from("marketplace_fulfilments").insert(
    sellers.map((sid, i) => ({
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
  const pay = await startPaystack(order.id, total, auth.user.email ?? null, orderUrl);
  return { ok: true, orderId: order.id, redirectUrl: pay ?? `${orderUrl}?payment=pending` };
}

/**
 * Opens a Paystack transaction and returns its hosted payment page, or null when Paystack isn't
 * configured (the order then waits as "payment pending"). The webhook marks the order paid.
 */
async function startPaystack(orderId: string, amountKobo: number, email: string | null, returnPath: string): Promise<string | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !email) return null;
  const reference = `PSTK_${orderId}_${Date.now()}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
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
