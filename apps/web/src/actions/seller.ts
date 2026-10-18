"use server";

// "My shop": a farmer or provider sells goods (produce, inputs) and services (consulting, spraying, labour,
// machinery hire) on the marketplace, manages the listings, and works through orders. Row level security limits
// every write to the seller's own shop; trust fields (verification, rating, commission, suspension) are guarded
// by database triggers, and order status moves only through public.seller_update_fulfilment.
import { revalidatePath } from "next/cache";
import type { FormResult } from "@/components/live/action-form";
import { actor, dbFail, fail, id, kobo, num, ok, oneOf, optText, refreshPages, text } from "@/lib/account/act";
import { FULFIL_STEPS, LISTING_TYPES, PRICE_MODELS, SELLER_TYPES, UNITS } from "@/lib/shop";
import { checkPhotos, deletePhotos, photoFiles, uploadPhotos } from "@/lib/listing-photos";
import { stateCentroid } from "@/lib/state-centroids";

type R = Promise<FormResult>;

const SHOP_PATHS = ["/marketplace/seller"];

/** The signed-in person's shop, created (unverified) on first use. */
async function myShop(supabase: Awaited<ReturnType<typeof actor>>["supabase"], uid: string, type: string, name?: string | null) {
  const { data: shop } = await supabase.from("marketplace_sellers").select("id").eq("profile_id", uid).maybeSingle();
  if (shop) return shop.id;
  const { data: me } = await supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle();
  const sellerType = type === "service" ? "service_provider" : type === "labour" ? "labour_provider" : type === "machinery" ? "machinery_owner" : type === "input" ? "agro_dealer" : "farmer";
  const { data: created, error } = await supabase
    .from("marketplace_sellers")
    // verification, rating and commission are set by the database (pending until staff verify the shop)
    .insert({ profile_id: uid, seller_type: sellerType, business_name: (name || me?.full_name || "My farm shop").slice(0, 120) })
    .select("id")
    .single();
  if (error || !created) return null;
  return created.id;
}

type ListingValues = {
  listing_type: string;
  title: string;
  description: string | null;
  unit: string;
  price_model: string;
  base_price_kobo: number;
  min_order_quantity: number;
  category_id: string;
  location_state: string | null;
  location_lga: string | null;
};

function listingFields(form: FormData): { error: string } | { type: string; values: ListingValues } {
  const type = oneOf(form, "listing_type", LISTING_TYPES);
  const title = text(form, "title", 140);
  const unit = oneOf(form, "unit", UNITS);
  const price = kobo(form, "price");
  const minOrder = num(form, "min_order_quantity") ?? 1;
  const category = id(form, "category_id");
  if (!type || title.length < 3 || !unit) return { error: "Choose what you're selling, give it a title (3+ letters) and a unit." };
  if (!category) return { error: "Choose a category so buyers can find your listing." };
  if (price === null || price < 0) return { error: "Enter a price in naira (0 if it's by quotation)." };
  if (!(minOrder > 0)) return { error: "Minimum order must be more than zero." };
  return {
    type,
    values: {
      listing_type: type,
      title,
      description: optText(form, "description", 3000),
      unit,
      price_model: oneOf(form, "price_model", PRICE_MODELS, type === "service" ? "quotation" : "fixed")!,
      base_price_kobo: price,
      min_order_quantity: minOrder,
      category_id: category,
      location_state: optText(form, "state", 60),
      location_lga: optText(form, "lga", 60),
    },
  };
}

