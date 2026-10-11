// Ported from the "ngo_development_programmes_10.4" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function NgoProgrammes(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="px-gutter-desktop py-space-md bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-space-xs text-secondary mb-1">
                <Icon name="public" className="text-[18px]" />
                <span className="font-label-md text-label-md uppercase tracking-wider">Multilateral Compact [§10.4]</span>
                <span className="text-outline-variant font-label-md">/</span>
                <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Development Programmes &amp; MEL Architecture</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">NGO &amp; Donor Programme Intelligence</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 max-w-4xl">International Donor, Multilateral &amp; NGO Development Intervention Tracking (USAID, IFAD, FCDO, AGRA &amp; Bill &amp; Melinda Gates Foundation South-West Nigeria Agribusiness Compact).</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md shadow-xs">
                <Icon name="sync" className="text-[16px] text-primary" />
                <span className="text-on-surface-variant">Sync Cadence:</span>
                <span className="font-semibold text-primary">Hourly Webhook (SmileID • PostGIS)</span>
              </div>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors" id="donorFilterTrigger" type="button">
                <Icon name="tune" className="text-[16px]" />
                <span>Intervention Filter</span>
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm shadow-xs">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-on-surface-variant">Donor Standard:</span>
              <span className="font-semibold text-on-surface">IATI XML 2.03 Certified</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm shadow-xs">
              <Icon name="verified_user" className="text-[14px] text-secondary" />
              <span className="text-on-surface-variant">Beneficiary Integrity:</span>
              <span className="font-semibold text-on-surface">100% PostGIS Geofenced &amp; NIN Validated</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed-variant font-label-sm text-label-sm shadow-xs">
              <Icon name="event_repeat" className="text-[14px] text-secondary" />
              <span className="font-semibold">Cycle: 2024–2027 Multi-Year Strategic Intervention</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm ml-auto">
              <Icon name="lock" className="text-[14px] text-secondary" />
              <span>Cryptographic Audit Proof: 0x8F94...B7C1</span>
            </div>
          </div>
        </div>
        <div className="p-gutter-desktop space-y-space-xl">
          <section className="space-y-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Real-Time Aggregates</span>
                <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-primary font-semibold">SW Compact Node</span>
              </div>
              <span className="text-label-sm font-label-sm text-on-surface-variant">Updated 8 mins ago • USAID/IATI Mirror</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider">Enrolled Smallholders</span>
                    <Icon name="group" className="text-[18px] text-secondary" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-headline-lg text-headline-lg text-primary font-bold">28,450</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">/ 30,000 Target</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "94.8%" }} />
                  </div>
                </div>
                <div className="mt-3 pt-2 bg-surface-container-low p-2 rounded-lg space-y-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">Women Smallholders</span>
                    <span className="font-semibold text-secondary">56.0% (15,932)</span>
                  </div>
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">Youth (&lt; 35 yrs)</span>
                    <span className="font-semibold text-primary">32.0% (9,104)</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider">Committed Pool</span>
                    <Icon name="account_balance_wallet" className="text-[18px] text-secondary" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-headline-lg text-headline-lg text-primary font-bold">$14.20M</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">USD</span>
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Equiv: <span className="font-semibold text-on-surface">₦19.88 Billion</span></div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "69.4%" }} />
                  </div>
                </div>
                <div className="mt-3 pt-2 bg-surface-container-low p-2 rounded-lg flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">Disbursed to Date:</span>
                  <span className="font-semibold text-primary">$9.85M (69.4%)</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider">Inputs &amp; Tractors</span>
                    <Icon name="local_shipping" className="text-[18px] text-secondary" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-headline-lg text-headline-lg text-primary font-bold">4,120</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">MT Certified Seeds</span>
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Micro-nutrients &amp; Bio-fertilizer</div>
                </div>
                <div className="mt-3 pt-2 bg-surface-container-low p-2 rounded-lg space-y-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">Tractor Hires Deployed</span>
                    <span className="font-semibold text-secondary">118 units</span>
                  </div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant truncate">Oyo • Ogun • Osun Agro-Zones</div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider">Climate Adoption</span>
                    <Icon name="eco" className="text-[18px] text-secondary" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-headline-lg text-headline-lg text-primary font-bold">78.4%</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">↑ +12.1% YoY</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-secondary-fixed-dim h-full rounded-full" style={{ width: "78.4%" }} />
                  </div>
                </div>
                <div className="mt-3 pt-2 bg-surface-container-low p-2 rounded-lg font-label-sm text-label-sm text-on-surface-variant">
                  <div className="flex justify-between font-semibold text-on-surface mb-0.5">
                    <span>Coverage:</span>
                    <span>14,800 Hectares</span>
                  </div>
                  <span className="truncate block">Drip, Solar Pumps &amp; Biochar</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider">Household Income Δ</span>
                    <Icon name="trending_up" className="text-[18px] text-secondary" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-headline-lg text-headline-lg text-secondary font-bold">+46.2%</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Net Gain</span>
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Ag Revenue Expansion</div>
                </div>
                <div className="mt-3 pt-2 bg-surface-container-low p-2 rounded-lg font-label-sm text-label-sm space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Baseline:</span>
                    <span className="font-medium text-on-surface">₦385,000 / yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Current Verified:</span>
                    <span className="font-semibold text-primary">₦563,000 / yr</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-on-surface-variant mb-1">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider">Audit Attestation</span>
                    <Icon name="gavel" className="text-[18px] text-secondary" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-headline-lg text-headline-lg text-primary font-bold">99.8%</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Passed</span>
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Zero ghost claim threshold</div>
                </div>
                <div className="mt-3 pt-2 bg-secondary-fixed/40 p-2 rounded-lg font-label-sm text-label-sm text-on-secondary-fixed-variant flex items-center justify-between">
                  <span className="font-medium">Duplicate NINs:</span>
                  <span className="font-bold">0 Detected</span>
                </div>
              </div>
            </div>
          </section>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
            <section className="xl:col-span-8 space-y-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Multi-Year Strategic Portfolios</div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Panel A: Active Donor Programmes &amp; Capital Drawdowns</h2>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-lg">
                  <button className="px-2.5 py-1 text-label-sm font-label-sm rounded bg-surface-container-lowest text-primary font-semibold shadow-xs" type="button">All Donors (4)</button>
                  <button className="px-2.5 py-1 text-label-sm font-label-sm rounded text-on-surface-variant hover:text-on-surface" type="button">USAID</button>
                  <button className="px-2.5 py-1 text-label-sm font-label-sm rounded text-on-surface-variant hover:text-on-surface" type="button">IFAD</button>
                  <button className="px-2.5 py-1 text-label-sm font-label-sm rounded text-on-surface-variant hover:text-on-surface" type="button">AGRA / FCDO</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-primary font-semibold">USAID • Feed the Future</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 82% Delivered</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">South-West Grain Corridor Outgrower Initiative</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Targeting 12,000 commercial maize &amp; high-protein soybean outgrowers across Oke-Ogun agricultural hub (Saki West, Saki East, and Iseyin LGA clusters).</p>
                    <div className="mt-4 p-3 bg-surface-container-low rounded-lg space-y-2">
                      <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                        <span className="text-on-surface-variant font-medium">Intervention Pool:</span>
                        <span className="font-bold text-primary">$6.50M USD</span>
                      </div>
                      <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                        <span className="text-on-surface-variant font-medium">Disbursed (Burn Rate):</span>
                        <span className="font-semibold text-secondary">$5.33M (82.0%)</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "82%" }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Oke-Ogun / Saki Cluster</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <span>9,840 Smallholders Reached</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-primary font-semibold">IFAD • VCDP</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 71% Delivered</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Value Chain Development Programme (VCDP)</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Cassava starch processing lines &amp; rice milling equipment matching grants distributed across Ogun River Basin and agrarian cooperatives.</p>
                    <div className="mt-4 p-3 bg-surface-container-low rounded-lg space-y-2">
                      <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                        <span className="text-on-surface-variant font-medium">Intervention Pool:</span>
                        <span className="font-bold text-primary">$4.20M USD</span>
                      </div>
                      <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                        <span className="text-on-surface-variant font-medium">Disbursed (Burn Rate):</span>
                        <span className="font-semibold text-secondary">$2.98M (71.0%)</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "71%" }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Ogun River Basin • Abeokuta</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <span>74 Agro-Processors Installed</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-primary font-semibold">AGRA • Soil Health</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 58% Delivered</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Climate-Smart Agroforestry &amp; Soil Health Compact</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Biochar soil-enrichment kilns and leguminous tree intercropping in Osun &amp; Ondo cocoa belts to remediate degraded cocoa-forest frontiers.</p>
                    <div className="mt-4 p-3 bg-surface-container-low rounded-lg space-y-2">
                      <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                        <span className="text-on-surface-variant font-medium">Intervention Pool:</span>
                        <span className="font-bold text-primary">$2.00M USD</span>
                      </div>
                      <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                        <span className="text-on-surface-variant font-medium">Disbursed (Burn Rate):</span>
                        <span className="font-semibold text-secondary">$1.16M (58.0%)</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "58%" }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Osun • Ondo Cocoa Belt</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <span>5,220 Ha Under Biochar</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-primary font-semibold">FCDO • Gender Equity</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 94% Delivered</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Rural Women Mechanization &amp; Market Linkage</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Dedicated mechanization vouchers, two-wheel tillers, and direct offtake connections targeting 100% female-headed smallholder agrarian families.</p>
                    <div className="mt-4 p-3 bg-surface-container-low rounded-lg space-y-2">
                      <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                        <span className="text-on-surface-variant font-medium">Intervention Pool:</span>
                        <span className="font-bold text-primary">$1.50M USD</span>
                      </div>
                      <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                        <span className="text-on-surface-variant font-medium">Disbursed (Burn Rate):</span>
                        <span className="font-semibold text-secondary">$1.41M (94.0%)</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: "94%" }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <Icon name="location_on" className="text-[16px] text-secondary" />
                      <span>Oyo, Ogun, Ekiti Hubs</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <span>3,940 Women Lead-Producers</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="xl:col-span-4 space-y-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Field Intervention Reality</h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Verified Photography</span>
                </div>
                <div className="relative rounded-lg overflow-hidden h-48 bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="An energetic agricultural extension agent in high-visibility field gear reviewing certified maize seed distribution roster with female Nigerian farmers in Oke-Ogun, Oyo State. Natural tropical afternoon light illuminating lush agrarian scenery, green crops, and modern handheld digital identity tablets." src="/images/screens/d55a9d2fb2ed.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                    <div className="font-label-sm text-label-sm font-semibold flex items-center gap-1"><Icon name="verified" className="text-[14px] text-secondary-fixed" /> Seed Pack Distribution • Saki West Node</div>
                    <div className="text-[11px] text-white/80 font-mono">Geotag: 8.6671° N, 3.3939° E • 09:41 WAT</div>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg space-y-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Pool Drawdown Ratios</span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">Total: $14.2M</span>
                  </div>
                  <div className="w-full h-4 rounded-full overflow-hidden flex">
                    <div className="bg-primary h-full" style={{ width: "45.8%" }} title="USAID: 45.8%" />
                    <div className="bg-secondary h-full" style={{ width: "29.6%" }} title="IFAD: 29.6%" />
                    <div className="bg-secondary-fixed-dim h-full" style={{ width: "14.1%" }} title="AGRA: 14.1%" />
                    <div className="bg-tertiary-fixed-dim h-full" style={{ width: "10.5%" }} title="FCDO: 10.5%" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-label-sm text-label-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                      <span className="text-on-surface-variant truncate">USAID: $6.50M</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0" />
                      <span className="text-on-surface-variant truncate">IFAD: $4.20M</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim shrink-0" />
                      <span className="text-on-surface-variant truncate">AGRA: $2.00M</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim shrink-0" />
                      <span className="text-on-surface-variant truncate">FCDO: $1.50M</span>
                    </div>
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden h-36 bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="A subsidized solar-powered drip irrigation system pumping water steadily onto organized cassava and vegetable ridges in an Ogun State smallholder farm cluster. Clean sunlight glinting off solar panels with deep green foliage and rich damp soil." src="/images/screens/38e4c6103ebc.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 via-black/30 to-transparent text-white">
                    <div className="font-label-sm text-label-sm font-semibold truncate">Climate-Smart Solar Drip Array • Ogun Basin</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <section className="space-y-space-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div>
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Impact Verification • Logical Framework</div>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Panel B: MEL Performance Logframe (Activities vs Verified Outcomes)</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Filter Indicator:</span>
                <select className="bg-surface-container-lowest text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-lg outline-none cursor-pointer shadow-xs" id="melFilterSelect">
                  <option value="all">All Indicators (Active)</option>
                  <option value="input">Input Adoption</option>
                  <option value="nutrition">Nutrition &amp; Social</option>
                  <option value="postharvest">Post-Harvest Losses</option>
                  <option value="spatial">PostGIS Integrity</option>
                </select>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      <th className="py-3 px-4">Level / Pillar</th>
                      <th className="py-3 px-4">Indicator Definition</th>
                      <th className="py-3 px-4 text-right">Target</th>
                      <th className="py-3 px-4 text-right">Actual Reached</th>
                      <th className="py-3 px-4 text-right">Variance</th>
                      <th className="py-3 px-4">Evidence Hash / Sentinel</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm text-on-surface">
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-primary">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                          <span>Input Distribution</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">Certified Hybrid Seed Adoption</div>
                        <div className="text-on-surface-variant font-label-sm text-label-sm">High-yield drought-tolerant maize (SAMMAZ 15) &amp; TGx-1835-10E soybean</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium">12,000 Ha</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-primary">11,420 Ha</td>
                      <td className="py-3.5 px-4 text-right font-mono text-secondary font-semibold">-4.8%</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded inline-block">SHA256: 4a9f...c31d (QR Bags)</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold">On Target</span>
                      </td>
                    </tr>
                    <tr className="bg-surface-container-low/20 hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-primary">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                          <span>Household Impact</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">Dietary Diversity &amp; Child Nutrition Score</div>
                        <div className="text-on-surface-variant font-label-sm text-label-sm">Minimum Dietary Diversity for Women &amp; Children (MDD-W score ≥ 5 food groups)</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium">65.0%</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-primary">72.4%</td>
                      <td className="py-3.5 px-4 text-right font-mono text-secondary font-semibold">+11.4%</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded inline-block">ODK Household Survey #882</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold">Exceeded</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-primary">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                          <span>Value Preservation</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">Post-Harvest Grain Loss Reduction</div>
                        <div className="text-on-surface-variant font-label-sm text-label-sm">Hermetic storage bags &amp; community aggregate solardryers deployment</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium">&lt; 12.0%</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-primary">8.6% Loss</td>
                      <td className="py-3.5 px-4 text-right font-mono text-secondary font-semibold">+28.3% Impr.</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded inline-block">WRS Silo Moisture Sensor IoT</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold">Optimal</span>
                      </td>
                    </tr>
                    <tr className="bg-surface-container-low/20 hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-primary">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                          <span>Spatial Governance</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">PostGIS Polygon Boundary Overlap Rate</div>
                        <div className="text-on-surface-variant font-label-sm text-label-sm">Cadastral perimeter cross-validation against LGA reserve forest tracts</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium">0.00%</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-primary">0.00%</td>
                      <td className="py-3.5 px-4 text-right font-mono text-secondary font-semibold">0.00%</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded inline-block">Sentinel-2 SAR / EPSG:4326</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold">Zero Error</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-primary">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                          <span>Economic Resilience</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">Off-Take Linked Household Income Delta</div>
                        <div className="text-on-surface-variant font-label-sm text-label-sm">Escrow-backed purchase agreements with regional animal feed millers</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium">+35.0%</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-primary">+46.2%</td>
                      <td className="py-3.5 px-4 text-right font-mono text-secondary font-semibold">+32.0%</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded inline-block">NIBSS Bank Settlement Feeds</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold">Surpassed</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
            <section className="xl:col-span-7 space-y-space-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Immutable Field Telemetry</div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Panel C: Field Agent Biometric Dispatch Stream</h2>
                </div>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-surface-container px-2.5 py-1 rounded-full font-semibold"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Live Stream</span>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
                <div className="p-3 bg-surface-container-low rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                      <Icon name="fingerprint" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-bold text-on-surface">Agent: Folashade Alabi</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">Cluster #OK-08</span>
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface">Recipient: <span className="font-semibold">Babatunde Olalekan</span> (NIN: •••• 4091)</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                        <span className="text-primary font-medium">Ago-Are Cluster, Atisbo LGA</span>
                        <span>•</span>
                        <span>Package: 50kg SAMMAZ-15 + 2L Micro-Biochar</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right sm:shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold"><Icon name="check_circle" className="text-[14px]" /> Biometric Validated</span>
                    <span className="font-mono text-[11px] text-on-surface-variant">14:18 WAT (2m ago)</span>
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                      <Icon name="fingerprint" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-bold text-on-surface">Agent: Chukwuemeka Eze</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">Cluster #IS-14</span>
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface">Recipient: <span className="font-semibold">Rukayat Adebisi</span> (NIN: •••• 8193)</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                        <span className="text-primary font-medium">Iseyin South, Oyo State</span>
                        <span>•</span>
                        <span>Package: Solar Water Pumping Kit (Voucher #FCDO-09)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right sm:shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold"><Icon name="check_circle" className="text-[14px]" /> SmileID Pass</span>
                    <span className="font-mono text-[11px] text-on-surface-variant">13:52 WAT (28m ago)</span>
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                      <Icon name="fingerprint" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-bold text-on-surface">Agent: Titilayo Adelekan</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">Cluster #OG-03</span>
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface">Recipient: <span className="font-semibold">Eunice Ogundipe</span> (NIN: •••• 2147)</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                        <span className="text-primary font-medium">Ijebu-Ode Agro Basin, Ogun</span>
                        <span>•</span>
                        <span>Package: Cassava Grater Matching Grant</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right sm:shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold"><Icon name="check_circle" className="text-[14px]" /> Biometric Validated</span>
                    <span className="font-mono text-[11px] text-on-surface-variant">12:30 WAT (1h ago)</span>
                  </div>
                </div>
              </div>
            </section>
            <section className="xl:col-span-5 space-y-space-sm">
              <div>
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Compliance Dossiers</div>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Panel D: Donor Export &amp; Reporting Center</h2>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">Automated compliance pipeline formatted for institutional donors with verifiable SHA256 hashes and open-data schema compliance.</p>
                <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <Icon name="code" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="font-label-md text-label-md font-bold text-on-surface">IATI Standard XML 2.03</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Validated XML feed with activity-level disbursements</div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shrink-0" type="button">Generate XML</button>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <Icon name="picture_as_pdf" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="font-label-md text-label-md font-bold text-on-surface">USAID Quarterly Dossier (.pdf)</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Feed the Future Q1-2026 Executive Summary &amp; MEL charts</div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors shrink-0" type="button">Download PDF</button>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <Icon name="table_view" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="font-label-md text-label-md font-bold text-on-surface">Open Data Beneficiary CSV</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Anonymized PostGIS polygons &amp; gender metrics (28,450 rows)</div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors shrink-0" type="button">Export CSV</button>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <Icon name="menu_book" className="text-[20px]" />
                    </div>
                    <div>
                      <div className="font-label-md text-label-md font-bold text-on-surface">Impact Evaluation Methodology</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Randomized Controlled Trial (RCT) &amp; Baselines Whitepaper</div>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors shrink-0" type="button">View Doc</button>
                </div>
                <div className="hidden p-2.5 rounded-lg bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm flex items-center gap-2" id="exportStatusBox">
                  <Icon name="task_alt" className="text-[16px] text-secondary" />
                  <span id="exportStatusText">Preparing compliance package...</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
