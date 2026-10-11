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

  const { error } = await supabase.from("farm_budgets").insert({
    farm_id: farmId,
    enterprise_name: enterpriseName,
    season,
    year,
    planned_revenue_minor: plannedRevenueMinor,
    planned_cost_minor: plannedCostMinor,
  });

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

  const { error } = await supabase.from("farm_budget_lines").insert({
    budget_id: budgetId,
    category,
    cost_type: costType,
    description,
    planned_minor: plannedMinor,
    actual_minor: actualMinor,
  });

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

  const { error } = await supabase.from("farm_plan_actual_variances").insert({
    farm_id: farmId,
    crop_cycle_id: cycleId,
    metric,
    standard_value: standardValue,
    planned_value: plannedValue,
    actual_value: actualValue,
    variance_percentage: variancePercentage,
    variance_nature: varianceNature,
    root_cause: rootCause,
    corrective_action: correctiveAction,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/account/finance");
  revalidatePath("/account/variance");
}
