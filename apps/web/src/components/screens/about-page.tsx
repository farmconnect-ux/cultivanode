// Ported from the "about_cultivanode_mission_leadership" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function AboutPage({ lang = "en" }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full overflow-hidden bg-surface pt-space-xl pb-space-lg lg:pb-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop relative z-10">
            <div className="inline-flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-high mb-space-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">The CultivaNode Mission · Regional Agricultural Digital Rails</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end mb-space-xl">
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight max-w-4xl">Architecting Verifiable Digital Infrastructure for African Agriculture</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">Bridging the critical trust, mechanization, and liquidity deficit across South-West Nigeria with sub-meter cadastral GIS, tamper-evident double-entry ledgers, and CBN-regulated partner escrow.</p>
              </div>
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-space-sm justify-end">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[24px]" />
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Pilot Protocol Status</p>
                      <p className="font-headline-sm text-headline-sm text-primary font-bold">Phase II Active Mesh</p>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">Live</span>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="gavel" className="text-primary text-[24px]" />
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Compliance Boundary</p>
                      <p className="font-headline-sm text-headline-sm text-primary font-bold">NDPA 2023 Audited</p>
                    </div>
                  </div>
                  <Icon name="check_circle" className="text-secondary text-[20px]" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md pt-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Field Deployment</span>
                  <Icon name="groups" className="text-secondary text-[20px]" />
                </div>
                <div>
                  <span className="font-metric-num text-metric-num text-primary font-bold block">300+</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Verified Pilot Producers</span>
                </div>
                <div className="mt-space-sm pt-space-xs text-secondary font-label-sm text-label-sm flex items-center gap-1"><Icon name="trending_up" className="text-[16px]" /> Cadastral Mapped</div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Regional Expansion</span>
                  <Icon name="map" className="text-secondary text-[20px]" />
                </div>
                <div>
                  <span className="font-metric-num text-metric-num text-primary font-bold block">6 States</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Oyo, Ogun, Osun, Ondo, Ekiti, Lagos</span>
                </div>
                <div className="mt-space-sm pt-space-xs text-primary-container font-label-sm text-label-sm flex items-center gap-1"><Icon name="location_on" className="text-[16px]" /> SW Agrarian Belt</div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Agronomic Precision</span>
                  <Icon name="psychiatry" className="text-secondary text-[20px]" />
                </div>
                <div>
                  <span className="font-metric-num text-metric-num text-primary font-bold block">15 Crops</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Agro-Calibrated Varieties</span>
                </div>
                <div className="mt-space-sm pt-space-xs text-secondary font-label-sm text-label-sm flex items-center gap-1"><Icon name="science" className="text-[16px]" /> Phenology Tracked</div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Fleet Access</span>
                  <Icon name="toll" className="text-secondary text-[20px]" />
                </div>
                <div>
                  <span className="font-metric-num text-metric-num text-primary font-bold block">₦0 Fee</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Platform Cut on Pilot Hires</span>
                </div>
                <div className="mt-space-sm pt-space-xs text-secondary font-label-sm text-label-sm flex items-center gap-1"><Icon name="check_circle" className="text-[16px]" /> 100% Escrow Integrity</div>
              </div>
            </div>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-margin-desktop w-full my-space-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            <div className="rounded-xl overflow-hidden shadow-sm h-64 bg-surface-container-low relative">
              <img className="w-full h-full object-cover" data-alt="An expansive aerial drone shot over green agricultural fields in Oyo North, Nigeria, showcasing neatly organized cassava and maize plots with precise geographic borders under soft early morning golden light." src="/images/screens/cda877cfe8af.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute bottom-0 inset-x-0 p-space-md bg-gradient-to-t from-primary/90 to-transparent">
                <p className="font-label-md text-label-md text-on-primary">Oyo North Cadastral Corridors</p>
                <p className="font-body-sm text-body-sm text-surface-container-high">Saki West &amp; Iseyin Plot Mappings</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-sm h-64 bg-surface-container-low relative">
              <img className="w-full h-full object-cover" data-alt="Close up of an agricultural officer and smallholder farmer in Ogun state inspecting healthy maize stalks with a rugged tablet displaying geographic polygons in daylight." src="/images/screens/5f4645bdd62e.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute bottom-0 inset-x-0 p-space-md bg-gradient-to-t from-primary/90 to-transparent">
                <p className="font-label-md text-label-md text-on-primary">Field-Level Proof of Work</p>
                <p className="font-body-sm text-body-sm text-surface-container-high">Multi-spectral Telemetry Verification</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-sm h-64 bg-surface-container-low relative">
              <img className="w-full h-full object-cover" data-alt="A modern green tractor working on expansive red soil farmland in South-West Nigeria with mechanized tillage implements under bright equatorial sunlight." src="/images/screens/d738cb67290b.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute bottom-0 inset-x-0 p-space-md bg-gradient-to-t from-primary/90 to-transparent">
                <p className="font-label-md text-label-md text-on-primary">Syndicate Tractor Mobilization</p>
                <p className="font-body-sm text-body-sm text-surface-container-high">Zero Deadhead Transit Optimization</p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="max-w-3xl mb-space-xl">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container font-label-sm text-label-sm text-tertiary mb-space-sm uppercase tracking-wider"><Icon name="warning" className="text-[16px] text-tertiary" /> Structural Bottlenecks</div>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">The Agricultural Dilemma We Resolve</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">Decades of agronomic stagnation across regional agrarian corridors stem from institutional coordination failure, not lack of farmer industriousness.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-space-md">
                    <Icon name="agriculture" className="text-[28px]" />
                  </div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm text-error font-semibold uppercase tracking-wider">Barrier 01</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Fleet Inefficiency</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-semibold mb-space-sm">The Mechanization Trap &amp; Deadhead Crisis</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">Smallholders face extortionate broker surcharges of up to 40% alongside constant tractor syndicates reneging on plowing windows. Simultaneously, commercial fleet owners incur catastrophic non-revenue deadhead transit costs and high defaults across dispersed smallholders.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">Smallholder Fleet Deficit</span>
                    <span className="font-bold text-error">7.1 Tractors / 100km²</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: "22%" }} />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">CultivaNode coordinates clusters to drop deadhead transit by 68%.</span>
                </div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-space-md">
                    <Icon name="description" className="text-[28px]" />
                  </div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm text-error font-semibold uppercase tracking-wider">Barrier 02</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Credit Ineligibility</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-semibold mb-space-sm">The Paperwork &amp; Land Tenure Void</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">Over 82% of regional agrarian producers hold informal customary land titles lacking sub-meter cadastral demarcations. Absent audited yield logs, smallholders remain permanently unbankable for Tier-1 agro-credit, forced into predatory micro-debt.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">Commercial Ag-Credit Denial</span>
                    <span className="font-bold text-error">91.4% Rejection Rate</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: "91%" }} />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">PostGIS boundary proofs and double-entry yield books unlock formal credit.</span>
                </div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary mb-space-md">
                    <Icon name="science" className="text-[28px]" />
                  </div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="font-label-sm text-label-sm text-error font-semibold uppercase tracking-wider">Barrier 03</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Market Exploitation</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-semibold mb-space-sm">Adulterated Inputs &amp; Farmgate Cartels</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">Up to 35% of agrochemicals and certified seeds entering rural hubs are diluted or counterfeit, slashing yields mid-season. Concurrently, predatory cartels depress harvest farmgate pricing by 25–45% during peak regional flush.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">Circulating Fake Agrochemicals</span>
                    <span className="font-bold text-error">35% Adulterated</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: "35%" }} />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Batch-tracked input manifests coupled with structured buyer forward contracts.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
              <div>
                <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Engineering Foundations</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold mt-1">Our Core Product Philosophy &amp; Tenets</h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Built for the reality of rural African field logistics, without speculative abstractions or ungrounded claims.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
              <div className="lg:col-span-6 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="verified_user" className="text-[22px]" />
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Tenet 01</span>
                      <h3 className="font-headline-md text-headline-md text-primary font-bold">Trust Through Tangible Proof (PoW)</h3>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">We reject self-reported agrarian claims. Every tractor hectare, seed bag application, and crop harvest is substantiated through PostGIS telemetry polygons, hardware cryptographic time-stamps, and physical extension agent confirmations.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="layers" className="text-secondary text-[20px]" />
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">Double-Entry Spatial Ledger Protocol</span>
                  </div>
                  <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded bg-surface-container-highest text-primary">Immutable Trace</span>
                </div>
              </div>
              <div className="lg:col-span-6 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                      <Icon name="policy" className="text-[22px]" />
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Tenet 02</span>
                      <h3 className="font-headline-md text-headline-md text-primary font-bold">Farmer Sovereignty &amp; NDPA 2023 Compliance</h3>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">Agrarian data belongs unconditionally to the producer. No corporate syndicate, governmental board, or predatory financier can view telemetry, yield totals, or boundaries without explicit, revocable consent keys held by the farmer.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <Icon name="lock" className="text-secondary text-[20px]" />
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">Zero Unconsented Telemetry Extraction</span>
                  </div>
                  <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded bg-surface-container-highest text-primary">NDPC Certified</span>
                </div>
              </div>
              <div className="lg:col-span-6 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="wifi_off" className="text-[22px]" />
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Tenet 03</span>
                      <h3 className="font-headline-md text-headline-md text-primary font-bold">Open Agrarian Mesh Architecture</h3>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">Constructed on resilient open PostgreSQL/PostGIS engines and offline-first delta synchronizers. Remote farm operators in Oke-Ogun or Ijebu manage field rosters, dispatch machinery, and log yields without live 4G GSM network reliance.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Local SQLite-to-Postgres Event Bus</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">100% Offline Capable</span>
                </div>
              </div>
              <div className="lg:col-span-6 p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="account_balance" className="text-[22px]" />
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Tenet 04</span>
                      <h3 className="font-headline-md text-headline-md text-primary font-bold">Regulated Financial Custody</h3>
                    </div>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">CultivaNode never operates as an unregulated digital wallet or shadow bank. All tractor hire, off-take escrow, and input disbursements are custodied in CBN-regulated settlement vaults with Providus and Wema Bank.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">CBN Escrow Compliance Tier 1</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">Providus &amp; Wema Secured</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl items-end">
              <div className="lg:col-span-8">
                <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Pilot Geography</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold mt-1">Regional Focus: The South-West Agrarian Pilot Mesh</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">South-West Nigeria represents one of West Africa&apos;s richest dual-biome agrarian matrices. CultivaNode adapts to two distinct micro-climates across 28 operational clusters.</p>
              </div>
              <div className="lg:col-span-4 flex items-center lg:justify-end gap-space-sm">
                <div className="p-space-sm px-space-md rounded-lg bg-surface-container-lowest shadow-sm flex items-center gap-space-xs">
                  <Icon name="hub" className="text-secondary text-[20px]" />
                  <span className="font-label-sm text-label-sm font-semibold text-primary">28 Active ADP Clusters</span>
                </div>
                <div className="p-space-sm px-space-md rounded-lg bg-surface-container-lowest shadow-sm flex items-center gap-space-xs">
                  <Icon name="layers" className="text-primary text-[20px]" />
                  <span className="font-label-sm text-label-sm font-semibold text-primary">2 Agro-Ecological Belts</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-7 rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest flex flex-col">
                <div className="p-space-md bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="public" className="text-secondary text-[20px]" />
                    <span className="font-label-md text-label-md text-primary font-bold">South-West Nigeria Geo-Cadastral Mesh (Oyo, Ogun, Osun, Ondo, Ekiti, Lagos)</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Live Spatial Coordinates</span>
                </div>
                <div className="w-full h-80 bg-cover bg-center" data-location="Ibadan, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/9107876e6c7f.webp')" }} />
                <div className="p-space-md flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest">
                  <div className="flex items-center gap-space-md font-label-sm text-label-sm">
                    <span className="flex items-center gap-1.5 text-primary font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Savanna Cluster</span>
                    <span className="flex items-center gap-1.5 text-secondary font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Forest Belt Cluster</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Coordinating with ADP Extension Field Stations</span>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-space-md justify-between">
                <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary font-semibold">Agro-Zone 01</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Bimodal Onset: April–May</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Derived Savanna Belt</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold">Oyo North (Saki, Iseyin, Kisi) &amp; Northern Ogun</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Expansive, open plains suited for heavy mechanized tractor syndicates. Core production corridor for White Maize (SAMMAZ-15), Industrial Starch Cassava (TME-419), Soya, and Large Yam mounds.</p>
                  <div className="flex flex-wrap gap-1.5 pt-space-xs">
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">SAMMAZ-15</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">TME-419 Cassava</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">Yam Ridging</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">Soya Bean</span>
                  </div>
                </div>
                <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-space-sm py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary font-semibold">Agro-Zone 02</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Heavy Rain: 1,800mm+</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Rainforest &amp; Coastal Forest Belt</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold">Ogun (Ijebu/Sagamu), Osun, Ondo (Akure/Owo), Ekiti, Lagos</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">High ambient moisture, organic-rich loams. Specialized operational rails for Tree Crop Telemetry (Cocoa, Oil Palm), Commercial Plantain groves, High-Value Vegetables, and Agro-Forestry management.</p>
                  <div className="flex flex-wrap gap-1.5 pt-space-xs">
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">Fine Cocoa</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">Oil Palm</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">Plantain Roster</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary">Peri-Urban Veg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="max-w-3xl mb-space-xl">
              <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Field &amp; Systems Governance</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold mt-1">Leadership &amp; Agronomic Advisory Council</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">Built by agricultural systems engineers, veteran extension directors, geospatial scientists, and supply chain operators rooted in Nigerian soils.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-xl overflow-hidden mb-space-md bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="Professional studio portrait of Quadri Olapade, a Nigerian agritech systems architect and founder wearing modern business attire with clean background." src="/images/screens/48822b2e1bac.webp" alt="" loading="lazy" decoding="async" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Quadri Olapade</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider mb-space-sm">Founder &amp; Systems Architect</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Specialist in high-scale agricultural enterprise software, distributed spatial computing, and transactional proof protocols across emerging markets.</p>
                </div>
                <div className="mt-space-md pt-space-sm text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1"><Icon name="code" className="text-[16px] text-secondary" /> Distributed Spatial Ledger</div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-xl overflow-hidden mb-space-md bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="Portrait of Engr Babatunde Ogunlesi, an experienced Nigerian agronomist wearing field khaki vest in front of green agricultural foliage." src="/images/screens/ca85b5d3721a.webp" alt="" loading="lazy" decoding="async" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Engr. B. Ogunlesi</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider mb-space-sm">Chief Agronomist &amp; Extension Dir.</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Former Oyo State ADP Director and NCRI collaborator. 28+ years steering large-scale regional tractorization and seed distribution across the South-West.</p>
                </div>
                <div className="mt-space-md pt-space-sm text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1"><Icon name="domain" className="text-[16px] text-secondary" /> Fmr Oyo ADP Director</div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-xl overflow-hidden mb-space-md bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="Professional portrait of Dr Folashade Adeyemi, a Nigerian female geospatial researcher and soil scientist in professional research attire." src="/images/screens/380533cd4077.webp" alt="" loading="lazy" decoding="async" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Dr. F. Adeyemi</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider mb-space-sm">Geospatial &amp; Soil Science Lead</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">PhD Remote Sensing (UI Ibadan). Led multi-spectral mapping of sub-Saharan soil cation exchange capacity and NDVI regional calibration for arable savanna.</p>
                </div>
                <div className="mt-space-md pt-space-sm text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1"><Icon name="satellite_alt" className="text-[16px] text-secondary" /> PhD Remote Sensing, UI</div>
              </div>
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-xl overflow-hidden mb-space-md bg-surface-container">
                    <img className="w-full h-full object-cover" data-alt="Professional portrait of Olumide Bakare, a Nigerian logistics and supply chain operations executive in crisp smart attire." src="/images/screens/63555b4c09b7.webp" alt="" loading="lazy" decoding="async" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Olumide Bakare</h3>
                  <p className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider mb-space-sm">Head of Ops &amp; Syndicate Relations</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Veteran agro-logistics lead specializing in heavy machinery utilization, Interstate transit escrow, and high-volume grain aggregation depots.</p>
                </div>
                <div className="mt-space-md pt-space-sm text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1"><Icon name="local_shipping" className="text-[16px] text-secondary" /> Regional Fleet Corridors</div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="text-center max-w-2xl mx-auto mb-space-lg">
              <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Institutional Anchors</span>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-1">Accredited Partner Ecosystem</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Working directly alongside official state agricultural organs and Central Bank of Nigeria regulated financial rails.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-space-md items-center">
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-space-xs">
                <Icon name="shield" className="text-primary text-[32px]" />
                <span className="font-label-md text-label-md text-primary font-bold">OYSADEP</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Oyo State ADP Extension</span>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-space-xs">
                <Icon name="spa" className="text-primary text-[32px]" />
                <span className="font-label-md text-label-md text-primary font-bold">OGADEP</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Ogun State ADP Network</span>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-space-xs">
                <Icon name="account_balance" className="text-secondary text-[32px]" />
                <span className="font-label-md text-label-md text-primary font-bold">Providus Bank</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Escrow Settlement Trustee</span>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-space-xs">
                <Icon name="payments" className="text-secondary text-[32px]" />
                <span className="font-label-md text-label-md text-primary font-bold">Wema Bank</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Agri-Desk Custody Partner</span>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-space-xs col-span-2 md:col-span-1">
                <Icon name="gavel" className="text-primary text-[32px]" />
                <span className="font-label-md text-label-md text-primary font-bold">NDPC Validated</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Data Privacy Compliance</span>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-space-xl bg-surface">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="p-space-xl rounded-xl bg-primary-container text-on-primary shadow-md relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary opacity-20 filter blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-primary font-label-sm text-label-sm text-on-primary mb-space-md"><span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" /> Open Onboarding Window</div>
                <h2 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg font-bold text-on-primary leading-tight mb-space-sm">Join the Pilot Mesh or Partner With Us</h2>
                <p className="font-body-lg text-body-lg text-surface-container-high leading-relaxed mb-space-xl">Whether you cultivate 20 hectares in Kisi, operate an 8-tractor fleet in Sagamu, or direct agricultural extension for state government, CultivaNode establishes your verified operational presence.</p>
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-space-md">
                  <Link className="inline-flex items-center justify-center font-label-lg text-label-lg font-bold px-space-lg py-space-sm rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container transition-colors shadow-sm" href={`/${lang}/sign-up`}><Icon name="how_to_reg" className="mr-space-xs text-[20px]" /> Apply to Join Pilot (Farmers &amp; Fleets)</Link>
                  <Link className="inline-flex items-center justify-center font-label-lg text-label-lg font-bold px-space-lg py-space-sm rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm" href={`/${lang}/contact`}><Icon name="handshake" className="mr-space-xs text-[20px]" /> Institutional &amp; State Partnerships</Link>
                  <Link className="inline-flex items-center justify-center font-label-lg text-label-lg font-semibold px-space-md py-space-sm rounded-lg text-on-primary hover:bg-primary transition-colors" href={`/${lang}/platform`}><Icon name="menu_book" className="mr-space-xs text-[20px]" /> Technical Whitepaper</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
