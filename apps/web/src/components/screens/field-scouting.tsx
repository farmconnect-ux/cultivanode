// Ported from the "field_scouting_crop_health_diagnostics_9_10" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";
import { slot } from "./types";

export function FieldScouting({ lang, slots }: ScreenProps<"actions" | "kpis" | "feed">) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
              <span className="text-secondary font-semibold">CROP MANAGEMENT</span>
              <span>/</span>
              <span className="text-on-surface font-semibold">FIELD SCOUTING &amp; EPIDEMIOLOGY</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">§9 &amp; §10 Standardized</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Field Scouting, Crop Health &amp; AI Vision Diagnostics</h1>
            <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm mt-0.5">
              <Icon name="share_location" className="text-sm text-secondary" />
              <span className="font-semibold text-on-surface">Oke-Ogun Pioneer Agrarian Estate, Oyo State</span>
              <span className="text-outline">|</span>
              <span>Derived Savanna Ecozone (Plot Cluster A-E)</span>
              <span className="text-outline">|</span>
              <span className="text-secondary font-semibold">Lat 8.3248° N, Long 3.5831° E</span>
            </div>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex flex-wrap items-center gap-space-sm">
              <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all" type="button">
                <Icon name="picture_as_pdf" className="text-lg text-secondary" />
                <span>Export Scouting Dossier (PDF)</span>
              </button>
              <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all" type="button">
                <Icon name="support_agent" className="text-lg text-tertiary" />
                <span>Escalate to ADP Agronomist</span>
              </button>
              <button className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-container transition-all" type="button">
                <Icon name="add_a_photo" className="text-lg" />
                <span>+ Log New Scouting Observation</span>
              </button>
            </div>
          )}
        </div>
        {slot(
          slots,
          "kpis",
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold tracking-wider">Total Season Scouting</span>
                <span className="p-1.5 rounded-lg bg-surface-container text-secondary">
                  <Icon name="fact_check" className="text-base" />
                </span>
              </div>
              <div className="flex items-baseline gap-space-sm">
                <span className="font-metric-num text-metric-num text-on-surface">18</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center"><Icon name="trending_up" className="text-sm" /> +4 this week</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Across 42.5 Hectares under active rotation</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
                <div className="bg-secondary h-1" style={{ width: "78%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm uppercase text-error font-bold tracking-wider">Active Pest Alerts</span>
                <span className="p-1.5 rounded-lg bg-error-container text-on-error-container">
                  <Icon name="bug_report" className="text-base" />
                </span>
              </div>
              <div className="flex items-baseline gap-space-sm">
                <span className="font-metric-num text-metric-num text-error">3</span>
                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">Critical Threat</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">FAW whorl &amp; African Stemborer vectors detected</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
                <div className="bg-error h-1" style={{ width: "90%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold tracking-wider">CultivaVision Accuracy</span>
                <span className="p-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed-variant">
                  <Icon name="psychology" className="text-base" />
                </span>
              </div>
              <div className="flex items-baseline gap-space-sm">
                <span className="font-metric-num text-metric-num text-on-surface">94.2%</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center"><Icon name="verified" className="text-sm" /> Model v4.3</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Ground-truthed by OYSADEP diagnostic lab</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
                <div className="bg-secondary h-1" style={{ width: "94.2%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold tracking-wider">Avg. Extension Response</span>
                <span className="p-1.5 rounded-lg bg-secondary-container text-on-secondary-container">
                  <Icon name="timer" className="text-base" />
                </span>
              </div>
              <div className="flex items-baseline gap-space-sm">
                <span className="font-metric-num text-metric-num text-on-surface">4.0 <span className="font-headline-sm text-headline-sm font-normal text-on-surface-variant">Hours</span></span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Direct tie into Oyo State Extension Service</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
                <div className="bg-secondary-container h-1" style={{ width: "82%" }} />
              </div>
            </div>
          </div>
        )}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-lg flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-wrap items-center gap-space-sm flex-1">
            <div className="flex items-center bg-surface-container-low px-space-sm py-1.5 rounded-lg">
              <Icon name="filter_alt" className="text-secondary text-lg mr-1.5" />
              <span className="font-label-sm text-label-sm text-on-surface-variant mr-2">Plot:</span>
              <select defaultValue="All Fields (42.5 Ha)" className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer">
                <option>All Fields (42.5 Ha)</option>
                <option>Field 01 - Maize SAMMAZ-15 (18 Ha)</option>
                <option>Field 02 - Cassava TME-419 (12 Ha)</option>
                <option>Field 03 - Rice FARO-44 (8.5 Ha)</option>
                <option>Field 04 - Tatashe / Tomato (4 Ha)</option>
              </select>
            </div>
            <div className="flex items-center bg-surface-container-low px-space-sm py-1.5 rounded-lg">
              <Icon name="warning" className="text-error text-lg mr-1.5" />
              <span className="font-label-sm text-label-sm text-on-surface-variant mr-2">Severity:</span>
              <select defaultValue="All Severities" className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer">
                <option>All Severities</option>
                <option>Critical (Emergency)</option>
                <option>Warning (Precautionary)</option>
                <option>Observational / Mild</option>
              </select>
            </div>
            <div className="flex items-center bg-surface-container-low px-space-sm py-1.5 rounded-lg">
              <Icon name="category" className="text-secondary text-lg mr-1.5" />
              <span className="font-label-sm text-label-sm text-on-surface-variant mr-2">Category:</span>
              <select defaultValue="All Diagnoses" className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer">
                <option>All Diagnoses</option>
                <option>Pest &amp; Insect Attack</option>
                <option>Fungal / Bacterial Blight</option>
                <option>Nutrient Deficiency</option>
                <option>Moisture &amp; Heat Stress</option>
              </select>
            </div>
            <div className="flex items-center bg-surface-container-low px-space-sm py-1.5 rounded-lg">
              <Icon name="published_with_changes" className="text-secondary text-lg mr-1.5" />
              <span className="font-label-sm text-label-sm text-on-surface-variant mr-2">Status:</span>
              <select defaultValue="All Statuses" className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer">
                <option>All Statuses</option>
                <option>Open &amp; Pending Action (3)</option>
                <option>Agronomist Authorized (2)</option>
                <option>Treatment Underway (1)</option>
                <option>Resolved &amp; Closed (12)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-space-sm self-end lg:self-auto">
            <div className="flex items-center bg-surface-container p-1 rounded-lg">
              <button className="px-space-sm py-1 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm font-bold shadow-xs" type="button">Timeline</button>
              <button className="px-space-sm py-1 rounded text-on-surface-variant font-label-sm text-label-sm hover:text-on-surface" type="button">Urgency</button>
            </div>
            <button className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface" title="Refresh Telemetry" type="button">
              <Icon name="refresh" className="text-base" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
          {slot(
            slots,
            "feed",
            <div className="xl:col-span-7 flex flex-col gap-space-lg">
            <article className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden relative">
              <div className="h-1.5 bg-error w-full" />
              <div className="p-space-lg">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm pb-space-md">
                  <div>
                    <div className="flex items-center gap-space-xs mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error animate-pulse" /> CRITICAL INVASION</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">OBS #SC-2026-088</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Plot 01</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Spodoptera frugiperda (Fall Armyworm) Infestation</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Field 01 - Northern Savanna Ridge • Maize SAMMAZ-15 (Vegetative Stage V5)</p>
                  </div>
                  <div className="flex items-center gap-2 self-start bg-surface-container-low px-space-sm py-1 rounded-lg">
                    <Icon name="schedule" className="text-sm text-secondary" />
                    <span className="font-label-sm text-label-sm text-on-surface">Logged 3 hrs ago</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm p-space-sm bg-surface-container-low rounded-lg mb-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="person" className="text-secondary text-base" />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Observer</span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Tunde Balogun (Field Supv.)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <Icon name="my_location" className="text-secondary text-base" />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">RTK GPS Geolocation</span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">8.3248° N, 3.5831° E (±0.4m)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <Icon name="crop" className="text-secondary text-base" />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Affected Area</span>
                      <span className="font-label-md text-label-md text-error font-semibold">3.8 Ha of 18 Ha Plot</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md mb-space-md">
                  <div className="md:col-span-5 relative rounded-lg overflow-hidden bg-surface-container group">
                    <img className="w-full h-52 object-cover transition-transform group-hover:scale-105 duration-300" data-alt="High resolution macro agricultural photograph showing early vegetative maize plant whorl infested with Fall Armyworm caterpillars, visible windowpane leaf skeletonizing, wet sawdust-like fecal frass inside the central leaf funnel in bright tropical sunlight with green field background." src="/images/screens/ade44ca4d4e3.webp" alt="" loading="lazy" decoding="async" />
                    <div className="absolute inset-x-8 inset-y-6 pointer-events-none rounded bg-error/10">
                      <span className="absolute -top-3 left-2 bg-error text-on-error font-label-sm text-label-sm px-1.5 py-0.5 rounded shadow">Larval Frass &amp; Whorl Bore (94.6%)</span>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-primary-container/90 backdrop-blur-sm px-2 py-1 rounded text-on-primary font-label-sm text-label-sm flex items-center gap-1"><Icon name="camera_alt" className="text-xs" /> Camera Sensor: Sony IMX686 RTK</div>
                  </div>
                  <div className="md:col-span-7 bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Icon name="auto_awesome" className="text-secondary text-lg" />
                          <span className="font-label-md text-label-md font-bold text-primary">CultivaVision Multimodal AI</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">94.6% Confidence</span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface font-semibold mb-1">Diagnosis: Spodoptera frugiperda (Early 2nd/3rd Instar Stage)</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Classic &quot;windowpane&quot; foliar feeding accompanied by moist sawdust frass accumulation in leaf whorls. Rapid emergence triggered by rainfall gap after initial seed emergence.</p>
                      <div className="mt-3">
                        <div className="flex justify-between font-label-sm text-label-sm mb-1 text-on-surface-variant">
                          <span>Defoliation Index: <strong>24% of Canopy</strong></span>
                          <span className="text-error font-semibold">Economic Injury Level Exceeded</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                          <div className="h-full bg-error" style={{ width: "76%" }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 flex items-center justify-between bg-surface-container-lowest p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Icon name="verified_user" className="text-secondary text-lg" />
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm font-bold text-primary">Dr. F. Adeyemi, PhD</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">OYSADEP Reg. Ext-44091</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-bold">Verified &amp; Authorized</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg mb-space-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-md text-label-md font-bold text-primary flex items-center gap-1.5"><Icon name="medical_services" className="text-secondary text-lg" /> Prescribed Standard Intervention Protocol</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm">Targeted Axil Application</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm text-body-sm text-body-sm">
                    <div className="bg-surface-container-lowest p-space-sm rounded">
                      <span className="block font-label-sm text-label-sm text-on-surface-variant">Recommended Compound</span>
                      <span className="font-semibold text-on-surface">Emamectin Benzoate 5% SG</span>
                      <span className="block text-secondary font-label-sm text-label-sm mt-0.5">Rate: 250 g/Hectare</span>
                    </div>
                    <div className="bg-surface-container-lowest p-space-sm rounded">
                      <span className="block font-label-sm text-label-sm text-on-surface-variant">Application Window</span>
                      <span className="font-semibold text-error">Next 48 Hours Max</span>
                      <span className="block text-on-surface-variant font-label-sm text-label-sm mt-0.5">Before V7 collar tasseling</span>
                    </div>
                    <div className="bg-surface-container-lowest p-space-sm rounded">
                      <span className="block font-label-sm text-label-sm text-on-surface-variant">Ecology Safety Rule</span>
                      <span className="font-semibold text-primary">Direct Axil Drench Only</span>
                      <span className="block text-on-surface-variant font-label-sm text-label-sm mt-0.5">Protect predatory earwigs</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                    <Icon name="inventory_2" className="text-secondary text-base" />
                    <span>Central Chemical Store: <strong>1.25 kg Stock Available</strong></span>
                  </div>
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors" type="button">Issue Chemical Voucher</button>
                    <button className="px-space-md py-2 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors flex items-center gap-1" type="button"><Icon name="precision_manufacturing" className="text-base" /> Dispatch Syndicate Sprayer</button>
                    <button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors" type="button">Mark Treatment Initiated</button>
                  </div>
                </div>
              </div>
            </article>
            <article className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm mb-space-md">
                <div>
                  <div className="flex items-center gap-space-xs mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-tertiary-container font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary" /> WARNING: FUNGAL BLIGHT</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">OBS #SC-2026-082</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Plot 02</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Cercospora Leaf Spot &amp; Nitrogen Margin Leaching</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Field 02 - Cassava TME-419 (6 Months into Tubering) • Moderate lower-canopy senescence</p>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">Logged 18 hrs ago</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md mb-space-md">
                <div className="md:col-span-4 rounded-lg overflow-hidden bg-surface-container">
                  <img className="w-full h-36 object-cover" data-alt="Close up photograph of cassava foliage showing circular brown concentric fungal spots with chlorotic yellow borders on mature green leaves, agricultural field photography under soft diffused dawn lighting in West African savanna farm." src="/images/screens/0213c0eb6306.webp" alt="" loading="lazy" decoding="async" />
                </div>
                <div className="md:col-span-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">AI Diagnosis: Cercospora vicosae + N Deficiency</span>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">88.2% Accuracy</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">Concentric necrotic spots on lower canopy accompanied by interveinal chlorosis. Triggered by intense late-afternoon relative humidity (&gt;88%) and micro-nutrient leaching after torrential rain.</p>
                  </div>
                  <div className="p-2 rounded bg-surface-container-low flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface"><strong>Action:</strong> Copper Oxychloride foliar spray + Split K-N top dress</span>
                    <span className="text-secondary font-bold">Status: Agronomist Review Pending</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm"><Icon name="person_outline" className="text-sm" /> Scout: Biodun Oyetunji</div>
                <div className="flex items-center gap-2">
                  <button className="px-space-sm py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high" type="button">View Spectral History</button>
                  <button className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container" type="button">Approve Treatment Rx</button>
                </div>
              </div>
            </article>
            <article className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm mb-space-sm">
                <div>
                  <div className="flex items-center gap-space-xs mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1"><Icon name="check_circle" className="text-xs" /> RESOLVED &amp; CONTAINED</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">OBS #SC-2026-074</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Field 04</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Ralstonia solanacearum (Bacterial Wilt) on Tatashe/Rodo Nursery</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Field 04 - High-Tunnel Seedling Nursery • Immediate selective rogueing &amp; bio-fungicide drench</p>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">Resolved 2 days ago</span>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between font-body-sm text-body-sm">
                <span className="text-on-surface">Total rogueing of 42 infected tray plugs, applied Bacillus subtilis bio-agent, quarantined bed for 14 days. Zero cross-contamination in main greenhouse.</span>
                <Icon name="task_alt" className="text-secondary ml-4" />
              </div>
            </article>
          </div>
          )}
          <div className="xl:col-span-5 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
              <div className="flex items-center justify-between mb-space-sm">
                <div className="flex items-center gap-2">
                  <Icon name="satellite_alt" className="text-secondary" />
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Geospatial Hotspot Vector Map</h3>
                </div>
                <span className="font-label-sm text-label-sm text-secondary bg-surface-container-high px-2 py-0.5 rounded-full font-bold">Sentinel-2 Sync</span>
              </div>
              <div className="w-full h-64 rounded-lg relative overflow-hidden bg-cover bg-center shadow-inner flex flex-col justify-between p-space-sm" data-location="Oke-Ogun, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/a32ada27b9f9.webp')" }}>
                <div className="flex items-center justify-between w-full">
                  <div className="bg-surface-container-lowest/95 backdrop-blur-md px-2.5 py-1 rounded-md shadow-sm font-label-sm text-label-sm text-primary font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary" /> 42.5 Ha Active Telemetry</div>
                  <div className="bg-surface-container-lowest/95 backdrop-blur-md px-2 py-1 rounded-md shadow-sm font-label-sm text-label-sm text-on-surface flex items-center gap-1"><Icon name="layers" className="text-xs text-secondary" /> NDVI Layer Active</div>
                </div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute top-8 left-12 flex flex-col items-center group cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shadow-md animate-bounce">
                      <Icon name="bug_report" className="text-sm" />
                    </div>
                    <span className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-lowest text-error font-label-sm text-label-sm font-bold shadow">F-01: FAW (Critical)</span>
                  </div>
                  <div className="absolute bottom-10 right-20 flex flex-col items-center group cursor-pointer">
                    <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center shadow-md">
                      <Icon name="coronavirus" className="text-xs" />
                    </div>
                    <span className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-lowest text-tertiary font-label-sm text-label-sm font-bold shadow">F-02: Cercospora</span>
                  </div>
                  <div className="absolute top-12 right-10 flex flex-col items-center group cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md">
                      <Icon name="check" className="text-xs" />
                    </div>
                    <span className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-lowest text-secondary font-label-sm text-label-sm font-bold shadow">F-03: Optimal</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-lowest/90 backdrop-blur-md p-2 rounded-md flex items-center justify-between text-label-sm font-label-sm">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-error" /> Severe (FAW)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" /> Pathogen Warning</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Clean / Normal</span>
                </div>
              </div>
              <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon name="radar" className="text-error text-base" />
                    <span className="font-label-md text-label-md font-bold text-on-surface">Regional Pest Pressure Alert</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-error font-bold">HIGH RISK VECTOR</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">23 agrarian clusters in Saki West &amp; Iseyin LGA have reported aggressive Fall Armyworm emergence this week following the early bimodal rain surge.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-error" style={{ width: "82%" }} />
                  </div>
                  <span className="font-label-sm text-label-sm font-bold text-error">82/100 Index</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
              <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-lowest">
                <div className="flex items-center gap-2">
                  <Icon name="contact_phone" className="text-secondary" />
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Extension &amp; Expert Consultation</h3>
                </div>
                <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold"><span className="w-2 h-2 rounded-full bg-secondary" /> Online Now</span>
              </div>
              <div className="flex items-center gap-space-sm p-space-sm bg-surface-container-low rounded-lg mb-space-md">
                <img className="w-12 h-12 rounded-full object-cover" data-alt="Portrait photo of a distinguished Nigerian male agricultural extension officer wearing field safari vest and glasses in an experimental agricultural station setting with lush maize background." src="/images/screens/b51c57f3f307.webp" alt="" loading="lazy" decoding="async" />
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md font-bold text-on-surface">Dr. Fatai Adeyemi</span>
                    <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed-variant px-1.5 py-0.5 rounded font-semibold">OYSADEP Principal</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Senior Entomologist &amp; Oyo State Extension Lead</span>
                  <span className="font-label-sm text-label-sm text-secondary mt-0.5 flex items-center gap-1"><Icon name="verified" className="text-xs" /> Gov-TLS / WhatsApp Direct Linked</span>
                </div>
              </div>
              <div className="flex flex-col gap-space-sm">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Transmit Instant Query / Lab Sample Request</label>
                <div className="relative">
                  <textarea className="w-full p-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none placeholder:text-on-surface-variant resize-none" placeholder="Describe novel vectors, atypical foliar scorch, or request an emergency farm dispatch visit..." rows={3} />
                </div>
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm" type="button"><Icon name="attach_file" className="text-base" /> Attach Specimen Photo</button>
                  <div className="flex gap-space-xs">
                    <a className="px-space-sm py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold flex items-center gap-1" href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer"><Icon name="chat" className="text-sm" /> WhatsApp Desk</a>
                    <button className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container" type="button">Transmit Dossier</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md overflow-hidden relative">
              <div className="flex items-center gap-2 mb-space-sm">
                <Icon name="shield" className="text-tertiary" />
                <h3 className="font-headline-sm text-headline-sm text-tertiary font-bold">Pesticide &amp; PHI Statutory Compliance Guard</h3>
              </div>
              <div className="p-space-sm bg-surface-container-high rounded-lg mb-space-sm">
                <div className="flex items-start gap-2">
                  <Icon name="notification_important" className="text-tertiary text-lg mt-0.5" />
                  <div className="flex flex-col font-body-sm text-body-sm text-on-surface">
                    <span className="font-bold">Mandatory Pre-Harvest Interval (PHI): 14 Days</span>
                    <p className="text-on-surface-variant text-body-sm mt-0.5">If applying Emamectin Benzoate on Plot 01, green cob harvest or fodder grazing is strictly barred until <strong>April 18, 2026</strong>.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">Mandatory Spray Applicator PPE Checklist</span>
                <div className="grid grid-cols-2 gap-1.5 text-label-sm font-label-sm text-on-surface">
                  <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded">
                    <Icon name="check_box" className="text-secondary text-base" />
                    <span>N95 Chemical Respirator</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded">
                    <Icon name="check_box" className="text-secondary text-base" />
                    <span>Nitrile Gauntlets</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded">
                    <Icon name="check_box" className="text-secondary text-base" />
                    <span>Full Face Visor Mask</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded">
                    <Icon name="check_box" className="text-secondary text-base" />
                    <span>Impermeable Coverall</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-sm pt-space-xs flex items-center justify-between text-label-sm font-label-sm text-error">
                <span className="flex items-center gap-1"><Icon name="block" className="text-sm" /> Zero Organophosphates (NAFDAC Restricted)</span>
                <span className="font-semibold underline cursor-pointer">Protocol PDF §9</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
