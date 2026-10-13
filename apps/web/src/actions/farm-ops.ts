"use server";

// Farm-operations actions for the live account modules: plots, crop cycles, scouting, harvests,
// livestock, labour, machinery, inventory, budgets and books, irrigation and IoT alerts.
// Row level security (can_edit_farm / can_view_farm) decides access; inputs are validated here.
import type { FormResult } from "@/components/live/action-form";
import { redirect } from "next/navigation";
import { OP_TYPES, addDays, missingOperations, suggestCropPlan } from "@/lib/crop-plan";
import { actor, date, dbFail, fail, id, kobo, num, ok, oneOf, optText, refreshPages, text, today } from "@/lib/account/act";

type R = Promise<FormResult>;

const SOIL = ["sandy", "loamy_sand", "sandy_loam", "loam", "silt_loam", "clay_loam", "clay"] as const;
const IRRIGATION = ["rainfed", "drip", "sprinkler", "furrow", "manual"] as const;

// ── Plots ─────────────────────────────────────────────────────────────────────────────────────

export async function createPlot(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const farmId = id(form, "farm_id");
  const name = text(form, "name", 80);
  const area = num(form, "area_ha");
  if (!farmId || name.length < 1) return fail("Choose a farm and give the plot a name.");
  if (area !== null && area <= 0) return fail("Area must be more than zero.");
  const { error } = await supabase.from("plots").insert({
    farm_id: farmId,
    name,
    plot_code: optText(form, "plot_code", 20),
    area_ha: area,
    soil_texture: oneOf(form, "soil_texture", SOIL),
    irrigation_type: oneOf(form, "irrigation_type", IRRIGATION),
    current_crop: optText(form, "current_crop", 60),
    notes: optText(form, "notes"),
    created_by: uid,
  });
  if (error) return dbFail(error, "create_plot");
  refreshPages("/farms", `/farms/${farmId}`, "/crops");
  return ok("Plot added.");
}

// ── Crop cycles, operations, scouting, harvest ──────────────────────────────────────────────

const CYCLE_STATUS = ["planning", "land_preparation", "planting", "establishment", "maintenance", "harvesting", "completed", "abandoned"] as const;

export async function createCropCycle(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const farmId = id(form, "farm_id");
  const crop = text(form, "crop_id", 40).toLowerCase();
  const planting = date(form, "planting_date");
  const harvest = date(form, "expected_harvest_date");
  const area = num(form, "target_area_ha");
  if (!farmId || !crop) return fail("Choose a farm and a crop.");
  if (!planting || !harvest || harvest < planting) return fail("Harvest date must be on or after the planting date.");
  if (!area || area <= 0) return fail("Enter the area you will plant, in hectares.");
  const plotId = id(form, "plot_id");
  const { data: std } = await supabase
    .from("farm_agronomic_standards")
    .select("id")
    .eq("crop_or_livestock_id", crop)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("crop_cycles").insert({
    farm_id: farmId,
    plot_id: plotId,
    standard_id: std?.id ?? null,
    crop_id: crop,
    variety_id: optText(form, "variety_id", 60),
    season: text(form, "season", 60) || `${new Date().getFullYear()} season`,
    status: oneOf(form, "status", CYCLE_STATUS, "planning")!,
    current_stage: optText(form, "current_stage", 60) ?? undefined,
    target_area_ha: area,
    planting_date: planting,
    expected_harvest_date: harvest,
    target_yield_kg: num(form, "target_yield_kg") ?? undefined,
    estimated_budget_kobo: kobo(form, "estimated_budget") ?? 0,
    notes: optText(form, "notes"),
    created_by: uid,
  });
  if (error) return dbFail(error, "create_crop_cycle");
  refreshPages("/crops", "/");
  return ok("Crop cycle started.");
}

type PlannedOp = { name: string; stage: string; operation_type: string; scheduled_date: string; required_machinery?: string | null; notes?: string | null };

/**
 * Crop planner: the cycle plus the operations the farmer kept from the suggestions (and any they added),
 * in one step. Operations show up straight away on Field Operations & Calendar and the phone calendar feed.
 */
