// Ported from the "field_operations_farm_calendar" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";
import { slot } from "./types";

export function FieldOperationsCalendar({ lang, slots }: ScreenProps<"actions" | "kpis" | "operations">) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16 space-y-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-md bg-surface-container-lowest rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center gap-space-sm text-body-sm font-body-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Local Mesh Node #OY-ISE-04 Online</span>
            </div>
            <span className="text-on-surface-variant">•</span>
            <span className="text-on-surface-variant font-medium">PowerSync SQLite Delta: <strong className="text-on-surface">Zero Latency</strong></span>
            <span className="text-on-surface-variant">•</span>
            <span className="text-on-surface-variant">Last Replicated: <span className="text-on-surface font-mono">14:02:11 WAT</span></span>
          </div>
          <div className="flex items-center gap-space-sm text-label-md font-label-md text-on-surface-variant">
            <Icon name="satellite_alt" className="text-secondary text-sm" />
            <span>Sentinel-2 L2A Passes: <strong className="text-on-surface">Today 11:42 WAT (Clear Sky 4%)</strong></span>
          </div>
        </div>
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
          <div className="space-y-space-xs">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="px-space-sm py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm uppercase tracking-wider font-semibold">Multi-Enterprise Execution Hub</span>
              <span className="px-space-sm py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Iseyin Savanna Protocol v2.1</span>
              <span className="px-space-sm py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Zone 4A Agro-Ecological Grid</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">Field Operations &amp; Farm Calendar</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">Centralized dispatch, agro-meteorological guardrails, and asset tracking across broadacre grain, horticultural rows, poultry cycles, and aquaculture ponds.</p>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex flex-wrap items-center gap-space-sm">
              <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-colors" type="button">
                <Icon name="tune" className="text-base" />
                <span>Filter Enterprise</span>
              </button>
              <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-colors" type="button">
                <Icon name="group_add" className="text-base" />
                <span>Bulk Assign Tasks</span>
              </button>
              <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-colors" type="button">
                <Icon name="picture_as_pdf" className="text-base text-primary" />
                <span>Export Roster (PDF)</span>
              </button>
              <button className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-colors" type="button">
                <Icon name="add_circle" className="text-base" />
                <span>Schedule New Operation</span>
              </button>
            </div>
          )}
        </div>
        {slot(
          slots,
          "kpis",
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
            <div className="flex items-start justify-between">
              <div className="space-y-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Execution Velocity</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">81.8%</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">18 / 22 Done</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container">
                <Icon name="task_alt" className="text-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "81.8%" }} />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>4 Pending in next 48h</span>
                <span className="font-semibold text-secondary">0 Overdue / Blocked</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
            <div className="flex items-start justify-between">
              <div className="space-y-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Active Workforce &amp; Fleet</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-on-surface">15 Heads</span>
                  <span className="font-label-md text-label-md px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container">Deployed</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-high text-primary">
                <Icon name="agriculture" className="text-xl" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-on-surface"><Icon name="badge" className="text-xs text-primary" /> 12 Field Hands</span>
              <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-on-surface"><Icon name="precision_manufacturing" className="text-xs text-primary" /> 1 JD 5075E</span>
              <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-on-surface"><Icon name="psychology" className="text-xs text-primary" /> 2 Agronomists</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
            <div className="flex items-start justify-between">
              <div className="space-y-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Weather Guardrail Impact</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-tertiary">1 Hold</span>
                  <span className="font-label-md text-label-md px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-semibold">NiMet Alert</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed">
                <Icon name="thunderstorm" className="text-xl" />
              </div>
            </div>
            <div className="p-2 rounded bg-tertiary-fixed/30 font-body-sm text-body-sm text-on-tertiary-fixed leading-tight"><strong>42mm Rainfall Outlook:</strong> Chemical spraying paused until Saturday window.</div>
          </div>
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
            <div className="flex items-start justify-between">
              <div className="space-y-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Input / Material Staging</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-primary">96.4%</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Staged &amp; Verified</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-high text-secondary">
                <Icon name="warehouse" className="text-xl" />
              </div>
            </div>
            <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
              <Icon name="inventory_2" className="text-base text-secondary" />
              <span className="truncate">14 Bags Granular Urea staged at <strong>Field Store 1</strong></span>
            </div>
          </div>
        </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pb-1">
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-sm">
            <button className="px-space-md py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5" type="button">
              <Icon name="view_timeline" className="text-base" />
              <span>Timeline &amp; Gantt</span>
            </button>
            <button className="px-space-md py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5" type="button">
              <Icon name="view_kanban" className="text-base" />
              <span>Kanban Board</span>
            </button>
            <button className="px-space-md py-2 rounded-lg font-label-md text-label-md bg-surface-container-lowest text-primary font-bold shadow-sm flex items-center gap-1.5" type="button">
              <Icon name="ballot" className="text-base text-secondary" />
              <span>Daily Operations Roster (Active)</span>
            </button>
            <button className="px-space-md py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5" type="button">
              <Icon name="map" className="text-base" />
              <span>Field Map Telemetry</span>
            </button>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <Icon name="filter_list" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base" />
              <input className="h-9 pl-9 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary w-64 placeholder:text-on-surface-variant/60" placeholder="Filter by plot, op ID or chemical..." type="text" />
            </div>
            <button className="p-2 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-sm" title="Refresh Telemetry" type="button">
              <Icon name="cached" className="text-base" />
            </button>
          </div>
        </div>
        {slot(
          slots,
          "operations",
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-space-lg py-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest">
            <div className="space-y-0.5">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Scheduled Operations Ledger</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Master Specification §3.4 Dispatch Pipeline • Auto-enforced Agronomic Windows</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Batch Action:</span>
              <select className="h-8 px-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm focus:outline-none">
                <option>Bulk Mark Verified</option>
                <option>Reschedule +24 Hours</option>
                <option>Reassign Labour Crew</option>
                <option>Trigger SMS Alert to Operators</option>
              </select>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container-high text-on-surface-variant uppercase tracking-wider font-label-sm text-label-sm">
                <tr>
                  <th className="py-3 px-space-md w-12 text-center">
                    <input className="rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                  </th>
                  <th className="py-3 px-space-md font-semibold">Operation ID &amp; Activity</th>
                  <th className="py-3 px-space-md font-semibold">Enterprise / Field</th>
                  <th className="py-3 px-space-md font-semibold">Agronomic Window</th>
                  <th className="py-3 px-space-md font-semibold">Resources &amp; Input Staging</th>
                  <th className="py-3 px-space-md font-semibold">Execution Status</th>
                  <th className="py-3 px-space-md text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                  <td className="py-space-md px-space-md text-center">
                    <input className="rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-mono text-secondary font-bold">#OP-2026-104</span>
                      <span className="font-headline-sm text-body-lg font-bold text-on-surface mt-0.5">Split-N Top-Dressing (Urea 46%)</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Method: Basal Band Placement @ 5cm offset</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Plot A1 &amp; A2 (18.0 Ha)</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Maize DMR-LSR-Y • V6 Vegetative Stage</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-secondary font-semibold">Due in 2 Days</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Friday 07:00 WAT (Optimal Pre-Rain)</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-on-surface font-medium">
                        <Icon name="check_circle" className="text-sm text-secondary" />
                        <span>12 Bags Urea 46% (Verified)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-label-sm font-label-sm">
                        <Icon name="groups" className="text-sm" />
                        <span>Crew B (6 Workers • Lead: Adeleke O.)</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Ready to Execute</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm" type="button">Log Completion &amp; GPS</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                  <td className="py-space-md px-space-md text-center">
                    <input className="rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-mono text-tertiary font-bold">#OP-2026-105</span>
                      <span className="font-headline-sm text-body-lg font-bold text-on-surface mt-0.5">Fungicide Shield (Mancozeb 80WP)</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Early Blight / Septoria Prevention Protocol</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Plot B1 (6.5 Ha)</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Tomato Roma VF • Flowering Stage</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-error font-semibold">Delayed +48h</span>
                      <span className="font-label-sm text-label-sm text-tertiary">NiMet Wash-off Alert (42mm)</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-on-surface font-medium">
                        <Icon name="warehouse" className="text-sm text-on-surface-variant" />
                        <span>14 kg Mancozeb (In Chemical Locker)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-label-sm font-label-sm">
                        <Icon name="precision_manufacturing" className="text-sm" />
                        <span>4 Knapsack Sprayers Calibrated</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-tertiary" /> Weather Hold (Rain 42mm)</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors shadow-sm" type="button">Override / Reschedule</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                  <td className="py-space-md px-space-md text-center">
                    <input className="rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-mono text-secondary font-bold">#OP-2026-106</span>
                      <span className="font-headline-sm text-body-lg font-bold text-on-surface mt-0.5">Mechanical Rotary Inter-row Weeding</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Syndicate Machinery Dispatch #MCH-489</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Plot A1 (9.0 Ha)</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Maize • Canopy Closing Imminent</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Tomorrow 08:00 WAT</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Soil Moisture: 19% (Traction Optimal)</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-on-surface font-medium">
                        <Icon name="agriculture" className="text-sm text-secondary" />
                        <span>JD 5075E Tractor (Alhaji Kazeem Syndicate)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-label-sm font-label-sm">
                        <Icon name="person" className="text-sm" />
                        <span>Operator: Babatunde Gbadamosi</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> GPS Dispatched / Locked</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors shadow-sm" type="button">View Live Telemetry</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                  <td className="py-space-md px-space-md text-center">
                    <input className="rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-mono text-primary font-bold">#OP-2026-107</span>
                      <span className="font-headline-sm text-body-lg font-bold text-on-surface mt-0.5">Aphid &amp; Pod Borer Scouting Sweep</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Systematic 5-point &apos;W&apos; Grid Sampling</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Plot B3 (4.0 Ha)</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Cowpea SAMPEA-14 • Podding Stage</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-primary font-semibold">Today 16:30 WAT</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Late afternoon insect activity peak</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-on-surface font-medium">
                        <Icon name="psychology" className="text-sm text-secondary" />
                        <span>Quadri Olapade (Lead Agronomist)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-label-sm font-label-sm">
                        <Icon name="phone_iphone" className="text-sm" />
                        <span>PowerSync Mobile Field App Form #SC-2</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> In Progress</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors shadow-sm" type="button">Open Scouting Form</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                  <td className="py-space-md px-space-md text-center">
                    <input className="rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-mono text-tertiary font-bold">#OP-2026-108</span>
                      <span className="font-headline-sm text-body-lg font-bold text-on-surface mt-0.5">Livestock Vaccination: NDV Lasota Booster</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Drinking water delivery with skimmed milk stabilizer</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Poultry House 1</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Broilers B4 • 1,250 Birds (Day 21)</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Tomorrow 07:00 WAT</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Cool early morning stress minimization</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-on-surface font-medium">
                        <Icon name="medical_services" className="text-sm text-secondary" />
                        <span>Dr. Alabi (Veterinary Partner)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-label-sm font-label-sm">
                        <Icon name="ac_unit" className="text-sm" />
                        <span>Cold-chain verified vial #NV-882 (4°C)</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-primary" /> Vet Confirmed</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors shadow-sm" type="button">Review Protocol</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                  <td className="py-space-md px-space-md text-center">
                    <input className="rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm font-mono text-secondary font-bold">#OP-2026-109</span>
                      <span className="font-headline-sm text-body-lg font-bold text-on-surface mt-0.5">Pond Aeration &amp; Water DO Flush</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Target Dissolved Oxygen: &gt; 5.5 mg/L</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Catfish Pond P2</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Clarias Growout • 3,400 Fingerlings</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Daily Routine</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">06:00 &amp; 18:00 WAT Cycles</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-on-surface font-medium">
                        <Icon name="solar_power" className="text-sm text-secondary" />
                        <span>Solar Submersible Aerator Unit 2</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-label-sm font-label-sm">
                        <Icon name="water_ph" className="text-sm" />
                        <span>Telemetry Telemetry Node #WT-04</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Completed (18:00)</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors shadow-sm" type="button">View DO Log</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-space-lg py-space-sm bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
            <span>Displaying 6 of 22 active cluster operations for Early Rains Season 2026</span>
            <div className="flex items-center gap-space-xs">
              <button className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface shadow-sm disabled:opacity-50" disabled type="button">Previous</button>
              <span className="px-2 font-semibold text-primary">Page 1 of 4</span>
              <button className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-high" type="button">Next</button>
            </div>
          </div>
        </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between space-y-space-md">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-sm">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">NiMet &amp; ECMWF Agro-Meteorology</span>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">7-Day Operations Risk Forecast</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
                  <Icon name="wb_sunny" className="text-sm text-secondary" />
                  <span>Iseyin Cluster Station (Lat 7.96° N)</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Predictive operational windows for tractor traction, chemical foliar spray, and fertilizer wash-off prevention.</p>
            </div>
            <div className="grid grid-cols-7 gap-2 pt-2">
              <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-low space-y-2 text-center">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">TODAY</span>
                <Icon name="partly_cloudy_day" className="text-xl text-on-tertiary-container" />
                <div className="space-y-0.5">
                  <span className="font-label-md text-label-md font-bold text-on-surface">31°C</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">22°C</span>
                </div>
                <div className="w-full pt-1 space-y-1">
                  <span className="block font-label-sm text-label-sm font-mono text-secondary">8mm</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container">SAFE</span>
                </div>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-low space-y-2 text-center">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">THU</span>
                <Icon name="cloud" className="text-xl text-secondary" />
                <div className="space-y-0.5">
                  <span className="font-label-md text-label-md font-bold text-on-surface">29°C</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">21°C</span>
                </div>
                <div className="w-full pt-1 space-y-1">
                  <span className="block font-label-sm text-label-sm font-mono text-tertiary">18mm</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container">SAFE</span>
                </div>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-error-container/40 space-y-2 text-center">
                <span className="font-label-sm text-label-sm font-semibold text-error">FRI</span>
                <Icon name="thunderstorm" className="text-xl text-error" />
                <div className="space-y-0.5">
                  <span className="font-label-md text-label-md font-bold text-on-surface">26°C</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">20°C</span>
                </div>
                <div className="w-full pt-1 space-y-1">
                  <span className="block font-label-sm text-label-sm font-mono font-bold text-error">42mm</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-error text-on-error">HAZARD</span>
                </div>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-low space-y-2 text-center">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">SAT</span>
                <Icon name="sunny" className="text-xl text-on-tertiary-container" />
                <div className="space-y-0.5">
                  <span className="font-label-md text-label-md font-bold text-on-surface">32°C</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">22°C</span>
                </div>
                <div className="w-full pt-1 space-y-1">
                  <span className="block font-label-sm text-label-sm font-mono text-secondary">0mm</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container">PRIME</span>
                </div>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-low space-y-2 text-center">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">SUN</span>
                <Icon name="sunny" className="text-xl text-on-tertiary-container" />
                <div className="space-y-0.5">
                  <span className="font-label-md text-label-md font-bold text-on-surface">33°C</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">23°C</span>
                </div>
                <div className="w-full pt-1 space-y-1">
                  <span className="block font-label-sm text-label-sm font-mono text-secondary">0mm</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container">PRIME</span>
                </div>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-low space-y-2 text-center">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">MON</span>
                <Icon name="cloud" className="text-xl text-secondary" />
                <div className="space-y-0.5">
                  <span className="font-label-md text-label-md font-bold text-on-surface">30°C</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">21°C</span>
                </div>
                <div className="w-full pt-1 space-y-1">
                  <span className="block font-label-sm text-label-sm font-mono text-secondary">5mm</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container">SAFE</span>
                </div>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-low space-y-2 text-center">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">TUE</span>
                <Icon name="partly_cloudy_day" className="text-xl text-on-tertiary-container" />
                <div className="space-y-0.5">
                  <span className="font-label-md text-label-md font-bold text-on-surface">31°C</span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">22°C</span>
                </div>
                <div className="w-full pt-1 space-y-1">
                  <span className="block font-label-sm text-label-sm font-mono text-secondary">4mm</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container">SAFE</span>
                </div>
              </div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-low flex items-start gap-space-sm mt-space-sm">
              <Icon name="info" className="text-tertiary text-xl flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-body-sm font-body-sm">
                <span className="font-semibold text-on-surface">Agronomist Recommendation for Friday Rainfront:</span>
                <p className="text-on-surface-variant">Do not mobilize foliar herbicides or Mancozeb on Friday morning due to a &gt;85% probability of torrential downpour (42mm) causing chemical wash-off into irrigation channels. Saturday &amp; Sunday windows provide optimal dry canopy conditions.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between space-y-space-md">
            <div>
              <div className="flex items-center justify-between pb-space-sm">
                <div>
                  <span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider">Field Personnel &amp; Rates</span>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Labour &amp; Machinery Roster</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono font-bold text-label-sm">₦3,500 / Day</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Daily casual workforce attendance, geofence sign-in, and escrow payroll staging.</p>
            </div>
            <div className="space-y-2.5">
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap- space-sm">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-label-md">AO</div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-on-surface">Adeleke O. (Crew B Lead)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Plot A1 • 6 Hands • Checked in 06:45 WAT</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-md text-label-md font-mono font-bold text-secondary">₦21,000</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">GPS Verified</span>
                </div>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-md">BG</div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-on-surface">Babatunde Gbadamosi</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Tractor Operator (JD 5075E) • Plot A1</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-md text-label-md font-mono font-bold text-on-surface">₦45,000 / Day</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Syndicate Escrow</span>
                </div>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-label-md">TY</div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-on-surface">Tawa Yusuf (Crew A Lead)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Plot B1 • 6 Hands • Checked in 07:10 WAT</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-md text-label-md font-mono font-bold text-secondary">₦21,000</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">GPS Verified</span>
                </div>
              </div>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between text-body-sm font-body-sm">
              <div className="flex items-center gap-2">
                <Icon name="payments" className="text-primary text-base" />
                <span className="font-medium text-on-surface">Today&apos;s Estimated Daily Wage Total:</span>
              </div>
              <span className="font-label-lg text-label-lg font-mono font-bold text-primary">₦87,000.00</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <button className="font-label-sm text-label-sm text-secondary font-bold hover:underline flex items-center gap-1" type="button">
                <span>Manage Workforce Geofencing</span>
                <Icon name="arrow_forward" className="text-xs" />
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-bold shadow-sm hover:bg-primary transition-colors" type="button">Reconcile &amp; Sign Off</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="satellite" className="text-secondary" />
                <span className="font-label-md text-label-md font-bold text-on-surface">Plot A1 Canopy NDVI</span>
              </div>
              <span className="font-mono text-label-sm font-bold text-secondary">0.78 (Optimal)</span>
            </div>
            <div className="w-full h-32 rounded-lg bg-surface-container overflow-hidden relative">
              <img className="w-full h-full object-cover" data-alt="Satellite imagery showing lush green agricultural maize fields in Oyo State Nigeria with precise geometric parcel boundaries under clear bright daylight" src="/images/screens/a56a24c12a3c.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute bottom-2 left-2 bg-primary/90 text-on-primary px-2 py-0.5 rounded text-[10px] font-mono">NDVI Scan #2026-03</div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Vegetative V6 Growth Index</span>
              <span className="text-on-surface font-semibold">+14.2% vs 2025</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="local_shipping" className="text-primary" />
                <span className="font-label-md text-label-md font-bold text-on-surface">JD 5075E Telematics</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">CANBUS LINK</span>
            </div>
            <div className="w-full h-32 rounded-lg bg-surface-container overflow-hidden relative">
              <img className="w-full h-full object-cover" data-alt="Heavy green agricultural tractor operating in a wide open cultivated field in South-West Nigeria with rich brown soil and clear blue sky" src="/images/screens/9fe0feab9c6c.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute top-2 right-2 bg-surface-container-lowest/95 px-2 py-0.5 rounded shadow text-[10px] font-mono font-bold text-on-surface">Speed: 5.4 km/h</div>
              <div className="absolute bottom-2 left-2 bg-primary/90 text-on-primary px-2 py-0.5 rounded text-[10px] font-mono">Fuel: 78% • 1,420 RPM</div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Coverage: 4.5 / 9.0 Ha Completed</span>
              <span className="text-secondary font-bold">50% Complete</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="thermostat" className="text-secondary" />
                <span className="font-label-md text-label-md font-bold text-on-surface">Poultry House 1 Microclimate</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">NORMAL</span>
            </div>
            <div className="w-full h-32 rounded-lg bg-surface-container overflow-hidden relative">
              <img className="w-full h-full object-cover" data-alt="Modern ventilated commercial poultry house in Nigeria with healthy white broiler chickens and clean automated feeding and drinking lines" src="/images/screens/4815cc9e8dc1.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute top-2 left-2 bg-surface-container-lowest/95 px-2 py-0.5 rounded shadow text-[10px] font-mono font-bold text-on-surface">Temp: 28.4°C | RH: 64%</div>
              <div className="absolute bottom-2 left-2 bg-primary/90 text-on-primary px-2 py-0.5 rounded text-[10px] font-mono">Ammonia: &lt; 10 ppm</div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Mortality Rate: 0.08% (Target &lt; 0.5%)</span>
              <span className="text-secondary font-bold">Grade A Flock</span>
            </div>
          </div>
        </div>
        <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col sm:flex-row items-center justify-between gap-space-sm text-body-sm font-body-sm text-on-surface-variant">
          <div className="flex items-center gap-space-sm">
            <Icon name="verified_user" className="text-secondary" />
            <span>All field activities cryptographically stamped with GPS lat/long &amp; local timestamps for Agro-Syndicate escrow release.</span>
          </div>
          <div className="flex items-center gap-space-md font-label-sm text-label-sm">
            <span className="text-on-surface font-semibold">Mesh Hash: 8f9a..4b1c</span>
            <button className="text-secondary font-bold hover:underline" type="button">View Audit Log</button>
          </div>
        </div>
      </div>
    </div>
  );
}
