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
  try {
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
    const dailyRateMinor = Math.max(0, parseInt(String(form.get("daily_rate_minor") || form.get("daily_wage_kobo") || "0"), 10) || 0);

    if (!farmId || !fullName) return;

    const baseWorker: Record<string, any> = {
      farm_id: farmId,
      full_name: fullName,
      role,
      employment_type: employmentType,
      phone: phone || null,
      status: "active",
    };

    // Attempt 1: Insert with both daily_rate_minor and daily_wage_kobo
    let { error } = await supabase.from("farm_workers").insert({
      ...baseWorker,
      daily_rate_minor: dailyRateMinor,
      daily_wage_kobo: dailyRateMinor,
    } as any);

    // Attempt 2: If column error, retry with only daily_wage_kobo
    if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
      const retry2 = await supabase.from("farm_workers").insert({
        ...baseWorker,
        daily_wage_kobo: dailyRateMinor,
      } as any);
      error = retry2.error;
    }

    // Attempt 3: If column error, retry with only daily_rate_minor
    if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
      const retry3 = await supabase.from("farm_workers").insert({
        ...baseWorker,
        daily_rate_minor: dailyRateMinor,
      } as any);
      error = retry3.error;
    }

    // Attempt 4: If still column error, retry minimal without rate column
    if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
      const retry4 = await supabase.from("farm_workers").insert(baseWorker as any);
      error = retry4.error;
    }

    if (error) {
      console.error("createFarmWorker error:", error.message);
    }
  } catch (err: any) {
    console.error("createFarmWorker exception:", err.message);
  }

  revalidatePath("/account/tasks");
}

export async function createFarmTask(form: FormData): Promise<void> {
  try {
    const { supabase } = await getAuth();
    const farmId = String(form.get("farm_id") || "").trim();
    const plotId = String(form.get("plot_id") || "").trim() || null;
    const cycleId = String(form.get("crop_cycle_id") || "").trim() || null;
    
    // Multi-worker assignment support
    const assignedWorkerIds = form.getAll("assigned_worker_ids").map(String).filter(Boolean);
    const singleWorkerId = String(form.get("assigned_worker_id") || "").trim();
    const allWorkerIds = Array.from(new Set([...assignedWorkerIds, ...(singleWorkerId ? [singleWorkerId] : [])]));
    const primaryWorkerId = allWorkerIds[0] || null;

    const title = String(form.get("title") || "").trim();
    let description = String(form.get("description") || "").trim();
    const rawPriority = String(form.get("priority") || "medium").trim().toLowerCase();
    const priority = ["low", "medium", "high", "urgent"].includes(rawPriority) ? rawPriority : "medium";
    const dueDate = String(form.get("due_date") || form.get("start_date") || new Date().toISOString().split("T")[0]).trim();
    const directCostMinor = Math.max(0, parseInt(String(form.get("direct_cost_minor") || form.get("direct_cost_kobo") || "0"), 10) || 0);

    if (!farmId || !title) return;

    // Embed all assigned worker IDs into description metadata if multiple workers are assigned
    if (allWorkerIds.length > 0) {
      const workerTag = `[assigned_workers: ${allWorkerIds.join(",")}]`;
      if (!description.includes("[assigned_workers:")) {
        description = description ? `${description} ${workerTag}` : workerTag;
      }
    }

    const baseTask: Record<string, any> = {
      farm_id: farmId,
      plot_id: plotId,
      crop_cycle_id: cycleId,
      assigned_worker_id: primaryWorkerId,
      title,
      description: description || null,
      priority,
      status: "planned",
      due_date: dueDate,
      start_date: dueDate,
    };

    // Attempt 1: with direct_cost_minor and direct_cost_kobo
    let { error } = await supabase.from("farm_operational_tasks").insert({
      ...baseTask,
      direct_cost_minor: directCostMinor,
      direct_cost_kobo: directCostMinor,
    } as any);

    // Attempt 2: retry with direct_cost_kobo only
    if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
      const retry2 = await supabase.from("farm_operational_tasks").insert({
        ...baseTask,
        direct_cost_kobo: directCostMinor,
      } as any);
      error = retry2.error;
    }

    // Attempt 3: retry with direct_cost_minor only
    if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
      const retry3 = await supabase.from("farm_operational_tasks").insert({
        ...baseTask,
        direct_cost_minor: directCostMinor,
      } as any);
      error = retry3.error;
    }

    // Attempt 4: minimal without cost column
    if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
      const retry4 = await supabase.from("farm_operational_tasks").insert(baseTask as any);
      error = retry4.error;
    }

    if (error) {
      console.error("createFarmTask error:", error.message);
    }
  } catch (err: any) {
    console.error("createFarmTask exception:", err.message);
  }

  revalidatePath("/account/tasks");
}

