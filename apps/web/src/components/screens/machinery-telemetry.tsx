// Ported from the "machinery_telemetry_fleet_tracking_8.6_19" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function MachineryTelemetry(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> CAN-bus &amp; GPS Telematics Online</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1"><Icon name="wifi_tethering" className="text-[16px] text-secondary" /> Latency: 8s · Starlink Hub + 4G LTE-M Dual Node</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1"><Icon name="satellite_alt" className="text-[16px] text-primary" /> RTK GNSS: Sub-Meter Precision Active</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Machinery Telemetry &amp; Fleet Tracking (§8.6 &amp; §19)</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Real-time telemetry command for 24 heavy units across Iseyin, Saki &amp; Eruwa agricultural clusters with verified proof-of-work (PoW) hectarage.</p>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap self-start md:self-center">
            <button className="px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center gap-2 transition-colors" type="button"><Icon name="download" className="text-[18px]" /> Export Telemetry (.CSV)</button>
            <button className="px-space-md py-2.5 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-lg text-label-lg flex items-center gap-2 transition-colors" type="button"><Icon name="handyman" className="text-[18px]" /> Dispatch Mobile Mechanic</button>
            <button className="px-space-md py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg flex items-center gap-2 shadow-sm transition-colors" type="button"><Icon name="share_location" className="text-[18px]" /> Live Geofence Map View</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex items-center gap-space-md shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary-container text-primary-fixed flex items-center justify-center shrink-0">
              <Icon name="agriculture" className="text-[24px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline truncate">Active Tractors</span>
              <span className="font-metric-num text-metric-num text-on-surface">16 <span className="font-body-sm text-body-sm text-on-surface-variant">/ 16 Online</span></span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">100% Operational</span>
            </div>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex items-center gap-space-md shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
              <Icon name="grass" className="text-[24px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline truncate">Harvesters</span>
              <span className="font-metric-num text-metric-num text-on-surface">4 <span className="font-body-sm text-body-sm text-on-surface-variant">Units</span></span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">3 Active · 1 Staging</span>
            </div>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex items-center gap-space-md shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-surface-container text-on-surface flex items-center justify-center shrink-0">
              <Icon name="local_shipping" className="text-[24px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline truncate">Haulage &amp; Low-Bed</span>
              <span className="font-metric-num text-metric-num text-on-surface">4 <span className="font-body-sm text-body-sm text-on-surface-variant">Units</span></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">2 In Transit · 2 Standby</span>
            </div>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex items-center gap-space-md shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <Icon name="build_circle" className="text-[24px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline truncate">Depot Workshop</span>
              <span className="font-metric-num text-metric-num text-on-surface">2 <span className="font-body-sm text-body-sm text-on-surface-variant">Scheduled</span></span>
              <span className="font-label-sm text-label-sm text-tertiary-container font-semibold">500h Periodic Filter Maint</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-space-md">
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Engine Cycle Hours</span>
              <Icon name="timer" className="text-[18px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">2,840.5 <span className="text-body-sm font-normal text-on-surface-variant">hrs</span></div>
              <div className="flex items-center gap-1 text-secondary font-label-md text-label-md mt-1"><Icon name="trending_up" className="text-[14px]" /> +14.2% YoY Fleet Use</div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary-container h-full rounded-full" style={{ width: "82%" }} />
            </div>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">24h Area Worked</span>
              <Icon name="crop_square" className="text-[18px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">142.8 <span className="text-body-sm font-normal text-on-surface-variant">Ha</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Harrow 68 · Plant 44 · Ridge 31</div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: "91%" }} />
            </div>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Fuel Burn Rate</span>
              <Icon name="local_gas_station" className="text-[18px] text-tertiary-container" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">3.42 <span className="text-body-sm font-normal text-on-surface-variant">L/Ha</span></div>
              <div className="flex items-center gap-1 text-secondary font-label-md text-label-md mt-1"><Icon name="arrow_downward" className="text-[14px]" /> -12.8% vs Manual Log</div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: "74%" }} />
            </div>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Field Speed &amp; Load</span>
              <Icon name="speed" className="text-[18px] text-outline" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">7.2 <span className="text-body-sm font-normal text-on-surface-variant">km/h</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Load Factor: <span className="font-semibold text-on-surface">78% Tractive</span></div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "68%" }} />
            </div>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Idle Time Ratio</span>
              <Icon name="hourglass_disabled" className="text-[18px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">8.4%</div>
              <div className="text-secondary font-label-md text-label-md mt-1">Well below 15% ceiling</div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary-fixed-dim h-full rounded-full" style={{ width: "42%" }} />
            </div>
          </div>
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Cadastral Compliance</span>
              <Icon name="verified_user" className="text-[18px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">99.8%</div>
              <div className="font-body-sm text-body-sm text-secondary font-semibold mt-1">0 Breaches Logged</div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: "99.8%" }} />
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-low/40">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Icon name="radar" className="text-primary text-[22px]" />
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Real-Time Machinery Telematics &amp; Operator Roster</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live CAN-bus diagnostic stream, verified hectare logs, and biometric operator check-ins.</p>
            </div>
            <div className="flex items-center gap-space-xs flex-wrap">
              <button className="px-3 py-1.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg" type="button">All Units (24)</button>
              <button className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors" type="button">Tractors (16)</button>
              <button className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors" type="button">Harvesters (4)</button>
              <button className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors" type="button">Transporters (4)</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-3 px-space-md">Machine / Unit ID</th>
                  <th className="py-3 px-space-md">Operator &amp; Biometrics</th>
                  <th className="py-3 px-space-md">Field / Cadastral Task</th>
                  <th className="py-3 px-space-md">CAN-bus Telemetry</th>
                  <th className="py-3 px-space-md">Fuel &amp; Speed</th>
                  <th className="py-3 px-space-md">Verified Area (PoW)</th>
                  <th className="py-3 px-space-md">Health State</th>
                  <th className="py-3 px-space-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y divide-surface-container-high/40">
                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
                        <Icon name="agriculture" className="text-[20px]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">#TR-01 · MF 375</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">75 HP · SN: MF-2023-9081</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface flex items-center gap-1">Jimoh Rasaq <Icon name="verified" className="text-secondary text-[14px]" label="Biometric ID Verified" /></span>
                      <span className="font-label-sm text-label-sm text-secondary">Biometric Authenticated</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Oke-Ogun Plot 14</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Secondary Harrowing · Sector B</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs font-mono">
                      <span className="text-on-surface-variant">RPM: <strong className="text-on-surface">1,850</strong></span>
                      <span className="text-on-surface-variant">Coolant: <strong className="text-secondary">88°C</strong></span>
                      <span className="text-on-surface-variant">Oil: <strong className="text-on-surface">4.2 bar</strong></span>
                      <span className="text-on-surface-variant">Load: <strong className="text-on-surface">76%</strong></span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1 w-28">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-on-surface">74% Tank</span>
                        <span className="text-secondary font-bold">6.8 km/h</span>
                      </div>
                      <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "74%" }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-on-surface">18.5 / 24.0 Ha</span>
                      <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary-container h-full rounded-full" style={{ width: "77%" }} />
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5"><Icon name="gavel" className="text-[12px]" /> 100% PoW Matched</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Nominal</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="p-1.5 hover:bg-surface-container rounded-lg text-primary transition-colors" title="Telemetry Inspector" type="button">
                      <Icon name="query_stats" className="text-[18px]" />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
                        <Icon name="agriculture" className="text-[20px]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">#TR-04 · JD 5075E</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">75 HP · SN: JD-2024-4412</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface flex items-center gap-1">Taofeeq Adeleke <Icon name="verified" className="text-secondary text-[14px]" /></span>
                      <span className="font-label-sm text-label-sm text-secondary">Biometric Authenticated</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Egba Sector 3</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Contour Ridging · Zone D</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs font-mono">
                      <span className="text-on-surface-variant">RPM: <strong className="text-on-surface">1,920</strong></span>
                      <span className="text-on-surface-variant">Coolant: <strong className="text-secondary">91°C</strong></span>
                      <span className="text-on-surface-variant">Oil: <strong className="text-on-surface">4.0 bar</strong></span>
                      <span className="text-on-surface-variant">Load: <strong className="text-on-surface">81%</strong></span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1 w-28">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-on-surface">62% Tank</span>
                        <span className="text-secondary font-bold">7.1 km/h</span>
                      </div>
                      <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "62%" }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-on-surface">22.4 / 25.0 Ha</span>
                      <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary-container h-full rounded-full" style={{ width: "89%" }} />
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5"><Icon name="gavel" className="text-[12px]" /> 100% PoW Matched</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" /> Due in 18h</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="p-1.5 hover:bg-surface-container rounded-lg text-primary transition-colors" title="Telemetry Inspector" type="button">
                      <Icon name="query_stats" className="text-[18px]" />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
                        <Icon name="agriculture" className="text-[20px]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">#TR-03 · Case IH Farmall</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">80 HP · SN: CIH-2022-1082</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface flex items-center gap-1">Abiodun Kolade <Icon name="verified" className="text-secondary text-[14px]" /></span>
                      <span className="font-label-sm text-label-sm text-secondary">Biometric Authenticated</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Iseyin East Basin</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Deep Ripping · Sub-Field 02</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs font-mono">
                      <span className="text-on-surface-variant">RPM: <strong className="text-on-surface">1,780</strong></span>
                      <span className="text-on-surface-variant">Coolant: <strong className="text-secondary">86°C</strong></span>
                      <span className="text-on-surface-variant">Oil: <strong className="text-on-surface">3.8 bar</strong></span>
                      <span className="text-on-surface-variant">DP: <strong className="text-tertiary-container">ΔP 1.4 kPa</strong></span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1 w-28">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-on-surface">58% Tank</span>
                        <span className="text-secondary font-bold">6.2 km/h</span>
                      </div>
                      <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "58%" }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-on-surface">14.1 / 18.0 Ha</span>
                      <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary-container h-full rounded-full" style={{ width: "78%" }} />
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5"><Icon name="gavel" className="text-[12px]" /> 100% PoW Matched</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm" title="Advisory Code DTC P006A"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" /> Air Filter Adv.</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="p-1.5 hover:bg-surface-container rounded-lg text-primary transition-colors" title="Telemetry Inspector" type="button">
                      <Icon name="query_stats" className="text-[18px]" />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
                        <Icon name="grass" className="text-[20px]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">#CH-02 · NH TC5.30</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Combine Harvester · 175 HP</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface flex items-center gap-1">Mufutau Balogun <Icon name="verified" className="text-secondary text-[14px]" /></span>
                      <span className="font-label-sm text-label-sm text-secondary">Biometric Authenticated</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Shaki Grain Valley</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Sorghum Harvest · Block 08</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs font-mono">
                      <span className="text-on-surface-variant">RPM: <strong className="text-on-surface">2,100</strong></span>
                      <span className="text-on-surface-variant">Coolant: <strong className="text-secondary">89°C</strong></span>
                      <span className="text-on-surface-variant">Thresh: <strong className="text-on-surface">850 rpm</strong></span>
                      <span className="text-on-surface-variant">Load: <strong className="text-on-surface">84%</strong></span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1 w-28">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-on-surface">82% Tank</span>
                        <span className="text-secondary font-bold">4.8 km/h</span>
                      </div>
                      <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "82%" }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-on-surface">31.2 / 38.0 Ha</span>
                      <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary-container h-full rounded-full" style={{ width: "82%" }} />
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5"><Icon name="gavel" className="text-[12px]" /> 100% PoW Matched</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Nominal</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="p-1.5 hover:bg-surface-container rounded-lg text-primary transition-colors" title="Telemetry Inspector" type="button">
                      <Icon name="query_stats" className="text-[18px]" />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
                        <Icon name="local_shipping" className="text-[20px]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">#LB-01 · Steyr 8x4</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Low-Bed Transporter · 420 HP</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface flex items-center gap-1">Kehinde Olatunji <Icon name="verified" className="text-secondary text-[14px]" /></span>
                      <span className="font-label-sm text-label-sm text-secondary">Biometric Authenticated</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Sagamu - Iseyin Arterial</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Implements Haulage Transit</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs font-mono">
                      <span className="text-on-surface-variant">RPM: <strong className="text-on-surface">1,420</strong></span>
                      <span className="text-on-surface-variant">Coolant: <strong className="text-secondary">84°C</strong></span>
                      <span className="text-on-surface-variant">Air: <strong className="text-on-surface">8.1 bar</strong></span>
                      <span className="text-on-surface-variant">Load: <strong className="text-on-surface">62%</strong></span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1 w-28">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-on-surface">91% Tank</span>
                        <span className="text-secondary font-bold">54 km/h</span>
                      </div>
                      <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "91%" }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-on-surface">Transit Route #4</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">ETA Depot: 42 mins</span>
                      <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5"><Icon name="security" className="text-[12px]" /> Corridor Compliant</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> In Transit</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="p-1.5 hover:bg-surface-container rounded-lg text-primary transition-colors" title="Telemetry Inspector" type="button">
                      <Icon name="query_stats" className="text-[18px]" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
            <div className="flex items-center gap-space-md flex-wrap">
              <span>Showing 5 of 24 Units Logged</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-secondary"><Icon name="sync" className="text-[14px]" /> CAN-Bus Sync Frequency: 500ms</span>
              <span>•</span>
              <span>Cryptographic Hash: <code className="font-mono text-xs">0x8f2d...c3b9 (Polygon PoW Ledger)</code></span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2.5 py-1 bg-surface-container-lowest text-on-surface rounded font-semibold shadow-sm hover:bg-surface-container transition-colors" type="button">Previous</button>
              <button className="px-2.5 py-1 bg-primary text-on-primary rounded font-semibold transition-colors" type="button">1</button>
              <button className="px-2.5 py-1 bg-surface-container-lowest text-on-surface rounded font-semibold shadow-sm hover:bg-surface-container transition-colors" type="button">2</button>
              <button className="px-2.5 py-1 bg-surface-container-lowest text-on-surface rounded font-semibold shadow-sm hover:bg-surface-container transition-colors" type="button">Next</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-1 mb-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="verified_user" className="text-secondary text-[22px]" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Fuel Telematics &amp; Anti-Siphon Watchdog</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Zero Siphon Anomalies</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Continuous ultrasonic level sensor curve cross-referenced with engine load &amp; torque output.</p>
            </div>
            <div className="w-full bg-surface-container-low/50 rounded-lg p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Continuous Fuel Burn vs Engine Work Load (Last 12 Hours)</span>
                <span className="font-mono text-secondary font-semibold">Tolerance: ±0.05 L/Ha</span>
              </div>
              <div className="w-full h-40">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 140">
                  <line className="text-surface-container-high" stroke="currentColor" strokeDasharray="4" x1="0" x2="600" y1="30" y2="30" />
                  <line className="text-surface-container-high" stroke="currentColor" strokeDasharray="4" x1="0" x2="600" y1="70" y2="70" />
                  <line className="text-surface-container-high" stroke="currentColor" strokeDasharray="4" x1="0" x2="600" y1="110" y2="110" />
                  <path d="M 0,40 Q 80,48 150,55 T 300,75 T 450,88 T 600,105 L 600,140 L 0,140 Z" fill="rgba(0, 108, 73, 0.1)" />
                  <path d="M 0,40 Q 80,48 150,55 T 300,75 T 450,88 T 600,105" fill="none" stroke="#006c49" strokeLinecap="round" strokeWidth="3" />
                  <path d="M 0,70 L 40,50 L 90,85 L 140,40 L 190,45 L 240,65 L 290,38 L 340,52 L 390,70 L 440,35 L 490,48 L 540,60 L 600,50" fill="none" stroke="#ff9939" strokeLinecap="round" strokeWidth="2" />
                  <circle cx="150" cy="55" fill="#006c49" r="4" />
                  <circle cx="300" cy="75" fill="#006c49" r="4" />
                  <circle cx="450" cy="88" fill="#006c49" r="4" />
                </svg>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surface-container font-label-sm text-label-sm text-on-surface-variant">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-secondary rounded-full" /> Fuel Volume Remaining (L)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-on-tertiary-container rounded-full" /> Engine Load Dynamic (%)</span>
                </div>
                <span className="font-mono">Current Cluster Level: 4,120 L</span>
              </div>
            </div>
            <div className="mt-space-md p-space-md rounded-lg bg-surface-container flex items-start gap-space-md">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                <Icon name="security" className="text-[20px]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">Anti-Theft Guardian Protocol: Verified Nominal</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Active</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">No rapid fuel drops (&gt;3.0 L/min with ignition switch off) recorded in the last 48 hours across any registered tractor, combine, or low-bed diesel tank.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-1 mb-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="map" className="text-primary text-[22px]" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Cadastral Polygon Coverage</h3>
                </div>
                <span className="font-mono text-xs text-on-surface-variant">EPSG:4326 · UTM 31N</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live geofence breadcrumb trail corroborating implement pass lines.</p>
            </div>
            <div className="relative w-full h-64 rounded-xl overflow-hidden bg-surface-container" data-alt="Satellite imagery map view of extensive agricultural fields in Oyo State Nigeria with vibrant green crop borders and precision telemetry tractor pathways clearly marked in bright green lines under daytime sunlight." data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/442c1d15059d.webp')" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
              <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                <span className="px-2.5 py-1 rounded bg-surface-container-lowest/90 backdrop-blur text-on-surface font-label-sm text-label-sm font-bold shadow-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Oke-Ogun Hub</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-on-primary">
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg font-bold">Plot 14 Cadastral Sector B</span>
                  <span className="font-label-sm text-label-sm text-primary-fixed">98.4% Track Overlap Accuracy (RTK)</span>
                </div>
                <div className="px-3 py-1 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">Pass 14 of 18</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-space-md pt-space-sm border-t border-surface-container text-center">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Perimeter Offset</span>
                <span className="font-label-lg text-label-lg font-bold text-on-surface">&lt; 15 cm</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Turning Headlands</span>
                <span className="font-label-lg text-label-lg font-bold text-secondary">Optimal</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Overlap Skip Rate</span>
                <span className="font-label-lg text-label-lg font-bold text-on-surface">1.2%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="terminal" className="text-primary text-[20px]" />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">DTC Engine Diagnostics</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono text-xs">J1939 CAN</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live broadcast of SAE J1939 ECU fault codes and differential sensors.</p>
            </div>
            <div className="my-space-md flex flex-col gap-space-sm">
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-secondary text-[18px]" />
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">Critical Engine Faults (MIL)</span>
                </div>
                <span className="font-mono font-bold text-secondary text-sm">0 Active</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="warning" className="text-tertiary-container text-[18px]" />
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">Advisory DTC #TR-03</span>
                    <span className="font-mono text-xs text-outline">SPN 107 FMI 0 (Air Filter ΔP)</span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm font-semibold text-tertiary-container">Inspect Depot</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="thermostat" className="text-secondary text-[18px]" />
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">Transmission Temperature</span>
                </div>
                <span className="font-mono font-bold text-secondary text-sm">All &lt; 92°C</span>
              </div>
            </div>
            <div className="font-label-sm text-label-sm text-outline flex items-center gap-1"><Icon name="info" className="text-[14px]" /> Next automatic engine CAN scan scheduled in 4m 12s</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="hourglass_top" className="text-primary text-[20px]" />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">Maintenance Countdown</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Depot 01</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Preventative service scheduling according to cumulative hour-meters.</p>
            </div>
            <div className="my-space-md p-space-md bg-surface-container-low rounded-lg flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg font-bold text-on-surface">#TR-04 (JD 5075E)</span>
                <span className="font-mono text-tertiary-container font-bold text-sm">18.5 hrs remaining</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary-container h-full rounded-full" style={{ width: "96%" }} />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">500-hour major service: Engine synthetic oil change, hydraulic high-pressure filter replacement, and tie-rod greasing.</p>
            </div>
            <div className="flex items-center justify-between pt-space-xs">
              <span className="font-label-sm text-label-sm text-outline">Service Bay 2 Assigned</span>
              <button className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors" type="button">View Service Pack</button>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="military_tech" className="text-primary text-[20px]" />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">Operator Precision Index</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">Top Quartile</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Engine conservation, headland turn smoothness &amp; idle minimization.</p>
            </div>
            <div className="my-space-md flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface">Speed Uniformity Index</span>
                <span className="font-label-md text-label-md font-bold text-secondary">94 / 100</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "94%" }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-body-sm text-body-sm text-on-surface">Headland Turning Technique</span>
                <span className="font-label-md text-label-md font-bold text-secondary">91 / 100</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "91%" }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-body-sm text-body-sm text-on-surface">Idle Minimization Compliance</span>
                <span className="font-label-md text-label-md font-bold text-secondary">96 / 100</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "96%" }} />
              </div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Cluster Leader: <strong className="text-on-surface">Jimoh Rasaq (96.4)</strong></span>
              <span className="text-secondary font-semibold">+₦18,500 Fuel Bonus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
