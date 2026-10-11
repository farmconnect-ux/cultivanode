import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { FarmBooks } from "@/components/screens/farm-books";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  createFarmBudget,
  addBudgetLine,
  recordPlanActualVariance,
} from "@/actions/farm-finance";

export const metadata: Metadata = { title: "Farm books & accounting" };

export default async function Page({ params }: PageProps<"/[lang]/account/finance">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, state, lga")
    .or(scope.join(","))
    .order("created_at");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: cycles } = farmIds.length
    ? await supabase
        .from("crop_cycles")
        .select("id, farm_id, crop_name, variety, season, status")
        .in("farm_id", farmIds)
    : { data: [] };
  const cycleList = cycles ?? [];

  const { data: budgets } = farmIds.length
    ? await supabase
        .from("farm_budgets")
        .select("id, farm_id, enterprise_name, season, year, planned_revenue_minor, planned_cost_minor, created_at")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const budgetList = budgets ?? [];
  const budgetIds = budgetList.map((b) => b.id);

  const { data: budgetLines } = budgetIds.length
    ? await supabase
        .from("farm_budget_lines")
        .select("id, budget_id, category, cost_type, description, planned_minor, actual_minor, created_at")
        .in("budget_id", budgetIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const lineList = budgetLines ?? [];

  const { data: variances } = farmIds.length
    ? await supabase
        .from("farm_plan_actual_variances")
        .select("id, farm_id, crop_cycle_id, metric, standard_value, planned_value, actual_value, variance_percentage, variance_nature, root_cause, corrective_action, created_at")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const varianceList = variances ?? [];
  const hasLiveFinances = budgetList.length > 0 || lineList.length > 0;

  // KPI calculations
  const totalPlannedRevenueNaira = Math.round(budgetList.reduce((s, b) => s + (b.planned_revenue_minor || 0), 0) / 100);
  const totalPlannedCostNaira = Math.round(budgetList.reduce((s, b) => s + (b.planned_cost_minor || 0), 0) / 100);
  const totalActualCostNaira = Math.round(lineList.reduce((s, l) => s + (l.actual_minor || 0), 0) / 100);
  const netEstimatedMarginNaira = totalPlannedRevenueNaira - totalPlannedCostNaira;
  const marginPercent = totalPlannedRevenueNaira > 0
    ? Math.round((netEstimatedMarginNaira / totalPlannedRevenueNaira) * 100)
    : 0;

  const modalCreateBudget = (
    <div className="bg-surface-container-lowest max-w-lg w-full rounded-xl p-space-lg shadow-xl space-y-space-md text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="account_balance" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-primary font-bold">New Enterprise Budget</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Set revenue targets and expenditure limits</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={createFarmBudget} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Target Farm <span className="text-error">*</span>
          </label>
          <select
            name="farm_id"
            required
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          >
            {farmList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Enterprise Name / Crop Enterprise <span className="text-error">*</span>
          </label>
          <input
            name="enterprise_name"
            required
            placeholder="e.g. Plot A Hybrid Maize (18 Ha)"
            type="text"
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Season</label>
            <input
              name="season"
              defaultValue="Early Rains 2026"
              type="text"
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Fiscal Year</label>
            <input
              name="year"
              defaultValue={new Date().getFullYear()}
              type="number"
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Planned Revenue (₦)</label>
            <input
              name="planned_revenue_minor"
              placeholder="e.g. 485000000"
              defaultValue="485000000"
              type="number"
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            />
            <span className="text-[11px] text-on-surface-variant">In minor kobo (₦4,850,000)</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Planned Budget Cap (₦)</label>
            <input
              name="planned_cost_minor"
              placeholder="e.g. 180000000"
              defaultValue="180000000"
              type="number"
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            />
            <span className="text-[11px] text-on-surface-variant">In minor kobo (₦1,800,000)</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-space-sm pt-4 border-t border-surface-container-high">
          <ScreenDialogClose>
            <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="submit">
            Create Enterprise Budget
          </button>
        </div>
      </form>
    </div>
  );

  const modalAddLine = (
    <div className="bg-surface-container-lowest max-w-lg w-full rounded-xl p-space-lg shadow-xl space-y-space-md text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="add_card" className="text-secondary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Add Budget Line Item</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Allocate operational expenses to enterprise budgets</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={addBudgetLine} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Enterprise Budget <span className="text-error">*</span>
          </label>
          <select
            name="budget_id"
            required
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          >
            {budgetList.length === 0 ? (
              <option value="">No budgets created yet (Create budget first)</option>
            ) : (
              budgetList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.enterprise_name} ({b.season || b.year})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Category</label>
            <select
              name="category"
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            >
              <option value="Machinery">Machinery Hire / Diesel</option>
              <option value="Inputs">Seeds &amp; Fertilizer</option>
              <option value="Labour">Manual Field Labour</option>
              <option value="Vet">Veterinary &amp; Feed</option>
              <option value="Logistics">Haulage &amp; Logistics</option>
              <option value="Other">Other Operational Cost</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Cost Nature</label>
            <select
              name="cost_type"
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            >
              <option value="variable">Variable Cost (Per Ha / Unit)</option>
              <option value="fixed">Fixed Overhead Cost</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Description <span className="text-error">*</span>
          </label>
          <input
            name="description"
            required
            placeholder="e.g. Indorama Urea 46% Top-Dressing Plot B"
            type="text"
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Planned Budget (Kobo)</label>
            <input
              name="planned_minor"
              defaultValue="5000000"
              placeholder="5000000 (= ₦50,000)"
              type="number"
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Actual Disbursed (Kobo)</label>
            <input
              name="actual_minor"
              defaultValue="4800000"
              placeholder="4800000 (= ₦48,000)"
              type="number"
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-space-sm pt-4 border-t border-surface-container-high">
          <ScreenDialogClose>
            <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <button className="px-space-md py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold" type="submit">
            Save Budget Line
          </button>
        </div>
      </form>
    </div>
  );

  const modalLogVariance = (
    <div className="bg-surface-container-lowest max-w-lg w-full rounded-xl p-space-lg shadow-xl space-y-space-md text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="balance" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Record Agronomic Variance</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Calibrate yield, fertilizer rate or labour deviation</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={recordPlanActualVariance} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Target Farm <span className="text-error">*</span>
          </label>
          <select
            name="farm_id"
            required
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          >
            {farmList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {cycleList.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Associated Crop Cycle</label>
            <select
              name="crop_cycle_id"
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            >
              <option value="">None / Cluster-Wide</option>
              {cycleList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} ({c.variety || c.season})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Agronomic Metric</label>
          <select
            name="metric"
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          >
            <option value="yield_kg">Harvested Yield (kg / Ha)</option>
            <option value="nitrogen_kg">Nitrogen Dosage Rate (kg N/Ha)</option>
            <option value="tillage_cost_kobo">Mechanized Tillage Cost (₦)</option>
            <option value="feed_fcr">Feed Conversion Ratio (FCR)</option>
            <option value="mortality_rate">Flock / Pond Mortality (%)</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-on-surface mb-1">Standard Ref</label>
            <input
              name="standard_value"
              defaultValue="3000"
              step="0.01"
              type="number"
              className="w-full h-10 px-2 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface mb-1">Planned Target</label>
            <input
              name="planned_value"
              defaultValue="2800"
              step="0.01"
              type="number"
              className="w-full h-10 px-2 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface mb-1">Actual Measured</label>
            <input
              name="actual_value"
              defaultValue="2950"
              step="0.01"
              type="number"
              className="w-full h-10 px-2 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Root Cause / Agronomic Driver</label>
          <input
            name="root_cause"
            placeholder="e.g. Split-nitrogen application timed precisely before 40mm rainfall window"
            type="text"
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Corrective Action Taken</label>
          <input
            name="corrective_action"
            placeholder="e.g. Adopted 3-split urea dosage instead of 2-split default"
            type="text"
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-space-sm pt-4 border-t border-surface-container-high">
          <ScreenDialogClose>
            <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="submit">
            Log Calibration Variance
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      {!hasLiveFinances && (
        <LiveStrip tone="preview">
          Viewing sample farm books. Create your first enterprise budget or record an expense to initialize live audited ledgering.
        </LiveStrip>
      )}

      <FarmBooks
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog title="New Enterprise Budget" side="center" panel={modalCreateBudget}>
                <button
                  className="flex items-center gap-space-xs px-space-md py-space-sm bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary-container transition-all"
                  type="button"
                >
                  <Icon name="account_balance" className="text-base" />
                  <span>Create Budget</span>
                </button>
              </ScreenDialog>

              <ScreenDialog title="Add Budget Line Item" side="center" panel={modalAddLine}>
                <button
                  className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container transition-all"
                  type="button"
                >
                  <Icon name="add_card" className="text-base text-secondary" />
                  <span>Log Expense Line</span>
                </button>
              </ScreenDialog>

              <ScreenDialog title="Record Agronomic Variance" side="center" panel={modalLogVariance}>
                <button
                  className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-lowest text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container-low transition-all"
                  type="button"
                >
                  <Icon name="balance" className="text-base text-primary" />
                  <span>Log Variance</span>
                </button>
              </ScreenDialog>
            </div>
          ),

          kpis: hasLiveFinances ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Planned Revenue
                  </span>
                  <div className="p-2 rounded-lg bg-surface-container text-secondary">
                    <Icon name="trending_up" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-primary font-bold">
                    ₦{totalPlannedRevenueNaira.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-body-sm text-body-sm text-secondary font-semibold">
                      {budgetList.length} Active Budget(s)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-secondary h-1.5 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Actual Disbursed OPEX
                  </span>
                  <div className="p-2 rounded-lg bg-surface-container text-tertiary">
                    <Icon name="account_balance_wallet" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-on-surface font-bold">
                    ₦{totalActualCostNaira.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Cap: ₦{totalPlannedCostNaira.toLocaleString()} limit
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>Burn Rate</span>
                  <span className="font-semibold text-secondary">
                    {totalPlannedCostNaira > 0
                      ? `${Math.round((totalActualCostNaira / totalPlannedCostNaira) * 100)}% Deployed`
                      : "0% Deployed"}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Net Projected Margin
                  </span>
                  <div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container">
                    <Icon name="percent" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-secondary font-bold">
                    {marginPercent}%
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                      ₦{netEstimatedMarginNaira.toLocaleString()}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Est. Profit</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-label-sm text-label-sm text-secondary font-medium">
                  <Icon name="arrow_upward" className="text-sm" />
                  <span>Audited Standard Plan</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Recorded Entries
                  </span>
                  <div className="p-2 rounded-lg bg-surface-container text-primary">
                    <Icon name="gavel" />
                  </div>
                </div>
                <div>
                  <div className="font-metric-num text-metric-num text-on-surface font-bold">
                    {lineList.length + varianceList.length} Entries
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {lineList.length} Lines · {varianceList.length} Variances
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
                    <Icon name="verified" className="text-xs" /> Micro-Ledger Active
                  </span>
                </div>
              </div>
            </div>
          ) : undefined,

          enterprises: budgetList.length > 0 ? (
            <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Enterprise &amp; Field Profitability</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Gross margin contribution segregated by arable plot &amp; livestock unit</p>
                </div>
                <span className="px-space-sm py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-medium">
                  {budgetList.length} Monitored Unit(s)
                </span>
              </div>
              <div className="space-y-space-sm">
                {budgetList.map((budget) => {
                  const revNaira = Math.round(budget.planned_revenue_minor / 100);
                  const costNaira = Math.round(budget.planned_cost_minor / 100);
                  const netNaira = revNaira - costNaira;
                  const pct = revNaira > 0 ? Math.round((netNaira / revNaira) * 100) : 0;

                  return (
                    <div
                      key={budget.id}
                      className="p-space-md bg-surface-container-low rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md hover:bg-surface-container transition-colors"
                    >
                      <div className="flex items-center gap-space-md">
                        <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                          <Icon name="grain" className="text-2xl" />
                        </div>
                        <div>
                          <div className="flex items-center gap-space-xs">
                            <span className="font-label-lg text-label-lg text-on-surface font-bold">{budget.enterprise_name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary-container text-on-secondary-container">
                              {budget.season || budget.year}
                            </span>
                          </div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                            <span>Cost Cap: ₦{costNaira.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right sm:flex flex-col items-end">
                        <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                          ₦{revNaira.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                          <span>Net: <strong className="text-primary">+₦{netNaira.toLocaleString()}</strong></span>
                          <span className="text-secondary font-bold">({pct}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : undefined,

          ledger: (lineList.length > 0 || varianceList.length > 0) ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col space-y-space-md" id="ledger-section">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Append-Only Transaction Ledger</h2>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-bold">
                      {lineList.length + varianceList.length} Records
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Immutable double-entry book balancing cash, bank slip, and direct syndication records.
                  </p>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      <th className="py-3 px-4 rounded-l-lg">Date &amp; ID</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description / Reference</th>
                      <th className="py-3 px-4 text-right">Planned (₦)</th>
                      <th className="py-3 px-4 text-right">Actual (₦)</th>
                      <th className="py-3 px-4 text-center rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm divide-y-0" id="ledgerBody">
                    {lineList.map((line) => {
                      const plannedNaira = Math.round(line.planned_minor / 100);
                      const actualNaira = Math.round(line.actual_minor / 100);

                      return (
                        <tr
                          key={line.id}
                          className="ledger-row bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-label-md text-label-md font-bold text-on-surface">
                              {formatDate(line.created_at, lang)}
                            </div>
                            <span className="font-mono text-label-sm text-on-surface-variant">
                              #{line.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-md bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                              {line.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface font-medium">
                            {line.description}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-on-surface-variant">
                            ₦{plannedNaira.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-on-surface">
                            ₦{actualNaira.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                              <span className="w-2 h-2 rounded-full bg-secondary" /> Micro-Ledger Sealed
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : undefined,
        }}
      />
    </>
  );
}
