// Ported from the "field_detailed_profile_agronomy_hub_8.3" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function FieldProfile({ lang }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16 space-y-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pt-space-md">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md flex-wrap">
            <Link className="hover:text-primary transition-colors" href={`/${lang}/account/farms`}>Farms</Link>
            <Icon name="chevron_right" className="text-xs" />
            <Link className="hover:text-primary transition-colors" href={`/${lang}/account/farms/field`}>Oke-Ogun Pioneer Estate</Link>
            <Icon name="chevron_right" className="text-xs" />
            <Link className="hover:text-primary transition-colors" href={`/${lang}/account/farms`}>Fields</Link>
            <Icon name="chevron_right" className="text-xs" />
            <span className="text-on-surface font-semibold">Field 01: Northern Savanna Ridge</span>
          </nav>
          <div className="flex items-center gap-space-xs">
            <span className="px-space-sm py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm flex items-center gap-1"><Icon name="satellite_alt" className="text-sm text-secondary" /> Sentinel-2 L2A Rev: Today 08:30 WAT</span>
            <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center gap-1 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Telemetry Live</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-space-md">
            <div className="space-y-space-xs">
              <div className="flex items-center gap-space-sm flex-wrap">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">Field 01: Northern Savanna Ridge</h1>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">(12.40 Ha)</span>
                <span className="px-space-sm py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Parcel #POL-OYO-082-F1</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-space-xs"><Icon name="location_on" className="text-base text-secondary" /> Oke-Ogun Agricultural Corridor, Oyo State (8.3241° N, 3.5822° E) • Tropical Savanna Agro-Ecological Zone</p>
            </div>
            <div className="flex items-center gap-space-xs flex-wrap">
              <button className="px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 active:scale-95" id="btn-log-op" type="button">
                <Icon name="edit_calendar" className="text-lg" />
                <span>Log Operation</span>
              </button>
              <button className="px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-all flex items-center gap-1.5" type="button">
                <Icon name="nature_people" className="text-lg text-secondary" />
                <span>Scouting Note</span>
              </button>
              <button className="px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-all flex items-center gap-1.5" type="button">
                <Icon name="agriculture" className="text-lg text-secondary" />
                <span>Request Tractor</span>
              </button>
              <button className="px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-all flex items-center gap-1.5" type="button">
                <Icon name="science" className="text-lg text-secondary" />
                <span>Soil Test</span>
              </button>
              <button className="p-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all" title="Export Field Dossier (PDF)" type="button">
                <Icon name="picture_as_pdf" className="text-lg" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-space-sm pt-space-xs overflow-x-auto pb-1">
            <div className="px-space-md py-1.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-md text-label-md flex items-center gap-2 whitespace-nowrap shadow-sm"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> <span className="font-bold">Active:</span> Vegetative V5 (SAMMAZ-15)</div>
            <div className="px-space-md py-1.5 rounded-full bg-surface-container-high text-primary font-label-md text-label-md flex items-center gap-2 whitespace-nowrap"><Icon name="eco" className="text-sm text-secondary" /> <span className="font-bold">Soil Health:</span> Optimal (pH 6.4)</div>
            <div className="px-space-md py-1.5 rounded-full bg-surface-container-high text-primary font-label-md text-label-md flex items-center gap-2 whitespace-nowrap"><Icon name="show_chart" className="text-sm text-secondary" /> <span className="font-bold">NDVI:</span> 0.82 (Dense Canopy)</div>
            <div className="px-space-md py-1.5 rounded-full bg-surface-container-high text-primary font-label-md text-label-md flex items-center gap-2 whitespace-nowrap"><Icon name="water_drop" className="text-sm text-secondary" /> <span className="font-bold">Irrigation:</span> Drip Ready / Rains Saturated</div>
            <div className="px-space-md py-1.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md flex items-center gap-2 whitespace-nowrap"><Icon name="security" className="text-sm" /> Tenure: Statutory C-of-O Active</div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            <button className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-1.5 shadow-sm" type="button"><Icon name="dashboard" className="text-base text-secondary-fixed" /> Overview</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="polyline" className="text-base" /> Boundary &amp; PostGIS</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="grass" className="text-base" /> Current Crop Cycle</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="history" className="text-base" /> Crop Rotation History</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="terrain" className="text-base" /> Soil &amp; Pedology</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="event_note" className="text-base" /> Scheduled Operations</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="inventory_2" className="text-base" /> Inventory &amp; Inputs</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="biotech" className="text-base" /> Scouting &amp; Health</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="agriculture" className="text-base" /> Harvest &amp; Yield</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="payments" className="text-base" /> Costs &amp; P&amp;L</button>
            <button className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-lg text-label-lg transition-all flex items-center gap-1.5" type="button"><Icon name="description" className="text-base" /> Documents &amp; Tenure</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Planted Area &amp; Density</span>
              <div className="p-2 rounded-lg bg-surface-container-low text-secondary">
                <Icon name="grid_on" className="text-xl" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-metric-num text-metric-num text-primary font-bold">12.40</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Hectares</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">53,333 plants/Ha • 75cm × 25cm ridge spacing</p>
            </div>
            <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm text-secondary bg-surface-container-low/50 px-2 py-1 rounded">
              <span>661,329 total stand count</span>
              <span className="font-bold">98.2% stand fidelity</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Phenology Stage</span>
              <div className="p-2 rounded-lg bg-secondary-container/40 text-secondary">
                <Icon name="psychiatry" className="text-xl" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-metric-num text-metric-num text-primary font-bold">SAMMAZ-15</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 font-medium">White Maize • Day 42 of 110 (V5 Vegetative)</p>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden mt-1">
              <div className="bg-secondary h-2 rounded-full" style={{ width: "38.1%" }} />
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Accumulated GDD: 640°C</span>
              <span className="text-secondary font-bold">38% Complete</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Projected Harvest</span>
              <div className="p-2 rounded-lg bg-surface-container-low text-secondary">
                <Icon name="event_upcoming" className="text-xl" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-metric-num text-metric-num text-primary font-bold">18 – 24 Jun</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Target Yield: 5.2 MT/Ha (64.5 MT total)</p>
            </div>
            <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm bg-surface-container-low/50 px-2 py-1 rounded">
              <span className="text-on-surface-variant">NDVI Yield Predictor:</span>
              <span className="text-secondary font-bold">66.2 MT (+2.6%)</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Attributed Cost</span>
              <div className="p-2 rounded-lg bg-surface-container-low text-secondary">
                <Icon name="account_balance_wallet" className="text-xl" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-metric-num text-metric-num text-primary font-bold">₦1,248,000</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Budget: ₦1,420,000 (To Date)</p>
            </div>
            <div className="pt-2 flex items-center justify-between font-label-sm text-label-sm bg-secondary-container/30 text-on-secondary-container px-2 py-1 rounded">
              <span className="flex items-center gap-1 font-semibold"><Icon name="trending_down" className="text-xs" /> -12.1% under budget</span>
              <span className="text-on-surface-variant">₦100,645 / Ha</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-8 flex flex-col space-y-space-lg">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Crop Phenological Trajectory</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">110-day cycle modeled against West African Meteorological Soil Moisture models</p>
                </div>
                <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> V5 Vegetative Phase</span>
              </div>
              <div className="pt-space-sm overflow-x-auto">
                <div className="min-w-[640px] flex items-center justify-between relative py-2">
                  <div className="absolute left-6 right-6 top-6 h-1 bg-surface-container-high -z-0" />
                  <div className="absolute left-6 top-6 h-1 bg-secondary -z-0" style={{ width: "44%" }} />
                  <div className="flex flex-col items-center relative z-10 text-center w-20">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
                      <Icon name="check" className="text-sm" />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold mt-2">Land Prep</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Day -14</span>
                  </div>
                  <div className="flex flex-col items-center relative z-10 text-center w-20">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
                      <Icon name="check" className="text-sm" />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold mt-2">Planting</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Day 0</span>
                  </div>
                  <div className="flex flex-col items-center relative z-10 text-center w-20">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
                      <Icon name="check" className="text-sm" />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold mt-2">Emergence (V1)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Day 7</span>
                  </div>
                  <div className="flex flex-col items-center relative z-10 text-center w-28">
                    <div className="w-10 h-10 -mt-1 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-secondary-container">
                      <Icon name="grass" className="text-base" />
                    </div>
                    <span className="font-label-md text-label-md text-secondary font-bold mt-2">Current: V5 Rapid</span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">Day 42</span>
                  </div>
                  <div className="flex flex-col items-center relative z-10 text-center w-20 opacity-60">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-xs">5</div>
                    <span className="font-label-md text-label-md text-on-surface font-medium mt-2">Tasseling</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Day 55</span>
                  </div>
                  <div className="flex flex-col items-center relative z-10 text-center w-20 opacity-60">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-xs">6</div>
                    <span className="font-label-md text-label-md text-on-surface font-medium mt-2">Silking</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Day 65</span>
                  </div>
                  <div className="flex flex-col items-center relative z-10 text-center w-20 opacity-60">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-xs">7</div>
                    <span className="font-label-md text-label-md text-on-surface font-medium mt-2">Dent &amp; R6</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Day 90</span>
                  </div>
                  <div className="flex flex-col items-center relative z-10 text-center w-20 opacity-60">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-xs">8</div>
                    <span className="font-label-md text-label-md text-on-surface font-medium mt-2">Harvest</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Day 110</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-space-xs bg-surface-container-low p-space-md rounded-lg">
                <div className="space-y-0.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Current Canopy Height</span>
                  <p className="font-headline-sm text-headline-sm text-primary font-bold">115 cm</p>
                  <span className="font-body-sm text-body-sm text-secondary font-medium">+14 cm in last 4 days</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Root Probing Depth</span>
                  <p className="font-headline-sm text-headline-sm text-primary font-bold">48 cm</p>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Tap root well established</span>
                </div>
                <div className="space-y-0.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Leaf Area Index (LAI)</span>
                  <p className="font-headline-sm text-headline-sm text-primary font-bold">3.42</p>
                  <span className="font-body-sm text-body-sm text-secondary font-medium">94% sunlight interception</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Scheduled Operations (Next 14 Days)</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Agronomic prescription protocol strictly synchronized with weather radar</p>
                </div>
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest font-label-md text-label-md font-semibold transition-all flex items-center gap-1" type="button"><Icon name="add" className="text-sm" /> Queue New Task</button>
              </div>
              <div className="space-y-space-sm">
                <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container transition-colors">
                  <div className="flex items-start gap-space-md">
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold leading-none">DAY</span>
                      <span className="font-headline-sm text-headline-sm font-bold leading-tight">45</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-space-xs flex-wrap">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">2nd Split Urea Top-Dressing</h3>
                        <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">In 3 Days</span>
                        <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Fertilizer</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Urea 46% N • 1,240 kg (100 kg/Ha) via calibrated knapsack side-dresser. Moisture window ideal.</p>
                      <div className="flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm pt-1">
                        <span className="flex items-center gap-1"><Icon name="person" className="text-sm text-secondary" /> Assigned: Jimoh Rasaq + 4 Laborers</span>
                        <span className="flex items-center gap-1"><Icon name="inventory" className="text-sm text-secondary" /> Allocated from Warehouse Shed 2</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                    <button className="px-space-md py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-primary transition-all" type="button">Mark Ready</button>
                    <button className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                      <Icon name="more_vert" className="text-base" />
                    </button>
                  </div>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container transition-colors">
                  <div className="flex items-start gap-space-md">
                    <div className="w-12 h-12 rounded-lg bg-tertiary-container/20 text-tertiary font-bold flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold leading-none">DAY</span>
                      <span className="font-headline-sm text-headline-sm font-bold leading-tight">52</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-space-xs flex-wrap">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Preventive Biological FAW Spraying</h3>
                        <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">In 10 Days</span>
                        <span className="px-space-xs py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm">Pest Defense</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Emamectin Benzoate 5% SG • 250 g/Ha targeted at whorl leaf axils for Stemborer &amp; Fall Armyworm.</p>
                      <div className="flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm pt-1">
                        <span className="flex items-center gap-1"><Icon name="precision_manufacturing" className="text-sm text-secondary" /> Drone Fleet Syndicate C</span>
                        <span className="flex items-center gap-1"><Icon name="cloud" className="text-sm text-secondary" /> Wind condition forecast: &lt; 8 km/h</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                    <button className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-highest transition-all" type="button">Review SOP</button>
                    <button className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                      <Icon name="more_vert" className="text-base" />
                    </button>
                  </div>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container transition-colors">
                  <div className="flex items-start gap-space-md">
                    <div className="w-12 h-12 rounded-lg bg-surface-container text-on-surface-variant font-bold flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold leading-none">DAY</span>
                      <span className="font-headline-sm text-headline-sm font-bold leading-tight">58</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-space-xs flex-wrap">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Inter-Row Mechanical Weeding Audit</h3>
                        <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">In 16 Days</span>
                        <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Cultivation</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Weed canopy index inspection prior to final row closure. Tractor mini-cultivator mobilization.</p>
                      <div className="flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm pt-1">
                        <span className="flex items-center gap-1"><Icon name="person" className="text-sm text-secondary" /> Assigned: Tunde Balogun</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                    <button className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-highest transition-all" type="button">Details</button>
                    <button className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface" type="button">
                      <Icon name="more_vert" className="text-base" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Field Scouting &amp; AI Diagnostics</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">High-resolution geotagged photographic inspections analyzed by CultivaVision AI</p>
                </div>
                <span className="px-space-sm py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1"><Icon name="smart_toy" className="text-sm" /> Model: AgroBio v4.2 Active</span>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-lg space-y-space-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">Zone B North (Waypoint #NB-104)</span>
                    <span className="text-on-surface-variant font-label-sm text-label-sm">• 2 days ago (14 May 2025, 11:20 WAT)</span>
                  </div>
                  <span className="px-space-sm py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold">Requires Foliar Micro-Spray</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
                  <div className="md:col-span-4 rounded-lg overflow-hidden relative shadow-sm aspect-video md:aspect-auto md:h-36">
                    <img className="w-full h-full object-cover" data-alt="Close-up agronomy scouting photograph of maize leaves exhibiting slight interveinal chlorosis under bright natural equatorial sunlight in Nigeria, crisp focus on green foliage with subtle yellow striping" src="/images/screens/9b8186484291.webp" alt="" loading="lazy" decoding="async" />
                    <div className="absolute bottom-1 right-1 bg-primary/80 backdrop-blur text-on-primary px-1.5 py-0.5 rounded text-[10px] font-mono">GEO: 8.3248° N, 3.5831° E</div>
                  </div>
                  <div className="md:col-span-8 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Observed Symptom:</span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">Interveinal pale-yellow striping on lower to mid leaves.</span>
                    </div>
                    <div className="flex items-start gap-2 bg-surface-container-lowest p-2 rounded">
                      <Icon name="psychology" className="text-secondary text-base shrink-0 mt-0.5" />
                      <div className="text-body-sm font-body-sm">
                        <span className="font-bold text-primary">CultivaVision AI Diagnostic (Confidence: 91.4%):</span>
                        <span className="text-on-surface">Suspected early Zinc (Zn) deficiency exacerbated by recent 24mm heavy rain leaching. Secondary possibility: minor Nitrogen slow release.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-secondary-container/20 p-2 rounded">
                      <Icon name="verified_user" className="text-secondary text-base shrink-0 mt-0.5" />
                      <div className="text-body-sm font-body-sm text-on-surface">
                        <span className="font-bold text-secondary">Agronomist Review (Dr. Adeyemi, Lead Specialist):</span>
                        <span>&quot;Concurred with zinc trace deficit. Add 1.5 L/Ha chelated Zinc EDTA to Day 45 tank mix. Zero immediate threat to crop biomass.&quot;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Multi-Year Crop Rotation Matrix</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Nitrogen balance, soil organic matter renewal, and residual pathogen control</p>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-1"><Icon name="cycle" className="text-sm" /> 3-Year Rotation Cycle Validated</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <tr>
                      <th className="p-space-md">Season / Year</th>
                      <th className="p-space-md">Crop &amp; Variety</th>
                      <th className="p-space-md">Agronomic Purpose</th>
                      <th className="p-space-md">Harvest Yield</th>
                      <th className="p-space-md">Residual Soil Impact</th>
                      <th className="p-space-md">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0">
                    <tr className="bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-space-md font-semibold text-primary">2025 Early Season</td>
                      <td className="p-space-md font-bold text-on-surface">White Maize (SAMMAZ-15)</td>
                      <td className="p-space-md text-on-surface-variant">Commercial Grain Crop</td>
                      <td className="p-space-md font-semibold text-secondary">5.2 MT/Ha (Projected)</td>
                      <td className="p-space-md text-on-surface">Heavy N &amp; P uptake (requires replenishing)</td>
                      <td className="p-space-md">
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">Current</span>
                      </td>
                    </tr>
                    <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">
                      <td className="p-space-md font-semibold text-on-surface">2024 Late Season</td>
                      <td className="p-space-md font-bold text-on-surface">Cowpea (IT99K-573-1-1)</td>
                      <td className="p-space-md text-on-surface-variant">Legume Green Manure</td>
                      <td className="p-space-md font-semibold text-on-surface">1.8 MT/Ha dry seed</td>
                      <td className="p-space-md text-secondary font-bold">+32 kg N/Ha biological fixation</td>
                      <td className="p-space-md">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Completed</span>
                      </td>
                    </tr>
                    <tr className="bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-space-md font-semibold text-on-surface">2024 Early Season</td>
                      <td className="p-space-md font-bold text-on-surface">White Maize (SAMMAZ-15)</td>
                      <td className="p-space-md text-on-surface-variant">Commercial Grain Crop</td>
                      <td className="p-space-md font-semibold text-on-surface">4.8 MT/Ha achieved</td>
                      <td className="p-space-md text-on-surface-variant">High biomass stover tilled in</td>
                      <td className="p-space-md">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Completed</span>
                      </td>
                    </tr>
                    <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">
                      <td className="p-space-md font-semibold text-on-surface">2023 Full Cycle</td>
                      <td className="p-space-md font-bold text-on-surface">Cassava (TME-419)</td>
                      <td className="p-space-md text-on-surface-variant">Starch Industry Root</td>
                      <td className="p-space-md font-semibold text-on-surface">28.4 MT/Ha fresh roots</td>
                      <td className="p-space-md text-on-surface-variant">Subsoil loosening via root expansion</td>
                      <td className="p-space-md">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Completed</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col space-y-space-lg">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Canopy Telemetry</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">ESA Sentinel-2 10m Resolution</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">NDVI 0.82</span>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-surface-container-high h-48 group">
                <div className="w-full h-full bg-cover bg-center" data-location="Oke-Ogun, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/d0d268de7219.webp')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-space-md">
                  <div className="flex items-center justify-between text-on-primary">
                    <span className="font-label-md text-label-md font-semibold flex items-center gap-1"><Icon name="layers" className="text-sm text-secondary-fixed" /> Calibrated NDVI False Color</span>
                    <span className="font-label-sm text-label-sm font-mono text-secondary-fixed">Cloud cover: 0.0%</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-lg space-y-2">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="font-label-md text-label-md font-bold">NDVI Velocity (Day 0 → Day 42)</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">+0.58 gain</span>
                </div>
                <div className="w-full h-16">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 240 60">
                    <path className="text-secondary" d="M0 55 C 40 50, 70 42, 100 32 C 140 20, 180 12, 240 8" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <path className="text-secondary/15" d="M0 55 C 40 50, 70 42, 100 32 C 140 20, 180 12, 240 8 L 240 60 L 0 60 Z" fill="currentColor" />
                    <circle className="fill-primary" cx="100" cy="32" r="3" />
                    <circle className="fill-secondary ring-2 ring-surface" cx="240" cy="8" r="4" />
                  </svg>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>Planting (0.24)</span>
                  <span>V3 (0.54)</span>
                  <span className="font-bold text-primary">Now V5 (0.82)</span>
                </div>
              </div>
              <div className="space-y-space-sm pt-space-xs">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-1.5"><Icon name="science" className="text-secondary text-base" /> Pedological Laboratory Profile</h3>
                <div className="grid grid-cols-2 gap-space-xs text-on-surface">
                  <div className="p-2.5 rounded bg-surface-container-low">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Soil pH (H2O)</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">6.4</span>
                    <span className="font-label-sm text-label-sm text-secondary block font-medium">Optimal Neutral</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-container-low">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Organic Carbon</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">1.82 %</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Moderate/Good</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-container-low">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">CEC Capacity</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">14.8 meq</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">High nutrient hold</span>
                  </div>
                  <div className="p-2.5 rounded bg-surface-container-low">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">Moisture (Root Zone)</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-secondary">32 %</span>
                    <span className="font-label-sm text-label-sm text-secondary block font-bold">+24mm rainfall / 72h</span>
                  </div>
                </div>
                <div className="p-2 rounded bg-surface-container-low text-on-surface font-label-sm text-label-sm flex items-center justify-between">
                  <span className="text-on-surface-variant">Mechanical Texture:</span>
                  <span className="font-bold text-primary">Sandy Clay Loam (58% Sand, 22% Silt, 20% Clay)</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Cadastral Parcel GIS</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">PostGIS Polygon Ref #POL-OYO-082-F1</p>
                </div>
                <button className="p-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest" type="button">
                  <Icon name="open_in_new" className="text-base" />
                </button>
              </div>
              <div className="space-y-2 font-body-sm text-body-sm">
                <div className="flex items-center justify-between py-1 bg-surface-container-low px-2 rounded">
                  <span className="text-on-surface-variant">Perimeter Boundary:</span>
                  <span className="font-mono font-bold text-on-surface">1,480.20 meters</span>
                </div>
                <div className="flex items-center justify-between py-1 bg-surface-container-low px-2 rounded">
                  <span className="text-on-surface-variant">Spatial Overlap Error:</span>
                  <span className="text-secondary font-bold flex items-center gap-1"><Icon name="verified" className="text-xs" /> 0.00% (Conflict Free)</span>
                </div>
                <div className="flex items-center justify-between py-1 bg-surface-container-low px-2 rounded">
                  <span className="text-on-surface-variant">Elevation Gradient:</span>
                  <span className="font-mono text-on-surface">282m - 296m ASL (2.1% slope)</span>
                </div>
                <div className="flex items-center justify-between py-1 bg-surface-container-low px-2 rounded">
                  <span className="text-on-surface-variant">Drainage Classification:</span>
                  <span className="text-on-surface font-medium">Free Draining Savanna Crest</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Assigned Field Team</h2>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">2 Personnel</span>
              </div>
              <div className="space-y-space-sm">
                <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                  <img className="w-10 h-10 rounded-full object-cover shrink-0" data-alt="Portrait of Nigerian agricultural operator Jimoh Rasaq wearing field vest and safety cap smiling on farm in Oyo State" src="/images/screens/f74792d50885.webp" alt="" loading="lazy" decoding="async" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-label-md text-label-md font-bold text-on-surface truncate">Jimoh Rasaq</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Lead Mechanization Operator</p>
                  </div>
                  <a className="p-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest" href="tel:#" title="Call">
                    <Icon name="call" className="text-base" />
                  </a>
                </div>
                <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low">
                  <img className="w-10 h-10 rounded-full object-cover shrink-0" data-alt="Portrait of Nigerian agricultural field supervisor Tunde Balogun holding agronomy tablet in outdoor corn field" src="/images/screens/1ec0703d69dc.webp" alt="" loading="lazy" decoding="async" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-label-md text-label-md font-bold text-on-surface truncate">Tunde Balogun</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Field Agronomy Supervisor</p>
                  </div>
                  <a className="p-1.5 rounded-lg bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary transition-colors" href="https://wa.me/2348000000000" title="WhatsApp Chat" target="_blank" rel="noopener noreferrer">
                    <Icon name="chat" className="text-base" />
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md text-primary font-bold flex items-center gap-1.5"><Icon name="flash_on" className="text-secondary" /> Quick Field Log</h2>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Instant Sync</span>
              </div>
              <div className="space-y-space-sm" id="quick-log-form" role="form">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Log Type</label>
                  <select className="w-full h-10 px-space-sm bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none">
                    <option>Rainfall Gauge (mm)</option>
                    <option>Foliar Fertilizer Application</option>
                    <option>Crop Scouting Note</option>
                    <option>Pest Trap Catch Count</option>
                    <option>Irrigation Run (Hours)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Measured Value / Details</label>
                  <input className="w-full h-10 px-space-sm bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none" placeholder="e.g. 18.5 mm overnight rain" type="text" />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">Field Zone Target</label>
                  <div className="grid grid-cols-3 gap-1">
                    <button className="py-1 text-center rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold" type="button">Entire Field</button>
                    <button className="py-1 text-center rounded bg-surface-container-low text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high" type="button">Zone A</button>
                    <button className="py-1 text-center rounded bg-surface-container-low text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high" type="button">Zone B</button>
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-all shadow-sm flex items-center justify-center gap-1.5 pt-2" type="submit"><Icon name="save" className="text-base" /> Submit Instant Record</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
