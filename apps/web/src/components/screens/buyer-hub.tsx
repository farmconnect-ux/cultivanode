// Ported from the "produce_buyer_aggregator_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function BuyerHub(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg">
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                <span>Agricultural Commerce</span>
                <Icon name="chevron_right" className="text-[14px]" />
                <span className="text-primary font-bold">Buyer &amp; Aggregator Hub (§6.4)</span>
                <Icon name="chevron_right" className="text-[14px]" />
                <span className="text-on-surface">South-West Industrial Agro-Corridor</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">Produce Buyer &amp; Aggregator Command Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">Enterprise commodity sourcing, smallholder lot consolidation, weighbridge quality verification, and automated escrow contracts across Oyo, Ogun, Osun, and Ondo state networks.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              {_props.slots?.actions ?? (
                <>
                  <button className="bg-primary text-on-primary px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-primary-container transition-colors shadow-sm" type="button">
                    <Icon name="add_circle" className="text-[20px]" />
                    <span>Create Purchase Requirement</span>
                  </button>
                  <button className="bg-surface-container text-on-surface px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-surface-container-high transition-colors" type="button">
                    <Icon name="scale" className="text-[20px]" />
                    <span>Schedule Weighbridge Slot</span>
                  </button>
                  <button className="bg-surface-container-low text-on-surface-variant px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-surface-container transition-colors" type="button">
                    <Icon name="ios_share" className="text-[20px]" />
                    <span>Export Sourcing Dossier</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm pt-space-xs text-on-surface-variant">
            <div className="inline-flex items-center gap-space-xs bg-secondary-fixed text-on-secondary-fixed px-space-sm py-1 rounded-full font-label-sm text-label-sm">
              <Icon name="verified_user" className="text-[16px] text-secondary" />
              <span>Verified Off-taker (Tier 3 CAC &amp; NEPC)</span>
            </div>
            <div className="inline-flex items-center gap-space-xs bg-surface-container px-space-sm py-1 rounded-full font-label-sm text-label-sm text-on-surface">
              <Icon name="route" className="text-[16px] text-primary" />
              <span>Corridors: Oyo (Iseyin, Saki) · Ogun (Abeokuta, Sagamu) · Osun (Ede)</span>
            </div>
            <div className="inline-flex items-center gap-space-xs bg-surface-container-high px-space-sm py-1 rounded-full font-label-sm text-label-sm text-on-surface">
              <Icon name="account_balance" className="text-[16px] text-secondary" />
              <span>Automated Escrow Custody: Zenith Bank PLC</span>
            </div>
            <div className="inline-flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full font-label-sm text-label-sm text-outline">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Weighbridge Node Sync: 100% Online</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-space-md w-full">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Active Mandates</span>
              <Icon name="assignment_turned_in" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">6 Mandates</div>
              <div className="text-body-sm font-body-sm text-secondary flex items-center gap-1 font-semibold">
                <span>1,450 MT Target</span>
                <span>· 68% Filled</span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "68%" }} />
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Aggregated Supply</span>
              <Icon name="groups" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">986 MT</div>
              <div className="text-body-sm font-body-sm text-on-surface-variant">14 Smallholder Co-ops</div>
            </div>
            <div className="flex items-center gap-space-xs text-label-sm font-label-sm text-secondary">
              <Icon name="check_circle" className="text-[14px]" />
              <span>284 verified farmers</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Escrow Balance</span>
              <Icon name="lock" className="text-[20px] text-tertiary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">₦248.5M</div>
              <div className="text-body-sm font-body-sm text-outline">₦172.2M Locked in transit</div>
            </div>
            <div className="text-label-sm font-label-sm text-tertiary flex items-center gap-1">
              <span>₦76.3M awaiting QC ticket</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Fleet Inbound</span>
              <Icon name="local_shipping" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">14 Trucks</div>
              <div className="text-body-sm font-body-sm text-on-surface-variant">8 Transit · 4 Gate · 2 Offload</div>
            </div>
            <div className="flex items-center gap-space-xs text-label-sm font-label-sm text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span>Telematics tracking live</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">Avg Quality Grade</span>
              <Icon name="verified" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">Grade A</div>
              <div className="text-body-sm font-body-sm text-secondary">94.2% Acceptance Rate</div>
            </div>
            <div className="text-label-sm font-label-sm text-on-surface-variant">
              <span>12.8% Maize H₂O · 0.8% Impurities</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-md text-label-md uppercase tracking-wider">SLA Fulfillment</span>
              <Icon name="timer" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface">97.4%</div>
              <div className="text-body-sm font-body-sm text-secondary">0.0% Penalty Default Rate</div>
            </div>
            <div className="text-label-sm font-label-sm text-on-surface-variant">
              <span>10-Day SLA delivery window</span>
            </div>
          </div>
        </div>
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-xs">
            <div className="flex items-center gap-space-sm">
              <div className="p-2 rounded-lg bg-primary-container text-on-primary">
                <Icon name="radar" className="text-[22px]" />
              </div>
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Active Commodity Purchase Requirements &amp; Sourcing Radar</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Live contract terms, quality specifications, and consolidated farmer lot matching (§6.4)</p>
              </div>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-lg">
              <button className="px-space-sm py-1 rounded font-label-sm text-label-sm bg-surface-container-lowest text-primary font-bold shadow-sm" type="button">All Mandates</button>
              <button className="px-space-sm py-1 rounded font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface" type="button">Grains &amp; Cereals</button>
              <button className="px-space-sm py-1 rounded font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface" type="button">Tubers &amp; Roots</button>
              <button className="px-space-sm py-1 rounded font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface" type="button">Legumes &amp; Oilseeds</button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-sm">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-primary font-bold">#REQ-BUY-2026-01</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Inbound Lots Matching</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Yellow Maize (Feed Mill Grade 1)</h3>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦420,000 / MT</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Off-taker: <strong className="text-on-surface font-semibold">Grand Cereals / Livestock Feeds PLC</strong> · Destination: Ibadan Central Silos</p>
              </div>
              <div className="grid grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg text-center">
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Target Qty</div>
                  <div className="font-label-lg text-label-lg font-bold text-on-surface">500 MT</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Collected / %</div>
                  <div className="font-label-lg text-label-lg font-bold text-secondary">390 MT (78%)</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Max Moisture</div>
                  <div className="font-label-lg text-label-lg font-bold text-on-surface">≤ 13.0%</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                  <span>Sourcing Progress</span>
                  <span className="font-bold text-on-surface">390 / 500 MT</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: "78%" }} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs text-body-sm font-body-sm">
                <span className="text-on-surface-variant flex items-center gap-1"><Icon name="calendar_today" className="text-[16px]" /> Delivery Window: 10 May – 25 May 2026</span>
                <button className="text-secondary font-label-lg text-label-lg font-semibold hover:underline flex items-center gap-0.5" type="button">
                  <span>Inspect 3 Matched Lots</span>
                  <Icon name="arrow_forward" className="text-[16px]" />
                </button>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-sm">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-primary font-bold">#REQ-BUY-2026-02</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Daily Harvester Hauls Active</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Industrial Cassava Roots (Starch Grade)</h3>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦115,000 / MT</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Off-taker: <strong className="text-on-surface font-semibold">Psaltry International PLC</strong> · Destination: Ado-Awaye Factory Gate</p>
              </div>
              <div className="grid grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg text-center">
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Target Qty</div>
                  <div className="font-label-lg text-label-lg font-bold text-on-surface">600 MT</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Collected / %</div>
                  <div className="font-label-lg text-label-lg font-bold text-secondary">440 MT (73.3%)</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Min Starch Yield</div>
                  <div className="font-label-lg text-label-lg font-bold text-on-surface">≥ 24.0%</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                  <span>Sourcing Progress</span>
                  <span className="font-bold text-on-surface">440 / 600 MT</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "73.3%" }} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs text-body-sm font-body-sm">
                <span className="text-on-surface-variant flex items-center gap-1"><Icon name="schedule" className="text-[16px]" /> Continuous Intake (Max 24h Root Age)</span>
                <button className="text-secondary font-label-lg text-label-lg font-semibold hover:underline flex items-center gap-0.5" type="button">
                  <span>View Fresh Harvester Roster</span>
                  <Icon name="arrow_forward" className="text-[16px]" />
                </button>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-sm">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-primary font-bold">#REQ-BUY-2026-03</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Open Aggregator Bids</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Non-GMO Soybean (Oil Extraction)</h3>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦680,000 / MT</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Off-taker: <strong className="text-on-surface font-semibold">Premium Edible Oils Ede</strong> · Destination: Osun Refining Complex</p>
              </div>
              <div className="grid grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg text-center">
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Target Qty</div>
                  <div className="font-label-lg text-label-lg font-bold text-on-surface">250 MT</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Collected / %</div>
                  <div className="font-label-lg text-label-lg font-bold text-tertiary">110 MT (44%)</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Target Oil Index</div>
                  <div className="font-label-lg text-label-lg font-bold text-on-surface">≥ 19.0%</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                  <span>Sourcing Progress</span>
                  <span className="font-bold text-on-surface">110 / 250 MT</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-tertiary-container h-full rounded-full" style={{ width: "44%" }} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs text-body-sm font-body-sm">
                <span className="text-on-surface-variant flex items-center gap-1"><Icon name="calendar_today" className="text-[16px]" /> Window: 15 May – 30 May 2026</span>
                <button className="text-secondary font-label-lg text-label-lg font-semibold hover:underline flex items-center gap-0.5" type="button">
                  <span>Broadcast Aggregator Request</span>
                  <Icon name="arrow_forward" className="text-[16px]" />
                </button>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-sm">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-primary font-bold">#REQ-BUY-2026-04</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Co-op Consolidation Active</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Paddy Rice (Faro 44 Long Grain)</h3>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₦540,000 / MT</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Off-taker: <strong className="text-on-surface font-semibold">Olam Agri / Ebonyi Mills Hub</strong> · Destination: Sagamu Hub</p>
              </div>
              <div className="grid grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg text-center">
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Target Qty</div>
                  <div className="font-label-lg text-label-lg font-bold text-on-surface">100 MT</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Collected / %</div>
                  <div className="font-label-lg text-label-lg font-bold text-secondary">46 MT (46%)</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline">Broken Grain Max</div>
                  <div className="font-label-lg text-label-lg font-bold text-on-surface">≤ 4.0%</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                  <span>Sourcing Progress</span>
                  <span className="font-bold text-on-surface">46 / 100 MT</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: "46%" }} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs text-body-sm font-body-sm">
                <span className="text-on-surface-variant flex items-center gap-1"><Icon name="calendar_today" className="text-[16px]" /> Window: 01 June – 15 June 2026</span>
                <button className="text-secondary font-label-lg text-label-lg font-semibold hover:underline flex items-center gap-0.5" type="button">
                  <span>Consolidate Rice Lots</span>
                  <Icon name="arrow_forward" className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="p-2 rounded-lg bg-surface-container text-primary">
                <Icon name="inventory_2" className="text-[22px]" />
              </div>
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Smallholder Aggregated Lots &amp; Supply Pipeline</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Traceable farmer cluster consolidation with GPS boundary attestation and tamper-evident bag tags</p>
              </div>
            </div>
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center bg-surface-container-low px-space-md py-1.5 rounded-lg text-on-surface-variant">
                <Icon name="search" className="text-[18px] mr-1 text-outline" />
                <input className="bg-transparent text-body-sm font-body-sm text-on-surface focus:outline-none w-48" placeholder="Filter by Lot ID, Cluster, Farmer..." type="text" />
              </div>
              <button className="bg-surface-container px-space-md py-1.5 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button"><Icon name="tune" className="text-[16px]" /> Filter Status</button>
            </div>
          </div>
          <div className="w-full overflow-x-auto rounded-lg">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <tr>
                  <th className="py-space-sm px-space-md">Lot Identifier &amp; Origin</th>
                  <th className="py-space-sm px-space-md">Contributing Cluster</th>
                  <th className="py-space-sm px-space-md">Commodity &amp; Spec</th>
                  <th className="py-space-sm px-space-md">Volume</th>
                  <th className="py-space-sm px-space-md">Traceability &amp; Bagging</th>
                  <th className="py-space-sm px-space-md">Quality Telemetry</th>
                  <th className="py-space-sm px-space-md">Status</th>
                  <th className="py-space-sm px-space-md text-right">Operational Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 text-on-surface">
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="font-label-lg text-label-lg font-bold text-primary">#LOT-ISY-992</div>
                    <div className="text-on-surface-variant font-body-sm text-body-sm">Iseyin East Aggregation Depo</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="font-semibold text-on-surface">Iseyin Savanna Syndicate</div>
                    <div className="text-on-surface-variant text-label-sm font-label-sm">32 Smallholders · Lead: B. Lawal</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="font-medium text-on-surface">Yellow Maize (SAMMAZ-52)</div>
                    <div className="text-label-sm font-label-sm text-outline">Weevils: 0/kg · Grade 1 Cleaned</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">85.0 MT</span>
                    <span className="block text-label-sm font-label-sm text-outline">1,700 Bags</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 text-secondary font-label-sm font-semibold"><Icon name="qr_code_2" className="text-[16px]" /> GPS Verified</div>
                    <span className="text-label-sm font-label-sm text-on-surface-variant">NFC Tagged Bags</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 font-semibold text-on-surface"><Icon name="water_drop" className="text-[16px] text-secondary" /> 12.6% H₂O</div>
                    <span className="text-label-sm font-label-sm text-secondary">Pass Spec (≤13%)</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Ready for Haulage</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="bg-primary text-on-primary px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm hover:bg-primary-container transition-colors inline-flex items-center gap-1 shadow-sm" type="button"><Icon name="local_shipping" className="text-[16px]" /> Dispatch Logistics</button>
                  </td>
                </tr>
                <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="font-label-lg text-label-lg font-bold text-primary">#LOT-ADO-401</div>
                    <div className="text-on-surface-variant font-body-sm text-body-sm">Ado-Awaye Farm Gate</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="font-semibold text-on-surface">Ado Outgrowers Union</div>
                    <div className="text-on-surface-variant text-label-sm font-label-sm">18 Farmers · Lead: A. Tijani</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="font-medium text-on-surface">Cassava Roots (TME 419)</div>
                    <div className="text-label-sm font-label-sm text-secondary">Harvest: 6h ago (Ultra-Fresh)</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">120.0 MT</span>
                    <span className="block text-label-sm font-label-sm text-outline">Bulk Tipper Haul</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 text-secondary font-label-sm font-semibold"><Icon name="map" className="text-[16px]" /> Farm Geo-Polygon</div>
                    <span className="text-label-sm font-label-sm text-on-surface-variant">Batch #CAS-8819</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 font-semibold text-on-surface"><Icon name="science" className="text-[16px] text-primary" /> Starch: 25.8%</div>
                    <span className="text-label-sm font-label-sm text-secondary">Above Baseline (≥24%)</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Truck En Route</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="bg-surface-container-high text-on-surface px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm hover:bg-surface-container transition-colors inline-flex items-center gap-1" type="button"><Icon name="my_location" className="text-[16px]" /> Track Hauler GPS</button>
                  </td>
                </tr>
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="font-label-lg text-label-lg font-bold text-primary">#LOT-SAK-118</div>
                    <div className="text-on-surface-variant font-body-sm text-body-sm">Oke-Ogun Northern Transit Hub</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="font-semibold text-on-surface">Oke-Ogun Soya Alliance</div>
                    <div className="text-on-surface-variant text-label-sm font-label-sm">24 Farmers · Lead: F. Ojo</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="font-medium text-on-surface">Non-GMO Soybean (TGX-1448E)</div>
                    <div className="text-label-sm font-label-sm text-outline">Foreign Matter: 0.9% max</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">45.0 MT</span>
                    <span className="block text-label-sm font-label-sm text-outline">900x 50kg Polylined</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 text-secondary font-label-sm font-semibold"><Icon name="verified" className="text-[16px]" /> Lab Certified</div>
                    <span className="text-label-sm font-label-sm text-on-surface-variant">Trace ID #SY-9921</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 font-semibold text-on-surface"><Icon name="water_drop" className="text-[16px] text-secondary" /> 10.4% H₂O</div>
                    <span className="text-label-sm font-label-sm text-secondary">Oil Index: 19.8%</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Quality Passed</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="bg-tertiary text-on-tertiary px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity inline-flex items-center gap-1 shadow-sm" type="button"><Icon name="payments" className="text-[16px]" /> Release ₦30.6M Escrow</button>
                  </td>
                </tr>
                <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="font-label-lg text-label-lg font-bold text-primary">#LOT-EGB-055</div>
                    <div className="text-on-surface-variant font-body-sm text-body-sm">Abeokuta South Consolidation</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="font-semibold text-on-surface">Egba Rice Growers Co-op</div>
                    <div className="text-on-surface-variant text-label-sm font-label-sm">15 Farmers · Lead: K. Balogun</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="font-medium text-on-surface">Paddy Rice (Faro 44 Long Grain)</div>
                    <div className="text-label-sm font-label-sm text-outline">Target Milling: 68%</div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">38.0 MT</span>
                    <span className="block text-label-sm font-label-sm text-outline">760 Bags</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm font-semibold"><Icon name="qr_code" className="text-[16px]" /> Barcode Tagged</div>
                    <span className="text-label-sm font-label-sm text-outline">Plot Verification Open</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1 font-semibold text-on-surface"><Icon name="science" className="text-[16px] text-tertiary" /> Sampling In Progress</div>
                    <span className="text-label-sm font-label-sm text-outline">Moisture: 13.2% (Pending)</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Lab Inspection</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <button className="bg-surface-container-high text-on-surface px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm hover:bg-surface-container transition-colors inline-flex items-center gap-1" type="button"><Icon name="biotech" className="text-[16px]" /> Upload Lab Cert</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-space-xs">
            <div>Showing 4 of 14 Smallholder Aggregate Lots across 4 Corridors</div>
            <div className="flex items-center gap-space-xs">
              <button className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">Previous</button>
              <button className="px-space-sm py-1 rounded bg-primary text-on-primary font-bold" type="button">1</button>
              <button className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">2</button>
              <button className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">Next</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md w-full">
          <div className="xl:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-xs">
                <div className="flex items-center gap-space-sm">
                  <div className="p-2 rounded-lg bg-primary-container text-on-primary">
                    <Icon name="balance" className="text-[22px]" />
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Digital Weighbridge Ticket &amp; Lab Grading Station</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Automated axle load scale integration, NIR moisture spectroscopy, and Aflatoxin assay (§11.3)</p>
                  </div>
                </div>
                <span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Scale Calibrated (SON Stamp #2026)</span>
              </div>
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-md shadow-sm">
                <div className="flex flex-wrap items-center justify-between border-b-0">
                  <div>
                    <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Active Intake Scale Ticket</div>
                    <div className="font-headline-md text-headline-md text-primary font-bold">#WB-2026-0492</div>
                  </div>
                  <div className="text-right">
                    <div className="font-label-sm text-label-sm text-outline">Terminal</div>
                    <div className="font-label-lg text-label-lg font-semibold text-on-surface">Ibadan Processing Hub Gate #2</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Vehicle Reg / Type</span>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">OYO-442-XA</span>
                    <span className="text-label-sm text-label-sm text-on-surface-variant block">Bedford 30-Tonne Tipper</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Driver / Credentials</span>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">Lateef Adeleke</span>
                    <span className="text-label-sm text-label-sm text-secondary font-semibold block">NIN Verified (FRSC Match)</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Commodity Batch</span>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">Yellow Maize (Feed 1)</span>
                    <span className="text-label-sm text-label-sm text-on-surface-variant block">From #LOT-ISY-992</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-space-sm">
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg text-center">
                    <span className="font-label-sm text-label-sm text-outline block">Gross Axle Weight</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">42,850 kg</span>
                    <span className="text-label-sm text-label-sm text-on-surface-variant">Arrival: 10:42 AM</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-sm rounded-lg text-center">
                    <span className="font-label-sm text-label-sm text-outline block">Tare (Tare Truck)</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">14,350 kg</span>
                    <span className="text-label-sm text-label-sm text-on-surface-variant">Post-Dump: 11:15 AM</span>
                  </div>
                  <div className="bg-primary-container p-space-sm rounded-lg text-center text-on-primary">
                    <span className="font-label-sm text-label-sm text-primary-fixed block">Certified Net Weight</span>
                    <span className="font-headline-md text-headline-md font-bold text-on-primary">28,500 kg</span>
                    <span className="text-label-sm text-label-sm text-primary-fixed font-bold">28.50 Metric Tonnes</span>
                  </div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-2">Automated Quality Laboratory Assay (#QC-NG-2026-8819)</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-space-xs">
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <span className="text-label-sm font-label-sm text-outline block">Moisture (NIR)</span>
                      <span className="font-label-lg font-bold text-secondary">12.7%</span>
                      <span className="text-[11px] text-on-surface-variant block">Max spec ≤13.0% (PASS)</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <span className="text-label-sm font-label-sm text-outline block">Aflatoxin (B1/Total)</span>
                      <span className="font-label-lg font-bold text-secondary">3.2 ppb</span>
                      <span className="text-[11px] text-on-surface-variant block">EU/SON limit ≤10 ppb (PASS)</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <span className="text-label-sm font-label-sm text-outline block">Foreign Matter</span>
                      <span className="font-label-lg font-bold text-secondary">0.7%</span>
                      <span className="text-[11px] text-on-surface-variant block">Tolerable ≤1.5% (PASS)</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <span className="text-label-sm font-label-sm text-outline block">Broken Kernels</span>
                      <span className="font-label-lg font-bold text-secondary">2.1%</span>
                      <span className="text-[11px] text-on-surface-variant block">Spec limit ≤4.0% (PASS)</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-high rounded-xl p-space-md flex flex-wrap items-center justify-between gap-space-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Grade A Certified</span>
                      <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">100% Value Release</span>
                    </div>
                    <div className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Calculated Value: 28.5 MT × ₦420,000 = <strong className="text-on-surface font-semibold">₦11,970,000.00</strong> (Zero Quality Deductions)</div>
                  </div>
                  <button className="bg-primary text-on-primary px-space-lg py-2.5 rounded-lg font-label-lg text-label-lg font-bold flex items-center gap-space-xs hover:bg-primary-container transition-all shadow-md" type="button">
                    <Icon name="check_circle" className="text-[20px]" />
                    <span>Authorize Ticket &amp; Release Escrow</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-space-sm">
                  <div className="p-2 rounded-lg bg-surface-container text-primary">
                    <Icon name="navigation" className="text-[22px]" />
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Inbound Logistics Radar</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Live telemetry, route progress, and cargo environment (§6.5)</p>
                  </div>
                </div>
                <Icon name="sensors" className="text-secondary animate-pulse text-[20px]" />
              </div>
              <div className="w-full h-44 rounded-xl bg-cover bg-center relative overflow-hidden shadow-sm flex flex-col justify-between p-space-sm text-on-primary" data-location="Iseyin, Nigeria" style={{ backgroundImage: "url('/images/screens/0146c285bb45.webp')" }}>
                <div className="flex items-center justify-between bg-inverse-surface/80 px-2 py-1 rounded text-inverse-on-surface font-label-sm text-label-sm w-fit">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed mr-1.5 animate-ping" />
                  <span>Oyo-Ibadan Expressway Corridor Telemetry</span>
                </div>
                <div className="flex items-center justify-between bg-surface-container-lowest/95 backdrop-blur-md p-space-xs rounded-lg text-on-surface font-label-sm text-label-sm shadow-md">
                  <div className="flex items-center gap-1">
                    <Icon name="speed" className="text-secondary text-[16px]" />
                    <span>Avg Speed: 54 km/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="thermostat" className="text-primary text-[16px]" />
                    <span>Cargo Temp: 28°C</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="water_drop" className="text-secondary text-[16px]" />
                    <span>Humidity: 62% RH</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-space-xs mt-space-xs">
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1 hover:bg-surface-container transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">#TRK-09 (Freight #FRT-9921)</span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">In-Transit</span>
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-secondary">ETA: 1h 15m</span>
                  </div>
                  <div className="text-body-sm font-body-sm text-on-surface-variant flex items-center justify-between">
                    <span>Saki Northern Depot → Ibadan Silos (142 km)</span>
                    <span className="text-on-surface font-medium">30 MT Maize</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: "72%" }} />
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1 hover:bg-surface-container transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">#TRK-14 (Freight #FRT-9924)</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">At Factory Gate</span>
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-primary">Weighing Queue (#2)</span>
                  </div>
                  <div className="text-body-sm font-body-sm text-on-surface-variant flex items-center justify-between">
                    <span>Iseyin Farm Gate → Psaltry Ado-Awaye (38 km)</span>
                    <span className="text-on-surface font-medium">25 MT Fresh Cassava</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "95%" }} />
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1 hover:bg-surface-container transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">#TRK-03 (Freight #FRT-9918)</span>
                      <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">In-Transit</span>
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-secondary">ETA: 2h 40m</span>
                  </div>
                  <div className="text-body-sm font-body-sm text-on-surface-variant flex items-center justify-between">
                    <span>Ede Farm Hub → Sagamu Silos (185 km)</span>
                    <span className="text-on-surface font-medium">28 MT Soybeans</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-primary h-full rounded-full" style={{ width: "48%" }} />
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full bg-surface-container text-on-surface py-2 rounded-lg font-label-lg text-label-lg font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1" type="button">
              <Icon name="share_location" className="text-[18px]" />
              <span>Open Fleet Command Map (14 Units)</span>
            </button>
          </div>
        </div>
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-wrap items-center justify-between gap-space-md text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex flex-wrap items-center gap-space-lg">
            <div className="flex items-center gap-space-xs">
              <Icon name="shield_with_heart" className="text-secondary text-[20px]" />
              <div>
                <span className="font-label-sm text-label-sm font-bold text-on-surface block">SON MANCAP &amp; NEPC Registered</span>
                <span className="text-label-sm text-label-sm text-outline">Industrial Food Grade Traceability</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <Icon name="account_balance" className="text-primary text-[20px]" />
              <div>
                <span className="font-label-sm text-label-sm font-bold text-on-surface block">Zenith Escrow Guarantee §6.4</span>
                <span className="text-label-sm text-label-sm text-outline">₦248,500,000.00 Total Custody Balance</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs">
              <Icon name="lock_clock" className="text-secondary text-[20px]" />
              <div>
                <span className="font-label-sm text-label-sm font-bold text-on-surface block">SHA-256 Tamper-Proof Audit</span>
                <span className="text-label-sm text-label-sm text-outline">NDPA 2023 Compliant Settlement Ledger</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-space-sm text-label-sm font-label-sm">
            <div className="flex items-center gap-1 text-secondary">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Termii SMS Webhook Online</span>
            </div>
            <span className="text-outline">·</span>
            <div className="flex items-center gap-1 text-primary">
              <span className="w-2 h-2 rounded-full bg-primary-fixed-dim" />
              <span>PowerSync Edge DB: Synced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
