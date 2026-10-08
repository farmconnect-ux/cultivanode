import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { createCropCycle } from "@/actions/crop-plans";

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ farm_id?: string; plot_id?: string; status?: string }>;
}

export default async function CropsPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;
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

  // Fetch plots for these farms
  const { data: plots } = await supabase
    .from("plots")
    .select("id, name, farm_id, size_hectares")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"]);

  // Fetch agronomic advisory standards
  const { data: standards } = await supabase
    .from("farm_agronomic_standards")
    .select("id, crop_name, variety, expected_yield_kg_per_ha, expected_duration_days")
    .order("crop_name");

  // Fetch crop cycles
  let cyclesQuery = supabase
    .from("crop_cycles")
    .select("*, farms(name), plots(name)")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  if (sp.status) {
    cyclesQuery = cyclesQuery.eq("status", sp.status);
  }

  const { data: cycles } = await cyclesQuery;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-leaf-900 sm:text-3xl">Crop Cycles & GAP Advisory</h1>
          <p className="text-xs text-muted mt-1">
            Track seasonal crop growth stages, standard agronomy practices, operations, and yield forecasts.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Total Crop Cycles</p>
          <p className="text-xl font-black text-leaf-900 mt-1">{cycles?.length || 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-medium text-muted">Active in Field</p>
          <p className="text-xl font-black text-emerald-900 mt-1">
            {cycles?.filter((c) => c.status === "active").length || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-harvest-600">
          <p className="text-xs font-medium text-muted">In Planning Phase</p>
          <p className="text-xl font-black text-harvest-900 mt-1">
            {cycles?.filter((c) => c.status === "planning").length || 0}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600">
          <p className="text-xs font-medium text-muted">Total Hectares Planted</p>
          <p className="text-xl font-black text-sky-900 mt-1">
            {(cycles || []).reduce((acc, c) => acc + (Number(c.planted_area_hectares) || 0), 0).toFixed(1)} ha
          </p>
        </Card>
      </div>

      {/* Main Grid: Cycles List & Create Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Cycles Listing */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Active & Planned Seasons</h2>
            <div className="flex items-center gap-1">
              <Link
                href={`/${lang}/account/crops`}
                className={`rounded px-2.5 py-1 text-xs font-bold ${
                  !sp.status ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                }`}
              >
                All
              </Link>
              <Link
                href={`/${lang}/account/crops?status=active`}
                className={`rounded px-2.5 py-1 text-xs font-bold ${
                  sp.status === "active" ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                }`}
              >
                Active
              </Link>
              <Link
                href={`/${lang}/account/crops?status=planning`}
                className={`rounded px-2.5 py-1 text-xs font-bold ${
                  sp.status === "planning" ? "bg-leaf-700 text-white" : "text-muted hover:bg-neutral-100"
                }`}
              >
                Planning
              </Link>
            </div>
          </div>

          {(!cycles || cycles.length === 0) ? (
            <Card className="p-8 text-center border-dashed">
              <span className="text-3xl">🌽</span>
              <p className="mt-2 text-sm font-bold text-ink">No crop cycles found</p>
              <p className="text-xs text-muted mt-1">
                Plan a new season using the advisory standards form to track sowing dates and field operations.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {cycles.map((cycle) => (
                <Card
                  key={cycle.id}
                  className="p-4 border border-line hover:border-leaf-500 transition-colors flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-ink">{cycle.crop_name}</span>
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
                        {cycle.status}
                      </Badge>
                    </div>

                    {cycle.variety && (
                      <p className="text-xs font-medium text-muted">Variety: {cycle.variety}</p>
                    )}

                    <div className="flex items-center justify-between text-xs font-semibold text-leaf-800">
                      <span>{Number(cycle.planted_area_hectares).toFixed(1)} ha</span>
                      <span>Target: {cycle.target_yield_kg ? `${cycle.target_yield_kg.toLocaleString()} kg` : "N/A"}</span>
                    </div>

                    <div className="text-[11px] text-muted">
                      <p>Farm: {cycle.farms?.name || "Unassigned"}</p>
                      <p>Plot: {cycle.plots?.name || "Unassigned"}</p>
                      <p>Planted: {cycle.start_date || "TBD"}</p>
                      {cycle.target_harvest_date && <p>Est. Harvest: {cycle.target_harvest_date}</p>}
                    </div>
                  </div>

                  <div className="border-t border-line pt-2.5 flex items-center justify-between">
                    <Link
                      href={`/${lang}/account/crops/${cycle.id}`}
                      className="text-xs font-bold text-leaf-700 hover:underline"
                    >
                      📋 View Timeline & Logs →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Plan New Cycle Form */}
        <div>
          <Card className="p-5 border border-line shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink">Plan New Crop Cycle</h2>
              <p className="text-xs text-muted mt-0.5">
                Apply CultivaNode agronomic recommendations to seed a structured field calendar.
              </p>
            </div>

            <form action={createCropCycle} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Target Farm *</label>
                <select
                  name="farm_id"
                  required
                  defaultValue={sp.farm_id || ""}
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
                <label className="block text-xs font-bold text-neutral-700 mb-1">Field Plot *</label>
                <select
                  name="plot_id"
                  required
                  defaultValue={sp.plot_id || ""}
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Plot...</option>
                  {(plots || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({Number(p.size_hectares).toFixed(1)} ha)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Advisory Standard (GAP)</label>
                <select
                  name="standard_id"
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">None (Custom Cycle)</option>
                  {(standards || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.crop_name} {s.variety ? `(${s.variety})` : ""} - {s.expected_duration_days} days
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted mt-0.5">
                  Selecting a standard auto-schedules best-practice operations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    name="crop_name"
                    required
                    placeholder="e.g. Maize"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Variety</label>
                  <input
                    type="text"
                    name="variety"
                    placeholder="e.g. SC 719"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Planted Area (ha) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="planted_area_hectares"
                    required
                    placeholder="e.g. 2.0"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Target Yield (kg)</label>
                  <input
                    type="number"
                    step="1"
                    name="target_yield_kg"
                    placeholder="e.g. 9000"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Sowing / Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Target Harvest Date</label>
                  <input
                    type="date"
                    name="target_harvest_date"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs py-2">
                🌽 Create Crop Cycle
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
