import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { createMachineryAsset, logMachineryUsage } from "@/actions/machinery";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function MachineryPage({ params }: Props) {
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

  // Fetch machinery fleet
  const { data: machines } = await supabase
    .from("farm_machinery_assets")
    .select("*, farms(name)")
    .in("farm_id", farmIds.length > 0 ? farmIds : ["00000000-0000-0000-0000-000000000000"])
    .order("name");

  const machineIds = (machines || []).map((m) => m.id);

  // Fetch usage logs
  const { data: usageLogs } = await supabase
    .from("farm_machinery_usage_logs")
    .select("*, farm_machinery_assets(name)")
    .in("machinery_id", machineIds.length > 0 ? machineIds : ["00000000-0000-0000-0000-000000000000"])
    .order("log_date", { ascending: false })
    .limit(10);

  const totalHours = (machines || []).reduce((acc, m) => acc + (Number(m.total_operating_hours) || 0), 0);
  const totalDiesel = (usageLogs || []).reduce((acc, u) => acc + (Number(u.fuel_litres_used) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-leaf-900 sm:text-3xl">Machinery Fleet & Equipment</h1>
          <p className="text-xs text-muted mt-1">
            Maintain tractors, implements, diesel fuel consumption records, and preventive maintenance intervals.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Fleet Size</p>
          <p className="text-xl font-black text-leaf-900 mt-1">{machines?.length || 0} Units</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600">
          <p className="text-xs font-medium text-muted">Total Engine Hours</p>
          <p className="text-xl font-black text-sky-900 mt-1">{totalHours.toFixed(1)} hrs</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-harvest-600">
          <p className="text-xs font-medium text-muted">Recent Diesel Used</p>
          <p className="text-xl font-black text-harvest-900 mt-1">{totalDiesel.toFixed(1)} L</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-600">
          <p className="text-xs font-medium text-muted">Maintenance Due</p>
          <p className="text-xl font-black text-amber-900 mt-1">
            {machines?.filter((m) => m.next_service_hours && m.total_operating_hours >= m.next_service_hours).length || 0}
          </p>
        </Card>
      </div>

      {/* Fleet & Usage Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Fleet & Usage Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Machines Fleet Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Fleet Equipment Assets</h2>
              <Badge tone="leaf">{machines?.length || 0} Active</Badge>
            </div>

            {(!machines || machines.length === 0) ? (
              <Card className="p-8 text-center border-dashed">
                <span className="text-3xl">🚜</span>
                <p className="mt-2 text-sm font-bold text-ink">No machinery registered</p>
                <p className="text-xs text-muted mt-1">
                  Add tractors, planters, sprayers, and harvesters to track operating hours and diesel burn.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {machines.map((m) => {
                  const serviceDue = m.next_service_hours && m.total_operating_hours >= m.next_service_hours;
                  return (
                    <Card key={m.id} className="p-4 border border-line flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-ink">{m.name}</span>
                          <Badge tone={serviceDue ? "danger" : "leaf"}>
                            {serviceDue ? "Service Due" : m.status}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-leaf-800 capitalize">
                          {m.category} &bull; {m.make} {m.model}
                        </p>
                        <div className="text-[11px] text-muted space-y-0.5">
                          <p>Current Hours: {Number(m.total_operating_hours).toFixed(1)} hrs</p>
                          {m.next_service_hours && <p>Next Service: {m.next_service_hours} hrs</p>}
                          {m.fuel_consumption_rate && <p>Burn Rate: {m.fuel_consumption_rate} L/hr</p>}
                          <p>Farm: {m.farms?.name}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Usage Logs Table */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Recent Field Work & Diesel Consumption</h2>
            {(!usageLogs || usageLogs.length === 0) ? (
              <Card className="p-4 text-center border-dashed">
                <p className="text-xs text-muted">No usage logs recorded yet.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-line text-neutral-600 font-bold">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Asset</th>
                      <th className="p-2.5">Activity</th>
                      <th className="p-2.5">Hours</th>
                      <th className="p-2.5">Diesel (L)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {usageLogs.map((u) => (
                      <tr key={u.id}>
                        <td className="p-2.5">{u.log_date}</td>
                        <td className="p-2.5 font-bold">{u.farm_machinery_assets?.name}</td>
                        <td className="p-2.5">{u.activity}</td>
                        <td className="p-2.5">{Number(u.hours_run).toFixed(1)} hrs</td>
                        <td className="p-2.5">{Number(u.fuel_litres_used).toFixed(1)} L</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="space-y-6">
          {/* Add Asset Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Register Machinery Asset</h3>
            <form action={createMachineryAsset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Farm *</label>
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
                <label className="block text-xs font-bold text-neutral-700 mb-1">Machine Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Massey Ferguson 375 Tractor"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Category *</label>
                  <select
                    name="category"
                    required
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="tractor">Tractor</option>
                    <option value="harvester">Harvester</option>
                    <option value="planter">Planter / Seeder</option>
                    <option value="sprayer">Boom Sprayer</option>
                    <option value="irrigation_pump">Irrigation Pump</option>
                    <option value="vehicle">Utility Vehicle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Fuel Type</label>
                  <select
                    name="fuel_type"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="electric">Electric / Solar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Current Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    name="initial_hours"
                    placeholder="0"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Next Service (hrs)</label>
                  <input
                    type="number"
                    step="1"
                    name="next_service_hours"
                    placeholder="e.g. 500"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs py-2">
                🚜 Save Fleet Asset
              </Button>
            </form>
          </Card>

          {/* Log Usage Form */}
          <Card className="p-5 border border-line shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-ink">Log Field Usage & Diesel</h3>
            <form action={logMachineryUsage} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Select Machine *</label>
                <select
                  name="machinery_id"
                  required
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="">Select Asset...</option>
                  {(machines || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Activity *</label>
                <input
                  type="text"
                  name="activity"
                  required
                  placeholder="e.g. Disc Ploughing Block A"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Hours Run *</label>
                  <input
                    type="number"
                    step="0.1"
                    name="hours_run"
                    required
                    placeholder="e.g. 4.5"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Diesel Used (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="fuel_litres_used"
                    placeholder="e.g. 35"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-harvest-700 hover:bg-harvest-800 text-white font-bold text-xs py-2">
                ⛽ Record Engine Hours & Fuel
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
