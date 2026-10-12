"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function submitGrantApplication(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const programme = String(form.get("programme_name") || "National Agricultural Growth Scheme (NAGS-AP)").trim();
  const agency = String(form.get("sponsor_agency") || "Federal Ministry of Agriculture & Food Security").trim();
  const grantType = String(form.get("grant_type") || "subsidized_fertilizer_voucher").trim();
  const requestedValue = parseInt(String(form.get("requested_value_minor") || "18000000"), 10);

  if (!farmId) return;

  const voucherCode = `NAGS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const { error } = await (supabase.from("farm_grant_applications") as any).insert({
    farm_id: farmId,
    programme_name: programme,
    sponsor_agency: agency,
    grant_type: grantType,
    requested_value_minor: requestedValue,
    disbursed_value_minor: requestedValue,
    status: "voucher_issued",
    voucher_code: voucherCode,
    impact_verified: false,
  });

  if (error) {
    console.error("Failed to submit grant application:", error.message);
    return;
  }

  revalidatePath("/account/grants");
}