export async function createPlannedCropCycle(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const lang = text(form, "lang", 5) || "en";
  const farmId = id(form, "farm_id");
  const crop = text(form, "crop_id", 40).toLowerCase();
  const planting = date(form, "planting_date");
  const harvest = date(form, "expected_harvest_date");
  const area = num(form, "target_area_ha");
  if (!farmId || !crop) return fail("Choose a farm and a crop.");
  if (!planting || !harvest || harvest < planting) return fail("Harvest date must be on or after the planting date.");
  if (!area || area <= 0) return fail("Enter the area you will plant, in hectares.");

  let planned: PlannedOp[] = [];
  try {
    const raw = JSON.parse(String(form.get("operations") ?? "[]"));
    planned = (Array.isArray(raw) ? raw : []).slice(0, 80);
  } catch {
    return fail("The operations list couldn't be read. Please try again.");
  }
  const ops = planned
    .map((o) => ({
      name: String(o?.name ?? "").trim().slice(0, 120),
      stage: String(o?.stage ?? "").trim().slice(0, 60) || "General",
      operation_type: (OP_TYPES as readonly string[]).includes(String(o?.operation_type)) ? String(o.operation_type) : "other",
      scheduled_date: /^\d{4}-\d{2}-\d{2}$/.test(String(o?.scheduled_date)) ? String(o.scheduled_date) : "",
      required_machinery: o?.required_machinery ? String(o.required_machinery).slice(0, 120) : null,
      notes: o?.notes ? String(o.notes).slice(0, 500) : null,
    }))
    .filter((o) => o.name.length >= 2 && o.scheduled_date);

  const { data: std } = await supabase.from("farm_agronomic_standards").select("id").eq("crop_or_livestock_id", crop).eq("is_active", true).limit(1).maybeSingle();
  const { data: cycle, error } = await supabase
    .from("crop_cycles")
    .insert({
      farm_id: farmId,
      plot_id: id(form, "plot_id"),
      standard_id: std?.id ?? null,
      crop_id: crop,
      variety_id: optText(form, "variety_id", 60),
      season: text(form, "season", 60) || `${new Date().getFullYear()} season`,
      status: planting > today() ? "planning" : "planting",
      current_stage: optText(form, "current_stage", 60) ?? undefined,
      target_area_ha: area,
      planting_date: planting,
      expected_harvest_date: harvest,
      target_yield_kg: num(form, "target_yield_kg") ?? undefined,
      estimated_budget_kobo: kobo(form, "estimated_budget") ?? 0,
      notes: optText(form, "notes"),
      created_by: uid,
    })
    .select("id")
    .single();
  if (error || !cycle) return dbFail(error, "create_planned_crop_cycle");
  if (ops.length) {
    const { error: opErr } = await supabase.from("crop_cycle_operations").insert(ops.map((o) => ({ ...o, crop_cycle_id: cycle.id, status: "pending" })));
    if (opErr) return dbFail(opErr, "create_planned_crop_operations");
  }
  refreshPages("/crops", "/tasks", "/");
  redirect(`/${lang}/account/crops/${cycle.id}?planned=${ops.length}`);
}

/** Add every suggested operation the cycle doesn't have yet. */
export async function addSuggestedOperations(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const cycleId = id(form, "crop_cycle_id");
  if (!cycleId) return fail("Crop cycle not found.");
  const [{ data: c }, { data: have }] = await Promise.all([
    supabase.from("crop_cycles").select("crop_id, variety_id, planting_date").eq("id", cycleId).maybeSingle(),
    supabase.from("crop_cycle_operations").select("name, operation_type, scheduled_date").eq("crop_cycle_id", cycleId),
  ]);
  if (!c) return fail("Crop cycle not found.");
  const plan = suggestCropPlan(c.crop_id, c.planting_date, c.variety_id);
  const missing = missingOperations(plan.operations, have ?? [], c.planting_date < today() ? addDays(today(), -14) : undefined);
  if (!missing.length) return ok("Your plan already has every suggested operation.");
  const { error } = await supabase.from("crop_cycle_operations").insert(
    missing.map((o) => ({
      crop_cycle_id: cycleId,
      name: o.name,
      stage: o.stage,
      operation_type: o.operationType,
      scheduled_date: o.startsOn,
      required_machinery: o.machinery,
      notes: o.description,
      status: "pending",
    })),
  );
  if (error) return dbFail(error, "add_suggested_operations");
  refreshPages("/crops", `/crops/${cycleId}`, "/tasks", "/");
  return ok(`Added ${missing.length} suggested operation${missing.length === 1 ? "" : "s"}.`);
}

export async function updateCropStage(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const cycleId = id(form, "crop_cycle_id");
  const status = oneOf(form, "status", CYCLE_STATUS);
  if (!cycleId || !status) return fail("Choose a status.");
  const health = oneOf(form, "health_status", ["healthy", "watch", "at_risk", "critical"] as const);
  const { error } = await supabase
    .from("crop_cycles")
    .update({
      status,
      current_stage: optText(form, "current_stage", 60) ?? undefined,
      ...(health ? { health_status: health } : {}),
      ...(status === "completed" ? { actual_harvest_date: date(form, "actual_harvest_date") ?? today() } : {}),
    })
    .eq("id", cycleId);
  if (error) return dbFail(error, "update_crop_stage");
  refreshPages("/crops", `/crops/${cycleId}`);
  return ok("Crop stage updated.");
}


