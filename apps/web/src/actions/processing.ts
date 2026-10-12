"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function recordProcessingIntake(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const commodity = String(form.get("commodity_intake") || "Cassava Roots").trim();
  const weightKg = parseFloat(String(form.get("intake_weight_kg") || "5000")) || 5000;
  const facility = String(form.get("processing_facility") || "Moniya Flash Dryer & Mill").trim();
  const outputProduct = String(form.get("processed_output_product") || "High Quality Cassava Flour (HQCF)").trim();

  if (!farmId) return;

  const { error } = await (supabase.from("farm_processing_batches") as any).insert({
    farm_id: farmId,
    commodity_intake: commodity,
    intake_weight_kg: weightKg,
    processing_facility: facility,
    processed_output_product: outputProduct,
    output_quantity_kg: Math.round(weightKg * 0.28), // 28% yield ratio for cassava to HQCF
    extraction_efficiency_rate: 28.0,
    quality_lab_test_status: "passed",
    status: "processing",
  });

  if (error) {
    console.error("Failed to record processing intake:", error.message);
    return;
  }

  revalidatePath("/account/processing");
}

export async function recordProcessingOutput(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const batchId = String(form.get("batch_id") || "").trim();
  const outputQty = parseFloat(String(form.get("output_quantity_kg") || "1400")) || 1400;

  if (!batchId) return;

  const { error } = await (supabase.from("farm_processing_batches") as any)
    .update({
      output_quantity_kg: outputQty,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  if (error) {
    console.error("Failed to record processing output:", error.message);
    return;
  }

  revalidatePath("/account/processing");
}
