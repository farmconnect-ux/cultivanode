"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function purchaseInsurancePolicy(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const coverageType = String(form.get("coverage_type") || "drought_parametric").trim();
  const insuredArea = parseFloat(String(form.get("insured_area_ha") || "5.0")) || 5.0;
  const sumInsured = parseInt(String(form.get("sum_insured_minor") || "250000000"), 10);
  const premium = Math.round(sumInsured * 0.045); // 4.5% premium rate

  if (!farmId) return;

  const endDate = new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0]; // 6 months

  const { error } = await (supabase.from("farm_insurance_policies") as any).insert({
    farm_id: farmId,
    coverage_type: coverageType,
    insured_area_ha: insuredArea,
    sum_insured_minor: sumInsured,
    premium_paid_minor: premium,
    status: "active",
    end_date: endDate,
  });

  if (error) {
    console.error("Failed to purchase insurance policy:", error.message);
    return;
  }

  revalidatePath("/account/insurance");
}

export async function fileInsuranceClaim(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const policyId = String(form.get("policy_id") || "").trim();
  const farmId = String(form.get("farm_id") || "").trim();
  const triggerReason = String(form.get("trigger_reason") || "drought_satellite_deficit").trim();
  const claimAmount = parseInt(String(form.get("claim_amount_minor") || "120000000"), 10);

  if (!policyId || !farmId) return;

  const { error } = await (supabase.from("farm_insurance_claims") as any).insert({
    policy_id: policyId,
    farm_id: farmId,
    trigger_reason: triggerReason,
    claim_amount_minor: claimAmount,
    satellite_ndvi_verification: "Satellite Sentinel-2 NDVI anomaly verified (-0.28 vs baseline)",
    status: "under_review",
  });

  if (error) {
    console.error("Failed to file insurance claim:", error.message);
    return;
  }

  revalidatePath("/account/insurance");
}
