// Ported from the "agro_processing_operations_6.6" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function ProcessingOps(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="flex flex-col gap-space-sm mb-space-lg">
          <div className="flex flex-wrap items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
            <span>Agricultural Commerce</span>
            <Icon name="chevron_right" className="text-[14px] text-outline" />
            <span>Agro-processing &amp; Value Addition (§6.6)</span>
            <Icon name="chevron_right" className="text-[14px] text-outline" />
            <span className="text-primary font-semibold">Western Agri-Industrial Processing Zone (Ibadan / Ado-Awaye / Sagamu / Ede)</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mt-space-xs">
            <div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">Agro-processing &amp; Value-Addition Operations Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl mt-space-xs">End-to-end transformation telemetry: raw commodity intake, industrial milling &amp; solvent extraction runs, extraction yield recovery ratios, by-product circular valorization, and NAFDAC / ISO 22000 quality certification.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              {_props.slots?.actions ?? (
                <>
                  <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container transition-all" type="button">
                    <Icon name="download" className="text-[18px] text-on-surface-variant" />
                    <span>Export Yield Analytics</span>
                  </button>
                  <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container transition-all" type="button">
                    <Icon name="input" className="text-[18px] text-secondary" />
                    <span>Log Raw Material Intake</span>
                  </button>
                  <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary transition-all" type="button">
                    <Icon name="play_circle" className="text-[18px] text-primary-fixed" />
                    <span>Schedule Processing Run</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-sm mt-space-sm p-space-sm bg-surface-container-low rounded-xl shadow-sm">
            <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-lowest rounded-lg shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim animate-pulse" />
              <Icon name="factory" className="text-[18px] text-primary" />
              <span className="font-label-md text-label-md text-on-surface font-semibold">Iseyin-Ado Agro-Industrial Milling Complex</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">· Line A: Flash Dryer · Line B: Rice Dehuller · Line C: Soya Expeller</span>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm">
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-md bg-surface-container text-on-surface font-medium">
                <Icon name="bolt" className="text-[16px] text-secondary" />
                <span>Perkins 800kVA + 120kW Solar (Active)</span>
              </div>
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-md bg-surface-container text-on-surface font-medium">
                <Icon name="valve" className="text-[16px] text-tertiary-container" />
                <span>Boiler: 8.4 Bar (Biomass Briquette)</span>
              </div>
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-md bg-surface-container text-on-surface font-medium">
                <Icon name="water_drop" className="text-[16px] text-secondary" />
                <span>RO Permeate: 14,000 L/h</span>
              </div>
            </div>
          </div>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md mb-space-xl">
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Raw Intake (MTD)</span>
              <Icon name="scale" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">1,280 <span className="font-label-md text-label-md font-normal text-on-surface-variant">MT</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">940 MT Cassava · 240 MT Paddy · 100 MT Soya</div>
            </div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary font-semibold">
              <Icon name="trending_up" className="text-[16px]" />
              <span>+18.4% MoM Throughput</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Avg Yield Recovery</span>
              <Icon name="grain" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">24.8% <span className="font-label-md text-label-md font-normal text-on-surface-variant">Starch</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">68.2% Rice Head · 18.9% Soya Oil</div>
            </div>
            <div className="flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed w-fit font-label-sm text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>+1.3% vs Standard Target</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Run Batches</span>
              <Icon name="conveyor_belt" className="text-[20px] text-primary-container" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">4 <span className="font-label-md text-label-md font-normal text-on-surface-variant">Live Batches</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">2 In-Process · 1 Drying · 1 QA Pack</div>
            </div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
              <Icon name="check_circle" className="text-[16px] text-secondary" />
              <span>All Lines Online</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Finished Valuation</span>
              <Icon name="inventory_2" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">₦214.8M</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">In Safe Depot Inventory</div>
            </div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary font-semibold">
              <Icon name="verified" className="text-[16px]" />
              <span>Off-take Allocated: 78%</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Plant OEE Metric</span>
              <Icon name="speed" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">86.4%</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">Avail 91.2% · Perf 96.5% · QA 98.1%</div>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-primary-container h-1.5 rounded-full" style={{ width: "86.4%" }} />
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Circular Valorization</span>
              <Icon name="recycling" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-xs">
              <div className="font-metric-num text-metric-num text-on-surface">₦18.45M</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">Peel Pellets + Husk Briquettes</div>
            </div>
            <div className="flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>0% Landfill Waste Metric</span>
            </div>
          </div>
        </section>
        <section className="flex flex-col mb-space-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-md">
            <div className="flex items-center gap-space-sm">
              <Icon name="precision_manufacturing" className="text-primary text-[24px]" />
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Active Batch Operations Pipeline</h2>
            </div>
            <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-lg font-label-md text-label-md">
              <button className="px-space-md py-1 rounded-md bg-surface-container-lowest text-primary font-bold shadow-sm" type="button">All Active Runs (4)</button>
              <button className="px-space-md py-1 rounded-md text-on-surface-variant hover:text-on-surface" type="button">Cassava Starch</button>
              <button className="px-space-md py-1 rounded-md text-on-surface-variant hover:text-on-surface" type="button">Rice Parboiling</button>
              <button className="px-space-md py-1 rounded-md text-on-surface-variant hover:text-on-surface" type="button">Oilseed Expeller</button>
              <button className="px-space-md py-1 rounded-md text-on-surface-variant hover:text-on-surface" type="button">Completed</button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
            <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-secondary-fixed text-on-secondary-fixed">LIVE STAGE</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">#RUN-2026-CS-084</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">Line A (Flash Unit)</span>
              </div>
              <div className="p-space-md flex flex-col flex-1 gap-space-md">
                <div className="flex items-start justify-between gap-space-sm">
                  <div>
                    <div className="font-label-lg text-label-lg font-semibold text-primary">Industrial Native Starch (Food Grade)</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">NAFDAC Reg: 01-9921 · Psaltry Quality Standard</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">24.2% Est. Yield</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-xs p-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm">
                  <div>
                    <span className="text-on-surface-variant font-label-sm text-label-sm block">Input Ingested:</span>
                    <span className="font-semibold text-on-surface">65.0 MT TME-419</span>
                    <span className="text-outline text-label-sm block">Age: 11h · #LOT-ADO-401</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-label-sm text-label-sm block">Expected Target:</span>
                    <span className="font-semibold text-on-surface">14.8 MT Dry Native</span>
                    <span className="text-secondary text-label-sm block">Wet Cake: 16.2 MT</span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
                    <span>Stage: Hydrocyclone &amp; Separator Centrifuge</span>
                    <span className="font-bold text-primary">74% Complete</span>
                  </div>
                  <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                    <div className="bg-primary-container h-2 rounded-full" style={{ width: "74%" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1 text-center font-label-sm text-label-sm">
                    <div className="p-1 rounded bg-surface-container-low">
                      <span className="text-outline block text-[10px]">INTAKE RATE</span>
                      <span className="font-semibold text-on-surface">8.5 MT/h</span>
                    </div>
                    <div className="p-1 rounded bg-surface-container-low">
                      <span className="text-outline block text-[10px]">GRATER RPM</span>
                      <span className="font-semibold text-on-surface">2,800 RPM</span>
                    </div>
                    <div className="p-1 rounded bg-surface-container-low">
                      <span className="text-outline block text-[10px]">SLURRY DENSITY</span>
                      <span className="font-semibold text-on-surface">1.18 g/cm³</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
                  <span className="flex items-center gap-1"><Icon name="water" className="text-[16px] text-secondary" /> 3.2 m³/MT root</span>
                  <span className="flex items-center gap-1"><Icon name="local_fire_department" className="text-[16px] text-tertiary-container" /> 1.4 MT/h Steam</span>
                </div>
                <div className="flex items-center gap-space-xs mt-auto pt-space-sm">
                  <button className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Stage Sensors</button>
                  <button className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Centrifuge RPM</button>
                  <button className="py-1.5 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors" type="button">Lab Viscosity</button>
                </div>
              </div>
            </div>
            <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-surface-container text-on-surface">FINAL QA PACK</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">#RUN-2026-RC-032</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">Line B (Milling)</span>
              </div>
              <div className="p-space-md flex flex-col flex-1 gap-space-md">
                <div className="flex items-start justify-between gap-space-sm">
                  <div>
                    <div className="font-label-lg text-label-lg font-semibold text-primary">Premium Parboiled Faro 44 Long-Grain</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">Grade A 50kg Bags · Export Optical Sort</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">68.5% Total Yield</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-xs p-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm">
                  <div>
                    <span className="text-on-surface-variant font-label-sm text-label-sm block">Input Consigned:</span>
                    <span className="font-semibold text-on-surface">40.0 MT Paddy Rice</span>
                    <span className="text-outline text-label-sm block">Moisture 13.1% · #LOT-EGB-055</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-label-sm text-label-sm block">Clean Output Realized:</span>
                    <span className="font-semibold text-on-surface">27.4 MT Total</span>
                    <span className="text-secondary text-label-sm block">Head Rice: 24.8 MT (90.5%)</span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
                    <span>Stage: Optical Color Sorter &amp; Poly Bagging</span>
                    <span className="font-bold text-secondary">92% Packaged</span>
                  </div>
                  <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: "92%" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1 text-center font-label-sm text-label-sm">
                    <div className="p-1 rounded bg-surface-container-low">
                      <span className="text-outline block text-[10px]">BROKEN RICE</span>
                      <span className="font-semibold text-on-surface">2.6 MT (Brewer)</span>
                    </div>
                    <div className="p-1 rounded bg-surface-container-low">
                      <span className="text-outline block text-[10px]">HUSK TO BOILER</span>
                      <span className="font-semibold text-on-surface">8.2 MT Biomass</span>
                    </div>
                    <div className="p-1 rounded bg-surface-container-low">
                      <span className="text-outline block text-[10px]">RICE BRAN</span>
                      <span className="font-semibold text-on-surface">4.4 MT Feed</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
                  <span className="flex items-center gap-1"><Icon name="verified" className="text-[16px] text-secondary" /> Whiteness Index 44.5</span>
                  <span className="flex items-center gap-1"><Icon name="filter_alt" className="text-[16px] text-primary" /> Rejection 0.8%</span>
                </div>
                <div className="flex items-center gap-space-xs mt-auto pt-space-sm">
                  <button className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Release Lot</button>
                  <button className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Print Labels</button>
                  <button className="py-1.5 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors" type="button">Generate COA</button>
                </div>
              </div>
            </div>
            <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-tertiary-fixed text-on-tertiary-fixed">IN EXPELLER</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">#RUN-2026-SY-019</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">Line C (Press)</span>
              </div>
              <div className="p-space-md flex flex-col flex-1 gap-space-md">
                <div className="flex items-start justify-between gap-space-sm">
                  <div>
                    <div className="font-label-lg text-label-lg font-semibold text-primary">Non-GMO Cold-Pressed Crude Soya Oil</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">44% Crude Protein Defatted Meal Co-product</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">19.0% Oil Yield</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-xs p-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm">
                  <div>
                    <span className="text-on-surface-variant font-label-sm text-label-sm block">Input Grain:</span>
                    <span className="font-semibold text-on-surface">25.0 MT Yellow Soybean</span>
                    <span className="text-outline text-label-sm block">TGX-1448E · Oke-Ogun Hub</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-label-sm text-label-sm block">Yield Partition:</span>
                    <span className="font-semibold text-on-surface">4.75 MT Crude Oil</span>
                    <span className="text-secondary text-label-sm block">+19.8 MT Soya Cake</span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
                    <span>Stage: Screw Pressing &amp; Oil Filtration</span>
                    <span className="font-bold text-primary">61% Complete</span>
                  </div>
                  <div className="w-full bg-surface-container-low rounded-full h-2 overflow-hidden">
                    <div className="bg-primary-container h-2 rounded-full" style={{ width: "61%" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1 text-center font-label-sm text-label-sm">
                    <div className="p-1 rounded bg-surface-container-low">
                      <span className="text-outline block text-[10px]">PRESS TEMP</span>
                      <span className="font-semibold text-on-surface">64°C (Optimum)</span>
                    </div>
                    <div className="p-1 rounded bg-surface-container-low">
                      <span className="text-outline block text-[10px]">CAKE MOISTURE</span>
                      <span className="font-semibold text-on-surface">9.2% Spec</span>
                    </div>
                    <div className="p-1 rounded bg-surface-container-low">
                      <span className="text-outline block text-[10px]">OIL CLARITY</span>
                      <span className="font-semibold text-on-surface">Golden Amber</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
                  <span className="flex items-center gap-1"><Icon name="science" className="text-[16px] text-secondary" /> FFA: 1.18% (Target &lt;1.5%)</span>
                  <span className="flex items-center gap-1"><Icon name="heat_pump" className="text-[16px] text-tertiary" /> 21 kWh/MT</span>
                </div>
                <div className="flex items-center gap-space-xs mt-auto pt-space-sm">
                  <button className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Sample FFA</button>
                  <button className="flex-1 py-1.5 px-space-sm rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Cake Density</button>
                  <button className="py-1.5 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors" type="button">Tanker Dispatch</button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm p-space-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <Icon name="balance" className="text-secondary text-[22px]" />
                    <h3 className="font-headline-md text-headline-md text-on-surface">Yield Recovery &amp; Mass-Balance Matrix</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Cross-commodity industrial efficiency tracking vs theoretical thermodynamic curves.</p>
                </div>
                <span className="px-space-sm py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold w-fit">MTD Cumulative</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-2.5 px-space-sm rounded-l-lg">Raw Commodity</th>
                      <th className="py-2.5 px-space-sm">Ingested</th>
                      <th className="py-2.5 px-space-sm">Realized Primary Yield</th>
                      <th className="py-2.5 px-space-sm">By-Product Partition</th>
                      <th className="py-2.5 px-space-sm">Unit Cost</th>
                      <th className="py-2.5 px-space-sm rounded-r-lg text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0">
                    {_props.slots?.batches ?? (
                      <>
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">Cassava Roots (TME-419) <span className="block font-label-sm text-label-sm font-normal text-on-surface-variant">Industrial Native Starch</span></td>
                      <td className="py-3 px-space-sm text-on-surface font-medium">450.0 MT</td>
                      <td className="py-3 px-space-sm">
                        <div className="font-semibold text-primary">109.8 MT (24.4%)</div>
                        <span className="text-secondary font-label-sm text-label-sm">+0.9% vs Theor.</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface-variant">88 MT Pulp Pellets</td>
                      <td className="py-3 px-space-sm text-on-surface font-medium">₦34,200/MT</td>
                      <td className="py-3 px-space-sm text-right">
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold font-label-sm text-label-sm">38.2%</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-low/30">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">Paddy Rice (Faro 44) <span className="block font-label-sm text-label-sm font-normal text-on-surface-variant">Parboiled Milled Rice</span></td>
                      <td className="py-3 px-space-sm text-on-surface font-medium">320.0 MT</td>
                      <td className="py-3 px-space-sm">
                        <div className="font-semibold text-primary">218.2 MT (68.2%)</div>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">Head Grain 90.5%</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface-variant">64 MT Husk · 35 MT Bran</td>
                      <td className="py-3 px-space-sm text-on-surface font-medium">₦42,000/MT</td>
                      <td className="py-3 px-space-sm text-right">
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold font-label-sm text-label-sm">26.5%</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">Non-GMO Soybeans <span className="block font-label-sm text-label-sm font-normal text-on-surface-variant">Crude Expeller Oil + Cake</span></td>
                      <td className="py-3 px-space-sm text-on-surface font-medium">180.0 MT</td>
                      <td className="py-3 px-space-sm">
                        <div className="font-semibold text-primary">34.2 MT Oil (19.0%)</div>
                        <span className="text-secondary font-label-sm text-label-sm">+142 MT Soya Cake</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface-variant">Dehulled Fiber Pods</td>
                      <td className="py-3 px-space-sm text-on-surface font-medium">₦28,500/MT</td>
                      <td className="py-3 px-space-sm text-right">
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold font-label-sm text-label-sm">31.4%</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-low/30">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">Roma VF Tomatoes <span className="block font-label-sm text-label-sm font-normal text-on-surface-variant">Double Concentrated Paste</span></td>
                      <td className="py-3 px-space-sm text-on-surface font-medium">85.0 MT</td>
                      <td className="py-3 px-space-sm">
                        <div className="font-semibold text-primary">14.8 MT Paste (17.4%)</div>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">28-30° Brix Standard</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface-variant">Tomato Pomace (Poultry)</td>
                      <td className="py-3 px-space-sm text-on-surface font-medium">₦62,000/MT</td>
                      <td className="py-3 px-space-sm text-right">
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold font-label-sm text-label-sm">44.0%</span>
                      </td>
                    </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm p-space-lg">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <Icon name="sanitizer" className="text-primary text-[22px]" />
                  <h3 className="font-headline-md text-headline-md text-on-surface">Plant CIP &amp; Preventive Maintenance Hygiene</h3>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> All Swabs &lt;10 RLU (Passed)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Flash Dryer Cyclones</span>
                    <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">CLEAN</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Hot caustic wash + acid rinse completed at 04:30 AM.</p>
                  <div className="mt-space-sm flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-outline">ATP Swab: 4 RLU</span>
                    <span className="text-primary font-semibold">Next in 18h</span>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Line B Rice Dehullers</span>
                    <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">OPTIMAL</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Rubber roller clearance 0.75mm; magnetic separator cleaned.</p>
                  <div className="mt-space-sm flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-outline">Wear: 12%</span>
                    <span className="text-primary font-semibold">Next in 42h</span>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">316L SS Oil Storage Tanks</span>
                    <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">DUE 3H</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Tank #3 purge protocol programmed after expeller batch completion.</p>
                  <div className="mt-space-sm flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-outline">Nitrogen Blanket</span>
                    <span className="text-tertiary-container font-semibold">Scheduled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm p-space-lg">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <Icon name="warehouse" className="text-primary text-[22px]" />
                  <h3 className="font-headline-md text-headline-md text-on-surface">Finished Goods Stock</h3>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Depot Hub Oyo</span>
              </div>
              <div className="flex flex-col gap-space-sm">
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-primary-fixed flex items-center justify-center font-bold">
                      <Icon name="layers" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="font-label-lg text-label-lg font-semibold text-on-surface">Food-Grade Native Starch</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">50kg Multiwall · 840 Bags · Zone A2</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-on-surface">₦38,000<span className="font-label-sm text-label-sm text-on-surface-variant font-normal">/bag</span></div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">#ST-26-84 QR</span>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold">
                      <Icon name="grain" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="font-label-lg text-label-lg font-semibold text-on-surface">Premium Parboiled Rice</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">50kg Bags · 520 Bags · Grand Cereals</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-on-surface">₦68,000<span className="font-label-sm text-label-sm text-on-surface-variant font-normal">/bag</span></div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">#RC-26-32 QR</span>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold">
                      <Icon name="propane_tank" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="font-label-lg text-label-lg font-semibold text-on-surface">Crude Soya Oil (Food-Grade)</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">200L Steel Drums · 72 Drums (14.4 MT)</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-on-surface">₦240,000<span className="font-label-sm text-label-sm text-on-surface-variant font-normal">/drum</span></div>
                    <span className="font-label-sm text-label-sm text-outline font-semibold">Tank 3 Offtake</span>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center font-bold">
                      <Icon name="pets" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="font-label-lg text-label-lg font-semibold text-on-surface">Defatted Soya Cake Meal</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">44% CP Poultry Grade · 390 Bags</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-on-surface">₦29,500<span className="font-label-sm text-label-sm text-on-surface-variant font-normal">/bag</span></div>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Depot C1</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm p-space-lg">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <Icon name="verified_user" className="text-secondary text-[22px]" />
                  <h3 className="font-headline-md text-headline-md text-on-surface">Food Safety &amp; Quality Sentinel</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Compliant</span>
              </div>
              <div className="flex flex-wrap gap-space-xs mb-space-md">
                <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> NAFDAC GMP #01-9921</span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> SON MANCAP Gold</span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> ISO 22000 FSMS</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low mb-space-md font-body-sm text-body-sm">
                <div className="font-label-md text-label-md font-semibold text-on-surface mb-space-xs">Official Lab Certificate of Analysis (CoA) Stamp:</div>
                <div className="grid grid-cols-2 gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                  <div className="flex justify-between p-1 bg-surface-container-lowest rounded">
                    <span>Total Aflatoxin:</span>
                    <span className="text-secondary font-bold">&lt;2.0 ppb (Safe)</span>
                  </div>
                  <div className="flex justify-between p-1 bg-surface-container-lowest rounded">
                    <span>Moisture Limit:</span>
                    <span className="text-on-surface font-semibold">11.8% (Max 12%)</span>
                  </div>
                  <div className="flex justify-between p-1 bg-surface-container-lowest rounded">
                    <span>Heavy Metals:</span>
                    <span className="text-secondary font-bold">Non-detectable</span>
                  </div>
                  <div className="flex justify-between p-1 bg-surface-container-lowest rounded">
                    <span>Cyanogenic Pot.:</span>
                    <span className="text-secondary font-bold">&lt;10 mg/kg (Safe)</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-space-sm">
                <button className="w-full sm:flex-1 py-2 px-space-md rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1" type="button">
                  <Icon name="file_download" className="text-[16px]" />
                  <span>Download Lab CoA (PDF)</span>
                </button>
                <button className="w-full sm:flex-1 py-2 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-1" type="button">
                  <Icon name="assignment_turned_in" className="text-[16px]" />
                  <span>Audit Inspection</span>
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-space-xs">
              <Icon name="verified" className="text-secondary text-[18px]" />
              <span className="font-label-md text-label-md text-on-surface font-semibold">SON MANCAP &amp; NAFDAC Certified Node</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <Icon name="sync_saved_locally" className="text-secondary text-[18px]" />
              <span className="font-label-sm text-label-sm">PowerSync Operational (Edge DB Active)</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-md">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
              <Icon name="sms" className="text-tertiary-container text-[18px]" />
              <span>Termii SMS Gateway: ₦148,250.00 Balance</span>
            </div>
            <div className="font-label-sm text-label-sm text-outline">CultivaNode OS v4.2.1-savanna</div>
          </div>
        </section>
      </div>
    </div>
  );
}
