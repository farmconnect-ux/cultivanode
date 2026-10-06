import { notFound } from "next/navigation";
import Link from "next/link";
import { formatNaira, getCropById } from "@cultivanode/shared";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export default async function CropManagementDashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const supabase = await createClient();

  // Query crop cycles with plot, farm, operations, observations, and alerts
  const { data: rawCycles } = await supabase
    .from("crop_cycles")
    .select(`
      id, plot_id, crop_id, variety_id, season, status, target_area_ha,
      planting_date, expected_harvest_date, actual_harvest_date,
      target_yield_kg, actual_yield_kg, current_stage, health_score,
      health_status, estimated_budget_kobo, actual_cost_kobo,
      plots(id, name, farm_id, farms(id, name)),
      crop_cycle_operations(id, name, stage, status, scheduled_start_date, scheduled_end_date, required_equipment),
      crop_observations(id, resolved, severity),
      crop_alerts(id, is_dismissed, severity, title)
    `)
    .order("created_at", { ascending: false });

  const cycles = rawCycles ?? [];

  // Active cycles
  const activeCycles = cycles.filter((c) => ["planning", "active", "harvesting"].includes(c.status));
  const completedCycles = cycles.filter((c) => ["completed", "abandoned"].includes(c.status));

  // Compute aggregated KPIs
  const totalActiveAreaHa = activeCycles.reduce(
    (acc, c) => acc + (Number(c.target_area_ha) || 0),
    0
  );

  let totalPendingOps = 0;
  let totalOpenAlerts = 0;
  let totalHealthSum = 0;
  let totalActualYieldKg = 0;
  let totalTargetYieldKg = 0;

  activeCycles.forEach((c) => {
    const pendingOps = (c.crop_cycle_operations ?? []).filter((o: any) => o.status === "pending");
    totalPendingOps += pendingOps.length;

    const openObs = (c.crop_observations ?? []).filter((o: any) => !o.resolved);
    totalOpenAlerts += openObs.length;

    totalHealthSum += Number(c.health_score) || 1.0;
    totalActualYieldKg += Number(c.actual_yield_kg) || 0;
    totalTargetYieldKg += Number(c.target_yield_kg) || 0;
  });

  const avgHealthScore =
    activeCycles.length > 0 ? Math.round((totalHealthSum / activeCycles.length) * 100) : 100;

  // Flatten next urgent operations
  const todayStr = new Date().toISOString().split("T")[0]!;
  const urgentOps: Array<{
    opId: string;
    opName: string;
    cycleId: string;
    cropName: string;
    plotName: string;
    dueDate: string;
    requiredEquipment: string | null;
  }> = [];

  activeCycles.forEach((c) => {
    const crop = getCropById(c.crop_id);
    const plot = (c.plots as any)?.name ?? "Plot";
    (c.crop_cycle_operations ?? []).forEach((o: any) => {
      if (o.status === "pending") {
        urgentOps.push({
          opId: o.id,
          opName: o.name,
          cycleId: c.id,
          cropName: crop?.name ?? c.crop_id,
          plotName: plot,
          dueDate: o.scheduled_end_date,
          requiredEquipment: o.required_equipment,
        });
      }
    });
  });

  urgentOps.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            Crop Management
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Connected production lifecycle: seed planning, telemetry, operations, and harvest intake.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${lang}/account/farms`}
            className="px-4 py-2 text-sm font-semibold text-leaf-800 bg-leaf-50 border border-leaf-200 rounded-xl hover:bg-leaf-100 shadow-sm transition-all"
          >
            🌱 Go to My Farms
          </Link>
          <Link
            href={`/${lang}/account/crops/map`}
            className="px-4 py-2 text-sm font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 shadow-sm transition-all"
          >
            🗺️ Farm Map
          </Link>
          <Link
            href={`/${lang}/account/crops/new`}
            className="px-4 py-2 text-sm font-bold text-white bg-forest-600 rounded-xl hover:bg-forest-700 shadow-sm transition-all flex items-center gap-2"
          >
            <span>+</span> Plan New Crop Cycle
          </Link>
        </div>
      </div>

      {/* Farm Enterprise Context Banner */}
      <div className="p-4 bg-leaf-50/80 border border-leaf-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🌱</span>
          <div>
            <strong className="text-leaf-950 font-bold block text-sm">
              Crops are managed within your Farm Enterprises
            </strong>
            <span className="text-leaf-700">
              Each farm manages its own plots, crop cycles, livestock, workers, farm accounts, inventory, and records.
            </span>
          </div>
        </div>
        <Link
          href={`/${lang}/account/farms`}
          className="font-bold text-leaf-800 hover:text-leaf-950 underline"
        >
          Manage by Farm &rarr;
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Active Area
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-neutral-900">
              {totalActiveAreaHa.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-neutral-500 ml-1">ha</span>
          </div>
          <span className="text-xs text-neutral-400 mt-1">Cultivated parcels</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Active Cycles
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-forest-700">
              {activeCycles.length}
            </span>
            <span className="text-xs font-semibold text-neutral-500 ml-1">cycles</span>
          </div>
          <span className="text-xs text-neutral-400 mt-1">In production</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Operations Due
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-600">
              {totalPendingOps}
            </span>
            <span className="text-xs font-semibold text-neutral-500 ml-1">tasks</span>
          </div>
          <span className="text-xs text-neutral-400 mt-1">Scheduled in field</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Open Scouting
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-red-600">
              {totalOpenAlerts}
            </span>
            <span className="text-xs font-semibold text-neutral-500 ml-1">alerts</span>
          </div>
          <span className="text-xs text-neutral-400 mt-1">Pest & disease logs</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Health Index
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-forest-700">
              {avgHealthScore}%
            </span>
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-1">
            {avgHealthScore >= 85 ? "Optimal" : avgHealthScore >= 70 ? "Good" : "Attention needed"}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Output Yield
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-neutral-900">
              {totalActualYieldKg > 0 ? (totalActualYieldKg / 1000).toFixed(1) : (totalTargetYieldKg / 1000).toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-neutral-500 ml-1">tons</span>
          </div>
          <span className="text-xs text-neutral-400 mt-1">
            {totalActualYieldKg > 0 ? "Harvested to date" : "Projected target"}
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Crop Cycles (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Active Crop Cycles</h2>
            <span className="text-xs font-semibold text-neutral-500">
              {activeCycles.length} active
            </span>
          </div>

          {activeCycles.length === 0 ? (
            <Card className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">🌱</span>
              <h3 className="text-lg font-bold text-neutral-800">No Active Crop Cycles</h3>
              <p className="text-sm text-neutral-600 max-w-md">
                You haven&apos;t started a crop cycle yet. Plan your first planting to unlock
                automated agronomic tasks, input scheduling, and tractor hiring checkpoints.
              </p>
              <Link
                href={`/${lang}/account/crops/new`}
                className="mt-2 px-5 py-2.5 text-sm font-bold text-white bg-forest-600 rounded-xl hover:bg-forest-700"
              >
                Plan Your First Crop →
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCycles.map((cycle) => {
                const cropDef = getCropById(cycle.crop_id);
                const variety = cropDef?.varieties.find((v) => v.id === cycle.variety_id);
                const plot = cycle.plots as any;
                const nextOp = (cycle.crop_cycle_operations ?? []).find(
                  (o: any) => o.status === "pending"
                );

                // Calculate progress %
                const pDate = new Date(cycle.planting_date).getTime();
                const hDate = new Date(cycle.expected_harvest_date).getTime();
                const now = Date.now();
                const progressPct = Math.min(
                  100,
                  Math.max(0, Math.round(((now - pDate) / (hDate - pDate)) * 100))
                );

                return (
                  <Link
                    key={cycle.id}
                    href={`/${lang}/account/crops/${cycle.id}`}
                    className="block group"
                  >
                    <Card className="p-5 flex flex-col justify-between gap-4 h-full border border-neutral-200/90 hover:border-forest-500 hover:shadow-md transition-all">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                              {plot?.name} • {plot?.farms?.name}
                            </span>
                            <h3 className="text-lg font-extrabold text-neutral-900 group-hover:text-forest-700 transition-colors">
                              {cropDef?.name ?? cycle.crop_id}
                            </h3>
                            <span className="text-xs text-forest-700 font-medium">
                              {variety?.name ?? cycle.variety_id}
                            </span>
                          </div>
                          <Badge
                            className={
                              cycle.health_status === "excellent" || cycle.health_status === "good"
                                ? "bg-leaf-100 text-leaf-800"
                                : cycle.health_status === "watch"
                                ? "bg-harvest-100 text-harvest-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            Health: {Math.round(Number(cycle.health_score) * 100)}%
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                            <span>Stage: <strong className="text-neutral-800 capitalize">{cycle.current_stage.replace(/_/g, " ")}</strong></span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-forest-600 h-2 rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-neutral-600">
                          <div>
                            <span className="text-neutral-400">Planted:</span>{" "}
                            <strong>{cycle.planting_date}</strong>
                          </div>
                          <div>
                            <span className="text-neutral-400">Harvest ~:</span>{" "}
                            <strong>{cycle.expected_harvest_date}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Next Operation Footer */}
                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                        {nextOp ? (
                          <div className="truncate">
                            <span className="text-neutral-400">Next: </span>
                            <strong className="text-neutral-800">{nextOp.name}</strong>{" "}
                            <span className="text-neutral-500">({nextOp.scheduled_end_date})</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">All current ops completed</span>
                        )}
                        <span className="text-forest-700 font-bold group-hover:translate-x-0.5 transition-transform">
                          →
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Past / Completed Cycles */}
          {completedCycles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-3">
                Completed & Past Cycles ({completedCycles.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {completedCycles.map((c) => {
                  const crop = getCropById(c.crop_id);
                  return (
                    <Link
                      key={c.id}
                      href={`/${lang}/account/crops/${c.id}`}
                      className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-neutral-800">{crop?.name}</strong> •{" "}
                        <span className="text-neutral-500">{(c.plots as any)?.name}</span>
                        <div className="text-neutral-400">Yield: {c.actual_yield_kg} kg</div>
                      </div>
                      <Badge className="capitalize bg-neutral-100 text-neutral-700">
                        {c.status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Operations Schedule & Field Alerts */}
        <div className="flex flex-col gap-6">
          {/* Operations Due Card */}
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">Upcoming Field Operations</h3>
              <Badge className="bg-harvest-100 text-harvest-800">{urgentOps.length} due</Badge>
            </div>

            {urgentOps.length === 0 ? (
              <p className="text-xs text-neutral-500 py-3 text-center">
                No pending operations scheduled for this week.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-neutral-100">
                {urgentOps.slice(0, 6).map((op) => (
                  <div key={op.opId} className="py-3 flex flex-col gap-1.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-neutral-900">{op.opName}</span>
                        <div className="text-xs text-neutral-500">
                          {op.cropName} • {op.plotName}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-neutral-600">
                        {op.dueDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {op.requiredEquipment ? (
                        <Link
                          href={`/${lang}/account/bookings/new?notes=${encodeURIComponent(
                            `Required for ${op.opName} on ${op.plotName}`
                          )}`}
                          className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1"
                        >
                          🚜 Book {op.requiredEquipment}
                        </Link>
                      ) : (
                        <span className="text-xs text-neutral-400">Manual / Labor task</span>
                      )}
                      <Link
                        href={`/${lang}/account/crops/${op.cycleId}`}
                        className="text-xs font-semibold text-neutral-700 hover:text-black"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Agro-weather & Chemical Guardrail Highlights */}
          <Card className="p-5 flex flex-col gap-3 bg-forest-950 text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h3 className="font-bold text-sm">NAFDAC Chemical Safety Enforced</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              All input applications are vetted against the Nigerian pesticide registry.
              Banned substances (Paraquat, Carbofuran) are strictly prevented at system entry.
            </p>
            <div className="pt-2 border-t border-forest-800/80 flex items-center justify-between text-xs text-forest-300">
              <span>GAP Protocol</span>
              <span>IITA / NIHORT Standard</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
