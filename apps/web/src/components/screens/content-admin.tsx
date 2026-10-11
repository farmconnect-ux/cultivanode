// Ported from the "content_knowledge_administration" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";

export type ContentAdminSlot = "hero";

export function ContentAdmin({ slots }: ScreenProps<ContentAdminSlot>) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg pb-space-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
              <span className="hover:text-primary transition-colors cursor-pointer">Platform Administration</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="hover:text-primary transition-colors cursor-pointer">Knowledge &amp; Agronomy Standards</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="text-primary font-bold">Content &amp; Knowledge Administration (§11.5)</span>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Agronomic Revision Engine Active (v2.8.4-rc2)</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-container/20 text-on-primary-container font-label-sm text-label-sm font-semibold"><Icon name="verified" className="text-[14px] text-secondary" /> 15 Pilot Crops Ground-Truth Verified</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">SHA-256 Engine: <code className="font-mono text-[10px] text-primary">#9b82..f04e</code></span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container transition-all shadow-sm" type="button">
              <Icon name="add_circle" className="text-[18px]" />
              <span>New Standard Draft</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container transition-all shadow-sm" type="button">
              <Icon name="file_download" className="text-[18px]" />
              <span>Export Package (JSON/YAML)</span>
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-sm" type="button">
              <Icon name="publish" className="text-[18px]" />
              <span>Publish Approved Revisions</span>
            </button>
          </div>
        </div>
        {slot(slots, "hero", (
          <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="max-w-3xl flex flex-col gap-space-xs">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Content &amp; Knowledge Administration</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Curate, calibrate, and version agronomic phenology templates, crop standards, NAFDAC-approved input formulations, veterinary protocols, and multilingual translations across South-West Nigeria agro-ecological zones.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-surface-container-low p-2.5 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                  <Icon name="science" className="text-[24px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Ecosystem Governance</span>
                  <span className="font-label-md text-label-md text-primary font-bold">NCRI · NIHORT · IITA Calibrated</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Phenology Templates</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="potted_plant" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">15 Active</span>
              <span className="text-xs text-secondary font-semibold ml-1">Crops</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="truncate">8 Field/Staple, 7 Vegetables</span>
              <span className="text-[11px] text-outline font-mono">42 Calibrated Stages (SW Belts)</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Agronomic Standards</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="verified_user" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">38 Rulesets</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="text-secondary font-medium">100% Peer-Reviewed</span>
              <span className="text-[11px] text-outline truncate">IITA, NIHORT &amp; NCRI Citations</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Agrochemical Index</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="vaccines" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">164 Certified</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="text-secondary font-medium">NAFDAC Verified Registry</span>
              <span className="text-[11px] text-outline">0 Banned Actives · Strict PHI/REI</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Multilingual Strings</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="translate" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">4,820</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="text-secondary font-medium">99.4% Yorùbá Verified</span>
              <span className="text-[11px] text-outline">92.1% Pidgin Audio Prompts</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">AI Grounding Vector Base</span>
              <span className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary">
                <Icon name="psychology" className="text-[18px]" />
              </span>
            </div>
            <div className="my-space-xs">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">1,280 Q&amp;As</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="text-secondary font-medium">80% Agronomist Precision</span>
              <span className="text-[11px] text-outline">0 Unapproved Chem Prescriptions</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col">
          <div className="p-space-lg bg-surface-container-low/70 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm uppercase">Active Spec v3.2</span>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Maize (Zea mays) — Derived Savanna (Oke-Ogun / Oyo North) Early-Rains Standard v3.2</h2>
              </div>
              <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2 flex-wrap pt-0.5">
                <span><strong className="text-on-surface">Principal Reviewer:</strong> Dr. Quadri Olapade (Lead Agronomist)</span>
                <span>·</span>
                <span><strong className="text-on-surface">Authority:</strong> IITA Maize Improvement Program &amp; NIHORT Joint Advisory</span>
                <span>·</span>
                <span><strong className="text-secondary font-semibold">Effective Cycle:</strong> Early Rains 2026</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container shadow-sm flex items-center gap-1.5" type="button">
                <Icon name="history" className="text-[16px]" />
                <span>Rollback Diff</span>
              </button>
              <button className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm flex items-center gap-1.5" type="button">
                <Icon name="save" className="text-[16px]" />
                <span>Save Stage Matrix</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 px-space-lg bg-surface-container-low border-b-0 overflow-x-auto text-on-surface-variant">
            <button className="px-4 py-3 font-label-md text-label-md font-bold text-primary border-b-2 border-primary bg-surface-container-lowest rounded-t-lg flex items-center gap-1.5" type="button">
              <Icon name="timeline" className="text-[18px]" />
              <span>Phenology &amp; Stages (6)</span>
            </button>
            <button className="px-4 py-3 font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
              <Icon name="water_drop" className="text-[18px]" />
              <span>Nutrient &amp; Fertilizer Split</span>
            </button>
            <button className="px-4 py-3 font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
              <Icon name="pest_control" className="text-[18px]" />
              <span>Spray &amp; Crop Protection</span>
            </button>
            <button className="px-4 py-3 font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
              <Icon name="language" className="text-[18px]" />
              <span>Yorùbá Localization</span>
            </button>
            <button className="px-4 py-3 font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
              <Icon name="manage_history" className="text-[18px]" />
              <span>Audit History</span>
            </button>
          </div>
          <div className="mx-space-lg mt-space-md p-space-sm rounded-lg bg-surface-container-high/60 flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                <Icon name="shield" className="text-[14px]" />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface"><strong className="font-semibold text-primary">Safety Enforcement Active:</strong> Custom standards exceeding 2x recommended Nitrogen (&gt;240 kg N/Ha) or applying unregistered neonicotinoid pesticides trigger mandatory agronomist escalation.</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-secondary-container text-on-secondary-container font-semibold whitespace-nowrap">RULE-SAFE-771 ON</span>
          </div>
          <div className="p-space-lg overflow-x-auto">
            <div className="flex flex-col gap-space-sm">
              <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex flex-col items-center justify-center shrink-0">
                    <span className="font-label-sm text-label-sm font-bold leading-none">01</span>
                    <span className="text-[9px] uppercase font-mono mt-0.5">Prep</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 1: Land Prep &amp; Basal Dressing</h3>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days -14 to 0</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Deep plowing (25–30 cm target depth), harrow to friable tilth. Apply basal <strong className="text-on-surface">NPK 15-15-15 at 200 kg/Ha (4 bags)</strong> thoroughly banded. Apply pre-emergence <strong className="text-on-surface">Atrazine 500 SC @ 3.0 L/Ha</strong> within 24h of moist planting.</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                      <span>Moisture Min: <strong>60% Field Cap</strong></span>
                      <span>·</span>
                      <span>Herbicide: <strong>Atrazine 500 SC</strong></span>
                      <span>·</span>
                      <span>Labor: <strong>Tractor Rig / Knapsack</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Validated IITA</span>
                  <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_LP_01</span>
                </div>
              </div>
              <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex flex-col items-center justify-center shrink-0">
                    <span className="font-label-sm text-label-sm font-bold leading-none">02</span>
                    <span className="text-[9px] uppercase font-mono mt-0.5">V3-V4</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 2: Emergence &amp; Vegetative V3-V4</h3>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 7 to 21</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Gap filling &amp; thinning to single seedling per stand (target 53,333 plants/Ha). First top-dress with <strong className="text-on-surface">Urea (46% N) at 100 kg/Ha</strong> side-dressed 5-8 cm away from stalk. Initiate early Fall Armyworm monitoring threshold (&gt;5% leaf windowing damage).</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                      <span>Pest Alert: <strong>Spodoptera frugiperda</strong></span>
                      <span>·</span>
                      <span>N split: <strong>46 kg N/Ha</strong></span>
                      <span>·</span>
                      <span>Bio-Scouting: <strong>Twice Weekly</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Field Verified</span>
                  <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_VG_02</span>
                </div>
              </div>
              <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex flex-col items-center justify-center shrink-0">
                    <span className="font-label-sm text-label-sm font-bold leading-none">03</span>
                    <span className="text-[9px] uppercase font-mono mt-0.5">V6-V8</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 3: Rapid Vegetative &amp; Knee-High V6-V8</h3>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 28 to 42</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Second split application of <strong className="text-on-surface">Urea at 50 kg/Ha</strong> prior to canopy closure. Selective post-emergence broadleaf and annual grass control with <strong className="text-on-surface">Nicosulfuron + 2,4-D amine</strong> directed spray if weed density &gt;15%.</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                      <span>Canopy Closure: <strong>Expected D38</strong></span>
                      <span>·</span>
                      <span>Herbicide: <strong>Nicosulfuron (Selective)</strong></span>
                      <span>·</span>
                      <span>Ear Formation Prep</span>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Field Verified</span>
                  <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_VG_03</span>
                </div>
              </div>
              <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex flex-col items-center justify-center shrink-0">
                    <span className="font-label-sm text-label-sm font-bold leading-none">04</span>
                    <span className="text-[9px] uppercase font-mono mt-0.5">R1</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 4: Tasseling &amp; Silking R1</h3>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 50 to 65</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Moisture stress critical period. Prevent water stress at all costs to avert ovule abortion. Prophylactic fungicide application of <strong className="text-on-surface">Azoxystrobin + Difenoconazole</strong> if relative humidity &gt;85% to halt Southern Corn Leaf Blight (Bipolaris maydis).</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                      <span>Critical Moisture: <strong>High Sensitivity</strong></span>
                      <span>·</span>
                      <span>Fungicide: <strong>Azoxystrobin Mix</strong></span>
                      <span>·</span>
                      <span>Tassel Pollen Window: <strong>5-7 Days</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Strict Guardrail</span>
                  <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_RP_04</span>
                </div>
              </div>
              <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest text-primary flex flex-col items-center justify-center shrink-0">
                    <span className="font-label-sm text-label-sm font-bold leading-none">05</span>
                    <span className="text-[9px] uppercase font-mono mt-0.5">R4-R5</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 5: Grain Filling &amp; Dent R4-R5</h3>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 70 to 95</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Dough stage progressing to dent line migration. All systemic pesticide applications terminate. <strong className="text-on-surface">Pre-Harvest Interval (PHI) strictly enforced 28 days</strong> before manual cob snapping or mechanical combine operations.</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                      <span>Pesticide Ban: <strong>Active PHI Window</strong></span>
                      <span>·</span>
                      <span>Kernel Milk Line: <strong>50% Check</strong></span>
                      <span>·</span>
                      <span>Lodging Surveillance</span>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-1 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-semibold">Zero Chem Spray</span>
                  <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_RP_05</span>
                </div>
              </div>
              <div className="p-space-md rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex flex-col items-center justify-center shrink-0">
                    <span className="font-label-sm text-label-sm font-bold leading-none">06</span>
                    <span className="text-[9px] uppercase font-mono mt-0.5">R6</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Stage 6: Physiological Maturity &amp; Harvest R6</h3>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-label-sm font-semibold">Days 105 to 120</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Black layer visible at base of kernel indicating physiological maturity. Target kernel field moisture <strong className="text-on-surface">14–15%</strong> before sheller threshing. Expected savanna yield benchmark: <strong className="text-on-surface">4.2 – 6.5 MT/Ha</strong> with certified SAMMAZ hybrid seed.</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant">
                      <span>Moisture Goal: <strong>14.0% Max</strong></span>
                      <span>·</span>
                      <span>Expected Yield: <strong>4.2-6.5 MT/Ha</strong></span>
                      <span>·</span>
                      <span>Aflatoxin Control Protocol</span>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold">Final Standard</span>
                  <span className="text-[11px] text-outline font-mono">Telemetry Key: #PHEN_HV_06</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-headline-md text-headline-md text-primary font-bold">NAFDAC Certified Input Registry &amp; Safety Formulations</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live repository of certified agronomic compounds, pre-harvest safety thresholds, and operator re-entry parameters for South-West Nigeria field operations.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                <input className="w-full h-8 pl-8 pr-3 rounded bg-surface text-on-surface text-body-sm focus:outline-none" placeholder="Filter by active, NAFDAC, brand..." type="text" />
              </div>
              <button className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-1" type="button">
                <Icon name="add" className="text-[16px]" />
                <span>Add Agrochemical</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-2.5 px-3">Formulation &amp; Trade Name</th>
                  <th className="py-2.5 px-3">NAFDAC Reg No.</th>
                  <th className="py-2.5 px-3">Manufacturer / Formulator</th>
                  <th className="py-2.5 px-3">Active Composition</th>
                  <th className="py-2.5 px-3">Prescribed Rate</th>
                  <th className="py-2.5 px-3">REI / PHI Interval</th>
                  <th className="py-2.5 px-3">Toxicity Class</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">NPK 15:15:15 (Golden Fertilizer)</span>
                      <span className="text-xs text-on-surface-variant">Granular Inorganic Fertilizer</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold">A5-0182</td>
                  <td className="py-3 px-3">Notore Chemical Ind. Plc</td>
                  <td className="py-3 px-3 font-mono text-xs">N:15% · P₂O₅:15% · K₂O:15%</td>
                  <td className="py-3 px-3 font-medium">200 kg / Ha (Basal)</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[11px] font-mono">REI: Immediate</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary"><span className="w-2 h-2 rounded-full bg-secondary" /> Non-Toxic (Fertilizer)</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Approved</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Emamectin Benzoate 5% SG</span>
                      <span className="text-xs text-on-surface-variant">Soluble Granule Insecticide</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold">B2-9014</td>
                  <td className="py-3 px-3">Syngenta Crop Protection Ltd</td>
                  <td className="py-3 px-3 font-mono text-xs">Emamectin benzoate 50g/kg</td>
                  <td className="py-3 px-3 font-medium">250 g / Ha (Foliar)</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5 text-[11px] font-mono">
                      <span className="text-primary font-semibold">REI: 24 Hours</span>
                      <span className="text-on-surface-variant">PHI: 14 Days</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-tertiary-container"><span className="w-2 h-2 rounded-full bg-on-tertiary-container" /> Class III (Caution - Blue)</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Approved</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Atrazine 500 SC</span>
                      <span className="text-xs text-on-surface-variant">Selective Pre-Emergence Herbicide</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold">A4-1189</td>
                  <td className="py-3 px-3">Jubaili Agrotec Nigeria</td>
                  <td className="py-3 px-3 font-mono text-xs">Atrazine 500 g/L (Triazine)</td>
                  <td className="py-3 px-3 font-medium">3.0 L / Ha</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5 text-[11px] font-mono">
                      <span className="text-primary font-semibold">REI: 48 Hours</span>
                      <span className="text-on-surface-variant">PHI: 60 Days</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-tertiary-container"><span className="w-2 h-2 rounded-full bg-on-tertiary-container" /> Class II (Warning - Yellow)</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Approved</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Lambda-Cyhalothrin 2.5% EC</span>
                      <span className="text-xs text-on-surface-variant">Pyrethroid Contact &amp; Stomach Action</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-semibold">A7-2291</td>
                  <td className="py-3 px-3">Dizengoff W.A. Nigeria Ltd</td>
                  <td className="py-3 px-3 font-mono text-xs">Lambda-cyhalothrin 25 g/L</td>
                  <td className="py-3 px-3 font-medium">1.0 L / Ha (Knapsack)</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5 text-[11px] font-mono">
                      <span className="text-primary font-semibold">REI: 48 Hours</span>
                      <span className="text-error font-bold">PHI: 21 Days</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-error"><span className="w-2 h-2 rounded-full bg-error" /> Class II (Moderately Haz.)</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">Restricted Sprayer</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          <div className="lg:col-span-7 rounded-xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col justify-between">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="record_voice_over" className="text-[20px]" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Agronomic Extension Localization Dictionary</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Yorùbá &amp; Pidgin phonetics for farmer advisory SMS &amp; audio IVR broadcasts.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">99.4% Verified</span>
              </div>
              <div className="flex flex-col gap-space-sm mt-space-xs">
                <div className="p-3 rounded-lg bg-surface flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-bold">Fall Armyworm (Spodoptera frugiperda)</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] text-on-surface-variant uppercase font-mono">Pest</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1 text-primary">
                      <span className="text-xs font-bold font-mono text-outline">YOR:</span>
                      <span className="font-body-md text-body-md font-semibold">Kòkòrò Apẹẹrẹ / Kòkòrò Abanijẹ Àgbàdo</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">Scouting prompt: Ṣayẹwo àwọn ewé tó ní iho tàbí ìdọ̀tí kòkòrò lórí rẹ̀.</p>
                  </div>
                  <button className="shrink-0 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary transition-colors flex items-center gap-1 text-xs font-semibold" title="Listen to 12s voice guidance" type="button">
                    <Icon name="volume_up" className="text-[16px]" />
                    <span>12s</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-surface flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-bold">Split Fertilizer Dressing</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] text-on-surface-variant uppercase font-mono">Fertility</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1 text-primary">
                      <span className="text-xs font-bold font-mono text-outline">YOR:</span>
                      <span className="font-body-md text-body-md font-semibold">Ìdáṣe Ajílẹ̀ sí Ìpele Kejì (Gbígbẹ Ajílẹ̀ lẹ́gbẹ̀ẹ́)</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">Application prompt: Má ṣe da ajílẹ̀ sí orí ewé, gbé e sí ẹ̀gbẹ́ gbòǹgbò ní ìwọ̀n ìka méjì.</p>
                  </div>
                  <button className="shrink-0 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary transition-colors flex items-center gap-1 text-xs font-semibold" title="Listen to audio prompt" type="button">
                    <Icon name="volume_up" className="text-[16px]" />
                    <span>Audio</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-surface flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-bold">Pre-Harvest Interval (PHI)</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] text-on-surface-variant uppercase font-mono">Safety</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1 text-primary">
                      <span className="text-xs font-bold font-mono text-outline">YOR:</span>
                      <span className="font-body-md text-body-md font-semibold">Àkókò Ìdúró Kí a Tó Kórè (Àkókò Ẹ̀jẹ̀ Oògùn)</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">Safety notice: Ẹ̀jẹ̀ oògùn gbọ́dọ̀ tán kí ènìyàn tó kórè tàbí jẹ oúnjẹ náà.</p>
                  </div>
                  <button className="shrink-0 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary transition-colors flex items-center gap-1 text-xs font-semibold" title="Listen to audio prompt" type="button">
                    <Icon name="volume_up" className="text-[16px]" />
                    <span>Audio</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-surface flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-bold">Soil Moisture Deficit</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] text-on-surface-variant uppercase font-mono">Weather</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1 text-primary">
                      <span className="text-xs font-bold font-mono text-outline">YOR:</span>
                      <span className="font-body-md text-body-md font-semibold">Àìtó Omi Nínú Ilẹ̀ Ní Àkókò Ìtànná</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">Drought caution: Bí ilẹ̀ bá gbẹ ní àkókò ìtànná, àgbàdo kò ní kún dáadáa.</p>
                  </div>
                  <button className="shrink-0 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary transition-colors flex items-center gap-1 text-xs font-semibold" title="Listen to audio prompt" type="button">
                    <Icon name="volume_up" className="text-[16px]" />
                    <span>Audio</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-space-md flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-mono">Audio Repository: 4,440 WAV (16kHz AMR-WB Format)</span>
              <button className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5" type="button">
                <span>Manage Translation Studio</span>
                <Icon name="arrow_forward" className="text-[14px]" />
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="rounded-xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Standard Review Queue</h3>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">2 Pending</span>
              </div>
              <div className="flex flex-col gap-space-xs mt-1">
                <div className="p-3 rounded-lg bg-surface flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-primary font-bold">#STD-MZE-02</span>
                      <h4 className="font-label-md text-label-md text-on-surface font-semibold">Tomato Dry-Season Staking Protocol</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm whitespace-nowrap">In Review</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Submitted by <strong className="text-on-surface">Dr. K. Alabi</strong> · Under technical appraisal by NIHORT Vegetable Specialist.</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary text-xs font-semibold hover:bg-surface-container shadow-sm" type="button">Review Diff</button>
                    <button className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container shadow-sm" type="button">Approve</button>
                    <button className="px-2.5 py-1 rounded bg-error-container text-on-error-container text-xs font-semibold hover:bg-error/20" type="button">Reject</button>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-secondary font-bold">#STD-CAS-08</span>
                      <h4 className="font-label-md text-label-md text-on-surface font-semibold">Cassava Stems Pro-Vitamin A TME-419 Quality Standard</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm whitespace-nowrap font-semibold">Published v2.1</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Approved by NCRI Roots &amp; Tubers Division. Active in Oyo and Osun field clusters.</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm flex-1 justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon name="verified" className="text-primary text-[18px]" />
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Immutable Content Audit Log</h3>
                  </div>
                  <span className="text-[11px] font-mono text-secondary font-semibold">FIDO2 WebAuthn</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Cryptographic SHA-256 chain verifying all agronomic revisions.</p>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="p-2.5 rounded bg-surface text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between font-mono text-[10px] text-outline">
                    <span>SHA: 4a2d8e..1f89</span>
                    <span>12:44 PM · Today</span>
                  </div>
                  <div className="text-on-surface font-medium">Dr. Quadri Olapade updated <strong className="text-primary font-semibold">Stage 4 Fungicide Dosage</strong> on Maize v3.2</div>
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                    <span className="text-secondary font-semibold">Signature: ECDSA Valid</span>
                    <span>·</span>
                    <span>Station: Iseyin Central Hub</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-surface text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between font-mono text-[10px] text-outline">
                    <span>SHA: c081b2..ef54</span>
                    <span>Yesterday · 16:10</span>
                  </div>
                  <div className="text-on-surface font-medium">System Engine approved <strong className="text-primary font-semibold">NAFDAC Registry Sync</strong> (+3 Fungicides)</div>
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                    <span className="text-secondary font-semibold">Signature: System Keystore</span>
                    <span>·</span>
                    <span>Verified API Sync</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-outline font-mono flex items-center justify-between">
                <span>Ledger Height: <strong>#8,941 blocks</strong></span>
                <span className="text-primary hover:underline cursor-pointer">Verify Chain Proof</span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm text-on-surface-variant text-body-sm">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
              <Icon name="gavel" className="text-[18px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">Nigeria Data Protection Act (NDPA 2023) &amp; Scientific Integrity Compliance</span>
              <span className="text-xs">All agronomic algorithms adhere to Federal Ministry of Agriculture and Food Security (FMAFS) registered practices.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-semibold">ISO 19115 Geospatial Metadata</span>
            <span className="px-2.5 py-1 rounded bg-surface-container text-secondary font-semibold">Zero Hallucination Protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
}
