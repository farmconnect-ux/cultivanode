"use client";

// Ported from the "farm_books_accounting" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogAction, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

interface LedgerEntry {
  id: string;
  date: string;
  category: string;
  enterprise: string;
  counterparty: string;
  amount: number;
  type: "income" | "expense";
  status: "VERIFIED" | "SELF";
  proofType: string;
  proofLabel: string;
  proofIcon: string;
  hash: string;
}

const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: "TXN-2026-1042",
    date: "12 May 2026",
    category: "Harvest Sale",
    enterprise: "Plot B1 · Tomato (200 Crates)",
    counterparty: "Mile 12 Bulk Buyer Off-taker",
    amount: 920000,
    type: "income",
    status: "VERIFIED",
    proofType: "waybill",
    proofLabel: "Waybill",
    proofIcon: "attachment",
    hash: "0x8f2a1...44bc91",
  },
  {
    id: "TXN-2026-0881",
    date: "09 May 2026",
    category: "Machinery Hire",
    enterprise: "Plot A1 & A2 · Maize Harrowing",
    counterparty: "Oyo Agro-Mechanized Syndicate",
    amount: 420000,
    type: "expense",
    status: "VERIFIED",
    proofType: "gps",
    proofLabel: "GPS Log",
    proofIcon: "satellite_alt",
    hash: "0x9f83a...41bc78",
  },
  {
    id: "TXN-2026-0749",
    date: "04 May 2026",
    category: "Seed / Planting Stock",
    enterprise: "Plot B2 · Cassava Cuttings",
    counterparty: "IITA Certified Seed Producers",
    amount: 310000,
    type: "expense",
    status: "VERIFIED",
    proofType: "invoice",
    proofLabel: "Invoice",
    proofIcon: "receipt",
    hash: "0x1b72e...99ad45",
  },
  {
    id: "TXN-2026-0612",
    date: "01 May 2026",
    category: "Feed & Veterinary",
    enterprise: "Poultry House 1 · Broilers",
    counterparty: "TopFeeds Depot Iseyin",
    amount: 185000,
    type: "expense",
    status: "SELF",
    proofType: "slip",
    proofLabel: "Slip Image",
    proofIcon: "image",
    hash: "0x33cf8...01ea12",
  },
  {
    id: "TXN-2026-0520",
    date: "28 Apr 2026",
    category: "Livestock Stocking",
    enterprise: "Catfish Pond P2",
    counterparty: "AquaLife Hatcheries Ltd",
    amount: 45000,
    type: "expense",
    status: "SELF",
    proofType: "transfer",
    proofLabel: "Transfer Slip",
    proofIcon: "receipt_long",
    hash: "0x66de2...fe5590",
  },
  {
    id: "TXN-2026-0487",
    date: "25 Apr 2026",
    category: "Forward Advance",
    enterprise: "Plot A1 & A2 · Maize Forward",
    counterparty: "Premier Feed Mills Nigeria",
    amount: 1000000,
    type: "income",
    status: "VERIFIED",
    proofType: "contract",
    proofLabel: "Contract Doc",
    proofIcon: "description",
    hash: "0x77ae9...88cd31",
  },
];

