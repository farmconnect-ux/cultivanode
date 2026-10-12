// Ported from the "farm_books_accounting" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogAction, ScreenDialogClose } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";
import { slot } from "./types";

export function FarmBooks({ lang: _lang, slots }: ScreenProps<"actions" | "kpis" | "enterprises" | "ledger">) {
  const panelModalExpense = (
    <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-xl space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="remove_circle" className="text-tertiary" />
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Log Farm Expense</h3>
          </div>
          <ScreenDialogClose><button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container" type="button">
              <Icon name="close" />
            </button></ScreenDialogClose>
        </div>
        <div className="space-y-space-sm">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Expense Category</label>
            <select className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none">
              <option>Machinery Hire / Diesel</option>
              <option>Seeds &amp; Planting Materials</option>
              <option>Fertilizer &amp; Agrochemicals</option>
              <option>Manual Farm Labour</option>
              <option>Veterinary &amp; Animal Feed</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Field / Enterprise</label>
              <select className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none">
                <option>Plot A1 &amp; A2 (Maize)</option>
                <option>Plot B2 (Cassava)</option>
                <option>Plot B1 (Tomato)</option>
                <option>Poultry House 1</option>
                <option>Catfish Pond P2</option>
              </select>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Amount (₦)</label>
              <input className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none" placeholder="50,000" type="number" />
            </div>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Payee / Supplier Name</label>
            <input className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none" placeholder="e.g. Alaba Agrochemicals" type="text" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <ScreenDialogClose><button className="px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">Cancel</button></ScreenDialogClose>
          <ScreenDialogAction><button className="px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container" type="button">Save to Ledger</button></ScreenDialogAction>
        </div>
      </div>
  );
  const panelModalIncome = (
    <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-xl space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="add_circle" className="text-secondary" />
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Record Farm Income / Sale</h3>
          </div>
          <ScreenDialogClose><button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container" type="button">
              <Icon name="close" />
            </button></ScreenDialogClose>
        </div>
        <div className="space-y-space-sm">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Enterprise Source</label>
            <select className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none">
              <option>Plot B1 · Tomato Harvest</option>
              <option>Plot A1 &amp; A2 · Maize Grains</option>
              <option>Plot B2 · Cassava Tubers</option>
              <option>Poultry House 1 · Broiler Off-take</option>
              <option>Catfish Pond P2 · Harvest</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Quantity / Volume</label>
              <input className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none" placeholder="e.g. 50 Crates / 2.5 MT" type="text" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1">Realized Value (₦)</label>
              <input className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none" placeholder="250,000" type="number" />
            </div>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Buyer / Off-taker</label>
            <input className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none" placeholder="e.g. Mile 12 Distributor" type="text" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <ScreenDialogClose><button className="px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">Cancel</button></ScreenDialogClose>
          <ScreenDialogAction><button className="px-space-md py-space-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:bg-primary" type="button">Post Revenue</button></ScreenDialogAction>
        </div>
      </div>
  );
  const panelModalReconcile = (
    <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-xl space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="receipt_long" className="text-primary" />
            <h3 className="font-headline-md text-headline-md text-primary font-bold">Reconcile Cash / Bank Slip</h3>
          </div>
          <ScreenDialogClose><button className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container" type="button">
              <Icon name="close" />
            </button></ScreenDialogClose>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Upload physical receipts, POS slips, or bank transfer screenshots to promote self-reported entries into verified audit-ready status.</p>
        <div className="space-y-space-sm">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Target Transaction</label>
            <select className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none">
              <option>#TXN-2026-0612 · TopFeeds Depot (₦185,000)</option>
              <option>#TXN-2026-0520 · AquaLife Hatcheries (₦45,000)</option>
            </select>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1">Upload Receipt / Slip Photo</label>
            <div className="border-2 border-dashed border-surface-container-high rounded-xl p-6 text-center bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors">
              <Icon name="cloud_upload" className="text-3xl text-secondary" />
              <p className="font-label-md text-label-md text-on-surface mt-2 font-semibold">Drop receipt image or click to browse</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">JPEG, PNG, or PDF up to 10MB</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <ScreenDialogClose><button className="px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">Cancel</button></ScreenDialogClose>
          <button className="px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container" type="button">Corroborate Entry</button>
        </div>
      </div>
  );
  const panelModalReceiptViewer = (
    <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl space-y-space-md text-center">
        <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto">
          <Icon name="verified" className="text-2xl" />
        </div>
        <div>
          <h4 className="font-headline-sm text-headline-sm text-primary font-bold" id="receiptViewerId">Transaction Record</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1" id="receiptViewerTitle">Proof Document</p>
          <div className="font-metric-num text-metric-num text-on-surface font-bold mt-2" id="receiptViewerAmount">₦0</div>
        </div>
        <div className="bg-surface-container p-4 rounded-lg text-left text-xs font-mono space-y-1 text-on-surface">
          <div><strong>Hash:</strong> 0x9f83a...41bc78</div>
          <div><strong>PowerSync Sync ID:</strong> OYO-ISE-8829</div>
          <div><strong>Status:</strong> Sealed &amp; Corroborated</div>
        </div>
        <ScreenDialogClose><button className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md" type="button">Close Audit Record</button></ScreenDialogClose>
      </div>
  );
  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16 space-y-space-lg">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider font-bold">Early Rains 2026 Season</span>
              <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1"><Icon name="verified_user" className="text-sm text-secondary" /> Audited Micro-Ledger Active</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">Farm Books &amp; Enterprise Margins</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Real-time append-only accounting ledger for Iseyin Cluster. Tracks mechanized field works, farm inputs, and farmgate harvests with GPS telemetry reconciliation.</p>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog title="Log Farm Expense" side="center" panel={panelModalExpense}>
                <button className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container transition-all" type="button">
                  <Icon name="add_card" className="text-base text-secondary" />
                  <span>Log Farm Expense</span>
                </button>
              </ScreenDialog>
              <ScreenDialog title="Record Farm Income / Sale" side="center" panel={panelModalIncome}>
                <button className="flex items-center gap-space-xs px-space-md py-space-sm bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary-container transition-all" type="button">
                  <Icon name="point_of_sale" className="text-base" />
                  <span>Record Income / Sale</span>
                </button>
              </ScreenDialog>
              <div className="relative inline-block text-left">
                <button className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-lowest border-0 text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container-low transition-all" id="exportDropdownBtn" type="button">
                  <Icon name="download" className="text-base text-secondary" />
                  <span>Audit Export</span>
                  <Icon name="expand_more" className="text-sm" />
                </button>
                <div className="hidden absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-lg shadow-xl z-30 py-1" id="exportDropdownMenu">
                  <a className="flex items-center gap-2 px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container" href="/api/account/export" download><Icon name="picture_as_pdf" className="text-base text-error" /> PDF Financial Summary</a>
                  <a className="flex items-center gap-2 px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container" href="/api/account/export" download><Icon name="table_view" className="text-base text-secondary" /> Excel / CSV Full Ledger</a>
                  <a className="flex items-center gap-2 px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container" href="/api/account/export" download><Icon name="receipt_long" className="text-base text-tertiary" /> Tax Audit Pack (FIRS/Oyo)</a>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bg-surface-container p-space-md rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-sm">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 text-on-secondary-container">
              <Icon name="handshake" />
            </div>
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">Pilot Zero-Commission Policy</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold">0% Platform Fee</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">All equipment hires &amp; farm inputs settle directly between farmer and service syndicate. Entries marked <strong className="text-on-surface">Verified Proof-of-Work</strong> are cryptographically sealed with PowerSync GPS logs.</p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest rounded-lg font-label-sm text-label-sm text-on-surface shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Verified: 18 entries</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest rounded-lg font-label-sm text-label-sm text-tertiary shadow-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
              <span>Self-Reported: 4 entries</span>
            </div>
          </div>
        </div>
        {slot(
          slots,
          "kpis",
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Gross Season Revenue</span>
                <div className="p-2 rounded-lg bg-surface-container text-secondary">
                  <Icon name="trending_up" />
                </div>
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-primary font-bold">₦4,850,000</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-body-sm text-body-sm text-secondary font-semibold">₦1,920,000 Realized</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">(39.6% off-take)</span>
                </div>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: "39.6%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Total Operating OPEX</span>
                <div className="p-2 rounded-lg bg-surface-container text-tertiary">
                  <Icon name="account_balance_wallet" />
                </div>
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-on-surface font-bold">₦1,240,000</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Cap: ₦1,800,000 seasonal limit</span>
                </div>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Budget Burn</span>
                <span className="font-semibold text-secondary">68.8% Deployed</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Net Operating Margin</span>
                <div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container">
                  <Icon name="percent" />
                </div>
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-secondary font-bold">61.4%</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold">₦2,430,000</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Est. Profit</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-label-sm text-label-sm text-secondary font-medium">
                <Icon name="arrow_upward" className="text-sm" />
                <span>+8.2% vs. Last Season Cohort</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Ledger Integrity</span>
                <div className="p-2 rounded-lg bg-surface-container text-primary">
                  <Icon name="gavel" />
                </div>
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-on-surface font-bold">81.8%</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">18 Verified / 22 Total Entries</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center gap-1"><Icon name="pending" className="text-xs" /> 4 pending slips</span>
                <button className="font-label-sm text-label-sm text-secondary hover:underline" type="button">View logs →</button>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          {slot(
            slots,
            "enterprises",
            <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Enterprise &amp; Field Profitability</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Gross margin contribution segregated by arable plot &amp; livestock unit</p>
              </div>
              <span className="px-space-sm py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-medium">5 Monitored Units</span>
            </div>
            <div className="space-y-space-sm">
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                    <Icon name="grain" className="text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">Plot A1 &amp; A2 · Hybrid Maize</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary-container text-on-secondary-container">18.0 Ha</span>
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <span>Unit Cost: <strong className="text-on-surface">₦23,333/Ha</strong></span>
                      <span>•</span>
                      <span>Cost: ₦420,000</span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:flex flex-col items-end">
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">₦1,280,000</span>
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                    <span>Net: <strong className="text-primary">+₦860,000</strong></span>
                    <span className="text-secondary font-bold">(67.2%)</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                    <Icon name="spa" className="text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">Plot B2 · TME 419 Cassava</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface">14.5 Ha</span>
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <span>Stems &amp; Ridging Cost: ₦310,000</span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:flex flex-col items-end">
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">₦1,650,000</span>
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                    <span>Net: <strong className="text-primary">+₦1,340,000</strong></span>
                    <span className="text-secondary font-bold">(81.2%)</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary shadow-sm flex-shrink-0">
                    <Icon name="nutrition" className="text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">Plot B1 · Cobra F1 Tomato</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface">5.0 Ha</span>
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <span>Drip &amp; Trellising Cost: ₦280,000</span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:flex flex-col items-end">
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">₦920,000</span>
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                    <span>Net: <strong className="text-primary">+₦640,000</strong></span>
                    <span className="text-secondary font-bold">(69.5%)</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                    <Icon name="egg" className="text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">Poultry House 1 · Broiler Batch B4</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface">1,000 Birds</span>
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <span>Feed &amp; Vet Cost: ₦185,000</span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:flex flex-col items-end">
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">₦680,000</span>
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                    <span>Net: <strong className="text-primary">+₦495,000</strong></span>
                    <span className="text-secondary font-bold">(72.8%)</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                    <Icon name="set_meal" className="text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">Catfish Pond P2 · Clarias Growout</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface">2,500 Juveniles</span>
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <span>Feed &amp; Probiotics Cost: ₦45,000</span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:flex flex-col items-end">
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">₦320,000</span>
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                    <span>Net: <strong className="text-primary">+₦275,000</strong></span>
                    <span className="text-secondary font-bold">(85.9%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Budget vs. Actual OPEX</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Early Rains allocation variance</p>
                </div>
                <Icon name="analytics" className="text-secondary" />
              </div>
              <div className="flex items-center justify-around py-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                    <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="42, 100" strokeLinecap="round" strokeWidth="3.5" />
                    <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="31, 100" strokeDashoffset="-42" strokeWidth="3.5" />
                    <path className="text-tertiary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="27, 100" strokeDashoffset="-73" strokeWidth="3.5" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">₦1.24M</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Spent</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-space-xs font-body-sm text-body-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-on-surface">Machinery &amp; Fleet (42%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-secondary flex-shrink-0" />
                    <span className="text-on-surface">Seeds &amp; Fertilizer (31%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-tertiary flex-shrink-0" />
                    <span className="text-on-surface">Labour &amp; Logistics (27%)</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container p-space-sm rounded-lg flex items-center justify-between text-on-surface font-body-sm text-body-sm">
                <span>Remaining Allocated Buffer:</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">₦560,000</span>
              </div>
            </div>
            <div className="relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group">
              <img className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" data-alt="West African agricultural landscape in Oyo State Nigeria with John Deere tractor ploughing rich dark soil on Plot A1, captured under bright morning sunlight, showing precision farm lines and verdant forest backdrop" src="/images/screens/f93488b6a302.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent p-space-md flex flex-col justify-end text-on-primary">
                <div className="flex items-center gap-space-xs">
                  <Icon name="satellite_alt" className="text-sm text-secondary-fixed" />
                  <span className="font-label-sm text-label-sm text-secondary-fixed font-bold uppercase tracking-wider">Telemetric Proof of Work</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold">18 Ha Mechanized Tillage Complete</span>
                <p className="font-body-sm text-body-sm text-surface-variant text-opacity-90 mt-0.5">Automated timestamp matched with payment ref TXN-2026-0881.</p>
              </div>
            </div>
          </div>
        </div>
        {slot(
          slots,
          "ledger",
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col space-y-space-md" id="ledger-section">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-space-xs">
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Append-Only Transaction Ledger</h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-bold">22 Records</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Immutable double-entry book balancing cash, bank slip, and direct syndication records.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <div className="bg-surface-container px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Icon name="filter_alt" className="text-sm text-on-surface-variant" />
                <select className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none" id="enterpriseFilter">
                  <option value="ALL">All Enterprises</option>
                  <option value="Plot A1 & A2">Plot A1 &amp; A2 (Maize)</option>
                  <option value="Plot B2">Plot B2 (Cassava)</option>
                  <option value="Plot B1">Plot B1 (Tomato)</option>
                  <option value="Poultry">Poultry House 1</option>
                  <option value="Catfish">Catfish Pond P2</option>
                </select>
              </div>
              <div className="bg-surface-container px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Icon name="verified" className="text-sm text-on-surface-variant" />
                <select className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none" id="verificationFilter">
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified Proof-of-Work</option>
                  <option value="SELF">Self-Reported</option>
                </select>
              </div>
              <ScreenDialog title="Reconcile Cash / Bank Slip" side="center" panel={panelModalReconcile}>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container text-on-surface rounded-lg font-label-sm text-label-sm transition-colors" type="button">
                  <Icon name="receipt_long" className="text-sm text-secondary" />
                  <span>Reconcile Slip</span>
                </button>
              </ScreenDialog>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-lg">Date &amp; ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Field / Enterprise</th>
                  <th className="py-3 px-4">Payee / Counterparty</th>
                  <th className="py-3 px-4 text-right">Amount (₦)</th>
                  <th className="py-3 px-4 text-center">Verification Tier</th>
                  <th className="py-3 px-4 text-center rounded-r-lg">Proof / Action</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y-0" id="ledgerBody">
                <tr className="ledger-row bg-surface-container-lowest hover:bg-surface-container-low transition-colors" data-enterprise="Plot B1" data-status="VERIFIED">
                  <td className="py-3.5 px-4">
                    <div className="font-label-md text-label-md font-bold text-on-surface">12 May 2026</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">#TXN-2026-1042</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Harvest Sale</span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface font-medium">Plot B1 · Tomato (200 Crates)</td>
                  <td className="py-3.5 px-4 text-on-surface">Mile 12 Bulk Buyer Off-taker</td>
                  <td className="py-3.5 px-4 text-right font-headline-sm text-headline-sm text-secondary font-bold">+₦920,000</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Verified Proof-of-Work</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <ScreenDialog title="Transaction Record" side="center" panel={panelModalReceiptViewer}>
                      <button className="text-secondary hover:underline flex items-center justify-center mx-auto gap-1 font-label-sm text-label-sm" type="button"><Icon name="attachment" className="text-sm" /> Waybill</button>
                    </ScreenDialog>
                  </td>
                </tr>
                <tr className="ledger-row bg-surface-container-low/40 hover:bg-surface-container-low transition-colors" data-enterprise="Plot A1 & A2" data-status="VERIFIED">
                  <td className="py-3.5 px-4">
                    <div className="font-label-md text-label-md font-bold text-on-surface">09 May 2026</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">#TXN-2026-0881</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-surface-container text-primary font-label-sm text-label-sm font-semibold">Machinery Hire</span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface font-medium">Plot A1 &amp; A2 · Maize Harrowing</td>
                  <td className="py-3.5 px-4 text-on-surface">Oyo Agro-Mechanized Syndicate</td>
                  <td className="py-3.5 px-4 text-right font-headline-sm text-headline-sm text-error font-bold">-₦420,000</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Verified (GPS Teledata)</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <ScreenDialog title="Transaction Record" side="center" panel={panelModalReceiptViewer}>
                      <button className="text-secondary hover:underline flex items-center justify-center mx-auto gap-1 font-label-sm text-label-sm" type="button"><Icon name="satellite_alt" className="text-sm" /> GPS Log</button>
                    </ScreenDialog>
                  </td>
                </tr>
                <tr className="ledger-row bg-surface-container-lowest hover:bg-surface-container-low transition-colors" data-enterprise="Plot B2" data-status="VERIFIED">
                  <td className="py-3.5 px-4">
                    <div className="font-label-md text-label-md font-bold text-on-surface">04 May 2026</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">#TXN-2026-0749</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-surface-container text-tertiary font-label-sm text-label-sm font-semibold">Seed / Planting Stock</span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface font-medium">Plot B2 · Cassava Cuttings</td>
                  <td className="py-3.5 px-4 text-on-surface">IITA Certified Seed Producers</td>
                  <td className="py-3.5 px-4 text-right font-headline-sm text-headline-sm text-error font-bold">-₦310,000</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Verified Proof-of-Work</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <ScreenDialog title="Transaction Record" side="center" panel={panelModalReceiptViewer}>
                      <button className="text-secondary hover:underline flex items-center justify-center mx-auto gap-1 font-label-sm text-label-sm" type="button"><Icon name="receipt" className="text-sm" /> Invoice</button>
                    </ScreenDialog>
                  </td>
                </tr>
                <tr className="ledger-row bg-surface-container-low/40 hover:bg-surface-container-low transition-colors" data-enterprise="Poultry" data-status="SELF">
                  <td className="py-3.5 px-4">
                    <div className="font-label-md text-label-md font-bold text-on-surface">01 May 2026</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">#TXN-2026-0612</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-surface-container text-primary font-label-sm text-label-sm font-semibold">Feed &amp; Veterinary</span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface font-medium">Poultry House 1 · Broilers</td>
                  <td className="py-3.5 px-4 text-on-surface">TopFeeds Depot Iseyin</td>
                  <td className="py-3.5 px-4 text-right font-headline-sm text-headline-sm text-error font-bold">-₦185,000</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/20 text-tertiary font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-tertiary" /> Self-Reported Entry</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <ScreenDialog title="Transaction Record" side="center" panel={panelModalReceiptViewer}>
                      <button className="text-tertiary hover:underline flex items-center justify-center mx-auto gap-1 font-label-sm text-label-sm" type="button"><Icon name="image" className="text-sm" /> Slip Image</button>
                    </ScreenDialog>
                  </td>
                </tr>
                <tr className="ledger-row bg-surface-container-lowest hover:bg-surface-container-low transition-colors" data-enterprise="Catfish" data-status="SELF">
                  <td className="py-3.5 px-4">
                    <div className="font-label-md text-label-md font-bold text-on-surface">28 Apr 2026</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">#TXN-2026-0520</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-surface-container text-tertiary font-label-sm text-label-sm font-semibold">Livestock Stocking</span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface font-medium">Catfish Pond P2</td>
                  <td className="py-3.5 px-4 text-on-surface">AquaLife Hatcheries Ltd</td>
                  <td className="py-3.5 px-4 text-right font-headline-sm text-headline-sm text-error font-bold">-₦45,000</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/20 text-tertiary font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-tertiary" /> Self-Reported Entry</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <ScreenDialog title="Transaction Record" side="center" panel={panelModalReceiptViewer}>
                      <button className="text-tertiary hover:underline flex items-center justify-center mx-auto gap-1 font-label-sm text-label-sm" type="button"><Icon name="receipt_long" className="text-sm" /> Transfer Slip</button>
                    </ScreenDialog>
                  </td>
                </tr>
                <tr className="ledger-row bg-surface-container-low/40 hover:bg-surface-container-low transition-colors" data-enterprise="Plot A1 & A2" data-status="VERIFIED">
                  <td className="py-3.5 px-4">
                    <div className="font-label-md text-label-md font-bold text-on-surface">25 Apr 2026</div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">#TXN-2026-0487</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Forward Advance</span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface font-medium">Plot A1 &amp; A2 · Maize Forward</td>
                  <td className="py-3.5 px-4 text-on-surface">Premier Feed Mills Nigeria</td>
                  <td className="py-3.5 px-4 text-right font-headline-sm text-headline-sm text-secondary font-bold">+₦1,000,000</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Verified Proof-of-Work</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <ScreenDialog title="Transaction Record" side="center" panel={panelModalReceiptViewer}>
                      <button className="text-secondary hover:underline flex items-center justify-center mx-auto gap-1 font-label-sm text-label-sm" type="button"><Icon name="description" className="text-sm" /> Contract Doc</button>
                    </ScreenDialog>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-sm font-body-sm text-body-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Icon name="lock" className="text-sm text-secondary" />
              <span>Cryptographically verified on SQLite (PowerSync local node). Last synced: 4 mins ago.</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <button className="px-3 py-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold" type="button">Previous</button>
              <button className="px-3 py-1 rounded bg-primary text-on-primary text-xs font-semibold" type="button">1</button>
              <button className="px-3 py-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold" type="button">2</button>
              <button className="px-3 py-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold" type="button">Next</button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
