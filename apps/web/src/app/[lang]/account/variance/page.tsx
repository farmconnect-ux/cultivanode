import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { recordPlanActualVariance } from "@/actions/farm-finance";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function VariancePage({ params }: Props) {
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

  // Fetch crop cycles for reference
  const { data: cycles } = await supabase
    .from("crop_cycles")
    .select("id, crop_name, variety, farms(name)")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  // Fetch variances
  const { data: variances } = await supabase
    .from("farm_plan_actual_variances")
    .select("*, farms(name), crop_cycles(crop_name, variety)")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  const favorableCount = (variances || []).filter((v) => v.variance_nature === "favorable").length;
  const adverseCount = (variances || []).filter((v) => v.variance_nature === "adverse").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-leaf-900 sm:text-3xl">Standard vs Plan vs Actual Variance</h1>
          <p className="text-xs text-muted mt-1">
            &ldquo;CultivaNode recommends. The farmer decides. The farmer records. CultivaNode learns from the difference.&rdquo;
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Variances Evaluated</p>
          <p className="text-xl font-black text-leaf-900 mt-1">{variances?.length || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-medium text-muted">Favorable Outturns</p>
          <p className="text-xl font-black text-emerald-900 mt-1">{favorableCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-danger-600">
          <p className="text-xs font-medium text-muted">Adverse Deviations</p>
          <p className="text-xl font-black text-danger-900 mt-1">{adverseCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600">
          <p className="text-xs font-medium text-muted">Advisory Adaptation</p>
          <p className="text-sm font-bold text-sky-900 mt-1">Active AI Feedback</p>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Variance Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Field Performance Deviations</h2>
            <Badge tone="default">{variances?.length || 0} Records</Badge>
          </div>

          {(!variances || variances.length === 0) ? (
            <Card className="p-8 text-center border-dashed">
              <span className="text-3xl">⚖️</span>
              <p className="mt-2 text-sm font-bold text-ink">No variance analyses logged yet</p>
              <p className="text-xs text-muted mt-1">
                When harvest or seasonal expenses are finalized, record deviations against agronomic standards and initial targets.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {variances.map((v) => {
                const isFavorable = v.variance_nature === "favorable";
                const isAdverse = v.variance_nature === "adverse";

                return (
                  <Card key={v.id} className="p-4 border border-line space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-ink capitalize">
                          {v.metric.replace(/_/g, " ")} Deviation
                        </span>
                        <p className="text-xs text-muted">
                          Farm: {v.farms?.name} &bull; Cycle: {v.crop_cycles?.crop_name || "General"}
                        </p>
                      </div>
                      <Badge tone={isFavorable ? "leaf" : isAdverse ? "danger" : "default"}>
                        {v.variance_nature.toUpperCase()} ({Number(v.variance_percentage) > 0 ? "+" : ""}
                        {Number(v.variance_percentage).toFixed(1)}%)
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2.5 rounded text-xs">
                      <div>
                        <span className="text-[10px] text-muted block">Standard Advisory</span>
                        <span className="font-bold text-ink">{Number(v.standard_value).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block">Farmer Planned</span>
                        <span className="font-bold text-ink">{Number(v.planned_value).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block">Actual Ground Outturn</span>
                        <span className="font-black text-leaf-900">{Number(v.actual_value).toLocaleString()}</span>
                      </div>
                    </div>

                    {(v.root_cause || v.corrective_action) && (
                      <div className="text-xs text-neutral-600 pt-1 border-t border-line space-y-0.5">
                        {v.root_cause && (
                          <p>
                            <span className="font-semibold text-ink">Root Cause:</span> {v.root_cause}
                          </p>
                        )}
                        {v.corrective_action && (
                          <p>
                            <span className="font-semibold text-ink">Learned Adaptation:</span> {v.corrective_action}
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Record Variance Form */}
        <div>
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Evaluate Performance Variance</h3>
            <p className="text-[11px] text-muted">
              Quantify the divergence between advisory recommendations, initial targets, and field realities.
            </p>

            <form action={recordPlanActualVariance} className="space-y-3">
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
                <label className="block text-xs font-bold text-neutral-700 mb-1">Crop Cycle (Optional)</label>
                <select
                  name="crop_cycle_id"
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">General Enterprise</option>
                  {(cycles || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.crop_name} {c.variety ? `(${c.variety})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Metric Evaluated *</label>
                <select
                  name="metric"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="yield_kg">Harvest Yield (kg)</option>
                  <option value="cost_minor">Production Cost (NGN Minor)</option>
                  <option value="duration_days">Cycle Duration (Days)</option>
                  <option value="fertilizer_kg">Fertilizer Consumption (kg)</option>
                  <option value="seed_kg">Seed Rate (kg)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Standard</label>
                  <input
                    type="number"
                    step="0.01"
                    name="standard_value"
                    required
                    placeholder="GAP base"
                    className="w-full rounded-md border border-line px-2 py-1.5 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Planned</label>
                  <input
                    type="number"
                    step="0.01"
                    name="planned_value"
                    required
                    placeholder="Plan"
                    className="w-full rounded-md border border-line px-2 py-1.5 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Actual *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="actual_value"
                    required
                    placeholder="Actual"
                    className="w-full rounded-md border border-line px-2 py-1.5 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Identified Root Cause</label>
                <textarea
                  name="root_cause"
                  rows={2}
                  placeholder="e.g. Drought spell in July delayed tasseling; higher diesel price increased harrowing cost..."
                  className="w-full rounded-md border border-line px-3 py-1.5 text-xs focus:outline-leaf-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Learned Corrective Action</label>
                <textarea
                  name="corrective_action"
                  rows={2}
                  placeholder="e.g. Shift planting date earlier by 2 weeks next season; install drip irrigation..."
                  className="w-full rounded-md border border-line px-3 py-1.5 text-xs focus:outline-leaf-600"
                />
              </div>

              <Button type="submit" className="w-full bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs py-2">
                ⚖️ Compute & Save Variance
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