/** New listing: goods with stock, or a service with how many jobs/hours/days you can take on. */
export async function createListing(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const f = listingFields(form);
  if ("error" in f) return fail(f.error);
  const photos = photoFiles(form);
  const photoErr = checkPhotos(photos);
  if (photoErr) return fail(photoErr);
  const qty = num(form, "quantity");
  if (qty === null || qty <= 0) return fail(f.type === "service" || f.type === "labour" ? "How many jobs, hours or days can you take on?" : "Enter how much you have to sell.");
  const shopId = await myShop(supabase, uid, f.type, optText(form, "business_name", 120));
  if (!shopId) return fail("Couldn't open your shop just now. Please try again.");

  // Location: the farm's point if one is chosen, otherwise the centre of the state on the listing / profile.
  const farmId = id(form, "farm_id");
  let point: { lat: number; lng: number } | null = null;
  if (farmId) {
    const { data: fp } = await supabase.from("farm_points").select("lat, lng").eq("id", farmId).maybeSingle();
    if (fp?.lat != null && fp.lng != null) point = { lat: Number(fp.lat), lng: Number(fp.lng) };
  }
  let state = f.values.location_state;
  if (!state) {
    const { data: me } = await supabase.from("profiles").select("state, lga").eq("id", uid).maybeSingle();
    state = me?.state ?? null;
    f.values.location_lga ??= me?.lga ?? null;
  }
  point ??= stateCentroid(state) ?? stateCentroid("Oyo")!;

  const { data: listing, error } = await supabase
    .from("marketplace_listings")
    .insert({
      ...f.values,
      location_state: state,
      seller_id: shopId,
      location: `SRID=4326;POINT(${point.lng.toFixed(6)} ${point.lat.toFixed(6)})`,
      delivery_options: f.type === "service" || f.type === "labour" ? ["seller_delivery"] : ["pickup", "seller_delivery"],
      status: form.get("publish") === "no" ? "paused" : "active",
    })
    .select("id")
    .single();
  if (error || !listing) return dbFail(error, "create_listing");

  const { error: lotErr } = await supabase.from("marketplace_inventory_lots").insert({
    listing_id: listing.id,
    lot_number: `LOT-${Date.now().toString(36).toUpperCase()}`,
    physical_quantity: qty,
    reserved_quantity: 0,
    allocated_quantity: 0,
    sold_quantity: 0,
  });
  if (lotErr) return dbFail(lotErr, "create_listing_lot");
  if (farmId) {
    await supabase.from("marketplace_produce_provenance").insert({ listing_id: listing.id, farm_id: farmId, grade: optText(form, "grade", 30) });
  }
  // Photos go up once the listing exists (they're stored under its id). A failed upload doesn't undo the
  // listing — the seller can add photos from Edit.
  let photoNote = "";
  if (photos.length) {
    const up = await uploadPhotos(supabase, uid, listing.id, photos);
    const saved = "urls" in up ? await supabase.from("marketplace_listings").update({ images: up.urls }).eq("id", listing.id) : null;
    if (!("urls" in up) || saved?.error) {
      if ("urls" in up) await deletePhotos(supabase, uid, up.urls);
      photoNote = " The photos didn't upload — add them from Edit.";
    }
  }
  refreshPages(...SHOP_PATHS);
  return ok((form.get("publish") === "no" ? "Saved as paused — publish it when you're ready." : "Listing is live on the marketplace.") + photoNote);
}

/** Edit a listing. Photos: "add" to the current ones (default), "replace" them, or "clear" them all. */
export async function updateListing(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const listingId = id(form, "listing_id");
  if (!listingId) return fail("Listing not found.");
  const f = listingFields(form);
  if ("error" in f) return fail(f.error);
  const { data: cur } = await supabase.from("marketplace_listings").select("images").eq("id", listingId).maybeSingle();
  if (!cur) return fail("Listing not found.");
  const before: string[] = cur.images ?? [];
  const mode = oneOf(form, "photos_mode", ["add", "replace", "clear"] as const, "add")!;
  const photos = mode === "clear" ? [] : photoFiles(form);
  const photoErr = checkPhotos(photos, mode === "add" ? before.length : 0);
  if (photoErr) return fail(photoErr);

  let images = before;
  if (photos.length) {
    const up = await uploadPhotos(supabase, uid, listingId, photos);
    if (!("urls" in up)) return fail(up.error);
    images = mode === "replace" ? up.urls : [...before, ...up.urls];
  } else if (mode === "clear") {
    images = [];
  }
  const { error } = await supabase.from("marketplace_listings").update({ ...f.values, images }).eq("id", listingId);
  if (error) {
    await deletePhotos(supabase, uid, images.filter((u) => !before.includes(u)));
    return dbFail(error, "update_listing");
  }
  await deletePhotos(supabase, uid, before.filter((u) => !images.includes(u)));
  refreshPages(...SHOP_PATHS);
  revalidatePath("/[lang]/marketplace", "page");
  revalidatePath("/[lang]/marketplace/[id]", "page");
  return ok("Listing updated.");
}

/** Pause (hidden from buyers) or publish again. Staff suspensions can't be lifted here. */
export async function setListingStatus(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const listingId = id(form, "listing_id");
  const status = oneOf(form, "status", ["active", "paused"] as const);
  if (!listingId || !status) return fail("Listing not found.");
  const { data: cur } = await supabase.from("marketplace_listings").select("status, available_quantity").eq("id", listingId).maybeSingle();
  if (!cur) return fail("Listing not found.");
  if (cur.status === "suspended") return fail("CultivaNode staff suspended this listing. Contact support to review it.");
  if (status === "active" && Number(cur.available_quantity) <= 0) return fail("Add stock first — there is nothing available to sell.");
  const { error } = await supabase.from("marketplace_listings").update({ status }).eq("id", listingId);
  if (error) return dbFail(error, "set_listing_status");
  refreshPages(...SHOP_PATHS);
  return ok(status === "active" ? "Listing is live." : "Listing paused.");
}

/**
 * Set how much is available now (stock for goods; jobs, hours or days for services). Quantities already
 * reserved by orders stay reserved; only the free amount changes.
 */
