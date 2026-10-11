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
  const validTypes = ["warehouse", "cold_room", "silo", "farm_store", "processing_unit", "field_shed", "other"];
  const locationType = validTypes.includes(rawType) ? rawType : "farm_store";

  if (!farmId || !name) return;

  const { error } = await supabase.from("farm_inventory_locations").insert({
    farm_id: farmId,
    name,
    location_type: locationType,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/account/inventory");
}

export async function createInventoryItem(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  let locationId = String(form.get("location_id") || "").trim();
  const itemName = String(form.get("item_name") || "").trim();
  const rawCat = String(form.get("item_category") || form.get("category") || "seeds").trim().toLowerCase();
  const validCats = ["seed", "fertilizer", "chemical", "feed", "produce", "tool", "spare_part", "packaging", "other"];
  const itemCategory = validCats.includes(rawCat) ? rawCat : "seed";
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
      const { data: newLoc } = await supabase.from("farm_inventory_locations").insert({
        farm_id: farmId,
        name: "Main Storage",
        location_type: "farm_store",
      }).select("id").single();
      locationId = newLoc?.id || "";
    }
  }

  if (!locationId) return;

  const { error } = await supabase.from("farm_inventory").insert({
    farm_id: farmId,
    location_id: locationId,
    item_category: itemCategory,
    item_name: itemName,
    unit,
    current_quantity: currentQuantity,
    reserved_quantity: 0,
    average_cost_minor: averageCostMinor,
    reorder_level: reorderLevel,
    lot_number: lotNumber,
    expiry_date: expiryDate,
  });

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

  if (error) throw new Error(error.message);

  revalidatePath("/account/inventory");
}
