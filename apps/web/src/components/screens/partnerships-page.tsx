// Ported from the "institutional_partnerships_ecosystem_cultivanode" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function PartnershipsPage(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="w-full bg-surface-container-low py-3 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
              <span className="inline-flex items-center gap-1.5 text-primary"><Icon name="account_balance" className="text-[16px]" /> Institutional</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="hover:text-primary transition-colors cursor-pointer">Strategic Partnerships</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="text-on-surface font-semibold bg-surface-container px-2 py-0.5 rounded">Ecosystem Accreditation</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-secondary bg-surface-container-lowest px-2.5 py-1 rounded-full shadow-sm"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> CBN Escrow Gateway: Live &amp; Synced</span>
              <span className="hidden sm:inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant"><Icon name="verified" className="text-[15px]" /> NDPA 2023 Tier-IV Registered</span>
            </div>
          </div>
        </div>
        <section className="w-full py-12 lg:py-20 px-6 lg:px-12 relative overflow-hidden bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm tracking-wide"><Icon name="hub" className="text-[18px]" /> REGIONAL AGRARIAN INFRASTRUCTURE PROTOCOL</div>
                <h1 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface tracking-tight text-balance leading-tight">Collaborate with the <span className="text-primary font-bold">Agrarian Operating System</span> for South-West Nigeria</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">Partner with CultivaNode to deliver verified agricultural extension, digital escrow clearing, data-backed lending, and sovereign food security telemetry across regional agricultural clusters.</p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all shadow-md font-label-lg text-label-lg" href="#inquiry-form"><Icon name="corporate_fare" className="text-[20px]" /> Inquire for Institutional Partnership</a>
                  <a className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all shadow-sm font-label-lg text-label-lg" href="/api/documents/institutional-whitepaper?download=1"><Icon name="picture_as_pdf" className="text-[20px]" /> Download Institutional Whitepaper (PDF)</a>
                </div>
                <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm pt-2">
                  <span className="flex items-center gap-1.5"><Icon name="check_circle" className="text-secondary text-[16px]" /> Providus Bank PLC</span>
                  <span className="flex items-center gap-1.5"><Icon name="check_circle" className="text-secondary text-[16px]" /> Wema Bank ALAT</span>
                  <span className="flex items-center gap-1.5"><Icon name="check_circle" className="text-secondary text-[16px]" /> OYSADEP &amp; OGADEP Validated</span>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-surface-container-low p-6">
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="radar" className="text-primary text-[22px]" />
                      <span className="font-headline-sm text-headline-sm text-on-surface">Telemetry Command Desk</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Active Node Swarm</span>
                  </div>
                  <div className="relative w-full h-44 rounded-xl overflow-hidden mb-5">
                    <img className="w-full h-full object-cover" data-alt="High-resolution aerial satellite composite showing verified agricultural hectares in Oyo and Ogun States Nigeria with digital parcel overlays, irrigation telemetry boundaries, and emerald green maize and cassava farm plots under radiant equatorial daylight." src="/images/screens/029e48e8e1c1.webp" alt="" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-on-primary font-label-sm text-label-sm flex items-center gap-1.5"><Icon name="satellite_alt" className="text-[16px]" /> Sentinel-2 Multi-spectral NDVI Scan: 0.82 High Vigor</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">Validated Landmass</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-metric-num text-metric-num text-primary font-bold">14,820+</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Ha</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm"><Icon name="trending_up" className="text-[14px]" /> +1,450 Ha this cycle</div>
                    </div>
                    <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">Active Clusters</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-metric-num text-metric-num text-on-surface font-bold">28</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Nodes</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-primary font-label-sm text-label-sm"><Icon name="location_on" className="text-[14px]" /> Oyo, Ogun, Osun, Ondo</div>
                    </div>
                    <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">Escrow Settlement</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-headline-lg text-headline-lg text-on-surface font-bold">Tier 1</span>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">Rails</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block mt-1">Providus &amp; Wema Secured</span>
                    </div>
                    <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">Data Sovereignty</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-headline-lg text-headline-lg text-secondary font-bold">NDPA</span>
                        <span className="font-label-sm text-label-sm text-on-surface font-bold">2023</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary block mt-1">Consent Vault Certified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col gap-3 max-w-2xl">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">Document §4.17 Framework</span>
                <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">Strategic Institutional Partnership Pillars</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">CultivaNode operates modular institutional pathways designed to interface seamlessly with ministerial mandates, banking credit criteria, international development protocols, and industrial agro-processing specifications.</p>
              </div>
              <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg font-label-md text-label-md text-primary"><Icon name="layers" className="text-[20px]" /> Multi-Tenant Architecture</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                      <Icon name="account_balance" className="text-[26px]" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">Track 01 • Ministerial</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">State Governments &amp; ADPs (OYSADEP, OGADEP)</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Comprehensive operational digitisation for state agricultural development programmes. Empowering state extension directors with real-time regional crop census, geofenced input subsidy vouchers, verifiable farmer registries, and zero-leakage intervention execution.</p>
                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Geofenced E-Vouchers:</strong> Biometrically bound agro-dealer redemption prevents input diversion.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Biometric Census:</strong> Geotagged farm boundaries with verified NIN-linked farmer identifiers.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Zero-Leakage Allocations:</strong> Automated tracking from state central warehouse to farm gate.</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low -mx-8 -mb-8 p-6 rounded-b-2xl flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Target Partners</span>
                  <span className="font-label-md text-label-md text-primary font-bold">Oyo OYSADEP • Ogun OGADEP • Osun ADP</span>
                </div>
              </div>
              <div className="bg-surface rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center">
                      <Icon name="payments" className="text-[26px]" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">Track 02 • Financial</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">Commercial Banks, Microfinance &amp; Ag-Lenders</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">De-risking agrarian loan portfolios with verifiable agronomic underwriting. Access pre-screened borrower dossiers backed by historical double-entry farm books, satellite NDVI verification, and automated loan recovery via forward off-take escrow.</p>
                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Automated Escrow Recovery:</strong> Priority lien settlement upon mill gate weight-bridge intake.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Synthetic Credit Scoring:</strong> 24-month agronomic yield track records cross-referenced with weather risk.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>In-Season Growth Audits:</strong> Weekly vegetative vigor alerts highlighting distress before default.</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low -mx-8 -mb-8 p-6 rounded-b-2xl flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Integration Rails</span>
                  <span className="font-label-md text-label-md text-secondary font-bold">Providus • Wema ALAT • Bank of Agriculture</span>
                </div>
              </div>
              <div className="bg-surface rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary flex items-center justify-center">
                      <Icon name="public" className="text-[26px]" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">Track 03 • Multilateral</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">Development Agencies &amp; NGOs (World Bank, IITA)</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Auditable grant disbursement and real-time social impact metrics. Deliver programmatic funding with tamper-evident impact monitoring, gender &amp; youth inclusion tracking, and immutable milestone-based seed capital disbursement trails.</p>
                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Impact Verification:</strong> Cryptographically logged training attendance and yield delta tracking.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Demographic Inclusivity:</strong> Automated disaggregation for female-headed farming syndicates.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Auditable Grant Rail:</strong> Provable expenditure from institutional account directly to verified input purchase.</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low -mx-8 -mb-8 p-6 rounded-b-2xl flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Accreditation</span>
                  <span className="font-label-md text-label-md text-primary font-bold">World Bank APPEALS • AFDB • IITA Resilient Yields</span>
                </div>
              </div>
              <div className="bg-surface rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-inverse-surface text-inverse-on-surface flex items-center justify-center">
                      <Icon name="precision_manufacturing" className="text-[26px]" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">Track 04 • Commercial</span>
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface">Industrial Processors &amp; Food Millers</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Industrial-grade raw material security for major millers and agro-allied conglomerates. Establish long-term structured off-take contracts, quality-tested farmgate aggregation, digital weighbridge integration, and end-to-end origin traceability.</p>
                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Contract Hedging:</strong> Forward delivery guarantees locked via tripartite conditional escrow.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Quality Sorting at Node:</strong> Moisture analysis and starch content grading logged before freight haulage.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Icon name="check_circle" className="text-secondary text-[18px] mt-0.5" />
                      <span className="font-body-sm text-body-sm text-on-surface"><strong>Digital Weighbridge API:</strong> Instant mass verification at receiving hopper automatically releases funds.</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low -mx-8 -mb-8 p-6 rounded-b-2xl flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Processors</span>
                  <span className="font-label-md text-label-md text-primary font-bold">Flour Mills of Nigeria • Nestlé Ag-Supply • Olam Agri</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div className="flex flex-col gap-3 max-w-3xl">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">Architecture &amp; Trust (§21.3 &amp; §22)</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">Federated Data Mesh &amp; Sovereign Settlement Protocols</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">CultivaNode provides strict cryptographic boundary protections, decoupling farmer identity and land tenure rights from raw institutional data consumption while automating settlement through regulated commercial banks.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="api" className="text-[28px]" />
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">Module 01 • Interoperability</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">API &amp; Webhook Gateways</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">RESTful and gRPC endpoints delivering read-only consented credit dossiers, geocadastral geoJSON exports, and batch voucher disbursement execution. Built with rate-limited TLS 1.3 mutual auth.</p>
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2 font-mono text-[11px] text-on-surface">
                    <div className="flex items-center justify-between text-secondary">
                      <span className="font-bold">GET /api/v2/cadastre/clusters</span>
                      <span className="text-label-sm">200 OK</span>
                    </div>
                    <div className="text-on-surface-variant truncate">Auth: Bearer jwt_institution_token</div>
                    <div className="text-primary truncate">&#123; &quot;cluster_id&quot;: &quot;OY-IBD-04&quot;, &quot;hectares&quot;: 840.5 &#125;</div>
                  </div>
                </div>
                <div className="pt-6 mt-6 flex items-center gap-2 text-primary font-label-md text-label-md"><Icon name="verified" className="text-[18px]" /> OpenAPI 3.1 &amp; ISO 19115 Geospatial</div>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                    <Icon name="lock" className="text-[28px]" />
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block mb-1">Module 02 • Data Governance</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">NDPA 2023 Consent Vault</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Farmer-controlled, cryptographic, revocable consent tokens. No unconsented bulk telemetry exposure. Farmers grant granular access to lenders via USSD PIN authentication with automatic expiration.</p>
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">Consent Hash Validation</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">NDPC Registered</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                    <span className="text-[11px] text-on-surface-variant">Zero Raw PII Storage • Ephemeral Dossiers</span>
                  </div>
                </div>
                <div className="pt-6 mt-6 flex items-center gap-2 text-secondary font-label-md text-label-md"><Icon name="gavel" className="text-[18px]" /> Full NDPA 2023 Statutory Compliance</div>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container">
                    <Icon name="account_balance_wallet" className="text-[28px]" />
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider block mb-1">Module 03 • Clearing &amp; Settlement</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">CBN Escrow Clearing Rails</h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Tripartite escrow settlement guarantees zero advance capital risk for off-takers and immediate syndicate payouts. Programmed disbursement via Providus Bank and Wema Bank ALAT Agri settlement rails.</p>
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                      <span>Escrow Collateral State</span>
                      <span className="text-secondary font-bold">100% Ring-Fenced</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">Providus Special Escrow Account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">Wema Instant Sub-Wallet Clearing</span>
                    </div>
                  </div>
                </div>
                <div className="pt-6 mt-6 flex items-center gap-2 text-primary font-label-md text-label-md"><Icon name="account_balance" className="text-[18px]" /> CBN Tier-1 Deposit Guarantee</div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface-container-low">
          <div className="max-w-7xl mx-auto flex flex-col gap-10">
            <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">Accreditation Registry</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Verified Institutional Ecosystem</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">CultivaNode actively integrates with state agricultural ministries, apex research centers, seed councils, and licensed financial settlement institutions.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="nature_people" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">OYSADEP</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Oyo State Ag Dev Prog</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[10px]">Active Node</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="agriculture" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">OGADEP</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Ogun State Ag Dev Prog</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[10px]">Verified Registry</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <Icon name="account_balance" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">Providus Bank</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Agri-Desk Clearing</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm text-[10px]">Tier-1 Escrow</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="currency_exchange" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">Wema Bank</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">ALAT Agri Rails</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[10px]">Settlement Host</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-tertiary">
                  <Icon name="spa" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">NASC</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Seed Council Nigeria</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm text-[10px]">Genetic Trace</span>
              </div>
              <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <Icon name="biotech" className="text-[30px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold">IITA Ibadan</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Research Affiliate</div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[10px]">Soil / Phenotype</span>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">Deployment Lifecycle</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">Institutional Onboarding &amp; Vetting Journey</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">From bilateral mandate to live field operations, our 4-phase synchronization ensures governance rigor, cryptographic data security, and seamless field officer integration.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              <div className="bg-surface p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-lg">01</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Days 1–7</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Expression of Interest (EOI) &amp; Compliance</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Initial submission of programmatic mandate, verification of regulatory standing (CBN / State ExCo / Multilateral charter), and preliminary node compatibility analysis.</p>
                </div>
                <div className="pt-4 mt-4 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm"><Icon name="verified" className="text-[16px]" /> SLA &amp; Charter Clearance</div>
              </div>
              <div className="bg-surface p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-lg">02</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Days 8–14</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Data Governance &amp; NDPA Bilateral</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Execution of bilateral Data Protection Service Agreements compliant with NDPA 2023. Definition of authorized telemetry scopes, encryption protocols, and token expiration rules.</p>
                </div>
                <div className="pt-4 mt-4 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm"><Icon name="shield" className="text-[16px]" /> NDPC Registered Agreement</div>
              </div>
              <div className="bg-surface p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-lg">03</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Days 15–21</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Sandbox API &amp; Protocol Alignment</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Provisioning of institutional API sandbox keys, mock escrow settlement pipeline configuration, and custom webhook registration for cluster weight and moisture updates.</p>
                </div>
                <div className="pt-4 mt-4 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm"><Icon name="terminal" className="text-[16px]" /> mTLS Credentials Issued</div>
              </div>
              <div className="bg-surface p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-label-lg">04</span>
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Live Launch</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Field Deployment &amp; Officer Sync</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Mobilisation across designated cluster nodes. Field extension agents equipped with synced hand-held tablets for real-time validation and farmer onboarding.</p>
                </div>
                <div className="pt-4 mt-4 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-bold"><Icon name="sensors" className="text-[16px]" /> Cluster Nodes Operational</div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-16 px-6 lg:px-12 bg-surface" id="inquiry-form">
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="text-center flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">Formal Submission Desk</span>
              <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">Transmit Institutional Partnership Inquiry</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">Direct institutional submissions are processed by CultivaNode’s Executive Directorate in Ibadan with official response SLAs within 48 business hours.</p>
            </div>
            <div className="bg-surface-container-lowest p-8 lg:p-10 rounded-2xl shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="institutionalInquiryForm" role="form">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface">Institution Name <span className="text-error">*</span></label>
                  <input className="h-11 px-4 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" placeholder="e.g., Oyo State Ministry of Agriculture & Rural Development" required type="text" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">Institution Category <span className="text-error">*</span></label>
                  <select defaultValue="" className="h-11 px-4 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" required>
                    <option disabled value="">Select institutional category</option>
                    <option value="state_gov">State Government Ministry / ADP (OYSADEP, OGADEP, etc.)</option>
                    <option value="commercial_bank">Commercial Bank / Ag-Lending Desk</option>
                    <option value="microfinance">Microfinance Institution / Regional Credit Syndicate</option>
                    <option value="multilateral">Multilateral Development Agency / NGO (WB, AFDB, IITA)</option>
                    <option value="industrial_offtaker">Industrial Processor / Agro-Allied Miller</option>
                    <option value="research">Seed Council / Federal Agronomic Research Center</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">Designated Representative <span className="text-error">*</span></label>
                  <input className="h-11 px-4 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" placeholder="Full Name & Title (e.g. Dr. A. Adebayo, Dir. Extension)" required type="text" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">Official Institutional Email <span className="text-error">*</span></label>
                  <input className="h-11 px-4 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" placeholder="name@ministry.gov.ng or desk@bank.com" required type="email" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">Direct Telephone Number <span className="text-error">*</span></label>
                  <input className="h-11 px-4 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" placeholder="+234 (0) 803 000 0000" required type="tel" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface">Geographic Area of Interest <span className="text-error">*</span></label>
                  <select defaultValue="" className="h-11 px-4 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" required>
                    <option disabled value="">Select regional cluster area</option>
                    <option value="oyo">Oyo State (Ibadan, Saki, Ogbomoso, Iseyin Cassava Corridor)</option>
                    <option value="ogun">Ogun State (Abeokuta, Ijebu, Sagamu Grain/Poultry Hub)</option>
                    <option value="osun">Osun State (Osogbo, Ilesa, Ife Agro-forestry Belt)</option>
                    <option value="ondo">Ondo State (Akure, Owo, Ondo Cocoa &amp; Oil Palm Node)</option>
                    <option value="regional_multi">Pan-South-West Multi-State Cluster Swarm</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface">Proposed Collaboration Scope &amp; Target Hectares / Volume</label>
                  <textarea className="px-4 py-3 rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm resize-none" placeholder="Detail target crop cycles (cassava, maize, soybean, cocoa), anticipated budget or escrow throughput, extension officer count, and primary technical integration requirements..." rows={4} />
                </div>
                <div className="flex items-start gap-3 md:col-span-2 bg-surface-container-low p-4 rounded-xl">
                  <input className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" id="ndpaAck" required type="checkbox" />
                  <label className="font-label-sm text-label-sm text-on-surface-variant leading-snug" htmlFor="ndpaAck">I acknowledge that institutional data sharing is regulated under the Nigeria Data Protection Act (NDPA 2023) and subject to Providus/Wema escrow clearing governance. All communications through this portal remain strictly confidential.</label>
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm"><Icon name="verified_user" className="text-secondary text-[18px]" /> Encrypted via CultivaNode Gov-TLS Rails</div>
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all shadow-md font-label-lg text-label-lg font-semibold" type="submit"><Icon name="send" className="text-[20px]" /> Transmit Institutional Inquiry</button>
                </div>
              </div>
              <div className="hidden mt-6 p-6 rounded-xl bg-secondary-container text-on-secondary-container flex items-start gap-4" id="formSuccessMessage">
                <Icon name="check_circle" className="text-[28px] text-secondary shrink-0" />
                <div className="flex flex-col gap-1">
                  <h4 className="font-headline-sm text-headline-sm font-bold">Institutional Transmission Logged</h4>
                  <p className="font-body-sm text-body-sm">Your Expression of Interest reference #CN-INS-2025-089 has been securely routed to the Strategic Partnerships Directorate. A formal protocol docket will be issued to your official email within 48 business hours.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 px-6 lg:px-12 bg-surface-container-low">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary">
                <Icon name="corporate_fare" className="text-[24px]" />
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">CultivaNode Institutional Headquarters</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Agrarian Innovation Hub, Agodi GRA, Ibadan, Oyo State, Nigeria</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-on-surface font-label-md text-label-md">
              <a className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm hover:bg-surface-container transition-colors" href="mailto:institutions@cultivanode.ng"><Icon name="mail" className="text-secondary text-[18px]" /> institutions@cultivanode.ng</a>
              <a className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm hover:bg-surface-container transition-colors" href="tel:+234202948200"><Icon name="phone" className="text-secondary text-[18px]" /> +234 (0) 202 948 200</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
