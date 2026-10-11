// Ported from the "grants_subsidies_programmes_9.4" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function GrantsHub(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="w-full bg-surface-container-low px-space-lg py-space-sm rounded-xl mb-space-md shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-wrap items-center gap-space-md">
              <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded-lg shadow-sm">
                <Icon name="verified_user" className="text-[18px] text-secondary" />
                <span className="font-label-sm text-label-sm text-primary font-semibold">FMAFS NAGS-AP ACCREDITED NODE #FG-AGR-881</span>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded-lg shadow-sm">
                <Icon name="account_balance" className="text-[18px] text-primary-container" />
                <span className="font-label-sm text-label-sm text-on-surface">AfDB &amp; World Bank SAPZ Subsidy Window</span>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded-lg shadow-sm">
                <Icon name="fingerprint" className="text-[18px] text-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface">NIN Biometric &amp; USSD e-Voucher Tokenizer</span>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded-lg shadow-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Merkle SHA-256 Deduplication Active</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Audit Cycle:</span>
              <span className="bg-primary-container text-on-primary-container font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-semibold">Q1-2026 Sovereign Verified</span>
              <Icon name="verified" className="text-[18px] text-secondary cursor-pointer hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg">
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-sm">
            <button className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg font-label-lg text-label-lg bg-surface-container-lowest text-primary font-semibold shadow-sm transition-all" id="tab-admin" type="button"><Icon name="policy" className="text-[18px] text-primary" /> Programme Administrator &amp; Donor Desk</button>
            <button className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-all" id="tab-farmer" type="button"><Icon name="groups_2" className="text-[18px] text-outline" /> Farmer &amp; Co-operative Beneficiary View</button>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="flex items-center bg-surface-container-lowest px-space-sm py-1.5 rounded-lg shadow-sm">
              <Icon name="filter_list" className="text-[18px] text-outline mr-space-xs" />
              <select className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer">
                <option>All Active Programmes (6 Windows)</option>
                <option>National NAGS-AP (Dry &amp; Wet)</option>
                <option>AfDB SAPZ Infrastructure</option>
                <option>OYSADEP Clean Seed Multiplier</option>
                <option>Global Climate Resilience Fund</option>
              </select>
            </div>
            <button className="flex items-center gap-space-xs px-space-md py-1.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-lg shadow-sm hover:bg-surface-container transition-all" type="button"><Icon name="cloud_download" className="text-[18px] text-secondary" /> Export Ledger (.CSV)</button>
            <button className="flex items-center gap-space-xs px-space-md py-1.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-primary transition-all font-semibold" type="button"><Icon name="assignment_add" className="text-[18px] text-secondary-fixed" /> New Grant Call / Allocation</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md mb-space-xl">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Committed Grant Pool</span>
              <Icon name="account_balance_wallet" className="text-[20px] text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-metric-num text-metric-num text-primary font-bold">₦640.80M</span>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-1.5 py-0.5 rounded font-semibold">+34.5% YoY</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">3 Windows</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Disbursed Subsidy</span>
              <Icon name="payments" className="text-[20px] text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">₦412.50M</span>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <div className="w-16 bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "64.4%" }} />
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">64.4% deployed</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Enrolled Smallholders</span>
              <Icon name="badge" className="text-[20px] text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">4,820</span>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <Icon name="check_circle" className="text-[14px] text-secondary" />
                <span className="font-body-sm text-body-sm text-on-surface-variant">92.4% Cadastral Verified</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">e-Voucher Redemption</span>
              <Icon name="qr_code_scanner" className="text-[20px] text-tertiary-container" />
            </div>
            <div className="flex flex-col">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">96.2%</span>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant">₦245.8M Seed/Fert.</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Field Agent SLA</span>
              <Icon name="timer" className="text-[20px] text-primary-container" />
            </div>
            <div className="flex flex-col">
              <span className="font-metric-num text-metric-num text-on-surface font-bold">2.8 Days</span>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-1.5 py-0.5 rounded font-semibold">-0.8d vs Target</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Clean Audit Score</span>
              <Icon name="verified" className="text-[20px] text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="font-metric-num text-metric-num text-secondary font-bold">99.4%</span>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <span className="font-body-sm text-body-sm text-on-surface-variant">0 Phantom Claims</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <div className="flex items-center justify-between bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-primary-fixed">
                  <Icon name="hub" className="text-[20px]" />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Active Subsidized Portfolios &amp; Facilities</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Federal, AfDB, and Oyo State intervention facilities under active management</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">4 Facilities Active</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-space-md mb-space-md">
                <div className="flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                    <Icon name="eco" className="text-primary text-[28px]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs mb-1">
                      <span className="font-headline-md text-headline-md text-on-surface font-bold">Federal NAGS-AP 2026 Early Rains</span>
                      <span className="bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm px-2 py-0.5 rounded-full font-semibold">National Scheme</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">50% Input Subsidy e-Voucher Window · Target Crops: Maize (SAMMAZ-52) &amp; Cassava (TME-419)</p>
                  </div>
                </div>
                <div className="text-right flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦198.40M <span className="font-body-sm text-body-sm text-outline font-normal">/ ₦280.00M Pool</span></span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">70.8% Subsidized Capital Released</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md p-space-md bg-surface-container-low rounded-xl mb-space-md">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Standard Per-Ha Quota</span>
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface mt-0.5">4 Bags NPK 20-10-10 · 2 Bags Urea · 25kg Seed</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Beneficiaries Cleared</span>
                  <span className="font-body-sm text-body-sm font-semibold text-primary mt-0.5">2,150 Farmers (100% NIN &amp; PostGIS Bounds)</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Depot Redemptions</span>
                  <span className="font-body-sm text-body-sm font-semibold text-secondary mt-0.5">1,980 Vouchers Redeemed (Saki &amp; Iseyin Hubs)</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-md">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                    <Icon name="verified" className="text-[16px] text-secondary" />
                    <span>USSD Token Validated</span>
                  </div>
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                    <Icon name="satellite_alt" className="text-[16px] text-secondary" />
                    <span>Cadastral Boundary Linked</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors font-medium" type="button">Download NAGS Dossier</button>
                  <button className="px-space-md py-1.5 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md rounded-lg transition-colors font-semibold flex items-center gap-space-xs" type="button"><Icon name="done_all" className="text-[16px] text-secondary-fixed" /> Batch Authorize e-Vouchers</button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-space-md mb-space-md">
                <div className="flex items-start gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                    <Icon name="precision_manufacturing" className="text-secondary text-[28px]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs mb-1">
                      <span className="font-headline-md text-headline-md text-on-surface font-bold">AfDB Special Agro-Industrial Processing Zones (SAPZ)</span>
                      <span className="bg-surface-variant text-on-surface-variant text-label-sm font-label-sm px-2 py-0.5 rounded-full font-semibold">CAPEX Grant (70%)</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Mechanization Syndication &amp; Solar Tube-Well Irrigation Subsidy for Registered Co-operatives</p>
                  </div>
                </div>
                <div className="text-right flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦145.20M <span className="font-body-sm text-body-sm text-outline font-normal">/ ₦220.00M Pool</span></span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">Milestone 2 Inspection Cleared</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md p-space-md bg-surface-container-low rounded-xl mb-space-md">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Syndicated Fleet Delivered</span>
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface mt-0.5">38 Massey Ferguson 375 + Ripper Harrows</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Boreholes Energized</span>
                  <span className="font-body-sm text-body-sm font-semibold text-primary mt-0.5">42 Solar Wells (Iseyin, Saki &amp; Ibarapa)</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">COREN Attestation</span>
                  <span className="font-body-sm text-body-sm font-semibold text-secondary mt-0.5">Physical GPS Logged (#COR-NG-9042)</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                  <Icon name="schedule" className="text-[16px] text-tertiary-container" />
                  <span>Tranche 3 Liquidation: Ready for Disbursement Sign-off</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors font-medium" type="button">Review Inspection Dossier</button>
                  <button className="px-space-md py-1.5 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-label-md rounded-lg transition-colors font-semibold" type="button">Trigger Tranche 3 (₦28.50M)</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold">OYSADEP State Scheme</span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">94% Distributed</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">Clean Seed Multiplier</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">100% Free Breeder Cassava Stems (TME-419) &amp; Rhizobium bio-inoculant for 1,420 Women &amp; Youth Smallholders.</p>
                </div>
                <div className="mt-space-md pt-space-sm bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="wifi_off" className="text-[16px] text-secondary" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Edge PowerSync Sync: 0 Pending</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">₦45.0M Value</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <span className="bg-surface-variant text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold">Green Climate Fund</span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">Sentinel-2 Cleared</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">Biochar &amp; Agroforestry Rebate</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">₦45,000 / Hectare performance payout verified via satellite canopy density &amp; organic soil carbon indexing.</p>
                </div>
                <div className="mt-space-md pt-space-sm bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="satellite" className="text-[16px] text-primary" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant">770 Ha Satellite Indexed</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">₦34.65M Active</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-space-sm mb-space-md bg-surface-container-low -mx-space-lg -mt-space-lg p-space-md rounded-t-xl">
                <div className="flex items-center gap-space-xs">
                  <Icon name="fact_check" className="text-[20px] text-primary" />
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">Adjudication Dossier #042</span>
                </div>
                <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">Pending Multi-Sign</span>
              </div>
              <div className="mb-space-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Cluster Target</span>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">Oke-Ogun Soya Alliance</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">₦34,800,000.00</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">310 Smallholders · 220 Ha Surveyed Perimeter</p>
              </div>
              <div className="flex flex-col gap-space-sm mb-space-lg">
                <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-low rounded-lg">
                  <Icon name="verified_user" className="text-[18px] text-secondary mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">NIN Biometric &amp; ID Attestation</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">100% matched via Prembly/SmileID. Zero duplications.</span>
                  </div>
                </div>
                <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-low rounded-lg">
                  <Icon name="map" className="text-[18px] text-secondary mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Cadastral PostGIS Boundary Cross-Check</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Zero perimeter overlaps across 34 village polygons.</span>
                  </div>
                </div>
                <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-low rounded-lg">
                  <Icon name="security" className="text-[18px] text-secondary mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">Double-Dipping Sentinel Check</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">0 conflicts across NIRSAL CRG or Bank Anchor registries.</span>
                  </div>
                </div>
              </div>
              <div className="mb-space-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">Authorizing Sign-offs</span>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between text-body-sm font-body-sm p-1.5 bg-surface-container-low rounded">
                    <span className="text-on-surface">Lead Field Agronomist (Q. Olapade)</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-0.5"><Icon name="check" className="text-[14px]" /> SIGNED</span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm p-1.5 bg-surface-container-low rounded">
                    <span className="text-on-surface">FMAFS Desk Auditor (Engr. Balogun)</span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-0.5"><Icon name="check" className="text-[14px]" /> SIGNED</span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm p-1.5 bg-surface-container-low rounded">
                    <span className="text-on-surface">Co-op General Assembly Token</span>
                    <span className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center gap-0.5"><Icon name="key" className="text-[14px]" /> OTP VALIDATED</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-space-xs">
                <button className="w-full py-2 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold shadow-sm flex items-center justify-center gap-space-xs transition-colors" type="button"><Icon name="send_money" className="text-[18px] text-secondary-fixed" /> Authorize Batch Disbursement (₦34.80M)</button>
                <button className="w-full py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg font-medium transition-colors text-center" type="button">View Field Agent Video Verification Log</button>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Field Verification Telemetry</span>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">Live Feed</span>
              </div>
              <div className="relative w-full h-36 rounded-lg overflow-hidden mb-space-sm shadow-sm">
                <img className="w-full h-full object-cover" data-alt="West African agricultural field officer in a high-visibility vest conducting biometric tablet registration of rural farmers in a lush maize field under natural bright tropical daylight with agricultural survey equipment visible" src="/images/screens/84eefa29f5c5.webp" alt="" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-space-sm">
                  <span className="font-label-sm text-label-sm text-on-primary font-semibold">Agent Babatunde K. · GPS: 8.019° N, 3.421° E · Saki West</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                <span>Synced 4 mins ago via Starlink Node</span>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">100% Attested</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-lg mb-space-xl">
          <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <Icon name="receipt_long" className="text-[22px] text-primary" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Beneficiary e-Voucher &amp; Input Redemption Ledger</h2>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Live audit ledger tracking smallholder allocations, agro-dealer redemptions, and subsidy payouts</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center bg-surface-container-low px-space-sm py-1.5 rounded-lg">
                <Icon name="search" className="text-[18px] text-outline mr-space-xs" />
                <input className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder-outline w-56" placeholder="Filter by NIN, Farmer, or Co-op..." type="text" />
              </div>
              <button className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg font-medium transition-colors" type="button">Audit Query</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container-low text-on-surface font-label-md text-label-md uppercase tracking-wider">
                <tr>
                  <th className="py-space-sm px-space-md rounded-l-lg">Beneficiary &amp; NIN</th>
                  <th className="py-space-sm px-space-md">Co-operative &amp; Cluster</th>
                  <th className="py-space-sm px-space-md">GPS Perimeter</th>
                  <th className="py-space-sm px-space-md">Programme Package</th>
                  <th className="py-space-sm px-space-md">Redemption Status</th>
                  <th className="py-space-sm px-space-md">Agro-Dealer Depot</th>
                  <th className="py-space-sm px-space-md rounded-r-lg text-right">Audit Stamp</th>
                </tr>
              </thead>
              <tbody className="divide-none">
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Adeyemi Sikiru</span>
                      <span className="font-label-sm text-label-sm text-outline font-mono">NIN: 4819-****-2018</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-medium">Oke-Ogun Soya Alliance</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">Saki West LGA</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-xs text-primary font-medium">
                      <Icon name="crop_free" className="text-[16px] text-secondary" />
                      <span>2.4 Ha Polygon</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold">NAGS-AP 50% Wet Season</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">4x NPK + 2x Urea + 25kg Maize</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Redeemed (₦112,400)</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="text-on-surface">Saki Central Agro-Depot</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">SHA256: 8f9b..c2</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Today, 09:14 AM</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Folake Alabi</span>
                      <span className="font-label-sm text-label-sm text-outline font-mono">NIN: 9021-****-7104</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-medium">Iseyin Women Cassava Hub</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">Iseyin LGA</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-xs text-primary font-medium">
                      <Icon name="crop_free" className="text-[16px] text-secondary" />
                      <span>1.8 Ha Polygon</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold">OYSADEP Clean Seed Multiplier</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">60 Bundles TME-419 + Inoculant</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Redeemed (100% Free)</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="text-on-surface">Iseyin Farmers Exchange</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">SHA256: 4a11..90</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Today, 08:42 AM</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Rasheed Gbadamosi</span>
                      <span className="font-label-sm text-label-sm text-outline font-mono">NIN: 6184-****-5529</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-medium">Iseyin Savanna Maize Co-op</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">Iseyin East</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-xs text-primary font-medium">
                      <Icon name="crop_free" className="text-[16px] text-secondary" />
                      <span>3.0 Ha Polygon</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold">NAGS-AP 50% Wet Season</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">6x NPK + 3x Urea + 30kg Maize</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Voucher Issued (USSD #*384*)</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="text-on-surface">Oyo Agro-Chemicals Ltd</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Pending OTP</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Yesterday</span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Bilikisu Jimoh</span>
                      <span className="font-label-sm text-label-sm text-outline font-mono">NIN: 3341-****-9811</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-medium">Oyo South Agroforestry Syndicate</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">Afijio LGA</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-xs text-primary font-medium">
                      <Icon name="crop_free" className="text-[16px] text-secondary" />
                      <span>4.1 Ha Sentinel Validated</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-semibold">Climate Resilience Carbon Rebate</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">₦45,000 / Ha Biochar Soil Prep</span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="bg-surface-variant text-on-surface-variant font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary-container" /> Ready for Payout (₦184,500)</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="text-on-surface">Direct NIBSS Co-op Wallet</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">SHA256: ee02..87</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">24 Mar 2026</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <Icon name="pie_chart" className="text-[20px] text-primary" />
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Fund Deployment Matrix</h3>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">₦412.50M Deployed</span>
              </div>
              <div className="flex items-center justify-center my-space-md relative">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                  <path className="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="45, 100" strokeLinecap="round" strokeWidth="3.8" />
                  <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="22, 100" strokeDashoffset="-45" strokeLinecap="round" strokeWidth="3.8" />
                  <path className="text-tertiary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="18, 100" strokeDashoffset="-67" strokeLinecap="round" strokeWidth="3.8" />
                  <path className="text-secondary-fixed-dim" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="15, 100" strokeDashoffset="-85" strokeLinecap="round" strokeWidth="3.8" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦412.5M</span>
                  <span className="font-label-sm text-label-sm text-outline">Total Active</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-xs mt-space-sm font-body-sm text-body-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-primary-container" />
                  <span className="text-on-surface">Fertilizer (45%)</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-on-surface">Seeds (22%)</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-tertiary-container" />
                  <span className="text-on-surface">Tractors (18%)</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-secondary-fixed-dim" />
                  <span className="text-on-surface">Irrigation (15%)</span>
                </div>
              </div>
            </div>
            <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Allocated to 34 Co-operatives</span>
              <span className="font-label-sm text-label-sm text-primary font-bold">Zero Reallocation Friction</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <Icon name="storefront" className="text-[20px] text-secondary" />
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Agro-Dealer Fulfillment</h3>
                </div>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold">12 Accredited</span>
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Saki Central Depot (Premier Feeds &amp; Agro)</span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">98% Redeemed</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: "98%" }} />
                  </div>
                  <div className="flex justify-between text-body-sm font-body-sm text-on-surface-variant mt-1">
                    <span>940/960 Vouchers processed</span>
                    <span>Stock: 82 Bags NPK remaining</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Iseyin Farmers Agro-Hub Exchange</span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">94% Redeemed</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-primary-container h-2 rounded-full" style={{ width: "94%" }} />
                  </div>
                  <div className="flex justify-between text-body-sm font-body-sm text-on-surface-variant mt-1">
                    <span>612/650 Vouchers processed</span>
                    <span>Stock: 140 Bags Urea remaining</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Oyo High-Yield Chemicals Limited</span>
                    <span className="font-label-sm text-label-sm text-tertiary-container font-bold">91% Redeemed</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: "91%" }} />
                  </div>
                  <div className="flex justify-between text-body-sm font-body-sm text-on-surface-variant mt-1">
                    <span>428/470 Vouchers processed</span>
                    <span>Stock: 310kg Certified Maize</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Live POS Biometric Sync Active</span>
              <button className="text-primary font-label-md text-label-md font-semibold hover:underline flex items-center gap-0.5" type="button">Audit All 12 Depots <Icon name="chevron_right" className="text-[16px]" /></button>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <Icon name="trending_up" className="text-[20px] text-primary" />
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Macro Yield &amp; Impact Delta</h3>
                </div>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold">+38.5% Yield</span>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-xl mb-space-md">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Modelled Productivity</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">4.2 MT/Ha <span className="font-body-sm text-body-sm text-outline font-normal">vs 3.0 MT control</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Projected Harvest Wealth</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-secondary">₦1,180,000,000</span>
                </div>
                <span className="font-label-sm text-label-sm text-outline block mt-1">Incremental output across 4,820 beneficiary hectares in Oyo basin</span>
              </div>
              <div className="flex flex-col gap-space-xs font-body-sm text-body-sm">
                <div className="flex items-center justify-between py-1 bg-surface-container-low px-space-sm rounded">
                  <span className="text-on-surface-variant">Off-take Pre-Contract Coverage:</span>
                  <span className="font-semibold text-on-surface">84.2% Committed to Olam &amp; Flour Mills</span>
                </div>
                <div className="flex items-center justify-between py-1 bg-surface-container-low px-space-sm rounded">
                  <span className="text-on-surface-variant">Repayment / Cost-Share Health:</span>
                  <span className="font-semibold text-secondary">100% Zero-Default Co-op Escrow</span>
                </div>
              </div>
            </div>
            <div className="pt-space-md mt-space-md flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant">SAPZ Monitoring Matrix #2026-B</span>
              <button className="px-space-md py-1.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg font-semibold hover:bg-primary transition-colors flex items-center gap-space-xs" type="button"><Icon name="bar_chart" className="text-[16px] text-secondary-fixed" /> Full Impact Dossier</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
