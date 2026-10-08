"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { StandardPlanActualEngine } from "@cultivanode/shared";

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createFarmBudget(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const enterpriseName = String(form.get("enterprise_name") || "").trim();
  const season = String(form.get("season") || "").trim();
  const year = parseInt(String(form.get("year") || String(new Date().getFullYear())), 10);
  const plannedRevenueMinor = parseInt(String(form.get("planned_revenue_minor") || "0"), 10);
  const plannedCostMinor = parseInt(String(form.get("planned_cost_minor") || "0"), 10);

  if (!farmId || !enterpriseName) return;

  await supabase.from("farm_budgets").insert({
    farm_id: farmId,
    enterprise_name: enterpriseName,
    season: season || null,
    year,
    planned_revenue_minor: plannedRevenueMinor,
    planned_cost_minor: plannedCostMinor,
  });

  revalidatePath("/account/finance");
}

export async function addBudgetLine(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const budgetId = String(form.get("budget_id") || "").trim();
  const category = String(form.get("category") || "seeds").trim();
  const costType = String(form.get("cost_type") || "variable").trim();
  const description = String(form.get("description") || "").trim();
  const plannedMinor = parseInt(String(form.get("planned_minor") || "0"), 10);

  if (!budgetId || !description || plannedMinor <= 0) return;

  await supabase.from("farm_budget_lines").insert({
    budget_id: budgetId,
    category,
    cost_type: costType,
    description,
    planned_minor: plannedMinor,
    actual_minor: 0,
  });

  revalidatePath("/account/finance");
}

export async function recordPlanActualVariance(form: FormData): Promise<void> {
  const { supabase } = await getAuth();
  const farmId = String(form.get("farm_id") || "").trim();
  const cycleId = String(form.get("crop_cycle_id") || "").trim() || null;
  const metric = String(form.get("metric") || "yield_kg") as any;
  const standardValue = parseFloat(String(form.get("standard_value") || "0"));
  const plannedValue = parseFloat(String(form.get("planned_value") || "0"));
  const actualValue = parseFloat(String(form.get("actual_value") || "0"));
  const rootCause = String(form.get("root_cause") || "").trim();
  const correctiveAction = String(form.get("corrective_action") || "").trim();

  if (!farmId) return;

  const varianceCalc = StandardPlanActualEngine.calculateVariance({
    cropCycleId: cycleId || "generic",
    metric,
    standardValue,
    plannedValue,
    actualValue,
  });

  await supabase.from("farm_plan_actual_variances").insert({
    farm_id: farmId,
    crop_cycle_id: cycleId,
    metric,
    standard_value: standardValue,
    planned_value: plannedValue,
    actual_value: actualValue,
    variance_percentage: varianceCalc.percentageVariance,
    variance_nature: varianceCalc.assessment,
    root_cause: rootCause || null,
    corrective_action: correctiveAction || null,
  });

  revalidatePath("/account/variance");
}
