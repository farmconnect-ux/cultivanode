"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createFarmWorker(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const fullName = String(form.get("full_name") || "").trim();
  const role = String(form.get("role") || "field_worker").trim();
  const employmentType = String(form.get("employment_type") || "casual").trim();
  const phone = String(form.get("phone") || "").trim();
  const dailyRateMinor = parseInt(String(form.get("daily_rate_minor") || "0"), 10);

  if (!farmId || !fullName) return;

  await supabase.from("farm_workers").insert({
    farm_id: farmId,
    full_name: fullName,
    role,
    employment_type: employmentType,
    phone: phone || null,
    daily_rate_minor: dailyRateMinor,
    status: "active",
  });

  revalidatePath("/account/tasks");
}

export async function createFarmTask(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const plotId = String(form.get("plot_id") || "").trim() || null;
  const cycleId = String(form.get("crop_cycle_id") || "").trim() || null;
  const assignedWorkerId = String(form.get("assigned_worker_id") || "").trim() || null;
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const priority = String(form.get("priority") || "medium").trim();
  const dueDate = String(form.get("due_date") || "").trim() || null;
  const directCostMinor = parseInt(String(form.get("direct_cost_minor") || "0"), 10);

  if (!farmId || !title) return;

  await supabase.from("farm_operational_tasks").insert({
    farm_id: farmId,
    plot_id: plotId,
    crop_cycle_id: cycleId,
    assigned_worker_id: assignedWorkerId,
    title,
    description: description || null,
    priority,
    due_date: dueDate,
    direct_cost_minor: directCostMinor,
    status: "todo",
  });

  revalidatePath("/account/tasks");
}

export async function updateTaskStatus(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const taskId = String(form.get("task_id") || "").trim();
  const status = String(form.get("status") || "completed").trim();

  await supabase
    .from("farm_operational_tasks")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  revalidatePath("/account/tasks");
}

export async function recordWorkerAttendance(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const workerId = String(form.get("worker_id") || "").trim();
  const status = String(form.get("status") || "present").trim();
  const hoursWorked = parseFloat(String(form.get("hours_worked") || "8"));
  const laborCostMinor = parseInt(String(form.get("labor_cost_minor") || "0"), 10);
  const notes = String(form.get("notes") || "").trim();

  if (!workerId) return;

  await supabase.from("farm_attendance_records").insert({
    worker_id: workerId,
    work_date: new Date().toISOString().split("T")[0],
    status,
    hours_worked: hoursWorked,
    labor_cost_minor: laborCostMinor,
    notes: notes || null,
  });

  revalidatePath("/account/tasks");
}
