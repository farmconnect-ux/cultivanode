// Ported from the "how_it_works_trust_framework_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function HowItWorks({ lang }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-space-md max-w-4xl">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary" />
              <span>Transparency &amp; Operational Protocol · /en/how-it-works</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight md:text-[2.75rem] md:leading-[3.25rem]">How CultivaNode Powers Verifiable Agricultural Collaboration</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">Step-by-step operational journeys for smallholders, tractor syndicates, institutional offtakers, and field agents — backed by sub-meter PostGIS spatial bounds, CBN-compliant institutional escrow custody, and strict Nigeria Data Protection Act (NDPA 2023) governance.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm pt-space-md">
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low shadow-sm">
                <Icon name="verified_user" filled className="text-[20px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">100% Escrow Protection</span>
              </div>
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low shadow-sm">
                <Icon name="pin_drop" filled className="text-[20px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">Sub-meter PostGIS Precision</span>
              </div>
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low shadow-sm">
                <Icon name="timer" filled className="text-[20px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">48h Dispute Resolution SLA</span>
              </div>
              <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low shadow-sm">
                <Icon name="gavel" filled className="text-[20px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">Zero Fabricated Claims</span>
              </div>
            </div>
          </div>
          <div className="mt-space-xl p-space-lg rounded-xl bg-surface-container-lowest shadow-md grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Validated Hectares</span>
                <span className="font-label-xs text-label-sm text-secondary bg-surface-container px-space-xs py-0.5 rounded-full font-semibold">Oyo &amp; Ogun</span>
              </div>
              <span className="font-metric-num text-metric-num text-primary">14,820 ha</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Polygons walked with mobile RTK differential correction.</p>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Escrow Settled (Pilot)</span>
                <span className="font-label-xs text-label-sm text-secondary bg-surface-container px-space-xs py-0.5 rounded-full font-semibold">CBN-Compliant</span>
              </div>
              <span className="font-metric-num text-metric-num text-primary">₦412,850,000</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Zero unauthorized withdrawals or unverified disbursements.</p>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Avg Fleet Deadhead</span>
                <span className="font-label-xs text-label-sm text-secondary bg-surface-container px-space-xs py-0.5 rounded-full font-semibold">-64% Saved</span>
              </div>
              <span className="font-metric-num text-metric-num text-primary">4.2 km</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Reduced tractor transit waste via localized demand clustering.</p>
            </div>
          </div>
        </section>
        <section className="px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
            <div className="max-w-2xl">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">§4.11 Operational Sequences</span>
              <h2 className="font-headline-lg text-headline-lg text-primary mt-space-xs">Participant Lifecycle &amp; Execution Workflows</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">Explore how the CultivaNode mesh orchestrates accountability, physical evidence checks, and financial escrow for each distinct role in the agricultural value chain.</p>
            </div>
            <div className="inline-flex p-1 bg-surface-container rounded-lg self-start md:self-auto shadow-sm" role="tablist">
              <button aria-selected="true" className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all bg-primary-container text-on-primary font-bold shadow-sm" id="tab-farmer" role="tab" type="button">The Farmer</button>
              <button aria-selected="false" className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all text-on-surface-variant hover:text-on-surface" id="tab-fleet" role="tab" type="button">Tractor Fleet Owner</button>
              <button aria-selected="false" className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all text-on-surface-variant hover:text-on-surface" id="tab-buyer" role="tab" type="button">Produce Offtaker</button>
              <button aria-selected="false" className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all text-on-surface-variant hover:text-on-surface" id="tab-agent" role="tab" type="button">Field Extension Agent</button>
            </div>
          </div>
          <div className="flex flex-col gap-space-lg" id="journey-farmer">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="agriculture" filled className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">The Smallholder &amp; Farm Owner</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Designed for individual growers managing 1 to 50 hectares in agrarian zones like Iseyin, Saki, Sagamu, and Ondo Central. Replaces informal middlemen with bank-grade mechanization orders and verified sales contracts.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low mt-space-lg flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Core Verification Artifact</span>
                  <span className="font-headline-sm text-headline-sm text-primary">PostGIS Cadastral Parcel ID</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Verified by Baale local signoff + satellite NDRE canopy index validation.</p>
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">1</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Register &amp; Biometric Verify</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">NIMC Tier 1</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Zero friction SMS/OTP registration followed by an instant National Identification Number (NIN) facial match. Farmers receive a permanent cryptographic identity preventing identity fraud and syndicate blacklisting.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">2</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Delineate Farm Cadastre</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Sub-meter RTK</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Walk your farm boundary using our offline-capable mobile app or provide coordinates through an authorized Field Agent. Boundary includes Baale or communal land allocation verification to remove boundary conflicts.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">3</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Plan Agronomic Production</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">NCRI/IITA Calibrated</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Select vetted cultivars like SAMMAZ-15 White Maize or TME-419 Cassava. CultivaNode generates a localized gdd-calibrated calendar synchronized with South-West bimodal precipitation patterns.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">4</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Book Mechanization via Escrow</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Providus Trust Vault</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Request plowing, harrowing, or ridging from regional syndicates. The exact service cost is deposited into partner bank escrow. Operators only receive disbursement after geotagged proof of plowing is confirmed.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">5</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Harvest &amp; Direct Monetization</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">0% Middleman Cut</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Log certified bag counts and lab moisture tests directly to the off-taker registry. Verified buyers inspect digital certificates and lock funds prior to truck arrival at your cluster aggregation point.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden flex flex-col gap-space-lg" id="journey-fleet">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="precision_manufacturing" filled className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Machinery Fleet Syndicates</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">For commercial tractor owners, implement rental cooperatives, and independent mechanics servicing clusters across Oyo, Ogun, Osun, and Ondo states.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low mt-space-lg flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Fleet Guarantee</span>
                  <span className="font-headline-sm text-headline-sm text-primary">Guaranteed Fuel &amp; Hectare Escrow</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Never mobilize equipment without 100% of the service fee pre-locked in trusted custody.</p>
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">1</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Register Equipment &amp; Service Radius</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Asset Telematics</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Upload tractor specifications (e.g. Massey Ferguson 375, John Deere 5075E), hitched implements (disc plows, harrows, boom sprayers), and verified operator credentials with max operational distance from base depot.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">2</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Review Clustered Farm Dispatch</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Smart Routing</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Instead of single fragmented hectare calls, our dispatch engine bundles 5–15 contiguous smallholder requests into unified 50-hectare runs within an 8km perimeter to maximize diesel efficiency.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">3</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Farmgate GPS Check-In</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Geofenced Arrival</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Operator verifies physical arrival by tapping check-in within the parcel polygon. A mutual arrival notification is transmitted to the farm owner and local field extension officer.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">4</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Upload Geotagged Proof of Work (PoW)</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Timestamp + EXIF</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Upon finishing the contracted operation, operator snaps high-resolution furrow photos. The app stamps latitude, longitude, elevation, bearing, and engine telemetry into an encrypted cryptographic manifest.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">5</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Direct Escrow Payout (0% Platform Cut)</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">48h SLA</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">The farmer reviews and releases the funds. If the farmer does not dispute within 48 hours and boundary coordinates show completed tillage coverage, escrow releases 100% of funds directly to your verified commercial bank account.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden flex flex-col gap-space-lg" id="journey-buyer">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="warehouse" filled className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Produce Offtakers &amp; Industrial Millers</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Engineered for feed mills, breweries, starch processing factories, and food manufacturers seeking audited origin grain, cassava, and cocoa batches.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low mt-space-lg flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Quality Safeguard</span>
                  <span className="font-headline-sm text-headline-sm text-primary">Pre-Disbursement Lab Tests</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Moisture &lt;13% and aflatoxin &lt;10ppb certificates linked directly to the purchase invoice.</p>
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">1</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Browse Traceable Farmgate Lots</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Full Traceability</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Filter by crop variety, harvesting date, moisture content percentage, and origin Local Government Area (LGA). Every listing links directly to the verified farm polygon.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">2</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Lock Lot Funds in Providus/Wema Escrow</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">No Front-Risk</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Your purchase capital is deposited into a segregated settlement vault. Funds remain completely safeguarded under Central Bank of Nigeria custody guidelines until physical cargo inspection.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">3</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Monitored Haulage &amp; Electronic Waybill</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Live GPS Tracking</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Track certified logistics haulers dispatched to regional aggregation centers. Drivers scan QR-coded waybills at farmgate departure, eliminating cargo swapping or diversion en route.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">4</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Weighbridge Clearance &amp; Automated Settlement</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Direct Disbursal</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">The truck reaches your processing facility or aggregator weighbridge. When the weight slip is verified against moisture tolerances, the escrow smart contract instantly settles payment to the farm cooperative.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden flex flex-col gap-space-lg" id="journey-agent">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-lg shadow-md flex flex-col justify-between">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="badge" filled className="text-[28px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Accredited Extension Agents</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Field personnel partnered with Agricultural Development Programmes (ADPs), university agronomists, and rural cooperatives bridging the last-mile digital divide.</p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low mt-space-lg flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Stipend Rail</span>
                  <span className="font-headline-sm text-headline-sm text-primary">Instant Task Compensation</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Earn verified boundary delineation, soil sampling, and cluster training stipends.</p>
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">1</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Field Terminal App &amp; Offline Cache</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Zero-Connectivity Ready</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Log into authorized agent terminals with SQLite offline sync. Conduct full registrations in low-connectivity rural belts without losing surveyor telemetry.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">2</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Assisted Onboarding in Local Dialects</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Yoruba &amp; Pidgin Audio</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Guide non-literate farmers through consent disclosures in Yoruba or Nigerian Pidgin. Collect authorized biometric stamps complying fully with NDPA 2023 mandate §17.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">3</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">PostGIS Boundary Walking &amp; Cadastral Mapping</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">GPS Precision</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Walk the real field borders alongside the farm owner. Record vertices, mark permanent tree and stream natural bounds, and sync polygons upon returning to 3G/4G coverage.</p>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">4</div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">Cluster Coordination &amp; Stipend Settlement</h4>
                      <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-space-sm py-0.5 rounded-full font-semibold">Verified Tasks</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Inspect local tractor work, monitor pest alerts, and submit cluster completion certificates. Stipends are automatically credited to your Providus wallet upon supervisor verification.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-space-xs max-w-3xl mb-space-lg">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">§4.12 Master Architecture</span>
            <h2 className="font-headline-lg text-headline-lg text-primary">Trust, Verification &amp; Safety Framework</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">CultivaNode rejects unregulated peer-to-peer promises. Every participant tier, physical field action, and escrow settlement operates under strict statutory standards.</p>
          </div>
          <div className="mb-space-xl">
            <div className="flex items-center justify-between mb-space-md">
              <h3 className="font-headline-md text-headline-md text-on-surface">Tiered Participant Verification Matrix</h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Statutory Compliance · CBN &amp; NIMC</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-sm text-label-sm font-bold text-on-surface-variant">TIER 0</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant">Read Only</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">Phone Registered</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Basic SMS OTP signup. Allows browsing public marketplace prices, weather forecasts, and crop guides.</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low rounded-lg p-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Capabilities:</span>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">Browse listings; no transactions or tractor bookings permitted.</span>
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-sm text-label-sm font-bold text-secondary">TIER 1</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary font-semibold">Active Smallholder</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">NIN Biometric Verified</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Identity tied directly to NIMC registry via facial or fingerprint verification through field terminals.</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low rounded-lg p-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Capabilities:</span>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">Map up to 10 ha, request cluster tillage, join local cooperative rosters.</span>
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-sm text-label-sm font-bold text-primary">TIER 2</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary font-semibold">Settlement Ready</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">BVN &amp; Bank Verified</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Bank Verification Number (BVN) cross-referenced with bank account name for audited payouts.</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low rounded-lg p-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Capabilities:</span>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">Receive instant bank deposits, contract syndicates up to ₦5M.</span>
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-sm text-label-sm font-bold text-on-tertiary-container">TIER 3</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-tertiary-container font-semibold">Institutional</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">CAC Commercial Verified</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Corporate Affairs Commission (CAC) filing, TIN tax clearance, and institutional bank escrow mandate.</p>
                </div>
                <div className="pt-space-md mt-space-md bg-surface-container-low rounded-lg p-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Capabilities:</span>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">Unlimited volume off-take lots, fleet-scale machinery contracting.</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-xl">
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-md flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <Icon name="verified" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">What &quot;Proof of Work&quot; (PoW) Means</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">CultivaNode replaces unverified verbal claims with physical verifiable reality:</p>
                <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  <li className="flex items-start gap-space-xs">
                    <Icon name="check_circle" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>Sub-meter Geofencing:</strong> Mobile device must be physically positioned inside the registered farm polygon.</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="check_circle" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>Cryptographic EXIF Stamping:</strong> Field photos embed UTC timestamps, compass direction, and satellite cluster IDs.</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="check_circle" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>Hectare Calculation:</strong> Implements track continuous acreage worked, verifying whether 5 hectares were truly plowed.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-space-md p-space-xs bg-surface-container rounded-lg font-label-sm text-label-sm text-on-surface-variant">Immutable spatial telemetry logs prevent fraudulent double-billing.</div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-md flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="account_balance" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Pilot Payment &amp; Escrow Rail</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Zero risky unregulated wallets. All capital is held strictly within formal Nigerian banking infrastructure:</p>
                <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  <li className="flex items-start gap-space-xs">
                    <Icon name="account_balance_wallet" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>0% Commission Pilot:</strong> CultivaNode levies zero service charge on tractor syndicates and farmers during the 2025 pilot phase.</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="account_balance_wallet" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>CBN Licensed Banking Custody:</strong> Pre-funded amounts rest in segregated escrow accounts at Providus Bank &amp; Wema Bank.</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="account_balance_wallet" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>Automated Milestone Release:</strong> Disbursed directly to operator NUBAN accounts upon confirmed sign-off.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-space-md p-space-xs bg-surface-container rounded-lg font-label-sm text-label-sm text-on-surface-variant">No third-party custody risks. Bank-grade financial safety.</div>
            </div>
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-md flex flex-col justify-between">
              <div className="flex flex-col gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                  <Icon name="balance" className="text-[24px]" />
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Dispute Escalation &amp; Arbitration</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Clear, transparent protocols when expectations are not met or operational breakdowns occur:</p>
                <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  <li className="flex items-start gap-space-xs">
                    <Icon name="schedule" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>4-Hour Agronomist Review:</strong> Immediate ticket logging with rapid assignment to an accredited regional extension officer.</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="lock_clock" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>48-Hour Escrow Freezing:</strong> Automatic funds lock preventing any unilateral disbursement during physical field inspection.</span>
                  </li>
                  <li className="flex items-start gap-space-xs">
                    <Icon name="fact_check" className="text-secondary text-[18px] shrink-0" />
                    <span><strong>Tripartite Resolution:</strong> Binding adjudication resulting in full release, partial pro-rata settlement, or complete refund.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-space-md p-space-xs bg-surface-container rounded-lg font-label-sm text-label-sm text-on-surface-variant">Guaranteed 48h SLA ensures neither party is stranded indefinitely.</div>
            </div>
          </div>
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
              <div className="lg:col-span-8 flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary uppercase font-semibold">
                  <Icon name="security" className="text-[18px]" />
                  <span>Nigeria Data Protection Act (NDPA 2023) Compliance</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary">Your Farm Data Belongs Unconditionally to You</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">CultivaNode adheres strictly to NDPA 2023 statutory mandates. Your cadastral boundaries, historical harvest yields, and personal NIN biometric tokens are encrypted end-to-end. We will never sell, lease, or distribute your farm records to commercial seed syndicates, predatory lenders, or government agencies without explicit, revocable electronic consent.</p>
                <div className="flex flex-wrap items-center gap-space-md pt-space-xs font-label-sm text-label-sm text-on-surface">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" />Right to Data Portability</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" />Granular Off-taker Permissions</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" />Instant Consent Revocation</span>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-space-xs bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Data Protection Officer</span>
                <span className="font-headline-sm text-headline-sm text-primary">dpo@cultivanode.ng</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Registered with the Nigeria Data Protection Commission (NDPC). Inquiries answered within 24 business hours.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-space-xs max-w-2xl mb-space-lg">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Frequently Asked Questions</span>
            <h2 className="font-headline-lg text-headline-lg text-primary">Operational Questions &amp; Edge Cases</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Clear, unvarnished policies addressing real-world complexities across South-West Nigerian farmland.</p>
          </div>
          <div className="flex flex-col gap-space-sm max-w-4xl">
            <details className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden group">
              <summary className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="font-headline-sm text-headline-sm text-on-surface">What happens if a tractor arrives late or breaks down in my field?</span>
                <Icon name="expand_more" className="text-primary text-[24px] transition-transform duration-200" />
              </summary>
              <div className="hidden px-space-md pb-space-md pt-0 text-on-surface-variant font-body-sm text-body-sm leading-relaxed" id="faq-1">If a tractor breaks down mid-operation, the operator logs a telemetry pause on their terminal. If the machinery cannot be repaired within 24 hours, CultivaNode automatically dispatches an alternate syndicate within the cluster, or recalculates the pro-rata hectares actually completed. The unworked portion of your escrow deposit is immediately released back to your bank account or transferred to the replacement tractor.</div>
            </details>
            <details className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden group">
              <summary className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="font-headline-sm text-headline-sm text-on-surface">How do I know the seed batches in the marketplace are not counterfeit?</span>
                <Icon name="expand_more" className="text-primary text-[24px] transition-transform duration-200" />
              </summary>
              <div className="hidden px-space-md pb-space-md pt-0 text-on-surface-variant font-body-sm text-body-sm leading-relaxed" id="faq-2">Every seed dealer listing on CultivaNode must be Tier 3 CAC verified and licensed by the National Agricultural Seeds Council (NASC). Every bag of certified hybrid seed (such as SAMMAZ or SC510) carries a unique NASC SEEDCODEX scratch-off authentication tag verifiable directly via the app before acceptance. Escrow payments for inputs remain held until you confirm valid authentication.</div>
            </details>
            <details className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden group">
              <summary className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="font-headline-sm text-headline-sm text-on-surface">Can a commercial bank or government agency see my harvest records without permission?</span>
                <Icon name="expand_more" className="text-primary text-[24px] transition-transform duration-200" />
              </summary>
              <div className="hidden px-space-md pb-space-md pt-0 text-on-surface-variant font-body-sm text-body-sm leading-relaxed" id="faq-3">No. Under our NDPA 2023 privacy framework, your harvest yields and boundary geometries are stored in zero-knowledge encrypted formats. Financial institutions seeking to review your yield history to evaluate loan eligibility must send a formal consent authorization request to your phone. Only when you explicitly authorize it with your SMS OTP or biometric PIN is read-only access granted.</div>
            </details>
            <details className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden group">
              <summary className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="font-headline-sm text-headline-sm text-on-surface">How are disputes resolved if produce is rejected at the buyer&apos;s weighbridge?</span>
                <Icon name="expand_more" className="text-primary text-[24px] transition-transform duration-200" />
              </summary>
              <div className="hidden px-space-md pb-space-md pt-0 text-on-surface-variant font-body-sm text-body-sm leading-relaxed" id="faq-4">All off-take contracts stipulate specific physical quality parameters (e.g. max moisture 13%, maximum broken kernels 3%). If a lot is contested at the buyer&apos;s gate, CultivaNode dispatches a certified independent quality inspector from the nearest state ADP within 4 hours. The inspector uses calibrated moisture meters to take 3 blind samples. Their determination is uploaded to the dispute arbitration engine, which then calculates an agreed price discount or approves cargo return with haulage reimbursement.</div>
            </details>
          </div>
        </section>
        <section className="px-margin-desktop py-space-xl max-w-7xl mx-auto w-full">
          <div className="rounded-xl bg-primary text-on-primary p-space-xl flex flex-col md:flex-row md:items-center justify-between gap-space-lg shadow-xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-secondary opacity-10 pointer-events-none blur-2xl" />
            <div className="flex flex-col gap-space-xs max-w-2xl relative z-10">
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed" />
                <span>South-West Agrarian Mesh Pilot</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-primary md:text-[2rem] md:leading-[2.5rem]">Join a Trusted Agrarian Network Engineered for Scale</h2>
              <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">Start operating with bank-grade escrow security, verified boundaries, and 0% pilot commission. Whether you manage 2 hectares or a 10-tractor fleet, CultivaNode secures your work.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-space-sm shrink-0 relative z-10">
              <Link className="w-full sm:w-auto inline-flex items-center justify-center font-label-lg text-label-lg font-semibold bg-secondary text-on-secondary px-space-lg py-space-sm rounded-lg hover:bg-secondary-fixed transition-colors shadow-md" href={`/${lang}/sign-up`}>Create Free Account</Link>
              <a className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs font-label-lg text-label-lg font-semibold bg-surface-container-lowest text-primary px-space-md py-space-sm rounded-lg hover:bg-surface-container transition-colors shadow-sm" href="#">
                <Icon name="download" className="text-[18px]" />
                <span>Pilot Trust Handbook (PDF)</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
