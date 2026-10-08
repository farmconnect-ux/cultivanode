import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { createFarmBudget, addBudgetLine } from "@/actions/farm-finance";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function FarmFinancePage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang as Locale);
  const supabase = await createClient();

  // Fetch farmer's farms
  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name")
    .or(scope.join(","))
    .order("name");

  const farmIds = (farms || []).map((f) => f.id);

  // Fetch budgets
  const { data: budgets } = await supabase
    .from("farm_budgets")
    .select("*, farms(name)")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  const budgetIds = (budgets || []).map((b) => b.id);

  // Fetch budget lines
  const { data: budgetLines } = await supabase
    .from("farm_budget_lines")
    .select("*")
    .in("budget_id", budgetIds.length > 0 ? budgetIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at");

  // Totals
  const totalPlannedRevenueMinor = (budgets || []).reduce((acc, b) => acc + (b.planned_revenue_minor || 0), 0);
  const totalPlannedCostMinor = (budgets || []).reduce((acc, b) => acc + (b.planned_cost_minor || 0), 0);
  const projectedGrossMarginMinor = totalPlannedRevenueMinor - totalPlannedCostMinor;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-leaf-900 sm:text-3xl">Farm Budgets & Accounts</h1>
          <p className="text-xs text-muted mt-1">
            Enterprise financial planning, cost-of-production breakdowns, and gross profit forecasts.
          </p>
        </div>
        <Link
          href={`/${lang}/account/variance`}
          className="rounded-lg bg-leaf-700 px-3 py-2 text-xs font-bold text-white hover:bg-leaf-800 transition-colors"
        >
          ⚖️ View Variance Analysis →
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Active Budgets</p>
          <p className="text-xl font-black text-leaf-900 mt-1">{budgets?.length || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-medium text-muted">Projected Revenue</p>
          <p className="text-lg font-black text-emerald-900 mt-1">
            ₦{(totalPlannedRevenueMinor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-harvest-600">
          <p className="text-xs font-medium text-muted">Planned Expenditure</p>
          <p className="text-lg font-black text-harvest-900 mt-1">
            ₦{(totalPlannedCostMinor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <p className="text-xs font-medium text-muted">Projected Net Margin</p>
          <p className="text-lg font-black text-indigo-900 mt-1">
            ₦{(projectedGrossMarginMinor / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
          </p>
        </Card>
      </div>

      {/* Main Grid: Budgets & Forms */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Budgets List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Enterprise Seasonal Budgets</h2>
            <Badge tone="leaf">{budgets?.length || 0} Registered</Badge>
          </div>

          {(!budgets || budgets.length === 0) ? (
            <Card className="p-8 text-center border-dashed">
              <span className="text-3xl">💰</span>
              <p className="mt-2 text-sm font-bold text-ink">No enterprise budgets created</p>
              <p className="text-xs text-muted mt-1">
                Establish budgets to model direct seeds, fertilizers, tractor hire costs, and projected crop revenues.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const lines = (budgetLines || []).filter((l) => l.budget_id === b.id);
                const marginMinor = (b.planned_revenue_minor || 0) - (b.planned_cost_minor || 0);

                return (
                  <Card key={b.id} className="p-4 border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-ink">{b.enterprise_name}</h3>
                        <p className="text-xs text-muted">
                          Farm: {b.farms?.name} &bull; Season: {b.season || "General"} {b.year}
                        </p>
                      </div>
                      <Badge tone={marginMinor >= 0 ? "leaf" : "danger"}>
                        {marginMinor >= 0 ? "+ Profit Target" : "Deficit"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-muted block text-[10px]">Planned Revenue</span>
                        <span className="font-bold text-emerald-800">
                          ₦{((b.planned_revenue_minor || 0) / 100).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">Planned Costs</span>
                        <span className="font-bold text-harvest-800">
                          ₦{((b.planned_cost_minor || 0) / 100).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">Net Operating Target</span>
                        <span className="font-black text-ink">
                          ₦{(marginMinor / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Lines */}
                    {lines.length > 0 && (
                      <div className="border-t border-line pt-2">
                        <p className="text-[11px] font-bold text-neutral-600 mb-1.5">Cost Line Items</p>
                        <div className="space-y-1">
                          {lines.map((line) => (
                            <div key={line.id} className="flex items-center justify-between text-xs">
                              <span className="text-neutral-700">
                                {line.description} <span className="text-muted text-[10px]">({line.category})</span>
                              </span>
                              <span className="font-semibold text-ink">
                                ₦{((line.planned_minor || 0) / 100).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Forms */}
        <div className="space-y-6">
          {/* Create Budget Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Create Enterprise Budget</h3>
            <form action={createFarmBudget} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Target Farm *</label>
                <select
                  name="farm_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Farm...</option>
                  {(farms || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Enterprise Name *</label>
                <input
                  type="text"
                  name="enterprise_name"
                  required
                  placeholder="e.g. Grain Maize Commercial 2026"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Season</label>
                  <input
                    type="text"
                    name="season"
                    placeholder="e.g. Major Wet"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Year</label>
                  <input
                    type="number"
                    name="year"
                    defaultValue={new Date().getFullYear()}
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Rev Target (Minor)</label>
                  <input
                    type="number"
                    name="planned_revenue_minor"
                    placeholder="e.g. 500000000"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Cost Cap (Minor)</label>
                  <input
                    type="number"
                    name="planned_cost_minor"
                    placeholder="e.g. 300000000"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs py-2">
                💰 Create Budget
              </Button>
            </form>
          </Card>

          {/* Add Line Item Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Add Cost Line Item</h3>
            <form action={addBudgetLine} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Select Budget *</label>
                <select
                  name="budget_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Budget...</option>
                  {(budgets || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.enterprise_name} ({b.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Category *</label>
                  <select
                    name="category"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="seeds">Seeds / Germplasm</option>
                    <option value="fertilizer">Fertilizers</option>
                    <option value="chemicals">Crop Protection</option>
                    <option value="machinery_hire">Machinery & Fuel</option>
                    <option value="labour">Casual Labour</option>
                    <option value="overhead">Overhead / Rent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Cost Type</label>
                  <select
                    name="cost_type"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="variable">Variable</option>
                    <option value="fixed">Fixed Overhead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Description *</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="e.g. 20 Bags of NPK 15:15:15"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Planned Amount (NGN Minor) *</label>
                <input
                  type="number"
                  name="planned_minor"
                  required
                  placeholder="e.g. 70000000 (700,000 NGN)"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <Button type="submit" className="w-full bg-harvest-700 hover:bg-harvest-800 text-white font-bold text-xs py-2">
                ➕ Add Line Item
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
