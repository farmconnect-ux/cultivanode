"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nairaToKobo } from "@cultivanode/shared";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { checkPhotos, deletePhotos, photoFiles, uploadPhotos } from "@/lib/listing-photos";
import { stateCentroid } from "@/lib/state-centroids";

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
  const lga = text(formData, "lga", 60) || null;
  const photoError = checkPhotos(photoFiles(formData));
  if (photoError) return { ok: false, error: photoError };
  // No GPS on the form: place the listing at the centre of its state (not a fixed Ibadan point).
  const centre = stateCentroid(state) ?? stateCentroid("Oyo")!;
  const lat = Number(text(formData, "latitude", 30)) || centre.lat;
  const lng = Number(text(formData, "longitude", 30)) || centre.lng;

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
        // New shops start unverified; the database enforces this too (marketplace_sellers_guard).
        verification_status: "pending",
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

  // Photos (optional): stored under the new listing's id; a failed upload doesn't undo the listing.
  const photos = photoFiles(formData);
  if (photos.length) {
    const up = await uploadPhotos(supabase, user.id, listing.id, photos);
    if ("urls" in up) {
      const { error: imgErr } = await supabase.from("marketplace_listings").update({ images: up.urls }).eq("id", listing.id);
      if (imgErr) await deletePhotos(supabase, user.id, up.urls);
    }
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
