// Ported from the "smart_irrigation_automation_8.5_18" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function SmartIrrigation({ lang }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg">
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">Section §8.5 &amp; §18 Execution</span>
                <span className="text-outline-variant font-label-sm text-label-sm">•</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Closed-Loop Precision Core</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary mt-1">Smart Irrigation Automation &amp; Water Resource Command</h1>
            </div>
            <div className="flex items-center bg-surface-container p-1 rounded-lg gap-1">
              <button className="px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all shadow-sm bg-primary-container text-on-primary font-semibold flex items-center gap-1.5" id="mode-auto" type="button"><Icon name="psychology" className="text-[16px]" /> Autonomous Closed-Loop (Active)</button>
              <button className="px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all text-on-surface-variant hover:text-on-surface flex items-center gap-1.5" id="mode-supervised" type="button"><Icon name="verified_user" className="text-[16px]" /> Supervised Operator</button>
              <button className="px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all text-on-surface-variant hover:text-on-surface flex items-center gap-1.5" id="mode-manual" type="button"><Icon name="build_circle" className="text-[16px]" /> Emergency Manual</button>
            </div>
            <div className="flex items-center gap-space-sm">
              <button className="px-space-md py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center gap-1.5 transition-colors" type="button"><Icon name="water_drop" className="text-[18px] text-secondary" /> Instant Flush Cycle</button>
              <button className="px-space-md py-2 rounded-lg bg-error hover:bg-on-error-container text-on-error font-label-lg text-label-lg flex items-center gap-1.5 transition-colors shadow-sm" type="button"><Icon name="power_settings_new" className="text-[18px]" /> Global Emergency Stop</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm pt-space-xs">
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="speed" className="text-[18px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Pressure Relief Valves</span>
              </div>
              <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Nominal (3.2 bar)</span>
            </div>
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="waves" className="text-[18px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Flow Meter Telemetry</span>
              </div>
              <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Online &amp; Calibrated</span>
            </div>
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="solar_power" className="text-[18px] text-tertiary-container" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Solar Array Inverters</span>
              </div>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" /> 94.2 kW Active</span>
            </div>
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="lock" className="text-[18px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Hydraulic Interlocks</span>
              </div>
              <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded-full">Armed &amp; Verified</span>
            </div>
          </div>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Dispatched (24h)</span>
              <Icon name="water_full" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-primary">482,000 <span className="font-body-sm text-body-sm text-on-surface-variant">L</span></div>
              <div className="flex items-center gap-1 mt-1">
                <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-1.5 py-0.5 rounded">-7.3% vs budget</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">520kL Cap</span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: "92.6%" }} />
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Pressurized Zones</span>
              <Icon name="grid_view" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-primary">12 <span className="text-on-surface-variant font-headline-sm text-headline-sm">/ 16</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">8 Drip • 4 Pivot/Guns</div>
            </div>
            <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-label-sm text-label-sm w-fit">75% Cluster Engaged</span>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Soil Water Deficit</span>
              <Icon name="opacity" className="text-[20px] text-tertiary-container" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-tertiary-container">-12.4 <span className="font-body-sm text-body-sm text-on-surface-variant">mm</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Target: +14.0mm recharge</div>
            </div>
            <span className="text-on-tertiary-fixed-variant bg-tertiary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full w-fit">Scheduled Tonight (22:00)</span>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Solar Pump Flow</span>
              <Icon name="nest_heat_link_gen_3" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-primary">64.5 <span className="font-body-sm text-body-sm text-on-surface-variant">m³/h</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Dual 15 HP Grundfos</div>
            </div>
            <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full w-fit">48kW Dedicated Array</span>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Water Use Efficiency</span>
              <Icon name="trending_up" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-primary">4.12 <span className="font-body-sm text-body-sm text-on-surface-variant">kg/m³</span></div>
              <div className="font-body-sm text-body-sm text-secondary font-semibold mt-1">+18.4% vs Furrow baseline</div>
            </div>
            <span className="bg-surface-container text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full w-fit">Benchmark Exceeded</span>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Pumping Energy Cost</span>
              <Icon name="savings" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-secondary">₦0.00</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">100% Zero-Grid Offset</div>
            </div>
            <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full w-fit">₦418,000 Diesel Saved</span>
          </div>
        </section>
        <section className="bg-primary-container text-on-primary rounded-xl p-space-md shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-lg bg-surface-container-lowest/10 flex items-center justify-center shrink-0">
              <Icon name="thunderstorm" className="text-secondary-fixed text-[28px]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-md text-label-md uppercase tracking-wider bg-secondary text-on-secondary px-2 py-0.5 rounded">Predictive Auto-Hold Applied</span>
                <span className="font-label-sm text-label-sm text-primary-fixed">• NiMet South-West 48H Radar + Open-Meteo Integration</span>
              </div>
              <p className="font-body-md text-body-md mt-1 text-on-primary/90">Tonight&apos;s convective thunderstorm forecast (<span className="text-secondary-fixed font-semibold">14.0mm expected at 23:30 WAT</span>) in the Iseyin &amp; Oke-Ogun sub-catchment has automatically suspended 3 non-critical drip cycles.</p>
            </div>
          </div>
          <div className="flex items-center gap-space-md shrink-0">
            <div className="flex flex-col text-right">
              <span className="font-label-sm text-label-sm text-primary-fixed">Conserved in Reservoir</span>
              <span className="font-headline-sm text-headline-sm font-semibold text-secondary-fixed">+140,000 Litres</span>
            </div>
            <button className="px-space-md py-2 bg-secondary text-on-secondary rounded-lg font-label-lg text-label-lg hover:bg-secondary/90 transition-colors" type="button">Inspect Weather Model</button>
          </div>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <section className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md">
              <div className="flex flex-col">
                <h2 className="font-headline-md text-headline-md text-primary">Zone Valve Matrix &amp; Actuation State</h2>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Live LoRaWAN telemetry and solenoid state across active cultivation fields</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <button className="px-space-sm py-1 bg-surface-container-low rounded font-label-sm text-label-sm text-on-surface hover:bg-surface-container" type="button">All (16)</button>
                <button className="px-space-sm py-1 bg-primary text-on-primary rounded font-label-sm text-label-sm" type="button">Active Flowing (12)</button>
                <button className="px-space-sm py-1 bg-surface-container-low rounded font-label-sm text-label-sm text-on-surface hover:bg-surface-container" type="button">Idle / Held (4)</button>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-space-sm px-space-md rounded-l-lg">Zone &amp; Crop Estate</th>
                    <th className="py-space-sm px-space-sm">Method &amp; Area</th>
                    <th className="py-space-sm px-space-sm">Soil Moisture</th>
                    <th className="py-space-sm px-space-sm">Flow Telemetry</th>
                    <th className="py-space-sm px-space-sm">Actuator / Valve</th>
                    <th className="py-space-sm px-space-md rounded-r-lg text-right">Command Override</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm divide-y divide-transparent">
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-primary font-semibold">Oke-Ogun Maize Block A</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Zone 1 • Sensor Node #GW-104</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">Precision Drip</span>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">4.2 Hectares</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg font-semibold text-error">26.2%</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Limit: &lt;28%</span>
                        </div>
                        <div className="w-12 bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-error h-full rounded-full" style={{ width: "26.2%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-primary font-semibold">18.5 m³/h</span>
                        <span className="font-label-sm text-label-sm text-secondary">42 mins remaining</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit"><span className="w-2 h-2 rounded-full bg-secondary" /> #SV-01: OPEN</span>
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      <button className="px-space-sm py-1 bg-surface-container hover:bg-error-container hover:text-on-error-container text-on-surface rounded font-label-sm text-label-sm transition-colors" type="button">Force Close</button>
                    </td>
                  </tr>
                  <tr className="bg-surface-container-low/30 hover:bg-surface-container-low transition-colors">
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-primary font-semibold">Iseyin Soya Seedling Nursery</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Zone 2 • Sensor Node #GW-109</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">Micro-Sprinklers</span>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">1.8 Hectares</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg font-semibold text-secondary">34.1%</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Saturated / Safe</span>
                        </div>
                        <div className="w-12 bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full" style={{ width: "78%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface-variant">0.0 m³/h</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Next: 18:00 WAT</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit"><span className="w-2 h-2 rounded-full bg-outline" /> #SV-02: CLOSED</span>
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      <button className="px-space-sm py-1 bg-surface-container hover:bg-secondary hover:text-on-secondary text-on-surface rounded font-label-sm text-label-sm transition-colors" type="button">Manual Start</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-primary font-semibold">Egba Cassava Starch Multiplier</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Zone 3 • Fertigation Rig Alpha</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">Sub-surface Drip</span>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">6.0 Hectares</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg font-semibold text-secondary">29.5%</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Optimal band</span>
                        </div>
                        <div className="w-12 bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full" style={{ width: "55%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-tertiary-container font-semibold">NPK 15-15-15 Pulsed</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Injection 4.2 L/h</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit"><span className="w-2 h-2 rounded-full bg-secondary" /> #SV-03: OPEN</span>
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      <button className="px-space-sm py-1 bg-surface-container hover:bg-error-container hover:text-on-error-container text-on-surface rounded font-label-sm text-label-sm transition-colors" type="button">Pause Fertigate</button>
                    </td>
                  </tr>
                  <tr className="bg-surface-container-low/30 hover:bg-surface-container-low transition-colors">
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-primary font-semibold">Sagamu Lowland Faro-44 Rice Paddies</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Zone 4 • Sluice Cluster S-2</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">Sluice + Solar Lift</span>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">12.0 Hectares</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg font-semibold text-primary">8.5 cm</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Water Depth (Flooded)</span>
                        </div>
                        <div className="w-12 bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-primary-container h-full rounded-full" style={{ width: "85%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-primary font-semibold">Regulated Flow</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Gravitational Inflow</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-sm">
                      <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit"><span className="w-2 h-2 rounded-full bg-tertiary-container" /> #ACT-04: 65% OPEN</span>
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      <button className="px-space-sm py-1 bg-surface-container hover:bg-surface-container-high text-on-surface rounded font-label-sm text-label-sm transition-colors" type="button">Adjust Gate</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-space-sm flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <Icon name="tune" className="text-[18px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Closed-Loop Rule: Auto-throttle if hydraulic manifold pressure drops below 2.8 bar.</span>
              </div>
              <Link className="font-label-sm text-label-sm text-secondary hover:underline font-semibold flex items-center gap-1" href={`/${lang}/account/irrigation`}>Open Actuator Rule Builder <Icon name="arrow_forward" className="text-[16px]" /></Link>
            </div>
          </section>
          <section className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="font-headline-md text-headline-md text-primary">Hydraulic Wells &amp; Pumping Terminal</h2>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Dual deep aquifer draw &amp; filtration telemetry</span>
              </div>
              <Icon name="water_pump" className="text-secondary text-[24px]" />
            </div>
            <div className="flex flex-col gap-space-sm">
              <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md font-semibold text-primary">Borehole Well 01 (Oke-Ogun Deep)</span>
                  <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded font-semibold">Static Table: 19.4m</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
                  <span>Dynamic Drawdown: 22.8m</span>
                  <span>Pump Rate: 33.0 m³/h</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: "48%" }} />
                </div>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-label-md font-semibold text-primary">Borehole Well 02 (Savanna South)</span>
                  <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded font-semibold">Static Table: 21.0m</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
                  <span>Dynamic Drawdown: 24.1m</span>
                  <span>Pump Rate: 31.5 m³/h</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "52%" }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Sand Filter ΔP</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold mt-1">0.3 bar</span>
                <span className="font-label-sm text-label-sm text-secondary mt-1 flex items-center gap-1"><Icon name="check_circle" className="text-[14px]" /> Clean (No Flush)</span>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Main Header Pressure</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold mt-1">3.2 bar</span>
                <span className="font-label-sm text-label-sm text-secondary mt-1 flex items-center gap-1"><Icon name="speed" className="text-[14px]" /> Optimal Range</span>
              </div>
            </div>
            <div className="flex flex-col gap-space-xs mt-auto">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Immutable Operator Event Log</span>
              <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs font-label-sm text-label-sm max-h-48 overflow-y-auto">
                <div className="flex items-start justify-between gap-2 pb-1 border-b border-surface-container">
                  <div className="flex flex-col">
                    <span className="font-semibold text-primary">Autonomous Hold Triggered</span>
                    <span className="text-on-surface-variant">Radar rain trigger: suspended Z-05, Z-08</span>
                  </div>
                  <span className="text-outline font-label-sm text-label-sm">14:22:04</span>
                </div>
                <div className="flex items-start justify-between gap-2 pb-1 border-b border-surface-container">
                  <div className="flex flex-col">
                    <span className="font-semibold text-primary">Q. Olapade (Agronomist)</span>
                    <span className="text-on-surface-variant">Increased pulse in Zone 3 (+0.8 L/h NPK)</span>
                  </div>
                  <span className="text-outline font-label-sm text-label-sm">13:05:18</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-primary">System Auto-Flush Executed</span>
                    <span className="text-on-surface-variant">Cycle completed: 4,200L manifold clean</span>
                  </div>
                  <span className="text-outline font-label-sm text-label-sm">06:00:00</span>
                </div>
              </div>
            </div>
          </section>
        </div>
        <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-col">
              <h3 className="font-headline-sm text-headline-sm text-primary">Catchment &amp; Reservoir Reserves Status</h3>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Integrated gravity storage tanks and rainwater harvesting buffers</span>
            </div>
            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface">Reservoir Tank 1: 94% (470kL)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container" />
                <span className="font-label-sm text-label-sm text-on-surface">Reservoir Tank 2: 81% (405kL)</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md pt-space-xs">
            <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-xs">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-label-md font-semibold text-primary">Sector North-West</span>
                <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-1.5 py-0.5 rounded">Active</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Maize &amp; Sweet Sorghum (18.4 Ha)</span>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-secondary h-full rounded-full" style={{ width: "82%" }} />
              </div>
              <div className="flex justify-between items-center text-outline font-label-sm text-label-sm mt-1">
                <span>Target Moisture: 28%</span>
                <span className="text-primary font-semibold">Current: 27.4%</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-xs">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-label-md font-semibold text-primary">Sector Central</span>
                <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/50 px-1.5 py-0.5 rounded">Active</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Soya Seedlings &amp; Legumes (8.2 Ha)</span>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-secondary h-full rounded-full" style={{ width: "65%" }} />
              </div>
              <div className="flex justify-between items-center text-outline font-label-sm text-label-sm mt-1">
                <span>Target Moisture: 32%</span>
                <span className="text-primary font-semibold">Current: 34.1%</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-xs">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-label-md font-semibold text-primary">Sector South Paddies</span>
                <span className="font-label-sm text-label-sm text-tertiary-container bg-tertiary-fixed px-1.5 py-0.5 rounded">Sluice Lift</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Faro-44 Lowland Rice (12.0 Ha)</span>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-tertiary-container h-full rounded-full" style={{ width: "90%" }} />
              </div>
              <div className="flex justify-between items-center text-outline font-label-sm text-label-sm mt-1">
                <span>Target Depth: 10cm</span>
                <span className="text-primary font-semibold">Current: 8.5cm</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-xs">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-label-md font-semibold text-primary">Sector East Buffer</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">Suspended</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Fallow Soil &amp; Cover Crop (3.9 Ha)</span>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-outline h-full rounded-full" style={{ width: "30%" }} />
              </div>
              <div className="flex justify-between items-center text-outline font-label-sm text-label-sm mt-1">
                <span>Rain Hold Active</span>
                <span className="text-secondary font-semibold">Saving Water</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