export async function addCropOperation(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const cycleId = id(form, "crop_cycle_id");
  const type = oneOf(form, "operation_type", OP_TYPES);
  const name = text(form, "name", 120);
  const when = date(form, "scheduled_date");
  if (!cycleId || !type || !name || !when) return fail("Choose the crop cycle, operation type, name and date.");
  const { error } = await supabase.from("crop_cycle_operations").insert({
    crop_cycle_id: cycleId,
    operation_type: type,
    name,
    stage: text(form, "stage", 60) || "General",
    scheduled_date: when,
    required_machinery: optText(form, "required_machinery", 120),
    notes: optText(form, "notes"),
  });
  if (error) return dbFail(error, "add_crop_operation");
  refreshPages("/crops", `/crops/${cycleId}`, "/tasks");
  return ok("Operation scheduled.");
}

export async function completeCropOperation(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const opId = id(form, "id");
  if (!opId) return fail("Operation not found.");
  const cost = kobo(form, "actual_cost");
  const { error } = await supabase
    .from("crop_cycle_operations")
    .update({ status: "completed", completed_date: today(), ...(cost !== null ? { actual_cost_kobo: cost } : {}) })
    .eq("id", opId);
  if (error) return dbFail(error, "complete_crop_operation");
  refreshPages("/crops", "/tasks", "/");
  return ok("Marked as done.");
}

/** Start, skip or reschedule a crop operation (from the crop page or the field operations board). */
export async function setCropOperationStatus(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const opId = id(form, "id");
  const status = oneOf(form, "status", ["pending", "in_progress", "skipped"] as const);
  const when = date(form, "scheduled_date");
  if (!opId || (!status && !when)) return fail("Operation not found.");
  const { error } = await supabase
    .from("crop_cycle_operations")
    .update({ ...(status ? { status } : {}), ...(when ? { scheduled_date: when } : {}) })
    .eq("id", opId);
  if (error) return dbFail(error, "set_crop_operation_status");
  refreshPages("/crops", "/tasks", "/");
  return ok(when ? "Operation rescheduled." : status === "in_progress" ? "Operation started." : status === "skipped" ? "Operation skipped." : "Operation updated.");
}

const OBS_CATEGORY = ["pest", "disease", "nutrient_deficiency", "weed_infestation", "water_stress", "general"] as const;
const SEVERITY = ["low", "medium", "high", "critical"] as const;

export async function logObservation(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const cycleId = id(form, "crop_cycle_id");
  const category = oneOf(form, "category", OBS_CATEGORY);
  const title = text(form, "title", 140);
  const description = text(form, "description", 2000);
  if (!cycleId || !category || !title || !description) return fail("Choose the crop, a category, and describe what you saw.");
  const { error } = await supabase.from("crop_observations").insert({
    crop_cycle_id: cycleId,
    category,
    severity: oneOf(form, "severity", SEVERITY, "medium")!,
    title,
    description,
    recommended_action: optText(form, "recommended_action", 1000),
    created_by: uid,
  });
  if (error) return dbFail(error, "log_observation");
  refreshPages("/crops/scouting", "/crops", "/risk");
  return ok("Scouting observation logged.");
}

export async function resolveObservation(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const obsId = id(form, "id");
  if (!obsId) return fail("Observation not found.");
  const { error } = await supabase.from("crop_observations").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", obsId);
  if (error) return dbFail(error, "resolve_observation");
  refreshPages("/crops/scouting", "/risk");
  return ok("Marked as resolved.");
}

const GRADE = ["A", "B", "C", "reject"] as const;
const DESTINATION = ["store", "marketplace", "offtaker", "processing", "home_use"] as const;

export async function recordHarvest(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const cycleId = id(form, "crop_cycle_id");
  const qty = num(form, "quantity_kg");
  if (!cycleId || !qty || qty <= 0) return fail("Choose the crop cycle and enter the harvested quantity.");
  const batch = text(form, "batch_code", 40) || `HV-${Date.now().toString(36).toUpperCase()}`;
  const { error } = await supabase.from("crop_harvests").insert({
    crop_cycle_id: cycleId,
    batch_code: batch,
    harvest_date: date(form, "harvest_date") ?? today(),
    quantity_kg: qty,
    quality_grade: oneOf(form, "quality_grade", GRADE),
    moisture_pct: num(form, "moisture_pct"),
    loss_pct: num(form, "loss_pct"),
    storage_location: optText(form, "storage_location", 120),
    destination: oneOf(form, "destination", DESTINATION, "store")!,
    recorded_by: uid,
  });
  if (error) return dbFail(error, "record_harvest");
  refreshPages("/harvest", "/crops", "/");
  return ok(`Harvest batch ${batch} recorded.`);
}

export async function dismissCropAlert(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const alertId = id(form, "id");
  if (!alertId) return fail("Alert not found.");
  const { error } = await supabase.from("crop_alerts").update({ is_dismissed: true }).eq("id", alertId);
  if (error) return dbFail(error, "dismiss_alert");
  refreshPages("/risk", "/", "/weather");
  return ok("Alert dismissed.");
}

