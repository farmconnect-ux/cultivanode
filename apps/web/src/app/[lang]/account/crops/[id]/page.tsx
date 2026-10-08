import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { logCropOperation, logCropObservation } from "@/actions/crop-plans";

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
    .select("*, farms(name), plots(name, size_hectares)")
    .eq("id", id)
    .single();

  if (!cycle) notFound();

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
            <span className="font-semibold text-ink">{cycle.crop_name}</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-leaf-900 sm:text-3xl">
            {cycle.crop_name} {cycle.variety ? `(${cycle.variety})` : ""}
          </h1>
          <p className="text-xs text-muted">
            Farm: <span className="font-semibold text-ink">{cycle.farms?.name}</span> &bull; Plot:{" "}
            <span className="font-semibold text-ink">{cycle.plots?.name}</span> &bull;{" "}
            {Number(cycle.planted_area_hectares).toFixed(1)} ha
          </p>
        </div>

        <Badge
          tone={
            cycle.status === "active"
              ? "leaf"
              : cycle.status === "planning"
              ? "warning"
              : cycle.status === "completed"
              ? "default"
              : "danger"
          }
        >
          {cycle.status.toUpperCase()}
        </Badge>
      </div>

      {/* Cycle Key Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Planted Date</p>
          <p className="text-base font-bold text-ink mt-1">{cycle.start_date || "Not set"}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-harvest-600">
          <p className="text-xs font-medium text-muted">Target Harvest</p>
          <p className="text-base font-bold text-ink mt-1">{cycle.target_harvest_date || "Not set"}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-medium text-muted">Target Yield</p>
          <p className="text-base font-bold text-emerald-900 mt-1">
            {cycle.target_yield_kg ? `${cycle.target_yield_kg.toLocaleString()} kg` : "N/A"}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600">
          <p className="text-xs font-medium text-muted">Actual Harvested</p>
          <p className="text-base font-bold text-sky-900 mt-1">
            {cycle.actual_yield_kg ? `${cycle.actual_yield_kg.toLocaleString()} kg` : "In Progress"}
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
                {operations.map((op) => (
                  <Card key={op.id} className="p-3.5 border border-line flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">{op.operation_type}</span>
                        <Badge tone={op.status === "completed" ? "leaf" : "warning"}>{op.status}</Badge>
                      </div>
                      <p className="text-xs text-muted">Scheduled: {op.scheduled_date}</p>
                      {op.notes && <p className="text-xs text-neutral-500 italic">{op.notes}</p>}
                    </div>

                    {op.status !== "completed" && (
                      <form action={logCropOperation}>
                        <input type="hidden" name="crop_cycle_id" value={cycle.id} />
                        <input type="hidden" name="operation_type" value={op.operation_type} />
                        <input type="hidden" name="scheduled_date" value={op.scheduled_date} />
                        <input
                          type="hidden"
                          name="completed_date"
                          value={new Date().toISOString().split("T")[0]}
                        />
                        <button
                          type="submit"
                          className="rounded bg-leaf-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-leaf-700"
                        >
                          ✓ Mark Done
                        </button>
                      </form>
                    )}
                  </Card>
                ))}
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

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Direct Cost (NGN Minor)</label>
                <input
                  type="number"
                  name="direct_cost_minor"
                  placeholder="e.g. 5000000 (50k NGN)"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Notes / Inputs Used</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. 4 bags of NPK 15:15:15 applied"
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
