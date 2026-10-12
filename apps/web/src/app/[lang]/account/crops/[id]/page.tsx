import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import {
  logCropOperation,
  logCropObservation,
  adoptAdvisoryInputs,
  updateOperationPlannedInputs,
} from "@/actions/crop-plans";

interface Props {
  params: Promise<{ lang: string; id: string }>;
}

export default async function CropDetailPage({ params }: Props) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang as Locale);
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("crop_cycles")
    .select("*, farms(name), plots(name, area_ha)")
    .eq("id", id)
    .single();

  if (!cycle) notFound();

  const rawCycle = cycle as any;
  const cropName = rawCycle.crop_name || (rawCycle.crop_id ? rawCycle.crop_id.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : "Crop");
  const variety = rawCycle.variety || rawCycle.variety_id || "";
  const farmName = rawCycle.farms?.name || "Farm";
  const plotName = rawCycle.plots?.name || "Whole Farm";
  const plantedArea = Number(rawCycle.planted_area_hectares ?? rawCycle.target_area_ha ?? 1);
  const startDate = rawCycle.start_date || rawCycle.planting_date || "Not set";
  const targetHarvestDate = rawCycle.target_harvest_date || rawCycle.expected_harvest_date || "Not set";

  // Fetch operations
  const { data: operations } = await supabase
    .from("crop_cycle_operations")
    .select("*")
    .eq("crop_cycle_id", id)
    .order("scheduled_date");

  // Fetch observations
  const { data: observations } = await supabase
    .from("crop_observations")
    .select("*")
    .eq("crop_cycle_id", id)
    .order("observed_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href={`/${lang}/account/crops`} className="hover:underline">
              ← Back to Crop Cycles
            </Link>
            <span>/</span>
            <span className="font-semibold text-ink">{cropName}</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-leaf-900 sm:text-3xl">
            {cropName} {variety ? `(${variety})` : ""}
          </h1>
          <p className="text-xs text-muted">
            Farm: <span className="font-semibold text-ink">{farmName}</span> &bull; Plot:{" "}
            <span className="font-semibold text-ink">{plotName}</span> &bull;{" "}
            {plantedArea.toFixed(1)} ha
          </p>
        </div>

        <Badge
          tone={
            rawCycle.status === "active"
              ? "leaf"
              : rawCycle.status === "planning"
              ? "warning"
              : rawCycle.status === "completed"
              ? "default"
              : "danger"
          }
        >
          {String(rawCycle.status || "planning").toUpperCase()}
        </Badge>
      </div>

      {/* Cycle Key Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Planted Date</p>
          <p className="text-base font-bold text-ink mt-1">{startDate}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-harvest-600">
          <p className="text-xs font-medium text-muted">Target Harvest</p>
          <p className="text-base font-bold text-ink mt-1">{targetHarvestDate}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-medium text-muted">Target Yield</p>
          <p className="text-base font-bold text-emerald-900 mt-1">
            {rawCycle.target_yield_kg ? `${Number(rawCycle.target_yield_kg).toLocaleString()} kg` : "N/A"}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600">
          <p className="text-xs font-medium text-muted">Actual Harvested</p>
          <p className="text-base font-bold text-sky-900 mt-1">
            {rawCycle.actual_yield_kg ? `${Number(rawCycle.actual_yield_kg).toLocaleString()} kg` : "In Progress"}
          </p>
        </Card>
      </div>

      {/* Operations & Scouting Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Operations Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Operations List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Operations & Agronomic Activities</h2>
              <Badge tone="leaf">{operations?.length || 0} Scheduled</Badge>
            </div>

            {(!operations || operations.length === 0) ? (
              <Card className="p-6 text-center border-dashed">
                <p className="text-xs text-muted">No operations scheduled yet for this cycle.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {operations.map((op) => {
                  const required = (op as any).required_inputs as Array<{ itemName: string; recommendedQuantity?: number; quantity?: number; unit: string }> | undefined;
                  const planned = (op as any).planned_inputs as Array<{ itemName: string; recommendedQuantity?: number; quantity?: number; unit: string }> | undefined;
                  const hasRequired = Array.isArray(required) && required.length > 0;
                  const hasPlanned = Array.isArray(planned) && planned.length > 0;

                  return (
                    <Card key={op.id} className="p-4 border border-line space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-ink">{op.name || op.operation_type}</span>
                            <Badge tone={op.status === "completed" ? "leaf" : "warning"}>{op.status}</Badge>
                            {op.stage && (
                              <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                                {op.stage}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted">Scheduled: {op.scheduled_date}</p>
                        </div>

                        {op.status !== "completed" && (
                          <form action={logCropOperation}>
                            <input type="hidden" name="crop_cycle_id" value={cycle.id} />
                            <input type="hidden" name="operation_id" value={op.id} />
                            <input type="hidden" name="operation_type" value={op.operation_type} />
                            <input type="hidden" name="scheduled_date" value={op.scheduled_date} />
                            <input
                              type="hidden"
                              name="completed_date"
                              value={new Date().toISOString().split("T")[0]}
                            />
                            <button
                              type="submit"
                              className="rounded bg-leaf-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-leaf-700 transition-colors shadow-xs"
                            >
                              ✓ Mark Done
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Side-by-side Advisory vs Farmer Plan */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-line">
                        {/* 1. Advisory Benchmark (Guidance / Advice) */}
                        <div className="rounded-lg bg-amber-50/80 border border-amber-200/90 p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-900 flex items-center gap-1">
                              💡 Advisory Benchmark
                            </span>
                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide bg-amber-100 px-1.5 py-0.5 rounded">
                              Advice Only
                            </span>
                          </div>
                          {hasRequired ? (
                            <ul className="text-xs text-amber-950 space-y-1 pt-1">
                              {required!.map((inp, idx) => (
                                <li key={idx} className="flex items-center justify-between font-medium">
                                  <span>{inp.itemName}</span>
                                  <span className="font-bold text-amber-900">
                                    {inp.recommendedQuantity ?? inp.quantity} {inp.unit}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-amber-800 italic pt-1">
                              Standard schedule has no specific chemical or fertilizer benchmark for this step.
                            </p>
                          )}
                        </div>

                        {/* 2. Farmer's Planned Input (Self-Determined Decision) */}
                        <div className="rounded-lg bg-emerald-50/80 border border-emerald-200/90 p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-900 flex items-center gap-1">
                              📋 Farmer's Planned Input
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide bg-emerald-100 px-1.5 py-0.5 rounded">
                              Your Plan
                            </span>
                          </div>

                          {hasPlanned ? (
                            <div className="space-y-1 pt-1">
                              <ul className="text-xs text-emerald-950 space-y-1">
                                {planned!.map((inp, idx) => (
                                  <li key={idx} className="flex items-center justify-between font-medium">
                                    <span>{inp.itemName}</span>
                                    <span className="font-bold text-emerald-900">
                                      {inp.quantity ?? inp.recommendedQuantity} {inp.unit}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex items-center justify-end pt-1">
                                <form action={updateOperationPlannedInputs}>
                                  <input type="hidden" name="crop_cycle_id" value={cycle.id} />
                                  <input type="hidden" name="operation_id" value={op.id} />
                                  <button
                                    type="submit"
                                    className="text-[11px] text-neutral-500 hover:text-danger-700 underline"
                                  >
                                    Reset Plan
                                  </button>
                                </form>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 pt-1">
                              <p className="text-[11px] text-emerald-800 italic">
                                No custom inputs entered yet. You can follow the advisory benchmark or enter your own inputs.
                              </p>
                              {hasRequired && (
                                <form action={adoptAdvisoryInputs}>
                                  <input type="hidden" name="crop_cycle_id" value={cycle.id} />
                                  <input type="hidden" name="operation_id" value={op.id} />
                                  <button
                                    type="submit"
                                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                                  >
                                    + Follow Advisory Benchmark
                                  </button>
                                </form>
                              )}
                            </div>
                          )}

                          {/* Inline Custom Input Entry Form */}
                          <details className="text-[11px] text-neutral-600 pt-1">
                            <summary className="cursor-pointer font-semibold text-emerald-800 hover:underline">
                              ✏️ Customize Farmer's Planned Input
                            </summary>
                            <form action={updateOperationPlannedInputs} className="mt-2 space-y-2 bg-surface p-2 rounded border border-line">
                              <input type="hidden" name="crop_cycle_id" value={cycle.id} />
                              <input type="hidden" name="operation_id" value={op.id} />
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Input Item Name</label>
                                <input
                                  type="text"
                                  name="item_name"
                                  required
                                  placeholder="e.g. NPK 20:10:10 or Organic Poultry Manure"
                                  className="w-full rounded border border-line px-2 py-1 text-xs"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Quantity</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    name="quantity"
                                    required
                                    placeholder="e.g. 150"
                                    className="w-full rounded border border-line px-2 py-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Unit</label>
                                  <input
                                    type="text"
                                    name="unit"
                                    defaultValue="kg"
                                    className="w-full rounded border border-line px-2 py-1 text-xs"
                                  />
                                </div>
                              </div>
                              <button
                                type="submit"
                                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-1 rounded"
                              >
                                Save Custom Plan
                              </button>
                            </form>
                          </details>
                        </div>
                      </div>

                      {op.notes && (
                        <p className="text-[11px] text-neutral-500 italic pt-1 border-t border-line/40">
                          {op.notes}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Observations List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Field Observations & Scouting</h2>
              <Badge tone="default">{observations?.length || 0} Recorded</Badge>
            </div>

            {(!observations || observations.length === 0) ? (
              <Card className="p-6 text-center border-dashed">
                <p className="text-xs text-muted">No scouting observations recorded yet.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {observations.map((obs) => (
                  <Card key={obs.id} className="p-3.5 border border-line space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">{obs.title}</span>
                      <Badge
                        tone={
                          obs.severity === "high" || obs.severity === "critical"
                            ? "danger"
                            : obs.severity === "medium"
                            ? "warning"
                            : "default"
                        }
                      >
                        {obs.severity} severity
                      </Badge>
                    </div>
                    {obs.description && <p className="text-xs text-neutral-600">{obs.description}</p>}
                    {obs.recommended_action && (
                      <p className="text-xs font-semibold text-leaf-800">
                        Action: {obs.recommended_action}
                      </p>
                    )}
                    <p className="text-[10px] text-muted">{new Date(obs.observed_at).toLocaleDateString()}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Forms for Operation & Scouting */}
        <div className="space-y-6">
          {/* Add Operation Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Log Field Operation</h3>
            <form action={logCropOperation} className="space-y-3">
              <input type="hidden" name="crop_cycle_id" value={cycle.id} />
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Activity *</label>
                <input
                  type="text"
                  name="operation_type"
                  required
                  placeholder="e.g. Basal fertilizer application"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  name="scheduled_date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Input Item (Optional)</label>
                  <input
                    type="text"
                    name="input_item"
                    placeholder="e.g. NPK 15:15:15 or Compost"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Qty</label>
                  <input
                    type="number"
                    step="0.1"
                    name="input_quantity"
                    placeholder="e.g. 100"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Unit</label>
                  <input
                    type="text"
                    name="input_unit"
                    defaultValue="kg"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Direct Cost (NGN Minor)</label>
                  <input
                    type="number"
                    name="direct_cost_minor"
                    placeholder="e.g. 5000000 (50k NGN)"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Notes / Observations</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. 2 bags applied along ridges after morning rain"
                  className="w-full rounded-md border border-line px-3 py-1.5 text-xs focus:outline-leaf-600"
                />
              </div>

              <Button type="submit" className="w-full bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs py-2">
                ➕ Add Operation
              </Button>
            </form>
          </Card>

          {/* Add Scouting Observation Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Record Field Observation</h3>
            <form action={logCropObservation} className="space-y-3">
              <input type="hidden" name="crop_cycle_id" value={cycle.id} />
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Fall Armyworm detected in block B"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Type</label>
                  <select
                    name="observation_type"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="pest">Pest</option>
                    <option value="disease">Disease</option>
                    <option value="weed">Weed Pressure</option>
                    <option value="soil">Soil / Moisture</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Severity</label>
                  <select
                    name="severity"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Action Taken / Recommended</label>
                <input
                  type="text"
                  name="recommended_action"
                  placeholder="e.g. Spray Emamectin benzoate within 24h"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <Button type="submit" className="w-full bg-harvest-700 hover:bg-harvest-800 text-white font-bold text-xs py-2">
                🔍 Save Observation
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
