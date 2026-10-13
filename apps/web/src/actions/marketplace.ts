"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nairaToKobo } from "@cultivanode/shared";
import {
  calculateOrderFees,
  groupCartBySeller,
  MockPaymentAdapter,
  PaystackAdapter,
  FlutterwaveAdapter,
  type MarketplaceCartItem,
} from "@cultivanode/shared/engines/marketplace";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const text = (form: FormData, key: string, max = 500) => String(form.get(key) ?? "").trim().slice(0, max);

async function requireUser(lang = "en") {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect(`/${lang}/sign-in`);
  }
  return { supabase, user: data.user };
}

/**
 * Creates a new marketplace listing (Produce, Inputs, Machinery, Labour, Services).
 * Works for both CultivaNode farmers and external sellers.
 */
export async function createMarketplaceListingAction(formData: FormData) {
  const lang = text(formData, "lang", 5) || "en";
  const { supabase, user } = await requireUser(lang);

  const listingType = text(formData, "listing_type", 30);
  const categoryId = text(formData, "category_id", 50);
  const title = text(formData, "title", 140);
  const description = text(formData, "description", 3000);
  const unit = text(formData, "unit", 20);
  const priceModel = text(formData, "price_model", 30) || "fixed";
  const priceNaira = text(formData, "price_naira", 30);
  const quantityStr = text(formData, "available_quantity", 30);
  const minOrderStr = text(formData, "min_order_quantity", 30) || "1";
  const state = text(formData, "state", 60) || "Oyo";
  const lga = text(formData, "lga", 60) || "Ibadan";
  const lat = Number(text(formData, "latitude", 30) || "7.3775");
  const lng = Number(text(formData, "longitude", 30) || "3.9470");

  const basePriceKobo = nairaToKobo(priceNaira);
  if (!basePriceKobo || basePriceKobo <= 0) {
    return { ok: false, error: "Invalid price provided." };
  }

  const availableQuantity = Number(quantityStr);
  if (!availableQuantity || availableQuantity <= 0) {
    return { ok: false, error: "Quantity must be greater than zero." };
  }

  // 1. Ensure or create seller profile
  let { data: seller } = await supabase
    .from("marketplace_sellers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!seller) {
    const businessName = text(formData, "business_name", 120) || "Independent Agro Seller";
    const { data: newSeller, error: sellerError } = await supabase
      .from("marketplace_sellers")
      .insert({
        profile_id: user.id,
        seller_type: listingType === "produce" ? "farmer" : "agro_dealer",
        business_name: businessName,
        verification_status: "verified",
      })
      .select("id")
      .single();

    if (sellerError || !newSeller) {
      logger.error("Failed to initialize seller profile", { code: sellerError.code });
      return { ok: false, error: "Could not create seller profile." };
    }
    seller = newSeller;
  }

  // 2. Insert Listing
  const pointEwkt = `SRID=4326;POINT(${lng} ${lat})`;
  const { data: listing, error: listingError } = await supabase
    .from("marketplace_listings")
    .insert({
      seller_id: seller.id,
      category_id: categoryId,
      listing_type: listingType,
      title,
      description,
      unit,
      price_model: priceModel,
      base_price_kobo: basePriceKobo,
      available_quantity: availableQuantity,
      min_order_quantity: Number(minOrderStr),
      location: pointEwkt,
      location_state: state,
      location_lga: lga,
      delivery_options: ["pickup", "seller_delivery"],
      status: "active",
    })
    .select("id")
    .single();

  if (listingError || !listing) {
    logger.error("Failed to create marketplace listing", { code: listingError.code });
    return { ok: false, error: listingError?.message || "Failed to create listing." };
  }

  // 3. Create initial inventory lot for concurrency protection
  const { error: lotError } = await supabase.from("marketplace_inventory_lots").insert({
    listing_id: listing.id,
    lot_number: `LOT-${Date.now().toString().slice(-6)}`,
    physical_quantity: availableQuantity,
    reserved_quantity: 0,
    allocated_quantity: 0,
    sold_quantity: 0,
  });

  if (lotError) {
    logger.error("Failed to create inventory lot", { code: lotError.code });
  }

  // 4. Optional: If linked to a farm harvest batch, record produce provenance
  const harvestId = text(formData, "harvest_id", 50);
  const farmId = text(formData, "farm_id", 50);
  const cropCycleId = text(formData, "crop_cycle_id", 50);

  if (farmId || harvestId) {
    await supabase.from("marketplace_produce_provenance").insert({
      listing_id: listing.id,
      farm_id: farmId || null,
      crop_cycle_id: cropCycleId || null,
      harvest_id: harvestId || null,
      batch_code: text(formData, "batch_code", 50) || null,
      grade: text(formData, "grade", 30) || "grade_a",
    });
  }

  revalidatePath(`/${lang}/marketplace`);
  return { ok: true, listingId: listing.id };
}