// ── Livestock ───────────────────────────────────────────────────────────────────────────────

const ANIMAL_TYPE = ["cattle", "goats", "sheep", "poultry", "pigs", "fish", "rabbits", "snails", "other"] as const;
const PURPOSE = ["meat", "dairy", "eggs", "breeding", "multi"] as const;

export async function createLivestockGroup(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const farmId = id(form, "farm_id");
  const name = text(form, "group_name", 100);
  const type = oneOf(form, "animal_type", ANIMAL_TYPE);
  const pop = num(form, "population");
  if (!farmId || !name || !type || pop === null || pop < 0) return fail("Choose a farm, name the group, and enter the head count.");
  const { error } = await supabase.from("farm_livestock_groups").insert({
    farm_id: farmId,
    group_name: name,
    animal_type: type,
    breed: optText(form, "breed", 80),
    purpose: oneOf(form, "purpose", PURPOSE, "meat")!,
    population: Math.round(pop),
    housing_location: optText(form, "housing_location", 120),
    age_weeks: num(form, "age_weeks"),
  });
  if (error) return dbFail(error, "create_livestock_group");
  refreshPages("/livestock");
  return ok("Livestock group added.");
}

const HEALTH_EVENT = ["vaccination", "treatment", "disease_diagnosis", "vet_visit", "routine_check", "mortality"] as const;

export async function logHealthEvent(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const groupId = id(form, "group_id");
  const type = oneOf(form, "event_type", HEALTH_EVENT);
  if (!groupId || !type) return fail("Choose the group and the event type.");
  const { data: group } = await supabase.from("farm_livestock_groups").select("farm_id, population").eq("id", groupId).maybeSingle();
  if (!group) return fail("Group not found.");
  const head = num(form, "head_affected");
  const withdrawal = num(form, "withdrawal_period_days");
  const on = date(form, "administered_on") ?? today();
  const { error } = await supabase.from("farm_livestock_health_events").insert({
    farm_id: group.farm_id,
    group_id: groupId,
    event_type: type,
    disease_or_condition: optText(form, "disease_or_condition", 120),
    medication_name: optText(form, "medication_name", 120),
    dosage: optText(form, "dosage", 80),
    administered_on: on,
    vet_name: optText(form, "vet_name", 80),
    head_affected: head,
    cost_kobo: kobo(form, "cost") ?? 0,
    withdrawal_period_days: withdrawal ?? undefined,
    withdrawal_end_date: withdrawal ? new Date(Date.parse(on) + withdrawal * 86_400_000).toISOString().slice(0, 10) : null,
    notes: optText(form, "notes"),
  });
  if (error) return dbFail(error, "log_health_event");
  if (type === "mortality" && head && head > 0) {
    await supabase.from("farm_livestock_groups").update({ population: Math.max(0, group.population - Math.round(head)) }).eq("id", groupId);
  }
  refreshPages("/livestock");
  return ok("Health event recorded.");
}

export async function logFeeding(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const groupId = id(form, "group_id");
  const qty = num(form, "quantity_kg");
  const feed = text(form, "feed_type", 120);
  if (!groupId || !feed || !qty || qty <= 0) return fail("Choose the group, the feed and the quantity.");
  const { data: group } = await supabase.from("farm_livestock_groups").select("farm_id").eq("id", groupId).maybeSingle();
  if (!group) return fail("Group not found.");
  const { error } = await supabase.from("farm_livestock_feedings").insert({
    farm_id: group.farm_id,
    group_id: groupId,
    feed_type: feed,
    quantity_kg: qty,
    cost_kobo: kobo(form, "cost") ?? 0,
    feeding_date: date(form, "feeding_date") ?? today(),
  });
  if (error) return dbFail(error, "log_feeding");
  refreshPages("/livestock");
  return ok("Feeding logged.");
}

const PRODUCT = ["eggs", "milk", "meat", "fish", "honey", "manure", "other"] as const;
const PROD_DEST = ["inventory", "marketplace", "home_consumption", "spoilage"] as const;

export async function logProduction(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const groupId = id(form, "group_id");
  const product = oneOf(form, "product_type", PRODUCT);
  const qty = num(form, "quantity");
  if (!groupId || !product || !qty || qty <= 0) return fail("Choose the group, product and quantity.");
  const { data: group } = await supabase.from("farm_livestock_groups").select("farm_id").eq("id", groupId).maybeSingle();
  if (!group) return fail("Group not found.");
  const { error } = await supabase.from("farm_livestock_production_logs").insert({
    farm_id: group.farm_id,
    group_id: groupId,
    product_type: product,
    quantity: qty,
    unit: text(form, "unit", 20) || "units",
    quality_grade: optText(form, "quality_grade", 10),
    log_date: date(form, "log_date") ?? today(),
    destination: oneOf(form, "destination", PROD_DEST, "inventory")!,
    revenue_kobo: kobo(form, "revenue") ?? 0,
  });
  if (error) return dbFail(error, "log_production");
  refreshPages("/livestock");
  return ok("Production logged.");
}

