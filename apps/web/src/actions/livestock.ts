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
  const groupId = String(form.get("group_id") || "").trim() || null;
  const tagNumber = String(form.get("tag_number") || "").trim();
  const species = String(form.get("species") || "cattle").trim();
  const breed = String(form.get("breed") || "").trim();
  const sex = String(form.get("sex") || "female").trim().toLowerCase();
  const dbSex = ["male", "female", "castrated"].includes(sex) ? sex : "female";
  const birthDate = String(form.get("birth_date") || "").trim() || null;
  const currentWeightKg = parseFloat(String(form.get("current_weight_kg") || "0")) || null;
  const rfidTag = String(form.get("rfid_tag") || "").trim() || null;
  const sireTag = String(form.get("sire_tag") || "").trim() || null;
  const damTag = String(form.get("dam_tag") || "").trim() || null;

  if (!farmId || !tagNumber || !species) return;

  const fullAnimal = {
    farm_id: farmId,
    group_id: groupId,
    tag_number: tagNumber,
    species,
    breed: breed || null,
    sex: dbSex,
    birth_date: birthDate,
    current_weight_kg: currentWeightKg,
    last_weighed_date: currentWeightKg ? new Date().toISOString().split("T")[0] : null,
    rfid_tag: rfidTag,
    rfid_code: rfidTag,
    sire_tag: sireTag,
    dam_tag: damTag,
    status: "active",
    health_status: "healthy",
  };

  let { error } = await supabase.from("farm_livestock_animals").insert(fullAnimal as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackAnimal = {
      farm_id: farmId,
      group_id: groupId,
      tag_number: tagNumber,
      species,
      breed: breed || null,
      sex: dbSex,
      birth_date: birthDate,
      current_weight_kg: currentWeightKg,
      rfid_code: rfidTag,
      sire_tag: sireTag,
      dam_tag: damTag,
      health_status: "healthy",
    };
    const retry = await supabase.from("farm_livestock_animals").insert(fallbackAnimal as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/livestock");
}

export async function logLivestockHealthTreatment(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const animalId = String(form.get("animal_id") || "").trim() || null;
  const groupId = String(form.get("group_id") || "").trim() || null;
  let farmId = String(form.get("farm_id") || "").trim();
  const treatmentType = String(form.get("treatment_type") || "routine_check").trim();
  const validEventTypes = ["vaccination", "treatment", "disease_diagnosis", "vet_visit", "routine_check"];
  const dbEventType = validEventTypes.includes(treatmentType) ? treatmentType : "routine_check";
  const treatmentName = String(form.get("treatment_name") || "General Care").trim();
  const medicationName = String(form.get("medication_name") || "").trim();
  const dosage = String(form.get("dosage") || "").trim();
  const withdrawalDays = parseInt(String(form.get("withdrawal_days") || "0"), 10) || 0;
  const costMinor = parseInt(String(form.get("cost_minor") || "0"), 10) || 0;
  const notes = String(form.get("notes") || "").trim();

  if (!treatmentName) return;

  if (!farmId && animalId) {
    const { data: a } = await (supabase.from("farm_livestock_animals") as any).select("farm_id").eq("id", animalId).maybeSingle();
    farmId = a?.farm_id || "";
  }
  if (!farmId && groupId) {
    const { data: g } = await (supabase as any).from("farm_livestock_groups").select("farm_id").eq("id", groupId).maybeSingle();
    farmId = g?.farm_id || "";
  }
  if (!farmId) return;

  const withdrawalEndDate = withdrawalDays > 0
    ? new Date(Date.now() + withdrawalDays * 86400000).toISOString().split("T")[0]
    : null;

  const fullHealth: Record<string, any> = {
    farm_id: farmId,
    animal_id: animalId,
    group_id: groupId,
    treatment_type: treatmentType,
    event_type: dbEventType,
    treatment_name: treatmentName,
    disease_or_condition: treatmentName,
    medication_name: medicationName || null,
    dosage: dosage || null,
    withdrawal_days: withdrawalDays,
    withdrawal_period_days: withdrawalDays,
    withdrawal_end_date: withdrawalEndDate,
    cost_minor: costMinor,
    cost_kobo: costMinor,
    notes: notes || null,
    administered_on: new Date().toISOString().split("T")[0],
    administered_at: new Date().toISOString(),
  };

  let { error } = await supabase.from("farm_livestock_health_events").insert(fullHealth as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackHealth = {
      farm_id: farmId,
      animal_id: animalId,
      group_id: groupId,
      event_type: dbEventType,
      disease_or_condition: treatmentName,
      medication_name: medicationName || null,
      dosage: dosage || null,
      withdrawal_period_days: withdrawalDays,
      withdrawal_end_date: withdrawalEndDate,
      cost_kobo: costMinor,
      notes: notes || null,
      administered_on: new Date().toISOString().split("T")[0],
    };
    const retry = await supabase.from("farm_livestock_health_events").insert(fallbackHealth as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/livestock");
}

export async function logLivestockFeeding(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  let farmId = String(form.get("farm_id") || "").trim();
  const groupId = String(form.get("group_id") || "").trim() || null;
  const animalId = String(form.get("animal_id") || "").trim() || null;
  const feedType = String(form.get("feed_type") || "").trim();
  const quantityKg = parseFloat(String(form.get("quantity_kg") || "0"));
  const costMinor = parseInt(String(form.get("cost_minor") || "0"), 10) || 0;

  if (!feedType || quantityKg <= 0) return;

  if (!farmId && groupId) {
    const { data: g } = await (supabase as any).from("farm_livestock_groups").select("farm_id").eq("id", groupId).maybeSingle();
    farmId = g?.farm_id || "";
  }
  if (!farmId && animalId) {
    const { data: a } = await (supabase.from("farm_livestock_animals") as any).select("farm_id").eq("id", animalId).maybeSingle();
    farmId = a?.farm_id || "";
  }
  if (!farmId) return;

  const fullFeeding: Record<string, any> = {
    farm_id: farmId,
    group_id: groupId,
    animal_id: animalId,
    feed_type: feedType,
    quantity_kg: quantityKg,
    cost_minor: costMinor,
    cost_kobo: costMinor,
    feeding_date: new Date().toISOString().split("T")[0],
  };

  let { error } = await supabase.from("farm_livestock_feedings").insert(fullFeeding as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackFeeding = {
      farm_id: farmId,
      group_id: groupId,
      feed_type: feedType,
      quantity_kg: quantityKg,
      cost_kobo: costMinor,
      feeding_date: new Date().toISOString().split("T")[0],
      notes: animalId ? `Animal: ${animalId}` : null,
    };
    const retry = await supabase.from("farm_livestock_feedings").insert(fallbackFeeding as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/livestock");
}
