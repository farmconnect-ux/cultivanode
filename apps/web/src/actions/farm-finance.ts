"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createFarmBudget(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const enterpriseName = String(form.get("enterprise_name") || form.get("title") || "").trim();
  const year = parseInt(String(form.get("year") || form.get("fiscal_year") || String(new Date().getFullYear())), 10);
  const season = String(form.get("season") || "").trim() || null;
  const plannedRevenueMinor = parseInt(String(form.get("planned_revenue_minor") || "0"), 10) || 0;
  const plannedCostMinor = parseInt(String(form.get("planned_cost_minor") || form.get("total_budget_kobo") || "0"), 10) || 0;

  if (!farmId || !enterpriseName) return;

  const fullBudget = {
    farm_id: farmId,
    title: enterpriseName,
    enterprise_name: enterpriseName,
    enterprise_type: "crop",
    fiscal_year: year,
    year,
    season,
    total_budget_kobo: plannedCostMinor,
    planned_revenue_minor: plannedRevenueMinor,
    planned_cost_minor: plannedCostMinor,
    status: "draft",
  };

  let { error } = await supabase.from("farm_budgets").insert(fullBudget as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackBudget = {
      farm_id: farmId,
      title: enterpriseName,
      enterprise_type: "crop",
      fiscal_year: year,
      total_budget_kobo: plannedCostMinor,
      status: "draft",
      notes: [season ? `Season: ${season}` : "", plannedRevenueMinor ? `Revenue: ${plannedRevenueMinor}` : ""].filter(Boolean).join(" | ") || null,
    };
    const retry = await supabase.from("farm_budgets").insert(fallbackBudget as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/finance");
}

export async function addBudgetLine(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const budgetId = String(form.get("budget_id") || "").trim();
  const category = String(form.get("category") || "Inputs").trim();
  const description = String(form.get("description") || form.get("line_item") || "").trim();
  const costType = String(form.get("cost_type") || "variable").trim();
  const plannedMinor = parseInt(String(form.get("planned_minor") || form.get("budgeted_amount_kobo") || "0"), 10) || 0;
  const actualMinor = parseInt(String(form.get("actual_minor") || "0"), 10) || 0;

  if (!budgetId || !description) return;

  const fullLine = {
    budget_id: budgetId,
    category,
    cost_type: costType,
    line_item: description,
    description,
    budgeted_amount_kobo: plannedMinor,
    planned_minor: plannedMinor,
    actual_amount_kobo: actualMinor,
    actual_minor: actualMinor,
  };

  let { error } = await supabase.from("farm_budget_lines").insert(fullLine as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackLine = {
      budget_id: budgetId,
      category,
      line_item: description,
      budgeted_amount_kobo: plannedMinor,
      actual_amount_kobo: actualMinor,
      notes: costType ? `Cost Type: ${costType}` : null,
    };
    const retry = await supabase.from("farm_budget_lines").insert(fallbackLine as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/finance");
}

export async function recordPlanActualVariance(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const cycleId = String(form.get("crop_cycle_id") || "").trim() || null;
  const metric = String(form.get("metric") || form.get("metric_name") || "yield_kg").trim();
  const standardValue = parseFloat(String(form.get("standard_value") || "0")) || 0;
  const plannedValue = parseFloat(String(form.get("planned_value") || form.get("plan_value") || "0")) || 0;
  const actualValue = parseFloat(String(form.get("actual_value") || "0")) || 0;
  const variancePercentage = plannedValue > 0 ? ((actualValue - plannedValue) / plannedValue) * 100 : 0;
  const varianceNature = actualValue >= plannedValue ? "favorable" : "adverse";
  const rootCause = String(form.get("root_cause") || form.get("farmer_deviation_reason") || "").trim() || null;
  const correctiveAction = String(form.get("corrective_action") || "").trim() || null;

  if (!farmId || !metric) return;

  const fullVariance = {
    farm_id: farmId,
    crop_cycle_id: cycleId,
    entity_type: "crop",
    metric_name: metric,
    metric,
    unit: "kg",
    standard_value: standardValue,
    plan_value: plannedValue,
    planned_value: plannedValue,
    actual_value: actualValue,
    variance_percentage: variancePercentage,
    variance_nature: varianceNature,
    farmer_deviation_reason: rootCause,
    root_cause: rootCause,
    corrective_action: correctiveAction,
  };

  let { error } = await supabase.from("farm_plan_actual_variances").insert(fullVariance as any);

  if (error && (error.code === "PGRST204" || error.code === "42703" || error.message.includes("column") || error.message.includes("schema cache"))) {
    const fallbackVariance = {
      farm_id: farmId,
      crop_cycle_id: cycleId,
      entity_type: "crop",
      metric_name: metric,
      unit: "kg",
      standard_value: standardValue,
      plan_value: plannedValue,
      actual_value: actualValue,
      farmer_deviation_reason: [rootCause, correctiveAction ? `Action: ${correctiveAction}` : ""].filter(Boolean).join(" | ") || null,
      is_farmer_override: Boolean(rootCause),
    };
    const retry = await supabase.from("farm_plan_actual_variances").insert(fallbackVariance as any);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/account/finance");
  revalidatePath("/account/variance");
}