// ── Labour & tasks ──────────────────────────────────────────────────────────────────────────

const WORKER_ROLE = ["farm_manager", "tractor_operator", "field_worker", "scout", "harvester", "livestock_keeper", "security", "casual"] as const;
const EMPLOYMENT = ["permanent", "seasonal", "daily_casual"] as const;

export async function createWorker(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const farmId = id(form, "farm_id");
  const name = text(form, "full_name", 120);
  const role = oneOf(form, "role", WORKER_ROLE);
  if (!farmId || name.length < 2 || !role) return fail("Choose a farm, enter the worker's name and role.");
  const { error } = await supabase.from("farm_workers").insert({
    farm_id: farmId,
    full_name: name,
    phone: optText(form, "phone", 30),
    role,
    employment_type: oneOf(form, "employment_type", EMPLOYMENT, "seasonal")!,
    daily_wage_kobo: kobo(form, "daily_wage") ?? 0,
    joined_date: date(form, "joined_date") ?? today(),
  });
  if (error) return dbFail(error, "create_worker");
  refreshPages("/tasks");
  return ok("Worker added.");
}

const TASK_STATUS = ["planned", "assigned", "in_progress", "blocked", "completed", "cancelled", "overdue"] as const;
const PRIORITY = ["low", "medium", "high", "urgent"] as const;

export async function createTask(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const farmId = id(form, "farm_id");
  const title = text(form, "title", 160);
  if (!farmId || title.length < 2) return fail("Choose a farm and describe the task.");
  const worker = id(form, "assigned_worker_id");
  const { error } = await supabase.from("farm_operational_tasks").insert({
    farm_id: farmId,
    plot_id: id(form, "plot_id"),
    crop_cycle_id: id(form, "crop_cycle_id"),
    title,
    description: optText(form, "description", 1000),
    category: optText(form, "category", 40) ?? undefined,
    priority: oneOf(form, "priority", PRIORITY, "medium")!,
    status: worker ? "assigned" : "planned",
    assigned_worker_id: worker,
    start_date: date(form, "start_date") ?? today(),
    due_date: date(form, "due_date") ?? undefined,
    estimated_duration_hours: num(form, "estimated_duration_hours"),
  });
  if (error) return dbFail(error, "create_task");
  refreshPages("/tasks", "/");
  return ok("Task created.");
}

export async function setTaskStatus(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const taskId = id(form, "id");
  const status = oneOf(form, "status", TASK_STATUS);
  if (!taskId || !status) return fail("Task not found.");
  const { error } = await supabase
    .from("farm_operational_tasks")
    .update({ status, ...(status === "completed" ? { completed_date: today() } : {}) })
    .eq("id", taskId);
  if (error) return dbFail(error, "set_task_status");
  refreshPages("/tasks", "/");
  return ok("Task updated.");
}

export async function clockAttendance(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const workerId = id(form, "worker_id");
  if (!workerId) return fail("Choose a worker.");
  const { data: w } = await supabase.from("farm_workers").select("farm_id, daily_wage_kobo").eq("id", workerId).maybeSingle();
  if (!w) return fail("Worker not found.");
  const status = oneOf(form, "status", ["present", "late", "half_day", "absent", "on_leave"] as const, "present")!;
  const hours = num(form, "hours_worked") ?? (status === "half_day" ? 4 : status === "absent" || status === "on_leave" ? 0 : 8);
  const pay = status === "absent" || status === "on_leave" ? 0 : status === "half_day" ? Math.round(w.daily_wage_kobo / 2) : w.daily_wage_kobo;
  const { error } = await supabase.from("farm_attendance_records").insert({
    farm_id: w.farm_id,
    worker_id: workerId,
    clock_in_at: new Date().toISOString(),
    shift_name: optText(form, "shift_name", 40) ?? "Day shift",
    hours_worked: hours,
    status,
    daily_pay_kobo: pay,
  });
  if (error) return dbFail(error, "clock_attendance");
  refreshPages("/tasks");
  return ok("Attendance recorded.");
}

// ── Machinery ───────────────────────────────────────────────────────────────────────────────

const MACHINE_CATEGORY = ["tractor", "plough", "harrow", "ridger", "planter", "harvester", "boom_sprayer", "water_pump", "generator", "trailer", "truck", "processor", "drone", "other"] as const;
const FUEL = ["diesel", "petrol", "electric", "manual", "hybrid"] as const;