export async function assignWorkersToTask(form: FormData): Promise<void> {
  try {
    const { supabase } = await getAuth();
    const taskId = String(form.get("task_id") || "").trim();
    const assignedWorkerIds = form.getAll("assigned_worker_ids").map(String).filter(Boolean);
    const singleWorkerId = String(form.get("assigned_worker_id") || "").trim();
    const allWorkerIds = Array.from(new Set([...assignedWorkerIds, ...(singleWorkerId ? [singleWorkerId] : [])]));
    const primaryWorkerId = allWorkerIds[0] || null;

    if (!taskId) return;

    const { data: existing } = await supabase
      .from("farm_operational_tasks")
      .select("description")
      .eq("id", taskId)
      .maybeSingle();

    let desc = existing?.description || "";
    // Clean previous [assigned_workers: ...] tag
    desc = desc.replace(/\[assigned_workers:\s*[^\]]+\]/g, "").trim();
    if (allWorkerIds.length > 0) {
      desc = desc ? `${desc} [assigned_workers: ${allWorkerIds.join(",")}]` : `[assigned_workers: ${allWorkerIds.join(",")}]`;
    }

    const { error } = await supabase
      .from("farm_operational_tasks")
      .update({
        assigned_worker_id: primaryWorkerId,
        description: desc || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) console.error("assignWorkersToTask error:", error.message);
  } catch (err: any) {
    console.error("assignWorkersToTask exception:", err.message);
  }

  revalidatePath("/account/tasks");
}

export async function syncCropCycleOperationsToTasks(form?: FormData): Promise<void> {
  try {
    const { supabase, user } = await getAuth();
    const farmId = form ? String(form.get("farm_id") || "").trim() : "";

    // 1. Fetch user's farms
    const { data: userFarms } = await supabase
      .from("farms")
      .select("id")
      .eq("owner_id", user.id);

    const farmIds = farmId ? [farmId] : (userFarms || []).map((f) => f.id);
    if (farmIds.length === 0) return;

    // 2. Fetch active crop cycles
    const { data: cycles } = await supabase
      .from("crop_cycles")
      .select("id, farm_id, plot_id, crop_name, crop_id, variety, status, current_stage")
      .in("farm_id", farmIds)
      .neq("status", "completed")
      .neq("status", "abandoned");

    if (!cycles || cycles.length === 0) return;

    const cycleIds = cycles.map((c) => c.id);
    const cycleMap = new Map(cycles.map((c) => [c.id, c]));

    // 3. Fetch operations
    const { data: rawCycleOps } = await supabase
      .from("crop_cycle_operations")
      .select("*")
      .in("crop_cycle_id", cycleIds);

    const cycleOps = (rawCycleOps || []) as any[];
    if (cycleOps.length === 0) return;

    // 4. Fetch existing tasks
    const { data: existingTasks } = await supabase
      .from("farm_operational_tasks")
      .select("crop_cycle_id, title")
      .in("crop_cycle_id", cycleIds);

    const existingSet = new Set((existingTasks || []).map((t) => `${t.crop_cycle_id}::${t.title}`));

    const tasksToInsert: any[] = [];

    for (const op of cycleOps) {
      const key = `${op.crop_cycle_id}::${op.name}`;
      if (!existingSet.has(key)) {
        const cycle = cycleMap.get(op.crop_cycle_id);
        if (cycle) {
          const cropDisplay = cycle.crop_name || cycle.crop_id || "Crop";
          const inputDetails = Array.isArray(op.required_inputs) && op.required_inputs.length > 0
            ? `Inputs: ${op.required_inputs.map((i: any) => `${i.standardQuantityPerHa || i.quantity || ""} ${i.unit || ""} ${i.itemName || ""}`).join(", ")}`
            : "";
          tasksToInsert.push({
            farm_id: cycle.farm_id,
            plot_id: cycle.plot_id,
            crop_cycle_id: cycle.id,
            title: op.name,
            description: `[Plant Cycle: ${cropDisplay} (${cycle.variety || cycle.current_stage || "Active"})] Stage: ${op.stage || "Field"}. ${inputDetails}`.trim(),
            priority: op.stage?.toLowerCase().includes("planting") || op.stage?.toLowerCase().includes("harvest") ? "high" : "medium",
            status: "planned",
            start_date: op.scheduled_date || new Date().toISOString().split("T")[0],
            due_date: op.scheduled_date || new Date().toISOString().split("T")[0],
            direct_cost_minor: 0,
            direct_cost_kobo: 0,
          });
        }
      }
    }

    if (tasksToInsert.length > 0) {
      let { error } = await supabase.from("farm_operational_tasks").insert(tasksToInsert as any);
      if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
        const fallbackTasks = tasksToInsert.map((t) => ({
          farm_id: t.farm_id,
          plot_id: t.plot_id,
          crop_cycle_id: t.crop_cycle_id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: t.status,
          start_date: t.start_date,
          due_date: t.due_date,
          direct_cost_kobo: 0,
        }));
        await supabase.from("farm_operational_tasks").insert(fallbackTasks as any);
      }
    }
  } catch (err: any) {
    console.error("syncCropCycleOperationsToTasks error:", err.message);
  }

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
