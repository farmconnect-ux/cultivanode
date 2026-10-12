"use client";

// Ported from the "inventory_storekeeper_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";
import { slot } from "./types";

interface InventoryRow {
  id: string;
  name: string;
  category: "fertilizer" | "crop_protection" | "seeds" | "feed" | "vet" | "spares";
  categoryLabel: string;
  spec: string;
  location: string;
  locationKey: "hub" | "field01" | "cold" | "feed";
  lot: string;
  currentStock: number;
  unit: string;
  minBuffer: number;
  unitCost: number;
  totalValue: number;
  expiry: string;
  demandNote: string;
  isCritical?: boolean;
  isWeatherHold?: boolean;
}

const INITIAL_ITEMS: InventoryRow[] = [
  {
    id: "sku-1",
    name: "Urea 46% N (Granular Indorama)",
    category: "fertilizer",
    categoryLabel: "Fertilizers · 50kg Bags",
    spec: "50kg Bags",
    location: "Hub Central Silo",
    locationKey: "hub",
    lot: "#IND-2026-04",
    currentStock: 6,
    unit: "Bags",
    minBuffer: 20,
    unitCost: 28000,
    totalValue: 168000,
    expiry: "Oct 2028",
    demandNote: "Split 2 Maize Due in 48h (-14 bags)",
    isCritical: true,
  },
  {
    id: "sku-2",
    name: "NPK 15-15-15 + Zn Micro",
    category: "fertilizer",
    categoryLabel: "Golden Fertilizer · 50kg Bags",
    spec: "50kg Bags",
    location: "Field Store 01",
    locationKey: "field01",
    lot: "#GF-2025-99",
    currentStock: 28,
    unit: "Bags",
    minBuffer: 10,
    unitCost: 32500,
    totalValue: 910000,
    expiry: "Dec 2027",
    demandNote: "100% Basal applied · Surplus secure",
  },
  {
    id: "sku-3",
    name: "Copper Hydroxide 53.8%",
    category: "crop_protection",
    categoryLabel: "Fungicide · 1kg Canisters",
    spec: "1kg Canisters",
    location: "Hub Chemical Locker",
    locationKey: "hub",
    lot: "#CH-2026-11",
    currentStock: 12.5,
    unit: "kg",
    minBuffer: 15,
    unitCost: 9200,
    totalValue: 115000,
    expiry: "Aug 2027",
    demandNote: "PHI: 14 Days",
    isCritical: true,
  },
  {
    id: "sku-4",
    name: "Mancozeb 80WP Protectant",
    category: "crop_protection",
    categoryLabel: "Crop Protection · 1kg Bags",
    spec: "1kg Bags",
    location: "Hub Chemical Locker",
    locationKey: "hub",
    lot: "#MN-2025-44",
    currentStock: 34,
    unit: "kg",
    minBuffer: 12,
    unitCost: 5400,
    totalValue: 183600,
    expiry: "Jun 2027",
    demandNote: "On Weather Hold",
    isWeatherHold: true,
  },
  {
    id: "sku-5",
    name: "Broiler Finisher 18% CP Pellets",
    category: "feed",
    categoryLabel: "Animal Feed · 50kg Bags",
    spec: "50kg Bags",
    location: "Poultry Feed Room",
    locationKey: "feed",
    lot: "#TOP-B4-09",
    currentStock: 8,
    unit: "Bags (400 kg)",
    minBuffer: 12,
    unitCost: 14500,
    totalValue: 116000,
    expiry: "Jul 2026",
    demandNote: "Daily Intake 142 kg (2.8 days left)",
    isCritical: true,
  },
  {
    id: "sku-6",
    name: "Clarias 4mm Floating Feed",
    category: "feed",
    categoryLabel: "Skretting · 15kg Sacks",
    spec: "15kg Sacks",
    location: "Aquaculture Store",
    locationKey: "feed",
    lot: "#SK-CL-88",
    currentStock: 18,
    unit: "Bags (270 kg)",
    minBuffer: 10,
    unitCost: 16200,
    totalValue: 291600,
    expiry: "Sep 2026",
    demandNote: "15 Days buffer available",
  },
  {
    id: "sku-7",
    name: "Maize Seed DMR-LSR-Y Certified",
    category: "seeds",
    categoryLabel: "IITA Certified · 10kg Sacks",
    spec: "10kg Sacks",
    location: "Hub Cold Seed Room",
    locationKey: "cold",
    lot: "#IITA-MZ-02",
    currentStock: 120,
    unit: "kg",
    minBuffer: 20,
    unitCost: 1800,
    totalValue: 216000,
    expiry: "Jan 2027",
    demandNote: "Germination rate 96%",
  },
  {
    id: "sku-8",
    name: "NDV Lasota Vaccine Vials",
    category: "vet",
    categoryLabel: "Vet Medicine · 1,000 Doses/vial",
    spec: "1,000 Doses/vial",
    location: "Bio-Fridge (+4°C)",
    locationKey: "cold",
    lot: "#NV-2026-882",
    currentStock: 2,
    unit: "Vials",
    minBuffer: 1,
    unitCost: 4500,
    totalValue: 9000,
    expiry: "Nov 2026",
    demandNote: "Cold chain: +3.8°C",
  },
];

