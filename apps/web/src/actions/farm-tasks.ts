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
  const rawRole = String(form.get("role") || "labourer").trim().toLowerCase();
  const validRoles = ["farm_manager", "agronomist", "operator", "storekeeper", "labourer", "vet_assistant", "other"];
  const role = validRoles.includes(rawRole) ? rawRole : "labourer";
  const rawEmp = String(form.get("employment_type") || "permanent").trim().toLowerCase();
  const validEmp = ["permanent", "casual", "seasonal", "contractor"];
  const employmentType = validEmp.includes(rawEmp) ? rawEmp : "permanent";
  const phone = String(form.get("phone") || "").trim();
  const dailyRateMinor = parseInt(String(form.get("daily_rate_minor") || form.get("daily_wage_kobo") || "0"), 10) || 0;

  if (!farmId || !fullName) return;

  const { error } = await supabase.from("farm_workers").insert({
    farm_id: farmId,
    full_name: fullName,
    role,
    employment_type: employmentType,
    phone: phone || null,
    daily_rate_minor: dailyRateMinor,
    status: "active",
  });

  if (error) throw new Error(error.message);

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
  const rawPriority = String(form.get("priority") || "medium").trim().toLowerCase();
  const priority = ["low", "medium", "high", "urgent"].includes(rawPriority) ? rawPriority : "medium";
  const dueDate = String(form.get("due_date") || form.get("start_date") || new Date().toISOString().split("T")[0]).trim();
  const directCostMinor = parseInt(String(form.get("direct_cost_minor") || form.get("direct_cost_kobo") || "0"), 10) || 0;

  if (!farmId || !title) return;

  const { error } = await supabase.from("farm_operational_tasks").insert({
    farm_id: farmId,
    plot_id: plotId,
    crop_cycle_id: cycleId,
    assigned_worker_id: assignedWorkerId,
    title,
    description: description || null,
    priority,
    status: "todo",
    due_date: dueDate,
    direct_cost_minor: directCostMinor,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/account/tasks");
}

export async function updateTaskStatus(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const taskId = String(form.get("task_id") || "").trim();
  const rawStatus = String(form.get("status") || "completed").trim().toLowerCase();
  const validStatuses = ["todo", "in_progress", "completed", "cancelled"];
  const status = validStatuses.includes(rawStatus) ? rawStatus : "completed";

  if (!taskId) return;

  const { error } = await supabase
    .from("farm_operational_tasks")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  revalidatePath("/account/tasks");
}

export async function recordWorkerAttendance(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const workerId = String(form.get("worker_id") || "").trim();
  const workDate = String(form.get("work_date") || new Date().toISOString().split("T")[0]).trim();
  const rawStatus = String(form.get("status") || "present").trim().toLowerCase();
  const validStatuses = ["present", "late", "half_day", "absent", "on_leave"];
  const status = validStatuses.includes(rawStatus) ? rawStatus : "present";
  const hoursWorked = parseFloat(String(form.get("hours_worked") || "8")) || 8;
  const laborCostMinor = parseInt(String(form.get("labor_cost_minor") || form.get("daily_pay_kobo") || "0"), 10) || 0;
  const notes = String(form.get("notes") || "").trim();

  if (!workerId) return;

  const { error } = await supabase.from("farm_attendance_records").insert({
    worker_id: workerId,
    work_date: workDate,
    status,
    hours_worked: hoursWorked,
    labor_cost_minor: laborCostMinor,
    notes: notes || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/account/tasks");
}
