import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { MachineryFleet } from "@/components/screens/machinery-fleet";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import {
  createMachineryAsset,
  logMachineryUsage,
} from "@/actions/machinery";

export const metadata: Metadata = { title: "Fleet & workshop" };

export default async function Page({ params }: PageProps<"/[lang]/account/machinery">) {
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

  const { data: assets } = farmIds.length
    ? await supabase
        .from("farm_machinery_assets")
        .select("id, farm_id, name, category, make, model, serial_number, fuel_type, fuel_consumption_rate, total_operating_hours, next_service_hours, status, created_at")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const assetList = assets ?? [];
  const hasLiveFleet = assetList.length > 0;
  const assetIds = assetList.map((a) => a.id);

  const { data: usageLogs } = assetIds.length
    ? await supabase
        .from("farm_machinery_usage_logs")
        .select("id, machinery_id, plot_id, crop_cycle_id, activity, hours_run, fuel_litres_used, fuel_cost_minor, operator_labor_cost_minor, area_covered_ha, log_date, created_at")
        .in("machinery_id", assetIds)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const usageList = usageLogs ?? [];

  // KPIs
  const totalOperatingHours = assetList.reduce((sum, a) => sum + (a.total_operating_hours || 0), 0);
  const totalFuelLitres = usageList.reduce((sum, u) => sum + (u.fuel_litres_used || 0), 0);
  const dueServiceCount = assetList.filter(
    (a) => a.next_service_hours && a.total_operating_hours >= a.next_service_hours
  ).length;

  const modalAddAsset = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col text-left">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="add_circle" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Add Machinery Asset</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Register tractor, implement, or heavy machinery to fleet</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={createMachineryAsset} className="p-space-lg space-y-space-md max-h-[720px] overflow-y-auto">
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">
              Farm Enterprise <span className="text-error">*</span>
            </label>
            <select
              name="farm_id"
              required
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            >
              {farmList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Asset Category</label>
            <select
              name="category"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            >
              <option value="tractor">Tractor (2WD / 4WD)</option>
              <option value="harvester">Combine Harvester</option>
              <option value="sprayer">Boom / Orchard Sprayer</option>
              <option value="planter">Precision Planter / Seeder</option>
              <option value="tiller">Power Tiller / Rotary</option>
              <option value="irrigation_pump">Solar / Diesel Irrigation Pump</option>
              <option value="drone">Agricultural Spray Drone</option>
              <option value="vehicle">Utility Truck / Logistics Van</option>
              <option value="other">Other Heavy Machinery</option>
            </select>
          </div>
        </div>

        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">
            Machine Name / Asset Identifier <span className="text-error">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="e.g. John Deere 5075E 4WD Tractor"
            type="text"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Make / Manufacturer</label>
            <input
              name="make"
              placeholder="e.g. John Deere, New Holland, Massey Ferguson"
              type="text"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Model</label>
            <input
              name="model"
              placeholder="e.g. 5075E, MF 375, TT55"
              type="text"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Serial / Chassis Number</label>
            <input
              name="serial_number"
              placeholder="e.g. JD-5075E-2025-081"
              type="text"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Fuel / Power Type</label>
            <select
              name="fuel_type"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            >
              <option value="diesel">Automotive Diesel (AGO)</option>
              <option value="petrol">Premium Motor Spirit (PMS)</option>
              <option value="solar">Solar PV / Electric</option>
              <option value="hybrid">Diesel-Electric Hybrid</option>
              <option value="manual">Manual / PTO Powered</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Fuel Rate (L/hr)</label>
            <input
              name="fuel_consumption_rate"
              defaultValue="7.5"
              step="0.1"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Initial Hours</label>
            <input
              name="total_operating_hours"
              defaultValue="0"
              step="0.5"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Next Service (Hr)</label>
            <input
              name="next_service_hours"
              defaultValue="250"
              step="50"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="submit">
            Register Asset to Fleet
          </button>
        </div>
      </form>
    </div>
  );

  const modalLogUsage = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col text-left">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="speed" className="text-secondary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Log Machine Hours &amp; Fuel</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Update telemetry odometer and operational expenses</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>

      <form action={logMachineryUsage} className="p-space-lg space-y-space-md max-h-[720px] overflow-y-auto">
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">
            Machinery Asset <span className="text-error">*</span>
          </label>
          <select
            name="machinery_id"
            required
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          >
            {assetList.length === 0 ? (
              <option value="">No machinery assets registered yet</option>
            ) : (
              assetList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.total_operating_hours || 0} hrs logged)
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">
            Operation Activity <span className="text-error">*</span>
          </label>
          <input
            name="activity"
            required
            placeholder="e.g. Harrowing Plot A1 Maize (18.0 Ha)"
            type="text"
            className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">
              Hours Run <span className="text-error">*</span>
            </label>
            <input
              name="hours_run"
              required
              step="0.5"
              defaultValue="5.0"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Fuel Consumed (Litres)</label>
            <input
              name="fuel_litres_used"
              step="0.5"
              defaultValue="35.0"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Fuel Cost (Minor/Kobo)</label>
            <input
              name="fuel_cost_minor"
              placeholder="e.g. 4200000 (= ₦42,000)"
              defaultValue="4200000"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Area Covered (Hectares)</label>
            <input
              name="area_covered_ha"
              step="0.1"
              defaultValue="6.0"
              type="number"
              className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <button className="px-space-md py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold" type="submit">
            Save Operation Telemetry
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      {!hasLiveFleet && (
        <LiveStrip tone="preview">
          Viewing sample syndicate fleet telemetry. Register your first machinery asset below to link live telemetry logs.
        </LiveStrip>
      )}

      <MachineryFleet
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm shrink-0">
              <ScreenDialog title="Add Machinery Asset" side="center" panel={modalAddAsset}>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-lg text-label-lg font-semibold shadow-sm"
                  type="button"
                >
                  <Icon name="add_circle" className="text-lg" />
                  <span>Add Machinery Asset</span>
                </button>
              </ScreenDialog>

              <ScreenDialog title="Log Machine Hours & Fuel" side="center" panel={modalLogUsage}>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-lg text-label-lg font-semibold shadow-sm"
                  type="button"
                >
                  <Icon name="speed" className="text-lg text-secondary" />
                  <span>Log Machine Hours</span>
                </button>
              </ScreenDialog>
            </div>
          ),

          kpis: hasLiveFleet ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                      Active Fleet Assets
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-metric-num text-metric-num text-on-surface">{assetList.length}</span>
                      <span className="font-label-lg text-label-lg font-bold text-primary">Units</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <Icon name="agriculture" className="text-2xl" />
                  </div>
                </div>
                <div className="mt-4 pt-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">Across {farmList.length} Farm Enterprise(s)</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-primary font-bold">Operational</span>
                  </div>
                </div>
              </div>

              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                      Cumulative Engine Hours
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-metric-num text-metric-num text-on-surface">{totalOperatingHours}</span>
                      <span className="font-label-lg text-label-lg font-bold text-secondary">Hours</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                    <Icon name="speed" className="text-2xl" />
                  </div>
                </div>
                <div className="mt-4 pt-3 flex flex-col gap-1">
                  <span className="text-on-surface-variant font-label-sm text-label-sm">
                    {usageList.length} verified operations logged
                  </span>
                </div>
              </div>

              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                      Fuel Consumed
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-metric-num text-metric-num text-on-surface">{totalFuelLitres}</span>
                      <span className="font-label-lg text-label-lg font-bold text-primary">Litres</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <Icon name="local_gas_station" className="text-2xl" />
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Automotive Diesel (AGO)</span>
                </div>
              </div>

              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                      Maintenance Health
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-metric-num text-metric-num text-tertiary-container">
                        {dueServiceCount > 0 ? `${dueServiceCount} Due` : "All Safe"}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary group-hover:scale-105 transition-transform">
                    <Icon name={dueServiceCount > 0 ? "warning" : "check_circle"} className="text-2xl" />
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Workshop Spec §5.3 Monitored
                  </span>
                </div>
              </div>
            </div>
          ) : undefined,

          fleet: hasLiveFleet ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Fleet Asset Inventory &amp; Telemetry Registry
                    </h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {assetList.length} machine asset(s) registered under active supervision.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-surface-container-high/60">
                {assetList.map((asset) => {
                  const isDue = asset.next_service_hours && asset.total_operating_hours >= asset.next_service_hours;

                  return (
                    <div key={asset.id} className="p-space-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md hover:bg-surface-container-low transition-colors">
                      <div className="flex items-start gap-space-md">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                          <Icon name="agriculture" className="text-2xl" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{asset.name}</span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container uppercase text-on-surface-variant">
                              {asset.category}
                            </span>
                            {asset.serial_number && (
                              <span className="font-mono text-label-sm text-label-sm text-on-surface-variant">
                                #{asset.serial_number}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-body-sm font-body-sm text-on-surface-variant mt-1 flex-wrap">
                            <span>Make: <strong className="text-on-surface">{asset.make || "N/A"}</strong></span>
                            <span>•</span>
                            <span>Model: <strong className="text-on-surface">{asset.model || "N/A"}</strong></span>
                            <span>•</span>
                            <span>Fuel: {asset.fuel_type} ({asset.fuel_consumption_rate || 0} L/hr)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-space-md w-full lg:w-auto justify-between lg:justify-end shrink-0 pt-2 lg:pt-0">
                        <div className="text-right">
                          <div className="font-metric-num text-metric-num text-on-surface font-bold">
                            {asset.total_operating_hours || 0} hrs
                          </div>
                          <span className={`font-label-sm text-label-sm ${isDue ? "text-error font-bold" : "text-on-surface-variant"}`}>
                            Next service: {asset.next_service_hours ? `${asset.next_service_hours} hrs` : "N/A"}
                          </span>
                        </div>

                        <ScreenDialog title="Log Machine Hours & Fuel" side="center" panel={modalLogUsage}>
                          <button
                            className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-sm text-label-sm font-semibold transition-colors"
                            type="button"
                          >
                            Log Hours
                          </button>
                        </ScreenDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : undefined,
        }}
      />
    </>
  );
}
