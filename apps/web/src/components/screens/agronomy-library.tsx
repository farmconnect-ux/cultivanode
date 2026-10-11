// Ported from the "resources_agronomy_library_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function AgronomyLibrary({ lang }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full bg-surface-container-low px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div className="flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant font-label-sm text-label-sm">
              <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs">
                <Link className="hover:text-primary transition-colors" href={`/${lang}/resources`}>Agro-Registry</Link>
                <span className="text-outline">/</span>
                <Link className="hover:text-primary transition-colors" href={`/${lang}/resources`}>Technical Repositories</Link>
                <span className="text-outline">/</span>
                <span aria-current="page" className="text-on-surface font-semibold">Agronomy Knowledge Center</span>
              </nav>
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-lowest rounded-full shadow-sm text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="uppercase tracking-wider font-semibold">IITA &amp; NCRI Calibrated Standards</span>
              </div>
            </div>
            <div className="flex flex-col gap-space-sm max-w-4xl">
              <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">Agro-Ecological Extension Series · Document 2 §4.13</span>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">Agricultural Resources, Field Guides &amp; Operational Knowledge</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Production protocols, phenological calendars, crop protection spray schedules, and official CultivaNode platform guidelines calibrated for South-West Nigeria agro-ecological zones (Oyo, Ogun, Ondo, and Osun).</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-space-md">
                <div className="relative flex-1">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
                  <input className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 rounded-lg font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20" id="resourceSearchInput" placeholder="Search 85+ guides, crop standards, or operational FAQs (e.g., SAMMAZ-15, Escrow, PostGIS)..." type="text" />
                </div>
                <div className="flex items-center gap-space-xs shrink-0 self-start lg:self-auto bg-surface-container-low p-1 rounded-lg">
                  <button className="px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all bg-primary-container text-on-primary font-semibold shadow-sm" id="langEnBtn" type="button">English (Universal)</button>
                  <button className="px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all text-on-surface-variant hover:text-on-surface font-semibold" id="langYoBtn" type="button">Èdè Yorùbá</button>
                </div>
              </div>
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1" id="filterPillsContainer">
                <button className="filter-pill active px-space-md py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-primary text-on-primary font-semibold transition-colors" data-category="all" type="button">All Technical Guides (85)</button>
                <button className="filter-pill px-space-md py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" data-category="crop-production" type="button">Crop Production Standards (32)</button>
                <button className="filter-pill px-space-md py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" data-category="machinery" type="button">Tractor &amp; Mechanization (18)</button>
                <button className="filter-pill px-space-md py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" data-category="soil" type="button">Soil &amp; Pedology (12)</button>
                <button className="filter-pill px-space-md py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" data-category="escrow" type="button">Financial &amp; Escrow (11)</button>
                <button className="filter-pill px-space-md py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" data-category="faq" type="button">Platform Operations &amp; NDPA (12)</button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">Document 2 §4.13 Repository</span>
                <h2 className="font-headline-lg text-headline-lg text-primary">Featured Extension Master Protocols</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">Peer-reviewed field standards deployed across Iseyin, Saki, Sagamu, and Akure commercial agronomy clusters.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md" id="featuredGuidesGrid">
              <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group" data-category="crop-production">
                <div className="flex flex-col gap-space-sm">
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Close up photography of vibrant SAMMAZ-15 hybrid maize crops in Oyo state savanna, displaying healthy deep green broad leaves, organized spacing on fertile dark loam soil under bright daylight, agricultural precision research style." src="/images/screens/6c9b888a0e0d.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-primary font-semibold shadow-sm">NCRI Calibrated v2.4</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary">Engr. B. Ogunlesi (Oyo ADP) · Feb 2025</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">SAMMAZ-15 Hybrid White Maize Production Protocol</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">Optimal spacing (75cm x 25cm, 53,333 plants/Ha), 2-stage split NPK 15-15-15 + Urea top-dressing calendar, and fall armyworm (Spodoptera frugiperda) IPM scouting thresholds.</p>
                  <div className="bg-surface-container-low rounded-lg p-2 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Standard Yield: 4.8–6.2 MT/Ha</span>
                    <span className="font-semibold text-secondary">37 Pgs</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs pt-space-md mt-auto">
                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors" type="button"><Icon name="visibility" className="text-[16px]" /> View Guide</button>
                  <button className="inline-flex items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors" title="Download PDF (4.2 MB)" type="button">
                    <Icon name="download" className="text-[18px]" />
                  </button>
                </div>
              </article>
              <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group" data-category="crop-production">
                <div className="flex flex-col gap-space-sm">
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Industrial cassava stem cuttings and pristine ridge mounds at an experimental agricultural station in Ibadan, lush foliage, clean weed suppression rows, high contrast realistic enterprise farming photography." src="/images/screens/59a5fa59c6f0.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-secondary font-semibold shadow-sm">IITA Calibrated Standard</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary">Dr. F. Adeyemi · Jan 2025</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">TME-419 Cassava Propagation &amp; Weed Suppression</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">Mechanical ridge formation vs flat planting, selective pre-emergence herbicide calibration, and optimal 10–12 month harvest timing targeting 28% dry matter industrial starch extraction.</p>
                  <div className="bg-surface-container-low rounded-lg p-2 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Extract Target: 28% Starch</span>
                    <span className="font-semibold text-secondary">24 Pgs</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs pt-space-md mt-auto">
                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors" type="button"><Icon name="visibility" className="text-[16px]" /> View Guide</button>
                  <button className="inline-flex items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors" title="Download PDF (3.8 MB)" type="button">
                    <Icon name="download" className="text-[18px]" />
                  </button>
                </div>
              </article>
              <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group" data-category="crop-production">
                <div className="flex flex-col gap-space-sm">
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Drip irrigation lines watering high-yield staked tomato and pepper crops in South-West Nigeria, modern agrarian infrastructure, clean polythene mulch, glistening water droplets, sharp crisp lighting." src="/images/screens/29659391a7a1.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-tertiary font-semibold shadow-sm">Horticultural Master Guide</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary">CultivaNode Extension Team · Nov 2024</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">Tomato &amp; Tatashe Dry Season Drip Irrigation Manual</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">Precision water budgeting in derived savanna, bacterial wilt (Ralstonia) prophylaxis, and foliar calcium nitrate injection protocols during rapid fruit enlargement stages.</p>
                  <div className="bg-surface-container-low rounded-lg p-2 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Daily Budget: 3.5L / Plant</span>
                    <span className="font-semibold text-secondary">42 Pgs</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs pt-space-md mt-auto">
                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors" type="button"><Icon name="visibility" className="text-[16px]" /> View Guide</button>
                  <button className="inline-flex items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors" title="Download PDF (5.1 MB)" type="button">
                    <Icon name="download" className="text-[18px]" />
                  </button>
                </div>
              </article>
              <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group" data-category="machinery">
                <div className="flex flex-col gap-space-sm">
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-surface-container">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Heavy agricultural tractor equipped with disc plow on a clearing in Ogun state, red-brown tropical ferruginous soil, technician performing morning hydraulic checklist, commercial machinery maintenance aesthetic." src="/images/screens/d31fcf9dbd9f.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-primary font-semibold shadow-sm">Mechanization Fleet Guideline</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary">Mechanization Fleet Lead · Jan 2025</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">Tractor Syndicate Maintenance &amp; Cold-Start Checklist</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">Fuel sediment purging, secondary air-cleaner cyclone blowout, three-point hitch hydraulic pressures, and disc plow bearing grease intervals in abrasive tropical ferruginous soils.</p>
                  <div className="bg-surface-container-low rounded-lg p-2 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Grease Interval: 10 Ops Hrs</span>
                    <span className="font-semibold text-secondary">19 Pgs</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs pt-space-md mt-auto">
                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors" type="button"><Icon name="visibility" className="text-[16px]" /> View Guide</button>
                  <button className="inline-flex items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors" title="Download PDF (2.9 MB)" type="button">
                    <Icon name="download" className="text-[18px]" />
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div>
                <div className="flex items-center gap-space-xs">
                  <Icon name="calendar_month" className="text-secondary text-[20px]" />
                  <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">Agro-Ecological Telemetry Calendar</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-primary">Seasonal Phenology &amp; Seeding Matrix</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Calibrated for derived savanna and rainforest transition zones in Oyo, Ogun, Osun &amp; Ondo.</p>
              </div>
              <div className="flex items-center bg-surface-container-lowest p-1 rounded-xl shadow-sm border border-outline-variant/30">
                <button className="px-space-md py-2 rounded-lg font-label-md text-label-md transition-all bg-primary-container text-on-primary font-semibold shadow-sm" id="seasonEarlyBtn" type="button">Early Season (March – July)</button>
                <button className="px-space-md py-2 rounded-lg font-label-md text-label-md transition-all text-on-surface-variant hover:text-on-surface font-semibold" id="seasonLateBtn" type="button">Late Season (August – October)</button>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-space-sm px-space-md">Crop &amp; Taxon</th>
                      <th className="py-space-sm px-space-md">Recommended Variety</th>
                      <th className="py-space-sm px-space-md">Planting Window</th>
                      <th className="py-space-sm px-space-md">Seeding Rate / Ha</th>
                      <th className="py-space-sm px-space-md">Critical Operations Window</th>
                      <th className="py-space-sm px-space-md text-right">Expected Yield</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm divide-y divide-surface-container-low" id="phenologyTableBody">
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-md font-semibold text-on-surface flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-secondary" /> Grain Maize (White)</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">SAMMAZ-15 / 16 (Drought Tolerant)</td>
                      <td className="py-space-md px-space-md font-semibold text-primary">Mar 15 – Apr 10</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">20 – 25 kg / Ha</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">NPK: 10-14 DAP · Urea: 30 DAP</span>
                      </td>
                      <td className="py-space-md px-space-md text-right font-metric-num font-semibold text-primary">4.8 – 6.0 MT/Ha</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-md font-semibold text-on-surface flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-secondary" /> Industrial Cassava</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">TME-419 / TMS 0505</td>
                      <td className="py-space-md px-space-md font-semibold text-primary">Apr 01 – Jun 15</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">50–60 Bundles (1m stakes)</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Pre-emergence herbicide 24h post</span>
                      </td>
                      <td className="py-space-md px-space-md text-right font-metric-num font-semibold text-primary">25 – 35 MT/Ha</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-md font-semibold text-on-surface flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-secondary" /> Lowland Rice</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">FARO-44 (Sipi) / FARO-52</td>
                      <td className="py-space-md px-space-md font-semibold text-primary">May 01 – Jun 20</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">60 – 80 kg (Broadcast/Drill)</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Water leveling + Basal NPK at 14 DAP</span>
                      </td>
                      <td className="py-space-md px-space-md text-right font-metric-num font-semibold text-primary">4.0 – 5.5 MT/Ha</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-md font-semibold text-on-surface flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-secondary" /> Soybean</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">TGX 1448-2E / TGX 1835-10E</td>
                      <td className="py-space-md px-space-md font-semibold text-primary">Jun 15 – Jul 10</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">50 – 60 kg / Ha</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Rhizobium inoculation + SSP fertilizer</span>
                      </td>
                      <td className="py-space-md px-space-md text-right font-metric-num font-semibold text-primary">1.8 – 2.5 MT/Ha</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-md font-semibold text-on-surface flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-secondary" /> Cowpea / Brown Beans</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">IT99K-573-1-1 (Early Maturity)</td>
                      <td className="py-space-md px-space-md font-semibold text-primary">Jul 01 – Jul 25</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">25 – 30 kg / Ha</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Pod borer IPM spray at flowering</span>
                      </td>
                      <td className="py-space-md px-space-md text-right font-metric-num font-semibold text-primary">1.2 – 1.8 MT/Ha</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-md font-semibold text-on-surface flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-secondary" /> Horticultural Tatashe &amp; Shombo</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Sombo F1 / Local Red Giant</td>
                      <td className="py-space-md px-space-md font-semibold text-primary">Mar 01 (Nursery) / Apr 15 (Bed)</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">300 – 400g nursery seed</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Staking &amp; preventive copper fungicide</span>
                      </td>
                      <td className="py-space-md px-space-md text-right font-metric-num font-semibold text-primary">12 – 18 MT/Ha</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
                <div className="flex items-center gap-space-xs">
                  <Icon name="verified" className="text-[16px] text-secondary" />
                  <span>Rainfall distribution telemetry cross-referenced with NIMET 2025 Seasonal Climate Prediction for Oyo, Ogun, Ondo, and Osun.</span>
                </div>
                <a className="text-primary font-semibold hover:underline flex items-center gap-1" href="#">Download Complete Agro-Ecological Schedule (CSV) <Icon name="arrow_outward" className="text-[14px]" /></a>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-xl">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">Document 2 §4.15 Inquiries &amp; Protocols</span>
              <h2 className="font-headline-lg text-headline-lg text-primary">Frequently Addressed Field &amp; Platform Inquiries</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Detailed operational resolutions regarding boundary walking, offline sync in remote bushland, Providus escrow settlements, and seed certification verification.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs pb-space-xs border-b border-surface-container-high">
                  <Icon name="polyline" className="text-secondary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Pillar A: Boundary Delineation &amp; Field Connectivity</h3>
                </div>
                <div className="flex flex-col gap-space-sm" id="accordionGroupA">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle" type="button">
                      <span>How does CultivaNode measure farm boundaries without a licensed surveyor?</span>
                      <Icon name="expand_more" className="text-outline transition-transform duration-200" />
                    </button>
                    <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm hidden accordion-content flex flex-col gap-2">
                      <p>CultivaNode utilizes the <strong>PostGIS GeoDjango spatial extension engine</strong>. Extension officers walk the perimeter with mobile GNSS devices utilizing multi-constellation RTK correction where available, generating an enclosed polygon centroid with sub-meter spatial accuracy.</p>
                      <p>To secure community validity in agrarian nodes like Saki and Ibarapa, boundary walks are counter-signed via digital signature or thumbprint by the cluster&apos;s traditional Baale or Land Holding Committee, fully aligned with the Oyo &amp; Ogun Agricultural Land Administration guidelines.</p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle" type="button">
                      <span>Do I need internet on my farm to record daily operations?</span>
                      <Icon name="expand_more" className="text-outline transition-transform duration-200" />
                    </button>
                    <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm hidden accordion-content flex flex-col gap-2">
                      <p><strong>No.</strong> CultivaNode mobile field units operate on an asynchronous <strong>Local SQLite Queue Architecture</strong>. Spray records, fuel fill logs, yield tallies, and worker attendance can be entered without cellular coverage.</p>
                      <p>Once the supervisor or farmer returns to 2G/3G coverage at a market town, the device automatically synchronizes transactional diffs via encrypted REST payloads with automated conflict resolution.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs pb-space-xs border-b border-surface-container-high">
                  <Icon name="payments" className="text-secondary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Pillar B: Machinery Escrow &amp; Operator Settlement</h3>
                </div>
                <div className="flex flex-col gap-space-sm" id="accordionGroupB">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle" type="button">
                      <span>How does the 0% pilot commission escrow mechanism work?</span>
                      <Icon name="expand_more" className="text-outline transition-transform duration-200" />
                    </button>
                    <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm hidden accordion-content flex flex-col gap-2">
                      <p>When you book tractor plowing or harrowing, 100% of the calculated cost is deposited into an institutional escrow vault hosted at <strong>Providus Bank PLC</strong> under CBN oversight. The tractor operator receives a mobilization token guaranteeing payment upon successful delivery.</p>
                      <p>Upon work completion, the farmer inspects the hectares and enters their PIN, or the system auto-settles after 48 hours in the absence of a dispute. During the current South-West pilot rollout, CultivaNode charges 0% platform intermediary commission.</p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle" type="button">
                      <span>What happens if a tractor breaks down midway through plowing?</span>
                      <Icon name="expand_more" className="text-outline transition-transform duration-200" />
                    </button>
                    <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm hidden accordion-content flex flex-col gap-2">
                      <p>CultivaNode calculates the exact completed acreage utilizing the tractor operator&apos;s onboard GPS telemetry or phone polygon tracker. The completed fraction is logged.</p>
                      <p>The system then offers two immediate escrow remedies: (1) Relief tractor dispatch from the nearest Syndicate cluster within 24 hours, or (2) Instant pro-rata escrow balance refund credited back to the farmer&apos;s mobile wallet or bank account.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs pb-space-xs border-b border-surface-container-high">
                  <Icon name="verified_user" className="text-secondary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Pillar C: Quality Verification &amp; Seed Integrity</h3>
                </div>
                <div className="flex flex-col gap-space-sm" id="accordionGroupC">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle" type="button">
                      <span>How are certified seeds differentiated from counterfeit grain?</span>
                      <Icon name="expand_more" className="text-outline transition-transform duration-200" />
                    </button>
                    <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm hidden accordion-content flex flex-col gap-2">
                      <p>All inputs cataloged on CultivaNode are authenticated with the <strong>National Agricultural Seeds Council (NASC) SEEDCODEX verification tags</strong>. Each bag features a tamper-proof scratch-off QR code verified directly against the NASC national database.</p>
                      <p>Furthermore, agro-dealers listed on our directory are physically audited and verified by IITA/NCRI accredited field officers across Ibadan, Abeokuta, and Akure.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs pb-space-xs border-b border-surface-container-high">
                  <Icon name="gavel" className="text-secondary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Pillar D: Statutory Compliance &amp; NDPA 2023</h3>
                </div>
                <div className="flex flex-col gap-space-sm" id="accordionGroupD">
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    <button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors accordion-toggle" type="button">
                      <span>Can commercial banks or tax authorities view my yield records?</span>
                      <Icon name="expand_more" className="text-outline transition-transform duration-200" />
                    </button>
                    <div className="px-space-md pb-space-md text-on-surface-variant font-body-sm text-body-sm hidden accordion-content flex flex-col gap-2">
                      <p><strong>Absolutely not without your explicit, auditable opt-in consent.</strong> CultivaNode operates strictly under the <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and NITDA statutory guidelines.</p>
                      <p>Your farm telemetry, financial volumes, and harvest yields are encrypted. When applying for agricultural credit, you explicitly generate a revocable 30-day &quot;Lender Token&quot; that shares only the specific data fields required for credit scoring.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl bg-surface-container-low">
          <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
            <div>
              <span className="font-label-md text-label-md tracking-wider uppercase text-secondary">Offline Extension Toolkits</span>
              <h2 className="font-headline-lg text-headline-lg text-primary">Official Field Operational Manuals &amp; Printables</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="menu_book" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">PDF Document · 68 Pages · 14.2 MB</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Pilot Farm Operations Handbook (Oyo &amp; Ogun Edition)</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Comprehensive reference guide covering cooperative formation, cluster delineation standards, dispute management protocols, and multi-crop spraying schedules.</p>
                </div>
                <div className="pt-space-md mt-auto">
                  <a className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors" href="#"><Icon name="download" className="text-[18px]" /> Download Master Handbook</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="file_open" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Wall Poster PDF · High-Res Print · 8.4 MB</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">South-West Agrochemical Safety &amp; Waiting Times Chart</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Laminated field-office poster detailing active ingredient safety classes, PPE standards, and Pre-Harvest Intervals (PHI) for common pesticides and fungicides.</p>
                </div>
                <div className="pt-space-md mt-auto">
                  <a className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors" href="#"><Icon name="download" className="text-[18px]" /> Download Wall Poster</a>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="agriculture" className="text-[28px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Printable Template (A4) · 2.1 MB</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Tractor Syndicate Operator Daily Logbook</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Field-ready daily log sheets for equipment operators: recording hour-meter reads, diesel consumption, implement wear, hectare counters, and farm manager sign-offs.</p>
                </div>
                <div className="pt-space-md mt-auto">
                  <a className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-primary transition-colors" href="#"><Icon name="download" className="text-[18px]" /> Download Operator Logbook</a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          <div className="max-w-7xl mx-auto rounded-2xl bg-primary text-on-primary p-space-lg md:p-space-xl relative overflow-hidden shadow-lg">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary/10 pointer-events-none blur-2xl" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
              <div className="flex flex-col gap-space-xs max-w-2xl">
                <div className="inline-flex items-center gap-space-xs text-secondary-container font-label-sm text-label-sm uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" /> Live Agronomy Desk &amp; Field Support</div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-primary">Have an unidentified crop symptom or need an on-farm extension consultation?</h2>
                <p className="font-body-md text-body-md text-on-primary/80">Connect immediately with CultivaNode AI Agronomist, or route your geo-tagged farm photos directly to state ADP extension specialists in Ibadan, Abeokuta, Akure, or Osogbo.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm shrink-0 w-full lg:w-auto">
                <a className="inline-flex items-center justify-center gap-2 py-3 px-space-md rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-semibold hover:bg-secondary-fixed transition-colors shadow-sm" href="#"><Icon name="smart_toy" className="text-[20px]" /> Consult AI Farm Assistant</a>
                <a className="inline-flex items-center justify-center gap-2 py-3 px-space-md rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md font-semibold hover:bg-surface transition-colors shadow-sm" href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer"><Icon name="chat" className="text-[20px]" /> ADP WhatsApp Desk</a>
                <a className="inline-flex items-center justify-center gap-2 py-3 px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold hover:bg-secondary transition-colors border border-outline-variant/20" href="#"><Icon name="contact_support" className="text-[20px]" /> Submit Query</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
