// Ported from the "executive_farm_operations_dashboard" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";

export type ExecutiveDashboardSlot = "eyebrow" | "greeting" | "heroMeta" | "heroActions" | "kpis" | "operations" | "statusBar";

export function ExecutiveDashboard({ slots }: ScreenProps<ExecutiveDashboardSlot>) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="mb-space-lg">
          <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none" />
            <div className="absolute right-96 -bottom-20 h-48 w-48 rounded-full bg-secondary/5 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-space-lg lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                {slot(slots, "eyebrow", (
                  <div className="flex flex-wrap items-center gap-space-xs mb-space-xs">
                    <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm"><span className="h-2 w-2 rounded-full bg-secondary animate-pulse" /> Pilot Agro-Cluster Phase 1</span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1"><Icon name="verified" className="text-sm text-secondary" /> NiMet Agro-Met Synced (06:00 WAT)</span>
                  </div>
                ))}
                {slot(slots, "greeting", (
                  <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">E káàrọ̀, Quadri Olapade</h1>
                ))}
                {slot(slots, "heroMeta", (
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">Iseyin Farm Hub • Plots A1-B3 (42.5 Ha) • Derived Savanna Ecological Zone, Oyo State</p>
                ))}
              </div>
              {slot(slots, "heroActions", (
                <div className="flex flex-wrap items-center gap-space-sm">
                  <button className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-sm" type="button">
                    <Icon name="add_circle" className="text-base text-secondary" />
                    <span>New Planting</span>
                  </button>
                  <button className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-tertiary-container text-on-tertiary font-label-md text-label-md hover:opacity-95 transition-all shadow-sm" type="button">
                    <Icon name="precision_manufacturing" className="text-base" />
                    <span>Book Machinery (Direct)</span>
                  </button>
                  <button className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-sm" type="button">
                    <Icon name="edit_calendar" className="text-base" />
                    <span>Log Field Operation</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-space-lg pt-space-md border-t border-surface-container flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-low/60 -mx-space-lg -mb-space-lg px-space-lg py-space-md">
              <div className="flex flex-wrap items-center gap-space-lg">
                <div className="flex items-center gap-space-sm">
                  <div className="h-10 w-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                    <Icon name="partly_cloudy_day" className="text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline-md text-headline-md text-on-surface">29°C</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Partly Cloudy</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Iseyin Weather Stn #04</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-md">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Relative Humidity</p>
                    <p className="font-headline-sm text-headline-sm text-on-surface">72% <span className="font-label-sm text-label-sm text-secondary">Normal</span></p>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Soil Moisture (15cm)</p>
                    <p className="font-headline-sm text-headline-sm text-on-surface">68% <span className="font-label-sm text-label-sm text-secondary">Optimal</span></p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">ET₀ Evapotranspiration</p>
                    <p className="font-headline-sm text-headline-sm text-on-surface">3.8 mm/day</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-sm p-space-sm px-space-md rounded-lg bg-surface-container-lowest shadow-sm max-w-xl">
                <Icon name="thunderstorm" className="text-xl text-on-tertiary-container animate-bounce" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-wider font-bold">Weather Guardrail Alert</span>
                    <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[0.625rem]">42mm Rain Outlook</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Heavy frontal rain Thursday–Friday. All chemical spray orders held 48h pre-downpour.</p>
                </div>
                <button className="shrink-0 p-1 text-on-surface-variant hover:text-primary" title="Details" type="button">
                  <Icon name="chevron_right" className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="mb-space-lg bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border-l-4 border-l-error">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
            <div className="flex items-center gap-space-xs">
              <Icon name="priority_high" className="text-error animate-pulse" />
              <h2 className="font-headline-md text-headline-md text-on-surface">What Needs Attention Today?</h2>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">4 Action Items</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Ranked by urgency · CultivaNode Diagnostic Engine</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md mt-space-md">
            <div className="p-space-sm rounded-lg bg-error-container/20 border border-error-container flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="px-1.5 py-0.5 rounded bg-error text-on-error font-label-sm text-[0.625rem] font-bold uppercase">Priority 1 · Weather Guardrail</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Plot B1 (Tomato)</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold mt-2">NiMet 42mm Heavy Rain Frontal Warning</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Mancozeb chemical sprays held 48h to prevent wash-off &amp; waterway run-off.</p>
              <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary font-medium">NiMet Sync 06:00 WAT</span>
                <button className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold transition-colors" type="button">View Protocol</button>
              </div>
            </div>
            <div className="p-space-sm rounded-lg bg-tertiary-fixed/20 border border-tertiary-fixed flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary font-label-sm text-[0.625rem] font-bold uppercase">Priority 2 · Agronomy Window</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Plot A2 (Maize)</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold mt-2">Split-Nitrogen Top-Dressing Due (Urea 46%)</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Side-placement 5cm from stalk required in 48-hour pre-rain window.</p>
              <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary font-medium">IITA Savanna Standard</span>
                <button className="px-2 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors" type="button">Dispatch Crew</button>
              </div>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container-low border border-surface-container flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[0.625rem] font-bold uppercase">Priority 3 · Inventory Reorder</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Hub Store #1</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold mt-2">Granular Urea Stock Shortfall</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Only 6 bags in stock; 14 additional bags needed to complete Plots A1 &amp; A2.</p>
              <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Iseyin Agro-Dealer</span>
                <button className="px-2 py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors" type="button">Instant Reorder</button>
              </div>
            </div>
            <div className="p-space-sm rounded-lg bg-secondary-container/20 border border-secondary-container flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="px-1.5 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-[0.625rem] font-bold uppercase">Priority 4 · Livestock Feed</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Poultry House 1</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold mt-2">Broiler Finisher Reorder Threshold</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">142 kg/day intake; current buffer 4 days. NDV booster timing synchronized.</p>
              <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary font-medium">Livestock Bio-Track</span>
                <button className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold transition-colors" type="button">Feed Roster</button>
              </div>
            </div>
          </div>
        </section>
        {slot(slots, "kpis", (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Cultivated Land Mass</span>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-primary tracking-tight">42.5</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface-variant">Ha</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary">
                  <Icon name="crop_free" />
                </div>
              </div>
              <div className="mt-space-md">
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                  <span className="text-on-surface-variant">Cluster Allocation (6 Plots)</span>
                  <span className="text-primary font-bold">94% Active</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: "94%" }} />
                </div>
                <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant mt-2">
                  <span className="flex items-center gap-1 text-secondary font-medium"><Icon name="trending_up" className="text-xs" /> +4.2 Ha expansion</span>
                  <span>Derived Savanna</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Enterprise Portfolio</span>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface tracking-tight">6</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface-variant">Enterprises</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
                  <Icon name="hub" />
                </div>
              </div>
              <div className="mt-space-md space-y-1.5">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary" /> 4 Crop Stands (Maize, Cassava, Tomato, Cowpea)</span>
                  <span className="text-on-surface-variant font-medium">42.5 Ha</span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-container" /> Broilers B4 (1,250 birds)</span>
                  <span className="text-secondary font-semibold">98.8% Livab.</span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-tertiary-container" /> Catfish Pond P2 (3,400 fingerlings)</span>
                  <span className="text-on-surface-variant font-medium">1.15 MT Biomass</span>
                </div>
                <div className="p-1.5 rounded bg-surface-container-low flex items-center justify-between mt-1 font-label-sm text-label-sm">
                  <span className="text-on-surface-variant flex items-center gap-1"><Icon name="pets" className="text-xs text-secondary" /> Active Livestock:</span>
                  <span className="text-primary font-bold">4,650 head · 98.4% Livability</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Agronomy Ops Velocity</span>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface tracking-tight">18<span className="text-headline-md text-on-surface-variant">/22</span></span>
                    <span className="font-label-md text-label-md text-secondary font-bold">82%</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <Icon name="checklist" />
                </div>
              </div>
              <div className="mt-space-md">
                <div className="p-space-sm bg-surface-container-low rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface">Next 72 Hours</span>
                    <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm">4 Pending</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Split-N top-dressing (Maize A2) &amp; tractor rotary weeding.</p>
                </div>
                <div className="flex items-center gap-1.5 mt-2 font-label-sm text-label-sm text-on-surface-variant">
                  <Icon name="verified" className="text-sm text-secondary" />
                  <span>Zero SOP non-compliance logged</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Farm Capital &amp; Settlement</span>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">₦4.85M</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Proj. Gross</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center text-tertiary">
                  <Icon name="account_balance" />
                </div>
              </div>
              <div className="mt-space-md pt-space-xs space-y-2">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Deployed Input Capital:</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">₦1,240,000</span>
                </div>
                <div className="flex flex-col p-1.5 rounded bg-surface-container-low">
                  <div className="flex items-center justify-between text-body-sm font-body-sm">
                    <span className="text-tertiary flex items-center gap-1 font-medium"><Icon name="handshake" className="text-sm" /> Active Service Bookings:</span>
                    <span className="font-label-md text-label-md text-tertiary-container font-bold">₦320,000</span>
                  </div>
                  <span className="text-[0.625rem] text-secondary font-medium mt-0.5">Direct Settlement · 0% Commission Pilot</span>
                </div>
              </div>
            </div>
          </section>
        ))}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm pb-space-md border-b border-surface-container">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <Icon name="psychiatry" className="text-secondary" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">Active Crop Cycles &amp; Phenology</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Synchronized with IITA Savanna Protocols • Growing Degree Days Tracking</p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="px-space-sm py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-bold">Derived Savanna Early Rains 2025</span>
                </div>
              </div>
              <div className="mt-space-md space-y-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="h-12 w-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0">
                        <Icon name="grain" className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Maize DMR-LSR-Y</h3>
                          <span className="px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-[0.625rem]">Plot A1 &amp; A2 • 18 Ha</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Planted 24 days ago (18 Feb) • Target Yield: <strong className="text-on-surface">4.8 MT/Ha</strong> <span className="text-secondary">(+50% vs regional avg)</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm md:text-right">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md">V6 Stage (Week 5)</span>
                    </div>
                  </div>
                  <div className="mt-space-md">
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                      <span>Vegetative Growth (Rapid N Uptake)</span>
                      <span>Harvest Window: May 22 - May 29 (68 days left)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden flex">
                      <div className="h-full bg-secondary" style={{ width: "38%" }} />
                      <div className="h-full bg-secondary-fixed-dim" style={{ width: "15%" }} />
                    </div>
                  </div>
                  <div className="mt-space-sm flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-lowest text-body-sm font-body-sm">
                    <div className="flex items-center gap-2 text-on-surface">
                      <Icon name="science" className="text-base text-secondary" />
                      <span>Split-Nitrogen Top-Dressing (Urea 46%) triggers in 48 hours for Plot A2.</span>
                    </div>
                    <button className="text-secondary hover:text-primary font-label-sm text-label-sm font-semibold" type="button">View Protocol</button>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="h-12 w-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm shrink-0">
                        <Icon name="spa" className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Cassava (TME 419 High Starch)</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-[0.625rem]">Plot B2 • 14 Ha</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Planted 82 days ago (Dec Late Rains) • Est. Bulk: <strong className="text-on-surface">26.5 MT/Ha</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm md:text-right">
                      <span className="px-space-sm py-1 rounded-full bg-surface-container text-on-surface font-label-md text-label-md">Month 3: Early Root Bulking</span>
                    </div>
                  </div>
                  <div className="mt-space-md">
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                      <span>Canopy Closure Complete • Weed Resistance High</span>
                      <span>Harvest: Nov 2025 (9-10 Mos)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
                      <div className="h-full bg-primary-container" style={{ width: "28%" }} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="p-space-md rounded-xl bg-surface-container-low">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-error" />
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">Tomato (Roma VF)</h4>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Plot B1 • 6.5 Ha • Drip Irrigated</span>
                      </div>
                      <span className="px-space-xs py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">Mildew Guardrail</span>
                    </div>
                    <div className="mt-space-sm">
                      <div className="flex items-baseline justify-between text-body-sm font-body-sm">
                        <span>Week 7: 1st Fruit Set</span>
                        <span className="font-medium">Harvest: 28 days</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-lowest mt-1 overflow-hidden">
                        <div className="h-full bg-tertiary-container" style={{ width: "62%" }} />
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm flex items-center gap-1"><Icon name="warning" className="text-sm text-tertiary" /> Hold copper fungicide spray until Saturday rain clear.</p>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-low">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">Cowpea (SAMPEA-14)</h4>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Plot B3 • 4.0 Ha • Cover / Relay</span>
                      </div>
                      <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Biological Nitrogen Fix</span>
                    </div>
                    <div className="mt-space-sm">
                      <div className="flex items-baseline justify-between text-body-sm font-body-sm">
                        <span>Week 3: Vegetative</span>
                        <span className="font-medium">Nodulation Active</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-lowest mt-1 overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: "30%" }} />
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm flex items-center gap-1"><Icon name="pest_control" className="text-sm text-secondary" /> Pod-borer scouting planned for Monday morning.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm pb-space-md border-b border-surface-container">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <Icon name="pets" className="text-secondary" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">Active Livestock Enterprises &amp; Production</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Intensive Poultry &amp; Recirculating Aquaculture • Biosecurity Level 1 Protocols</p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="px-space-sm py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-bold">Mixed Farm Integration</span>
                  <span className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">2 Batches Active</span>
                </div>
              </div>
              <div className="mt-space-md space-y-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="h-12 w-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm shrink-0">
                        <Icon name="egg" className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Broilers (Kuroiler / Cobb 500)</h3>
                          <span className="px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-[0.625rem]">Batch B4 • Poultry House 1</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">1,250 Birds • Day 28 (Week 4 Grower) • Livability: <strong className="text-secondary">98.8%</strong> (15 mortalities to date)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm md:text-right">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md font-semibold">FCR: 1.62 (Target: 1.65)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mt-space-md">
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Avg Bird Weight</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">1.35 kg <span className="font-label-sm text-label-sm text-on-surface-variant">/ 1.40 kg</span></p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Daily Feed Intake</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">142 kg/day</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Biosecurity Status</span>
                      <p className="font-label-md text-label-md text-secondary font-semibold mt-0.5 flex items-center gap-1"><Icon name="verified" className="text-sm" /> Footbath Active</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Feed Inventory</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">4 Days Buffer</p>
                    </div>
                  </div>
                  <div className="mt-space-sm flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-lowest text-body-sm font-body-sm">
                    <div className="flex items-center gap-2 text-on-surface">
                      <Icon name="medical_services" className="text-base text-secondary" />
                      <span>NDV Lasota Booster vaccination due in 48h. Cold-chain confirmed at Hub Store.</span>
                    </div>
                    <button className="text-secondary hover:text-primary font-label-sm text-label-sm font-semibold" type="button">Vet Protocol</button>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="h-12 w-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm shrink-0">
                        <Icon name="phishing" className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Aquaculture / Clarias Catfish</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-[0.625rem]">Pond 02 • Recirculating Tank</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">3,400 Fingerlings • Month 2 Grow-out • Est. Total Biomass: <strong className="text-on-surface">1.15 MT</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm md:text-right">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-label-md text-label-md font-semibold">Water Quality: Optimal</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mt-space-md">
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Water Temperature</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">27.5°C</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Dissolved Oxygen</span>
                      <p className="font-headline-sm text-headline-sm text-secondary mt-0.5">6.2 mg/L</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Feeding Protocol</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">18 kg/day</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Feed Type</span>
                      <p className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">4mm Floating Pellet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {slot(slots, "operations", (
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm pb-space-md border-b border-surface-container">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Scheduled Farm Operations</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Governed by: <span className="font-medium text-on-surface">Savanna Maize Standard v2.1 (Oyo-Derived Protocol)</span></p>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button className="px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors" type="button">Filter by Plot</button>
                    <button className="px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors" type="button">Export Roster</button>
                  </div>
                </div>
                <div className="mt-space-md overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-space-sm px-space-sm">Operation / Task</th>
                        <th className="py-space-sm px-space-sm">Plot &amp; Area</th>
                        <th className="py-space-sm px-space-sm">Timeline</th>
                        <th className="py-space-sm px-space-sm">Resource / Inputs</th>
                        <th className="py-space-sm px-space-sm">Status &amp; Protocol</th>
                        <th className="py-space-sm px-space-sm text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-md px-space-sm">
                          <div className="font-label-md text-label-md text-on-surface">Split-N Top-Dressing</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">Side-placement 5cm from stalk</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-on-surface">Plot A2</span>
                          <div className="text-on-surface-variant">Maize (9.0 Ha)</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-on-surface">Due in 2 days</span>
                          <div className="text-on-surface-variant">Optimal: Pre-rain window</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <div className="flex items-center gap-1 font-medium text-on-surface"><Icon name="inventory_2" className="text-sm text-secondary" /> 12 Bags Urea (In Stock)</div>
                          <div className="text-on-surface-variant">Store Room 01</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-label-sm text-label-sm"><span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Ready to Execute</span>
                        </td>
                        <td className="py-space-md px-space-sm text-right">
                          <button className="px-space-sm py-1 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors" type="button">Log Completion</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors bg-tertiary-fixed/10">
                        <td className="py-space-md px-space-sm">
                          <div className="font-label-md text-label-md text-on-surface">Fungicide Shield (Mancozeb 80WP)</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">Alternaria Solani prevention</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-on-surface">Plot B1</span>
                          <div className="text-on-surface-variant">Tomato (6.5 Ha)</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-error">Delayed +48h</span>
                          <div className="text-on-surface-variant">NiMet Guardrail active</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <div className="flex items-center gap-1 font-medium text-on-surface"><Icon name="water_drop" className="text-sm" /> 14kg Mancozeb</div>
                          <div className="text-on-surface-variant">Knapsack Crews ready</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm"><span className="h-1.5 w-1.5 rounded-full bg-tertiary" /> Weather Hold (Rain 42mm)</span>
                        </td>
                        <td className="py-space-md px-space-sm text-right">
                          <button className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-colors" type="button">Override Rule</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-md px-space-sm">
                          <div className="font-label-md text-label-md text-on-surface">Tractor Rotary Weeding</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">Mechanical inter-row cultivator</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-on-surface">Plot A1</span>
                          <div className="text-on-surface-variant">Maize (9.0 Ha)</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-on-surface">Tomorrow 08:00 WAT</span>
                          <div className="text-on-surface-variant">Operator Check-in Verified</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <div className="flex items-center gap-1 font-medium text-on-surface"><Icon name="precision_manufacturing" className="text-sm text-secondary" /> JD 5075E Tractor</div>
                          <div className="text-on-surface-variant">Escrow #ES-49201</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-label-sm text-label-sm"><span className="h-1.5 w-1.5 rounded-full bg-secondary" /> GPS Dispatched</span>
                        </td>
                        <td className="py-space-md px-space-sm text-right">
                          <button className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm transition-colors" type="button">Live GPS Telemetry</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-md px-space-sm">
                          <div className="font-label-md text-label-md text-on-surface">Aphid &amp; Thrips Scouting</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">10-point random quadrant check</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-on-surface">Plot B3</span>
                          <div className="text-on-surface-variant">Cowpea (4.0 Ha)</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-on-surface">Today 16:30 WAT</span>
                          <div className="text-on-surface-variant">Field Scout Assigned</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <div className="font-medium text-on-surface">Field Agent Babatunde</div>
                          <div className="text-on-surface-variant">Offline PowerSync App</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm"><span className="h-1.5 w-1.5 rounded-full bg-outline" /> In Field Scout</span>
                        </td>
                        <td className="py-space-md px-space-sm text-right">
                          <button className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm transition-colors" type="button">Scout Sheet</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors bg-secondary-container/10">
                        <td className="py-space-md px-space-sm">
                          <div className="font-label-md text-label-md text-on-surface">Livestock Vaccination / NDV Booster</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">Lasota strain ocular/drinking water administration</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-on-surface">Poultry House 1</span>
                          <div className="text-on-surface-variant">Broilers B4 (1,250 birds)</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="font-label-md text-label-md text-on-surface">Tomorrow 07:00 WAT</span>
                          <div className="text-secondary font-medium">Early morning cool window</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <div className="flex items-center gap-1 font-medium text-on-surface"><Icon name="vaccines" className="text-sm text-secondary" /> Lasota Vials (Vet Cold-Chain)</div>
                          <div className="text-on-surface-variant">Dr. Alabi Scheduled</div>
                        </td>
                        <td className="py-space-md px-space-sm">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Vet Scheduled</span>
                        </td>
                        <td className="py-space-md px-space-sm text-right">
                          <button className="px-space-sm py-1 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors" type="button">Review Protocol</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <Icon name="precision_manufacturing" className="text-secondary" />
                  <h2 className="font-headline-md text-headline-md text-on-surface">Machinery &amp; Equipment</h2>
                </div>
                <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[0.625rem] font-bold uppercase">0% Comm. Pilot</span>
              </div>
              <div className="mt-space-md p-space-md rounded-xl bg-surface-container-low space-y-space-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-headline-sm text-headline-sm text-on-surface">John Deere 5075E (75 HP)</div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Alhaji Kazeem Syndicate • Oyo North</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">In Field</span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="p-space-sm bg-surface-container-lowest rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Agreed Direct Fee</span>
                    <p className="font-headline-sm text-headline-sm text-primary">₦95,000</p>
                  </div>
                  <div className="p-space-sm bg-surface-container-lowest rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Telemetry Status</span>
                    <p className="font-label-md text-label-md text-secondary flex items-center gap-1 mt-0.5"><span className="h-2 w-2 rounded-full bg-secondary" /> 1,420 RPM Active</p>
                  </div>
                </div>
                <div className="pt-space-xs">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Plot A1 Rotary Weeding (9 Ha)</span>
                    <span className="font-bold text-on-surface">6.2 Ha Done (68%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-lowest mt-1.5 overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "68%" }} />
                  </div>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant italic">Direct settlement between farmer &amp; provider. Proof of Work (GPS boundary &amp; photos) verified before milestone signoff.</p>
                <div className="flex items-center gap-space-xs pt-space-xs">
                  <button className="flex-1 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md text-center transition-colors" type="button">Inspect GPS Route</button>
                  <button className="flex-1 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-primary font-label-md text-label-md text-center transition-colors" type="button">Confirm Proof of Work</button>
                </div>
              </div>
              <div className="mt-space-md pt-space-md border-t border-surface-container">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Verified Providers Nearby</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">4 Verified Units</span>
                </div>
                <div className="space-y-space-xs">
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon name="agriculture" className="text-sm text-secondary" />
                      <span className="font-label-md text-label-md text-on-surface">MF 375 + Disc Harrow</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">6km away • ₦28k/Ha</span>
                  </div>
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon name="stream_apps" className="text-sm text-secondary" />
                      <span className="font-label-md text-label-md text-on-surface">Tractor Boom Sprayer (600L)</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">11km away • ₦15k/Ha</span>
                  </div>
                </div>
                <button className="w-full mt-space-sm py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md text-center transition-colors" type="button">Browse Syndicate Pool (Oyo/Ogun)</button>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <Icon name="smart_toy" className="text-secondary" />
                  <h2 className="font-headline-md text-headline-md text-on-surface">AI Field Agronomist Triage</h2>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-[0.625rem]">EN</span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[0.625rem] font-bold">YORÙBÁ</span>
                </div>
              </div>
              <div className="mt-space-md space-y-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="coronavirus" className="text-error" />
                      <span className="font-label-md text-label-md text-on-surface">Plot B1: Tomato Leaf Triage</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">94% Match</span>
                  </div>
                  <div className="mt-2 text-body-sm font-body-sm text-on-surface-variant"><strong className="text-on-surface">Early Blight (Alternaria solani)</strong> detected via leaf lesion scan at Node 03.</div>
                  <div className="mt-space-sm p-space-sm rounded bg-surface-container-lowest">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-secondary font-bold">Verified Prescription:</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Dr. Funke A. (IITA Alum)</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface mt-1">Apply Copper Hydroxide 50WP (2.5g/L water) 48h after the forecast rain stops. Do not apply prior to Friday downpour.</p>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between">
                    <button className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors" type="button">
                      <Icon name="volume_up" className="text-sm text-secondary" />
                      <span>Gbọ́ ní Yorùbá (Voice Note)</span>
                    </button>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">0:45 audio</span>
                  </div>
                </div>
                <div className="relative">
                  <input className="w-full h-11 pl-3 pr-20 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary shadow-inner" placeholder="Ask symptom in English, Pidgin, or Yorùbá..." type="text" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-1 text-on-surface-variant hover:text-secondary" title="Voice Input" type="button">
                      <Icon name="mic" className="text-lg" />
                    </button>
                    <button className="h-7 w-7 rounded bg-secondary text-on-secondary flex items-center justify-center hover:bg-primary transition-colors" type="button">
                      <Icon name="arrow_forward" className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <Icon name="inventory" className="text-secondary" />
                  <h2 className="font-headline-md text-headline-md text-on-surface">Input Stock Watch</h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Hub Store #1</span>
              </div>
              <div className="mt-space-md space-y-space-md">
                <div>
                  <div className="flex items-center justify-between font-label-md text-label-md mb-1">
                    <span className="text-on-surface">NPK 15-15-15 (Golden Fertilizer)</span>
                    <span className="text-secondary font-bold">28 Bags (Optimal)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between font-label-md text-label-md mb-1">
                    <span className="text-on-surface">Granular Urea 46% (Indorama)</span>
                    <span className="text-on-tertiary-container font-bold">6 Bags (Low Stock)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-tertiary-container rounded-full" style={{ width: "22%" }} />
                  </div>
                  <p className="font-label-sm text-label-sm text-on-tertiary-container mt-1 flex items-center gap-1"><Icon name="info" className="text-xs" /> Required for Plot A2 + Plot A1 top-dress: Need 14 additional bags.</p>
                </div>
                <div>
                  <div className="flex items-center justify-between font-label-md text-label-md mb-1">
                    <span className="text-on-surface">Neem Bio-Extract (3000 PPM)</span>
                    <span className="text-on-surface-variant font-bold">15 Litres</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "55%" }} />
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface font-label-md text-label-md text-center transition-all flex items-center justify-center gap-2" type="button">
                  <Icon name="local_shipping" className="text-base" />
                  <span>Order from Verified Iseyin Agro-Dealer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {slot(slots, "statusBar", (
          <div className="mt-space-xl p-space-md rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm text-body-sm font-body-sm text-on-surface-variant">
            <div className="flex items-center gap-space-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary animate-ping" />
              <span className="font-label-md text-label-md text-on-surface">Local SQLite Engine Active:</span>
              <span>1,842 plot records synced with cloud master • Zero packet loss</span>
            </div>
            <div className="flex items-center gap-space-md text-label-sm font-label-sm">
              <span>Latency: 42ms (MTN 4G / Iseyin Tower)</span>
              <span>•</span>
              <span className="text-secondary font-bold">CultivaNode OS v2.4.1 (Derived Savanna Build)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