export function FarmBooks({ lang: _lang, slots }: ScreenProps<"actions" | "kpis" | "enterprises" | "ledger">) {
  const [ledger, setLedger] = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [enterpriseFilter, setEnterpriseFilter] = useState("ALL");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<LedgerEntry | null>(INITIAL_LEDGER[0]);
  const [page, setPage] = useState(1);

  // Form states for Expense
  const [expCategory, setExpCategory] = useState("Machinery Hire / Diesel");
  const [expEnterprise, setExpEnterprise] = useState("Plot A1 & A2 (Maize)");
  const [expAmount, setExpAmount] = useState("50000");
  const [expPayee, setExpPayee] = useState("");

  // Form states for Income
  const [incSource, setIncSource] = useState("Plot B1 · Tomato Harvest");
  const [incQty, setIncQty] = useState("50 Crates");
  const [incAmount, setIncAmount] = useState("250000");
  const [incBuyer, setIncBuyer] = useState("");

  // Filtered rows
  const filteredLedger = ledger.filter((entry) => {
    if (enterpriseFilter !== "ALL") {
      if (enterpriseFilter === "Plot A1 & A2" && !entry.enterprise.includes("Plot A1")) return false;
      if (enterpriseFilter === "Plot B2" && !entry.enterprise.includes("Plot B2")) return false;
      if (enterpriseFilter === "Plot B1" && !entry.enterprise.includes("Plot B1")) return false;
      if (enterpriseFilter === "Poultry" && !entry.enterprise.includes("Poultry")) return false;
      if (enterpriseFilter === "Catfish" && !entry.enterprise.includes("Catfish")) return false;
    }
    if (verificationFilter !== "ALL" && entry.status !== verificationFilter) {
      return false;
    }
    return true;
  });

  const handleAddExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(expAmount) || 0;
    if (num <= 0) return;
    const newEntry: LedgerEntry = {
      id: `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      category: expCategory,
      enterprise: expEnterprise,
      counterparty: expPayee || "Local Agro Supplier",
      amount: num,
      type: "expense",
      status: "SELF",
      proofType: "slip",
      proofLabel: "Receipt Slip",
      proofIcon: "receipt",
      hash: `0x${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 8)}`,
    };
    setLedger([newEntry, ...ledger]);
    setExpPayee("");
    showScreenToast(`Expense of ₦${num.toLocaleString()} logged into Micro-Ledger!`);
  };

  const handleAddIncome = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(incAmount) || 0;
    if (num <= 0) return;
    const newEntry: LedgerEntry = {
      id: `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      category: "Harvest Sale",
      enterprise: `${incSource} (${incQty})`,
      counterparty: incBuyer || "Farmgate Off-taker",
      amount: num,
      type: "income",
      status: "VERIFIED",
      proofType: "waybill",
      proofLabel: "Waybill",
      proofIcon: "attachment",
      hash: `0x${Math.random().toString(16).slice(2, 8)}...${Math.random().toString(16).slice(2, 8)}`,
    };
    setLedger([newEntry, ...ledger]);
    setIncBuyer("");
    showScreenToast(`Revenue of ₦${num.toLocaleString()} posted to Farm Books!`);
  };

  const handleReconcileSlip = (targetId: string) => {
    setLedger((prev) =>
      prev.map((entry) => {
        if (entry.id === targetId || entry.status === "SELF") {
          return {
            ...entry,
            status: "VERIFIED",
            proofLabel: "Reconciled Slip",
            proofIcon: "verified",
          };
        }
        return entry;
      })
    );
    showScreenToast("Cash slip corroborated and promoted to Verified Proof-of-Work!");
  };

  const handleExportCSV = () => {
    setExportDropdownOpen(false);
    const header = "Date,Transaction ID,Category,Enterprise,Counterparty,Type,Amount (NGN),Status,Audit Hash\n";
    const rows = ledger
      .map(
        (l) =>
          `"${l.date}","${l.id}","${l.category}","${l.enterprise}","${l.counterparty}","${l.type}","${l.amount}","${l.status}","${l.hash}"`
      )
      .join("\n");
    downloadFile(header + rows, `CultivaNode-FarmBooks-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showScreenToast("Excel/CSV Full Ledger downloaded successfully.");
  };

  const handleExportPDF = () => {
    setExportDropdownOpen(false);
    const summary = `CULTIVANODE FARM BOOKS - FINANCIAL SUMMARY
Season: Early Rains 2026
Cluster: Iseyin Farm Hub (Oyo State)
Date: ${new Date().toLocaleDateString()}

GROSS REVENUE: N4,850,000 (Realized: N1,920,000)
TOTAL OPEX: N1,240,000
NET OPERATING PROFIT: N3,610,000
MARGIN: 74.4%

ENTERPRISE BREAKDOWN:
- Plot A1 & A2 (Hybrid Maize, 18 Ha): Net +N860,000 (67.2%)
- Plot B2 (Cassava, 14.5 Ha): Net +N1,340,000 (81.2%)
- Plot B1 (Tomato, 5 Ha): Net +N640,000 (69.5%)
- Poultry House 1 (Broilers, 1,000 birds): Net +N495,000 (72.8%)
- Catfish Pond P2 (Clarias, 2,500 Juveniles): Net +N275,000 (85.9%)

Cryptographically certified on local PowerSync SQLite engine.
`;
    downloadFile(summary, `CultivaNode-Financial-Summary-${new Date().toISOString().slice(0, 10)}.txt`, "text/plain");
    showScreenToast("PDF Financial Summary dossier downloaded.");
  };

  const handleExportTaxPack = () => {
    setExportDropdownOpen(false);
    const taxPack = `FEDERAL INLAND REVENUE SERVICE (FIRS) / OYO STATE INTERNAL REVENUE SERVICE (OYIRS)
AGRICULTURAL ENTERPRISE TAX AUDIT PACK
Cluster TIN: NG-AG-2026-990142
Farmer: Quadri Olapade
Season: 2026 Early Rains Assessment

1. Agricultural Withholding Exemption Status: Valid under Pioneer Agri-Scheme
2. Capital Input Purchases (independently corroborated): N1,240,000
3. Primary Produce Sales: N4,850,000
4. Verifiable Proof-of-Work Ratio: 81.8%
5. Machine Telemetry CANBus Records Attached: 18 logs

Hash: 0x9f83a64789bfe12401cd99
Verification Node: OYO-ISE-8829
`;
    downloadFile(taxPack, `FIRS-Tax-Audit-Pack-${new Date().toISOString().slice(0, 10)}.txt`, "text/plain");
    showScreenToast("Tax Audit Pack downloaded successfully.");
  };

  const panelModalExpense = (
    <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="remove_circle" className="text-tertiary" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">Log Farm Expense</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <form onSubmit={handleAddExpense} className="space-y-space-sm text-left">
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Expense Category</label>
          <select
            value={expCategory}
            onChange={(e) => setExpCategory(e.target.value)}
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          >
            <option>Machinery Hire / Diesel</option>
            <option>Seeds &amp; Planting Materials</option>
            <option>Fertilizer &amp; Agrochemicals</option>
            <option>Manual Farm Labour</option>
            <option>Veterinary &amp; Animal Feed</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Field / Enterprise</label>
            <select
              value={expEnterprise}
              onChange={(e) => setExpEnterprise(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            >
              <option>Plot A1 &amp; A2 (Maize)</option>
              <option>Plot B2 (Cassava)</option>
              <option>Plot B1 (Tomato)</option>
              <option>Poultry House 1</option>
              <option>Catfish Pond P2</option>
            </select>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Amount (₦)</label>
            <input
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
              placeholder="50,000"
              type="number"
              required
            />
          </div>
        </div>
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Payee / Supplier Name</label>
          <input
            value={expPayee}
            onChange={(e) => setExpPayee(e.target.value)}
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            placeholder="e.g. Alaba Agrochemicals"
            type="text"
            required
          />
        </div>
        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button
              onClick={handleAddExpense}
              className="px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container font-semibold"
              type="button"
            >
              Save to Ledger
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const panelModalIncome = (
    <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="add_circle" className="text-secondary" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">Record Farm Income / Sale</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <form onSubmit={handleAddIncome} className="space-y-space-sm text-left">
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Enterprise Source</label>
          <select
            value={incSource}
            onChange={(e) => setIncSource(e.target.value)}
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
          >
            <option>Plot B1 · Tomato Harvest</option>
            <option>Plot A1 &amp; A2 · Maize Grains</option>
            <option>Plot B2 · Cassava Tubers</option>
            <option>Poultry House 1 · Broiler Off-take</option>
            <option>Catfish Pond P2 · Harvest</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Quantity / Volume</label>
            <input
              value={incQty}
              onChange={(e) => setIncQty(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
              placeholder="e.g. 50 Crates / 2.5 MT"
              type="text"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Realized Value (₦)</label>
            <input
              value={incAmount}
              onChange={(e) => setIncAmount(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
              placeholder="250,000"
              type="number"
              required
            />
          </div>
        </div>
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Buyer / Off-taker</label>
          <input
            value={incBuyer}
            onChange={(e) => setIncBuyer(e.target.value)}
            className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
            placeholder="e.g. Mile 12 Distributor"
            type="text"
            required
          />
        </div>
        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button
              onClick={handleAddIncome}
              className="px-space-md py-space-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:bg-primary font-semibold"
              type="button"
            >
              Post Revenue
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const panelModalReconcile = (
    <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-xl space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="receipt_long" className="text-primary" />
          <h3 className="font-headline-md text-headline-md text-primary font-bold">Reconcile Cash / Bank Slip</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Upload physical receipts, POS slips, or bank transfer screenshots to promote self-reported entries into verified audit-ready status.
      </p>
      <div className="space-y-space-sm text-left">
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Target Transaction</label>
          <select className="w-full h-10 px-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none">
            {ledger
              .filter((l) => l.status === "SELF")
              .map((l) => (
                <option key={l.id} value={l.id}>
                  #{l.id} · {l.counterparty} (₦{l.amount.toLocaleString()})
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Upload Receipt / Slip Photo</label>
          <div
            onClick={() => showScreenToast("Image selected: pos_receipt_may2026.png (1.2 MB)")}
            className="border-2 border-dashed border-surface-container-high rounded-xl p-6 text-center bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors"
          >
            <Icon name="cloud_upload" className="text-3xl text-secondary" />
            <p className="font-label-md text-label-md text-on-surface mt-2 font-semibold">Drop receipt image or click to browse</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">JPEG, PNG, or PDF up to 10MB</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-space-sm pt-space-xs">
        <ScreenDialogClose>
          <button onClick={() => {}} className="px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
            Cancel
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button
            onClick={() => handleReconcileSlip("TXN-2026-0612")}
            className="px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container font-semibold"
            type="button"
          >
            Corroborate Entry
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const panelModalReceiptViewer = (
    <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl space-y-space-md text-center">
      <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto">
        <Icon name="verified" className="text-2xl" />
      </div>
      <div>
        <h4 className="font-headline-sm text-headline-sm text-primary font-bold">
          {selectedTxn?.id ?? "Transaction Record"}
        </h4>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          {selectedTxn?.enterprise ?? "Proof Document"}
        </p>
        <div className="font-metric-num text-metric-num text-on-surface font-bold mt-2">
          ₦{selectedTxn?.amount.toLocaleString() ?? "0"}
        </div>
      </div>
      <div className="bg-surface-container p-4 rounded-lg text-left text-xs font-mono space-y-1 text-on-surface">
        <div><strong>Counterparty:</strong> {selectedTxn?.counterparty}</div>
        <div><strong>Hash:</strong> {selectedTxn?.hash ?? "0x9f83a...41bc78"}</div>
        <div><strong>PowerSync Sync ID:</strong> OYO-ISE-8829</div>
        <div><strong>Status:</strong> {selectedTxn?.status === "VERIFIED" ? "Sealed & Corroborated" : "Self-Reported Entry"}</div>
      </div>
      <ScreenDialogClose>
        <button onClick={() => {}} className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="button">
          Close Audit Record
        </button>
      </ScreenDialogClose>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16 space-y-space-lg">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider font-bold">
                Early Rains 2026 Season
              </span>
              <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1">
                <Icon name="verified_user" className="text-sm text-secondary" /> Audited Micro-Ledger Active
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">
              Farm Books &amp; Enterprise Margins
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Real-time append-only accounting ledger for Iseyin Cluster. Tracks mechanized field works, farm inputs, and farmgate harvests with GPS telemetry reconciliation.
            </p>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex flex-wrap items-center gap-space-sm">
              <ScreenDialog title="Log Farm Expense" side="center" panel={panelModalExpense}>
                <button onClick={() => {}} className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-high text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container transition-all" type="button">
                  <Icon name="add_card" className="text-base text-secondary" />
                  <span>Log Farm Expense</span>
                </button>
              </ScreenDialog>
              <ScreenDialog title="Record Farm Income / Sale" side="center" panel={panelModalIncome}>
                <button onClick={() => {}} className="flex items-center gap-space-xs px-space-md py-space-sm bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary-container transition-all" type="button">
                  <Icon name="point_of_sale" className="text-base" />
                  <span>Record Income / Sale</span>
                </button>
              </ScreenDialog>
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-lowest border-0 text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container-low transition-all font-semibold"
                  id="exportDropdownBtn"
                  type="button"
                >
                  <Icon name="download" className="text-base text-secondary" />
                  <span>Audit Export</span>
                  <Icon name="expand_more" className="text-sm" />
                </button>
                {exportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-lg shadow-xl z-30 py-1 border border-surface-container-high">
                    <button
                      onClick={handleExportPDF}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container"
                      type="button"
                    >
                      <Icon name="picture_as_pdf" className="text-base text-error" /> PDF Financial Summary
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container"
                      type="button"
                    >
                      <Icon name="table_view" className="text-base text-secondary" /> Excel / CSV Full Ledger
                    </button>
                    <button
                      onClick={handleExportTaxPack}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container"
                      type="button"
                    >
                      <Icon name="receipt_long" className="text-base text-tertiary" /> Tax Audit Pack (FIRS/Oyo)
                    </button>
                  </div>
                )}
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
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                All equipment hires &amp; farm inputs settle directly between farmer and service syndicate. Entries marked{" "}
                <strong className="text-on-surface">Verified Proof-of-Work</strong> are cryptographically sealed with PowerSync GPS logs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest rounded-lg font-label-sm text-label-sm text-on-surface shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Verified: {ledger.filter((l) => l.status === "VERIFIED").length} entries</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest rounded-lg font-label-sm text-label-sm text-tertiary shadow-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
              <span>Self-Reported: {ledger.filter((l) => l.status === "SELF").length} entries</span>
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
                  <span className="font-body-sm text-body-sm text-primary font-semibold">68.9% Mechanized / Seed</span>
                </div>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "68.9%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Projected Net Margin</span>
                <div className="p-2 rounded-lg bg-surface-container text-secondary">
                  <Icon name="query_stats" />
                </div>
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-primary font-bold">₦3,610,000</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-body-sm text-body-sm text-secondary font-semibold">74.4% Margin</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">(Savanna Benchmark: 52%)</span>
                </div>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: "74.4%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Credit Readiness Score</span>
                <div className="p-2 rounded-lg bg-surface-container text-primary">
                  <Icon name="verified" />
                </div>
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-secondary font-bold">785 / 850</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-body-sm text-body-sm text-primary font-semibold">Tier 2 Verified</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">(₦15M Max Facility)</span>
                </div>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: "92%" }} />
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
                  <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-bold">
                    {filteredLedger.length} Records
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Immutable double-entry book balancing cash, bank slip, and direct syndication records.</p>
              </div>
              <div className="flex flex-wrap items-center gap-space-xs">
                <div className="bg-surface-container px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Icon name="filter_alt" className="text-sm text-on-surface-variant" />
                  <select
                    value={enterpriseFilter}
                    onChange={(e) => setEnterpriseFilter(e.target.value)}
                    className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none cursor-pointer"
                    id="enterpriseFilter"
                  >
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
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none cursor-pointer"
                    id="verificationFilter"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="VERIFIED">Verified Proof-of-Work</option>
                    <option value="SELF">Self-Reported</option>
                  </select>
                </div>
                <ScreenDialog title="Reconcile Cash / Bank Slip" side="center" panel={panelModalReconcile}>
                  <button onClick={() => {}} className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container text-on-surface rounded-lg font-label-sm text-label-sm transition-colors" type="button">
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
                  {filteredLedger.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`ledger-row hover:bg-surface-container-low transition-colors ${
                        idx % 2 === 1 ? "bg-surface-container-low/40" : "bg-surface-container-lowest"
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-label-md text-label-md font-bold text-on-surface">{row.date}</div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">#{row.id}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface font-medium">{row.enterprise}</td>
                      <td className="py-3.5 px-4 text-on-surface">{row.counterparty}</td>
                      <td className={`py-3.5 px-4 text-right font-headline-sm text-headline-sm font-bold ${
                        row.type === "income" ? "text-secondary" : "text-error"
                      }`}>
                        {row.type === "income" ? "+" : "-"}₦{row.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${
                          row.status === "VERIFIED"
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-tertiary-container/20 text-tertiary"
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${row.status === "VERIFIED" ? "bg-secondary" : "bg-tertiary"}`} />
                          <span>{row.status === "VERIFIED" ? "Verified Proof-of-Work" : "Self-Reported Entry"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <ScreenDialog title="Transaction Record" side="center" panel={panelModalReceiptViewer}>
                          <button
                            onClick={() => setSelectedTxn(row)}
                            className="text-secondary hover:underline flex items-center justify-center mx-auto gap-1 font-label-sm text-label-sm font-semibold"
                            type="button"
                          >
                            <Icon name={row.proofIcon as any} className="text-sm" />
                            <span>{row.proofLabel}</span>
                          </button>
                        </ScreenDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <Icon name="lock" className="text-sm text-secondary" />
                <span>Cryptographically verified on SQLite (PowerSync local node). Last synced: 4 mins ago.</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                      showScreenToast(`Viewing ledger page ${page - 1}`);
                    }
                  }}
                  className="px-3 py-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold"
                  type="button"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(1)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    page === 1 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface"
                  }`}
                  type="button"
                >
                  1
                </button>
                <button
                  onClick={() => {
                    setPage(2);
                    showScreenToast("Viewing ledger page 2");
                  }}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    page === 2 ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface"
                  }`}
                  type="button"
                >
                  2
                </button>
                <button
                  onClick={() => {
                    setPage(page + 1);
                    showScreenToast(`Viewing ledger page ${page + 1}`);
                  }}
                  className="px-3 py-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold"
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
