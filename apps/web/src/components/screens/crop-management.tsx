// Ported from the "crop_management_phenology_engine" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogAction, ScreenDialogClose } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";

export function CropManagement({ lang }: ScreenProps) {
  const panelScoutingModal = (
    <div className="bg-surface-container-lowest rounded-xl p-space-xl max-w-xl w-full mx-4 shadow-xl space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <Icon name="add_a_photo" className="text-secondary text-2xl" />
            <h3 className="font-headline-md text-headline-md text-primary">Log New Scouting Observation</h3>
          </div>
          <ScreenDialogClose><button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
              <Icon name="close" />
            </button></ScreenDialogClose>
        </div>
        <div className="space-y-space-sm text-left">
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Target Plot &amp; Crop Variety</label>
            <select defaultValue="Plot B1 · Tomato Roma VF" className="w-full h-10 px-space-md bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md focus:outline-none">
              <option>Plot A1 &amp; A2 · Maize DMR-LSR-Y</option>
              <option>Plot B2 · Cassava TME 419</option>
              <option>Plot B1 · Tomato Roma VF</option>
              <option>Plot B3 · Cowpea SAMPEA-14</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Current Phenology Stage</label>
              <input className="w-full h-10 px-space-md bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md focus:outline-none" type="text" defaultValue="Week 7 Fruit Set" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">GPS Location Pin</label>
              <input className="w-full h-10 px-space-md bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md focus:outline-none" type="text" defaultValue="7.9532° N, 3.5971° E (Iseyin)" />
            </div>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Upload Inspection Photo</label>
            <div className="border-2 border-dashed border-outline-variant p-space-md rounded-lg text-center bg-surface-container-low cursor-pointer hover:bg-surface-container">
              <Icon name="cloud_upload" className="text-3xl text-secondary" />
              <p className="font-label-md text-label-md text-on-surface mt-1">Tap to capture from field camera or upload</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Automatic AI disease classification runs instantly</p>
            </div>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Scout Field Notes (Akiyesi)</label>
            <textarea className="w-full p-space-md bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md focus:outline-none" placeholder="Describe symptoms, foliage color, pest presence or water status..." rows={3} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <ScreenDialogClose><button className="px-space-md py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md" type="button">Cancel</button></ScreenDialogClose>
          <ScreenDialogClose><button className="px-space-lg py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary font-semibold" type="button">Analyze &amp; Save Log</button></ScreenDialogClose>
        </div>
      </div>
  );
  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-space-xl space-y-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider font-semibold">Section 3.3 · Agronomy Telemetry</span>
              <span className="px-space-xs py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Season: Early Rains 2026 (Igba Ewe)</span>
              <span className="px-space-xs py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm flex items-center gap-1"><Icon name="satellite_alt" className="text-xs" /> Copernicus Sentinel-2 L2A Synced</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Crop Phenology &amp; Production Engine</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Real-time growth tracking, automated Growing Degree Days (GDD), split-input scheduling, and pest scouting logs for Iseyin Cluster.</p>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap self-start md:self-center">
            <ScreenDialog title="Log New Scouting Observation" side="center" panel={panelScoutingModal}>
              <button className="flex items-center gap-space-xs px-space-md py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-lg text-label-lg transition-all shadow-sm" type="button">
                <Icon name="add_a_photo" className="text-lg" />
                <span>Log Field Scout (Iroyin Aaye)</span>
              </button>
            </ScreenDialog>
            <button className="flex items-center gap-space-xs px-space-md py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface rounded-lg font-label-lg text-label-lg transition-all" type="button">
              <Icon name="tune" className="text-lg text-secondary" />
              <span>Re-calibrate Phenology Models</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Planted Area</span>
              <div className="p-2 rounded-lg bg-surface-container text-secondary">
                <Icon name="fence" className="text-xl" />
              </div>
            </div>
            <div className="my-space-md">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">42.5</span>
                <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">Ha</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">100% farm cluster operational</p>
            </div>
            <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-semibold">
              <Icon name="check_circle" className="text-sm" />
              <span>6 Active Plots (Gbogbo Aaye)</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Projected Season Yield</span>
              <div className="p-2 rounded-lg bg-surface-container text-secondary">
                <Icon name="grain" className="text-xl" />
              </div>
            </div>
            <div className="my-space-md">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">162.8</span>
                <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">MT</span>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-md text-label-md font-bold mt-1">
                <Icon name="trending_up" className="text-sm" />
                <span>+24.6% vs Regional Avg</span>
              </div>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div className="bg-secondary h-1.5 rounded-full" style={{ width: "78%" }} />
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Input Plan Adherence</span>
              <div className="p-2 rounded-lg bg-surface-container text-secondary">
                <Icon name="science" className="text-xl" />
              </div>
            </div>
            <div className="my-space-md">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">94.0</span>
                <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">%</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Split-N timing fully on schedule</p>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span>Variance: -2 bags Urea</span>
              <span className="text-secondary font-semibold">Optimal</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Scouting Health Index</span>
              <div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container">
                <Icon name="verified" className="text-xl" />
              </div>
            </div>
            <div className="my-space-md">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-secondary font-bold">91%</span>
                <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">Clean</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">1 mild pest vector identified</p>
            </div>
            <div className="flex items-center gap-space-xs text-on-tertiary-container font-label-sm text-label-sm font-semibold">
              <Icon name="warning" className="text-sm" />
              <span>Plot B1: Leaf Curvature Alert</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Active Crop Portfolios &amp; Phenology Stages</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live telemetry calculated from temperature sums, canopy reflectance &amp; phenological modeling.</p>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-lg">
              <button className="px-3 py-1 bg-surface-container-lowest text-primary font-label-md text-label-md rounded shadow-sm font-semibold" type="button">All Plots (4)</button>
              <button className="px-3 py-1 text-on-surface-variant hover:text-on-surface font-label-md text-label-md" type="button">Cereals</button>
              <button className="px-3 py-1 text-on-surface-variant hover:text-on-surface font-label-md text-label-md" type="button">Tubers &amp; Legumes</button>
              <button className="px-3 py-1 text-on-surface-variant hover:text-on-surface font-label-md text-label-md" type="button">Horticulture</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
              <div className="p-space-lg space-y-space-md">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">Plot A1 &amp; A2 · 18.0 Ha</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface mt-1">Maize DMR-LSR-Y</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Agbado Oloyin (Savanna Standard v2.1)</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">Vegetative V6</span>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg space-y-space-xs">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                    <span className="font-semibold">V6 Stage Progression</span>
                    <span className="text-secondary font-bold">68% to V8 Tasseling</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: "68%" }} />
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                    <span>VE (Em.)</span>
                    <span className="font-bold text-primary">V6 (Current)</span>
                    <span>VT (Tassel)</span>
                    <span>R6 (Maturity)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm font-label-sm text-label-sm">
                  <div className="bg-surface p-space-sm rounded">
                    <p className="text-on-surface-variant">Thermal Sum (GDD)</p>
                    <p className="font-metric-num text-headline-sm text-primary font-bold">540 / 890 °C·d</p>
                  </div>
                  <div className="bg-surface p-space-sm rounded">
                    <p className="text-on-surface-variant">Yield Projection</p>
                    <p className="font-metric-num text-headline-sm text-secondary font-bold">4.8 MT/Ha</p>
                  </div>
                </div>
                <div className="p-space-sm bg-tertiary-fixed text-on-tertiary-fixed rounded-lg flex items-start gap-space-xs">
                  <Icon name="hourglass_top" className="text-base mt-0.5 text-tertiary-container" />
                  <div className="text-xs leading-tight">
                    <span className="font-bold">Split-N Urea Countdown:</span>
                    <p className="mt-0.5">Top-dressing execution due in <strong>3 Days</strong> (V7 threshold). Pre-mix ready at Store 1.</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low px-space-lg py-space-sm flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-on-surface-variant">Field Lead: Adeleke O.</span>
                <Link className="text-secondary hover:text-primary font-semibold flex items-center gap-0.5" href={`/${lang}/account/farms/field`}>Details <Icon name="arrow_forward" className="text-sm" /></Link>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
              <div className="p-space-lg space-y-space-md">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">Plot B2 · 14.0 Ha</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface mt-1">Cassava (TME 419)</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Ege Giga-Starch (Late Rains 2024 Cycle)</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold">Month 3 Bulking</span>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg space-y-space-xs">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                    <span className="font-semibold">Canopy Closure Rate</span>
                    <span className="text-secondary font-bold">94% Full Cover</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div className="bg-primary-container h-2 rounded-full" style={{ width: "94%" }} />
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                    <span>Sprouting</span>
                    <span>Branching</span>
                    <span className="font-bold text-primary">Bulking</span>
                    <span>Harvest (Nov &apos;25)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm font-label-sm text-label-sm">
                  <div className="bg-surface p-space-sm rounded">
                    <p className="text-on-surface-variant">Weed Suppression</p>
                    <p className="font-metric-num text-headline-sm text-secondary font-bold">Autonomous</p>
                  </div>
                  <div className="bg-surface p-space-sm rounded">
                    <p className="text-on-surface-variant">Target Starch Yield</p>
                    <p className="font-metric-num text-headline-sm text-primary font-bold">28.5 MT/Ha</p>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container text-on-surface rounded-lg flex items-start gap-space-xs">
                  <Icon name="verified_user" className="text-base mt-0.5 text-secondary" />
                  <div className="text-xs leading-tight">
                    <span className="font-bold">Cassava Mosaic Disease (CMD):</span>
                    <p className="mt-0.5">Resistance level confirmed 100% stable; zero whitefly vectors on leaf collars.</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low px-space-lg py-space-sm flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-on-surface-variant">Field Lead: Babatunde G.</span>
                <Link className="text-secondary hover:text-primary font-semibold flex items-center gap-0.5" href={`/${lang}/account/farms/field`}>Details <Icon name="arrow_forward" className="text-sm" /></Link>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
              <div className="p-space-lg space-y-space-md">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">Plot B1 · 6.5 Ha</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface mt-1">Tomato Roma VF</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Tomati Drip Precision Block</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold">Week 7 Fruit Set</span>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg space-y-space-xs">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                    <span className="font-semibold">Fruit Cluster Index</span>
                    <span className="text-on-tertiary-container font-bold">4.2 Clusters/Plant</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div className="bg-on-tertiary-container h-2 rounded-full" style={{ width: "58%" }} />
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                    <span>Nursery</span>
                    <span>Flower</span>
                    <span className="font-bold text-primary">Fruit Set</span>
                    <span>Breaker / Ripening</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm font-label-sm text-label-sm">
                  <div className="bg-surface p-space-sm rounded">
                    <p className="text-on-surface-variant">Irrigation Regime</p>
                    <p className="font-metric-num text-headline-sm text-secondary font-bold">12.4 m³/Ha/d</p>
                  </div>
                  <div className="bg-surface p-space-sm rounded">
                    <p className="text-on-surface-variant">Pre-Harvest Int.</p>
                    <p className="font-metric-num text-headline-sm text-primary font-bold">14 Days</p>
                  </div>
                </div>
                <div className="p-space-sm bg-error-container text-on-error-container rounded-lg flex items-start gap-space-xs">
                  <Icon name="fmd_bad" className="text-base mt-0.5 text-error" />
                  <div className="text-xs leading-tight">
                    <span className="font-bold">Downy Mildew Guardrail Hold:</span>
                    <p className="mt-0.5">High morning leaf wetness. Copper Hydroxide spray cleared for morning 06:30.</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low px-space-lg py-space-sm flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-on-surface-variant">Field Lead: Quadri Olapade</span>
                <Link className="text-secondary hover:text-primary font-semibold flex items-center gap-0.5" href={`/${lang}/account/farms/field`}>Details <Icon name="arrow_forward" className="text-sm" /></Link>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
              <div className="p-space-lg space-y-space-md">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">Plot B3 · 4.0 Ha</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface mt-1">Cowpea SAMPEA-14</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Ewa Biological Nitrogen Fixation</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">Week 3 Nodulation</span>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg space-y-space-xs">
                  <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                    <span className="font-semibold">Symbiotic Nodulation</span>
                    <span className="text-secondary font-bold">Active (Pink Legh.)</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: "35%" }} />
                  </div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                    <span>Emergence</span>
                    <span className="font-bold text-primary">Nodules</span>
                    <span>Flowering</span>
                    <span>Pod Fill</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm font-label-sm text-label-sm">
                  <div className="bg-surface p-space-sm rounded">
                    <p className="text-on-surface-variant">Natural N Fixed</p>
                    <p className="font-metric-num text-headline-sm text-secondary font-bold">~42 kg N/Ha</p>
                  </div>
                  <div className="bg-surface p-space-sm rounded">
                    <p className="text-on-surface-variant">PBP Trap Count</p>
                    <p className="font-metric-num text-headline-sm text-primary font-bold">0 / Trap (Safe)</p>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container text-on-surface rounded-lg flex items-start gap-space-xs">
                  <Icon name="pest_control" className="text-base mt-0.5 text-secondary" />
                  <div className="text-xs leading-tight">
                    <span className="font-bold">Pod Borer Scouting Sweep:</span>
                    <p className="mt-0.5">Maruca vitrata pheromone trap inspection scheduled for Thursday 08:00.</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-low px-space-lg py-space-sm flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-on-surface-variant">Field Lead: Quadri Olapade</span>
                <Link className="text-secondary hover:text-primary font-semibold flex items-center gap-0.5" href={`/${lang}/account/farms/field`}>Details <Icon name="arrow_forward" className="text-sm" /></Link>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div>
              <div className="flex items-center gap-space-xs">
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Phenological Calendar &amp; Lifecycle Windows</h2>
                <span className="px-2 py-0.5 bg-surface-container font-label-sm text-label-sm text-on-surface-variant rounded">Season 2026</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Integrated Gantt tracking critical agronomic interventions across the Iseyin Hub plots.</p>
            </div>
            <div className="flex items-center gap-space-md text-xs font-semibold flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-surface-container-high" />
                <span>Land Prep</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary-container" />
                <span>Planting &amp; V-Stages</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-on-tertiary-container" />
                <span>Split Input / Chem</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-secondary" />
                <span>Harvest Window</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto pt-space-xs">
            <div className="min-w-[760px] space-y-space-sm">
              <div className="grid grid-cols-12 text-center font-label-sm text-label-sm text-on-surface-variant font-bold bg-surface-container-low p-2 rounded-lg">
                <div className="text-left pl-2">Plot / Variety</div>
                <div>W1 Mar</div>
                <div>W2 Mar</div>
                <div>W3 Mar</div>
                <div>W4 Mar</div>
                <div className="text-primary font-bold bg-secondary-container/40 rounded">W1 Apr (Now)</div>
                <div>W2 Apr</div>
                <div>W3 Apr</div>
                <div>W4 Apr</div>
                <div>W1 May</div>
                <div>W2 May</div>
                <div>W3 May+</div>
              </div>
              <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate pr-2">Plot A1/A2 · Maize DMR</div>
                <div className="col-span-2 bg-surface-container-high text-on-surface text-center py-1.5 rounded-l text-[10px] font-semibold">Tillage &amp; Ridge</div>
                <div className="col-span-2 bg-primary-container text-on-primary-container text-center py-1.5 text-[10px] font-semibold">Planting + Basal</div>
                <div className="col-span-2 bg-on-tertiary-container text-on-tertiary text-center py-1.5 text-[10px] font-bold shadow-sm animate-pulse">V6 Split-Urea (Active)</div>
                <div className="col-span-3 bg-surface-container text-on-surface-variant text-center py-1.5 text-[10px] font-semibold">Tasseling &amp; R-Stages</div>
                <div className="col-span-2 bg-secondary text-on-secondary text-center py-1.5 rounded-r text-[10px] font-semibold">Harvest</div>
              </div>
              <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate pr-2">Plot B2 · Cassava 419</div>
                <div className="col-span-4 bg-primary-container text-on-primary-container text-center py-1.5 rounded-l text-[10px] font-semibold">Stem Cutting &amp; Pre-Em</div>
                <div className="col-span-4 bg-secondary text-on-secondary text-center py-1.5 text-[10px] font-bold">Canopy Close &amp; Bulking</div>
                <div className="col-span-4 bg-surface-container text-on-surface-variant text-center py-1.5 rounded-r text-[10px] font-semibold">Starch Storing (Harvest Nov)</div>
              </div>
              <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate pr-2">Plot B1 · Roma VF</div>
                <div className="col-span-2 bg-surface-container-high text-on-surface text-center py-1.5 rounded-l text-[10px] font-semibold">Nursery Beds</div>
                <div className="col-span-2 bg-primary-container text-on-primary-container text-center py-1.5 text-[10px] font-semibold">Transplant + Drip</div>
                <div className="col-span-2 bg-on-tertiary-container text-on-tertiary text-center py-1.5 text-[10px] font-bold">Fruit-Set + Mildew Hold</div>
                <div className="col-span-2 bg-surface-container text-on-surface-variant text-center py-1.5 text-[10px] font-semibold">Breaker Stage</div>
                <div className="col-span-4 bg-secondary text-on-secondary text-center py-1.5 rounded-r text-[10px] font-semibold">Weekly Staggered Crate Pick</div>
              </div>
              <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate pr-2">Plot B3 · Cowpea SAMPEA</div>
                <div className="col-span-3 bg-surface-container-high text-on-surface text-center py-1.5 rounded-l text-[10px] font-semibold">Zero-Till Sowing</div>
                <div className="col-span-3 bg-primary-container text-on-primary-container text-center py-1.5 text-[10px] font-semibold">Inoculation &amp; Nodules</div>
                <div className="col-span-3 bg-surface-container text-on-surface-variant text-center py-1.5 text-[10px] font-semibold">Pod Borer Scouting Sweep</div>
                <div className="col-span-3 bg-secondary text-on-secondary text-center py-1.5 rounded-r text-[10px] font-semibold">Pod Desiccation &amp; Combine</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Input Planner &amp; Inventory Sync</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Nutrient timing, safety PHI, and local store allocations.</p>
              </div>
              <span className="p-2 bg-surface-container rounded-lg text-secondary">
                <Icon name="inventory_2" />
              </span>
            </div>
            <div className="space-y-space-sm">
              <div className="p-space-md bg-surface-container-low rounded-lg space-y-space-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Urea 46% N (Granular)</span>
                      <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold">Split 2 Due</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Allocated for Plot A1 &amp; A2 (Maize V6-V8 Topdress)</p>
                  </div>
                  <span className="text-secondary font-label-md text-label-md font-bold">In-Stock</span>
                </div>
                <div className="grid grid-cols-3 gap-space-xs text-xs pt-1">
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Required:</span>
                    <span className="font-bold text-on-surface">2,250 kg (45 Bags)</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Iseyin Silo Store:</span>
                    <span className="font-bold text-secondary">52 Bags Cached</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Application Window:</span>
                    <span className="font-bold text-on-tertiary-container">Apr 4 - Apr 7</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-lg space-y-space-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Copper Hydroxide 53.8%</span>
                      <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Pest Guardrail</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Target: Plot B1 Tomato (Fungal Prevention)</p>
                  </div>
                  <span className="text-error font-label-md text-label-md font-bold">Low Buffer (-2.5 kg)</span>
                </div>
                <div className="grid grid-cols-3 gap-space-xs text-xs pt-1">
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Required:</span>
                    <span className="font-bold text-on-surface">15.0 kg</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Store Balance:</span>
                    <span className="font-bold text-error">12.5 kg Available</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Re-entry Interval:</span>
                    <span className="font-bold text-on-surface">48 Hours (REI)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-secondary font-semibold pt-1">
                  <span className="flex items-center gap-1"><Icon name="local_shipping" className="text-sm" /> Ibadan Hub Delivery ETA: 4 hrs</span>
                  <button className="text-primary underline" type="button">Approve Reorder</button>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-lg space-y-space-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">NPK 15-15-15 + Zn Micro</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Basal Applied</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Cycle: Completed across 18 Ha Maize &amp; 6.5 Ha Tomato</p>
                  </div>
                  <span className="text-secondary font-label-md text-label-md font-bold">100% Completed</span>
                </div>
              </div>
            </div>
            <div className="p-space-md bg-surface-container text-on-surface rounded-lg space-y-space-xs">
              <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md font-bold">
                <Icon name="shield" className="text-base" />
                <span>Compliance &amp; Pre-Harvest Interval (PHI) Warnings</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Tomato Plot B1 is entering fruit development. All synthetic chemical applications must halt 14 days prior to harvest window. Personal Protective Equipment (PPE) Level 3 required during Copper Hydroxide spray execution.</p>
            </div>
            <button className="w-full py-2.5 bg-secondary hover:bg-primary text-on-secondary rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-space-xs" type="button">
              <Icon name="local_shipping" className="text-lg" />
              <span>Dispatch Input Kit to Field Team (Adeleke O.)</span>
            </button>
          </div>
          <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div>
                <div className="flex items-center gap-space-xs">
                  <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Scouting Observations &amp; AI Disease Log</h2>
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm font-bold">AI Diagnostics Active</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Geo-tagged agronomic inspections with computer vision disease classification.</p>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">Synced via PowerSync Engine</span>
            </div>
            <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md">
              <div className="flex flex-col md:flex-row gap-space-md items-start">
                <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-highest">
                  <img className="w-full h-full object-cover" data-alt="High resolution agricultural macro photo of tomato plant leaf showing concentric brown circular lesions characteristic of early blight disease with yellow chlorotic halos, photographed in bright sunny daylight on an organic farm in Nigeria" src="/images/screens/291f3f537ac2.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute bottom-1 right-1 bg-surface-container-lowest/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-primary flex items-center gap-0.5"><Icon name="pin_drop" className="text-xs" /> 7.9532° N, 3.5971° E</div>
                </div>
                <div className="flex-1 space-y-space-xs">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Plot B1 · Roma VF (Row 14, Plant 82)</span>
                      <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Action Required</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Scouted Today, 08:42 WAT</span>
                  </div>
                  <div className="flex items-center gap-space-sm bg-surface-container-lowest p-2 rounded-lg">
                    <Icon name="psychology" className="text-secondary" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-primary">Diagnosis: Early Blight (Alternaria solani)</span>
                        <span className="font-bold text-secondary">94% Confidence</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 mt-1">
                        <div className="bg-secondary h-1.5 rounded-full" style={{ width: "94%" }} />
                      </div>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface">Concentric ring spot lesions identified on 3 lower canopy leaves. Symptoms isolated to south-east furrow near micro-irrigation valve B-12.</p>
                  <div className="p-space-xs bg-surface-container rounded font-label-sm text-label-sm text-on-surface space-y-0.5">
                    <span className="font-bold text-primary flex items-center gap-1"><Icon name="recommend" className="text-sm" /> Agronomist Approved SOP (Quadri Olapade):</span>
                    <p className="text-xs text-on-surface-variant">Prune and burn affected lower leaves. Apply Copper Hydroxide spray (2.5 g/L) at sunset. Check neighboring Plot B3 buffer rows.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs text-xs">
                <div className="flex items-center gap-space-sm text-on-surface-variant">
                  <span>Inspector: Adeleke O.</span>
                  <span>·</span>
                  <span>Batch ID: #SCT-2026-0402</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button className="px-3 py-1 bg-surface-container text-on-surface hover:bg-surface-container-high rounded font-semibold transition-colors" type="button">Dismiss Vector</button>
                  <button className="px-3 py-1 bg-primary text-on-primary rounded font-semibold hover:bg-primary-container transition-colors" type="button">Confirm Spray Ticket</button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md">
              <div className="flex flex-col md:flex-row gap-space-md items-start">
                <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-highest">
                  <img className="w-full h-full object-cover" data-alt="Close up photograph of freshly uprooted healthy cowpea legume roots displaying abundant healthy nitrogen fixing nodules cut open to show active pink leghemoglobin interior, agricultural daylight setting" src="/images/screens/78bb747ef667.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute bottom-1 right-1 bg-surface-container-lowest/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-primary flex items-center gap-0.5"><Icon name="pin_drop" className="text-xs" /> 7.9540° N, 3.5985° E</div>
                </div>
                <div className="flex-1 space-y-space-xs">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Plot B3 · Cowpea SAMPEA-14 (Plot Sector 2)</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">Optimum Vigor</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Scouted Yesterday, 16:15 WAT</span>
                  </div>
                  <div className="flex items-center gap-space-sm bg-surface-container-lowest p-2 rounded-lg">
                    <Icon name="psychology" className="text-secondary" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-secondary">Diagnosis: Active Leghemoglobin Nodulation</span>
                        <span className="font-bold text-secondary">98% Confidence</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 mt-1">
                        <div className="bg-secondary h-1.5 rounded-full" style={{ width: "98%" }} />
                      </div>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface">Nodule bisection demonstrates strong internal pink color indicative of intense nitrogenase activity. Inoculation with Bradyrhizobium fully successful. Zero defoliator caterpillar sign.</p>
                  <div className="p-space-xs bg-surface-container rounded font-label-sm text-label-sm text-on-surface space-y-0.5">
                    <span className="font-bold text-secondary flex items-center gap-1"><Icon name="eco" className="text-sm" /> Biological Nitrogen Enrichment:</span>
                    <p className="text-xs text-on-surface-variant">Recommended: Zero synthetic N addition needed. Maintain soil moisture levels for next 14 days.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs text-xs">
                <div className="flex items-center gap-space-sm text-on-surface-variant">
                  <span>Inspector: Quadri Olapade</span>
                  <span>·</span>
                  <span>Batch ID: #SCT-2026-0401</span>
                </div>
                <button className="px-3 py-1 bg-surface-container text-on-surface hover:bg-surface-container-high rounded font-semibold transition-colors" type="button">Archive Observation</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
