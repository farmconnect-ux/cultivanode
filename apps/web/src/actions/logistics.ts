"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createLogisticsWaybill(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim() || null;
  const origin = String(form.get("origin") || "").trim();
  const destination = String(form.get("destination") || "").trim();
  const commodity = String(form.get("commodity") || "").trim();
  const rawQty = String(form.get("quantity_mt") || "0").replace(",", ".");
  const quantityMt = parseFloat(rawQty);
  const carrierCompany = String(form.get("carrier_company") || "CultivaNode Agro-Freight").trim();
  const driverName = String(form.get("driver_name") || "").trim();
  const driverPhone = String(form.get("driver_phone") || "").trim();
  const truckPlate = String(form.get("truck_plate_number") || "").trim();
  const notes = String(form.get("notes") || "").trim();

  if (!origin || !destination || !commodity || quantityMt <= 0 || !driverName) {
    return;
  }

  const { error } = await (supabase.from("farm_logistics_waybills") as any).insert({
    farm_id: farmId,
    origin,
    destination,
    commodity,
    quantity_mt: quantityMt,
    carrier_company: carrierCompany,
    driver_name: driverName,
    driver_phone: driverPhone,
    truck_plate_number: truckPlate || "OYO-458-BD",
    status: "in_transit",
    temperature_celsius: 24.5,
    notes: notes || null,
  });

  if (error) {
    console.error("Failed to create waybill:", error.message);
    return;
  }

  revalidatePath("/account/logistics");
}

export async function updateWaybillStatus(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const waybillId = String(form.get("waybill_id") || "").trim();
  const status = String(form.get("status") || "delivered").trim();
  if (!waybillId) return;

  await (supabase.from("farm_logistics_waybills") as any)
    .update({
      status,
      delivered_at: status === "delivered" ? new Date().toISOString() : null,
    })
    .eq("id", waybillId);

  revalidatePath("/account/logistics");
}
