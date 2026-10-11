// Ported from the "solutions_by_agricultural_role_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function SolutionsByRole({ lang }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full bg-surface-container-low overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-margin-desktop pt-space-xl pb-space-xl relative">
            <div className="flex flex-col gap-space-md max-w-4xl">
              <div className="inline-flex items-center gap-space-sm self-start bg-surface-container-lowest shadow-sm px-space-sm py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">TAILORED AGRARIAN ECOSYSTEM · /en/solutions</span>
                <span className="text-outline-variant font-body-sm text-body-sm">|</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">NDPA 2023 Compliant Protocol</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Engineered for Every Stakeholder in the Agricultural Value Chain</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">From independent smallholders planting cassava in Oke-Ogun to industrial flour millers in Lagos and tractor syndicates in Saki, discover how CultivaNode transforms your daily operational workflow with CBN-anchored escrow security, real-time telemetry, and certified inputs.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md pt-space-sm">
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Managed Farmland</span>
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">142,500<span className="font-label-md text-label-md font-medium text-secondary ml-1">Ha</span></span>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Escrow Protected</span>
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">₦1.84<span className="font-label-md text-label-md font-medium text-secondary ml-1">Billion</span></span>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Verified Tractors</span>
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">840+<span className="font-label-md text-label-md font-medium text-secondary ml-1">Units</span></span>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">SW Clusters</span>
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">28<span className="font-label-md text-label-md font-medium text-secondary ml-1">Nodes</span></span>
                </div>
              </div>
            </div>
            <div className="mt-space-xl pt-space-lg">
              <div className="flex items-center justify-between pb-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Filter by Operational Category</span>
                <span className="font-label-sm text-label-sm text-secondary font-medium">9 Calibrated Architecture Profiles</span>
              </div>
              <div className="flex flex-wrap gap-space-xs" id="role-filter-container">
                <button className="filter-pill active px-space-md py-space-xs rounded-full font-label-md text-label-md bg-primary text-on-primary shadow-sm transition-all flex items-center gap-1.5" data-filter="all" type="button"><Icon name="apps" className="text-[16px]" /> All Roles (9)</button>
                <button className="filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5" data-filter="production" type="button"><Icon name="agriculture" className="text-[16px] text-secondary" /> Farmers &amp; Operators</button>
                <button className="filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5" data-filter="machinery" type="button"><Icon name="precision_manufacturing" className="text-[16px] text-secondary" /> Machinery Fleet Owners</button>
                <button className="filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5" data-filter="services" type="button"><Icon name="badge" className="text-[16px] text-secondary" /> Service Providers</button>
                <button className="filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5" data-filter="inputs" type="button"><Icon name="storefront" className="text-[16px] text-secondary" /> Agro-Dealers</button>
                <button className="filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5" data-filter="offtake" type="button"><Icon name="local_shipping" className="text-[16px] text-secondary" /> Commodity Buyers</button>
                <button className="filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5" data-filter="logistics" type="button"><Icon name="rv_hookup" className="text-[16px] text-secondary" /> Logistics</button>
                <button className="filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5" data-filter="federations" type="button"><Icon name="groups" className="text-[16px] text-secondary" /> Cooperatives</button>
                <button className="filter-pill px-space-md py-space-xs rounded-full font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5" data-filter="institutional" type="button"><Icon name="account_balance" className="text-[16px] text-secondary" /> Institutions</button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full max-w-7xl mx-auto px-margin-desktop py-space-xl">
          <div className="flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">SYSTEMATIC ROLE DIRECTORY</span>
                <h2 className="font-headline-lg text-headline-lg text-primary">Calibrated Workflows by Value Chain Position</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">Each card details verified market pain points, native platform telemetry, end-to-end execution flows, and real-time availability states across South-West Nigeria.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg" id="solutions-card-grid">
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="production">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="potted_plant" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§4.3 FRAMEWORK</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available Now</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">Smallholder &amp; Family Farmers</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Independent growers cultivating 0.5 to 10 hectares across Southwest food belts requiring timely mechanization and guaranteed market linkage.</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" /> Key Operational Bottlenecks</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Tractor scarcity during short onset rains, adulterated seed supplies, lack of formal bankable credit records, and vulnerability to exploitative farmgate cartels.</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Native Platform Capabilities</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>GPS polygon mapping via offline mobile app or local cluster agent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>15 South-West phenology calendars (Cassava, Maize, Yam, Cocoa, Cashew)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>0% commission tractor mobilization with CBN escrow dispute shelter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Localized SMS &amp; Yoruba dialect spray window weather alerts</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">Standardized Workflow:</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>Pin Farm</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Crop Schedule</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Book Tractor</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Escrow Sale</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>Start as Farmer</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="production">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="domain" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§4.6 FRAMEWORK</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available Now</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">Commercial Farms &amp; Agribusinesses</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Multi-hectare industrial estates (50–5,000+ Ha) operating dispersed agrarian parcels with dedicated agronomy, accounting, and security teams.</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" /> Key Operational Bottlenecks</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Uncontrolled diesel pilferage, disconnected field-worker logs, chaotic spreadsheet rosters, and opaque real-time cost-per-hectare variance.</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Native Platform Capabilities</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Central executive command dashboard with multi-estate aggregation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Granular RBAC permissions (General Manager, Chief Agronomist, Storekeeper)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Inventory batch barcode tracking and automated re-order thresholds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Comprehensive cost-per-hectare unit economics &amp; harvest ledger</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">Standardized Workflow:</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>Org Setup</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Budget Cap</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Issue Stock</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Weighbridge Log</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/solutions`}>
                    <span>Explore Enterprise Solutions</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="machinery">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="cloud_download" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§4.4 FRAMEWORK</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available · 0% Fee</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">Machinery Fleet Owners &amp; Syndicates</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Tractor proprietors, implement fabricators, and commercial hiring syndicates operating plows, harrows, ridges, and combined harvesters.</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" /> Key Operational Bottlenecks</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Costly idle downtime between scattered orders, chronic payment defaults by farmers, excessive dead-mile transit, and endless disputes on acreage completed.</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Native Platform Capabilities</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Fleet registry with vetted operator-crew bindings and implement pairing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Geofenced GPS tracking with automatic start/stop work polygon validation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Automated 48-hour escrow payout directly to bank upon client sign-off</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Smart geographic job clustering engine (&quot;Cluster Demand Within 15km&quot;)</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">Standardized Workflow:</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>List Fleet</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Accept Jobs</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>GPS Execution</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>48h Escrow Pay</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>Register Equipment Fleet</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="services">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="engineering" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§4.5 FRAMEWORK</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available Now</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">Skilled Agricultural Service Providers</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Certified independent spray applicators, pruning specialists, manual ridging gangs, soil analysts, and trained extension agents.</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" /> Key Operational Bottlenecks</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Irregular gig availability, delayed daily wage disbursements, safety risks without training verification, and zero verifiable credentials to command higher rates.</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Native Platform Capabilities</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Verified digital credential profiles &amp; ADP skill certification badges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Synchronized booking calendar with local cluster availability toggles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Standardized transparent hectare and man-day rate card templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Tamper-proof proof-of-work photo uploads with geotag validation</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">Standardized Workflow:</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>Verify ID</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Job Alerts</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Execute Task</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Rate &amp; Settle</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>Join Provider Network</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="inputs">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="storefront" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§6.2 FRAMEWORK</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available Now</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">Input Suppliers &amp; Agro-Dealers</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Distributors and licensed merchants of certified seeds, NPK/urea fertilizers, bio-pesticides, and smallholder farming tools across regional towns.</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" /> Key Operational Bottlenecks</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Unfair competition from fake inputs damaging customer trust, unexpected inventory expiries, bad customer credit risk, and expensive rural last-mile delivery.</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Native Platform Capabilities</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Verified Merchant Badging with NASC seed certification tagging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Automated demand matching based on registered farm crop schedules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Batch QR traceability defending your products against counterfeiters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Instant escrow payout on customer verification OTP pick-up</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">Standardized Workflow:</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>List Certified</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Crop Matching</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Fulfill Orders</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Instant Payout</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>Onboard Agro-dealership</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="offtake">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="factory" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§6.4 FRAMEWORK</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available Now</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">Produce Buyers &amp; Food Processors</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Starch manufacturers, flour millers, feed mills, breweries, and institutional bulk purchasers sourcing clean grain and tuber volumes.</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" /> Key Operational Bottlenecks</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Unreliable moisture specifications, hidden sand/stone adulteration, erratic supply timetables, and multi-layered broker markups inflating procurement costs.</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Native Platform Capabilities</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Pre-harvest yield forecasting across geofenced smallholder clusters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Verified Certificate of Analysis (COA) uploads for aflatoxin &amp; moisture levels</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Digital weighbridge gate-pass clearance linked directly to escrow settlement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Forward contracting mechanism with guaranteed price floor lock-in</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">Standardized Workflow:</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>Post RFQ</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Lock Escrow</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>GPS Haulage</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Weighbridge Sign</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/marketplace`}>
                    <span>Access Wholesale Produce</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="logistics">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="local_shipping" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§6.5 FRAMEWORK</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Available Now</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">Logistics &amp; Haulage Operators</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Truck owners, flatbed haulers, and refrigerated van drivers transporting goods from remote farmgate pick-up points to city wholesale hubs.</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" /> Key Operational Bottlenecks</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Costly empty backhauls from urban depots, inaccessible muddy rural feeder roads without prior notice, and high post-harvest perishability risks during vehicle breakdowns.</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Native Platform Capabilities</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>On-demand dispatch matching farmgate harvest manifests to route capacity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Digital Waybills with cryptographic QR verification for state checkpoints</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Optimized feeder road navigation using agrarian telemetry and weather forecasts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Fast automatic escrow diesel release &amp; final delivery settlement</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">Standardized Workflow:</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>Add Trucks</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Match Loads</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>QR Waybill</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Fast Settlement</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary-container text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm" href={`/${lang}/sign-up`}>
                    <span>Join Logistics Mesh</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="federations">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="diversity_3" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§10.2 FRAMEWORK</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-tertiary-container font-bold"><span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" /> Phase 2 Pilot</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">Cooperatives &amp; Farmer Federations</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Registered apex agricultural unions, community credit societies, and communal farmer unions coordinating collective production.</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" /> Key Operational Bottlenecks</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Chaotic paper-based member ledgers, complex bulk input distribution disputes, underutilized pooled tractors, and friction during shared harvest dividend disbursements.</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Native Platform Capabilities</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Unified digital member registry with NIN/BVN validation and mapped plots</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Aggregated input demand ordering unlocking Tier-1 factory bulk discounts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Communal syndicate machinery booking roster with automated priority queues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Multi-signature escrow wallet for collective off-take payouts</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">Standardized Workflow:</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>Enroll Group</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Pool Demand</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Deploy Fleet</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Split Revenue</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-surface-container text-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-surface-container-high transition-colors shadow-sm" href={`/${lang}/solutions`}>
                    <span>Connect Cooperative</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
              <div className="solution-card group flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all p-space-lg relative overflow-hidden" data-category="institutional">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-md">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="account_balance" className="text-primary text-[24px]" />
                    <span className="font-label-sm text-label-sm font-bold text-primary">§10.3 / §10.4 / §9.2</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-primary font-bold"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Institutional</span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-headline-md text-headline-md text-primary">Institutions, Lenders &amp; NGOs</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Commercial banks, state agricultural development programmes (ADPs), microfinance lenders, and international donor projects.</p>
                </div>
                <div className="mt-space-md p-space-sm rounded-lg bg-error-container/40 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-on-error-container uppercase font-bold flex items-center gap-1"><Icon name="report_problem" className="text-[15px]" /> Key Operational Bottlenecks</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Prevalence of &apos;ghost farmers&apos; in subsidy programs, lack of verifiable historical yield dossiers for credit scoring, and unmonitored rural interventions.</p>
                </div>
                <div className="mt-space-md flex flex-col gap-space-xs flex-grow">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Native Platform Capabilities</span>
                  <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Aggregated cadastral geospatial intelligence and satellite vegetative NDVI index</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Automated verifiable credit readiness dossiers based on documented cycles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>Smart voucher redemption system ensuring agricultural input subsidies reach verified soil</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="check_circle" className="text-secondary text-[16px] mt-0.5" />
                      <span>NDPA 2023 certified zero-knowledge anonymized cohort reporting</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-md p-space-sm bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold block mb-1">Standardized Workflow:</span>
                  <div className="flex items-center justify-between text-[11px] font-label-sm text-primary font-medium">
                    <span>Scope Target</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Audit Plots</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Issue Voucher</span>
                    <Icon name="arrow_forward" className="text-[12px] text-outline" />
                    <span>Track Yield</span>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm">
                  <Link className="w-full inline-flex items-center justify-center gap-space-xs bg-primary text-on-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-colors shadow-sm" href={`/${lang}/partners`}>
                    <span>Partner with CultivaNode</span>
                    <Icon name="east" className="text-[18px]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">DEPLOYMENT ROADMAP &amp; CAPABILITY MATRIX</span>
              <h2 className="font-headline-lg text-headline-lg text-primary">Phase 1 Live Capabilities vs. Phased Extensions</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">CultivaNode provides immediate, production-grade rails across our four anchor states (Oyo, Ogun, Ondo, and Osun). Review the availability schedule across each agricultural stakeholder category below.</p>
            </div>
            <div className="w-full bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container font-label-sm text-label-sm text-on-surface uppercase tracking-wider">
                      <th className="py-space-md px-space-lg">Stakeholder Role</th>
                      <th className="py-space-md px-space-md">Phase 1: Live Now (Q1–Q2 2025)</th>
                      <th className="py-space-md px-space-md">Phase 2: Scale Pilot (Q3 2025)</th>
                      <th className="py-space-md px-space-md">Phase 3: National Mesh (2026)</th>
                      <th className="py-space-md px-space-md text-right">Escrow Protection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 font-body-sm text-body-sm text-on-surface">
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="person" className="text-secondary text-[18px]" /> Smallholder Farmers</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />GPS Polygons, Tractor Hire, Calendars</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">USSD Offline Booking, Micro-crop insurance</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Cross-border export clearance</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">100% Covered</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="domain" className="text-secondary text-[18px]" /> Commercial Agribusiness</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Multi-Estate Dashboard, Inventory, Roles</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">ERP API Integrations (SAP/QuickBooks)</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Automated Drone NDVI Analysis</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">100% Covered</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="precision_manufacturing" className="text-secondary text-[18px]" /> Machinery Syndicates</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Fleet Tracking, Route Clustering, Escrow</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Telematics CAN-bus Fuel Sensors</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Autonomous Tractor Pilot Rails</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">100% Covered</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="badge" className="text-secondary text-[18px]" /> Ag Service Providers</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Verified Profiles, Calendar Booking, Proof of Work</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Certified Extension Apprenticeships</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Master Guild Rating Protocols</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">100% Covered</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="storefront" className="text-secondary text-[18px]" /> Input Suppliers</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Certified Catalog, Crop Auto-match, Escrow</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Consignment Inventory Financing</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Manufacturer Direct Depot Mesh</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">100% Covered</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="factory" className="text-secondary text-[18px]" /> Produce Offtakers</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Direct Farmgate RFQs, COA Validation</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Structured Forward Contracts</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Commodity Exchange Hedging API</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">100% Covered</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="rv_hookup" className="text-secondary text-[18px]" /> Logistics Operators</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Digital Waybills, Load Matching, Fast Escrow</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Cold Chain Temperature Telemetry</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Multi-modal Rail Linkage Integration</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">100% Covered</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="groups" className="text-secondary text-[18px]" /> Cooperatives &amp; Federations</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Member Registry, Clustered Plot Mapping</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Multi-Sig Apex Treasury &amp; Bulk Purchasing</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Cooperative Credit Union Rails</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">100% Covered</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-md px-space-lg font-semibold text-primary flex items-center gap-2"><Icon name="account_balance" className="text-secondary text-[18px]" /> Institutions &amp; Lenders</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-secondary font-medium"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Cadastral Zones, Subsidies &amp; Dossiers</span>
                      </td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Underwriting Scoring Engine API</td>
                      <td className="py-space-md px-space-md text-on-surface-variant">Central Sovereign Agrarian Dashboard</td>
                      <td className="py-space-md px-space-md text-right font-semibold text-primary">Institutional</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full max-w-7xl mx-auto px-margin-desktop py-space-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-bold uppercase tracking-wider"><Icon name="location_on" className="text-[18px]" /> Southwest Regional Operating Hubs</div>
              <h2 className="font-headline-lg text-headline-lg text-primary">Ground-Level Support Across 28 Cluster Centers</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">You don&apos;t need to be tech-savvy to leverage the CultivaNode mesh. In every pilot cluster across Oyo, Ogun, Ondo, and Osun states, our certified Cluster Agents and partner Agricultural Development Programmes (ADPs) walk your farm, map boundaries, and ensure prompt payments.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
                <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-sm">
                  <Icon name="verified_user" className="text-primary text-[22px] mt-0.5" />
                  <div>
                    <span className="font-label-lg text-label-lg text-primary block">CBN-Sanctioned Escrow</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Funds stay locked safely in tier-1 bank custody until works are verified.</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-sm">
                  <Icon name="translate" className="text-primary text-[22px] mt-0.5" />
                  <div>
                    <span className="font-label-lg text-label-lg text-primary block">Dual-Language Agents</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Full support in Yoruba and English across all field stations and call lines.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-primary font-bold">Active Cluster Presence</span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold"><span className="w-2 h-2 rounded-full bg-secondary" /> 4 States Live</span>
              </div>
              <div className="flex flex-col gap-space-xs font-body-sm text-body-sm">
                <div className="p-space-sm bg-surface-container-low rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-label-md text-label-md text-primary block">Oyo State Cluster Node</span>
                    <span className="text-on-surface-variant text-[12px]">Saki, Iseyin, Ogbomoso &amp; Oke-Ogun Hub</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold">12 Centers</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-label-md text-label-md text-primary block">Ogun State Cluster Node</span>
                    <span className="text-on-surface-variant text-[12px]">Abeokuta, Ijebu-Ode &amp; Sagamu Ag-Corridor</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold">7 Centers</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-label-md text-label-md text-primary block">Ondo State Cluster Node</span>
                    <span className="text-on-surface-variant text-[12px]">Akure, Owo &amp; Ondo Agro-Forestry Belts</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold">5 Centers</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-label-md text-label-md text-primary block">Osun State Cluster Node</span>
                    <span className="text-on-surface-variant text-[12px]">Osogbo, Ilesa &amp; Ife Grain Mesh</span>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded font-bold">4 Centers</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-primary-container text-on-primary py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <div className="bg-primary/40 rounded-lg p-space-lg md:p-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-sm">
              <div className="flex flex-col gap-space-xs max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 self-center md:self-start bg-secondary-fixed text-on-secondary-fixed px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-bold"><Icon name="support_agent" className="text-[16px]" /> South-West Operational Advisory</div>
                <h2 className="font-headline-lg text-headline-lg text-on-primary font-bold">Unsure Which Role Fits Your Operational Model?</h2>
                <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">Speak directly with a certified agrarian advisor, visit an authorized South-West cluster center, or schedule an on-farm mapping assessment for your acreage.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-space-sm w-full md:w-auto">
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim px-space-lg py-space-sm rounded-lg font-label-lg text-label-lg font-bold transition-colors shadow-sm" href={`/${lang}/contact`}>
                  <span>Schedule Advisor Call</span>
                  <Icon name="calendar_month" className="text-[18px]" />
                </Link>
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs bg-surface-container-lowest text-primary hover:bg-surface-container px-space-lg py-space-sm rounded-lg font-label-lg text-label-lg font-semibold transition-colors shadow-sm" href={`/${lang}/waitlist`}>
                  <span>Locate Nearest Cluster</span>
                  <Icon name="near_me" className="text-[18px]" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
