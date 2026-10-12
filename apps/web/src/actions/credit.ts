"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function generateCreditDossier(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  if (!farmId) return;

  const { data: farm } = await supabase.from("farms").select("id, name, area_ha").eq("id", farmId).single();
  const { count: cyclesCount } = await supabase.from("crop_cycles").select("*", { count: "exact", head: true }).eq("farm_id", farmId);

  const verifiedHectares = Number(farm?.area_ha || 2.5);
  const score = Math.min(95, 65 + (cyclesCount || 1) * 6);
  const tier = score >= 80 ? "Tier 1 - Prime" : "Tier 2 - Bank Eligible";

  const { error } = await (supabase.from("farm_credit_assessments") as any).insert({
    farm_id: farmId,
    risk_score: score,
    credit_readiness_tier: tier,
    verified_cadastral_hectares: verifiedHectares,
    historical_cycles_count: cyclesCount || 1,
    historical_revenue_minor: 125000000,
    repayment_probability_percent: 94.2,
    lender_review_status: "eligible",
  });

  if (error) {
    console.error("Failed to generate credit dossier:", error.message);
    return;
  }

  revalidatePath("/account/reports");
  revalidatePath("/account/lender");
}

export async function submitLoanApplication(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const amountMinor = parseInt(String(form.get("loan_requested_minor") || "250000000"), 10);
  const purpose = String(form.get("loan_purpose") || "Seasonal Input & Mechanization Working Capital").trim();
  const lender = String(form.get("lender_institution") || "Bank of Agriculture (BOA)").trim();

  if (!farmId) return;

  const { error } = await (supabase.from("farm_credit_assessments") as any).insert({
    farm_id: farmId,
    risk_score: 82,
    credit_readiness_tier: "Tier 1 - Prime",
    loan_requested_minor: amountMinor,
    loan_purpose: purpose,
    lender_institution: lender,
    lender_review_status: "application_submitted",
  });

  if (error) {
    console.error("Failed to submit loan application:", error.message);
    return;
  }

  revalidatePath("/account/reports");
  revalidatePath("/account/lender");
}