export async function createMachine(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const farmId = id(form, "farm_id");
  const code = text(form, "asset_code", 30);
  const name = text(form, "name", 120);
  const category = oneOf(form, "category", MACHINE_CATEGORY);
  if (!farmId || !code || !name || !category) return fail("Choose a farm and enter the asset code, name and category.");
  const { error } = await supabase.from("farm_machinery_assets").insert({
    farm_id: farmId,
    asset_code: code,
    name,
    category,
    manufacturer: optText(form, "manufacturer", 60),
    model: optText(form, "model", 60),
    year_of_manufacture: num(form, "year_of_manufacture"),
    registration_number: optText(form, "registration_number", 30),
    fuel_type: oneOf(form, "fuel_type", FUEL, "diesel")!,
    current_status: "available",
    engine_hours: num(form, "engine_hours") ?? 0,
    next_service_hours: num(form, "next_service_hours"),
    hourly_internal_rate_kobo: kobo(form, "hourly_rate") ?? 0,
    purchase_value_kobo: kobo(form, "purchase_value") ?? 0,
  });
  if (error) return dbFail(error, "create_machine");
  refreshPages("/machinery");
  return ok("Machine added to the fleet.");
}

export async function logMachineUsage(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const machineId = id(form, "machinery_id");
  const hours = num(form, "hours_operated");
  const operation = text(form, "operation_name", 120);
  if (!machineId || !operation || !hours || hours <= 0) return fail("Choose the machine, describe the job and enter the hours.");
  const { data: m } = await supabase.from("farm_machinery_assets").select("farm_id, engine_hours, hourly_internal_rate_kobo").eq("id", machineId).maybeSingle();
  if (!m) return fail("Machine not found.");
  const end = new Date();
  const start = new Date(end.getTime() - hours * 3_600_000);
  const { error } = await supabase.from("farm_machinery_usage_logs").insert({
    farm_id: m.farm_id,
    machinery_id: machineId,
    plot_id: id(form, "plot_id"),
    operation_name: operation,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    hours_operated: hours,
    area_covered_ha: num(form, "area_covered_ha") ?? undefined,
    fuel_litres_consumed: num(form, "fuel_litres_consumed") ?? undefined,
    operational_cost_kobo: Math.round(hours * Number(m.hourly_internal_rate_kobo ?? 0)),
  });
  if (error) return dbFail(error, "log_machine_usage");
  await supabase.from("farm_machinery_assets").update({ engine_hours: Number(m.engine_hours ?? 0) + hours }).eq("id", machineId);
  refreshPages("/machinery", "/machinery/telemetry");
  return ok("Usage logged and engine hours updated.");
}

const SERVICE = ["routine_service", "repair", "inspection", "tyre", "overhaul"] as const;

export async function scheduleMaintenance(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const machineId = id(form, "machinery_id");
  const type = oneOf(form, "service_type", SERVICE);
  const desc = text(form, "description", 500);
  if (!machineId || !type || !desc) return fail("Choose the machine, service type and describe the work.");
  const { data: m } = await supabase.from("farm_machinery_assets").select("farm_id, engine_hours").eq("id", machineId).maybeSingle();
  if (!m) return fail("Machine not found.");
  const when = date(form, "service_date") ?? today();
  const { error } = await supabase.from("farm_machinery_maintenance").insert({
    farm_id: m.farm_id,
    machinery_id: machineId,
    service_type: type,
    description: desc,
    service_date: when,
    engine_hours_at: m.engine_hours,
    cost_kobo: kobo(form, "cost") ?? 0,
    vendor: optText(form, "vendor", 120),
    status: when > today() ? "scheduled" : "in_progress",
  });
  if (error) return dbFail(error, "schedule_maintenance");
  refreshPages("/machinery");
  return ok("Maintenance saved.");
}

export async function completeMaintenance(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const rowId = id(form, "id");
  if (!rowId) return fail("Service record not found.");
  const { data: row } = await supabase.from("farm_machinery_maintenance").select("machinery_id").eq("id", rowId).maybeSingle();
  const { error } = await supabase.from("farm_machinery_maintenance").update({ status: "completed" }).eq("id", rowId);
  if (error) return dbFail(error, "complete_maintenance");
  if (row) await supabase.from("farm_machinery_assets").update({ current_status: "available" }).eq("id", row.machinery_id).eq("current_status", "under_maintenance");
  refreshPages("/machinery");
  return ok("Service marked complete.");
}

// ── Inventory ───────────────────────────────────────────────────────────────────────────────

const INV_CATEGORY = ["seed", "fertiliser", "chemical", "feed", "tool_equipment", "harvest_produce", "fuel", "other"] as const;
const INV_UNIT = ["kg", "liters", "bags", "units", "tons", "crates", "bundles"] as const;
const MOVEMENT = ["purchase", "receipt", "issue_to_field", "consumption", "adjustment", "return", "loss", "damage", "sale"] as const;

