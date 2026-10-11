// Ported from the "investor_agricultural_investment_hub_9.5" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function InvestorHub({ lang }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="w-full bg-surface-container-low px-space-lg py-space-sm rounded-lg mb-space-md shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-sm text-label-sm font-label-sm text-on-surface-variant">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-container text-on-primary-container font-semibold"><Icon name="verified_user" filled className="text-[15px]" /> SEC Nigeria / PenCom Regulated Agritech Framework</span>
              <span className="text-outline">/</span>
              <span className="font-medium text-on-surface">Closed Qualified Institutional Investor (QII) Window</span>
              <span className="text-outline">/</span>
              <span>CAMA 2020 Asset-Backed Syndications</span>
              <span className="text-outline">/</span>
              <span className="inline-flex items-center gap-1 text-secondary font-medium"><Icon name="lock" className="text-[14px]" /> Audit Stamp: #SEC-AGR-2026-Q2</span>
            </div>
            <div className="flex items-center gap-space-md ml-auto">
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1 rounded shadow-sm">
                <Icon name="account_balance" className="text-[16px] text-tertiary" />
                <div className="flex flex-col text-right">
                  <span className="font-label-md text-label-md text-primary font-bold leading-none">Agri-Impact Capital West Africa</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Dual-Denom (USD/NGN) · Olumide Adeleke</span>
                </div>
                <Icon name="expand_more" className="text-[18px] text-outline" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-space-md mb-space-xl">
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Total AUM</span>
              <Icon name="account_balance_wallet" className="text-secondary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary">₦2.45B</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">$1.68M USD equiv.</div>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low px-2 py-1 rounded flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary font-bold">+28.4% YoY</span>
              <span className="font-label-sm text-label-sm text-outline">Deployed</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Syndicated Portfolios</span>
              <Icon name="domain" className="text-primary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary">14 Hubs</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Commercial &amp; Outgrowers</div>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low px-2 py-1 rounded">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Oyo, Ogun, Ondo Clusters</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Weighted Net IRR</span>
              <Icon name="trending_up" className="text-secondary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-secondary">24.8% <span className="text-body-sm font-label-md">p.a.</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Bench: 18.2% (Net Fees)</div>
            </div>
            <div className="mt-space-sm pt-space-xs bg-secondary-fixed text-on-secondary-fixed px-2 py-1 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="font-label-sm text-label-sm font-semibold">+660 bps Alpha</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Capital Deployed MTD</span>
              <Icon name="payments" className="text-primary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary">₦680.0M</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Early Rains 2026 Tranches</div>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low px-2 py-1 rounded">
              <span className="font-label-sm text-label-sm text-primary font-medium">Mechanization &amp; Inputs</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Repayment Sweep</span>
              <Icon name="task_alt" className="text-secondary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary">₦1.12B</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Collected (Trailing 12M)</div>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low px-2 py-1 rounded flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary font-bold">0% Default</span>
              <span className="font-label-sm text-label-sm text-outline">Tripartite Escrow</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">ESG &amp; Impact (SDG 2,8)</span>
              <Icon name="nature_people" className="text-secondary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary">12,450</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Smallholders Supported</div>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low px-2 py-1 rounded flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-primary font-medium">42% Women Agronomists</span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">Zero-Deforest</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <Icon name="travel_explore" className="text-primary text-[22px]" />
                  <h2 className="font-headline-md text-headline-md text-primary">Syndicated Deal Discovery</h2>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">8 Open Tranches</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-space-sm py-1 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors" type="button"><Icon name="tune" className="text-[16px]" /> Filter Tenor</button>
                  <button className="px-space-sm py-1 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors" type="button"><Icon name="sort" className="text-[16px]" /> IRR Descending</button>
                </div>
              </div>
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1 text-label-sm font-label-sm no-scrollbar">
                <button className="px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary font-semibold whitespace-nowrap shadow-sm" type="button">All Opportunities (8)</button>
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium whitespace-nowrap transition-colors" type="button">Grain &amp; Silo Infra (3)</button>
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium whitespace-nowrap transition-colors" type="button">Cassava Industrial (2)</button>
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium whitespace-nowrap transition-colors" type="button">Export Cashew &amp; Oil Palm (2)</button>
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium whitespace-nowrap transition-colors" type="button">Aquaculture Intensive (1)</button>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-lg flex flex-col gap-space-md">
                <div className="flex flex-wrap items-start justify-between gap-space-sm">
                  <div className="flex flex-col max-w-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">#OPP-2026-01</span>
                      <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 70% Subscribed</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">18-Month Tenor</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Oke-Ogun High-Yield Maize &amp; Grain Aggregation Hub</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">350 Ha Commercial Core + 450 Ha Outgrower Syndicate · Iseyin &amp; Saki Valley, Oyo State</p>
                  </div>
                  <div className="text-right">
                    <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Projected Net IRR</div>
                    <div className="font-metric-num text-metric-num text-secondary">26.5% <span className="font-label-sm text-label-sm text-on-surface">p.a.</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm bg-surface-container-low p-space-md rounded-lg">
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Capital Seeking</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">₦350.0M</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block mt-0.5">Debt/Equity Hybrid</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Forward Off-take Covenant</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">₦480.0M</span>
                    <span className="font-label-sm text-label-sm text-secondary block mt-0.5">Grand Cereals Ltd.</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Historical Yield</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">4.4 MT/Ha</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block mt-0.5">3-Season Track Record</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Credit De-Risking</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold">75% NIRSAL</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block mt-0.5">Credit Risk Guarantee</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 bg-surface-container-lowest p-space-sm rounded">
                  <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface">
                    <Icon name="verified" className="text-secondary text-[18px]" />
                    <span className="font-semibold">Security &amp; Collateral Backing:</span>
                    <span className="text-on-surface-variant">First-loss 75% NIRSAL CRG coverage · 850 MT grain silo real estate debenture · Cadastral parcel verified via PostGIS polygons</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">Syndication Status: <strong className="text-primary font-semibold">₦245,000,000 committed</strong> of ₦350,000,000</span>
                    <span className="text-tertiary-container font-semibold">12 Days Remaining in Allocation Window</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "70%" }} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <button className="px-space-md py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-lg text-label-lg font-semibold flex items-center gap-1.5 transition-colors" type="button"><Icon name="description" className="text-[18px]" /> Review Due Diligence Dossier (.pdf)</button>
                    <button className="px-space-sm py-2 rounded-lg text-on-surface-variant hover:text-primary font-label-sm text-label-sm flex items-center gap-1" type="button"><Icon name="share_location" className="text-[18px]" /> View Cadastral Map</button>
                  </div>
                  <button className="px-space-lg py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg font-bold flex items-center gap-2 shadow-sm transition-colors" type="button"><Icon name="add_circle" className="text-[20px]" /> Commit Capital Allocation (₦)</button>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-wrap items-start justify-between gap-space-sm">
                <div className="flex flex-col max-w-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">#OPP-2026-02</span>
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 85% Subscribed</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">12-Month Tenor</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Psaltry Cassava Starch Outgrower Expansion</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Iseyin–Ado Awaye Industrial Agricultural Corridor, 600 Ha Aggregation Syndicate</p>
                </div>
                <div className="text-right">
                  <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Projected Net IRR</div>
                  <div className="font-metric-num text-metric-num text-secondary">23.2% <span className="font-label-sm text-label-sm text-on-surface">p.a.</span></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm bg-surface-container-low p-space-md rounded-lg">
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Capital Seeking</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦280.0M</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Buyer Contract</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦325.0M Tripartite</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Security</span>
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">CAMA Escrow Lien</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Closing Window</span>
                  <span className="font-headline-sm text-headline-sm text-tertiary font-bold">5 Days Left</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: "85%" }} />
                </div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>₦238.0M Allocated by 4 QII LPs</span>
                  <span>₦42.0M Remaining Slot</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Off-taker: Psaltry International Processing Factory (Sorbet &amp; Pharmaceutical Grade)</span>
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-label-md font-bold transition-colors" type="button">Evaluate Participation</button>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-wrap items-start justify-between gap-space-sm">
                <div className="flex flex-col max-w-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">#OPP-2026-03</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">45% Subscribed</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">9-Month Crop Cycle</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Egba Lowland Mechanized Rice Syndicate</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Ogun River Basin Alluvial Lowlands, 400 Ha Direct Irrigation Scheme</p>
                </div>
                <div className="text-right">
                  <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Projected Net IRR</div>
                  <div className="font-metric-num text-metric-num text-secondary">25.0% <span className="font-label-sm text-label-sm text-on-surface">p.a.</span></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm bg-surface-container-low p-space-md rounded-lg">
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Capital Seeking</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦190.0M</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Milling Covenant</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">Olam Agri Forward</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Mechanization</span>
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">100% Laser-Leveled</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Closing Window</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">19 Days Left</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Secured by PostGIS farm registry and automated weighbridge escrow</span>
                <button className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-label-md font-bold transition-colors" type="button">Evaluate Participation</button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold">LIVE ASSET MONITOR</span>
                    <span className="font-label-sm text-label-sm text-outline">#INV-PF-088</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mt-1">Oke-Ogun Savanna Maize Syndicate</h3>
                </div>
                <Icon name="satellite_alt" className="text-secondary text-[26px]" />
              </div>
              <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-2">
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface font-bold uppercase tracking-wide">Capital Structure &amp; Priority Waterfall</span>
                  <span className="text-outline">₦250.0M Total Tranche</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-surface-container-highest">
                  <div className="bg-primary h-full" style={{ width: "55%" }} title="Senior Debt: 55%" />
                  <div className="bg-secondary h-full" style={{ width: "30%" }} title="Mezzanine / Rev Share: 30%" />
                  <div className="bg-tertiary-fixed-dim h-full" style={{ width: "15%" }} title="Sponsor Equity: 15%" />
                </div>
                <div className="grid grid-cols-3 text-label-sm font-label-sm mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-on-surface-variant">Senior Debt (55%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-on-surface-variant">Mezzanine (30%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
                    <span className="text-on-surface-variant">Sponsor (15%)</span>
                  </div>
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-surface-container-high">
                <div className="bg-cover bg-center w-full h-48 relative flex flex-col justify-between p-space-md" data-alt="High-resolution multispectral Sentinel-2 satellite imagery of agricultural maize farmland in Oke-Ogun savanna Nigeria with clean vector cadastral polygon boundaries in vibrant green, showing lush vegetation patterns, center pivots, and precise geospatial geofencing under clear sunny skies." style={{ backgroundImage: "url('/images/screens/c69d185c76f9.webp')" }}>
                  <div className="flex items-center justify-between w-full">
                    <span className="px-2.5 py-1 rounded bg-inverse-surface/90 text-inverse-on-surface font-label-sm text-label-sm flex items-center gap-1.5 backdrop-blur-sm"><span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" /> Sentinel-2 Polling: 4h Ago</span>
                    <span className="px-2.5 py-1 rounded bg-inverse-surface/90 text-inverse-on-surface font-label-sm text-label-sm font-mono">8°18&apos;42.1&quot;N 3°35&apos;11.8&quot;E</span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="bg-surface-container-lowest/95 px-3 py-1.5 rounded shadow-md flex items-center gap-3 backdrop-blur-sm">
                      <div>
                        <div className="font-label-sm text-label-sm text-outline">Mean NDVI</div>
                        <div className="font-headline-sm text-headline-sm text-secondary font-bold">0.79 <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">(Optimal Vigor)</span></div>
                      </div>
                      <div className="w-px h-6 bg-outline-variant" />
                      <div>
                        <div className="font-label-sm text-label-sm text-outline">Soil Moisture</div>
                        <div className="font-headline-sm text-headline-sm text-primary font-bold">28.4% <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">(Field Cap)</span></div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold shadow-md hover:bg-primary-container transition-colors" type="button">Inspect Parcel Map</button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Disbursement &amp; Inflow Waterfall</span>
                <div className="flex flex-col gap-2 bg-surface-container-low p-space-md rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="check_circle" className="text-secondary text-[20px]" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">Tranche 1: Land Prep &amp; Mechanization</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Disbursed April 2026 · GPS Tractors Logged</span>
                      </div>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">₦120.0M</span>
                  </div>
                  <div className="w-full h-px bg-outline-variant/30" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="check_circle" className="text-secondary text-[20px]" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">Tranche 2: Seed &amp; Fertilizer Distribution</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Disbursed May 2026 · Agro-dealer Vouchers</span>
                      </div>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">₦130.0M</span>
                  </div>
                  <div className="w-full h-px bg-outline-variant/30" />
                  <div className="flex items-center justify-between bg-surface-container-lowest p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Icon name="schedule" className="text-tertiary text-[20px]" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-primary font-bold">Harvest Delivery &amp; Off-take Sweep</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Projected Aug 2026 · Flour Mills / Grand Cereals</span>
                      </div>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold">₦385.0M</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Live Covenant Adherence (§14 Matrix)</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-surface-container-low p-2 rounded flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline">Off-take Escrow</span>
                    <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Active Locked</span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">Zenith Bank Escrow</span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline">Parametric Cover</span>
                    <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Leadway Insured</span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">Drought &amp; Flood Yield</span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline">Side-Selling Drift</span>
                    <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 0 Deviations</span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">350 Ha Polygon Lock</span>
                  </div>
                </div>
              </div>
              <div className="pt-space-xs">
                <button className="w-full py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 transition-colors" type="button"><Icon name="download" className="text-[20px]" /> Download Investor Audit &amp; Financial Pack (.xlsx / .pdf)</button>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="swap_horizontal_circle" className="text-secondary text-[20px]" />
                  <span className="font-headline-sm text-headline-sm text-primary">Secondary Syndicate Board</span>
                </div>
                <span className="font-label-sm text-label-sm px-2 py-0.5 bg-surface-container-low text-on-surface rounded font-medium">Monthly QII Window</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Qualified Institutional Investors may transfer syndicated note positions with verified SEC accreditation and legal registration via CultivaNode Escrow Protocol.</p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-label-sm text-label-sm text-outline">Next Settlement Clearing: <strong className="text-on-surface font-semibold">June 30, 2026</strong></span>
                <Link className="font-label-sm text-label-sm text-primary font-bold hover:underline flex items-center gap-1" href={`/${lang}/marketplace`}>Open Trading Desk <Icon name="arrow_forward" className="text-[14px]" /></Link>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md mb-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Icon name="waterfall_chart" className="text-primary text-[22px]" />
                <h3 className="font-headline-md text-headline-md text-primary">Consolidated Portfolio Cash Flow &amp; Investor Distribution Waterfall</h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Projected vs Actual Capital Calls, Aggregated Produce Inflows, and Automated NIBSS Investor Dividend Settlements</p>
            </div>
            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Capital Deployed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Harvest Returns</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Net Investor Payout</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
            <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Q1 2026</span>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm font-semibold">Completed</span>
              </div>
              <div className="flex flex-col gap-1.5 my-space-xs text-body-sm font-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Capital Calls:</span>
                  <span className="font-semibold text-primary">₦540.0M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Dry Season Inflow:</span>
                  <span className="font-semibold text-secondary">₦220.0M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Dividend Distributed:</span>
                  <span className="font-semibold text-tertiary">₦65.4M</span>
                </div>
              </div>
              <div className="mt-space-sm pt-space-xs text-label-sm font-label-sm text-outline flex items-center justify-between">
                <span>Actual Net Yield:</span>
                <span className="text-secondary font-bold">24.2% p.a.</span>
              </div>
            </div>
            <div className="bg-surface-container-high p-space-md rounded-lg flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">Q2 2026 (Current)</span>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> Active</span>
              </div>
              <div className="flex flex-col gap-1.5 my-space-xs text-body-sm font-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Capital Calls:</span>
                  <span className="font-semibold text-primary">₦680.0M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Early Maize / Starch:</span>
                  <span className="font-semibold text-secondary">₦310.0M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Projected Payout:</span>
                  <span className="font-semibold text-tertiary">₦92.8M</span>
                </div>
              </div>
              <div className="mt-space-sm pt-space-xs text-label-sm font-label-sm text-outline flex items-center justify-between">
                <span>Target Settlement:</span>
                <span className="text-primary font-bold">June 30, 2026</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Q3 2026</span>
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">Projected</span>
              </div>
              <div className="flex flex-col gap-1.5 my-space-xs text-body-sm font-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Capital Calls:</span>
                  <span className="font-semibold text-primary">₦320.0M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Main Harvest Sweep:</span>
                  <span className="font-semibold text-secondary">₦890.0M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Projected Payout:</span>
                  <span className="font-semibold text-tertiary">₦410.5M</span>
                </div>
              </div>
              <div className="mt-space-sm pt-space-xs text-label-sm font-label-sm text-outline flex items-center justify-between">
                <span>Off-take Window:</span>
                <span className="text-on-surface font-medium">Grand Cereals &amp; Mills</span>
              </div>
            </div>
            <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Q4 2026</span>
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">Projected</span>
              </div>
              <div className="flex flex-col gap-1.5 my-space-xs text-body-sm font-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Capital Calls:</span>
                  <span className="font-semibold text-primary">₦210.0M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Late Harvest &amp; Cashew:</span>
                  <span className="font-semibold text-secondary">₦620.0M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Final Principal Return:</span>
                  <span className="font-semibold text-tertiary">₦518.2M</span>
                </div>
              </div>
              <div className="mt-space-sm pt-space-xs text-label-sm font-label-sm text-outline flex items-center justify-between">
                <span>End of Cycle Sweep:</span>
                <span className="text-on-surface font-medium">Annual Audit Pack</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-sm text-label-sm font-label-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Icon name="account_balance" className="text-secondary text-[18px]" />
              <span>Automated NIBSS Direct Deposit to Investor Custody Accounts via CAMA 2020 Statutory Escrow</span>
            </div>
            <div className="flex items-center gap-space-md">
              <span className="text-outline">Audited by KPMG Nigeria · Tax Clearance Reference #CIT-2026-FIRS-882</span>
              <button className="px-3 py-1 rounded bg-surface-container-low hover:bg-surface-container text-primary font-bold" type="button">View Full Ledger (§9.5)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
