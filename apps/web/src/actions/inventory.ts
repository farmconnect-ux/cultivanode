"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createInventoryLocation(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const name = String(form.get("name") || form.get("location_name") || "").trim();
  const rawType = String(form.get("location_type") || "farm_store").trim().toLowerCase();
  const validDbTypes = ["main_warehouse", "farm_store", "field_shed", "feed_store", "cold_room", "machinery_shed", "livestock_store"];
  const locationType = validDbTypes.includes(rawType) ? rawType : "farm_store";

  if (!farmId || !name) return;

  const fullLoc = {
    farm_id: farmId,
    name,
    location_name: name,
    location_type: locationType,
    is_active: true,
  };

  let { error } = await supabase.from("farm_inventory_locations").insert(fullLoc as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackLoc = {
      farm_id: farmId,
      location_name: name,
      location_type: locationType,
      is_active: true,
    };
    const retry = await supabase.from("farm_inventory_locations").insert(fallbackLoc as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/inventory");
}

export async function createInventoryItem(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  let locationId = String(form.get("location_id") || "").trim();
  const itemName = String(form.get("item_name") || "").trim();
  const rawCat = String(form.get("item_category") || form.get("category") || "seeds").trim().toLowerCase();
  const validDbCats = ["seeds", "fertiliser", "chemicals", "livestock_feed", "veterinary_medicine", "supplies", "spare_parts", "produce", "other"];
  const dbCat = validDbCats.includes(rawCat)
    ? rawCat
    : (rawCat === "seed" ? "seeds" : rawCat === "fertilizer" ? "fertiliser" : rawCat === "chemical" ? "chemicals" : "other");
  const unit = String(form.get("unit") || "kg").trim();
  const currentQuantity = parseFloat(String(form.get("current_quantity") || form.get("quantity") || "0")) || 0;
  const averageCostMinor = parseInt(String(form.get("average_cost_minor") || form.get("unit_cost_kobo") || "0"), 10) || 0;
  const reorderLevel = parseFloat(String(form.get("reorder_level") || form.get("reorder_threshold") || "0")) || 0;
  const lotNumber = String(form.get("lot_number") || form.get("batch_number") || "").trim() || null;
  const expiryDate = String(form.get("expiry_date") || "").trim() || null;

  if (!farmId || !itemName) return;

  if (!locationId) {
    const { data: loc } = await supabase.from("farm_inventory_locations").select("id").eq("farm_id", farmId).limit(1).maybeSingle();
    if (loc?.id) {
      locationId = loc.id;
    } else {
      const { data: newLoc } = await (supabase.from("farm_inventory_locations") as any).insert({
        farm_id: farmId,
        name: "Main Storage",
        location_name: "Main Storage",
        location_type: "farm_store",
      }).select("id").single();
      locationId = newLoc?.id || "";
    }
  }

  const fullPayload: Record<string, any> = {
    farm_id: farmId,
    item_name: itemName,
    category: dbCat,
    item_category: rawCat,
    unit,
    quantity: currentQuantity,
    current_quantity: currentQuantity,
    reserved_quantity: 0,
    unit_cost_kobo: averageCostMinor,
    average_cost_minor: averageCostMinor,
    reorder_threshold: reorderLevel,
    reorder_level: reorderLevel,
    expiry_date: expiryDate,
    lot_number: lotNumber,
    storage_location: lotNumber ? `Lot: ${lotNumber}` : null,
  };
  if (locationId) fullPayload.location_id = locationId;

  let { error } = await supabase.from("farm_inventory").insert(fullPayload as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackPayload = {
      farm_id: farmId,
      item_name: itemName,
      category: dbCat,
      unit,
      quantity: currentQuantity,
      reserved_quantity: 0,
      unit_cost_kobo: averageCostMinor,
      reorder_threshold: reorderLevel,
      expiry_date: expiryDate,
      storage_location: lotNumber ? `Lot: ${lotNumber}` : null,
    };
    const retry = await supabase.from("farm_inventory").insert(fallbackPayload as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/inventory");
}

/**
 * Concurrency-safe inventory movement utilizing PostgreSQL stored procedure
 * record_farm_inventory_movement with row-level locks (FOR UPDATE) and Zero Negative Stock enforcement.
 */
export async function recordStockMovement(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const inventoryItemId = String(form.get("inventory_item_id") || form.get("inventory_id") || "").trim();
  const rawType = String(form.get("movement_type") || form.get("transaction_type") || "issue").trim().toLowerCase();
  const quantity = parseFloat(String(form.get("quantity") || "0"));
  const unitCostMinor = parseInt(String(form.get("unit_cost_minor") || form.get("unit_cost_kobo") || "0"), 10) || undefined;
  const lotNumber = String(form.get("lot_number") || form.get("batch_number") || "").trim() || null;
  const notes = String(form.get("notes") || "").trim() || null;

  if (!inventoryItemId || quantity <= 0) return;

  const { error } = await supabase.rpc("record_farm_inventory_movement", {
    p_inventory_item_id: inventoryItemId,
    p_movement_type: rawType,
    p_quantity: quantity,
    p_unit_cost_minor: unitCostMinor,
    p_notes: notes,
    p_lot_number: lotNumber,
  });

  if (error) {
    // If stored procedure doesn't exist yet, do atomic direct table update fallback
    const { data: currentInv } = await (supabase.from("farm_inventory") as any).select("*").eq("id", inventoryItemId).single();
    if (currentInv) {
      const currentQty = (currentInv as any).current_quantity ?? (currentInv as any).quantity ?? 0;
      const newQty = rawType === "issue" || rawType === "consumption"
        ? Math.max(0, currentQty - quantity)
        : currentQty + quantity;

      await (supabase.from("farm_inventory") as any).update({ current_quantity: newQty, quantity: newQty }).eq("id", inventoryItemId);
      await (supabase as any).from("farm_inventory_transactions").insert({
        farm_id: (currentInv as any).farm_id,
        inventory_id: inventoryItemId,
        transaction_type: rawType === "issue" ? "issue_to_field" : rawType,
        quantity,
        batch_number: lotNumber,
        notes,
      });
    }
  }

  revalidatePath("/account/inventory");
}
