// Ported from the "onboarding_review_ready_cultivanode_agrarian_gateway" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function OnboardingReview({ lang = "en" }: ScreenProps) {
  return (
    <div className="screen flex flex-col justify-center overflow-hidden">
      <div className="flex flex-col w-full">
        <div className="w-full max-w-7xl mx-auto px-margin sm:px-margin-tablet lg:px-margin-desktop py-space-md lg:py-space-xl">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md lg:p-space-lg mb-space-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
              <div>
                <div className="flex items-center gap-space-sm mb-space-xs">
                  <span className="bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">Step 4 of 4 · Final Verification</span>
                  <span className="text-on-surface-variant font-label-sm text-label-sm">• Ref: CN-AGR-OYO-08492</span>
                </div>
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">Review &amp; Ready for Activation</h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Verify cadastral boundaries, verified tenancy deed, agronomic variety plan, and matched mechanization syndicates before minting the operational node.</p>
              </div>
              <div className="flex items-center gap-space-sm self-start md:self-auto bg-surface-container-low px-space-md py-space-sm rounded-lg">
                <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-metric-num text-metric-num shadow-sm">
                  <Icon name="task_alt" className="text-[20px]" />
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Audit Confidence</div>
                  <div className="font-headline-sm text-headline-sm text-primary font-bold">100% Validated</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm relative">
              <div className="flex items-center gap-space-sm bg-surface-container-low p-space-sm rounded-lg">
                <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-sm font-bold shadow-sm">
                  <Icon name="check" className="text-[16px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-primary font-bold truncate">1. Identity &amp; NIN</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">Verified · BVN Linked</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-low p-space-sm rounded-lg">
                <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-sm font-bold shadow-sm">
                  <Icon name="check" className="text-[16px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-primary font-bold truncate">2. Farm Holding Setup</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">12.4 Ha PostGIS Polygon</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-low p-space-sm rounded-lg">
                <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-sm font-bold shadow-sm">
                  <Icon name="check" className="text-[16px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-primary font-bold truncate">3. Crop Plan &amp; Inputs</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">Maize + Cassava Relay</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm bg-primary-container text-on-primary p-space-sm rounded-lg shadow-sm">
                <div className="w-7 h-7 rounded-full bg-on-primary text-primary-container flex items-center justify-center text-sm font-bold">
                  <Icon name="flag" filled className="text-[16px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-on-primary font-bold truncate">4. Review &amp; Ready</span>
                  <span className="font-label-sm text-label-sm text-inverse-primary font-medium">Current Authorization</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            <div className="lg:col-span-8 flex flex-col gap-space-lg">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
                <div className="flex items-center justify-between pb-space-md mb-space-md bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-lg rounded-t-xl">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="badge" className="text-[20px]" />
                    </div>
                    <div>
                      <h2 className="font-headline-md text-headline-md text-primary font-bold">Agrarian Identity &amp; Tenancy Protocol</h2>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Centralized Agrarian ID Network Node: CN-AGR-OYO-08492</span>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-surface-container" type="button">
                    <Icon name="edit" className="text-[16px]" />
                    <span>Edit Step 1</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-space-xs">Registered Producer</div>
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">Adebayo K. Alabi</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">+234 803 942 8110</div>
                    </div>
                    <div className="mt-space-sm pt-space-sm flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">BVN Tier 1</span>
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Verified</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-space-xs">NIMC Verified Token</div>
                      <div className="font-headline-sm text-headline-sm text-on-surface font-mono font-bold tracking-wider">2489••••0194</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Biometric Facematch 98.4%</div>
                    </div>
                    <div className="mt-space-sm pt-space-sm flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">NDPA 2023 Shield</span>
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> SHA-256 Valid</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider mb-space-xs">Tenure &amp; Consent</div>
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">Family / Baale Consent</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Deed: BAALE-ISY-2024-082</div>
                    </div>
                    <div className="mt-space-sm pt-space-sm flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Iseyin Traditional Council</span>
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Attested</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
                <div className="flex items-center justify-between pb-space-md mb-space-md bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-lg rounded-t-xl">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="explore" className="text-[20px]" />
                    </div>
                    <div>
                      <h2 className="font-headline-md text-headline-md text-primary font-bold">Cadastral Boundary &amp; Soil Dossier</h2>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Oke-Ogun Savanna Basin Cluster · Iseyin LGA, Oyo State</span>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-surface-container" type="button">
                    <Icon name="edit" className="text-[16px]" />
                    <span>Edit Step 2</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-start">
                  <div className="md:col-span-6 rounded-lg overflow-hidden relative shadow-sm h-64 bg-surface-container">
                    <div className="w-full h-full bg-cover bg-center" data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/ff010f1ca089.webp')" }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-space-md">
                      <div className="flex items-center justify-between text-on-primary">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold bg-primary/80 px-2 py-0.5 rounded">Centroid: 8.2140° N, 3.5820° E</span>
                        <span className="font-label-sm text-label-sm bg-secondary px-2 py-0.5 rounded font-bold">12.4 Hectares (124,000 m²)</span>
                      </div>
                      <div className="text-on-primary font-body-sm text-body-sm mt-1">Oluwaseun Agro-Ventures Perimeter: 1,780 meters</div>
                    </div>
                  </div>
                  <div className="md:col-span-6 flex flex-col gap-space-sm">
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="bg-surface-container-low p-space-sm rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Agro-Ecological Belt</div>
                        <div className="font-headline-sm text-headline-sm text-primary font-bold">Derived Savanna</div>
                        <div className="font-label-sm text-label-sm text-secondary">Bimodal onset April–May</div>
                      </div>
                      <div className="bg-surface-container-low p-space-sm rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Soil Type &amp; Pedology</div>
                        <div className="font-headline-sm text-headline-sm text-primary font-bold">Ferric Luvisols</div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">pH 6.4 · Low salinity</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="bg-surface-container-low p-space-sm rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Field Topography</div>
                        <div className="font-headline-sm text-headline-sm text-primary font-bold">2.4% Slope</div>
                        <div className="font-label-sm text-label-sm text-secondary">Optimal tractor drainage</div>
                      </div>
                      <div className="bg-surface-container-low p-space-sm rounded-lg">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Boundary Integrity</div>
                        <div className="font-headline-sm text-headline-sm text-secondary font-bold">Polygon Closed</div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">0 Overlap Discrepancy</div>
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <Icon name="cloud" className="text-[18px] text-primary" />
                        <span className="font-body-sm text-body-sm text-on-surface font-semibold">Micro-basin Rainfall Forecast</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">1,180mm Season Avg</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
                <div className="flex items-center justify-between pb-space-md mb-space-md bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-lg rounded-t-xl">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="agriculture" className="text-[20px]" />
                    </div>
                    <div>
                      <h2 className="font-headline-md text-headline-md text-primary font-bold">Crop Varieties &amp; Production Calendar</h2>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Early Season 2026 Production Slate · Intercropped Relay Configuration</span>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-primary transition-colors py-1 px-2 rounded-md hover:bg-surface-container" type="button">
                    <Icon name="edit" className="text-[16px]" />
                    <span>Edit Step 3</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-md">
                  <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-space-xs">
                        <span className="bg-primary-container text-on-primary font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold">Primary Grain</span>
                        <span className="font-label-sm text-label-sm text-secondary font-bold">7.2 Hectares (58%)</span>
                      </div>
                      <div className="font-headline-sm text-headline-sm text-primary font-bold">Maize (SAMMAZ-15 Hybrid)</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Drought-tolerant hybrid. Plant window: April 15 – May 5. Target yield: 4.8 MT/Ha. Projected total: 34.56 MT.</div>
                    </div>
                    <div className="mt-space-md pt-space-sm bg-surface-container-lowest p-space-sm rounded">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Yield Projection Index</span>
                        <span className="font-label-sm text-label-sm text-primary font-bold">4.8 MT / Ha (+18% Cluster Avg)</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "82%" }} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-space-xs">
                        <span className="bg-secondary text-on-secondary font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold">Relay Tuber</span>
                        <span className="font-label-sm text-label-sm text-secondary font-bold">5.2 Hectares (42%)</span>
                      </div>
                      <div className="font-headline-sm text-headline-sm text-primary font-bold">Cassava (TME-419 Stems)</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">High-starch industrial processing variety. Maturity: 10-12 months. Target yield: 24.0 MT/Ha. Projected total: 124.8 MT.</div>
                    </div>
                    <div className="mt-space-md pt-space-sm bg-surface-container-lowest p-space-sm rounded">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Industrial Starch Factor</span>
                        <span className="font-label-sm text-label-sm text-primary font-bold">28.4% Starch Potential</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-container h-full rounded-full" style={{ width: "90%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg">
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">Agronomic Relay Calendar (2026–2027)</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Bimodal Dual-Window Plan</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Apr – May 2026</div>
                      <div className="font-label-md text-label-md font-bold text-primary mt-0.5">Tillage &amp; Sowing</div>
                      <div className="text-[11px] text-secondary">Tractor Syndicate #04</div>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Jun – Jul 2026</div>
                      <div className="font-label-md text-label-md font-bold text-primary mt-0.5">Top-Dress &amp; Weeding</div>
                      <div className="text-[11px] text-on-surface-variant">Urea / NPK 15-15-15</div>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Aug – Sep 2026</div>
                      <div className="font-label-md text-label-md font-bold text-secondary mt-0.5">Maize Harvest</div>
                      <div className="text-[11px] text-secondary">Grain Aggregator Lock</div>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded">
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Feb – Mar 2027</div>
                      <div className="font-label-md text-label-md font-bold text-secondary mt-0.5">Cassava Lift</div>
                      <div className="text-[11px] text-secondary">Industrial Starch Offtake</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
                <div className="flex items-center justify-between pb-space-md mb-space-md bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-lg rounded-t-xl">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="hub" className="text-[20px]" />
                    </div>
                    <div>
                      <h2 className="font-headline-md text-headline-md text-primary font-bold">Pre-Matched Syndicate Services</h2>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">South-West Machinery &amp; Input Aggregation Pool</span>
                    </div>
                  </div>
                  <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-xs font-bold">0% Pilot Commission</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">TRACTOR MOBILIZATION</span>
                        <Icon name="precision_manufacturing" className="text-[18px] text-secondary" />
                      </div>
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">Massey Ferguson 375</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Saki West Syndicate #04</div>
                      <div className="font-body-sm text-body-sm text-primary font-semibold mt-1">₦18,500 / Hectare</div>
                    </div>
                    <div className="mt-space-sm pt-space-sm flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Operator: Jimoh Rasaq</span>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">Linked</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">CERTIFIED SEEDS &amp; STEMS</span>
                        <Icon name="inventory_2" className="text-[18px] text-secondary" />
                      </div>
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">18 Bags SAMMAZ-15</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">+ TMS Stem Bundles</div>
                      <div className="font-body-sm text-body-sm text-primary font-semibold mt-1">Premier Seeds IITA Spec</div>
                    </div>
                    <div className="mt-space-sm pt-space-sm flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Dealer: Oyo-Ogun Hub</span>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">Reserved</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">EXTENSION AGENT</span>
                        <Icon name="school" className="text-[18px] text-secondary" />
                      </div>
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">Engr. B. Ogunlesi</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Oyo State ADP Agronomist</div>
                      <div className="font-body-sm text-body-sm text-primary font-semibold mt-1">Iseyin Zonal Office</div>
                    </div>
                    <div className="mt-space-sm pt-space-sm flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Zone Inspection</span>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">Assigned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-space-lg">
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg sticky top-24">
                <div className="flex items-center gap-space-sm mb-space-md pb-space-md bg-surface-container-low -mx-space-lg -mt-space-lg px-space-lg pt-space-lg rounded-t-xl">
                  <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                    <Icon name="rocket_launch" className="text-[20px]" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Final Activation Authorization</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Mint Tier-1 Agrarian Node</p>
                  </div>
                </div>
                <div className="space-y-space-sm mb-space-md">
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="flex items-center gap-space-xs text-on-surface-variant font-medium"><Icon name="verified" className="text-[16px] text-secondary" /> NIN Biometric Match</span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">Passed</span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="flex items-center gap-space-xs text-on-surface-variant font-medium"><Icon name="verified" className="text-[16px] text-secondary" /> PostGIS Cadastral Closure</span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">12.4 Ha Valid</span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="flex items-center gap-space-xs text-on-surface-variant font-medium"><Icon name="verified" className="text-[16px] text-secondary" /> Baale Traditional Attestation</span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">Deed Bound</span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="flex items-center gap-space-xs text-on-surface-variant font-medium"><Icon name="verified" className="text-[16px] text-secondary" /> Pilot Mechanization Escrow</span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">₦0.00 Pre-fee</span>
                  </div>
                </div>
                <button className="w-full mb-space-md flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors py-2.5 px-space-md rounded-lg font-label-md text-label-md" type="button">
                  <Icon name="picture_as_pdf" className="text-[18px] text-secondary" />
                  <span>Download Farm Cadastral Certificate</span>
                </button>
                <div className="bg-surface-container-low p-space-md rounded-lg mb-space-md">
                  <label className="flex items-start gap-space-sm cursor-pointer select-none">
                    <input defaultChecked className="mt-0.5 w-4 h-4 rounded text-primary-container focus:ring-secondary accent-primary-container cursor-pointer" id="consentCheckbox" type="checkbox" />
                    <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">I hereby attest that all submitted cadastral boundaries, land tenancy rights, and variety selections for Oluwaseun Agro-Ventures are authentic under the <strong>South-West Agricultural Pilot Framework</strong> and governed under the <strong>Nigeria Data Protection Act (NDPA 2023)</strong>.</span>
                  </label>
                </div>
                <div className="flex flex-col gap-space-sm">
                  <Link className="w-full flex items-center justify-center gap-space-sm bg-primary-container hover:bg-primary text-on-primary py-3 px-space-lg rounded-lg font-label-lg text-label-lg transition-all shadow-sm hover:shadow-md text-center" href={`/${lang}/account`}>
                    <span>Confirm &amp; Launch Farm Operations Hub</span>
                    <Icon name="arrow_forward" className="text-[18px]" />
                  </Link>
                  <button className="w-full flex items-center justify-center gap-space-xs bg-surface-container-lowest hover:bg-surface-container text-on-surface py-2.5 px-space-md rounded-lg font-label-md text-label-md transition-colors" type="button">
                    <Icon name="save" className="text-[16px]" />
                    <span>Save as Draft &amp; Return Later</span>
                  </button>
                </div>
                <div className="mt-space-lg pt-space-md bg-surface-container-low -mx-space-lg -mb-space-lg p-space-md rounded-b-xl">
                  <div className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2 text-center">Regulatory &amp; Financial Partners</div>
                  <div className="flex items-center justify-center gap-space-md text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <Icon name="shield" className="text-[16px] text-secondary" />
                      <span className="font-label-sm text-label-sm font-semibold">Oyo ADP</span>
                    </div>
                    <span className="text-outline-variant">•</span>
                    <div className="flex items-center gap-1">
                      <Icon name="lock" className="text-[16px] text-secondary" />
                      <span className="font-label-sm text-label-sm font-semibold">Providus Escrow</span>
                    </div>
                    <span className="text-outline-variant">•</span>
                    <div className="flex items-center gap-1">
                      <Icon name="gavel" className="text-[16px] text-secondary" />
                      <span className="font-label-sm text-label-sm font-semibold">NDPA 2023</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
                <div className="flex items-center gap-space-sm mb-space-sm">
                  <Icon name="fingerprint" className="text-secondary text-[20px]" />
                  <span className="font-label-md text-label-md font-bold text-primary">Agrarian Mesh Ledger Spec</span>
                </div>
                <div className="space-y-space-xs text-xs font-mono text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>LEDGER PROTOCOL:</span>
                    <span className="font-semibold text-primary">CN-CORE v2.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLUSTER ID:</span>
                    <span className="font-semibold text-primary">OKE-OGUN-04</span>
                  </div>
                  <div className="flex justify-between">
                    <span>POLYGON HASH:</span>
                    <span className="font-semibold text-primary truncate max-w-[130px]">8a7b93f1c24...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ESCROW FACILITY:</span>
                    <span className="font-semibold text-secondary">Zero-Commission Pilot</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