export async function createInventoryItem(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const farmId = id(form, "farm_id");
  const name = text(form, "item_name", 120);
  const category = oneOf(form, "category", INV_CATEGORY);
  const unit = oneOf(form, "unit", INV_UNIT);
  if (!farmId || name.length < 2 || !category || !unit) return fail("Choose a farm and enter the item name, category and unit.");
  const { error } = await supabase.from("farm_inventory").insert({
    farm_id: farmId,
    item_name: name,
    sku: optText(form, "sku", 40),
    category,
    unit,
    quantity: num(form, "quantity") ?? 0,
    reorder_threshold: num(form, "reorder_threshold") ?? 0,
    storage_location: optText(form, "storage_location", 120),
    unit_cost_kobo: kobo(form, "unit_cost") ?? 0,
    expiry_date: date(form, "expiry_date"),
  });
  if (error) return dbFail(error, "create_inventory_item");
  refreshPages("/inventory");
  return ok("Item added to stock.");
}

export async function recordStockMovement(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const itemId = id(form, "inventory_id");
  const type = oneOf(form, "transaction_type", MOVEMENT);
  const qty = num(form, "quantity");
  if (!itemId || !type || !qty || qty <= 0) return fail("Choose the item, movement type and quantity.");
  const { data: item } = await supabase.from("farm_inventory").select("farm_id").eq("id", itemId).maybeSingle();
  if (!item) return fail("Item not found.");
  const { error } = await supabase.rpc("record_farm_inventory_movement", {
    p_farm_id: item.farm_id,
    p_inventory_id: itemId,
    p_transaction_type: type,
    p_quantity: qty,
    p_unit_cost_kobo: kobo(form, "unit_cost") ?? undefined,
    p_crop_cycle_id: id(form, "crop_cycle_id") ?? undefined,
    p_notes: optText(form, "notes") ?? undefined,
  });
  if (error) {
    if (/insufficient/i.test(error.message ?? "")) return fail("Not enough stock for that movement.");
    return dbFail(error, "stock_movement");
  }
  refreshPages("/inventory");
  return ok("Stock movement recorded.");
}

// ── Budgets & books ─────────────────────────────────────────────────────────────────────────

const ENTERPRISE = ["crop", "livestock", "whole_farm", "machinery", "processing"] as const;
const TX_CATEGORY = ["harvest_sale", "livestock_sale", "machinery_service", "seeds", "fertilisers", "chemicals", "labour_wages", "feed", "fuel", "repairs", "other"] as const;
const PAY = ["cash", "bank_transfer", "escrow", "mobile_money"] as const;

export async function createBudget(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const farmId = id(form, "farm_id");
  const title = text(form, "title", 120);
  const type = oneOf(form, "enterprise_type", ENTERPRISE);
  if (!farmId || !title || !type) return fail("Choose a farm, name the budget and pick the enterprise.");
  const { error } = await supabase.from("farm_budgets").insert({
    farm_id: farmId,
    title,
    enterprise_type: type,
    fiscal_year: num(form, "fiscal_year") ?? new Date().getFullYear(),
    season: optText(form, "season", 60),
    crop_cycle_id: id(form, "crop_cycle_id"),
    total_budget_kobo: kobo(form, "total_budget") ?? 0,
    planned_revenue_kobo: kobo(form, "planned_revenue") ?? 0,
    status: "draft",
  });
  if (error) return dbFail(error, "create_budget");
  refreshPages("/finance");
  return ok("Budget created.");
}

export async function addBudgetLine(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const budgetId = id(form, "budget_id");
  const item = text(form, "line_item", 160);
  const amount = kobo(form, "budgeted_amount");
  if (!budgetId || !item || amount === null || amount < 0) return fail("Choose the budget, describe the line and enter the amount.");
  const { error } = await supabase.from("farm_budget_lines").insert({
    budget_id: budgetId,
    category: text(form, "category", 40) || "other",
    line_item: item,
    cost_type: oneOf(form, "cost_type", ["fixed", "variable"] as const, "variable")!,
    budgeted_amount_kobo: amount,
    actual_amount_kobo: kobo(form, "actual_amount") ?? 0,
  });
  if (error) return dbFail(error, "add_budget_line");
  refreshPages("/finance");
  return ok("Budget line added.");
}