export function InventoryHub({ lang: _lang, slots }: ScreenProps<"actions" | "kpis" | "locations" | "items" | "movements">) {
  const [items, setItems] = useState<InventoryRow[]>(INITIAL_ITEMS);
  const [activeLocation, setActiveLocation] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeLocation !== "all" && item.locationKey !== activeLocation) return false;
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchLot = item.lot.toLowerCase().includes(q);
      const matchCat = item.categoryLabel.toLowerCase().includes(q);
      if (!matchName && !matchLot && !matchCat) return false;
    }
    return true;
  });

  const handleReorder = (item: InventoryRow) => {
    showScreenToast(`Dispatched instant restock PO for ${item.name} to registered supplier.`);
  };

  const handleIssueStock = (item: InventoryRow) => {
    showScreenToast(`Stock issued for ${item.name}. Quantity deducted and synced to Farm Books COGS.`);
  };

  const handleExportStockValuation = () => {
    const header = "SKU Name,Category,Location,Batch Lot,Current Stock,Unit,Unit Cost (NGN),Total Valuation (NGN),Expiry Date,Demand Note\n";
    const rows = items
      .map(
        (i) =>
          `"${i.name}","${i.categoryLabel}","${i.location}","${i.lot}","${i.currentStock}","${i.unit}","${i.unitCost}","${i.totalValue}","${i.expiry}","${i.demandNote}"`
      )
      .join("\n");
    downloadFile(header + rows, `CultivaNode-Stock-Valuation-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showScreenToast("Stock valuation ledger downloaded as CSV.");
  };

  const handleDeepReconciliation = () => {
    showScreenToast("Deep discrepancy reconciliation finished: 24 SKUs balanced across Crop, Livestock, and Farm Books with 0 variances!");
  };

  const panelModalReceiveStock = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Stock In / Receive Goods</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Log batch reception with FIFO allocation &amp; delivery slip</p>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          showScreenToast("Stock batch recorded! Inventory levels updated and goods receipt note generated.");
        }}
        className="p-space-lg space-y-space-md max-h-[716px] overflow-y-auto text-left"
      >
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
            <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" defaultValue="50" type="number" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Batch / Lot Number</label>
            <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" defaultValue="IND-2026-99" type="text" />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Unit Purchase Price (₦)</label>
            <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" defaultValue="28000" type="number" />
          </div>
        </div>
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Expiry Date</label>
          <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" defaultValue="2028-10-15" type="date" />
        </div>
        <div className="p-space-lg bg-surface-container-low flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button
              onClick={() => showScreenToast("Stock batch recorded! Inventory levels updated and goods receipt note generated.")}
              className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold"
              type="button"
            >
              Confirm Stock Reception
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const panelModalIssueStock = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Issue Stock to Field Operation</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Deduct batch allocation &amp; link to field work order</p>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          showScreenToast("Stock issued to operation! Inventory updated.");
        }}
        className="p-space-lg space-y-space-md max-h-[716px] overflow-y-auto text-left"
      >
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">SKU to Issue</label>
          <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
            <option>Urea 46% N (6 Bags available)</option>
            <option>NPK 15-15-15 (28 Bags available)</option>
            <option>Mancozeb 80WP (34 kg available)</option>
            <option>Broiler Finisher Pellets (8 Bags available)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Destination / Plot</label>
            <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
              <option>Plot A1 (Maize Top-Dress)</option>
              <option>Plot A2 (Maize Top-Dress)</option>
              <option>Plot B1 (Tomato Field)</option>
              <option>Poultry Pen 3</option>
            </select>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Quantity to Issue</label>
            <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" defaultValue="4" type="number" />
          </div>
        </div>
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Recipient / Operator Name</label>
          <input className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" defaultValue="Babatunde Adeleke (Field Hand)" type="text" />
        </div>
        <div className="p-space-lg bg-surface-container-low flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button
              onClick={() => showScreenToast("Stock issued to operation! Inventory updated.")}
              className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold"
              type="button"
            >
              Confirm Issue
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16 space-y-space-lg">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="px-space-sm py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase tracking-wider font-bold">
                Storekeeper &amp; Input Operations
              </span>
              <div className="flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                <Icon name="tune" className="text-sm text-secondary" /> Automated Split-Input Reconciliations
              </div>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">
              Farm Inventory &amp; Input Hub
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Real-time ag-input ledgering, batch quarantine, cold-chain monitoring, and automated depletion link to Farm Books (₦).
            </p>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex flex-wrap items-center gap-space-xs">
              <ScreenDialog title="Stock In / Receive Goods" side="center" panel={panelModalReceiveStock}>
                <button onClick={() => {}} className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all font-semibold" type="button">
                  <Icon name="add_shopping_cart" className="text-lg" />
                  <span>Receive Goods / Stock In</span>
                </button>
              </ScreenDialog>
              <ScreenDialog title="Issue Stock To Field Operation" side="center" panel={panelModalIssueStock}>
                <button onClick={() => {}} className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors font-semibold" type="button">
                  <Icon name="output" className="text-lg" />
                  <span>Issue Stock to Operation</span>
                </button>
              </ScreenDialog>
              <button
                onClick={() => showScreenToast("Physical audit cycle initiated: QR scanning enabled for all 24 storehouse bins.")}
                className="flex items-center gap-space-xs px-space-sm py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm font-medium"
                type="button"
              >
                <Icon name="fact_check" className="text-lg text-secondary" />
                <span className="hidden sm:inline">Physical Audit Count</span>
              </button>
              <button
                onClick={handleExportStockValuation}
                className="flex items-center gap-space-xs px-space-sm py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm font-medium"
                title="Generate Valuation Sheet"
                type="button"
              >
                <Icon name="picture_as_pdf" className="text-lg text-error" />
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
                <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-0.5">
                  <Icon name="trending_up" className="text-xs" />+4.2% MoM
                </span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-error font-semibold tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" /> Stock Out Alert
                  </span>
                  <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-error font-bold">3 Items Critical</div>
                </div>
                <div className="p-space-xs rounded-lg bg-error-container text-on-error-container">
                  <Icon name="warning" className="text-2xl" />
                </div>
              </div>
              <div className="mt-space-md pt-space-sm border-t border-surface-container-high/60">
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Nearest: <span className="font-semibold text-error">Urea 46% (6 bags / 20 buffer)</span>
                </p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase">Active Operations Reserved</span>
                  <div className="mt-space-xs font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-secondary font-bold">₦482,000</div>
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
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Nearest: <span className="font-semibold text-on-surface">Mancozeb #M89</span> (14 mo left)
                </p>
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
                <button
                  onClick={() => setActiveLocation("all")}
                  className={`px-space-md py-1.5 rounded-full font-label-md text-label-md shadow-sm whitespace-nowrap transition-colors ${
                    activeLocation === "all" ? "bg-primary text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  All Locations
                </button>
                <button
                  onClick={() => setActiveLocation("hub")}
                  className={`px-space-md py-1.5 rounded-full font-label-md text-label-md shadow-sm whitespace-nowrap transition-colors ${
                    activeLocation === "hub" ? "bg-primary text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Hub Central Silo &amp; Warehouse (Iseyin)
                </button>
                <button
                  onClick={() => setActiveLocation("field01")}
                  className={`px-space-md py-1.5 rounded-full font-label-md text-label-md shadow-sm whitespace-nowrap transition-colors ${
                    activeLocation === "field01" ? "bg-primary text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Field Store 01 (Plots A &amp; B)
                </button>
                <button
                  onClick={() => setActiveLocation("cold")}
                  className={`px-space-md py-1.5 rounded-full font-label-md text-label-md shadow-sm whitespace-nowrap flex items-center gap-1 transition-colors ${
                    activeLocation === "cold" ? "bg-primary text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Cold-Chain Bio-Cabinet (Poultry/Vet)
                </button>
                <button
                  onClick={() => setActiveLocation("feed")}
                  className={`px-space-md py-1.5 rounded-full font-label-md text-label-md shadow-sm whitespace-nowrap transition-colors ${
                    activeLocation === "feed" ? "bg-primary text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Feed Depot (Aquaculture/Pond)
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm w-fit">
                <Icon name="cloud_done" className="text-secondary text-base" />
                <span>Local Storage: 24 SKUs Sync&apos;d Offline</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md font-semibold whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeCategory === "all" ? "bg-primary-container text-on-primary-container" : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant shadow-sm"
              }`}
              type="button"
            >
              <span>All Items</span>
              <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm">24</span>
            </button>
            <button
              onClick={() => setActiveCategory("fertilizer")}
              className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm transition-colors ${
                activeCategory === "fertilizer" ? "bg-primary-container text-on-primary-container font-semibold" : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant"
              }`}
              type="button"
            >
              <span>Fertilizers &amp; Nutrition</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">6</span>
            </button>
            <button
              onClick={() => setActiveCategory("crop_protection")}
              className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm transition-colors ${
                activeCategory === "crop_protection" ? "bg-primary-container text-on-primary-container font-semibold" : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant"
              }`}
              type="button"
            >
              <span>Crop Protection / Agrochemicals</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">5</span>
            </button>
            <button
              onClick={() => setActiveCategory("seeds")}
              className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm transition-colors ${
                activeCategory === "seeds" ? "bg-primary-container text-on-primary-container font-semibold" : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant"
              }`}
              type="button"
            >
              <span>Seeds &amp; Seedlings</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">4</span>
            </button>
            <button
              onClick={() => setActiveCategory("feed")}
              className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm transition-colors ${
                activeCategory === "feed" ? "bg-primary-container text-on-primary-container font-semibold" : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant"
              }`}
              type="button"
            >
              <span>Animal Feed &amp; Nutrition</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">5</span>
            </button>
            <button
              onClick={() => setActiveCategory("vet")}
              className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap flex items-center gap-2 shadow-sm transition-colors ${
                activeCategory === "vet" ? "bg-primary-container text-on-primary-container font-semibold" : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant"
              }`}
              type="button"
            >
              <span>Veterinary &amp; Vaccines</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">2</span>
            </button>
          </div>
        </div>
        {slot(
          slots,
          "items",
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-sm border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Managed SKU Master Ledger</h2>
                <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-semibold">FIFO Tracked</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <div className="relative">
                  <Icon name="filter_list" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-8 pr-3 text-body-sm font-body-sm bg-surface-container-low rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-64 text-on-surface"
                    placeholder="Filter batch, brand or chemical..."
                    type="text"
                  />
                </div>
                <button
                  onClick={handleExportStockValuation}
                  className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant transition-colors"
                  title="Export SKU Ledger CSV"
                  type="button"
                >
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
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-surface-container-low/40 transition-colors ${
                        item.isCritical ? "bg-error-container/10" : ""
                      }`}
                    >
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-on-surface">{item.name}</div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{item.categoryLabel}</span>
                      </td>
                      <td className="py-3.5 px-space-md text-on-surface">{item.location}</td>
                      <td className="py-3.5 px-space-md font-mono text-label-sm text-on-surface-variant font-semibold">{item.lot}</td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${item.currentStock <= item.minBuffer ? "text-error" : "text-secondary"}`}>
                            {item.currentStock} {item.unit}
                          </span>
                          <span className="text-on-surface-variant font-label-sm text-label-sm">/ Min: {item.minBuffer}</span>
                        </div>
                        <div className="w-32 bg-surface-container-high rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.currentStock <= item.minBuffer ? "bg-error" : "bg-secondary"}`}
                            style={{ width: `${Math.min(100, (item.currentStock / (item.minBuffer * 2)) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-space-md text-on-surface font-semibold">₦{item.unitCost.toLocaleString()}</td>
                      <td className="py-3.5 px-space-md font-bold text-on-background">₦{item.totalValue.toLocaleString()}</td>
                      <td className="py-3.5 px-space-md text-on-surface-variant">{item.expiry}</td>
                      <td className="py-3.5 px-space-md">
                        {item.isWeatherHold ? (
                          <span className="px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1 w-fit">
                            <Icon name="cloud_sync" className="text-xs text-primary" />On Weather Hold
                          </span>
                        ) : item.isCritical ? (
                          <span className="px-2 py-0.5 rounded-md bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold flex items-center gap-1 w-fit">
                            <Icon name="priority_high" className="text-xs" />{item.demandNote}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant font-label-sm text-label-sm">{item.demandNote}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        {item.isCritical ? (
                          <button
                            onClick={() => handleReorder(item)}
                            className="px-space-sm py-1.5 rounded-lg bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-semibold hover:bg-tertiary transition-all shadow-sm"
                            type="button"
                          >
                            Reorder
                          </button>
                        ) : (
                          <button
                            onClick={() => handleIssueStock(item)}
                            className="px-space-sm py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-variant transition-colors"
                            type="button"
                          >
                            Issue Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
              <span>Showing {filteredItems.length} of {items.length} active agricultural inputs</span>
              <div className="flex items-center gap-space-xs mt-2 sm:mt-0">
                <button
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                      showScreenToast(`Viewing page ${page - 1}`);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm hover:bg-surface-container transition-colors"
                  type="button"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(1)}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm ${
                    page === 1 ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface"
                  }`}
                  type="button"
                >
                  1
                </button>
                <button
                  onClick={() => {
                    setPage(2);
                    showScreenToast("Viewing page 2");
                  }}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm ${
                    page === 2 ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface"
                  }`}
                  type="button"
                >
                  2
                </button>
                <button
                  onClick={() => {
                    setPage(page + 1);
                    showScreenToast(`Viewing page ${page + 1}`);
                  }}
                  className="px-2.5 py-1 rounded bg-surface-container-lowest font-label-sm text-label-sm hover:bg-surface-container transition-colors"
                  type="button"
                >
                  Next
                </button>
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
            <button
              onClick={handleDeepReconciliation}
              className="w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant font-label-md text-label-md flex items-center justify-center gap-2 transition-colors font-semibold"
              type="button"
            >
              <Icon name="published_with_changes" className="text-lg" />
              <span>Run Deep Discrepancy Reconciliation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
