// Ported from the "logistics_haulage_hub_6.5" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function LogisticsHub(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg">
        <div className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <nav className="flex items-center gap-space-xs text-body-sm font-body-sm text-outline">
                <span>Agricultural Commerce</span>
                <Icon name="chevron_right" className="text-[14px]" />
                <span className="text-on-surface-variant font-medium">Logistics &amp; Haulage Hub (§6.5)</span>
                <Icon name="chevron_right" className="text-[14px]" />
                <span className="text-primary font-semibold">South-West Agricultural Corridors (Oyo, Ogun, Osun, Lagos)</span>
              </nav>
              <div className="flex items-baseline gap-space-md flex-wrap mt-space-xs">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">Logistics, Haulage &amp; Corridor Command Hub</h1>
                <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Live Fleet Telematics</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">Real-time fleet tracking, agricultural freight manifests, cold chain &amp; ambient cargo telemetry, weighbridge sync, and tamper-evident Proof of Delivery (PoD) across Nigeria&apos;s agricultural transit corridors.</p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              {_props.slots?.actions ?? (
                <>
                  <button className="px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-all flex items-center gap-space-xs" type="button">
                    <Icon name="file_download" className="text-[18px]" />
                    <span>Export Manifests (CSV)</span>
                  </button>
                  <button className="px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-all flex items-center gap-space-xs" type="button">
                    <Icon name="radar" className="text-[18px]" />
                    <span>Live Fleet Radar</span>
                  </button>
                  <button className="px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-sm flex items-center gap-space-xs" type="button">
                    <Icon name="local_shipping" className="text-[18px]" />
                    <span>Schedule Freight Dispatch</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-md pt-space-sm mt-space-xs bg-surface-container-low px-space-md py-space-sm rounded-lg">
            <div className="flex items-center gap-space-xs">
              <Icon name="satellite_alt" className="text-[18px] text-secondary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Fleet Telematics:</span>
              <span className="font-label-sm text-label-sm text-primary font-bold">GPS / GLONASS Active (18ms ping)</span>
            </div>
            <span className="text-outline-variant">|</span>
            <div className="flex items-center gap-space-xs">
              <Icon name="conversion_path" className="text-[18px] text-tertiary-container" />
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Monitored Corridors:</span>
              <span className="font-label-sm text-label-sm text-on-surface">Lagos–Ibadan · Oyo–Ogbomoso · Sagamu–Ore · Saki–Iseyin</span>
            </div>
            <span className="text-outline-variant">|</span>
            <div className="flex items-center gap-space-xs">
              <Icon name="verified_user" className="text-[18px] text-secondary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Regulatory:</span>
              <span className="font-label-sm text-label-sm text-secondary font-bold">NDPA 2023 &amp; FRSC Commercial Safety Compliant</span>
            </div>
            <span className="text-outline-variant">|</span>
            <div className="flex items-center gap-space-xs ml-auto">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Transit Escrow:</span>
              <span className="font-label-sm text-label-sm text-primary font-bold">Zenith Bank Transit Vault Active</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-space-md">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Active Consignments</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <Icon name="local_shipping" className="text-[18px]" />
              </div>
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">18 Shipments</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">11 Produce (420 MT) · 5 Inputs · 2 Machinery</p>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "78%" }} />
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Haulage Capacity</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <Icon name="weight" className="text-[18px]" />
              </div>
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">680 MT Total</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug"><span className="font-bold text-secondary">512 MT Mobilized</span> (75.3% Fleet Utilization)</p>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: "75.3%" }} />
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">On-Time SLA (§6.5)</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <Icon name="timer" className="text-[18px]" />
              </div>
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">98.2% SLA</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug"><span className="font-bold text-secondary">+1.4%</span> vs prior cycle · Avg Var: -24 min</p>
            </div>
            <div className="text-label-sm font-label-sm text-secondary font-semibold flex items-center gap-1 mt-2"><Icon name="verified" className="text-[16px]" /> 0 In-Transit Loss Claims</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Cargo Valuation</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary-container">
                <Icon name="account_balance_wallet" className="text-[18px]" />
              </div>
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-primary">₦184.5M</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">Zenith Transit Escrow &amp; Leadway GIT Active</p>
            </div>
            <div className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1 mt-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 100% Policy Indemnity Covered</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Corridor Turnaround</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <Icon name="speed" className="text-[18px]" />
              </div>
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">52.4 km/h</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">Depot-to-Gate: <span className="font-bold text-on-surface">3.8 hrs avg</span></p>
            </div>
            <div className="text-label-sm font-label-sm text-secondary font-semibold flex items-center gap-1 mt-2"><Icon name="check_circle" className="text-[16px]" /> FRSC Safe Speed Rating A+</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Verified PoD Rate</span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                <Icon name="fingerprint" className="text-[18px]" />
              </div>
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-secondary">100% Verified</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">Dual-biometric signoff + Geotag NFC seal</p>
            </div>
            <div className="text-label-sm font-label-sm text-outline flex items-center gap-1 mt-2"><Icon name="shield" className="text-[16px] text-secondary" /> Instant Escrow Clearance</div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-xs overflow-x-auto pb-1 lg:pb-0">
              <button className="px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold whitespace-nowrap" type="button">All Active Consignments (18)</button>
              <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md text-label-md whitespace-nowrap" type="button">Grains &amp; Bulks (7)</button>
              <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md text-label-md whitespace-nowrap flex items-center gap-1" type="button"><span className="w-2 h-2 rounded-full bg-error" /> Perishables &amp; Cold Chain (4)</button>
              <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md text-label-md whitespace-nowrap" type="button">Machinery Low-Loaders (2)</button>
              <button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md text-label-md whitespace-nowrap" type="button">Input Requisitions (5)</button>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              <div className="flex items-center bg-surface-container-low px-space-md py-1.5 rounded-lg text-on-surface-variant min-w-[220px]">
                <Icon name="search" className="text-[18px] mr-space-xs text-outline" />
                <input className="bg-transparent text-body-sm font-body-sm text-on-surface focus:outline-none w-full placeholder-outline" placeholder="Waybill #, Plate, Driver..." type="text" />
              </div>
              <select className="bg-surface-container-low text-body-sm font-body-sm text-on-surface px-space-md py-1.5 rounded-lg focus:outline-none cursor-pointer">
                <option>All Corridors (Oyo, Lagos, Osun)</option>
                <option>Oyo–Ibadan Expressway</option>
                <option>Lagos–Ibadan Expressway Corridor</option>
                <option>Abeokuta–Sagamu Bypass</option>
                <option>Saki–Iseyin Food Artery</option>
              </select>
              <select className="bg-surface-container-low text-body-sm font-body-sm text-on-surface px-space-md py-1.5 rounded-lg focus:outline-none cursor-pointer">
                <option>All Dispatches</option>
                <option>In-Transit</option>
                <option>Weighbridge Queue</option>
                <option>Loading at Depot</option>
                <option>Delivered &amp; Confirmed</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-space-md">
            <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#FRT-2026-0941</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> IN-TRANSIT · ON SCHEDULE</span>
                  <span className="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-1"><Icon name="schedule" className="text-[16px] text-secondary" /> ETA: 42 min (Arriving 14:15 WAT)</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-sm text-label-sm text-outline">Digital Waybill:</span>
                  <span className="font-label-sm text-label-sm font-mono font-semibold text-primary bg-surface-container px-2 py-0.5 rounded">#WB-9884</span>
                  <span className="px-space-sm py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Escrow Protected</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Route &amp; Transit Corridor</span>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface flex items-center gap-1 mt-1">
                    <span>Saki Northern Depot</span>
                    <Icon name="arrow_forward" className="text-[16px] text-outline" />
                    <span>Ibadan Feeds Terminal</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">168 km · Oyo-Ibadan Expressway Corridor</p>
                  <div className="flex items-center gap-1 text-label-sm font-label-sm text-secondary font-medium mt-1"><Icon name="alt_route" className="text-[14px]" /> Moniya Interchange Cleared</div>
                </div>
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Cargo &amp; Valuation</span>
                  <div className="font-label-lg text-label-lg font-semibold text-primary mt-1">30.0 MT Yellow Maize</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">SAMMAZ-52 Variety (600 Poly Bags)</p>
                  <div className="flex items-center justify-between text-body-sm font-body-sm mt-1">
                    <span className="text-on-surface-variant">Manifest Value:</span>
                    <span className="font-bold text-on-surface">₦12,600,000</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Fleet &amp; Driver Roster</span>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface mt-1">MAN Diesel 30T (OYO-442-XA)</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Al-Barakah Agro-Logistics</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary text-[11px] font-bold">LA</div>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">Lateef Adeleke (4.9★ NIN-vfd)</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Sensor Telemetry Feed</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[11px] text-outline font-medium">Speed / Coolant</span>
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">56 km/h · 88°C</span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[11px] text-outline font-medium">Cargo Moisture</span>
                      <span className="font-label-sm text-label-sm font-bold text-secondary">12.8% (Target ≤13%)</span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[11px] text-outline font-medium">Cargo Temp</span>
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">27.0°C Ambient</span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[11px] text-outline font-medium">NFC Seal</span>
                      <span className="font-label-sm text-label-sm font-bold text-secondary flex items-center gap-1"><Icon name="lock" className="text-[12px]" /> #SEAL-9942</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                <div className="flex items-center gap-space-md text-body-sm font-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1"><Icon name="verified" className="text-[16px] text-secondary" /> Weighbridge Tare Verified (14,350 kg)</span>
                  <span className="flex items-center gap-1"><Icon name="shield" className="text-[16px] text-secondary" /> Leadway Freight In-Transit Active</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button">
                    <Icon name="call" className="text-[16px]" />
                    <span>Contact Driver PBX</span>
                  </button>
                  <button className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button">
                    <Icon name="description" className="text-[16px]" />
                    <span>Waybill #WB-9884</span>
                  </button>
                  <button className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors flex items-center gap-1" type="button">
                    <Icon name="my_location" className="text-[16px]" />
                    <span>Track Live Telemetry</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#FRT-2026-0942</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" /> WEIGHBRIDGE QUEUE · GATE 2</span>
                  <span className="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-1"><Icon name="hourglass_top" className="text-[16px] text-tertiary-container" /> Waiting time: 14 min (Position: 2nd in line)</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-sm text-label-sm text-outline">Waybill:</span>
                  <span className="font-label-sm text-label-sm font-mono font-semibold text-primary bg-surface-container px-2 py-0.5 rounded">#WB-9885</span>
                  <span className="px-space-sm py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">Strict 24h Window</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Route &amp; Destination</span>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface flex items-center gap-1 mt-1">
                    <span>Iseyin Consolidation</span>
                    <Icon name="arrow_forward" className="text-[16px] text-outline" />
                    <span>Psaltry Starch Ltd</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">38 km · Ado-Awaye Industrial Link</p>
                  <div className="flex items-center gap-1 text-label-sm font-label-sm text-secondary font-medium mt-1"><Icon name="check_circle" className="text-[14px]" /> Factory Geofence Entered (13:31)</div>
                </div>
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Cargo &amp; Freshness SLA</span>
                  <div className="font-label-lg text-label-lg font-semibold text-primary mt-1">28.5 MT Fresh Cassava Roots</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">TME 419 Variety · Harvested 4h 12m ago</p>
                  <div className="flex items-center justify-between text-body-sm font-body-sm mt-1">
                    <span className="text-on-surface-variant">Estimated Value:</span>
                    <span className="font-bold text-on-surface">₦3,277,500</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Fleet &amp; Carrier</span>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface mt-1">Mack 6-Wheeler (OYO-819-BD)</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Oyo Express Freight Syndicate</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary text-[11px] font-bold">ML</div>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">Muritala Lawal (4.85★ Verified)</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Perishable Deterioration Clock</span>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-body-sm font-body-sm text-on-surface font-semibold">4h 12m elapsed</span>
                      <span className="text-label-sm font-label-sm text-outline">Max: 24 hrs</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "17.5%" }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                      <span>Starch Content: <strong className="text-primary">25.4%</strong></span>
                      <span>Moisture: <strong className="text-on-surface">66.2%</strong></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                <div className="flex items-center gap-space-md text-body-sm font-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1 text-tertiary"><Icon name="scale" className="text-[16px]" /> Weighbridge Scale #02 Calibrated (SON cert)</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button">
                    <Icon name="print" className="text-[16px]" />
                    <span>Print Gate Pass</span>
                  </button>
                  <button className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors flex items-center gap-1" type="button">
                    <Icon name="sync" className="text-[16px]" />
                    <span>Sync Weighbridge Gross Ticket</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#FRT-2026-0943</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error" /> IN-TRANSIT · REEFER TEMP WARNING</span>
                  <span className="text-body-sm font-body-sm text-error font-medium flex items-center gap-1"><Icon name="thermostat" className="text-[16px]" /> Box Temp: 11.2°C (Setpoint: 8.0°C)</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-sm text-label-sm text-outline">Waybill:</span>
                  <span className="font-label-sm text-label-sm font-mono font-semibold text-primary bg-surface-container px-2 py-0.5 rounded">#WB-9886</span>
                  <span className="px-space-sm py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">ThermoKing Telematics</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Horticultural Corridor</span>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface flex items-center gap-1 mt-1">
                    <span>Oke-Ogun Cluster</span>
                    <Icon name="arrow_forward" className="text-[16px] text-outline" />
                    <span>Mile 12 Terminal, Lagos</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">192 km · Lagos-Ibadan Expressway</p>
                  <div className="flex items-center gap-1 text-label-sm font-label-sm text-tertiary font-medium mt-1"><Icon name="traffic" className="text-[14px]" /> Ogere Slowdown (+25 min delay)</div>
                </div>
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Perishable Cargo</span>
                  <div className="font-label-lg text-label-lg font-semibold text-primary mt-1">14.0 MT Fresh Tomatoes</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Roma VF &amp; Tatashe (Ventilated Crates)</p>
                  <div className="flex items-center justify-between text-body-sm font-body-sm mt-1">
                    <span className="text-on-surface-variant">Cargo Valuation:</span>
                    <span className="font-bold text-on-surface">₦7,840,000</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Cold-Chain Reefer</span>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface mt-1">Isuzu 15T Reefer (LAG-504-JJ)</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Trans-Sahara ColdLink Hub</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center text-on-error text-[11px] font-bold">KB</div>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">Kazeem Babatunde (Reefer Cert.)</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">IoT Sensor Telemetry</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-error-container/40 p-1.5 rounded flex flex-col">
                      <span className="text-[11px] text-error font-medium">Coldbox Temp</span>
                      <span className="font-label-sm text-label-sm font-bold text-error">11.2°C (High)</span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[11px] text-outline font-medium">Target Range</span>
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">7.0°C – 8.5°C</span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[11px] text-outline font-medium">Air Humidity</span>
                      <span className="font-label-sm text-label-sm font-bold text-on-surface">86% RH</span>
                    </div>
                    <div className="bg-surface-container-low p-1.5 rounded flex flex-col">
                      <span className="text-[11px] text-outline font-medium">Compressor</span>
                      <span className="font-label-sm text-label-sm font-bold text-tertiary">Recycling (Mode 2)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                <div className="flex items-center gap-space-md text-body-sm font-body-sm text-error">
                  <span className="flex items-center gap-1 font-semibold"><Icon name="warning" className="text-[16px]" /> Leadway Quality Spoilage Insurance Alert Auto-Queued</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button">
                    <Icon name="sensors" className="text-[16px]" />
                    <span>Reefer Diagnostics</span>
                  </button>
                  <button className="px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-sm text-label-sm hover:bg-primary transition-colors flex items-center gap-1" type="button">
                    <Icon name="notifications_active" className="text-[16px]" />
                    <span>Notify Mile 12 Intake Lead</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">#FRT-2026-0944</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1"><Icon name="check_circle" className="text-[14px]" /> DELIVERED · AWAITING RECIPIENT SIGN-OFF</span>
                  <span className="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-1"><Icon name="pin_drop" className="text-[16px] text-secondary" /> Arrived at Destination: 13:45 WAT</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-sm text-label-sm text-outline">Waybill:</span>
                  <span className="font-label-sm text-label-sm font-mono font-semibold text-primary bg-surface-container px-2 py-0.5 rounded">#WB-9887</span>
                  <span className="px-space-sm py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold">Geofence Confirmed</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Completed Route</span>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface flex items-center gap-1 mt-1">
                    <span>Ede Oil Extraction</span>
                    <Icon name="arrow_forward" className="text-[16px] text-outline" />
                    <span>Apapa Terminal, Lagos</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">220 km · Sagamu-Ore / Lagos Axis</p>
                  <div className="text-label-sm font-label-sm text-secondary font-medium mt-1">Transit Duration: 4 hrs 48 min</div>
                </div>
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Bulk Liquid Cargo</span>
                  <div className="font-label-lg text-label-lg font-semibold text-primary mt-1">25.0 MT Crude Soya Oil</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Food-Grade ISO Tanker (Non-GMO)</p>
                  <div className="flex items-center justify-between text-body-sm font-body-sm mt-1">
                    <span className="text-on-surface-variant">Settlement Value:</span>
                    <span className="font-bold text-on-surface">₦17,000,000</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Hauler &amp; Unit</span>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface mt-1">DAF XF Tanker (OSN-312-EK)</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Osun Inter-State Haulage Co.</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary text-[11px] font-bold">SA</div>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">Sunday Adebayo (Heavy Tanker Cert.)</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between bg-surface-container-lowest p-space-md rounded-lg">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Proof of Delivery Progress</span>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between items-center text-label-sm font-label-sm">
                      <span className="text-on-surface">Recipient Gate Check</span>
                      <span className="text-secondary font-bold">Passed</span>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm">
                      <span className="text-on-surface">SHA-256 Seal Hash</span>
                      <span className="text-secondary font-bold">Intact</span>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm">
                      <span className="text-on-surface">6-Digit OTP Signoff</span>
                      <span className="text-tertiary-container font-bold">Awaiting Input</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                <div className="flex items-center gap-space-md text-body-sm font-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1 font-semibold text-primary"><Icon name="lock" className="text-[16px] text-secondary" /> Escrow: ₦1,200,000 Freight Payout Ready on Signature</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button">
                    <Icon name="qr_code" className="text-[16px]" />
                    <span>Verify Tamper Seal SHA-256</span>
                  </button>
                  <button className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors flex items-center gap-1" type="button">
                    <Icon name="key" className="text-[16px]" />
                    <span>Input Buyer OTP &amp; Release Escrow</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
          <div className="xl:col-span-7 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Corridor Live Traffic &amp; Telematics Radar</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">South-West Transit Corridors (§6.5 &amp; §8.6)</p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="px-space-sm py-1 rounded bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> 4 Artery Live Feeds</span>
                  <span className="px-space-sm py-1 rounded bg-surface-container text-on-surface text-label-sm font-label-sm">NiMet Radar: Clear</span>
                </div>
              </div>
              <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-surface-container flex flex-col justify-between p-space-md shadow-inner">
                <div className="absolute inset-0 w-full h-full bg-cover bg-center opacity-85" data-location="Ibadan, Nigeria" style={{ backgroundImage: "url('/images/screens/6b35b5c151a9.webp')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/40 pointer-events-none" />
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                  <div className="bg-surface-container-lowest/95 backdrop-blur px-space-md py-1.5 rounded-lg shadow-sm flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <span className="font-label-sm text-label-sm text-on-surface font-bold">Lagos-Ibadan Expressway:</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Free Flow (62 km/h avg)</span>
                  </div>
                  <div className="bg-surface-container-lowest/95 backdrop-blur px-space-md py-1.5 rounded-lg shadow-sm flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" />
                    <span className="font-label-sm text-label-sm text-on-surface font-bold">Sagamu Interchange:</span>
                    <span className="font-label-sm text-label-sm text-tertiary font-semibold">Slow Traffic (+18 min)</span>
                  </div>
                </div>
                <div className="relative z-10 flex items-center justify-around my-auto">
                  <div className="flex flex-col items-center group cursor-pointer">
                    <div className="px-2 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm shadow-md flex items-center gap-1"><Icon name="warehouse" className="text-[14px]" /> Saki Depot</div>
                    <div className="w-1.5 h-3 bg-primary" />
                    <span className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/30" />
                  </div>
                  <div className="flex flex-col items-center group cursor-pointer transform -translate-y-4">
                    <div className="px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm shadow-md flex items-center gap-1 font-bold"><Icon name="local_shipping" className="text-[14px]" /> OYO-442-XA (56 km/h)</div>
                    <div className="w-1.5 h-3 bg-secondary" />
                    <span className="w-3 h-3 rounded-full bg-secondary animate-ping" />
                  </div>
                  <div className="flex flex-col items-center group cursor-pointer">
                    <div className="px-2 py-1 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-md flex items-center gap-1 font-bold"><Icon name="domain" className="text-[14px]" /> Ibadan Hub</div>
                    <div className="w-1.5 h-3 bg-on-surface" />
                    <span className="w-3 h-3 rounded-full bg-on-surface" />
                  </div>
                  <div className="flex flex-col items-center group cursor-pointer transform translate-y-6">
                    <div className="px-2 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm shadow-md flex items-center gap-1 font-bold"><Icon name="warning" className="text-[14px]" /> LAG-504-JJ (Reefer 11°C)</div>
                    <div className="w-1.5 h-3 bg-error" />
                    <span className="w-3 h-3 rounded-full bg-error animate-pulse" />
                  </div>
                </div>
                <div className="relative z-10 bg-surface-container-lowest/95 backdrop-blur p-space-sm rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-md text-label-sm font-label-sm">
                    <span className="text-outline flex items-center gap-1"><Icon name="check" className="text-[16px] text-secondary" /> FRSC Patrol Post #4: Active</span>
                    <span className="text-outline flex items-center gap-1"><Icon name="check" className="text-[16px] text-secondary" /> Custom Clearance Moniya: Green Light</span>
                    <span className="text-outline flex items-center gap-1"><Icon name="cloud" className="text-[16px] text-primary" /> Oyo Savanna Doppler: 0mm Rain (Dry)</span>
                  </div>
                  <button className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm flex items-center gap-1" type="button"><Icon name="fullscreen" className="text-[14px]" /> Expand Radar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Oyo–Ibadan Artery (78 km)</span>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">1h 14m transit</div>
                  <span className="text-body-sm font-body-sm text-secondary font-medium">Asphalt Condition: Excellent</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Lagos–Ibadan Corridor (128 km)</span>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">1h 55m transit</div>
                  <span className="text-body-sm font-body-sm text-tertiary-container font-medium">Sagamu Pavement Repairs (-12%)</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Saki–Iseyin Food Link (90 km)</span>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">1h 32m transit</div>
                  <span className="text-body-sm font-body-sm text-secondary font-medium">Zero Congestion Index</span>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Digital Proof-of-Delivery Terminal</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Active Consignment: <strong className="text-primary font-semibold">#FRT-2026-0941</strong></p>
                </div>
                <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">Audit Ready</span>
              </div>
              <div className="flex flex-col gap-space-sm bg-surface-container-low p-space-md rounded-xl">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Chain of Custody (§7.6 &amp; §11.3)</span>
                <div className="flex flex-col gap-space-xs text-body-sm font-body-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-on-surface-variant">Origin Depot:</span>
                    <span className="font-semibold text-on-surface">Saki East Aggregation (8.672°N, 3.391°E)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-on-surface-variant">Origin Dispatcher:</span>
                    <span className="font-medium text-on-surface">Alhaji Jimoh (NIN: 4492-****-1029)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-on-surface-variant">Tamper-Proof Bolt Seal:</span>
                    <span className="font-mono font-bold text-primary bg-surface-container px-2 py-0.5 rounded">#SEAL-9942-NG</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-on-surface-variant">Weighbridge Axle Gross:</span>
                    <span className="font-semibold text-on-surface">42,850 kg · Tare: 14,350 kg</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-on-surface-variant">Net Produce Weight:</span>
                    <span className="font-bold text-secondary">28,500 kg (Maize Grade 1)</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-space-sm bg-surface-container-low p-space-md rounded-xl">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Counterparty Recipient Intake</span>
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">MB</div>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">Mustapha Bello</span>
                    <span className="text-body-sm font-body-sm text-on-surface-variant">Grand Cereals Intake Manager (Ibadan)</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-label-sm font-label-sm mt-1">
                  <div className="flex items-center gap-1 text-secondary font-semibold"><Icon name="check_circle" className="text-[16px]" /> Biometric Fingerprint Captured (ZKTeco Handheld)</div>
                  <div className="flex items-center gap-1 text-secondary font-semibold"><Icon name="check_circle" className="text-[16px]" /> Geofence Radius Stamped (&lt; 25 meters from intake silo)</div>
                  <div className="flex items-center gap-1 text-outline"><Icon name="pin" className="text-[16px]" /> SMS OTP Verification Token Validated</div>
                </div>
              </div>
              <div className="flex flex-col gap-space-xs bg-surface-container-low p-space-md rounded-xl">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Escrow Freight Settlement</span>
                <div className="flex justify-between text-body-sm font-body-sm pt-1">
                  <span className="text-on-surface-variant">Contract Freight Rate:</span>
                  <span className="font-medium text-on-surface">₦15,000 / MT × 30 MT = ₦450,000</span>
                </div>
                <div className="flex justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Early Arrival Incentive SLA:</span>
                  <span className="font-medium text-secondary">+₦15,000.00</span>
                </div>
                <div className="flex justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Demurrage / Loss Deductions:</span>
                  <span className="font-medium text-on-surface">₦0.00</span>
                </div>
                <div className="flex justify-between text-headline-sm font-headline-sm font-bold pt-2 mt-1">
                  <span className="text-on-surface">Net Haulier Payout:</span>
                  <span className="text-primary">₦465,000.00</span>
                </div>
                <p className="text-[11px] text-outline mt-0.5">Disbursement destination: Zenith Bank · Al-Barakah Agro-Logistics · Acc ending in 9012</p>
              </div>
              <div className="flex flex-col gap-space-xs">
                <button className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-sm flex items-center justify-center gap-space-xs" type="button">
                  <Icon name="verified" className="text-[18px]" />
                  <span>Authorize PoD &amp; Release Freight Escrow</span>
                </button>
                <div className="grid grid-cols-2 gap-space-xs">
                  <button className="py-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1" type="button">
                    <Icon name="picture_as_pdf" className="text-[16px]" />
                    <span>Generate PDF Note</span>
                  </button>
                  <button className="py-2 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1" type="button">
                    <Icon name="flag" className="text-[16px]" />
                    <span>Flag Discrepancy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Active Fleet &amp; Driver Compliance Matrix</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Real-time driver credentials, Goods-In-Transit insurance verification, and FRSC commercial fleet accreditation.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 font-semibold"><Icon name="verified" className="text-[16px] text-secondary" /> FRSC Commercial Safety Act</span>
              <span className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 font-semibold"><Icon name="lock" className="text-[16px] text-secondary" /> NDPA 2023 Driver Privacy Masking</span>
              <span className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 font-semibold"><Icon name="agriculture" className="text-[16px] text-secondary" /> SON Agricultural Transit Standard</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-sm px-space-md rounded-l-lg">Driver &amp; Carrier</th>
                  <th className="py-space-sm px-space-md">Vehicle Spec &amp; Reg</th>
                  <th className="py-space-sm px-space-md">Goods-in-Transit (GIT) Cover</th>
                  <th className="py-space-sm px-space-md">FRSC Roadworthiness</th>
                  <th className="py-space-sm px-space-md">Fleet Telematics Efficiency</th>
                  <th className="py-space-sm px-space-md text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="text-body-sm font-body-sm text-on-surface divide-y-0">
                {_props.slots?.waybills ?? (
                  <>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-label-md">LA</div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">Lateef Adeleke</span>
                        <span className="text-label-sm font-label-sm text-on-surface-variant">Al-Barakah Logistics · Class G Lic</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">MAN Diesel 30T Tipper</span>
                      <span className="font-mono text-label-sm text-label-sm text-primary">OYO-442-XA</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 text-secondary font-semibold"><Icon name="shield" className="text-[16px]" /> Leadway Comprehensive (₦25M)</div>
                    <span className="text-[11px] text-outline">Valid thru Nov 2026</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Inspected &amp; Valid</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">31.2 L / 100km</span>
                      <span className="text-label-sm font-label-sm text-secondary">Optimal ECO profile</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors" type="button">Inspect Dossier</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold text-label-md">ML</div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">Muritala Lawal</span>
                        <span className="text-label-sm font-label-sm text-on-surface-variant">Oyo Express Freight · Class E Lic</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Mack 6-Wheeler Hauler</span>
                      <span className="font-mono text-label-sm text-label-sm text-primary">OYO-819-BD</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 text-secondary font-semibold"><Icon name="shield" className="text-[16px]" /> Leadway Agro-Transit (₦15M)</div>
                    <span className="text-[11px] text-outline">Valid thru Oct 2026</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Inspected &amp; Valid</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">28.4 L / 100km</span>
                      <span className="text-label-sm font-label-sm text-secondary">Optimal Load Ratio</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors" type="button">Inspect Dossier</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-full bg-error flex items-center justify-center text-on-error font-bold text-label-md">KB</div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">Kazeem Babatunde</span>
                        <span className="text-label-sm font-label-sm text-on-surface-variant">Trans-Sahara ColdLink · Reefer Specialist</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">Isuzu Forward 15T Reefer Van</span>
                      <span className="font-mono text-label-sm text-label-sm text-primary">LAG-504-JJ</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 text-secondary font-semibold"><Icon name="shield" className="text-[16px]" /> Leadway ColdChain Spoiled (₦10M)</div>
                    <span className="text-[11px] text-outline">Valid thru Dec 2026</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Inspected &amp; Valid</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-error">36.8 L / 100km</span>
                      <span className="text-label-sm font-label-sm text-error">Reefer auxiliary load</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors" type="button">Inspect Dossier</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-label-md">SA</div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">Sunday Adebayo</span>
                        <span className="text-label-sm font-label-sm text-on-surface-variant">Osun Inter-State Haulage · ADR Tanker Lic</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">DAF XF ISO Tanker</span>
                      <span className="font-mono text-label-sm text-label-sm text-primary">OSN-312-EK</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 text-secondary font-semibold"><Icon name="shield" className="text-[16px]" /> Leadway Liquid Bulk GIT (₦35M)</div>
                    <span className="text-[11px] text-outline">Valid thru Jan 2027</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Inspected &amp; Valid</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">33.5 L / 100km</span>
                      <span className="text-label-sm font-label-sm text-secondary">Cruising optimal</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors" type="button">Inspect Dossier</button>
                  </td>
                </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