export async function setAvailable(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const listingId = id(form, "listing_id");
  const target = num(form, "available");
  if (!listingId || target === null || target < 0) return fail("Enter how much you have available now (0 or more).");
  const { data: lots, error } = await supabase
    .from("marketplace_inventory_lots")
    .select("id, physical_quantity, reserved_quantity, allocated_quantity")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) return dbFail(error, "read_stock");
  const free = (l: { physical_quantity: number; reserved_quantity: number; allocated_quantity: number }) =>
    Number(l.physical_quantity) - Number(l.reserved_quantity) - Number(l.allocated_quantity);
  const current = (lots ?? []).reduce((s, l) => s + free(l), 0);
  let delta = Math.round((target - current) * 100) / 100;
  if (delta === 0) return ok("No change.");
  if (delta > 0) {
    const lot = lots?.[0];
    const res = lot
      ? await supabase.from("marketplace_inventory_lots").update({ physical_quantity: Number(lot.physical_quantity) + delta }).eq("id", lot.id)
      : await supabase.from("marketplace_inventory_lots").insert({ listing_id: listingId, lot_number: `LOT-${Date.now().toString(36).toUpperCase()}`, physical_quantity: delta, reserved_quantity: 0, allocated_quantity: 0, sold_quantity: 0 });
    if (res.error) return dbFail(res.error, "add_stock");
  } else {
    for (const lot of lots ?? []) {
      if (delta >= 0) break;
      const take = Math.min(free(lot), -delta);
      if (take <= 0) continue;
      const { error: e } = await supabase.from("marketplace_inventory_lots").update({ physical_quantity: Number(lot.physical_quantity) - take }).eq("id", lot.id);
      if (e) return dbFail(e, "reduce_stock");
      delta += take;
    }
  }
  refreshPages(...SHOP_PATHS);
  return ok("Availability updated.");
}

/** Remove a listing that has never been ordered; one with order history is paused instead (the record stays). */
export async function removeListing(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const listingId = id(form, "listing_id");
  if (!listingId) return fail("Listing not found.");
  const { count } = await supabase.from("marketplace_order_items").select("id", { count: "exact", head: true }).eq("listing_id", listingId);
  if ((count ?? 0) > 0) {
    const { error } = await supabase.from("marketplace_listings").update({ status: "paused" }).eq("id", listingId);
    if (error) return dbFail(error, "pause_listing");
    refreshPages(...SHOP_PATHS);
    return ok("This listing has orders, so it was paused instead of deleted.");
  }
  const { data: cur } = await supabase.from("marketplace_listings").select("images").eq("id", listingId).maybeSingle();
  await supabase.from("marketplace_produce_provenance").delete().eq("listing_id", listingId);
  await supabase.from("marketplace_inventory_lots").delete().eq("listing_id", listingId);
  const { error } = await supabase.from("marketplace_listings").delete().eq("id", listingId);
  if (error) return dbFail(error, "delete_listing");
  await deletePhotos(supabase, uid, cur?.images ?? []);
  refreshPages(...SHOP_PATHS);
  return ok("Listing deleted.");
}

export async function updateShop(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const name = text(form, "business_name", 120);
  if (name.length < 2) return fail("Give your shop a name.");
  const type = oneOf(form, "seller_type", SELLER_TYPES, "farmer")!;
  const { data: shop } = await supabase.from("marketplace_sellers").select("id").eq("profile_id", uid).maybeSingle();
  const res = shop
    ? await supabase.from("marketplace_sellers").update({ business_name: name, seller_type: type, description: optText(form, "description", 2000) }).eq("id", shop.id)
    : await supabase.from("marketplace_sellers").insert({ profile_id: uid, business_name: name, seller_type: type, description: optText(form, "description", 2000) });
  if (res.error) return dbFail(res.error, "update_shop");
  refreshPages(...SHOP_PATHS);
  return ok("Shop details saved.");
}

/** Move one order along: confirm, prepare, hand over / dispatch, deliver — or reject with a reason. */
export async function fulfilOrder(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const fulfilmentId = id(form, "fulfilment_id");
  const status = oneOf(form, "status", FULFIL_STEPS);
  if (!fulfilmentId || !status) return fail("Order not found.");
  const { error } = await supabase.rpc("seller_update_fulfilment", {
    p_fulfilment: fulfilmentId,
    p_status: status,
    p_note: optText(form, "note", 500) ?? undefined,
    p_tracking: optText(form, "tracking", 80) ?? undefined,
  });
  if (error) {
    // Our own database messages (wrong step, unpaid order, missing reason) are written for the seller.
    if (["P0001", "22023", "P0002"].includes(error.code ?? "")) return fail(error.message);
    return dbFail(error, "fulfil_order");
  }
  refreshPages(...SHOP_PATHS, "/marketplace/orders");
  return ok("Order updated — the buyer has been notified.");
}
