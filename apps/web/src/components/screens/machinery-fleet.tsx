// Ported from the "machinery_fleet_workshop_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function MachineryFleet(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm text-on-surface-variant font-label-md text-label-md">
              <span className="flex items-center gap-1 font-semibold text-primary"><Icon name="precision_manufacturing" className="text-base" /> Machinery Syndicate Network</span>
              <span className="text-outline">/</span>
              <span className="text-on-surface">Fleet Command &amp; Workshop OS</span>
              <span className="text-outline">/</span>
              <span className="text-secondary font-semibold">Iseyin Savanna Cluster Hub</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-bold tracking-tight">Direct Settlement Fleet</span>
              <span className="opacity-60">•</span>
              <span>0% Platform Commission Pilot</span>
            </div>
          </div>
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm uppercase tracking-wider font-bold">SPEC §5.1 &amp; §5.3 COMPLIANT</span>
                <span className="text-on-surface-variant font-label-sm text-label-sm font-medium">CAC Syndicate #RC-1940822-OYO</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Machinery Fleet &amp; Workshop Hub</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Syndicate tractor fleet tracking, booking dispatch management, telemetry diagnostics, and preventive maintenance logs.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm shrink-0">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors font-label-lg text-label-lg font-semibold shadow-sm" type="button"><Icon name="download" className="text-lg text-primary" /> Export Telematics Report</button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-tertiary-container text-on-tertiary hover:bg-tertiary transition-colors font-label-lg text-label-lg font-semibold shadow-sm" type="button"><Icon name="build_circle" className="text-lg" /> Schedule Service / Overhaul</button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-lg text-label-lg font-semibold shadow-sm" type="button"><Icon name="add_circle" className="text-lg text-secondary-container" /> Add Machinery Asset</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Active Fleet Assets</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-metric-num text-metric-num text-on-surface">6</span>
                    <span className="font-label-lg text-label-lg font-bold text-primary">Heavy Units</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <Icon name="agriculture" className="text-2xl" />
                </div>
              </div>
              <div className="mt-4 pt-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-label-sm font-label-sm">
                  <span className="text-on-surface-variant">4 Tractors • 1 Sprayer • 1 Harvester</span>
                  <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-primary font-bold">100% CAC Verified</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden flex">
                  <div className="bg-primary h-full w-4/6" title="Tractors (4)" />
                  <div className="bg-secondary h-full w-1/6" title="Boom Sprayer (1)" />
                  <div className="bg-tertiary-container h-full w-1/6" title="Combine Harvester (1)" />
                </div>
              </div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Season Machine Earnings</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-metric-num text-metric-num text-on-surface">₦3,480,000</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <Icon name="payments" className="text-2xl" />
                </div>
              </div>
              <div className="mt-4 pt-3 flex flex-col gap-1">
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> ₦2,850,000 Direct Settled</span>
                  <span className="text-secondary font-bold">81.9% Paid</span>
                </div>
                <span className="text-on-surface-variant font-label-sm text-label-sm">₦630,000 pending completion in 2 active jobs</span>
              </div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Fleet Utilization Rate</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-metric-num text-metric-num text-on-surface">84.2%</span>
                    <span className="font-label-sm text-label-sm font-bold text-secondary bg-secondary-container/40 px-1.5 py-0.5 rounded">+6.4% MoM</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <Icon name="speed" className="text-2xl" />
                </div>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Daily Average Engine Run</span>
                  <span className="font-body-md text-body-md font-bold text-on-surface">7.8 hrs / day / tractor</span>
                </div>
                <svg className="w-16 h-8 text-secondary overflow-visible" fill="none" viewBox="0 0 64 32">
                  <path d="M0 24 L12 20 L24 22 L36 12 L48 16 L64 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  <circle cx="64" cy="4" fill="currentColor" r="3" />
                </svg>
              </div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">Maintenance Health</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-metric-num text-metric-num text-tertiary-container">1 Unit Due</span>
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Service Today</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary group-hover:scale-105 transition-transform">
                  <Icon name="warning" className="text-2xl" />
                </div>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm font-bold text-on-surface truncate">MF 375 (#MCH-MF-02)</span>
                  <span className="font-label-sm text-label-sm text-error truncate">250-hr interval • Lift arm seal</span>
                </div>
                <span className="px-2 py-1 rounded bg-tertiary-fixed-dim/40 text-tertiary font-label-sm text-label-sm font-bold shrink-0">15:00 WAT</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            <div className="lg:col-span-8 flex flex-col gap-space-xl">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <h2 className="font-headline-md text-headline-md text-on-surface">Fleet Asset Inventory &amp; Telemetry Registry</h2>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Real-time CAN-bus telemetry, hour-meter audits, and geographic deployment.</p>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-container-low shrink-0">
                    <button className="px-3 py-1 rounded bg-surface-container-lowest text-primary font-label-md text-label-md font-bold shadow-sm" type="button">All (6)</button>
                    <button className="px-3 py-1 rounded text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-medium" type="button">Dispatched (3)</button>
                    <button className="px-3 py-1 rounded text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-medium" type="button">In Yard (2)</button>
                    <button className="px-3 py-1 rounded text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-medium" type="button">Workshop (1)</button>
                  </div>
                </div>
                <div className="p-space-lg grid grid-cols-1 gap-space-md bg-surface-container-low/40">
                  <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md hover:shadow transition-shadow">
                    <div className="flex items-center gap-space-md min-w-0">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-high shrink-0 overflow-hidden relative flex items-center justify-center">
                        <Icon name="agriculture" className="text-3xl text-primary" />
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">John Deere 5075E (75 HP)</span>
                          <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">#MCH-JD-01</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" /> Working: Plot A1 Maize</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
                          <span className="flex items-center gap-1 text-on-surface"><Icon name="badge" className="text-base text-secondary" /> Operator: <strong className="font-semibold text-primary">Babatunde Gbadamosi</strong></span>
                          <span>•</span>
                          <span>Engine: <strong>1,420.5 hrs</strong></span>
                          <span>•</span>
                          <span className="text-secondary font-medium">Next Service in 79.5 hrs</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm w-full lg:w-auto justify-between lg:justify-end shrink-0 pt-2 lg:pt-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low">
                        <Icon name="local_gas_station" className="text-secondary text-base" />
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Fuel Level</span>
                          <span className="font-label-md text-label-md font-bold text-on-surface">78% (62 L)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low">
                        <Icon name="speed" className="text-primary text-base" />
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">RPM / Speed</span>
                          <span className="font-label-md text-label-md font-bold text-on-surface">1,420 • 5.4 km/h</span>
                        </div>
                      </div>
                      <button className="p-2 rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors" title="Telemetry Detail" type="button">
                        <Icon name="insights" className="text-xl" />
                      </button>
                    </div>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md hover:shadow transition-shadow">
                    <div className="flex items-center gap-space-md min-w-0">
                      <div className="w-16 h-16 rounded-lg bg-tertiary-fixed/30 shrink-0 overflow-hidden relative flex items-center justify-center">
                        <Icon name="engineering" className="text-3xl text-tertiary" />
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-tertiary" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Massey Ferguson MF 375 (75 HP) + Disc Harrow</span>
                          <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">#MCH-MF-02</span>
                          <span className="px-2 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error" /> Service Due (248/250 hrs)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
                          <span className="flex items-center gap-1 text-on-surface"><Icon name="badge" className="text-base text-outline" /> Operator: <strong className="font-semibold">Alhaji Kazeem Syndicate</strong></span>
                          <span>•</span>
                          <span>Engine: <strong>2,248.0 hrs</strong></span>
                          <span>•</span>
                          <span className="text-error font-medium">Issue: Hydraulic lift arm seal weeping</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm w-full lg:w-auto justify-between lg:justify-end shrink-0 pt-2 lg:pt-0">
                      <div className="flex flex-col text-right">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Staged Location</span>
                        <span className="font-label-md text-label-md font-bold text-on-surface">Iseyin Central Workshop</span>
                      </div>
                      <button className="px-3.5 py-2 rounded-lg bg-tertiary-container text-on-tertiary hover:bg-tertiary font-label-md text-label-md font-bold transition-colors" type="button">Open Service Ticket</button>
                    </div>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md hover:shadow transition-shadow">
                    <div className="flex items-center gap-space-md min-w-0">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-high shrink-0 overflow-hidden relative flex items-center justify-center">
                        <Icon name="water_drop" className="text-3xl text-secondary" />
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-outline" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Agrional 600L High-Clearance Boom Sprayer</span>
                          <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">#MCH-BS-01</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold">Available in Yard (Iseyin Hub)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
                          <span className="flex items-center gap-1 text-on-surface"><Icon name="badge" className="text-base text-secondary" /> Assigned: <strong className="font-semibold">Yekini Bello</strong></span>
                          <span>•</span>
                          <span>Calibration Log: Checked 3 days ago</span>
                          <span>•</span>
                          <span className="text-secondary font-medium">Anti-drift nozzles 0.3 Bar certified</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm w-full lg:w-auto justify-between lg:justify-end shrink-0 pt-2 lg:pt-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low">
                        <Icon name="check_circle" className="text-secondary text-base" />
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Nozzle Array</span>
                          <span className="font-label-md text-label-md font-bold text-on-surface">12m Boom • Ready</span>
                        </div>
                      </div>
                      <button className="px-3.5 py-2 rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md font-semibold transition-colors" type="button">Assign Dispatch</button>
                    </div>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md hover:shadow transition-shadow">
                    <div className="flex items-center gap-space-md min-w-0">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-high shrink-0 overflow-hidden relative flex items-center justify-center">
                        <Icon name="airport_shuttle" className="text-3xl text-primary" />
                        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">New Holland TT55 (55 HP) Secondary Tillage</span>
                          <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">#MCH-NH-01</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold flex items-center gap-1"><Icon name="schedule" className="text-sm" /> Booked for Tomorrow (Odo-Ogun 16 Ha)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
                          <span className="flex items-center gap-1 text-on-surface"><Icon name="badge" className="text-base text-secondary" /> Operator: <strong className="font-semibold">Adeleke O.</strong></span>
                          <span>•</span>
                          <span>Pre-start Inspection: Verified</span>
                          <span>•</span>
                          <span className="text-on-surface-variant">Fuel: 95% full tank staged</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm w-full lg:w-auto justify-between lg:justify-end shrink-0 pt-2 lg:pt-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low">
                        <Icon name="route" className="text-primary text-base" />
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Mobilization</span>
                          <span className="font-label-md text-label-md font-bold text-on-surface">Tomorrow 07:00</span>
                        </div>
                      </div>
                      <button className="p-2 rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors" type="button">
                        <Icon name="map" className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="calendar_month" className="text-primary" />
                      <h2 className="font-headline-md text-headline-md text-on-surface">Active Machinery Bookings &amp; Job Dispatch Calendar</h2>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Direct settlement contracts, geo-fenced acreage metering, and syndicate clusters.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">View mode:</span>
                    <span className="px-2.5 py-1 rounded bg-surface-container-high text-primary font-label-md text-label-md font-bold">Acreage Roster</span>
                  </div>
                </div>
                <div className="p-space-lg pt-0 flex flex-col gap-space-md">
                  <div className="p-space-md rounded-xl bg-surface-container-low/50 flex flex-col gap-space-sm">
                    <div className="flex flex-wrap items-start justify-between gap-space-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">#BKG-2026-0492</span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Rotary Inter-row Weeding • Plot A1 Maize</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> In Progress</span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Client Farmer: <strong className="text-on-surface">Quadri Olapade</strong> (Iseyin Central) • Target Scope: <strong>9.0 Hectares</strong></span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-headline-sm text-headline-sm font-bold text-primary">₦95,000</span>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">Direct Cash Settlement (Lump sum)</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2 p-3 rounded-lg bg-surface-container-lowest">
                      <div className="flex items-center justify-between text-body-sm font-body-sm">
                        <span className="text-on-surface font-medium flex items-center gap-1.5"><Icon name="fence" className="text-secondary text-base" /> Geofenced Telemetry Lock: <strong>6.2 Ha completed (68.8%)</strong></span>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">2.8 Ha remaining • 0 Boundary Breaches</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: "68.8%" }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-space-sm pt-2 text-label-sm font-label-sm text-on-surface-variant">
                      <div className="flex items-center gap-3">
                        <span>Assigned Unit: <strong>#MCH-JD-01 (John Deere 5075E)</strong></span>
                        <span>•</span>
                        <span>Operator: <strong>Babatunde Gbadamosi</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-2.5 py-1 rounded bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-semibold transition-colors" type="button">View Live GPS Boundary</button>
                        <button className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-bold hover:bg-secondary hover:text-on-secondary transition-colors" type="button">Sign Off Completed Plot</button>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-low/50 flex flex-col gap-space-sm">
                    <div className="flex flex-wrap items-start justify-between gap-space-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">#BKG-2026-0504</span>
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Clustered Harrowing Syndicate (16.0 Ha contig.)</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold flex items-center gap-1"><Icon name="event" className="text-sm" /> Staged for Tomorrow 07:00 WAT</span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Location: <strong>Odo-Ogun Agricultural Corridor</strong> • Contiguous Multi-Smallholder Syndicate</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-on-surface-variant font-body-sm text-body-sm">₦448,000</span>
                          <span className="font-headline-sm text-headline-sm font-bold text-primary">₦400,000</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">Syndicate Mobilization Rate (₦25k/Ha vs ₦28k)</span>
                      </div>
                    </div>
                    <div className="mt-2 rounded-lg bg-surface-container-lowest overflow-hidden">
                      <div className="px-3 py-2 bg-surface-container-high/40 flex items-center justify-between font-label-sm text-label-sm font-bold text-on-surface-variant">
                        <span>CONTIGUOUS PARCEL ROSTER (4 SMALLHOLDERS)</span>
                        <span>DISPATCH STAGE: LOW TILL PREP</span>
                      </div>
                      <div className="divide-y-0 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-body-sm font-body-sm">
                        <div className="p-2 rounded bg-surface-container-low/60 flex flex-col">
                          <span className="font-semibold text-on-surface truncate">Madam Folashade Alabi</span>
                          <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant mt-1">
                            <span>Parcel A: <strong>4.0 Ha</strong></span>
                            <span className="text-secondary font-bold">₦100,000</span>
                          </div>
                        </div>
                        <div className="p-2 rounded bg-surface-container-low/60 flex flex-col">
                          <span className="font-semibold text-on-surface truncate">Yekini Bello</span>
                          <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant mt-1">
                            <span>Parcel B: <strong>4.0 Ha</strong></span>
                            <span className="text-secondary font-bold">₦100,000</span>
                          </div>
                        </div>
                        <div className="p-2 rounded bg-surface-container-low/60 flex flex-col">
                          <span className="font-semibold text-on-surface truncate">Kafayat Ajayi</span>
                          <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant mt-1">
                            <span>Parcel C: <strong>3.5 Ha</strong></span>
                            <span className="text-secondary font-bold">₦87,500</span>
                          </div>
                        </div>
                        <div className="p-2 rounded bg-surface-container-low/60 flex flex-col">
                          <span className="font-semibold text-on-surface truncate">Elder Oguntola</span>
                          <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant mt-1">
                            <span>Parcel D: <strong>4.5 Ha</strong></span>
                            <span className="text-secondary font-bold">₦112,500</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-space-sm pt-2 text-label-sm font-label-sm text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <Icon name="local_shipping" className="text-base text-secondary" />
                        <span>Assigned Unit: <strong>#MCH-NH-01 (New Holland TT55)</strong></span>
                        <span>•</span>
                        <span>Operator: <strong>Adeleke O.</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-semibold transition-colors" type="button">Re-route Mobilization</button>
                        <button className="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-bold transition-colors" type="button">Confirm Dispatch Lock</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-space-xl">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-space-lg flex items-center justify-between bg-surface-container-lowest">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="build_circle" className="text-tertiary-container" />
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">Preventive Maintenance Queue</h2>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Workshop Master Specs §5.3</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-tertiary font-label-sm text-label-sm font-bold">1 Active</span>
                </div>
                <div className="p-space-lg pt-0 flex flex-col gap-space-md">
                  <div className="p-space-md rounded-xl bg-surface-container-low/70 flex flex-col gap-space-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-error-container text-error font-label-sm text-label-sm font-bold">HIGH PRIORITY</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">#MNT-2026-034</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">Massey Ferguson 375</h3>
                        <span className="font-label-md text-label-md text-on-surface-variant font-mono">Tag: #MCH-MF-02</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-label-sm text-label-sm font-bold text-tertiary bg-tertiary-fixed-dim/40 px-2 py-0.5 rounded">Today 15:00 WAT</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Est. Downtime: 4.0 hrs</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-lowest flex flex-col gap-2 mt-1">
                      <span className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider">Work Scope (250-Hr Interval):</span>
                      <ul className="space-y-1.5 text-body-sm font-body-sm text-on-surface">
                        <li className="flex items-center gap-2">
                          <Icon name="check_circle" className="text-secondary text-base" />
                          <span>Shell Rimula 15W-40 Heavy Engine Oil Flush</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Icon name="check_circle" className="text-secondary text-base" />
                          <span>Perkins Secondary Fuel Filter Replacement</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Icon name="pending" className="text-tertiary-container text-base" />
                          <span>Hydraulic Lift Arm O-Ring Seal Replacement (Weeping)</span>
                        </li>
                      </ul>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-body-sm font-body-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold">MI</div>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-bold text-on-surface">Master Idowu</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Lead Hydraulic Specialist</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Parts Staged (Hub Store)</span>
                        <span className="font-label-md text-label-md font-bold text-primary">₦42,000 Logged</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button className="w-full py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-bold transition-colors" type="button">Authorize Parts &amp; Begin Service</button>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between text-body-sm font-body-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name="event_upcoming" className="text-primary text-lg shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-on-surface truncate">John Deere 5075E 1,500-Hr Overhaul</span>
                        <span className="text-on-surface-variant text-label-sm font-label-sm">In 79 operating hours • Air &amp; Cabin Filters staged</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold shrink-0">On Track</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-space-lg flex items-center justify-between bg-surface-container-lowest">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="verified_user" className="text-secondary" />
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">Operator Roster &amp; Compliance</h2>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Telemetry-audited performance scores</span>
                  </div>
                  <button className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high" type="button">
                    <Icon name="more_horiz" className="text-lg" />
                  </button>
                </div>
                <div className="p-space-lg pt-0 flex flex-col gap-space-md">
                  <div className="p-space-md rounded-xl bg-surface-container-low/50 flex flex-col gap-2 hover:bg-surface-container-low transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold font-headline-sm text-headline-sm">BG</div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-lg text-label-lg font-bold text-on-surface">Babatunde Gbadamosi</span>
                            <Icon name="verified" className="text-secondary text-sm" label="Certified Agronomist Operator" />
                          </div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">John Deere 5075E Lead • 48 Verified Jobs</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-lowest shadow-xs text-tertiary-container font-label-md text-label-md font-bold">
                        <Icon name="star" filled className="text-sm text-tertiary-container" />
                        <span>4.95</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-label-sm font-label-sm">
                      <div className="p-2 rounded bg-surface-container-lowest flex flex-col">
                        <span className="text-on-surface-variant">Fuel Economy Metric</span>
                        <span className="font-bold text-secondary">4.8 L / Hectare (Optimal)</span>
                      </div>
                      <div className="p-2 rounded bg-surface-container-lowest flex flex-col">
                        <span className="text-on-surface-variant">Boundary Compliance</span>
                        <span className="font-bold text-primary">0 Boundary Drift Incidents</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Currently in Cab (Active Job)</span>
                      <div className="flex items-center gap-1.5">
                        <button className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-md text-label-md font-semibold flex items-center gap-1 shadow-xs" type="button"><Icon name="call" className="text-sm" /> Call Cab</button>
                        <button className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-md text-label-md font-semibold flex items-center gap-1 shadow-xs" type="button"><Icon name="sms" className="text-sm" /> SMS Dispatch</button>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-low/50 flex flex-col gap-2 hover:bg-surface-container-low transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold font-headline-sm text-headline-sm">ML</div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-lg text-label-lg font-bold text-on-surface">Muritala Lawal</span>
                            <Icon name="verified" className="text-secondary text-sm" />
                          </div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Massey Ferguson 375 Primary • 32 Verified Jobs</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-lowest shadow-xs text-tertiary-container font-label-md text-label-md font-bold">
                        <Icon name="star" filled className="text-sm text-tertiary-container" />
                        <span>4.80</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-label-sm font-label-sm">
                      <div className="p-2 rounded bg-surface-container-lowest flex flex-col">
                        <span className="text-on-surface-variant">Daily Pre-check Log</span>
                        <span className="font-bold text-primary">Checklist Completed Today</span>
                      </div>
                      <div className="p-2 rounded bg-surface-container-lowest flex flex-col">
                        <span className="text-on-surface-variant">Issue Reporting Speed</span>
                        <span className="font-bold text-secondary">&lt; 15 mins (Fast)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary" /> At Workshop with MF 375</span>
                      <div className="flex items-center gap-1.5">
                        <button className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-md text-label-md font-semibold flex items-center gap-1 shadow-xs" type="button"><Icon name="call" className="text-sm" /> Call</button>
                        <button className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary hover:bg-surface-container-high font-label-md text-label-md font-semibold flex items-center gap-1 shadow-xs" type="button"><Icon name="sms" className="text-sm" /> SMS</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                <Icon name="sync_saved_locally" className="text-lg" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-bold text-on-surface">PowerSync Offline Engine Active</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Equatorial Savanna Mesh: SQLite client synchronized (12,410 telemetry points cached).</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 font-label-sm text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1"><Icon name="gps_fixed" className="text-sm text-secondary" /> GPS Tamper-Evident Clock: <strong>Synced 42s ago</strong></span>
              <span>•</span>
              <span>Firmware: <strong>CAN-v4.1.8 AgroNode</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
