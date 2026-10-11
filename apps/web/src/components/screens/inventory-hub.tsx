// Ported from the "inventory_storekeeper_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogAction, ScreenDialogClose } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";
import { slot } from "./types";

export function InventoryHub({ lang: _lang, slots }: ScreenProps<"actions" | "kpis" | "locations" | "items" | "movements">) {
  const panelModalReceiveStock = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Stock In / Receive Goods</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Log batch reception with FIFO allocation &amp; delivery slip</p>
          </div>
          <ScreenDialogClose><button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
              <Icon name="close" />
            </button></ScreenDialogClose>
        </div>
        <div className="p-space-lg space-y-space-md max-h-[716px] overflow-y-auto">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">SKU Input</label>
            <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
              <option>Urea 46% N (Granular Indorama)</option>
              <option>NPK 15-15-15 + Zn Micro (Golden Fertilizer)</option>
              <option>Copper Hydroxide 53.8% (Fungicide)</option>
              <option>Broiler Finisher 18% CP Pellets</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-space-md">
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold">Store Location</label>
              <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
                <option>Hub Central Silo &amp; Warehouse (Iseyin)</option>
                <option>Field Store 01 (Plots A &amp; B)</option>
                <option>Cold-Chain Bio-Cabinet</option>
                <option>Feed Depot (Aquaculture)</option>
              </select>
            </div>
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold">Quantity Received</label>
              <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" placeholder="e.g. 50" type="number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-md">
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold">Batch / Lot Number</label>
              <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" placeholder="e.g. IND-2026-99" type="text" />
            </div>
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold">Unit Purchase Price (₦)</label>
              <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" placeholder="28000" type="number" />
            </div>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Expiry Date</label>
            <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="date" />
          </div>
        </div>
        <div className="p-space-lg bg-surface-container-low flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose><button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">Cancel</button></ScreenDialogClose>
          <ScreenDialogClose><button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="button">Confirm Stock Reception</button></ScreenDialogClose>
        </div>
      </div>
  );
  const panelModalIssueStock = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Issue Stock to Field Operation</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Direct allocation to operations or livestock batch</p>
          </div>
          <ScreenDialogClose><button className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
              <Icon name="close" />
            </button></ScreenDialogClose>
        </div>
        <div className="p-space-lg space-y-space-md max-h-[716px] overflow-y-auto">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Target Operation / Unit</label>
            <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
              <option>Op #OP-MAIZE-204: Top-Dressing Plot B</option>
              <option>Op #OP-SOY-101: Basal Application Field Store 01</option>
              <option>Poultry Flock A: Week 5 Broiler Feed</option>
              <option>Fish Pond 3: Juvenile Clarias Maintenance</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-space-md">
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold">SKU to Deduct</label>
              <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
                <option>Urea 46% N (6 Bags Remaining)</option>
                <option>NPK 15-15-15 + Zn (28 Bags Remaining)</option>
                <option>Broiler Finisher 18% (8 Bags Remaining)</option>
              </select>
            </div>
            <div className="space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold">Quantity to Issue</label>
              <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" placeholder="e.g. 4" type="number" />
            </div>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Authorized Storekeeper / Agronomist</label>
            <input className="w-full h-10 px-3 bg-surface-container-high text-on-surface-variant rounded-lg text-body-md font-body-md focus:outline-none" readOnly type="text" defaultValue="Quadri Olapade (Lead Agronomist)" />
          </div>
        </div>
        <div className="p-space-lg bg-surface-container-low flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose><button className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">Cancel</button></ScreenDialogClose>
          <ScreenDialogClose><button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="button">Authorize &amp; Deplete Stock</button></ScreenDialogClose>
        </div>
      </div>
  );
  return (
    <div className="screen">
      <div className="flex flex-col w-full space-y-space-xl pb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="space-y-space-xs">
            <div className="flex items-center flex-wrap gap-space-xs">
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">Inventory &amp; Storekeeper Hub</h1>
              <div className="flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Multi-Storehouse FIFO Tracking</div>
              <div className="flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold"><Icon name="tune" className="text-sm text-secondary" /> Automated Split-Input Reconciliations</div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">Real-time ag-input ledgering, batch quarantine, cold-chain monitoring, and automated depletion link to Farm Books (&amp;#8358;).</p>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex flex-wrap items-center gap-space-xs">
              <ScreenDialog title="Stock In / Receive Goods" side="center" panel={panelModalReceiveStock}>
                <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all" type="button">
                  <Icon name="add_shopping_cart" className="text-lg" />
                  <span>Receive Goods / Stock In</span>
                </button>
              </ScreenDialog>
              <ScreenDialog title="Issue Stock To Field Operation" side="center" panel={panelModalIssueStock}>
                <button className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors" type="button">
                  <Icon name="output" className="text-lg" />
                  <span>Issue Stock to Operation</span>
                </button>
              </ScreenDialog>
              <button className="flex items-center gap-space-xs px-space-sm py-2.5 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm" type="button">
                <Icon name="fact_check" className="text-lg" />
                <span className="hidden sm:inline">Physical Audit Count</span>
              </button>
              <button className="flex items-center gap-space-xs px-space-sm py-2.5 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm" title="Generate Valuation Sheet" type="button">
                <Icon name="picture_as_pdf" className="text-lg" />
                <span className="hidden xl:inline">Generate Stock Valuation</span>
              </button>
            </div>
          )}
        </div>
        {slot(
          slots,
          "kpis",
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase">Total Inventory Valuation</span>
                  <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-background font-bold">₦2,485,000</div>
                </div>
                <div className="p-space-xs rounded-lg bg-primary/10 text-primary">
                  <Icon name="account_balance_wallet" className="text-2xl" />
                </div>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-surface-container-high/60 flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant">6 Categories · 24 SKUs</span>
                <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-0.5"><Icon name="trending_up" className="text-xs" />+4.2% MoM</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-error font-semibold tracking-wider uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" /> Stock Out Alert</span>
                  <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-error font-bold">3 Items Critical</div>
                </div>
                <div className="p-space-xs rounded-lg bg-error-container text-on-error-container">
                  <Icon name="warning" className="text-2xl" />
                </div>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-surface-container-high/60">
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Replenish needed: <span className="font-semibold text-on-surface">Urea 46% &amp; Broiler Finisher</span></p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase">Operational Demand (7d)</span>
                  <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">94.2% Covered</div>
                </div>
                <div className="p-space-xs rounded-lg bg-secondary-container text-on-secondary-container">
                  <Icon name="event_available" className="text-2xl" />
                </div>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-surface-container-high/60 flex items-center justify-between font-body-sm text-body-sm">
                <span className="text-on-surface-variant truncate">14 Bags Urea · 18 kg Fish Feed holds</span>
                <span className="text-secondary font-semibold font-label-sm text-label-sm">Secured</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase">Compliance &amp; Expiry</span>
                  <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-secondary font-bold">100% Batches Safe</div>
                </div>
                <div className="p-space-xs rounded-lg bg-surface-container-high text-on-surface">
                  <Icon name="verified" className="text-2xl" />
                </div>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-surface-container-high/60">
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Nearest: <span className="font-semibold text-on-surface">Mancozeb #M89</span> (14 mo left)</p>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-space-md">
          {slot(
            slots,
            "locations",
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mr-1">Locations:</span>
                <button className="px-space-md py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm whitespace-nowrap" type="button">Hub Central Silo &amp; Warehouse (Iseyin)</button>
                <button className="px-space-md py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-on-surface font-label-md text-label-md shadow-sm whitespace-nowrap" type="button">Field Store 01 (Plots A &amp; B)</button>
                <button className="px-space-md py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-on-surface font-label-md text-label-md shadow-sm whitespace-nowrap flex items-center gap-1" type="button"><span className="w-2 h-2 rounded-full bg-secondary" /> Cold-Chain Bio-Cabinet (Poultry/Vet)</button>
                <button className="px-space-md py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-on-surface font-label-md text-label-md shadow-sm whitespace-nowrap" type="button">Feed Depot (Aquaculture/Pond)</button>
              </div>
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm w-fit">
                <Icon name="cloud_done" className="text-secondary text-base" />
                <span>Local Storage: 24 SKUs Sync&apos;d Offline</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-2 scrollbar-none">
            <button className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold whitespace-nowrap flex items-center gap-2" type="button">
              <span>All Items</span>
              <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm">24</span>
            </button>
            <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm" type="button">
              <span>Fertilizers &amp; Nutrition</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">6</span>
            </button>
            <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm" type="button">
              <span>Crop Protection / Agrochemicals</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">5</span>
            </button>
            <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm" type="button">
              <span>Seeds &amp; Seedlings</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">4</span>
            </button>
            <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm" type="button">
              <span>Animal Feed &amp; Nutrition</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">5</span>
            </button>
            <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm" type="button">
              <span>Veterinary &amp; Vaccines</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">2</span>
            </button>
            <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm" type="button">
              <span>Equipment Spares &amp; Fuel</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">2</span>
            </button>
          </div>
        </div>
        {slot(
          slots,
          "items",
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-surface-container-high/60">
            <div className="flex items-center gap-space-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Managed SKU Master Ledger</h2>
              <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-semibold">FIFO Tracked</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <div className="relative">
                <Icon name="filter_list" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base" />
                <input className="h-9 pl-8 pr-3 text-body-sm font-body-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-64 text-on-surface" placeholder="Filter batch, brand or chemical..." type="text" />
              </div>
              <button className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant" type="button">
                <Icon name="download" className="text-lg" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-3 px-space-md font-semibold">SKU Name &amp; Spec</th>
                  <th className="py-3 px-space-md font-semibold">Store Location</th>
                  <th className="py-3 px-space-md font-semibold">Batch / Lot #</th>
                  <th className="py-3 px-space-md font-semibold">Current Stock vs Buffer</th>
                  <th className="py-3 px-space-md font-semibold">Unit Cost</th>
                  <th className="py-3 px-space-md font-semibold">Total Value</th>
                  <th className="py-3 px-space-md font-semibold">Expiry Date</th>
                  <th className="py-3 px-space-md font-semibold">Operational Demand / Note</th>
                  <th className="py-3 px-space-md font-semibold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/40 font-body-sm text-body-sm">
                <tr className="hover:bg-surface-container-low/40 transition-colors bg-error-container/10">
                  <td className="py-3.5 px-space-md">
                    <div className="font-label-md text-label-md font-bold text-on-surface">Urea 46% N (Granular Indorama)</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Fertilizers · 50kg Bags</span>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface">Hub Central Silo</td>
                  <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">#IND-2026-04</td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-error">6 Bags</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">/ Min: 20</span>
                    </div>
                    <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-error h-full rounded-full" style={{ width: "30%" }} />
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface font-semibold">₦28,000</td>
                  <td className="py-3.5 px-space-md font-bold text-on-background">₦168,000</td>
                  <td className="py-3.5 px-space-md text-on-surface-variant">Oct 2028</td>
                  <td className="py-3.5 px-space-md">
                    <span className="px-2 py-0.5 rounded-md bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold flex items-center gap-1 w-fit"><Icon name="priority_high" className="text-xs" />Split 2 Maize Due in 48h (-14 bags)</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="px-space-sm py-1.5 rounded-lg bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-semibold hover:bg-tertiary transition-all shadow-sm" type="button">Instant Reorder</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="font-label-md text-label-md font-bold text-on-surface">NPK 15-15-15 + Zn Micro</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Golden Fertilizer · 50kg Bags</span>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface">Field Store 01</td>
                  <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">#GF-2025-99</td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-secondary">28 Bags</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">/ Min: 10</span>
                    </div>
                    <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface font-semibold">₦32,500</td>
                  <td className="py-3.5 px-space-md font-bold text-on-background">₦910,000</td>
                  <td className="py-3.5 px-space-md text-on-surface-variant">Dec 2027</td>
                  <td className="py-3.5 px-space-md">
                    <span className="text-on-surface-variant font-label-sm text-label-sm">100% Basal applied · Surplus secure</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="px-space-sm py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors" type="button">Issue Stock</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors bg-tertiary-fixed/20">
                  <td className="py-3.5 px-space-md">
                    <div className="font-label-md text-label-md font-bold text-on-surface">Copper Hydroxide 53.8%</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Fungicide · 1kg Canisters</span>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface">Hub Chemical Locker</td>
                  <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">#CH-2026-11</td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-on-tertiary-fixed-variant">12.5 kg</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">/ Min: 15.0</span>
                    </div>
                    <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-on-tertiary-container h-full rounded-full" style={{ width: "83%" }} />
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface font-semibold">₦9,200</td>
                  <td className="py-3.5 px-space-md font-bold text-on-background">₦115,000</td>
                  <td className="py-3.5 px-space-md text-on-surface-variant">Aug 2027</td>
                  <td className="py-3.5 px-space-md">
                    <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">PHI: 14 Days</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="px-space-sm py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors" type="button">Restock</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="font-label-md text-label-md font-bold text-on-surface">Mancozeb 80WP Protectant</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Crop Protection · 1kg Bags</span>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface">Hub Chemical Locker</td>
                  <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">#MN-2025-44</td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-secondary">34 kg</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">/ Min: 12</span>
                    </div>
                    <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface font-semibold">₦5,400</td>
                  <td className="py-3.5 px-space-md font-bold text-on-background">₦183,600</td>
                  <td className="py-3.5 px-space-md text-on-surface-variant">Jun 2027</td>
                  <td className="py-3.5 px-space-md">
                    <span className="px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1 w-fit"><Icon name="cloud_sync" className="text-xs text-primary" />On Weather Hold</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="px-space-sm py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors" type="button">Issue Stock</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors bg-tertiary-fixed/20">
                  <td className="py-3.5 px-space-md">
                    <div className="font-label-md text-label-md font-bold text-on-surface">Broiler Finisher 18% CP Pellets</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Animal Feed · 50kg Bags</span>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface">Poultry Feed Room</td>
                  <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">#TOP-B4-09</td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-on-tertiary-fixed-variant">8 Bags (400 kg)</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">/ Min: 12</span>
                    </div>
                    <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-on-tertiary-container h-full rounded-full" style={{ width: "66%" }} />
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface font-semibold">₦14,500</td>
                  <td className="py-3.5 px-space-md font-bold text-on-background">₦116,000</td>
                  <td className="py-3.5 px-space-md text-on-surface-variant">Jul 2026</td>
                  <td className="py-3.5 px-space-md">
                    <span className="text-error font-label-sm text-label-sm font-semibold">Daily Intake 142 kg (2.8 days left)</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="px-space-sm py-1.5 rounded-lg bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-semibold hover:bg-tertiary transition-all shadow-sm" type="button">Reorder</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="font-label-md text-label-md font-bold text-on-surface">Clarias 4mm Floating Feed</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Skretting · 15kg Sacks</span>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface">Aquaculture Store</td>
                  <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">#SK-CL-88</td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-secondary">18 Bags (270 kg)</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">/ Min: 10</span>
                    </div>
                    <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface font-semibold">₦16,200</td>
                  <td className="py-3.5 px-space-md font-bold text-on-background">₦291,600</td>
                  <td className="py-3.5 px-space-md text-on-surface-variant">Sep 2026</td>
                  <td className="py-3.5 px-space-md">
                    <span className="text-on-surface-variant font-label-sm text-label-sm">15 Days buffer available</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="px-space-sm py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors" type="button">Issue Stock</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="font-label-md text-label-md font-bold text-on-surface">Maize Seed DMR-LSR-Y Certified</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">IITA Certified · 10kg Sacks</span>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface">Hub Cold Seed Room</td>
                  <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">#IITA-MZ-02</td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-secondary">120 kg</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">/ Min: 20</span>
                    </div>
                    <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface font-semibold">₦1,800</td>
                  <td className="py-3.5 px-space-md font-bold text-on-background">₦216,000</td>
                  <td className="py-3.5 px-space-md text-on-surface-variant">Jan 2027</td>
                  <td className="py-3.5 px-space-md">
                    <span className="px-2 py-0.5 rounded-md bg-secondary-container/60 text-on-secondary-container font-label-sm text-label-sm font-semibold">Germination rate 96%</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="px-space-sm py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors" type="button">Issue Stock</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-space-md">
                    <div className="font-label-md text-label-md font-bold text-on-surface">NDV Lasota Vaccine Vials</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Vet Medicine · 1,000 Doses/vial</span>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface">Bio-Fridge (+4°C)</td>
                  <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">#NV-2026-882</td>
                  <td className="py-3.5 px-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-secondary">2 Vials</span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">/ Min: 1</span>
                    </div>
                    <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </td>
                  <td className="py-3.5 px-space-md text-on-surface font-semibold">₦4,500</td>
                  <td className="py-3.5 px-space-md font-bold text-on-background">₦9,000</td>
                  <td className="py-3.5 px-space-md text-on-surface-variant">Nov 2026</td>
                  <td className="py-3.5 px-space-md">
                    <span className="text-secondary font-label-sm text-label-sm font-semibold flex items-center gap-1"><Icon name="thermostat" className="text-xs" />Cold chain: +3.8°C</span>
                  </td>
                  <td className="py-3.5 px-space-md text-right">
                    <button className="px-space-sm py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold hover:bg-primary hover:text-on-primary transition-all" type="button">Issue to Vet</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
            <span>Showing 8 of 24 active agricultural inputs</span>
            <div className="flex items-center gap-space-xs mt-2 sm:mt-0">
              <button className="px-2.5 py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm hover:bg-surface-container" type="button">Prev</button>
              <button className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm" type="button">1</button>
              <button className="px-2.5 py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm hover:bg-surface-container" type="button">2</button>
              <button className="px-2.5 py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm hover:bg-surface-container" type="button">3</button>
              <button className="px-2.5 py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm hover:bg-surface-container" type="button">Next</button>
            </div>
          </div>
        </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {slot(
            slots,
            "movements",
            <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Stock In &amp; Stock Out Ledger</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Immutable Append-Only Audit Trail with Voucher Refs</p>
                </div>
                <Icon name="receipt_long" className="text-secondary" />
              </div>
              <div className="space-y-space-sm pt-2">
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container mt-0.5">
                      <Icon name="download" className="text-lg" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-bold text-on-surface">STOCK IN: 40 Bags NPK 15-15-15</span>
                        <span className="px-1.5 py-0.2 rounded font-mono font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant">#GRN-2026-081</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Received by <span className="font-semibold text-on-surface">Quadri Olapade</span> · Supplier: Golden Fertilizer Syndicates</p>
                      <div className="font-label-sm text-label-sm text-secondary mt-1 flex items-center gap-1"><Icon name="done_all" className="text-xs" />Physical seal verified · Batch GF-2025-99</div>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-label-md text-label-md font-bold text-secondary">+₦1,300,000</span>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">Today, 08:30 AM</div>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <div className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant mt-0.5">
                      <Icon name="upload" className="text-lg" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-bold text-on-surface">STOCK OUT: 12 Bags Urea 46%</span>
                        <span className="px-1.5 py-0.2 rounded font-mono font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant">#ISS-2026-114</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Issued to: <span className="font-semibold text-on-surface">Field Op #OP-MAIZE-204</span> (Plot B Top-Dressing) · Tractor Team Alpha</p>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1 flex items-center gap-1"><Icon name="link" className="text-xs" />Auto-deducted via Field Calendar Task Execution</div>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-label-md text-label-md font-bold text-error">-₦336,000</span>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">Yesterday, 16:15</div>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <div className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant mt-0.5">
                      <Icon name="upload" className="text-lg" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-bold text-on-surface">STOCK OUT: 4 Bags Broiler Finisher</span>
                        <span className="px-1.5 py-0.2 rounded font-mono font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant">#ISS-2026-112</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Issued to: <span className="font-semibold text-on-surface">Pen 3 Broiler Flock</span> (Day 36 Feed Roster) · Attendant: B. Adeleke</p>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1 flex items-center gap-1"><Icon name="savings" className="text-xs" />Livestock Feeding Log Synced with Farm Books</div>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-label-md text-label-md font-bold text-error">-₦58,000</span>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">2 days ago</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-md">
            <div className="space-y-space-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Automated Reconciliations</h3>
                <Icon name="sync_alt" className="text-secondary" />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Cross-module automated inventory lock, verification, and ledger balancing.</p>
            </div>
            <div className="space-y-space-sm">
              <div className="p-space-sm rounded-lg bg-surface-container-low/70 space-y-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-primary font-label-md text-label-md font-bold"><Icon name="grass" className="text-base" /> Crop Management (§3.3)</div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">14 Bags Reserved</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Urea 46% allocation locked for scheduled Maize Top-Dressing in Plot C. Depletion auto-posts to Cost of Production upon operator GPS confirmation.</p>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low/70 space-y-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-primary font-label-md text-label-md font-bold"><Icon name="pets" className="text-base" /> Livestock Management (§3.5)</div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">Real-time Feed FCR</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Broiler feed consumption linked directly to Feed Conversion Ratio calculations. Automatic reorder ticket dispatched when stock reaches 3 days of ration.</p>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low/70 space-y-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-primary font-label-md text-label-md font-bold"><Icon name="payments" className="text-base" /> Farm Books Accounting (§7.3)</div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">COGS Balanced</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">FIFO valuations continuously balance the Naira balance sheet asset column against operational expense disbursements.</p>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant font-label-md text-label-md flex items-center justify-center gap-2 transition-colors" type="button">
              <Icon name="published_with_changes" className="text-lg" />
              <span>Run Deep Discrepancy Reconciliation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
