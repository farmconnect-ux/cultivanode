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

  const fullWorker = {
    farm_id: farmId,
    full_name: fullName,
    role,
    employment_type: employmentType,
    phone: phone || null,
    daily_rate_minor: dailyRateMinor,
    daily_wage_kobo: dailyRateMinor,
    status: "active",
  };

  let { error } = await supabase.from("farm_workers").insert(fullWorker as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackWorker = {
      farm_id: farmId,
      full_name: fullName,
      role,
      employment_type: employmentType,
      phone: phone || null,
      daily_wage_kobo: dailyRateMinor,
      status: "active",
    };
    const retry = await supabase.from("farm_workers").insert(fallbackWorker as any);
    error = retry.error;
  }

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

  const fullTask = {
    farm_id: farmId,
    plot_id: plotId,
    crop_cycle_id: cycleId,
    assigned_worker_id: assignedWorkerId,
    title,
    description: description || null,
    priority,
    status: "planned", // "planned" satisfies base table constraint ('planned', 'assigned', 'in_progress', 'blocked', 'completed', 'cancelled', 'overdue')
    due_date: dueDate,
    start_date: dueDate,
    direct_cost_minor: directCostMinor,
    direct_cost_kobo: directCostMinor,
  };

  let { error } = await supabase.from("farm_operational_tasks").insert(fullTask as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackTask = {
      farm_id: farmId,
      plot_id: plotId,
      crop_cycle_id: cycleId,
      assigned_worker_id: assignedWorkerId,
      title,
      description: description || null,
      priority,
      status: "planned",
      due_date: dueDate,
      start_date: dueDate,
      direct_cost_kobo: directCostMinor,
    };
    const retry = await supabase.from("farm_operational_tasks").insert(fallbackTask as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/tasks");
}

export async function updateTaskStatus(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const taskId = String(form.get("task_id") || "").trim();
  const rawStatus = String(form.get("status") || "completed").trim().toLowerCase();
  const validStatuses = ["planned", "todo", "in_progress", "completed", "cancelled"];
  const status = validStatuses.includes(rawStatus) ? rawStatus : "completed";
  const dbStatus = status === "todo" ? "planned" : status;

  if (!taskId) return;

  const { error } = await supabase
    .from("farm_operational_tasks")
    .update({
      status: dbStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  revalidatePath("/account/tasks");
}

export async function recordWorkerAttendance(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const workerId = String(form.get("worker_id") || "").trim();
  let farmId = String(form.get("farm_id") || "").trim();
  const workDate = String(form.get("work_date") || new Date().toISOString().split("T")[0]).trim();
  const rawStatus = String(form.get("status") || "present").trim().toLowerCase();
  const validStatuses = ["present", "late", "half_day", "absent", "on_leave"];
  const status = validStatuses.includes(rawStatus) ? rawStatus : "present";
  const hoursWorked = parseFloat(String(form.get("hours_worked") || "8")) || 8;
  const laborCostMinor = parseInt(String(form.get("labor_cost_minor") || form.get("daily_pay_kobo") || "0"), 10) || 0;
  const notes = String(form.get("notes") || "").trim();

  if (!workerId) return;

  if (!farmId) {
    const { data: w } = await supabase.from("farm_workers").select("farm_id").eq("id", workerId).maybeSingle();
    farmId = w?.farm_id || "";
  }

  const fullAttendance: Record<string, any> = {
    worker_id: workerId,
    clock_in_at: new Date(`${workDate}T08:00:00Z`).toISOString(),
    hours_worked: hoursWorked,
    status,
    work_date: workDate,
    daily_pay_kobo: laborCostMinor,
    labor_cost_minor: laborCostMinor,
    notes: notes || null,
  };
  if (farmId) fullAttendance.farm_id = farmId;

  let { error } = await supabase.from("farm_attendance_records").insert(fullAttendance as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackAttendance: Record<string, any> = {
      worker_id: workerId,
      clock_in_at: new Date(`${workDate}T08:00:00Z`).toISOString(),
      hours_worked: hoursWorked,
      status,
      daily_pay_kobo: laborCostMinor,
      notes: notes || null,
    };
    if (farmId) fallbackAttendance.farm_id = farmId;
    const retry = await supabase.from("farm_attendance_records").insert(fallbackAttendance as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/tasks");
}
