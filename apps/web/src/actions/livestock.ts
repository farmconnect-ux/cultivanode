"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createLivestockAnimal(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const tagNumber = String(form.get("tag_number") || "").trim();
  const species = String(form.get("species") || "cattle").trim();
  const breed = String(form.get("breed") || "").trim();
  const sex = String(form.get("sex") || "female").trim();
  const birthDate = String(form.get("birth_date") || "").trim() || null;
  const currentWeightKg = parseFloat(String(form.get("current_weight_kg") || "0")) || null;
  const rfidTag = String(form.get("rfid_tag") || "").trim() || null;
  const sireTag = String(form.get("sire_tag") || "").trim() || null;
  const damTag = String(form.get("dam_tag") || "").trim() || null;

  if (!farmId || !tagNumber || !species) return;

  await supabase.from("farm_livestock_animals").insert({
    farm_id: farmId,
    tag_number: tagNumber,
    species,
    breed: breed || null,
    sex,
    birth_date: birthDate,
    current_weight_kg: currentWeightKg,
    last_weighed_date: currentWeightKg ? new Date().toISOString().split("T")[0] : null,
    rfid_tag: rfidTag,
    sire_tag: sireTag,
    dam_tag: damTag,
    status: "active",
  });

  revalidatePath("/account/livestock");
}

export async function logLivestockHealthTreatment(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const animalId = String(form.get("animal_id") || "").trim();
  const treatmentType = String(form.get("treatment_type") || "medication").trim();
  const treatmentName = String(form.get("treatment_name") || "").trim();
  const medicationName = String(form.get("medication_name") || "").trim();
  const dosage = String(form.get("dosage") || "").trim();
  const withdrawalDays = parseInt(String(form.get("withdrawal_days") || "0"), 10);
  const costMinor = parseInt(String(form.get("cost_minor") || "0"), 10);
  const notes = String(form.get("notes") || "").trim();

  if (!animalId || !treatmentName) return;

  const withdrawalEndDate = withdrawalDays > 0
    ? new Date(Date.now() + withdrawalDays * 86400000).toISOString()
    : null;

  await supabase.from("farm_livestock_health_events").insert({
    animal_id: animalId,
    treatment_type: treatmentType,
    treatment_name: treatmentName,
    medication_name: medicationName || null,
    dosage: dosage || null,
    withdrawal_days: withdrawalDays,
    withdrawal_end_date: withdrawalEndDate,
    cost_minor: costMinor,
    notes: notes || null,
  });

  revalidatePath("/account/livestock");
}

export async function logLivestockFeeding(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const groupId = String(form.get("group_id") || "").trim() || null;
  const animalId = String(form.get("animal_id") || "").trim() || null;
  const feedType = String(form.get("feed_type") || "").trim();
  const quantityKg = parseFloat(String(form.get("quantity_kg") || "0"));
  const costMinor = parseInt(String(form.get("cost_minor") || "0"), 10);

  if (!farmId || !feedType || quantityKg <= 0) return;

  await supabase.from("farm_livestock_feedings").insert({
    farm_id: farmId,
    group_id: groupId,
    animal_id: animalId,
    feed_type: feedType,
    quantity_kg: quantityKg,
    cost_minor: costMinor,
    fed_date: new Date().toISOString().split("T")[0],
  });

  revalidatePath("/account/livestock");
}

export async function logLivestockProduction(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const productType = String(form.get("product_type") || "milk").trim();
  const quantity = parseFloat(String(form.get("quantity") || "0"));
  const unit = String(form.get("unit") || "litres").trim();
  const revenueMinor = parseInt(String(form.get("revenue_minor") || "0"), 10);

  if (!farmId || quantity <= 0) return;

  await supabase.from("farm_livestock_production_logs").insert({
    farm_id: farmId,
    product_type: productType,
    quantity,
    unit,
    revenue_minor: revenueMinor,
    log_date: new Date().toISOString().split("T")[0],
  });

  revalidatePath("/account/livestock");
}
