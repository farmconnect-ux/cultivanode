"use client";

// Ported from the "regional_food_security_market_intelligence_10.6" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";

export function MarketIntelligence(_props: ScreenProps) {
  const handleExportBulletin = () => {
    const text = `SOUTH-WEST REGIONAL COMMODITY PRICE WATCHDOG & LOGISTICS TERMINAL
STATUTORY BULLETIN [§10.6]
Date: ${new Date().toLocaleDateString("en-GB")}
Terminal Nodes Polled: Bodija (Ibadan), Mile 12 (Lagos), Shasha (Akure), Oja Oba (Osogbo), Sagamu Interchange, Dawanau Rail Link
Verified Weighbridges: 46 / 46 Linked
Farmgate-to-Megacity Arbitrage:
- White Maize: Farmgate ₦590/kg | Urban Wholesale ₦770/kg | Mile 12 ₦840/kg | Net Arbitrage: +31.4%
- Yellow Cassava Roots: Farmgate ₦94,500/MT | Factory Gate ₦142,000/MT | Net Margin: +28.7%
- Soya Beans: Farmgate ₦860/kg | Urban Wholesale ₦1,020/kg | Net Margin: +15.2%
- Oil Palm (SPO): Farmgate ₦1,150/L | Urban Wholesale ₦1,480/L | Net Margin: +22.8%
Freight Diesel Benchmark: ₦1,240/Litre
Integrity Protocol: Cryptographic SHA256 Weighbridge Timestamp Verified.`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SW-Market-Intelligence-Bulletin.txt";
    a.click();
    URL.revokeObjectURL(url);
    showScreenToast("Commodity market intelligence bulletin exported successfully.");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="w-full px-space-lg py-space-md bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-sm">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs text-secondary mb-1">
                <Icon name="query_stats" className="text-[18px]" />
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">Agricultural Market Intelligence Dashboard [§10.6]</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight truncate">South-West Regional Commodity Price Watchdog &amp; Logistics Terminal</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Supply-Demand Aggregation, Farmgate-to-Megacity Price Arbitrage &amp; Trunk Haulage Index across Oyo, Ogun, Osun, Ondo, Ekiti &amp; Lagos corridors.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs shrink-0">
              <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-lg bg-surface-container font-label-sm text-label-sm text-on-surface">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span>Live Ingestion: <strong>24 Markets Polled</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-lg bg-secondary-fixed/40 font-label-sm text-label-sm text-on-secondary-fixed-variant">
                <Icon name="verified" className="text-[14px]" />
                <span>Weighbridge &amp; Ground Survey Verified</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm shadow-sm">
                <Icon name="trending_up" className="text-[14px]" />
                <span>SWAPI: +1.4% WoW</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
            <div className="flex items-center gap-space-xs overflow-x-auto text-on-surface-variant font-label-sm text-label-sm">
              <span className="text-on-surface-variant font-medium">Terminal Nodes:</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface">Bodija (Ibadan)</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface">Mile 12 (Lagos)</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface">Shasha (Akure)</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface">Oja Oba (Osogbo)</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface">Sagamu Interchange</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface">Dawanau Rail Link</span>
            </div>
            <div className="flex items-center gap-space-xs">
              {_props.slots?.actions ?? (
                <>
                  <button onClick={handleExportBulletin} className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1.5 shadow-sm hover:bg-surface-container-high transition-colors" type="button"><Icon name="picture_as_pdf" className="text-[16px]" /> Export Bulletin (.PDF)</button>
                  <button onClick={() => showScreenToast("Sourcing RFQ composer opened. Dispatched request to 18 accredited grain depots in Oyo & Ogun.")} className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center gap-1.5 shadow-sm hover:bg-primary transition-colors" type="button"><Icon name="add_shopping_cart" className="text-[16px]" /> Post Sourcing RFQ</button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="px-space-lg py-space-lg space-y-space-lg max-w-[1720px] mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md">
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Polled Markets</span>
                <Icon name="storefront" className="text-secondary text-[20px]" />
              </div>
              <div className="my-space-xs">
                <div className="font-metric-num text-metric-num text-on-surface">24 Nodes</div>
                <div className="font-label-sm text-label-sm text-on-secondary-container mt-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 100% Ingestion Up</div>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant truncate">6 States (Oyo, Ogun, Lagos...)</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Aggregated Supply</span>
                <Icon name="inventory_2" className="text-secondary text-[20px]" />
              </div>
              <div className="my-space-xs">
                <div className="font-metric-num text-metric-num text-on-surface">84,200 MT</div>
                <div className="font-label-sm text-label-sm text-on-secondary-container mt-0.5 flex items-center gap-1"><Icon name="arrow_upward" className="text-[14px]" /> +8.2% vs last cycle</div>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant truncate">Across 8 staple commodities</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Unmet Buyer Deficit</span>
                <Icon name="warning" className="text-on-tertiary-container text-[20px]" />
              </div>
              <div className="my-space-xs">
                <div className="font-metric-num text-metric-num text-on-surface">42,500 MT</div>
                <div className="font-label-sm text-label-sm text-on-tertiary-fixed-variant mt-0.5 flex items-center gap-1"><Icon name="priority_high" className="text-[14px]" /> Industrial Starch &amp; Feed Deficit</div>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant truncate">Mills &amp; Grain Reserves</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Farmgate vs Urban</span>
                <Icon name="compare_arrows" className="text-secondary text-[20px]" />
              </div>
              <div className="my-space-xs">
                <div className="font-metric-num text-metric-num text-on-surface">26.4%</div>
                <div className="font-label-sm text-label-sm text-on-secondary-container mt-0.5 flex items-center gap-1">
                  <span>₦32,400/MT Avg Margin</span>
                </div>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant truncate">Rural Depot to Megacity</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Trunk Freight Index</span>
                <Icon name="local_shipping" className="text-secondary text-[20px]" />
              </div>
              <div className="my-space-xs">
                <div className="font-metric-num text-metric-num text-on-surface">₦48.50</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <span>Per Ton-Km corridor rate</span>
                </div>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant truncate">Diesel @ ₦1,240/Litre</div>
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">30-Day Volatility</span>
                <Icon name="show_chart" className="text-secondary text-[20px]" />
              </div>
              <div className="my-space-xs">
                <div className="font-metric-num text-metric-num text-on-surface">12.2%</div>
                <div className="font-label-sm text-label-sm text-on-secondary-container mt-0.5 flex items-center gap-1"><Icon name="check_circle" className="text-[14px]" /> Moderate / Stabilizing</div>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant truncate">Maize &amp; Soya Post-Dry Break</div>
            </div>
          </div>
          <div className="rounded-lg bg-surface-container-lowest shadow-sm flex flex-col overflow-hidden">
            <div className="p-space-md bg-surface-container-lowest flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-md text-headline-md text-on-surface">Regional Commodity Price &amp; Arbitrage Matrix</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm">Live Automated Feeds</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Benchmarked against primary farmgate weighbridges, regional secondary aggregation centers, and terminal megacity wholesale gates.</p>
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="flex items-center bg-surface-container-low px-space-sm py-1 rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface-variant mr-2">Filter Staple:</span>
                  <select className="bg-transparent font-label-sm text-label-sm text-on-surface outline-none cursor-pointer">
                    <option>All 8 Monitored Staples</option>
                    <option>Cereals &amp; Grains</option>
                    <option>Roots &amp; Tubers</option>
                    <option>Oilseeds &amp; Pulses</option>
                  </select>
                </div>
                <button onClick={() => showScreenToast("Telemetry refreshed: 24 terminal markets and 46 weighbridges synchronized via AFEX & FEWS NET API.")} className="px-3 py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button"><Icon name="sync" className="text-[16px]" /> Refresh Telemetry</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-space-sm px-space-md">Commodity &amp; Spec</th>
                    <th className="py-space-sm px-space-sm">Farmgate (Depot)</th>
                    <th className="py-space-sm px-space-sm">Secondary Aggregator</th>
                    <th className="py-space-sm px-space-sm">Urban Wholesale (Bodija)</th>
                    <th className="py-space-sm px-space-sm">Terminal Hub (Mile 12 Lagos)</th>
                    <th className="py-space-sm px-space-sm">7-Day Trend</th>
                    <th className="py-space-sm px-space-sm">WoW Δ</th>
                    <th className="py-space-sm px-space-md text-right">Arbitrage Window</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm divide-y-0 text-on-surface">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                          <Icon name="grain" className="text-[18px]" />
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg font-semibold text-on-surface">White Maize (Clean Dry)</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Moisture ≤12.5% | 100kg Bag</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦64,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Saki West Hub</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦69,500</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Iseyin Aggregation</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦77,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Bodija Wholesale</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦83,200</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ketu / Mile 12</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <svg className="w-24 h-6 text-secondary" fill="none" viewBox="0 0 100 24">
                        <path d="M0,18 Q20,16 40,10 T80,8 L100,3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </td>
                    <td className="py-3 px-space-sm">
                      <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-container"><Icon name="arrow_drop_up" className="text-[14px]" /> +3.2%</span>
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">+₦132/kg Net Arbitrage</span>
                    </td>
                  </tr>
                  <tr className="bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                          <Icon name="agriculture" className="text-[18px]" />
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg font-semibold text-on-surface">Yellow Feed Maize</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Feed Grade A | 100kg Bag</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦66,500</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Kisi Weighbridge</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦71,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Eruwa Depot</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦79,500</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Bodija Wholesale</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦85,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Sagamu / Mile 12</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <svg className="w-24 h-6 text-secondary" fill="none" viewBox="0 0 100 24">
                        <path d="M0,15 Q25,18 50,12 T80,10 L100,5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </td>
                    <td className="py-3 px-space-sm">
                      <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-container"><Icon name="arrow_drop_up" className="text-[14px]" /> +2.1%</span>
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">+₦125/kg Net Arbitrage</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
                          <Icon name="nutrition" className="text-[18px]" />
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg font-semibold text-on-surface">Cassava Roots (Fresh)</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">≥22% Starch Yield | Per Metric Ton</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦92,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ibarapa Farm Gate</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦108,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Oyo Central Depot</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦124,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Monotan Processing Hub</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦138,500</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ikorodu Flour Cluster</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <svg className="w-24 h-6 text-on-surface-variant" fill="none" viewBox="0 0 100 24">
                        <path d="M0,10 Q30,12 55,10 T80,12 L100,11" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </td>
                    <td className="py-3 px-space-sm">
                      <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-on-surface-variant"><Icon name="horizontal_rule" className="text-[14px]" /> 0.0%</span>
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">+₦31,500/MT Net Spread</span>
                    </td>
                  </tr>
                  <tr className="bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                          <Icon name="spa" className="text-[18px]" />
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg font-semibold text-on-surface">Soya Bean (Non-GMO)</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Protein ≥38% | 100kg Bag</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦78,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Igboho Farmgate</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦84,500</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ogbomoso Yard</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦92,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Bodija Wholesale</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦99,400</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ogun Feedmills / Otta</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <svg className="w-24 h-6 text-secondary" fill="none" viewBox="0 0 100 24">
                        <path d="M0,20 Q30,15 60,10 T85,6 L100,2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </td>
                    <td className="py-3 px-space-sm">
                      <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-container"><Icon name="arrow_drop_up" className="text-[14px]" /> +4.5%</span>
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">+₦154/kg Net Arbitrage</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                          <Icon name="rice_bowl" className="text-[18px]" />
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg font-semibold text-on-surface">Faro-44 Milled Rice</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">5% Broken | 50kg Bag</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦44,500</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ofada / Ogun Basin</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦47,800</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Abeokuta Millers</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦51,500</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Dugbe / Bodija</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦55,200</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Mile 12 / Alaba</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <svg className="w-24 h-6 text-error" fill="none" viewBox="0 0 100 24">
                        <path d="M0,4 Q30,6 60,12 T85,18 L100,22" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </td>
                    <td className="py-3 px-space-sm">
                      <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-error"><Icon name="arrow_drop_down" className="text-[14px]" /> -1.2%</span>
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">+₦82/kg Steady Spread</span>
                    </td>
                  </tr>
                  <tr className="bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                          <Icon name="bakery_dining" className="text-[18px]" />
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg font-semibold text-on-surface">Garri White (Fine Grain)</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Moisture ≤9.8% | 80kg Bag</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦38,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ijebu Imusin Hub</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦41,200</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Sagamu Depot</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦46,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Bodija Wholesale</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦51,800</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Mile 12 / Oyingbo</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <svg className="w-24 h-6 text-secondary" fill="none" viewBox="0 0 100 24">
                        <path d="M0,16 Q30,12 60,10 T85,7 L100,3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </td>
                    <td className="py-3 px-space-sm">
                      <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-container"><Icon name="arrow_drop_up" className="text-[14px]" /> +2.8%</span>
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">+₦115/kg Net Arbitrage</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                          <Icon name="grass" className="text-[18px]" />
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg font-semibold text-on-surface">Yam Tubers (Abakaliki / Oyo)</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Batch of 100 Tubers (Medium)</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦110,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Kishi Rural Depot</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦128,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ogbomoso Yard</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦154,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Bodija Yam Sheds</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦185,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Mile 12 Shed 4</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <svg className="w-24 h-6 text-secondary" fill="none" viewBox="0 0 100 24">
                        <path d="M0,18 Q30,16 60,11 T85,6 L100,2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </td>
                    <td className="py-3 px-space-sm">
                      <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-container"><Icon name="arrow_drop_up" className="text-[14px]" /> +5.1%</span>
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">+₦520/Tuber Premium</span>
                    </td>
                  </tr>
                  <tr className="bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                          <Icon name="grain" className="text-[18px]" />
                        </div>
                        <div>
                          <div className="font-label-lg text-label-lg font-semibold text-on-surface">Sesame (White Cleaned)</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Export Grade | 50kg Bag</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦72,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Saki Transit Store</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦76,500</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ibadan Hub</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦81,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Bodija Wholesale</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">₦89,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Apapa Terminal Port</div>
                    </td>
                    <td className="py-3 px-space-sm">
                      <svg className="w-24 h-6 text-secondary" fill="none" viewBox="0 0 100 24">
                        <path d="M0,12 Q30,10 60,11 T85,8 L100,4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                      </svg>
                    </td>
                    <td className="py-3 px-space-sm">
                      <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-container"><Icon name="arrow_drop_up" className="text-[14px]" /> +1.8%</span>
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">+₦210/kg Export Spread</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            <div className="lg:col-span-7 rounded-lg bg-surface-container-lowest shadow-sm p-space-lg flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-md text-headline-md text-on-surface">Supply vs. Demand Regional Balance Radar</span>
                      <Icon name="donut_large" className="text-secondary text-[20px]" />
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Projected 60-day Harvest Inflow against Confirmed Buyer Forward Contracts (MT Deficit &amp; Surplus)</p>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant"><span className="w-2.5 h-2.5 rounded bg-primary" /> Harvest Inflow</span>
                    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant ml-2"><span className="w-2.5 h-2.5 rounded bg-secondary-fixed-dim" /> Buyer Contract Quotas</span>
                  </div>
                </div>
                <div className="mt-space-lg space-y-space-md">
                  <div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-on-surface">Cassava Roots (Oyo Savanna / Ibarapa)</span>
                        <span className="px-1.5 py-0.5 rounded bg-secondary-fixed/60 text-on-secondary-fixed-variant font-semibold text-[10px]">18% Net Surplus</span>
                      </div>
                      <div className="text-on-surface-variant"><span className="text-primary font-semibold">32,400 MT</span> / 27,450 MT Demanded</div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                      <div className="bg-primary h-full rounded-l-full" style={{ width: "60%" }} />
                      <div className="bg-secondary-fixed-dim h-full" style={{ width: "25%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-on-surface">Poultry Quality Soya (Ogun Industrial Belt)</span>
                        <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-semibold text-[10px]">24% Critical Deficit</span>
                      </div>
                      <div className="text-on-surface-variant"><span className="text-on-surface font-semibold">14,200 MT</span> / 18,700 MT Contracted</div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                      <div className="bg-primary h-full rounded-l-full" style={{ width: "48%" }} />
                      <div className="bg-error h-full" style={{ width: "24%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-on-surface">White Feed Maize (Saki / Kisi / Iseyin)</span>
                        <span className="px-1.5 py-0.5 rounded bg-secondary-fixed/60 text-on-secondary-fixed-variant font-semibold text-[10px]">8% Balanced Surplus</span>
                      </div>
                      <div className="text-on-surface-variant"><span className="text-primary font-semibold">22,000 MT</span> / 20,300 MT Demanded</div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                      <div className="bg-primary h-full rounded-l-full" style={{ width: "55%" }} />
                      <div className="bg-secondary-fixed-dim h-full" style={{ width: "35%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-on-surface">Milled Faro-44 Rice (Ekiti &amp; Ondo Basins)</span>
                        <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-semibold text-[10px]">11% Supply Gap</span>
                      </div>
                      <div className="text-on-surface-variant"><span className="text-on-surface font-semibold">8,600 MT</span> / 9,700 MT Demanded</div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                      <div className="bg-primary h-full rounded-l-full" style={{ width: "44%" }} />
                      <div className="bg-error h-full" style={{ width: "14%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-on-surface">Garri White (Ogun / Ondo Aggregation)</span>
                        <span className="px-1.5 py-0.5 rounded bg-secondary-fixed/60 text-on-secondary-fixed-variant font-semibold text-[10px]">14% Inflow Surplus</span>
                      </div>
                      <div className="text-on-surface-variant"><span className="text-primary font-semibold">7,000 MT</span> / 6,150 MT Demanded</div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                      <div className="bg-primary h-full rounded-l-full" style={{ width: "58%" }} />
                      <div className="bg-secondary-fixed-dim h-full" style={{ width: "28%" }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-space-lg p-space-md rounded-lg bg-surface-container flex items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-sm">
                  <Icon name="troubleshoot" className="text-secondary text-[24px]" />
                  <div>
                    <div className="font-label-md text-label-md font-semibold text-on-surface">Institutional Buffer Alert</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">Cassava surplus in Oyo Savanna triggers off-take dispatch for the State Strategic Food Reserve at ₦94,500/MT floor threshold.</div>
                  </div>
                </div>
                <button onClick={() => showScreenToast("Off-take dispatch triggered: 1,500 MT Yellow Cassava allocated to Oyo State Strategic Food Reserve at ₦94,500/MT floor price.")} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm shrink-0 shadow-sm hover:bg-primary-container transition-colors" type="button">Trigger Off-take</button>
              </div>
            </div>
            <div className="lg:col-span-5 rounded-lg bg-surface-container-lowest shadow-sm p-space-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-md text-headline-md text-on-surface">Trunk Logistics &amp; Freight Watchdog</span>
                      <Icon name="local_shipping" className="text-secondary text-[20px]" />
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Corridor transit times, checkpoint impedance &amp; live dry/reefer truck capacity.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm">Live Fleet Feed</span>
                </div>
                <div className="mt-space-md space-y-space-sm">
                  <div className="p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Saki → Bodija (Ibadan)</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">Smooth Passage</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-body-sm text-body-sm text-on-surface-variant mt-2">
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Distance</div>
                        <div className="font-semibold text-on-surface">168 km</div>
                      </div>
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Haulage Cost</div>
                        <div className="font-semibold text-on-surface">₦55 / Bag</div>
                      </div>
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Trucks Idle</div>
                        <div className="font-semibold text-secondary">38 Available</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-on-surface-variant flex items-center gap-1"><Icon name="check" className="text-[13px] text-secondary" /> Checkpoint latency ≤ 18 mins average.</div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Iseyin → Mile 12 (Lagos)</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">Moderate Congestion</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-body-sm text-body-sm text-on-surface-variant mt-2">
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Distance</div>
                        <div className="font-semibold text-on-surface">195 km</div>
                      </div>
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Haulage Cost</div>
                        <div className="font-semibold text-on-surface">₦78 / Bag</div>
                      </div>
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Trucks Idle</div>
                        <div className="font-semibold text-secondary">24 Available</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-on-surface-variant flex items-center gap-1"><Icon name="info" className="text-[13px] text-on-tertiary-container" /> Ibadan-Lagos Expressway Long-bridge hold-up (+45m).</div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Abeokuta → Mile 12 (Lagos)</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">Express Dispatch</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-body-sm text-body-sm text-on-surface-variant mt-2">
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Distance</div>
                        <div className="font-semibold text-on-surface">78 km</div>
                      </div>
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Haulage Cost</div>
                        <div className="font-semibold text-on-surface">₦42 / Bag</div>
                      </div>
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Trucks Idle</div>
                        <div className="font-semibold text-secondary">42 Available</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-on-surface-variant flex items-center gap-1"><Icon name="check" className="text-[13px] text-secondary" /> Weighbridge clearance immediate at Sagamu interchange.</div>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Freight Diesel Peg: ₦1,240/Litre</span>
                <button onClick={() => showScreenToast("Syndicate carrier booking opened: Dispatched haulage tender to 38 registered flatbed/reefer syndicates.")} className="text-primary font-semibold hover:underline flex items-center gap-0.5" type="button">Book Syndicate Carrier <Icon name="arrow_forward" className="text-[14px]" /></button>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-md text-headline-md text-on-surface">Automated Price Alerts &amp; Institutional Dispatch Engine</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm">3 Active Rules</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Algorithmic event-triggers communicating with state procurement desks, cooperative unions &amp; industrial mills.</p>
              </div>
              <div className="flex items-center gap-space-xs">
                <button onClick={() => showScreenToast("Survey calibration parameters updated: Bodija & Mile 12 weightings adjusted to 40% volume ratio.")} className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button"><Icon name="tune" className="text-[16px]" /> Calibrate Survey Weights</button>
                <button onClick={() => showScreenToast("Alert Rule created: Instant notification enabled for price deviations > 8% across SW corridors.")} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-1 shadow-sm" type="button"><Icon name="add_alert" className="text-[16px]" /> Create Alert Rule</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Price Drop Threshold</span>
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                  </div>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface mt-2">Bodija White Maize Drop Below ₦700/kg</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Sends immediate automated buy trigger to Ogun State Poultry Guild and National Grain Reserve silos.</p>
                </div>
                <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Status: <strong>Monitoring</strong></span>
                  <span>Target: <strong>₦700/kg</strong> (Current: ₦770/kg)</span>
                </div>
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-tertiary-fixed-variant font-semibold">Volume Ready Notification</span>
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                  </div>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface mt-2">4,000 MT Cassava Harvest Inflow in Ibarapa</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Alerts Premium Starch Mills &amp; Ethanol Processors in Sango-Otta corridor for direct farmgate off-take booking.</p>
                </div>
                <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Status: <strong>Ready to Fire</strong></span>
                  <span>Aggregated: <strong>3,820 MT</strong> / 4,000 MT</span>
                </div>
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Freight Arbitrage Corridor</span>
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                  </div>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface mt-2">Saki-Lagos Arbitrage Spread &gt; ₦130/kg</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Mobilizes return-trip refrigerated and dry container fleet stationed at Sagamu interchange to backhaul grain.</p>
                </div>
                <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Status: <strong>Triggered (Active)</strong></span>
                  <span>Current: <strong>+₦132/kg</strong> spread</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center rounded-lg bg-surface-container-low p-space-lg shadow-sm">
            <div className="lg:col-span-8 space-y-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Corridor Integrity Report</span>
              <h2 className="font-headline-md text-headline-md text-on-surface">South-West Grain &amp; Tuber Arteries: Seamless Weighbridge Integration</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">CultivaNode ingests continuous sensory and transaction receipts from 46 state-accredited weighbridges across the Saki-Kisi agricultural basin, Eruwa grain corridors, and terminal urban marketplaces including Bodija (Ibadan) and Mile 12 (Lagos). Field price enumerators execute daily stratified sample surveys calibrated against physical off-take contracts to preserve data veracity.</p>
              <div className="flex flex-wrap items-center gap-space-md pt-2 text-on-surface-variant font-label-sm text-label-sm">
                <div className="flex items-center gap-1.5"><Icon name="cloud_done" className="text-[16px] text-secondary" /> Last Batch Sync: 4 mins ago</div>
                <div className="flex items-center gap-1.5"><Icon name="security" className="text-[16px] text-secondary" /> Cryptographic Signatures: 100% Validated</div>
                <div className="flex items-center gap-1.5"><Icon name="supervised_user_circle" className="text-[16px] text-secondary" /> Enumerators Deployed: 112 Agents</div>
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <div className="w-full bg-surface-container-lowest p-space-md rounded-lg shadow-sm space-y-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">Data Telemetry Health</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">99.8% SLA</span>
                </div>
                <div className="space-y-1.5 font-label-sm text-label-sm text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Ground Survey Tablets</span>
                    <span className="text-on-surface font-semibold">112 / 112 Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Automatic Weighbridges</span>
                    <span className="text-on-surface font-semibold">46 / 46 Linked</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WRS Depot Telemetry</span>
                    <span className="text-on-surface font-semibold">18 Silo Hubs</span>
                  </div>
                </div>
                <button onClick={() => showScreenToast("Telemetry audit: All 112 ground survey tablets and 46 weighbridges pass tamper-proof SHA-256 validation.")} className="w-full mt-2 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg font-label-sm text-label-sm text-on-surface font-semibold transition-colors" type="button">Audit Telemetry Logs</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
