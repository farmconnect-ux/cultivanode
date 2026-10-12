"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function getFarmOperations(farmIds: string[]) {
  const { supabase } = await getAuth();
  if (!farmIds.length) return [];

  const { data, error } = await supabase
    .from("farm_operations")
    .select(`
      id,
      farm_id,
      plot_id,
      crop_cycle_id,
      name,
      subtext,
      crop_area,
      timeline,
      timing_note,
      resource,
      resource_icon,
      location,
      status,
      action_label,
      scheduled_at,
      started_at,
      completed_at,
      notes,
      created_at,
      updated_at
    `)
    .in("farm_id", farmIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createFarmOperation(form: FormData): Promise<void> {
  const { supabase, user } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const plotId = String(form.get("plot_id") || "").trim() || null;
  const cropCycleId = String(form.get("crop_cycle_id") || "").trim() || null;
  const name = String(form.get("name") || "").trim();
  const subtext = String(form.get("subtext") || "").trim() || null;
  const cropArea = String(form.get("crop_area") || "").trim() || null;
  const timeline = String(form.get("timeline") || "").trim() || null;
  const timingNote = String(form.get("timing_note") || "").trim() || null;
  const resource = String(form.get("resource") || "").trim() || null;
  const resourceIcon = String(form.get("resource_icon") || "").trim() || null;
  const location = String(form.get("location") || "").trim() || null;
  const status = String(form.get("status") || "planned").trim() as "planned" | "ready_to_execute" | "in_progress" | "weather_hold" | "completed" | "cancelled";
  const actionLabel = String(form.get("action_label") || "").trim() || null;
  const scheduledAt = String(form.get("scheduled_at") || "").trim() || null;
  const notes = String(form.get("notes") || "").trim() || null;

  if (!farmId || !name) return;

  const { error } = await supabase.from("farm_operations").insert({
    farm_id: farmId,
    plot_id: plotId,
    crop_cycle_id: cropCycleId,
    name,
    subtext,
    crop_area: cropArea,
    timeline,
    timing_note: timingNote,
    resource,
    resource_icon: resourceIcon,
    location,
    status,
    action_label: actionLabel,
    scheduled_at: scheduledAt,
    notes,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/account");
}

export async function updateFarmOperation(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const id = String(form.get("id") || "").trim();
  const name = String(form.get("name") || "").trim();
  const subtext = String(form.get("subtext") || "").trim() || null;
  const cropArea = String(form.get("crop_area") || "").trim() || null;
  const timeline = String(form.get("timeline") || "").trim() || null;
  const timingNote = String(form.get("timing_note") || "").trim() || null;
  const resource = String(form.get("resource") || "").trim() || null;
  const resourceIcon = String(form.get("resource_icon") || "").trim() || null;
  const location = String(form.get("location") || "").trim() || null;
  const status = String(form.get("status") || "").trim() as "planned" | "ready_to_execute" | "in_progress" | "weather_hold" | "completed" | "cancelled" | "";
  const actionLabel = String(form.get("action_label") || "").trim() || null;
  const scheduledAt = String(form.get("scheduled_at") || "").trim() || null;
  const notes = String(form.get("notes") || "").trim() || null;

  if (!id) return;

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (name) updateData.name = name;
  if (subtext !== null) updateData.subtext = subtext;
  if (cropArea !== null) updateData.crop_area = cropArea;
  if (timeline !== null) updateData.timeline = timeline;
  if (timingNote !== null) updateData.timing_note = timingNote;
  if (resource !== null) updateData.resource = resource;
  if (resourceIcon !== null) updateData.resource_icon = resourceIcon;
  if (location !== null) updateData.location = location;
  if (status) updateData.status = status;
  if (actionLabel !== null) updateData.action_label = actionLabel;
  if (scheduledAt !== null) updateData.scheduled_at = scheduledAt;
  if (notes !== null) updateData.notes = notes;

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  } else if (status === "in_progress" && !updateData.started_at) {
    updateData.started_at = new Date().toISOString();
  }

  const { error } = await supabase.from("farm_operations").update(updateData).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/account");
}

export async function logOperationCompletion(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const id = String(form.get("id") || "").trim();
  if (!id) return;

  const { error } = await supabase
    .from("farm_operations")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      action_label: "Completed ✓",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/account");
}

export async function overrideWeatherHold(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const id = String(form.get("id") || "").trim();
  if (!id) return;

  const { error } = await supabase
    .from("farm_operations")
    .update({
      status: "in_progress",
      timeline: "Ready for Execution",
      action_label: "Log Completion",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/account");
}

export async function deleteFarmOperation(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const id = String(form.get("id") || "").trim();
  if (!id) return;

  const { error } = await supabase.from("farm_operations").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/account");
}