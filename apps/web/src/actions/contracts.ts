"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createOfftakeContract(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const buyerName = String(form.get("buyer_name") || "").trim();
  const buyerCompany = String(form.get("buyer_company") || buyerName).trim();
  const commodity = String(form.get("commodity") || "").trim();
  const rawQty = String(form.get("contracted_quantity_mt") || "0").replace(",", ".");
  const contractedQtyMt = parseFloat(rawQty);
  const rawPrice = String(form.get("price_per_mt_minor") || "0").replace(",", ".");
  const pricePerMtMinor = parseInt(rawPrice, 10) || 0;
  const deliveryDate = String(form.get("target_delivery_date") || "").trim();
  const deliveryLocation = String(form.get("delivery_location") || "Designated Aggregation Centre").trim();
  const qualitySpecs = String(form.get("quality_specifications") || "").trim();
  const notes = String(form.get("notes") || "").trim();

  if (!farmId || !buyerName || !commodity || contractedQtyMt <= 0 || !deliveryDate) {
    return;
  }

  const contractValueMinor = Math.round(contractedQtyMt * pricePerMtMinor);

  const payload = {
    farm_id: farmId,
    buyer_name: buyerName,
    buyer_company: buyerCompany,
    commodity,
    contracted_quantity_mt: contractedQtyMt,
    price_per_mt_minor: pricePerMtMinor,
    contract_value_minor: contractValueMinor,
    target_delivery_date: deliveryDate,
    delivery_location: deliveryLocation,
    quality_specifications: qualitySpecs || "Moisture < 12.5%, Grade A Standards",
    contract_status: "proposed",
    escrow_custody_bank: "Zenith Bank Tripartite Custody",
    farmer_signed_at: new Date().toISOString(),
    notes: notes || null,
  };

  await (supabase.from("farm_offtake_contracts") as any).insert(payload);

  revalidatePath("/account/contracts");
}

export async function signOfftakeContract(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const contractId = String(form.get("contract_id") || "").trim();
  if (!contractId) return;

  await (supabase.from("farm_offtake_contracts") as any)
    .update({
      contract_status: "active_escrow",
      buyer_signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  revalidatePath("/account/contracts");
}

export async function updateContractStatus(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const contractId = String(form.get("contract_id") || "").trim();
  const status = String(form.get("status") || "delivered").trim();
  if (!contractId) return;

  await (supabase.from("farm_offtake_contracts") as any)
    .update({
      contract_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  revalidatePath("/account/contracts");
}