/**
 * Places a multi-seller checkout order, calculating fees and atomically reserving inventory.
 */
export async function placeMarketplaceOrderAction(params: {
  lang: string;
  items: MarketplaceCartItem[];
  deliveryAddress: {
    address: string;
    state: string;
    lga: string;
    contactPhone: string;
  };
  buyerNotes?: string;
}) {
  const { supabase, user } = await requireUser(params.lang);

  if (!params.items || params.items.length === 0) {
    return { ok: false, error: "Cart is empty." };
  }

  const fees = calculateOrderFees(params.items, 500, 300000); // 5% commission, N3,000 delivery
  const orderNumber = `ORD-${toShortDate()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // 1. Insert parent order
  const { data: order, error: orderError } = await supabase
    .from("marketplace_orders")
    .insert({
      order_number: orderNumber,
      buyer_id: user.id,
      items_subtotal_kobo: fees.itemsSubtotalKobo,
      delivery_fee_kobo: fees.deliveryFeeKobo,
      platform_fee_kobo: fees.platformFeeKobo,
      total_amount_kobo: fees.totalAmountKobo,
      status: "placed",
      payment_status: "pending",
      delivery_address: params.deliveryAddress,
      buyer_notes: params.buyerNotes ?? null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    logger.error("Failed to place order", { code: orderError.code });
    return {
      ok: false,
      error: orderError?.message
        ? `Cannot place order: ${orderError.message}`
        : "Failed to place order. Please check that you are signed in.",
    };
  }

  // 2. Insert order items
  const groupedBySeller = groupCartBySeller(params.items);

  for (const item of params.items) {
    const subtotal = Math.round(item.unitPriceKobo * item.quantity);
    const comm = Math.round(subtotal * 0.05);

    const { error: itemError } = await supabase.from("marketplace_order_items").insert({
      order_id: order.id,
      listing_id: item.listingId,
      seller_id: item.sellerId,
      title: item.title,
      unit: item.unit,
      quantity: item.quantity,
      unit_price_kobo: item.unitPriceKobo,
      subtotal_kobo: subtotal,
      commission_bps: 500,
      commission_kobo: comm,
      seller_earnings_kobo: subtotal - comm,
    });

    if (itemError) {
      logger.error("Failed to insert order item", { code: itemError.code });
      return { ok: false, error: `Cannot save order item: ${itemError.message}` };
    }

    // Ensure inventory lot exists for concurrency protection and reservation
    try {
      const { data: lots } = await supabase
        .from("marketplace_inventory_lots")
        .select("id, physical_quantity, reserved_quantity, allocated_quantity")
        .eq("listing_id", item.listingId)
        .limit(1);

      if (!lots || lots.length === 0) {
        await supabase.from("marketplace_inventory_lots").insert({
          listing_id: item.listingId,
          lot_number: `LOT-AUTO-${Date.now().toString().slice(-6)}`,
          physical_quantity: Math.max(item.quantity * 10, 500),
          reserved_quantity: 0,
          allocated_quantity: 0,
          sold_quantity: 0,
        });
      }
    } catch (lotErr) {
      logger.error("Auto lot check notice", { error: String(lotErr) });
    }
  }

  // 3. Create fulfillment records per seller
  let fIndex = 1;
  for (const [sellerId, sellerItems] of groupedBySeller.entries()) {
    const subtotal = sellerItems.reduce((acc, i) => acc + Math.round(i.unitPriceKobo * i.quantity), 0);
    const fNumber = `${orderNumber}-F${fIndex++}`;

    const { error: fError } = await supabase.from("marketplace_fulfilments").insert({
      order_id: order.id,
      seller_id: sellerId,
      fulfilment_number: fNumber,
      status: "placed",
      subtotal_kobo: subtotal,
      delivery_fee_kobo: 0,
      delivery_method: "seller_delivery",
    });

    if (fError) {
      logger.error("Fulfilment record notice", { code: fError.code });
    }
  }

  // 4. Atomically reserve inventory
  const { error: rpcError } = await supabase.rpc("reserve_inventory_for_order", {
    p_order_id: order.id,
  });

  if (rpcError) {
    logger.error("Inventory reservation failed", { code: rpcError.code });
    return { ok: false, error: rpcError.message || "Insufficient stock to complete order." };
  }

  return { ok: true, orderId: order.id, orderNumber };
}

/**
 * Initiates payment via the payment abstraction layer.
 */
export async function initiateMarketplacePaymentAction(orderId: string, lang = "en") {
  const { supabase, user } = await requireUser(lang);

  const { data: order } = await supabase
    .from("marketplace_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  const adapter = new MockPaymentAdapter();
  const result = await adapter.initiatePayment(order.id, order.total_amount_kobo, user.email ?? "user@cultivanode.com");

  // Record initial payment record
  await supabase.from("marketplace_payments").insert({
    order_id: order.id,
    payment_reference: result.paymentReference,
    provider: result.provider,
    amount_kobo: order.total_amount_kobo,
    status: "pending",
  });

  return { ok: true, ...result };
}

/**
 * Confirms delivery, releases escrow to seller, and syncs Farm Books and Inventory.
 */
export async function confirmDeliveryAndReleaseEscrowAction(fulfilmentId: string, lang = "en") {
  const { supabase } = await requireUser(lang);

  const { data, error } = await supabase.rpc("release_fulfilment_escrow", {
    p_fulfilment_id: fulfilmentId,
  });

  if (error) {
    logger.error("Failed to release escrow", { code: error.code });
    return { ok: false, error: error.message };
  }

  revalidatePath(`/${lang}/account/marketplace/orders`);
  return { ok: true, data };
}

/**
 * Creates a Bulk RFQ Buyer Request.
 */
export async function createBuyerRequestAction(formData: FormData) {
  const lang = text(formData, "lang", 5) || "en";
  const { supabase, user } = await requireUser(lang);

  const title = text(formData, "title", 140);
  const categoryId = text(formData, "category_id", 50);
  const commodity = text(formData, "commodity", 100);
  const quantity = Number(text(formData, "quantity", 30));
  const unit = text(formData, "unit", 20);
  const deliveryLocation = text(formData, "delivery_location", 200);
  const deadlineDate = text(formData, "deadline_date", 30);
  const notes = text(formData, "notes", 2000);

  const reqNumber = `RFQ-${toShortDate()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const { data, error } = await supabase
    .from("buyer_requests")
    .insert({
      buyer_id: user.id,
      request_number: reqNumber,
      title,
      category_id: categoryId,
      target_crop_or_commodity: commodity,
      required_quantity: quantity,
      unit,
      delivery_location: deliveryLocation,
      deadline_date: deadlineDate,
      notes,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to create buyer request", { code: error.code });
    return { ok: false, error: error.message };
  }

  revalidatePath(`/${lang}/marketplace/rfq`);
  return { ok: true, requestId: data.id };
}

function toShortDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}