export async function recordTransaction(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const farmId = id(form, "farm_id");
  const type = oneOf(form, "type", ["income", "expense"] as const);
  const category = oneOf(form, "category", TX_CATEGORY);
  const amount = kobo(form, "amount");
  const desc = text(form, "description", 500);
  if (!farmId || !type || !category || !amount || amount <= 0 || desc.length < 2) return fail("Fill in the farm, type, category, amount and description.");
  const { error } = await supabase.from("farm_financial_transactions").insert({
    farm_id: farmId,
    crop_cycle_id: id(form, "crop_cycle_id"),
    budget_id: id(form, "budget_id"),
    type,
    category,
    amount_kobo: amount,
    transaction_date: date(form, "transaction_date") ?? today(),
    receipt_number: optText(form, "receipt_number", 60),
    payment_method: oneOf(form, "payment_method", PAY, "cash")!,
    description: desc,
    counterparty: optText(form, "counterparty", 120),
    recorded_by: uid,
  });
  if (error) return dbFail(error, "record_transaction");
  refreshPages("/finance", "/reports", "/");
  return ok(type === "income" ? "Income recorded." : "Expense recorded.");
}

export async function recordVariance(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const farmId = id(form, "farm_id");
  const metric = text(form, "metric_name", 80);
  const unit = text(form, "unit", 20);
  const std = num(form, "standard_value");
  const plan = num(form, "plan_value");
  const actual = num(form, "actual_value");
  if (!farmId || !metric || !unit || std === null || plan === null || actual === null) return fail("Fill in the metric, unit and the three values.");
  const reason = optText(form, "farmer_deviation_reason", 500);
  const { error } = await supabase.from("farm_plan_actual_variances").insert({
    farm_id: farmId,
    crop_cycle_id: id(form, "crop_cycle_id"),
    entity_type: oneOf(form, "entity_type", ["crop", "livestock", "machinery", "labour", "inventory"] as const, "crop")!,
    metric_name: metric,
    unit,
    standard_value: std,
    plan_value: plan,
    actual_value: actual,
    is_farmer_override: Boolean(reason),
    farmer_deviation_reason: reason,
  });
  if (error) return dbFail(error, "record_variance");
  refreshPages("/variance", "/finance");
  return ok("Variance recorded.");
}

// ── Irrigation & IoT ────────────────────────────────────────────────────────────────────────

const METHOD = ["drip", "sprinkler", "furrow", "centre_pivot", "manual"] as const;
const WATER = ["borehole", "river", "dam", "rainwater_tank", "municipal"] as const;

export async function createIrrigationZone(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const farmId = id(form, "farm_id");
  const name = text(form, "name", 80);
  const method = oneOf(form, "method", METHOD);
  if (!farmId || name.length < 2 || !method) return fail("Choose a farm, name the zone and pick the method.");
  const { error } = await supabase.from("irrigation_zones").insert({
    farm_id: farmId,
    plot_id: id(form, "plot_id"),
    name,
    method,
    water_source: oneOf(form, "water_source", WATER),
    area_ha: num(form, "area_ha"),
    flow_rate_lpm: num(form, "flow_rate_lpm"),
    target_moisture_pct: num(form, "target_moisture_pct"),
    status: "idle",
  });
  if (error) return dbFail(error, "create_irrigation_zone");
  refreshPages("/irrigation");
  return ok("Irrigation zone added.");
}

export async function runIrrigation(_: FormResult, form: FormData): R {
  const { supabase } = await actor(form);
  const zoneId = id(form, "zone_id");
  const minutes = num(form, "minutes") ?? 60;
  if (!zoneId || minutes <= 0 || minutes > 720) return fail("Choose the zone and a run time between 1 and 720 minutes.");
  const { data: z } = await supabase.from("irrigation_zones").select("farm_id, flow_rate_lpm").eq("id", zoneId).maybeSingle();
  if (!z) return fail("Zone not found.");
  const start = new Date();
  const end = new Date(start.getTime() + minutes * 60_000);
  const { error } = await supabase.from("irrigation_events").insert({
    farm_id: z.farm_id,
    zone_id: zoneId,
    started_at: start.toISOString(),
    ended_at: end.toISOString(),
    volume_litres: z.flow_rate_lpm ? Math.round(Number(z.flow_rate_lpm) * minutes) : null,
    trigger: "manual",
    status: "running",
    notes: optText(form, "notes"),
  });
  if (error) return dbFail(error, "run_irrigation");
  await supabase.from("irrigation_zones").update({ status: "irrigating" }).eq("id", zoneId);
  refreshPages("/irrigation");
  return ok(`Irrigation started for ${minutes} minutes.`);
}

export async function setDeviceAlertStatus(_: FormResult, form: FormData): R {
  const { supabase, uid } = await actor(form);
  const alertId = id(form, "id");
  const status = oneOf(form, "status", ["acknowledged", "resolved"] as const);
  if (!alertId || !status) return fail("Alert not found.");
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("device_alerts")
    .update(status === "acknowledged" ? { status, acknowledged_at: now, acknowledged_by: uid } : { status, resolved_at: now })
    .eq("id", alertId);
  if (error) return dbFail(error, "device_alert_status");
  refreshPages("/iot", "/irrigation", "/");
  return ok(status === "acknowledged" ? "Alert acknowledged." : "Alert resolved.");
}
