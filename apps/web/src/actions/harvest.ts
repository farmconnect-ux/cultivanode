"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createHarvestBatch(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const cropName = String(form.get("crop_name") || "").trim();
  const parcelName = String(form.get("parcel_name") || form.get("plot_name") || "").trim();
  const rawQty = String(form.get("quantity_mt") || form.get("quantity") || "0").replace(",", ".");
  const quantityMt = parseFloat(rawQty);
  const moistureBrix = String(form.get("certified_moisture_brix") || "").trim();
  const qualityGrade = String(form.get("quality_grade") || "Grade A").trim();
  const askingPricePerMtMinor = parseInt(String(form.get("asking_price_per_mt_minor") || form.get("price") || "0"), 10) || 0;
  const pickupWindowDate = String(form.get("pickup_window_date") || "").trim() || null;
  const notes = String(form.get("notes") || "").trim();

  if (!farmId || !cropName || quantityMt <= 0) {
    return;
  }

  const payload = {
    farm_id: farmId,
    crop_name: cropName,
    parcel_name: parcelName || null,
    quantity_metric_tons: quantityMt,
    certified_moisture_brix: moistureBrix || null,
    quality_grade: qualityGrade,
    asking_price_per_mt_minor: askingPricePerMtMinor,
    pickup_window_date: pickupWindowDate,
    status: "available",
    notes: notes || null,
  };

  await (supabase.from("farm_harvest_batches") as any).insert(payload);

  revalidatePath("/account/harvest");
  revalidatePath("/marketplace");
}

export async function listHarvestOnMarketplace(form: FormData): Promise<void> {
  const { supabase, user } = await getAuth();
  const batchId = String(form.get("batch_id") || "").trim();
  if (!batchId) return;

  const { data: batch } = await (supabase.from("farm_harvest_batches") as any)
    .select("*, farms(name, state, lga)")
    .eq("id", batchId)
    .single();

  if (!batch) return;

  // Create marketplace listing from harvest batch
  const listingPayload = {
    owner_id: user.id,
    title: `${batch.crop_name} (${batch.quality_grade}) - Fresh Farmgate Harvest`,
    description: `Verified harvest batch from ${batch.farms?.name || "Farm"} in ${batch.farms?.state || "Oyo State"}. Available quantity: ${batch.quantity_metric_tons} MT. Quality: ${batch.quality_grade}. Certified: ${batch.certified_moisture_brix || "Standard"}.`,
    category: "produce",
    pricing_unit: "ha", // or job / ton
    price_minor: batch.asking_price_per_mt_minor || 38500000,
    state: batch.farms?.state || "Oyo",
    lga: batch.farms?.lga || "Ibadan",
    is_active: true,
  };

  const { error: listingErr } = await (supabase.from("marketplace_listings") as any)
    .insert(listingPayload);

  if (listingErr) return;

  await (supabase.from("farm_harvest_batches") as any)
    .update({ status: "listed_marketplace" })
    .eq("id", batchId);

  revalidatePath("/account/harvest");
  revalidatePath("/account/listings");
  revalidatePath("/marketplace");
}

export async function deleteHarvestBatch(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const batchId = String(form.get("batch_id") || "").trim();
  if (!batchId) return;

  await (supabase.from("farm_harvest_batches") as any).delete().eq("id", batchId);
  revalidatePath("/account/harvest");
}
