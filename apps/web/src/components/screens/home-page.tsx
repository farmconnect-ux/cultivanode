// Ported from the "homepage_en_your_farm_s_working_partner" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";

export type HomePageSlot = "heroTitle" | "heroLede" | "heroMedia";

export function HomePage({ lang, slots }: ScreenProps<HomePageSlot>) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="relative w-full overflow-hidden bg-surface pb-16 pt-8 lg:pb-24 lg:pt-12">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex items-center gap-space-sm mb-6 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary font-label-md text-label-md tracking-wide"><span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" /> CONNECTED INTELLIGENCE FOR AGRICULTURE · SOUTH-WEST NIGERIA PILOT</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm"><Icon name="verified" className="text-[15px] text-secondary" /> NDPA 2023 Compliant Platform</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 flex flex-col gap-6">
                {slot(slots, "heroTitle", (
                  <h1 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-primary tracking-tight leading-none">Your farm&apos;s working partner.</h1>
                ))}
                {slot(slots, "heroLede", (
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">Connect your farm to agricultural services, farm management tools and the people and resources you need to grow across Nigeria&apos;s agricultural corridors.</p>
                ))}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link className="px-6 py-3.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-md flex items-center gap-2 group" href={`/${lang}/sign-up`}>
                    <span>Get Started (Join Pilot)</span>
                    <Icon name="arrow_forward" className="text-[18px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a className="px-6 py-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-all shadow-sm flex items-center gap-2" href="#platform-capabilities">
                    <Icon name="tune" className="text-[18px] text-secondary" />
                    <span>Explore Platform</span>
                  </a>
                  <a className="px-5 py-3.5 rounded-lg bg-surface-container text-primary font-label-lg text-label-lg hover:bg-surface-container-highest transition-all flex items-center gap-2" href="#marketplace-section">
                    <Icon name="shopping_bag" className="text-[18px] text-tertiary-container" />
                    <span>Buy from Marketplace</span>
                  </a>
                </div>
                <div className="flex items-center gap-4 pt-2 text-on-surface-variant font-body-sm text-body-sm">
                  <span className="flex items-center gap-1.5"><Icon name="check_circle" className="text-[16px] text-secondary" /> Instant Field GPS</span>
                  <span className="flex items-center gap-1.5"><Icon name="shield" className="text-[16px] text-secondary" /> Escrow Protected</span>
                  <span className="flex items-center gap-1.5"><Icon name="public" className="text-[16px] text-secondary" /> Yorùbá &amp; English</span>
                </div>
              </div>
              <div className="lg:col-span-6 relative">
                {slot(slots, "heroMedia", (
                  <div className="relative rounded-2xl overflow-hidden shadow-xl bg-surface-container-high group">
                    <img alt="Modern blue agricultural tractor harrowing lush maize and cassava fields under bright blue sky in Oke-Ogun Savanna Basin" className="w-full h-[430px] object-cover group-hover:scale-[1.02] transition-transform duration-500" src="/images/screens/b6926940eb20.webp" loading="lazy" decoding="async" />
                    <div className="absolute top-4 left-4 bg-surface-container-lowest/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-md flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Oke-Ogun Savanna Basin</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Verified Mechanized Cluster · Sector 4B</span>
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent p-6 text-on-primary">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-headline-sm font-semibold tracking-tight">Farming Smarter: Inside Nigeria&apos;s Resilient Agriculture</span>
                          <span className="font-body-sm text-body-sm opacity-90">Real-time GPS telemetry, soil moisture feeds &amp; zero-arbitrage tractor dispatch.</span>
                        </div>
                        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container">
                          <Icon name="agriculture" className="text-[20px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm">
              <div className="flex flex-col p-3">
                <span className="font-metric-num text-metric-num text-primary">300+</span>
                <span className="font-label-lg text-label-lg text-on-surface">Pilot Farmers</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Active across Oyo, Ogun &amp; Osun</span>
              </div>
              <div className="flex flex-col p-3">
                <span className="font-metric-num text-metric-num text-primary">15</span>
                <span className="font-label-lg text-label-lg text-on-surface">Regional Crops</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Validated agronomic cycle templates</span>
              </div>
              <div className="flex flex-col p-3">
                <span className="font-metric-num text-metric-num text-secondary">₦0.00</span>
                <span className="font-label-lg text-label-lg text-on-surface">Platform Commission</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">100% free during pilot deployment</span>
              </div>
              <div className="flex flex-col p-3">
                <span className="font-metric-num text-metric-num text-primary">100%</span>
                <span className="font-label-lg text-label-lg text-on-surface">PostGIS Geofenced</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Sub-meter boundary accuracy</span>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mb-14">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Field Reality &amp; Structural Friction</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-2">The bottlenecks slowing down African agribusiness.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">Agricultural output across West Africa loses up to 40% of potential yield not to lack of effort, but to disconnected coordination, opaque labor, and missing verified records.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-5">
                    <Icon name="precision_manufacturing" className="text-[26px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Fragmented Machinery Access</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Tractor owners struggle with idle machinery while farmers miss 10-day planting windows due to uncoordinated middlemen, breakdown surprises, and arbitrary pricing.</p>
                </div>
                <div className="mt-6 pt-4 bg-surface-container-low rounded-lg p-3">
                  <span className="font-label-sm text-label-sm text-error font-semibold flex items-center gap-1"><Icon name="trending_down" className="text-[16px]" /> 32% yield loss per 2-week planting delay</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-5">
                    <Icon name="assignment_late" className="text-[26px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Unverified Labour &amp; Proof-of-Work</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Endless disputes over actual hectares ploughed, weeding attendance, or chemical spray dilution without tamper-proof GPS coordinates and photographic time logs.</p>
                </div>
                <div className="mt-6 pt-4 bg-surface-container-low rounded-lg p-3">
                  <span className="font-label-sm text-label-sm text-tertiary-container font-semibold flex items-center gap-1"><Icon name="priority_high" className="text-[16px]" /> ₦180,000+ lost annually in unverified labor</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-5">
                    <Icon name="menu_book" className="text-[26px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Paper Records &amp; Blind Agronomy</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Handwritten exercise books provide no credit trail. Commercial banks, off-takers, and crop insurers cannot evaluate farm productivity or underwrite capital.</p>
                </div>
                <div className="mt-6 pt-4 bg-surface-container-low rounded-lg p-3">
                  <span className="font-label-sm text-label-sm text-error font-semibold flex items-center gap-1"><Icon name="cancel" className="text-[16px]" /> &gt;85% of smallholders rejected by banks</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-5">
                    <Icon name="price_change" className="text-[26px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Middlemen &amp; Price Distortion</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Farmers sell at distress prices at farm-gate while urban buyers in Lagos and Ibadan pay up to 140% markups due to fragmented haulage and opaque aggregation.</p>
                </div>
                <div className="mt-6 pt-4 bg-surface-container-low rounded-lg p-3">
                  <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1"><Icon name="sync_alt" className="text-[16px]" /> Cut markups via direct escrow aggregation</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Operational Workflow</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-2">How CultivaNode powers your farm season.</h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">From cadastral boundary setup to final escrow release, each step is recorded in your immutable digital farm diary.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-4 right-4 font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-surface-container-high font-extrabold select-none">01</div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-primary-container text-on-primary flex items-center justify-center mb-6">
                    <Icon name="pin_drop" className="text-[24px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-3">Register Farm &amp; Field</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Pin GPS field points or walk your farm boundary using our offline-first mobile web mapper. System automatically computes accurate hectarage and soil topology.</p>
                </div>
                <div className="mt-6 pt-4 text-secondary font-label-md text-label-md flex items-center gap-1">
                  <span>PostGIS polygon verified</span>
                  <Icon name="chevron_right" className="text-[16px]" />
                </div>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-4 right-4 font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-surface-container-high font-extrabold select-none">02</div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-primary text-on-primary flex items-center justify-center mb-6">
                    <Icon name="calendar_month" className="text-[24px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-3">Plan Crop Cycle</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Deploy proven agronomy templates customized for South-West soils (Cassava, Maize, Yam, Soy, Pepper). Auto-generates weekly milestones and split-fertilizer dates.</p>
                </div>
                <div className="mt-6 pt-4 text-secondary font-label-md text-label-md flex items-center gap-1">
                  <span>15 staple templates</span>
                  <Icon name="chevron_right" className="text-[16px]" />
                </div>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-4 right-4 font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-surface-container-high font-extrabold select-none">03</div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-secondary text-on-secondary flex items-center justify-center mb-6">
                    <Icon name="handshake" className="text-[24px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-3">Connect Providers</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Book nearby harrowing, ridging, certified seed distribution, and drone spraying. Your deposit sits securely in escrow until milestones are physically completed.</p>
                </div>
                <div className="mt-6 pt-4 text-secondary font-label-md text-label-md flex items-center gap-1">
                  <span>Zero payment risk</span>
                  <Icon name="chevron_right" className="text-[16px]" />
                </div>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-4 right-4 font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-surface-container-high font-extrabold select-none">04</div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-tertiary-container text-on-tertiary flex items-center justify-center mb-6">
                    <Icon name="storefront" className="text-[24px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-3">Track &amp; Harvest Sales</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Capture digital weight tickets at harvest. Sell directly on the CultivaNode Open Marketplace to pre-verified bulk off-takers or consumers at premium prices.</p>
                </div>
                <div className="mt-6 pt-4 text-secondary font-label-md text-label-md flex items-center gap-1">
                  <span>Direct to off-taker</span>
                  <Icon name="chevron_right" className="text-[16px]" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-20" id="platform-capabilities">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mb-14">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Platform Capabilities</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-2">Built for high-density agricultural precision.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">CultivaNode combines spatial cartography, phenology models, ledger accounting, and micro-climate telemetry into an accessible interface.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <Icon name="map" className="text-[22px]" />
                  </div>
                  <span className="px-2.5 py-1 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold">PostGIS 3.4</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Farm &amp; Field Delineation</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">Cadastral polygons, elevation contours, and multi-field zoning. Store multiple plots across different local government areas with clear geofencing.</p>
                <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Auto hectare calculations &amp; perimeter mapping</div>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <Icon name="spa" className="text-[22px]" />
                  </div>
                  <span className="px-2.5 py-1 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold">Phenology</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Crop Management &amp; Calendars</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">Milestone-based operations: basal fertilizer, weed suppression, second top-dress, and defoliation. Tailored to local cultivars like SAMMAZ maize and TME cassava.</p>
                <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Dynamic pest outbreak alerts based on weather</div>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <Icon name="forklift" className="text-[22px]" />
                  </div>
                  <span className="px-2.5 py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">Machinery Hub</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Machinery &amp; Service Marketplace</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">Locate 75HP+ tractors, combine harvesters, boom sprayers, and certified labor gangs within your LGA radius. Integrated booking calendar and mobilization tracking.</p>
                <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Real-time machine location check-ins</div>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <Icon name="inventory_2" className="text-[22px]" />
                  </div>
                  <span className="px-2.5 py-1 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold">Traceability</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Smart Inventory &amp; Stock Tracker</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">Automated deduction of NPK bags, agrochemical liters, and seed bundles as operations are checked off in the field. Batch serial tracking prevents counterfeit inputs.</p>
                <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Re-order triggers before planting windows</div>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <Icon name="account_balance_wallet" className="text-[22px]" />
                  </div>
                  <span className="px-2.5 py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">Ledger</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Farm Books &amp; Double-Entry Ledger</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">Maintain institutional financial hygiene. Compute exact production cost per hectare, gross margin projections, and export certified PDF statements for credit unions.</p>
                <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Standardized IFRS-ready agricultural reports</div>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <Icon name="cloud_sync" className="text-[22px]" />
                  </div>
                  <span className="px-2.5 py-1 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold">NiMet + Radar</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Hyperlocal Agro-Meteorology</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">Integration with NiMet meteorological stations and Open-Meteo satellite arrays. Get rain onset predictions, soil temperature forecasts, and safe spraying wind windows.</p>
                <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 7-day hourly precipitation forecast</div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Ecosystem Participants</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-2">Engineered for every node in the agricultural chain.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">Whether operating 2 hectares in Iseyin or managing a fleet of 20 tractors across Ogun State, CultivaNode accelerates your business.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="psychology_alt" className="text-[20px]" />
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Farmers &amp; Producers</h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">Boost harvest yields with guided crop calendars, access vetted tractor hire without inflated broker fees, and create a verified production track record.</p>
                </div>
                <Link className="w-full py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md text-center hover:bg-primary hover:text-on-primary transition-all" href={`/${lang}/sign-up`}>Join as a Producer</Link>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="agriculture" className="text-[20px]" />
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Tractor &amp; Fleet Owners</h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">Fill your machinery deployment schedule by clustering bookings in adjacent farms. Guaranteed payout via secure escrow upon GPS job completion.</p>
                </div>
                <Link className="w-full py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md text-center hover:bg-primary hover:text-on-primary transition-all" href={`/${lang}/sign-up`}>Enroll Machinery Fleet</Link>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="engineering" className="text-[20px]" />
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Service Providers &amp; Labour</h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">Mechanics, certified sprayer technicians, and agronomy scouts build trusted reputations through authenticated digital work logs and guaranteed milestone pay.</p>
                </div>
                <Link className="w-full py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md text-center hover:bg-primary hover:text-on-primary transition-all" href={`/${lang}/sign-up`}>Register as Provider</Link>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="science" className="text-[20px]" />
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Input Suppliers &amp; Dealers</h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">Supply certified fertilizer, treated hybrid seed, and certified crop protection chemicals directly to verified clusters with pre-financed digital vouchers.</p>
                </div>
                <Link className="w-full py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md text-center hover:bg-primary hover:text-on-primary transition-all" href={`/${lang}/sign-up`}>List Agro-Inputs</Link>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="store" className="text-[20px]" />
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Institutional Buyers</h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">Contract farm clusters directly with full origin traceability, verified moisture grades, transparent weights, and scheduled bulk warehouse delivery.</p>
                </div>
                <a className="w-full py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md text-center hover:bg-primary hover:text-on-primary transition-all" href="#marketplace-section">Source Bulk Produce</a>
              </div>
              <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="groups" className="text-[20px]" />
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Cooperatives &amp; Govt Ag</h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">Aggregate member acreage, disburse seasonal support transparently, audit crop progress in real-time, and benchmark regional productivity across syndicates.</p>
                </div>
                <Link className="w-full py-2.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md text-center hover:bg-primary hover:text-on-primary transition-all" href={`/${lang}/solutions`}>Partner Syndicate Portal</Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Zero-Default Architecture</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-2">How machinery booking &amp; escrow works.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">We eliminate the fear of non-performance or unpaid jobs with an automated, biometric proof-of-work settlement pipeline.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-surface-container text-primary font-bold flex items-center justify-center font-label-md text-label-md mb-3">1</div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">Request Service</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Farmer selects boundary polygon and specifies harrowing depth or weed spray spec.</p>
                </div>
                <div className="mt-4 pt-3 flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium"><Icon name="touch_app" className="text-[16px] text-secondary" /> Direct Field Spec</div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-surface-container text-primary font-bold flex items-center justify-center font-label-md text-label-md mb-3">2</div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">Direct Quote</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Nearby equipment owners submit instant flat-rate bids with diesel &amp; operator included.</p>
                </div>
                <div className="mt-4 pt-3 flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium"><Icon name="request_quote" className="text-[16px] text-secondary" /> Zero Middlemen</div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center font-label-md text-label-md mb-3">3</div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">Escrow Locked</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Farmer pays funds into secure Central Bank-licensed custody. Provider sees funds guaranteed.</p>
                </div>
                <div className="mt-4 pt-3 flex items-center gap-1.5 text-secondary text-[12px] font-bold"><Icon name="lock" className="text-[16px]" /> Funds Protected</div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-surface-container text-primary font-bold flex items-center justify-center font-label-md text-label-md mb-3">4</div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">GPS Check-In</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Tractor checks in inside farm geofence. Work is tracked automatically via mobile telemetry.</p>
                </div>
                <div className="mt-4 pt-3 flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium"><Icon name="location_on" className="text-[16px] text-secondary" /> Cadastral Sync</div>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-surface-container text-primary font-bold flex items-center justify-center font-label-md text-label-md mb-3">5</div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">Proof Upload</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Operator uploads high-res completion pictures stamped with real-time GPS metadata.</p>
                </div>
                <div className="mt-4 pt-3 flex items-center gap-1.5 text-on-surface-variant text-[12px] font-medium"><Icon name="camera_alt" className="text-[16px] text-secondary" /> Audit Timestamp</div>
              </div>
              <div className="bg-primary-container text-on-primary p-5 rounded-xl shadow-sm flex flex-col justify-between relative">
                <div>
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center font-label-md text-label-md mb-3">6</div>
                  <h4 className="font-headline-sm text-headline-sm text-on-primary mb-2">Fund Release</h4>
                  <p className="font-body-sm text-body-sm text-on-primary/90">Farmer has 48h to confirm. Payout disburses automatically to tractor owner&apos;s bank account.</p>
                </div>
                <div className="mt-4 pt-3 flex items-center gap-1.5 text-secondary-container text-[12px] font-bold"><Icon name="verified" className="text-[16px]" /> Instant Settlement</div>
              </div>
            </div>
            <div className="mt-10 bg-secondary-container/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <Icon name="percent" className="text-[20px]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-primary">0% Commission During South-West Pilot</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Direct payments with verified proof-of-work arbitration. No transaction fee deduction for registered growers.</span>
                </div>
              </div>
              <Link className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shrink-0 transition-colors" href={`/${lang}/waitlist`}>Join Pilot Cluster Now</Link>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Interactive Telemetry Hub</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-2">Operational Command Center Preview</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm"><span className="w-2 h-2 rounded-full bg-secondary" /> Live Node: Oyo South-West Agro-Cluster</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                    <Icon name="yard" className="text-[20px]" />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary">Oke-Ogun Syndicate Node #04</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Agronomist Lead: Babatunde Adeleke · PostGIS Geofence #NG-OY-8821</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Early Rains Phenology Cycle</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
                <div className="bg-surface-container-low p-4 rounded-xl">
                  <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mb-1">
                    <span>Active Clusters</span>
                    <Icon name="hub" className="text-[18px] text-secondary" />
                  </div>
                  <div className="font-metric-num text-metric-num text-primary">4 Clusters</div>
                  <div className="text-[12px] text-on-surface-variant mt-1">Oke-Ogun, Egba, Sagamu, Iseyin</div>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl">
                  <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mb-1">
                    <span>Cultivated Area</span>
                    <Icon name="landscape" className="text-[18px] text-primary" />
                  </div>
                  <div className="font-metric-num text-metric-num text-primary">42.5 Ha</div>
                  <div className="text-[12px] text-secondary font-semibold mt-1">SAMMAZ-52 Maize &amp; TME-419 Cassava</div>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl">
                  <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mb-1">
                    <span>Soil Moisture (VWC)</span>
                    <Icon name="water_drop" className="text-[18px] text-secondary" />
                  </div>
                  <div className="font-metric-num text-metric-num text-secondary">31.4%</div>
                  <div className="text-[12px] text-secondary font-semibold mt-1">Optimal Vigor 0.79 NDVI</div>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl">
                  <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mb-1">
                    <span>Operations Due Today</span>
                    <Icon name="schedule" className="text-[18px] text-tertiary-container" />
                  </div>
                  <div className="font-metric-num text-metric-num text-tertiary-container">3 Actions</div>
                  <div className="text-[12px] text-on-surface-variant mt-1">Top-dressing, Solenoid Flush, Transit</div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                <div className="lg:col-span-8 rounded-xl overflow-hidden relative shadow-sm h-80 bg-surface-container">
                  <div className="w-full h-full bg-cover bg-center" data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/1dcb45acc4b9.webp')" }} />
                  <div className="absolute bottom-4 left-4 bg-surface-container-lowest/95 backdrop-blur-md p-3.5 rounded-lg shadow-md max-w-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-sm text-label-sm font-bold text-primary">Sector 03: Field B (18.2 Ha)</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-semibold">Tractor En Route</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">New Holland 80HP · Operator: Kazeem O. · ETA: 22 Mins</p>
                    <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full w-3/4" />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-4 flex flex-col gap-3">
                  <div className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Field Activity Stream</span>
                    <span className="text-[11px] text-secondary font-medium">Real-Time Sync</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm font-semibold text-primary">Urea Top-Dressing (Split 2)</span>
                      <span className="text-[11px] text-secondary font-bold">In Progress</span>
                    </div>
                    <span className="text-[12px] text-on-surface-variant">Block A-2 Maize · 6 bags allocated · 4 workers</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm font-semibold text-primary">Low-bed Tractor Transit</span>
                      <span className="text-[11px] text-tertiary-container font-bold">Escrow Verified</span>
                    </div>
                    <span className="text-[12px] text-on-surface-variant">Sagamu depot to Iseyin farm · Harrower attached</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface-container-low flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm font-semibold text-primary">Solenoid Drip Flush</span>
                      <span className="text-[11px] text-on-surface-variant font-bold">Due 16:00</span>
                    </div>
                    <span className="text-[12px] text-on-surface-variant">Solar pump zone 4 · Pressure check required</span>
                  </div>
                  <Link className="mt-2 text-center py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors" href={`/${lang}/platform`}>Launch Live Console Demo</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm w-fit font-semibold"><Icon name="verified_user" className="text-[16px] text-secondary" /> Sovereign Nigerian Data Protection</div>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary leading-tight">Institutional trust baked into every hectare.</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">CultivaNode operates in strict alignment with the <strong>Nigeria Data Protection Act (NDPA 2023)</strong>. Farmers retain absolute ownership of their cadastral boundaries, harvest yields, and commercial accounts.</p>
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-start gap-3">
                    <Icon name="check_circle" className="text-secondary text-[20px] shrink-0 mt-0.5" />
                    <span className="font-body-md text-body-md text-on-surface"><strong>Zero Data Exploitation:</strong> Your harvest data is never sold to speculative commodity traders.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="check_circle" className="text-secondary text-[20px] shrink-0 mt-0.5" />
                    <span className="font-body-md text-body-md text-on-surface"><strong>Biometric KYC Integrations:</strong> Identity verified against official NIMC records via Prembly and Smile ID.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="check_circle" className="text-secondary text-[20px] shrink-0 mt-0.5" />
                    <span className="font-body-md text-body-md text-on-surface"><strong>Immutable Audit Logs:</strong> Every equipment check-in, payment milestone, and voucher redemption has an auditable timestamp.</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-bold">Tier 0</span>
                      <Icon name="sms" className="text-[20px] text-on-surface-variant" />
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Registered User</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Phone SMS confirmed via Termii OTP. Access to marketplace browsing, public weather alerts, and open community agronomy articles.</p>
                  </div>
                  <div className="mt-4 pt-3 text-[11px] text-on-surface-variant font-medium">Auto-unlocked upon registration</div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-bold">Tier 1</span>
                      <Icon name="fingerprint" className="text-[20px] text-secondary" />
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">NIN Biometric Verified</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">National Identification Number verified via Prembly / Smile ID. Unlocks farm field polygon mapping, crop templates, and input requests.</p>
                  </div>
                  <div className="mt-4 pt-3 text-[11px] text-secondary font-semibold">Required for field mapping</div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold">Tier 2</span>
                      <Icon name="account_balance" className="text-[20px] text-primary" />
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">BVN &amp; Payout Active</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Bank Verification Number and commercial NUBAN account verified. Unlocks escrow deposits, wallet settlements, and machinery hire quotes.</p>
                  </div>
                  <div className="mt-4 pt-3 text-[11px] text-primary font-semibold">Instant bank disbursements</div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between border-2 border-secondary/20">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">Tier 3</span>
                      <Icon name="military_tech" className="text-[20px] text-secondary" />
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Trusted Provider</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">5+ successfully verified field operations, 4.0+ rating from syndicate farmers, zero open disputes. Priority machinery dispatch matching.</p>
                  </div>
                  <div className="mt-4 pt-3 text-[11px] text-secondary font-bold">Top-tier syndicate credential</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Institutional Alignment</span>
            <h3 className="font-headline-lg text-headline-lg text-primary mt-2 mb-10">Collaborating with Nigeria&apos;s leading agricultural institutions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                <Icon name="account_balance" className="text-[32px] text-primary mb-2" />
                <span className="font-label-md text-label-md text-on-surface font-semibold">OYSADEP</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] mt-1">Oyo State Agricultural Dev Programme</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                <Icon name="psychology" className="text-[32px] text-secondary mb-2" />
                <span className="font-label-md text-label-md text-on-surface font-semibold">IITA Youth Agripreneurs</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] mt-1">Research &amp; Hybrid Extension</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                <Icon name="energy_savings_leaf" className="text-[32px] text-primary mb-2" />
                <span className="font-label-md text-label-md text-on-surface font-semibold">NAGS-AP</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] mt-1">Nat. Agricultural Growth Scheme</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                <Icon name="partly_cloudy_day" className="text-[32px] text-secondary mb-2" />
                <span className="font-label-md text-label-md text-on-surface font-semibold">NiMet Nigeria</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] mt-1">Meteorological Station Feeds</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
                <Icon name="security" className="text-[32px] text-primary mb-2" />
                <span className="font-label-md text-label-md text-on-surface font-semibold">Paystack &amp; Smile ID</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] mt-1">Secured Escrow &amp; NIMC KYC</span>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Field Ground Reality</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-2">Pilot operations across South-West Nigeria.</h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Real machinery, real smallholders, and real soil being cultivated using verifiable telemetry.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col">
                <img className="w-full h-48 object-cover" data-alt="Nigerian tractor operator in an open cab blue tractor harrowing rich dark loamy soil in Iseyin Oyo State under early morning sunlight with clear field rows" src="/images/screens/3137c310df39.webp" alt="" loading="lazy" decoding="async" />
                <div className="p-4 flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-primary font-bold">Mechanized Harrowing</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Iseyin Cluster · Sub-meter GPS telemetry logged 14.5 Ha in 6.2 hours.</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col">
                <img className="w-full h-48 object-cover" data-alt="Extension officer in green vest using a mobile tablet in a lush green cassava field in Sagamu Ogun state, showing a female farmer crop cycle details" src="/images/screens/efa2bd052829.webp" alt="" loading="lazy" decoding="async" />
                <div className="p-4 flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-primary font-bold">Biometric Onboarding</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Sagamu Node · Onboarding cooperative members with offline-first KYC syncing.</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col">
                <img className="w-full h-48 object-cover" data-alt="Flooded green rice paddy field in Osun state Nigeria with modern channel irrigation and water management canals under bright sunny sky" src="/images/screens/f01e4cf0e477.webp" alt="" loading="lazy" decoding="async" />
                <div className="p-4 flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-primary font-bold">Lowland Rice Irrigation</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Ede South-West Basin · Sluice gate scheduling mapped to radar precipitation.</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col">
                <img className="w-full h-48 object-cover" data-alt="Stack of certified certified seed bags and fertilizer bags inside a clean rural farm depot warehouse in Oyo state with barcode labels" src="/images/screens/92005206fcce.webp" alt="" loading="lazy" decoding="async" />
                <div className="p-4 flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-primary font-bold">Voucher Redemption</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Ogbomoso Hub · Batch serial tracking ensures authentic inputs without dilution.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface py-20" id="marketplace-section">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-bold mb-3"><Icon name="shopping_cart" className="text-[16px]" /> Open Produce Marketplace</div>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary">CultivaNode Open Marketplace — Direct Farm-to-Table &amp; Commercial Sourcing</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">Any customer or business can browse, order, track, pay, and receive deliveries — without needing to be part of an agricultural cooperative. Create a customer account in seconds.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link className="px-5 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm" href={`/${lang}/marketplace`}>Explore Open Marketplace</Link>
                <Link className="px-5 py-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-colors" href={`/${lang}/sign-up`}>Register as Buyer</Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 bg-surface-container-low p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md">1</div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface">Browse Stock</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Live cluster harvests with quality grades</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md">2</div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface">Instant Escrow Pay</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Pay with Paystack, Card, or NUBAN</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md">3</div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface">Dedicated Logistics</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Direct haulage dispatch from Oyo &amp; Ogun</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md">4</div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface">Doorstep Delivery</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Depot or factory reception verification</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative">
                    <img className="w-full h-44 object-cover" data-alt="Clean premium dry white maize kernels in pristine woven burlap agricultural sack in a sunny Nigerian grain store" src="/images/screens/22ce44ed1e83.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-3 right-3 px-2 py-1 rounded bg-surface-container-lowest/90 font-label-sm text-label-sm font-bold text-primary">Grade A · Oke-Ogun</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Clean Dry White Maize</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">&lt;12.5% moisture, double-winnowed, pesticide compliant. 100kg standard sack.</p>
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="font-metric-num text-metric-num text-primary">₦64,000</span>
                      <span className="text-on-surface-variant text-[12px]">per 100kg bag</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <button className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-2" type="button">
                    <Icon name="add_shopping_cart" className="text-[18px]" />
                    <span>Order Stock</span>
                  </button>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative">
                    <img className="w-full h-44 object-cover" data-alt="Freshly harvested cassava tubers clean and thick on farm dirt in Oyo state under morning light ready for factory processing" src="/images/screens/87ea707aeeb8.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-3 right-3 px-2 py-1 rounded bg-surface-container-lowest/90 font-label-sm text-label-sm font-bold text-primary">Fresh Harvest</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Premium Cassava Roots</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Psaltry / Starch standard, high dry-matter content. Sourced from TME-419 varieties.</p>
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="font-metric-num text-metric-num text-primary">₦85,000</span>
                      <span className="text-on-surface-variant text-[12px]">per Metric Tonne</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <button className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-2" type="button">
                    <Icon name="add_shopping_cart" className="text-[18px]" />
                    <span>Order Stock</span>
                  </button>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative">
                    <img className="w-full h-44 object-cover" data-alt="Bright clean polished long grain milled rice Faro 44 in woven bag with clean studio illumination" src="/images/screens/5672fa141a70.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-3 right-3 px-2 py-1 rounded bg-surface-container-lowest/90 font-label-sm text-label-sm font-bold text-secondary font-bold">5% Broken</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Faro-44 Milled Rice</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Long-grain parboiled, stone-free, sorted via optical de-stoner. 50kg branded pack.</p>
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="font-metric-num text-metric-num text-primary">₦44,500</span>
                      <span className="text-on-surface-variant text-[12px]">per 50kg bag</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <button className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-2" type="button">
                    <Icon name="add_shopping_cart" className="text-[18px]" />
                    <span>Order Stock</span>
                  </button>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="relative">
                    <img className="w-full h-44 object-cover" data-alt="Traditional clean white fine grain Garri in a clean white sack container ready for consumer culinary retail" src="/images/screens/0bcd4a5f5931.webp" alt="" loading="lazy" decoding="async" />
                    <span className="absolute top-3 right-3 px-2 py-1 rounded bg-surface-container-lowest/90 font-label-sm text-label-sm font-bold text-primary">Ijebu Style</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Garri White Fine Grain</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Crisp, sour balance, moisture &lt;9.8%, zero sand particles. 80kg woven master bag.</p>
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="font-metric-num text-metric-num text-primary">₦38,000</span>
                      <span className="text-on-surface-variant text-[12px]">per 80kg bag</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <button className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-2" type="button">
                    <Icon name="add_shopping_cart" className="text-[18px]" />
                    <span>Order Stock</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface-container-low py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mb-14">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Technology Roadmap</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-2">The future of connected African agriculture.</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">CultivaNode is building towards a fully unified biological and telemetry data engine across West Africa.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-4">
                    <Icon name="pets" className="text-[22px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Livestock &amp; Aquaculture</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Broiler mortality tracking, catfish earthen pond water quality, FCR (Feed Conversion Ratio) optimization, and veterinary tele-triage.</p>
                </div>
                <div className="mt-6 pt-3 text-[11px] font-semibold text-secondary">Phase 2 · Q3 2025</div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-4">
                    <Icon name="sensors" className="text-[22px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">LoRaWAN &amp; IoT Irrigation</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Direct integration with cheap solar borehole controllers and low-cost underground soil capacitive sensors for precision fertigation.</p>
                </div>
                <div className="mt-6 pt-3 text-[11px] font-semibold text-secondary">Phase 2 · Q4 2025</div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-4">
                    <Icon name="record_voice_over" className="text-[22px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">CultivaNode AI &amp; Voice</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Agronomic diagnostics powered by multi-modal AI speaking native Yorùbá, Hausa, Igbo, and Nigerian Pidgin via WhatsApp voice notes.</p>
                </div>
                <div className="mt-6 pt-3 text-[11px] font-semibold text-secondary">Phase 3 · Q1 2026</div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center mb-4">
                    <Icon name="credit_score" className="text-[22px]" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Credit Underwriting</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Verified farm performance ledgers unlocking formal bank lending, working capital loans, and seasonal input credit facilities.</p>
                </div>
                <div className="mt-6 pt-3 text-[11px] font-semibold text-secondary">Phase 3 · Q2 2026</div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-surface py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-14">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Frequently Asked Questions</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary mt-2">Answers about the CultivaNode pilot.</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2 flex items-center justify-between">
                  <span>Where is the pilot currently running?</span>
                  <Icon name="expand_more" className="text-secondary text-[20px]" />
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">The Phase 1 deployment is active across South-West Nigeria: Oyo State (Oke-Ogun, Ibadan, Ogbomoso), Ogun State (Sagamu, Abeokuta, Ijebu), Osun State, Ondo, Ekiti, and Lagos logistics terminals.</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2 flex items-center justify-between">
                  <span>How does escrow protect both the farmer and the tractor owner?</span>
                  <Icon name="expand_more" className="text-secondary text-[20px]" />
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">When a farmer books harrowing, their money is locked safely in an escrow trust account. The tractor owner mobilizes with certainty that payment exists. Once the tractor completes the field boundary and submits GPS-tagged photographic proof, the farmer has 48 hours to confirm the job, after which payment is disbursed directly into the tractor owner&apos;s bank.</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2 flex items-center justify-between">
                  <span>Do I have to pay any platform fees during the pilot?</span>
                  <Icon name="expand_more" className="text-secondary text-[20px]" />
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">No. CultivaNode charges 0% commission on machinery bookings, crop sales, or input coordination during the South-West pilot. All platform tools, including boundary mapping, phenology calendars, and ledgers, are entirely free for pilot participants.</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2 flex items-center justify-between">
                  <span>Can external businesses buy bulk harvest directly?</span>
                  <Icon name="expand_more" className="text-secondary text-[20px]" />
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Yes. The Open Customer Marketplace allows supermarkets, food processors, feed millers, restaurants, and individuals to buy verified grain and roots without belonging to an agricultural cooperative. Deliveries are dispatched through coordinated haulage partners.</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2 flex items-center justify-between">
                  <span>What languages does CultivaNode support?</span>
                  <Icon name="expand_more" className="text-secondary text-[20px]" />
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">The platform is natively available in English and Yorùbá, complete with full localized terminology for agricultural operations, implements, and weather parameters. Pidgin and Hausa language modules are currently under development.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full bg-primary py-20 text-on-primary">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
              <span className="px-3.5 py-1.5 rounded-full bg-primary-container text-secondary-container font-label-md text-label-md">JOIN THE PILOT CORRIDOR</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-primary">Ready to transform your farm operations?</h2>
              <p className="font-body-lg text-body-lg text-on-primary/80">Join over 300 forward-thinking farmers, tractor owners, and commercial buyers across South-West Nigeria on the CultivaNode network today.</p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link className="px-6 py-3.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-lg text-label-lg hover:bg-secondary transition-colors font-bold shadow-md" href={`/${lang}/sign-up`}>Create Free Account</Link>
                <Link className="px-6 py-3.5 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary-container/80 transition-colors shadow-sm" href={`/${lang}/sign-up`}>Register as Equipment Provider</Link>
                <a className="px-6 py-3.5 rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg hover:bg-surface-container transition-colors shadow-sm" href="#marketplace-section">Shop Fresh Produce</a>
              </div>
              <div className="flex items-center gap-6 pt-6 text-on-primary/70 font-body-sm text-body-sm">
                <span>NDPA 2023 Compliant</span>
                <span>•</span>
                <span>Zero Pilot Commission</span>
                <span>•</span>
                <span>PostGIS Geofenced</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
