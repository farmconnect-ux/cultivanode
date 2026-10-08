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
  const name = String(form.get("name") || "").trim();
  const locationType = String(form.get("location_type") || "warehouse").trim();

  if (!farmId || !name) return;

  await supabase.from("farm_inventory_locations").insert({
    farm_id: farmId,
    name,
    location_type: locationType,
  });

  revalidatePath("/account/inventory");
}

export async function createInventoryItem(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const locationId = String(form.get("location_id") || "").trim();
  const itemCategory = String(form.get("item_category") || "seed").trim();
  const itemName = String(form.get("item_name") || "").trim();
  const sku = String(form.get("sku") || "").trim();
  const unit = String(form.get("unit") || "kg").trim();
  const initialQuantity = parseFloat(String(form.get("initial_quantity") || "0")) || 0;
  const unitCostMinor = parseInt(String(form.get("unit_cost_minor") || "0"), 10);
  const reorderLevel = parseFloat(String(form.get("reorder_level") || "0")) || 0;
  const lotNumber = String(form.get("lot_number") || "").trim();
  const expiryDate = String(form.get("expiry_date") || "").trim() || null;

  if (!farmId || !locationId || !itemName) return;

  await supabase.from("farm_inventory").insert({
    farm_id: farmId,
    location_id: locationId,
    item_category: itemCategory,
    item_name: itemName,
    sku: sku || null,
    unit,
    current_quantity: initialQuantity,
    average_cost_minor: unitCostMinor,
    reorder_level: reorderLevel,
    lot_number: lotNumber || null,
    expiry_date: expiryDate,
  });

  revalidatePath("/account/inventory");
}

/**
 * Concurrency-safe inventory movement utilizing PostgreSQL stored procedure
 * with row-level locks (FOR UPDATE) and Zero Negative Stock enforcement.
 */
export async function recordStockMovement(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const itemId = String(form.get("inventory_item_id") || "").trim();
  const movementType = String(form.get("movement_type") || "usage_out").trim();
  const quantity = parseFloat(String(form.get("quantity") || "0"));
  const unitCostMinor = parseInt(String(form.get("unit_cost_minor") || "0"), 10);
  const notes = String(form.get("notes") || "").trim();
  const lotNumber = String(form.get("lot_number") || "").trim();

  if (!itemId || quantity <= 0) return;

  await supabase.rpc("record_farm_inventory_movement", {
    p_inventory_item_id: itemId,
    p_movement_type: movementType,
    p_quantity: quantity,
    p_unit_cost_minor: unitCostMinor,
    p_reference_type: "manual_movement",
    p_reference_id: null,
    p_notes: notes || null,
    p_lot_number: lotNumber || null,
  });

  revalidatePath("/account/inventory");
}
