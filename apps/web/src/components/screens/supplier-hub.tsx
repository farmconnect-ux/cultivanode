// Ported from the "input_supplier_agro_dealer_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function SupplierHub(_props: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span>Agricultural Commerce</span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="text-primary font-semibold">Input Supplier &amp; Agro-dealer Hub (§6.2)</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">Input Supplier &amp; Agro-dealer Command Hub</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">Certified seed, fertilizer, and crop-protection catalog, warehouse batch traceability, and automated crop-plan shortage fulfillment across South-West Nigeria agro-clusters.</p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm self-start md:self-auto">
            <button className="flex items-center gap-space-xs px-space-md py-2 bg-surface-container-lowest text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container-high transition-colors" type="button">
              <Icon name="file_download" className="text-[18px] text-on-surface-variant" />
              <span>Export Waybills (CSV)</span>
            </button>
            <button className="flex items-center gap-space-xs px-space-md py-2 bg-surface-container-lowest text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container-high transition-colors" type="button">
              <Icon name="verified" className="text-[18px] text-secondary" />
              <span>Import Manifest</span>
            </button>
            <button className="flex items-center gap-space-xs px-space-md py-2 bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary transition-colors" type="button">
              <Icon name="add_circle" className="text-[18px]" />
              <span>+ Add Stock Line</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
          <div className="flex items-center justify-between p-space-sm px-space-md bg-surface-container-lowest rounded-lg shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                <Icon name="verified_user" className="text-[18px]" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Licensing Status</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">Tier 3 CAC &amp; NAFDAC Accredited</span>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          </div>
          <div className="flex items-center justify-between p-space-sm px-space-md bg-surface-container-lowest rounded-lg shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <Icon name="warehouse" className="text-[18px]" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Depot Nodes</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">Saki · Iseyin · Ibadan Central</span>
              </div>
            </div>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">3 Online</span>
          </div>
          <div className="flex items-center justify-between p-space-sm px-space-md bg-surface-container-lowest rounded-lg shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-secondary-fixed/40 flex items-center justify-center text-secondary">
                <Icon name="bolt" className="text-[18px]" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Shortfall Dispatch Engine</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">Auto-Allocation Active</span>
              </div>
            </div>
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Routing</span>
          </div>
          <div className="flex items-center justify-between p-space-sm px-space-md bg-surface-container-lowest rounded-lg shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <Icon name="cloud_sync" className="text-[18px]" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">PowerSync SQLite</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">Local Edge Synced (18ms)</span>
              </div>
            </div>
            <Icon name="done_all" className="text-[18px] text-secondary" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md">
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Orders Pipeline</span>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold">+22% vs cycle</span>
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">38 Orders</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug"><strong className="text-tertiary-container">14</strong> Confirming · <strong className="text-on-surface">9</strong> Fulfilling · <strong className="text-secondary">15</strong> Dispatched</p>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden flex">
              <div className="bg-tertiary-container h-full" style={{ width: "37%" }} />
              <div className="bg-primary-container h-full" style={{ width: "24%" }} />
              <div className="bg-secondary h-full" style={{ width: "39%" }} />
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Gross Sales</span>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold">98.8% Settled</span>
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">₦14,850,000</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">Zenith Settled: ₦12.40M <br />Escrow Hold: ₦2.45M</p>
            </div>
            <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-semibold">
              <Icon name="account_balance" className="text-[16px]" />
              <span>Auto-Sweep Daily at 18:00</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Depot Inventory</span>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-bold">4 Depots</span>
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">₦48,620,000</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">182 SKU Lines across stores<br />1,420 Bags NPK &amp; Urea</p>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <Icon name="inventory" className="text-[16px] text-secondary" />
              <span>FIFO Lot Traced (GS1/QR)</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Stock Alerts</span>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-error-container text-on-error-container font-bold">Critical (3)</span>
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-error tracking-tight">3 Shortfalls</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">NPK 15:15:15 below 18% safety cap<br />1 Batch near REI / Expiry window</p>
            </div>
            <a className="flex items-center gap-space-xs text-error font-label-sm text-label-sm font-semibold hover:underline" href="#inventory-catalog">
              <Icon name="warning" className="text-[16px]" />
              <span>Trigger Supplier POs</span>
            </a>
          </div>
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Dispatch SLA</span>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold">&lt; 8.0h Target</span>
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-secondary tracking-tight">4.2 Hours</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">Low-loader / tractor trailer &amp; bike courier turnaround avg.</p>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <Icon name="speed" className="text-[16px] text-secondary" />
              <span>Benchmark: Top 5% in Oyo</span>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Integrity Index</span>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-bold">Safe</span>
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">0.4%</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">0 Counterfeit flags · 1 transit tear resolved with insurance</p>
            </div>
            <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-semibold">
              <Icon name="format_image_left" className="text-[16px]" />
              <span>NAFDAC MAS Verified</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col p-space-lg bg-surface-container-lowest rounded-xl shadow-sm gap-space-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-primary-fixed flex items-center justify-center shrink-0">
                <Icon name="hub" className="text-[28px]" />
              </div>
              <div>
                <div className="flex items-center gap-space-xs">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Automated Crop-Plan Shortfall Requisitions</h2>
                  <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm rounded-full font-bold">Realtime Ingest</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Cross-dashboard pipeline linking field operations, soil nutrient deficit triggers, and pest outbreaks directly to your nearest warehouse inventory.</p>
              </div>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low px-space-md py-1.5 rounded-lg">
              <Icon name="sensors" className="text-[16px] text-secondary" />
              <span>Listening to Oyo Central Clusters (Radius: 45km)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md pt-space-xs">
            <div className="flex flex-col justify-between p-space-md bg-surface-container-low rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-surface-container-highest text-primary font-label-sm text-label-sm font-bold rounded">#REQ-2026-0891</span>
                  <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Auto-Matched (14.2 km)</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Babatunde Lawal</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Iseyin Cluster · Plot M2 (Maize V4 Stage)</p>
                </div>
                <div className="p-space-sm bg-surface-container-lowest rounded-lg flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between text-on-surface font-body-sm text-body-sm">
                    <span className="font-semibold">Shortfall Trigger:</span>
                    <span className="font-bold text-primary">18 Bags NPK 15:15:15</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                    <span>Brand: Golden Fertilizer</span>
                    <span>Total: ₦693,000</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                    <span>Depot Source: Oke-Ogun Hub</span>
                    <span className="text-secondary font-medium">In Stock (120 bags avail.)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-xs pt-space-md">
                <button className="flex-1 py-2 px-space-sm bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold rounded-lg hover:bg-primary transition-colors flex items-center justify-center gap-1" type="button">
                  <Icon name="task_alt" className="text-[16px]" />
                  <span>Confirm &amp; Allocate Lot</span>
                </button>
                <button className="p-2 bg-surface-container-lowest text-on-surface rounded-lg hover:bg-surface-container-high transition-colors" title="Dispatch Low Loader" type="button">
                  <Icon name="local_shipping" className="text-[18px]" />
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-between p-space-md bg-surface-container-low rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-error-container text-on-error-container font-label-sm text-label-sm font-bold rounded">#REQ-2026-0884 · URGENT</span>
                  <span className="flex items-center gap-1 text-error font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-error animate-ping" /> Fall Armyworm Outbreak</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Folake Ibironke</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Saki Cluster · Plot B1 (Sweet Potato / Legume)</p>
                </div>
                <div className="p-space-sm bg-surface-container-lowest rounded-lg flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between text-on-surface font-body-sm text-body-sm">
                    <span className="font-semibold">Shortfall Trigger:</span>
                    <span className="font-bold text-error">12 Units Emamectin Benzoate</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                    <span>Brand: Syngenta Pro 5% SG</span>
                    <span>Total: ₦57,600</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                    <span>Depot Source: Saki Warehouse</span>
                    <span className="text-error font-medium">&lt; 2h Critical Spray Window</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-xs pt-space-md">
                <button className="flex-1 py-2 px-space-sm bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm font-semibold rounded-lg hover:bg-tertiary transition-colors flex items-center justify-center gap-1" type="button">
                  <Icon name="two_wheeler" className="text-[16px]" />
                  <span>Instant Dispatch (Motorbike)</span>
                </button>
                <button className="p-2 bg-surface-container-lowest text-on-surface rounded-lg hover:bg-surface-container-high transition-colors" title="View Agronomy Protocol" type="button">
                  <Icon name="biotech" className="text-[18px]" />
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-between p-space-md bg-surface-container-low rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-surface-container-highest text-primary font-label-sm text-label-sm font-bold rounded">#REQ-2026-0879</span>
                  <span className="flex items-center gap-1 text-tertiary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-tertiary-container" /> Escrow Hold</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Psaltry Cassava Outgrowers</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Ado-Awaye Industrial Block · 35 Hectares</p>
                </div>
                <div className="p-space-sm bg-surface-container-lowest rounded-lg flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between text-on-surface font-body-sm text-body-sm">
                    <span className="font-semibold">Shortfall Trigger:</span>
                    <span className="font-bold text-primary">45L Atrazine 500 SC Herbicide</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                    <span>Pre-emergence Cassava Protocol</span>
                    <span>Total: ₦216,000</span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                    <span>Depot Source: Ibadan Central</span>
                    <span className="text-outline font-medium">Awaiting Off-taker Release</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-xs pt-space-md">
                <button className="flex-1 py-2 px-space-sm bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1" type="button">
                  <Icon name="hourglass_top" className="text-[16px]" />
                  <span>Verify Escrow Contract</span>
                </button>
                <button className="p-2 bg-surface-container-lowest text-on-surface rounded-lg hover:bg-surface-container-high transition-colors" title="Contact Syndicate Rep" type="button">
                  <Icon name="call" className="text-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col p-space-lg bg-surface-container-lowest rounded-xl shadow-sm gap-space-md" id="inventory-catalog">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Certified Product Catalog &amp; NAFDAC Matrix</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Tamper-evident batch records, Pre-Harvest Intervals (PHI), and cross-depot stock allocations.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
              <button className="px-space-md py-1 rounded-md bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-sm" type="button">All SKUs (182)</button>
              <button className="px-space-md py-1 rounded-md text-on-surface-variant font-label-sm text-label-sm hover:text-on-surface" type="button">Fertilizers (44)</button>
              <button className="px-space-md py-1 rounded-md text-on-surface-variant font-label-sm text-label-sm hover:text-on-surface" type="button">Crop Protection (68)</button>
              <button className="px-space-md py-1 rounded-md text-on-surface-variant font-label-sm text-label-sm hover:text-on-surface" type="button">Certified Seeds (38)</button>
              <button className="px-space-md py-1 rounded-md text-on-surface-variant font-label-sm text-label-sm hover:text-on-surface" type="button">Tools &amp; Knapsacks (32)</button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-space-sm items-center">
            <div className="flex items-center w-full sm:flex-1 bg-surface-container-low px-space-md py-2 rounded-lg text-on-surface-variant">
              <Icon name="search" className="text-[20px] mr-space-xs text-outline" />
              <input className="bg-transparent text-body-sm font-body-sm text-on-surface focus:outline-none w-full placeholder-outline" placeholder="Search by SKU, Brand, NAFDAC Reg Number, Lot #, Active Ingredient..." type="text" />
            </div>
            <div className="flex items-center gap-space-xs w-full sm:w-auto">
              <select className="bg-surface-container-low text-on-surface font-label-sm text-label-sm px-space-md py-2 rounded-lg focus:outline-none cursor-pointer">
                <option>All Depots (Oke-Ogun, Saki, Ibadan)</option>
                <option>Oke-Ogun Central Depot Only</option>
                <option>Saki North Depot Only</option>
                <option>Ibadan Apex Depot Only</option>
              </select>
              <select className="bg-surface-container-low text-on-surface font-label-sm text-label-sm px-space-md py-2 rounded-lg focus:outline-none cursor-pointer">
                <option>Regulatory: All Valid</option>
                <option>Low Stock Triggered (&lt; 20%)</option>
                <option>Class II / Class III Caution</option>
              </select>
            </div>
          </div>
          <div className="w-full overflow-x-auto rounded-lg shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-sm px-space-md font-semibold">Product &amp; Brand</th>
                  <th className="py-space-sm px-space-md font-semibold">Regulatory / Reg #</th>
                  <th className="py-space-sm px-space-md font-semibold">Active Formulation</th>
                  <th className="py-space-sm px-space-md font-semibold">Pack &amp; Price (₦)</th>
                  <th className="py-space-sm px-space-md font-semibold">Available Stock &amp; Depot</th>
                  <th className="py-space-sm px-space-md font-semibold">Lot / Expiry</th>
                  <th className="py-space-sm px-space-md font-semibold">PHI / REI Interval</th>
                  <th className="py-space-sm px-space-md font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface">
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <Icon name="compost" className="text-[20px]" />
                      </div>
                      <div>
                        <span className="font-label-lg text-label-lg font-semibold text-on-surface block">Golden Fertilizer NPK 15:15:15</span>
                        <span className="font-label-sm text-label-sm text-secondary font-medium">Standard Granular</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">NAFDAC A5-0182</span>
                  </td>
                  <td className="py-space-md px-space-md text-on-surface-variant font-mono text-label-sm">N:15% · P₂O₅:15% · K₂O:15%</td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">₦38,500</span>
                    <span className="text-on-surface-variant text-label-sm block">50 kg Woven Poly Bag</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="font-bold text-on-surface">480 Bags</span>
                    </div>
                    <span className="text-on-surface-variant text-label-sm block">Oke-Ogun: 120 · Saki: 240 · Ibadan: 120</span>
                  </td>
                  <td className="py-space-md px-space-md font-label-sm text-label-sm">
                    <span className="font-semibold text-on-surface">#GF-2026-B1</span>
                    <span className="text-on-surface-variant block">Exp: Jan 2028</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">REI: Immediate</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex items-center justify-end gap-space-xs">
                      <button className="px-2.5 py-1 bg-surface-container text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-container-high transition-colors" type="button">Stock</button>
                      <button className="px-2.5 py-1 bg-primary-container text-on-primary font-label-sm text-label-sm rounded hover:bg-primary transition-colors" type="button">Price</button>
                    </div>
                  </td>
                </tr>
                <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-error-container/40 flex items-center justify-center text-error shrink-0">
                        <Icon name="warning" className="text-[20px]" />
                      </div>
                      <div>
                        <span className="font-label-lg text-label-lg font-semibold text-on-surface block">Notore Urea 46% Nitrogen</span>
                        <span className="font-label-sm text-label-sm text-error font-medium">Safety Stock Breach (&lt;150)</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">NAFDAC A5-0044</span>
                  </td>
                  <td className="py-space-md px-space-md text-on-surface-variant font-mono text-label-sm">46% Nitrogen Prilled</td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">₦41,000</span>
                    <span className="text-on-surface-variant text-label-sm block">50 kg Moisture-barrier Bag</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-error" />
                      <span className="font-bold text-error">85 Bags</span>
                    </div>
                    <span className="text-error text-label-sm block">Threshold: 150 Bags Min</span>
                  </td>
                  <td className="py-space-md px-space-md font-label-sm text-label-sm">
                    <span className="font-semibold text-on-surface">#NU-2025-E4</span>
                    <span className="text-on-surface-variant block">Exp: Nov 2027</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">REI: Immediate</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex items-center justify-end gap-space-xs">
                      <button className="px-2.5 py-1 bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm rounded hover:bg-tertiary transition-colors" type="button">Reorder PO</button>
                    </div>
                  </td>
                </tr>
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <Icon name="grain" className="text-[20px]" />
                      </div>
                      <div>
                        <span className="font-label-lg text-label-lg font-semibold text-on-surface block">SAMMAZ-52 Hybrid Maize Seed</span>
                        <span className="font-label-sm text-label-sm text-secondary font-medium">NASC Certified · IITA Bred</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/50 text-on-secondary-fixed font-label-sm text-label-sm font-bold">NASC/2025/MZ-19</span>
                  </td>
                  <td className="py-space-md px-space-md text-on-surface-variant font-mono text-label-sm">Thiram + Metalaxyl Treated</td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">₦14,500</span>
                    <span className="text-on-surface-variant text-label-sm block">10 kg Seed Sachet</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="font-bold text-on-surface">320 Bags</span>
                    </div>
                    <span className="text-on-surface-variant text-label-sm block">Germination Rate: 96.5%</span>
                  </td>
                  <td className="py-space-md px-space-md font-label-sm text-label-sm">
                    <span className="font-semibold text-on-surface">#SMZ-26-09</span>
                    <span className="text-on-surface-variant block">Exp: Dec 2026</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">Treated Seed Non-Food</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex items-center justify-end gap-space-xs">
                      <button className="px-2.5 py-1 bg-surface-container text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-container-high transition-colors" type="button">Inspect Lot</button>
                    </div>
                  </td>
                </tr>
                <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container shrink-0">
                        <Icon name="pest_control" className="text-[20px]" />
                      </div>
                      <div>
                        <span className="font-label-lg text-label-lg font-semibold text-on-surface block">Emamectin Benzoate 5% SG</span>
                        <span className="font-label-sm text-label-sm text-outline font-medium">Syngenta Pro Insecticide</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">NAFDAC B2-9014</span>
                  </td>
                  <td className="py-space-md px-space-md text-on-surface-variant font-mono text-label-sm">Emamectin Benzoate 50g/kg</td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">₦4,800</span>
                    <span className="text-on-surface-variant text-label-sm block">250 g Sachet Foil</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="font-bold text-on-surface">190 Units</span>
                    </div>
                    <span className="text-on-surface-variant text-label-sm block">Saki North: 110 · Ibadan: 80</span>
                  </td>
                  <td className="py-space-md px-space-md font-label-sm text-label-sm">
                    <span className="font-semibold text-on-surface">#EM-26-03</span>
                    <span className="text-on-surface-variant block">Exp: Mar 2028</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">REI: 24h · PHI: 14d</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex items-center justify-end gap-space-xs">
                      <button className="px-2.5 py-1 bg-surface-container text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-container-high transition-colors" type="button">Safety SDS</button>
                    </div>
                  </td>
                </tr>
                <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <Icon name="science" className="text-[20px]" />
                      </div>
                      <div>
                        <span className="font-label-lg text-label-lg font-semibold text-on-surface block">Jubaili Atrazine 500 SC</span>
                        <span className="font-label-sm text-label-sm text-outline font-medium">Selective Triazine Herbicide</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">NAFDAC A4-1189</span>
                  </td>
                  <td className="py-space-md px-space-md text-on-surface-variant font-mono text-label-sm">Atrazine 500 g/L Liquid</td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">₦19,200</span>
                    <span className="text-on-surface-variant text-label-sm block">4 Litre HDPE Gallon</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="font-bold text-on-surface">42 Gallons</span>
                    </div>
                    <span className="text-on-surface-variant text-label-sm block">Ibadan Apex: 42</span>
                  </td>
                  <td className="py-space-md px-space-md font-label-sm text-label-sm">
                    <span className="font-semibold text-on-surface">#JUB-25-H8</span>
                    <span className="text-on-surface-variant block">Exp: Aug 2027</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">REI: 48h · PHI: 60d</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex items-center justify-end gap-space-xs">
                      <button className="px-2.5 py-1 bg-surface-container text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-container-high transition-colors" type="button">Safety SDS</button>
                    </div>
                  </td>
                </tr>
                <tr className="bg-surface-container-low hover:bg-surface-container transition-colors">
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container shrink-0">
                        <Icon name="water_voc" className="text-[20px]" />
                      </div>
                      <div>
                        <span className="font-label-lg text-label-lg font-semibold text-on-surface block">Leadway Agrisure Knapsack</span>
                        <span className="font-label-sm text-label-sm text-outline font-medium">16L Dual-Filter Brass Nozzle</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">ISO 9001:2015</span>
                  </td>
                  <td className="py-space-md px-space-md text-on-surface-variant font-mono text-label-sm">Reinforced Piston Pump</td>
                  <td className="py-space-md px-space-md">
                    <span className="font-bold text-on-surface">₦26,000</span>
                    <span className="text-on-surface-variant text-label-sm block">Individual Boxed Unit</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="font-bold text-on-surface">64 Units</span>
                    </div>
                    <span className="text-on-surface-variant text-label-sm block">Across all depots</span>
                  </td>
                  <td className="py-space-md px-space-md font-label-sm text-label-sm">
                    <span className="font-semibold text-on-surface">#KS-2026</span>
                    <span className="text-on-surface-variant block">Hardware Unit</span>
                  </td>
                  <td className="py-space-md px-space-md">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">N/A Equipment</span>
                  </td>
                  <td className="py-space-md px-space-md text-right">
                    <div className="flex items-center justify-end gap-space-xs">
                      <button className="px-2.5 py-1 bg-surface-container text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-container-high transition-colors" type="button">Manage</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-7 flex flex-col p-space-lg bg-surface-container-lowest rounded-xl shadow-sm gap-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Dispatch &amp; Proof-of-Delivery (PoD)</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Live telemetry from agricultural transporters and motorcycle couriers.</p>
              </div>
              <span className="px-2 py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-bold">3 In Transit</span>
            </div>
            <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-sm shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">#ORD-2026-8812</span>
                  <span className="text-outline">·</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Waybill #WB-9884</span>
                </div>
                <span className="self-start sm:self-auto px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> In-Transit (ETA 45 mins)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm text-body-sm text-on-surface py-space-xs">
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Recipient</span>
                  <span className="font-semibold">Babatunde Lawal</span>
                  <span className="text-on-surface-variant text-label-sm block">Iseyin Savanna Cluster</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Cargo Load</span>
                  <span className="font-semibold">18x NPK 15:15:15</span>
                  <span className="text-secondary font-bold text-label-sm block">₦693,000 (Escrow Locked)</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Transporter Fleet</span>
                  <span className="font-semibold">Lateef Low-loader</span>
                  <span className="text-on-surface-variant text-label-sm block">Reg: OYO-442-XA</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-surface-container rounded-lg text-label-sm text-on-surface-variant">
                <div className="flex items-center gap-space-xs">
                  <Icon name="fmd_good" className="text-[16px] text-secondary" />
                  <span>GPS Ping: 8.1224° N, 3.5518° E (Ado-Awaye Bypass)</span>
                </div>
                <button className="text-primary font-semibold hover:underline flex items-center gap-0.5" type="button">
                  <span>Track Telematics</span>
                  <Icon name="open_in_new" className="text-[14px]" />
                </button>
              </div>
            </div>
            <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-sm shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">#ORD-2026-8815</span>
                  <span className="text-outline">·</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Waybill #WB-9889</span>
                </div>
                <span className="self-start sm:self-auto px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" /> Staged at Dock 2 (Saki Hub)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm text-body-sm text-on-surface py-space-xs">
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Recipient</span>
                  <span className="font-semibold">Saki Cooperative Outgrowers</span>
                  <span className="text-on-surface-variant text-label-sm block">Syndicate Hub Warehouse</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Cargo Load</span>
                  <span className="font-semibold">40x SAMMAZ-52 + 15x Atrazine</span>
                  <span className="text-secondary font-bold text-label-sm block">₦868,000 (Pre-funded)</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Logistics Status</span>
                  <span className="font-semibold">Awaiting Low-Loader</span>
                  <span className="text-on-surface-variant text-label-sm block">Driver scheduled 14:30</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs">
                <span className="text-label-sm text-on-surface-variant">Batch integrity seals applied: #SL-991823 through #SL-991878</span>
                <button className="px-space-md py-1.5 bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold rounded-lg hover:bg-primary transition-colors" type="button">Confirm Departure</button>
              </div>
            </div>
            <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-sm shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">#ORD-2026-8820</span>
                  <span className="text-outline">·</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Waybill #WB-9872</span>
                </div>
                <span className="self-start sm:self-auto px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1"><Icon name="check_circle" className="text-[14px]" /> Delivered &amp; Verified</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm text-body-sm text-on-surface py-space-xs">
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Recipient</span>
                  <span className="font-semibold">Folake Ibironke</span>
                  <span className="text-on-surface-variant text-label-sm block">Saki North Vegetable Plot</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Cargo Load</span>
                  <span className="font-semibold">12x Emamectin Benzoate</span>
                  <span className="text-secondary font-bold text-label-sm block">₦57,600 (Settled)</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-outline block">Courier</span>
                  <span className="font-semibold">Express Motorbike #04</span>
                  <span className="text-on-surface-variant text-label-sm block">Transit time: 38 mins</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-surface-container-lowest rounded-lg text-label-sm text-on-surface-variant">
                <div className="flex items-center gap-space-xs">
                  <Icon name="verified" className="text-[16px] text-secondary" />
                  <span>Proof-of-Delivery: Biometric / Geotag Stamp #GEO-8.672-3.391</span>
                </div>
                <button className="text-primary font-semibold hover:underline" type="button">View PoD Photo</button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col p-space-lg bg-surface-container-lowest rounded-xl shadow-sm gap-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Anti-Counterfeit Matrix</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">NAFDAC MAS &amp; GS1 batch integrity.</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
                <Icon name="qr_code_scanner" className="text-[20px]" />
              </div>
            </div>
            <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-sm shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Latest Mobile Scan</span>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">100% Genuine</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Batch #GF-2026-B1</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Golden Fertilizer NPK 15:15:15 (50kg)</p>
              </div>
              <div className="p-space-sm bg-surface-container-lowest rounded-lg flex flex-col gap-1 text-label-sm">
                <div className="flex justify-between">
                  <span className="text-outline">NAFDAC MAS Code:</span>
                  <span className="font-mono font-semibold text-on-surface">3819-9948-2104-MAS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Scratch-Code Pool:</span>
                  <span className="text-secondary font-semibold">Verified via 38353 SMS gateway</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Purity Assay Score:</span>
                  <span className="font-semibold text-on-surface">99.4% Active Ingredient fidelity</span>
                </div>
              </div>
            </div>
            <div className="p-space-md bg-error-container/20 rounded-xl flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs text-error">
                <Icon name="report" className="text-[20px]" />
                <span className="font-label-lg text-label-lg font-bold">Regional Adulteration Alert</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface">NAFDAC has issued a high alert for adulterated bags of <strong>NPK 20:10:10</strong> circulating in northern border corridors (Niger State / Kwara boundary). Bags have missing thermal tamper seals.</p>
              <div className="flex items-center gap-space-sm pt-space-xs">
                <button className="px-space-md py-1 bg-surface-container-lowest text-error font-label-sm text-label-sm font-semibold rounded hover:bg-error-container/40 transition-colors" type="button">View Visual ID Guide</button>
                <span className="text-outline text-label-sm">Updated 3 hrs ago</span>
              </div>
            </div>
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Active Lab &amp; Seed Certifications</span>
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-space-sm">
                  <Icon name="workspace_premium" className="text-secondary text-[20px]" />
                  <div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface block">IITA Seed Certification Seal</span>
                    <span className="text-on-surface-variant text-label-sm">SAMMAZ-52 Pure Hybrid Stock · NASC Audit Pass</span>
                  </div>
                </div>
                <button className="text-primary hover:text-on-surface" title="Download Certificate PDF" type="button">
                  <Icon name="download" className="text-[18px]" />
                </button>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-space-sm">
                  <Icon name="science" className="text-secondary text-[20px]" />
                  <div>
                    <span className="font-label-md text-label-md font-semibold text-on-surface block">NAFDAC Chemical Purity Assay</span>
                    <span className="text-on-surface-variant text-label-sm">Emamectin Benzoate 5% SG &amp; Atrazine 500 SC</span>
                  </div>
                </div>
                <button className="text-primary hover:text-on-surface" title="Download Certificate PDF" type="button">
                  <Icon name="download" className="text-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-md bg-surface-container-lowest rounded-xl shadow-sm text-on-surface-variant">
          <div className="flex flex-wrap items-center gap-space-md font-label-sm text-label-sm">
            <div className="flex items-center gap-1">
              <Icon name="gavel" className="text-[16px] text-secondary" />
              <span>NAFDAC Act Cap N1 LFN 2004</span>
            </div>
            <span className="text-outline">·</span>
            <div className="flex items-center gap-1">
              <Icon name="spa" className="text-[16px] text-secondary" />
              <span>NASC Seeds Act 2019 Compliant</span>
            </div>
            <span className="text-outline">·</span>
            <div className="flex items-center gap-1">
              <Icon name="lock" className="text-[16px] text-secondary" />
              <span>NDPA 2023 Farm Escrow Protected</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button className="px-space-md py-1.5 bg-surface-container-low text-on-surface font-label-sm text-label-sm font-semibold rounded-lg hover:bg-surface-container transition-colors" type="button">Audit Log</button>
            <button className="px-space-md py-1.5 bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold rounded-lg hover:bg-primary transition-colors" type="button">Generate Regulatory Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}
