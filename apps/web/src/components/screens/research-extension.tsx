// Ported from the "research_extension_10.5" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function ResearchExtension(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="px-space-md lg:px-space-xl py-space-lg space-y-space-lg max-w-[1680px] mx-auto w-full">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
            <div className="space-y-1">
              <div className="flex items-center gap-space-xs text-on-surface-variant">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">Research Portal §10.5 &amp; §22</span>
                <span>•</span>
                <span className="font-body-sm text-body-sm">Field Trials, Phenotyping &amp; Advisory Desk</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Agricultural Research &amp; Extension Operations</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">Coordinated phenology protocols with <strong>IITA Ibadan</strong>, <strong>NIHORT</strong>, <strong>NCRI Badeggi</strong>, <strong>OAU Ile-Ife</strong> &amp; <strong>Oyo/Ogun ADP Extension Networks</strong>.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs self-start xl:self-auto">
              <button className="inline-flex items-center gap-space-xs px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all" type="button">
                <Icon name="cloud_download" className="text-[18px] text-secondary" />
                <span>Raw Phenology CSV</span>
              </button>
              <button className="inline-flex items-center gap-space-xs px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all" type="button">
                <Icon name="science" className="text-[18px] text-secondary" />
                <span>New Experimental Protocol</span>
              </button>
              <button className="inline-flex items-center gap-space-xs px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md shadow-sm transition-all" type="button">
                <Icon name="broadcast_on_personal" className="text-[18px]" />
                <span>Dispatch Extension Alert</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Federated Protocol</div>
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate">CGIAR Open Data Protocol Compliant</div>
              </div>
              <Icon name="verified" className="text-secondary text-[20px]" />
            </div>
            <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Data Governance</div>
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate">Farmer Consent: 100% Signed NDPA 2023</div>
              </div>
              <Icon name="lock_person" className="text-secondary text-[20px]" />
            </div>
            <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Field Status</div>
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate">Active Phenology Cycle: 2026 Early Rains</div>
              </div>
              <Icon name="calendar_view_week" className="text-secondary text-[20px]" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-sm">
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Controlled Trials</span>
                <Icon name="biotech" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">34</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">18 Agro-Microclimates</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary"><Icon name="terrain" className="text-[14px]" /> Savanna vs Rainforest</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Trial Hectarage</span>
                <Icon name="grid_goldenratio" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">420 ha</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">142 Host Pilot Farms</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface"><Icon name="domain_verification" className="text-[14px] text-secondary" /> Geo-Fenced &amp; Soil-Tagged</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Germplasm Lines</span>
                <Icon name="psychology_alt" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">16 Lines</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">SAMMAZ-62, TMS, Faro-67</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary"><Icon name="water_drop" className="text-[14px]" /> Drought &amp; CMD Resistant</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Extension SLA</span>
                <Icon name="support_agent" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">1.6 Days</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">124 Agents In Field</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary"><Icon name="trending_down" className="text-[14px]" /> -0.4d vs Target Benchmark</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Production SOPs</span>
                <Icon name="menu_book" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">48 SOPs</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Peer-Reviewed v2.4</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface"><Icon name="fact_check" className="text-[14px] text-secondary" /> Published to Field App</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Data Integrity</span>
                <Icon name="hub" className="text-primary text-[20px]" />
              </div>
              <div className="my-2">
                <div className="font-metric-num text-metric-num text-primary">98.7%</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Drone / Telemetry Match</div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary"><Icon name="done_all" className="text-[14px]" /> 0 Missing Weather Vars</div>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
            <div className="xl:col-span-8 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-lg bg-surface-container-lowest shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Panel A</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface-variant">Randomized Complete Block Designs</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Active Research Trials &amp; Varietal Phenotyping</h2>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Filter Zone:</span>
                    <button className="px-2.5 py-1 rounded-lg text-label-sm font-label-sm bg-primary text-on-primary" type="button">All (34)</button>
                    <button className="px-2.5 py-1 rounded-lg text-label-sm font-label-sm bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">Savanna</button>
                    <button className="px-2.5 py-1 rounded-lg text-label-sm font-label-sm bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">Rainforest</button>
                  </div>
                </div>
                <div className="space-y-space-md mt-space-sm">
                  <div className="p-space-md rounded-lg bg-surface-container-low transition-all hover:bg-surface-container/70">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-sm pb-space-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary/10 text-secondary uppercase">TRL-2026-MZ-04</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Saki West LGA, Oke-Ogun Savanna Belt</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">SAMMAZ-62 Drought Tolerance &amp; Nitrogen-Use Efficiency Trial</h3>
                        <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Host: Oke-Ogun Maize Seed Outgrower Syndicate • Block Setup: 4x Replications (RBD 4x)</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm font-semibold bg-secondary-fixed/50 text-on-secondary-fixed-variant"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Canopy Vigour Optimal</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm py-2">
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Soil NPK Baseline</div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">14:10:18 • pH 6.2</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Mean Canopy NDVI</div>
                        <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">0.78 (Sentinel-2 Sync)</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Water Deficit Index</div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">-8.4% (Tolerant band)</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Projected Yield vs Control</div>
                        <div className="font-label-md text-label-md text-secondary font-bold mt-0.5">+32% (+1.8 t/ha)</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-body-sm text-on-surface-variant pt-2 text-xs gap-2">
                      <div><strong className="text-on-surface">Protocols:</strong> Split Urea Application (DAP + 30 DAS) vs Micro-dosing @ 12kg/ha • Drone pass every 7 days.</div>
                      <button className="inline-flex items-center gap-1 text-secondary font-semibold hover:underline" type="button">View Block Layout <Icon name="arrow_forward" className="text-[14px]" /></button>
                    </div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low transition-all hover:bg-surface-container/70">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-sm pb-space-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary/10 text-secondary uppercase">TRL-2026-CS-11</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Ikenne Pilot Station, Ogun Agro-Climatic Zone</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">Cassava Mosaic Disease (CMD) Resistance: TME-419 vs NextGen TMS-01/1371</h3>
                        <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">IITA Breeding Unit in collaboration with Ogun State ADP • 18 Hectares monitored</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm font-semibold bg-secondary-fixed/50 text-on-secondary-fixed-variant"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Zero Whitefly Vector Outbreak</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm py-2">
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Whitefly Pressure</div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">1.2 flies/plant (Low)</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Canopy Biomass Index</div>
                        <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">0.82 (High leaf density)</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Root Starch Estimate</div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">26.8% Dry Matter</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Yield Delta Projected</div>
                        <div className="font-label-md text-label-md text-secondary font-bold mt-0.5">+24.5 t/ha (+28%)</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-body-sm text-on-surface-variant pt-2 text-xs gap-2">
                      <div><strong className="text-on-surface">Protocols:</strong> Strict disease index scoring at 3, 6, and 9 months • Bio-fortification test for Provitamin A content.</div>
                      <button className="inline-flex items-center gap-1 text-secondary font-semibold hover:underline" type="button">View Phenotypic Data <Icon name="arrow_forward" className="text-[14px]" /></button>
                    </div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low transition-all hover:bg-surface-container/70">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-sm pb-space-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-tertiary-container/20 text-tertiary-fixed-dim uppercase">TRL-2026-BIO-09</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Ilora Farm Settlement, Oyo Central</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">Biocontrol of Fall Armyworm (FAW) via Trichogramma Wasps &amp; Neem</h3>
                        <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Lead Researcher: Dr. K. Adebayo (NIHORT / OAU Entomological Cluster)</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm font-semibold bg-tertiary-fixed text-on-tertiary-fixed"><span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed" /> 2nd Release Phase Active</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm py-2">
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Egg Parasitism Rate</div>
                        <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">71.4% Reached</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Larval Folio Damage</div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">&lt; 4.2% of Whorls</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Synthetic Spray Reduct.</div>
                        <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">-85% Chemical Inputs</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Net Margin Adv.</div>
                        <div className="font-label-md text-label-md text-secondary font-bold mt-0.5">+₦74,000 / ha</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-body-sm text-on-surface-variant pt-2 text-xs gap-2">
                      <div><strong className="text-on-surface">Protocols:</strong> Parasitoid wasp card placement every 10 meters • Weekly scout counts across 60 sampling quadrants.</div>
                      <button className="inline-flex items-center gap-1 text-secondary font-semibold hover:underline" type="button">Entomology Counts <Icon name="arrow_forward" className="text-[14px]" /></button>
                    </div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low transition-all hover:bg-surface-container/70">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-sm pb-space-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary/10 text-secondary uppercase">TRL-2026-RC-02</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Mokoloki Lowland Basins, Ogun State</span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">Lowland Rice System of Rice Intensification (SRI) Water-Saving Trial (Faro-67)</h3>
                        <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Partner: NCRI Badeggi &amp; Ogun-Oshun River Basin Development Authority</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm font-semibold bg-surface-container-highest text-on-surface"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Tillering Evaluation</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm py-2">
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Irrigation Water Savings</div>
                        <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">38% Less Inflow</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Effective Tillers/Hill</div>
                        <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">42 (vs 16 Conventional)</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Seed Rate Utilization</div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">8 kg/ha (80% drop)</div>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Target Yield Projection</div>
                        <div className="font-label-md text-label-md text-secondary font-bold mt-0.5">6.8 t/ha (+44%)</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-body-sm text-on-surface-variant pt-2 text-xs gap-2">
                      <div><strong className="text-on-surface">Protocols:</strong> Alternate wetting &amp; drying (AWD) sensor monitoring • Single seedling transplanting at 10 days age.</div>
                      <button className="inline-flex items-center gap-1 text-secondary font-semibold hover:underline" type="button">Hydrology &amp; Water Logs <Icon name="arrow_forward" className="text-[14px]" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="xl:col-span-4 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-lg bg-surface-container-lowest shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between pb-space-md">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Panel B</span>
                      <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                    </div>
                    <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight">Scouting &amp; Pathogen Stream</h2>
                  </div>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold">5 Tickets Pending</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">Live diagnostic queue from ADP scouts &amp; farmers awaiting validation by lead institutional phytopathologists.</p>
                <div className="space-y-space-md flex-1">
                  <div className="p-space-sm rounded-lg bg-surface-container-low space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-error">Critical Pathogen Alert</span>
                        <div className="font-label-md text-label-md text-on-surface font-bold">Fall Armyworm (Spodoptera frugiperda)</div>
                        <div className="text-xs text-on-surface-variant">Plot #42, Ido LGA • Oyo State</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface">88% AI Conf.</span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden h-28 bg-surface-container">
                      <img className="w-full h-full object-cover" data-alt="Close-up field macro photography of green maize leaf whorls showing fresh feeding damage, frass, and a small cream-and-brown striped fall armyworm caterpillar on a humid morning in Western Nigeria, shot in sharp natural light with deep green botanical tones" src="/images/screens/d171d98f757c.webp" alt="" loading="lazy" decoding="async" />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary/80 text-[10px] text-on-primary font-mono">GEO: 7.502°N, 3.821°E</div>
                    </div>
                    <div className="text-xs bg-surface-container-lowest p-2 rounded"><span className="font-semibold text-on-surface">Curative Protocol:</span> Emamectin Benzoate 5% SG application @ 4g per 15L backpack knapsack during early dusk.</div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-primary">
                        <input defaultChecked className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                        <span>Validated by Dr. Adebayo</span>
                      </label>
                      <button className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container" type="button">Approve Advisory</button>
                    </div>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Diagnostic Review</span>
                        <div className="font-label-md text-label-md text-on-surface font-bold">Cassava Bacterial Blight (Xanthomonas)</div>
                        <div className="text-xs text-on-surface-variant">Obafemi Owode LGA • Ogun State</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface">94% AI Conf.</span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden h-28 bg-surface-container">
                      <img className="w-full h-full object-cover" data-alt="Agricultural laboratory field diagnostic photography showing angular water-soaked leaf spots and yellowing blight on green cassava foliage in Ogun State Nigeria, scientific sharp focus high clarity" src="/images/screens/6cd7a5057c75.webp" alt="" loading="lazy" decoding="async" />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary/80 text-[10px] text-on-primary font-mono">GEO: 6.953°N, 3.511°E</div>
                    </div>
                    <div className="text-xs bg-surface-container-lowest p-2 rounded"><span className="font-semibold text-on-surface">Curative Protocol:</span> Prune infected stems, sterilize shears with sodium hypochlorite 1%, deploy copper oxychloride.</div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-on-surface-variant">
                        <input className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" />
                        <span>Awaiting Sign-off</span>
                      </label>
                      <button className="px-2.5 py-1 rounded bg-secondary text-on-secondary text-xs font-semibold hover:bg-on-secondary-container" type="button">Validate Ticket</button>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md text-center" type="button">View All 42 Field Reports</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
            <div className="xl:col-span-6 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-lg bg-surface-container-lowest shadow-sm flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Panel C</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface-variant">Oyo / Ogun ADP Coverage</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Extension Officer Visitation &amp; Advisory Roster</h2>
                  </div>
                  <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-label-sm font-semibold hover:bg-surface-container-high self-start sm:self-auto" type="button"><Icon name="person_add" className="text-[16px] text-secondary" /> Assign New LGA</button>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-2.5 px-3 rounded-l-lg">Agent &amp; Certification</th>
                        <th className="py-2.5 px-3">Assigned LGA</th>
                        <th className="py-2.5 px-3 text-center">Workshops</th>
                        <th className="py-2.5 px-3">Demo Plot</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Satisfaction</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-body-sm divide-y-0">
                      <tr className="hover:bg-surface-container-low/50">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-on-surface">Bolanle Fatoki, B.Agric</div>
                          <div className="text-xs text-secondary">ADP Lead Specialist • ID #482</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-on-surface">Ibarapa East (Eruwa)</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold text-xs">4 sessions</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Active Biochar Plot</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-on-surface">4.9 / 5.0</div>
                          <div className="text-[11px] text-on-surface-variant">148 attendees</div>
                        </td>
                      </tr>
                      <tr className="bg-surface-container-low/30 hover:bg-surface-container-low/60">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-on-surface">Olumide Gbadamosi</div>
                          <div className="text-xs text-secondary">Agronomic Field Scout • ID #119</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-on-surface">Iseyin (Oyo North)</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold text-xs">6 sessions</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> SAMMAZ Demo #08</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-on-surface">4.8 / 5.0</div>
                          <div className="text-[11px] text-on-surface-variant">210 attendees</div>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low/50">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-on-surface">Folake Alabi, MSc</div>
                          <div className="text-xs text-secondary">Crop Protection Advisor • ID #302</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-on-surface">Ijebu North (Ago-Iwoye)</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold text-xs">3 sessions</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-xs text-tertiary-fixed-dim font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" /> Land Prep Stage</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-on-surface">5.0 / 5.0</div>
                          <div className="text-[11px] text-on-surface-variant">92 attendees</div>
                        </td>
                      </tr>
                      <tr className="bg-surface-container-low/30 hover:bg-surface-container-low/60">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-on-surface">Saheed Mustapha</div>
                          <div className="text-xs text-secondary">Irrigation Systems Tech • ID #524</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-on-surface">Yewa North (Ayetoro)</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold text-xs">5 sessions</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> SRI Demo Wetting</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-on-surface">4.7 / 5.0</div>
                          <div className="text-[11px] text-on-surface-variant">175 attendees</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-space-sm mt-auto border-t-0">
                  <span className="text-xs text-on-surface-variant">Showing 4 of 124 field agents active this cycle</span>
                  <button className="text-xs font-semibold text-secondary hover:underline" type="button">Download Full Roster Audit</button>
                </div>
              </div>
            </div>
            <div className="xl:col-span-6 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-lg bg-surface-container-lowest shadow-sm flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Panel D</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface-variant">Sync with §11.5 Farmer Knowledge Node</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Approved Agronomic Guidance SOP Library</h2>
                  </div>
                  <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container self-start sm:self-auto" type="button"><Icon name="upload_file" className="text-[16px]" /> Publish Standard</button>
                </div>
                <div className="space-y-space-sm flex-1">
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm font-mono font-bold text-primary">SOP-MZ-2026-v2.4</span>
                        <span className="text-[11px] px-2 py-0.2 rounded font-semibold bg-secondary-fixed/50 text-on-secondary-fixed-variant">Effective: Mar 2026</span>
                      </div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">Maize Integrated Stem Borer &amp; Fall Armyworm IPM Protocol</div>
                      <div className="text-xs text-on-surface-variant">Author: Dr. K. Adebayo (IITA / COREN Agronomist) • Savanna &amp; Forest Transition</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface" title="Download Dossier PDF" type="button">
                        <Icon name="picture_as_pdf" className="text-[18px]" />
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-on-secondary-container inline-flex items-center gap-1" type="button"><Icon name="send_to_mobile" className="text-[14px]" /> Deploy to Field App</button>
                    </div>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm font-mono font-bold text-primary">SOP-CS-2026-v3.1</span>
                        <span className="text-[11px] px-2 py-0.2 rounded font-semibold bg-secondary-fixed/50 text-on-secondary-fixed-variant">Effective: Feb 2026</span>
                      </div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">High-Tuber Density Cassava Fertilizer Micro-Dosing Regimen</div>
                      <div className="text-xs text-on-surface-variant">Author: Prof. T. Ogunlesi (NIHORT / Oyo ADP) • High-Rainfall Rainforest Zone</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface" title="Download Dossier PDF" type="button">
                        <Icon name="picture_as_pdf" className="text-[18px]" />
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-on-secondary-container inline-flex items-center gap-1" type="button"><Icon name="send_to_mobile" className="text-[14px]" /> Deploy to Field App</button>
                    </div>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm font-mono font-bold text-primary">SOP-RC-2025-v1.9</span>
                        <span className="text-[11px] px-2 py-0.2 rounded font-semibold bg-surface-container-highest text-on-surface">Effective: Nov 2025</span>
                      </div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">System of Rice Intensification (SRI) Lowland Water Calibration</div>
                      <div className="text-xs text-on-surface-variant">Author: Dr. E. Ndatsu (NCRI Badeggi) • Lowland River Basins</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface" title="Download Dossier PDF" type="button">
                        <Icon name="picture_as_pdf" className="text-[18px]" />
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-on-secondary-container inline-flex items-center gap-1" type="button"><Icon name="send_to_mobile" className="text-[14px]" /> Deploy to Field App</button>
                    </div>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm font-mono font-bold text-primary">SOP-SOIL-2026-v2.0</span>
                        <span className="text-[11px] px-2 py-0.2 rounded font-semibold bg-secondary-fixed/50 text-on-secondary-fixed-variant">Effective: Jan 2026</span>
                      </div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">Acidic Soil Remediation via Local Calcined Agricultural Lime</div>
                      <div className="text-xs text-on-surface-variant">Author: Institute of Agricultural Research &amp; Training (IAR&amp;T) Moor Plantation</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface inline-flex items-center justify-center" title="Download Dossier PDF" href="/api/documents/agronomy-dossier">
                        <Icon name="picture_as_pdf" className="text-[18px]" />
                      </a>
                      <button className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-on-secondary-container inline-flex items-center gap-1" type="button"><Icon name="send_to_mobile" className="text-[14px]" /> Deploy to Field App</button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-sm mt-auto border-t-0">
                  <span className="text-xs text-on-surface-variant">48 Versioned Agronomic Standards registered in repository</span>
                  <a className="text-xs font-semibold text-secondary hover:underline" href="/api/documents/sop-repository">Batch Export SOP Repository (.zip)</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
