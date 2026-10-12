"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function registerCooperativeMember(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const cooperativeName = String(form.get("cooperative_name") || "Oyo Agro-Producers Cooperative").trim();
  const memberName = String(form.get("member_name") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const nin = String(form.get("nin") || "").trim();
  const farmSize = parseFloat(String(form.get("farm_size_hectares") || "1.0")) || 1.0;
  const shares = parseInt(String(form.get("shares_count") || "1"), 10) || 1;

  if (!memberName || !phone) {
    return;
  }

  await (supabase.from("farm_cooperative_members") as any).insert({
    cooperative_name: cooperativeName,
    member_name: memberName,
    phone,
    nin: nin || null,
    farm_size_hectares: farmSize,
    shares_count: shares,
    dues_status: "current",
    voting_eligibility: true,
  });

  revalidatePath("/account/cooperative");
}

export async function createCooperativeBulkOrder(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const cooperativeName = String(form.get("cooperative_name") || "Oyo Agro-Producers Cooperative").trim();
  const title = String(form.get("title") || "").trim();
  const orderType = String(form.get("order_type") || "bulk_inputs").trim();
  const targetQuantity = String(form.get("target_quantity") || "").trim();
  const targetClosingDate = String(form.get("target_closing_date") || "").trim() || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  const discount = parseFloat(String(form.get("estimated_discount_percentage") || "15")) || 15;

  if (!title || !targetQuantity) {
    return;
  }

  await (supabase.from("farm_cooperative_orders") as any).insert({
    cooperative_name: cooperativeName,
    order_type: orderType,
    title,
    target_quantity: targetQuantity,
    target_closing_date: targetClosingDate,
    estimated_discount_percentage: discount,
    status: "open",
    participating_members_count: 1,
  });

  revalidatePath("/account/cooperative");
}
