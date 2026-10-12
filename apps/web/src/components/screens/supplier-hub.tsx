"use client";

// Ported from the "input_supplier_agro_dealer_hub" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState, useId } from "react";
import { Icon } from "@/components/ds/icon";
import { showScreenToast, ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

type ProductItem = {
  id: string;
  name: string;
  subname: string;
  category: "Fertilizers" | "Crop Protection" | "Certified Seeds" | "Tools & Knapsacks";
  regNo: string;
  regType: "NAFDAC" | "NASC" | "ISO";
  activeFormulation: string;
  price: string;
  packSize: string;
  stock: string;
  stockAlert?: boolean;
  depotBreakdown: string;
  lotNo: string;
  expiry: string;
  interval: string;
  icon: string;
};

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    name: "Golden Fertilizer NPK 15:15:15",
    subname: "Standard Granular",
    category: "Fertilizers",
    regNo: "NAFDAC A5-0182",
    regType: "NAFDAC",
    activeFormulation: "N:15% · P₂O₅:15% · K₂O:15%",
    price: "₦38,500",
    packSize: "50 kg Woven Poly Bag",
    stock: "480 Bags",
    depotBreakdown: "Oke-Ogun: 120 · Saki: 240 · Ibadan: 120",
    lotNo: "#GF-2026-B1",
    expiry: "Exp: Jan 2028",
    interval: "REI: Immediate",
    icon: "compost",
  },
  {
    id: "p2",
    name: "Notore Urea 46% Nitrogen",
    subname: "Safety Stock Breach (<150)",
    category: "Fertilizers",
    regNo: "NAFDAC A5-0044",
    regType: "NAFDAC",
    activeFormulation: "46% Nitrogen Prilled",
    price: "₦41,000",
    packSize: "50 kg Moisture-barrier Bag",
    stock: "85 Bags",
    stockAlert: true,
    depotBreakdown: "Threshold: 150 Bags Min",
    lotNo: "#NU-2025-E4",
    expiry: "Exp: Nov 2027",
    interval: "REI: Immediate",
    icon: "warning",
  },
  {
    id: "p3",
    name: "SAMMAZ-52 Hybrid Maize Seed",
    subname: "NASC Certified · IITA Bred",
    category: "Certified Seeds",
    regNo: "NASC/2025/MZ-19",
    regType: "NASC",
    activeFormulation: "Thiram + Metalaxyl Treated",
    price: "₦14,500",
    packSize: "10 kg Seed Sachet",
    stock: "320 Bags",
    depotBreakdown: "Germination Rate: 96.5%",
    lotNo: "#SMZ-26-09",
    expiry: "Exp: Dec 2026",
    interval: "Treated Seed Non-Food",
    icon: "grain",
  },
  {
    id: "p4",
    name: "Emamectin Benzoate 5% SG",
    subname: "Syngenta Pro Insecticide",
    category: "Crop Protection",
    regNo: "NAFDAC B2-9014",
    regType: "NAFDAC",
    activeFormulation: "Emamectin Benzoate 50g/kg",
    price: "₦4,800",
    packSize: "250 g Sachet Foil",
    stock: "190 Units",
    depotBreakdown: "Saki North: 110 · Ibadan: 80",
    lotNo: "#EM-26-03",
    expiry: "Exp: Mar 2028",
    interval: "REI: 24h · PHI: 14d",
    icon: "pest_control",
  },
  {
    id: "p5",
    name: "Jubaili Atrazine 500 SC",
    subname: "Selective Triazine Herbicide",
    category: "Crop Protection",
    regNo: "NAFDAC A4-1189",
    regType: "NAFDAC",
    activeFormulation: "Atrazine 500 g/L Liquid",
    price: "₦19,200",
    packSize: "4 Litre HDPE Gallon",
    stock: "42 Gallons",
    depotBreakdown: "Ibadan Apex: 42",
    lotNo: "#JUB-25-H8",
    expiry: "Exp: Aug 2027",
    interval: "REI: 48h · PHI: 60d",
    icon: "science",
  },
  {
    id: "p6",
    name: "Leadway Agrisure Knapsack",
    subname: "16L Dual-Filter Brass Nozzle",
    category: "Tools & Knapsacks",
    regNo: "ISO 9001:2015",
    regType: "ISO",
    activeFormulation: "Reinforced Piston Pump",
    price: "₦26,000",
    packSize: "Individual Boxed Unit",
    stock: "64 Units",
    depotBreakdown: "Across all depots",
    lotNo: "#KS-2026",
    expiry: "Hardware Unit",
    interval: "N/A Equipment",
    icon: "water_voc",
  },
];

export function SupplierHub(_props: ScreenProps) {
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [depotFilter, setDepotFilter] = useState<string>("All");
  const [regFilter, setRegFilter] = useState<string>("All");

  // Requisitions state
  const [req1Allocated, setReq1Allocated] = useState(false);
  const [req2Dispatched, setReq2Dispatched] = useState(false);
  const [req3Verified, setReq3Verified] = useState(false);
  const [order2Departed, setOrder2Departed] = useState(false);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.subname.toLowerCase().includes(q) ||
        p.regNo.toLowerCase().includes(q) ||
        p.lotNo.toLowerCase().includes(q) ||
        p.activeFormulation.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (depotFilter !== "All" && !p.depotBreakdown.toLowerCase().includes(depotFilter.toLowerCase())) {
      return false;
    }
    if (regFilter === "LowStock" && !p.stockAlert) return false;
    return true;
  });

  // Handlers
  const handleExportWaybills = () => {
    const csvContent =
      "Waybill No,Order No,Recipient,Cluster,Cargo,Total Value,Transporter,Reg Plate,Status\n" +
      "WB-9884,ORD-2026-8812,Babatunde Lawal,Iseyin Savanna,18x NPK 15:15:15,693000,Lateef Low-loader,OYO-442-XA,In-Transit\n" +
      "WB-9889,ORD-2026-8815,Saki Cooperative Outgrowers,Saki Syndicate,40x SAMMAZ-52 + 15x Atrazine,868000,Awaiting Low-Loader,Pending,Staged at Dock 2\n" +
      "WB-9872,ORD-2026-8820,Folake Ibironke,Saki North,12x Emamectin Benzoate,57600,Express Motorbike #04,OYO-192-BD,Delivered & Verified\n";
    downloadFile(csvContent, `Waybills-Manifest-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showScreenToast("Exported 3 active waybills to CSV.");
  };

  const handleExportAudit = () => {
    const report =
      "CULTIVANODE AGRO-DEALER COMPLIANCE & AUDIT LOG\n" +
      `Date: ${new Date().toISOString()}\n` +
      "Accreditation: Tier 3 CAC & NAFDAC Accredited\n" +
      "Depots: Saki, Iseyin, Ibadan Central\n" +
      "NAFDAC Act Cap N1 LFN 2004: Compliant\n" +
      "NASC Seeds Act 2019: Compliant\n" +
      "NDPA 2023 Farm Escrow: Protected\n" +
      "GS1 Batch QR Verification: 100% Genuine (0 Counterfeit flags)\n";
    downloadFile(report, `Agro-Dealer-Audit-Log-${new Date().toISOString().slice(0, 10)}.txt`, "text/plain");
    showScreenToast("Compliance audit log downloaded.");
  };

  const handleExportRegulatoryReport = () => {
    const report =
      "FEDERAL REPUBLIC OF NIGERIA - NAFDAC / NASC AGRO-INPUT DEALER REPORT\n" +
      `Generated: ${new Date().toLocaleDateString("en-NG")}\n` +
      "Licensed Hub: CultivaNode Agro-Allied Logistics Oyo Hub\n" +
      "Operating Warehouses: Saki North, Oke-Ogun Hub, Ibadan Apex Silos\n" +
      "Total Active SKUs: 182 lines\n" +
      "Pre-Harvest Interval (PHI) Violations: Zero\n" +
      "Re-Entry Interval (REI) Verification: Complete\n" +
      "Restricted Chemicals: Stored in locked Class II bio-cabinet\n";
    downloadFile(report, `NAFDAC-NASC-Regulatory-Report-${new Date().toISOString().slice(0, 10)}.txt`, "text/plain");
    showScreenToast("NAFDAC/NASC regulatory compliance dossier generated.");
  };

  // Modals
  const modalAddStock = (
    <div className="flex flex-col gap-4 p-4 max-w-lg">
      <div className="flex items-center gap-2">
        <Icon name="add_circle" className="text-xl text-primary" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Add New Input Stock Line</h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Add certified seeds, fertilizers, or agrochemicals with GS1 batch code and regulatory verification.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = fd.get("name") as string;
          const category = fd.get("category") as ProductItem["category"];
          const regNo = fd.get("regNo") as string;
          const price = fd.get("price") as string;
          const stock = fd.get("stock") as string;
          const depot = fd.get("depot") as string;

          const newItem: ProductItem = {
            id: `p-${Date.now()}`,
            name,
            subname: "Newly Registered Batch",
            category,
            regNo,
            regType: regNo.startsWith("NASC") ? "NASC" : regNo.startsWith("ISO") ? "ISO" : "NAFDAC",
            activeFormulation: "Certified Formulation",
            price: `₦${Number(price || 0).toLocaleString()}`,
            packSize: "Standard Pack",
            stock: `${stock} Units`,
            depotBreakdown: `${depot}: ${stock}`,
            lotNo: `#LOT-${Date.now().toString().slice(-4)}`,
            expiry: "Exp: Dec 2028",
            interval: "REI: 24h",
            icon: category === "Fertilizers" ? "compost" : category === "Certified Seeds" ? "grain" : "pest_control",
          };

          setProducts((prev) => [newItem, ...prev]);
          showScreenToast(`New stock line added: ${name}`);
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Product Name &amp; Brand</label>
          <input
            name="name"
            required
            placeholder="e.g. Indorama Granular Urea 46%"
            className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Category</label>
            <select name="category" className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none">
              <option value="Fertilizers">Fertilizers</option>
              <option value="Crop Protection">Crop Protection</option>
              <option value="Certified Seeds">Certified Seeds</option>
              <option value="Tools & Knapsacks">Tools &amp; Knapsacks</option>
            </select>
          </div>
          <div>
            <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">NAFDAC / NASC Reg #</label>
            <input
              name="regNo"
              required
              placeholder="e.g. NAFDAC A5-9921"
              className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Unit Price (₦)</label>
            <input
              name="price"
              type="number"
              required
              placeholder="38000"
              className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none"
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Quantity Received</label>
            <input
              name="stock"
              type="number"
              required
              placeholder="100"
              className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Destination Depot</label>
          <select name="depot" className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none">
            <option value="Oke-Ogun Hub">Oke-Ogun Central Hub</option>
            <option value="Saki North">Saki North Warehouse</option>
            <option value="Ibadan Apex">Ibadan Apex Silos</option>
          </select>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <ScreenDialogClose>
            <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button onClick={() => {}} type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">
              Save Stock Line
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const modalImportManifest = (
    <div className="flex flex-col gap-4 p-4 max-w-md">
      <div className="flex items-center gap-2">
        <Icon name="verified" className="text-xl text-secondary" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Import Supplier Manifest</h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Upload digital delivery manifest from manufacturers (Notore, Indorama, Syngenta, SeedCo, Jubaili) with GS1 barcode verification.
      </p>
      <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center bg-surface-container-low">
        <Icon name="cloud_upload" className="text-3xl text-secondary" />
        <span className="font-label-md text-label-md font-semibold text-on-surface">Click to upload CSV / XLSX manifest</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Includes NAFDAC batch authenticity signatures</span>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <ScreenDialogClose>
          <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md">
            Cancel
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button
            onClick={() => showScreenToast("Supplier manifest batch #MNF-2026-904 imported and reconciled with 182 catalog SKUs.")}
            type="button"
            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold"
          >
            Import &amp; Verify
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const modalVisualGuide = (
    <div className="flex flex-col gap-4 p-4 max-w-lg">
      <div className="flex items-center gap-2 text-error">
        <Icon name="report" className="text-2xl" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Visual Guide: Adulterated Fertilizer Detection</h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        NAFDAC Inspection protocol for identifying counterfeit NPK 20:10:10 bags in northern border corridors:
      </p>
      <div className="space-y-2 text-body-sm">
        <div className="p-2.5 bg-surface-container-low rounded-lg">
          <strong className="text-on-surface block">1. Thermal Tamper Seal</strong>
          <span className="text-on-surface-variant">Genuine bags feature a continuous holographic micro-printed thread. Counterfeits have plain stitched nylon.</span>
        </div>
        <div className="p-2.5 bg-surface-container-low rounded-lg">
          <strong className="text-on-surface block">2. NAFDAC MAS Scratch Code</strong>
          <span className="text-on-surface-variant">SMS the 12-digit PIN to 38353. Any invalid response or duplicate use must be flagged immediately.</span>
        </div>
        <div className="p-2.5 bg-surface-container-low rounded-lg">
          <strong className="text-on-surface block">3. Grain Texture &amp; Moisture</strong>
          <span className="text-on-surface-variant">Authentic granules are spherical and dry. Adulterated batches often contain sand or fine limestone filler that cakes rapidly.</span>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <ScreenDialogClose>
          <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">
            Understood
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const modalPodPhoto = (
    <div className="flex flex-col gap-4 p-4 max-w-lg">
      <div className="flex items-center gap-2">
        <Icon name="verified" className="text-xl text-secondary" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Proof-of-Delivery Verification</h3>
      </div>
      <div className="bg-surface-container-low p-3 rounded-xl space-y-2 font-body-sm">
        <div className="flex justify-between">
          <span className="text-outline">Order Reference:</span>
          <span className="font-bold text-on-surface">#ORD-2026-8820 (Waybill #WB-9872)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Recipient:</span>
          <span className="font-semibold text-on-surface">Folake Ibironke (Saki North)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Geotag Stamp:</span>
          <span className="font-mono text-secondary font-bold">GEO-8.6720° N, 3.3912° E</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Delivery Timestamp:</span>
          <span>11:42 WAT · 12 May 2026</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Biometric Confirmation:</span>
          <span className="text-secondary font-semibold">Farmer Fingerprint Match (Tier 3)</span>
        </div>
      </div>
      <div className="p-3 bg-surface-container rounded-lg text-center text-label-sm text-on-surface-variant">
        [Cryptographic PoD Stamp Signed &amp; Stored on PowerSync Local SQLite Node]
      </div>
      <div className="flex justify-end pt-2">
        <ScreenDialogClose>
          <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">
            Close
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

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
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">
              Input Supplier &amp; Agro-dealer Command Hub
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
              Certified seed, fertilizer, and crop-protection catalog, warehouse batch traceability, and automated crop-plan shortage fulfillment across South-West Nigeria agro-clusters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm self-start md:self-auto">
            {_props.slots?.actions ?? (
              <>
                <button
                  onClick={handleExportWaybills}
                  className="flex items-center gap-space-xs px-space-md py-2 bg-surface-container-lowest text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container-high transition-colors"
                  type="button"
                >
                  <Icon name="file_download" className="text-[18px] text-on-surface-variant" />
                  <span>Export Waybills (CSV)</span>
                </button>
                <ScreenDialog title="Import Manifest" side="center" panel={modalImportManifest}>
                  <button
                    onClick={() => {}}
                    className="flex items-center gap-space-xs px-space-md py-2 bg-surface-container-lowest text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container-high transition-colors"
                    type="button"
                  >
                    <Icon name="verified" className="text-[18px] text-secondary" />
                    <span>Import Manifest</span>
                  </button>
                </ScreenDialog>
                <ScreenDialog title="Add Stock Line" side="center" panel={modalAddStock}>
                  <button
                    onClick={() => {}}
                    className="flex items-center gap-space-xs px-space-md py-2 bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary transition-colors"
                    type="button"
                  >
                    <Icon name="add_circle" className="text-[18px]" />
                    <span>+ Add Stock Line</span>
                  </button>
                </ScreenDialog>
              </>
            )}
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
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Routing
            </span>
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
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                <strong className="text-tertiary-container">14</strong> Confirming · <strong className="text-on-surface">9</strong> Fulfilling · <strong className="text-secondary">15</strong> Dispatched
              </p>
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
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                Zenith Settled: ₦12.40M <br />
                Escrow Hold: ₦2.45M
              </p>
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
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                182 SKU Lines across stores<br />
                1,420 Bags NPK &amp; Urea
              </p>
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
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                NPK 15:15:15 below 18% safety cap<br />
                1 Batch near REI / Expiry window
              </p>
            </div>
            <button
              onClick={() => {
                setRegFilter("LowStock");
                showScreenToast("Filtered product catalog to shortfalls and low stock lines.");
              }}
              className="flex items-center gap-space-xs text-error font-label-sm text-label-sm font-semibold hover:underline"
              type="button"
            >
              <Icon name="warning" className="text-[16px]" />
              <span>Trigger Supplier POs</span>
            </button>
          </div>
          <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Dispatch SLA</span>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold">&lt; 8.0h Target</span>
            </div>
            <div className="my-space-sm">
              <div className="font-metric-num text-metric-num text-secondary tracking-tight">4.2 Hours</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                Low-loader / tractor trailer &amp; bike courier turnaround avg.
              </p>
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
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                0 Counterfeit flags · 1 transit tear resolved with insurance
              </p>
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
                  <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm rounded-full font-bold">
                    Realtime Ingest
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Cross-dashboard pipeline linking field operations, soil nutrient deficit triggers, and pest outbreaks directly to your nearest warehouse inventory.
                </p>
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
                  <span className="px-2 py-0.5 bg-surface-container-highest text-primary font-label-sm text-label-sm font-bold rounded">
                    #REQ-2026-0891
                  </span>
                  <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-secondary" /> Auto-Matched (14.2 km)
                  </span>
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
                <button
                  onClick={() => {
                    setReq1Allocated(true);
                    showScreenToast("Lot #GF-2026-B1 allocated to Babatunde Lawal. Waybill #WB-9884 generated.");
                  }}
                  className={`flex-1 py-2 px-space-sm font-label-sm text-label-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    req1Allocated
                      ? "bg-secondary text-on-secondary"
                      : "bg-primary-container text-on-primary hover:bg-primary"
                  }`}
                  type="button"
                >
                  <Icon name={req1Allocated ? "check_circle" : "task_alt"} className="text-[16px]" />
                  <span>{req1Allocated ? "Lot Allocated ✓" : "Confirm & Allocate Lot"}</span>
                </button>
                <button
                  onClick={() => showScreenToast("Low loader truck dispatched to Oke-Ogun Hub for loading.")}
                  className="p-2 bg-surface-container-lowest text-on-surface rounded-lg hover:bg-surface-container-high transition-colors"
                  title="Dispatch Low Loader"
                  type="button"
                >
                  <Icon name="local_shipping" className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between p-space-md bg-surface-container-low rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-error-container text-on-error-container font-label-sm text-label-sm font-bold rounded">
                    #REQ-2026-0884 · URGENT
                  </span>
                  <span className="flex items-center gap-1 text-error font-label-sm text-label-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-error animate-ping" /> Fall Armyworm Outbreak
                  </span>
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
                <button
                  onClick={() => {
                    setReq2Dispatched(true);
                    showScreenToast("Express Motorbike #04 dispatched with 12 units Emamectin Benzoate to Folake Ibironke.");
                  }}
                  className={`flex-1 py-2 px-space-sm font-label-sm text-label-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    req2Dispatched
                      ? "bg-secondary text-on-secondary"
                      : "bg-tertiary-container text-on-tertiary-container hover:bg-tertiary"
                  }`}
                  type="button"
                >
                  <Icon name="two_wheeler" className="text-[16px]" />
                  <span>{req2Dispatched ? "Courier Dispatched ✓" : "Instant Dispatch (Motorbike)"}</span>
                </button>
                <button
                  onClick={() => showScreenToast("SOP Protocol: Rate 0.4g/L, spray into maize whorl / foliage at dusk. PHI: 14 days.")}
                  className="p-2 bg-surface-container-lowest text-on-surface rounded-lg hover:bg-surface-container-high transition-colors"
                  title="View Agronomy Protocol"
                  type="button"
                >
                  <Icon name="biotech" className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between p-space-md bg-surface-container-low rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-surface-container-highest text-primary font-label-sm text-label-sm font-bold rounded">
                    #REQ-2026-0879
                  </span>
                  <span className="flex items-center gap-1 text-tertiary-container font-label-sm text-label-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-tertiary-container" /> Escrow Hold
                  </span>
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
                <button
                  onClick={() => {
                    setReq3Verified(true);
                    showScreenToast("Escrow contract #ESC-PSL-449 verified against Providus Bank trust node.");
                  }}
                  className={`flex-1 py-2 px-space-sm font-label-sm text-label-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    req3Verified
                      ? "bg-secondary text-on-secondary"
                      : "bg-surface-container-highest text-on-surface hover:bg-surface-container-high"
                  }`}
                  type="button"
                >
                  <Icon name={req3Verified ? "verified" : "hourglass_top"} className="text-[16px]" />
                  <span>{req3Verified ? "Escrow Verified ✓" : "Verify Escrow Contract"}</span>
                </button>
                <button
                  onClick={() => showScreenToast("Contacting Psaltry Outgrower Syndicate Representative via Telco Gateway (+234 803 219 0041).")}
                  className="p-2 bg-surface-container-lowest text-on-surface rounded-lg hover:bg-surface-container-high transition-colors"
                  title="Contact Syndicate Rep"
                  type="button"
                >
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
              {["All", "Fertilizers", "Crop Protection", "Certified Seeds", "Tools & Knapsacks"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-space-md py-1 rounded-md font-label-sm text-label-sm transition-colors ${
                    selectedCategory === cat
                      ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  {cat === "All" ? "All SKUs (182)" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-space-sm items-center">
            <div className="flex items-center w-full sm:flex-1 bg-surface-container-low px-space-md py-2 rounded-lg text-on-surface-variant">
              <Icon name="search" className="text-[20px] mr-space-xs text-outline" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-body-sm font-body-sm text-on-surface focus:outline-none w-full placeholder-outline"
                placeholder="Search by SKU, Brand, NAFDAC Reg Number, Lot #, Active Ingredient..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-space-xs w-full sm:w-auto">
              <select
                value={depotFilter}
                onChange={(e) => setDepotFilter(e.target.value)}
                className="bg-surface-container-low text-on-surface font-label-sm text-label-sm px-space-md py-2 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="All">All Depots (Oke-Ogun, Saki, Ibadan)</option>
                <option value="Oke-Ogun">Oke-Ogun Central Depot Only</option>
                <option value="Saki">Saki North Depot Only</option>
                <option value="Ibadan">Ibadan Apex Depot Only</option>
              </select>
              <select
                value={regFilter}
                onChange={(e) => setRegFilter(e.target.value)}
                className="bg-surface-container-low text-on-surface font-label-sm text-label-sm px-space-md py-2 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="All">Regulatory: All Valid</option>
                <option value="LowStock">Low Stock Triggered (&lt; 20%)</option>
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
                {filteredProducts.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      idx % 2 === 0
                        ? "bg-surface-container-lowest hover:bg-surface-container-low"
                        : "bg-surface-container-low hover:bg-surface-container"
                    }`}
                  >
                    <td className="py-space-md px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            p.stockAlert ? "bg-error-container/40 text-error" : "bg-surface-container text-primary"
                          }`}
                        >
                          <Icon name={p.icon as any} className="text-[20px]" />
                        </div>
                        <div>
                          <span className="font-label-lg text-label-lg font-semibold text-on-surface block">{p.name}</span>
                          <span
                            className={`font-label-sm text-label-sm font-medium ${
                              p.stockAlert ? "text-error" : "text-secondary"
                            }`}
                          >
                            {p.subname}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
                        {p.regNo}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md text-on-surface-variant font-mono text-label-sm">
                      {p.activeFormulation}
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="font-bold text-on-surface">{p.price}</span>
                      <span className="text-on-surface-variant text-label-sm block">{p.packSize}</span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${p.stockAlert ? "bg-error" : "bg-secondary"}`} />
                        <span className={`font-bold ${p.stockAlert ? "text-error" : "text-on-surface"}`}>{p.stock}</span>
                      </div>
                      <span className={`text-label-sm block ${p.stockAlert ? "text-error" : "text-on-surface-variant"}`}>
                        {p.depotBreakdown}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md font-label-sm text-label-sm">
                      <span className="font-semibold text-on-surface">{p.lotNo}</span>
                      <span className="text-on-surface-variant block">{p.expiry}</span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                        {p.interval}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      <div className="flex items-center justify-end gap-space-xs">
                        <button
                          onClick={() => showScreenToast(`Stock inspection details loaded for ${p.name} (${p.lotNo}).`)}
                          className="px-2.5 py-1 bg-surface-container text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          Stock
                        </button>
                        <button
                          onClick={() => showScreenToast(`Pricing adjusted for ${p.name}: current wholesale ${p.price}.`)}
                          className="px-2.5 py-1 bg-primary-container text-on-primary font-label-sm text-label-sm rounded hover:bg-primary transition-colors"
                          type="button"
                        >
                          Price
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                <span className="self-start sm:self-auto px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> In-Transit (ETA 45 mins)
                </span>
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
                <button
                  onClick={() => showScreenToast("Telematics sync: Lateef Low-loader speed 48 km/h on Ado-Awaye Bypass. On schedule.")}
                  className="text-primary font-semibold hover:underline flex items-center gap-0.5"
                  type="button"
                >
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
                <span className="self-start sm:self-auto px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />{" "}
                  {order2Departed ? "Departed Dock 2 (En route)" : "Staged at Dock 2 (Saki Hub)"}
                </span>
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
                <button
                  onClick={() => {
                    setOrder2Departed(true);
                    showScreenToast("Order #ORD-2026-8815 marked departed from Saki Hub. Driver checked out.");
                  }}
                  className={`px-space-md py-1.5 font-label-sm text-label-sm font-semibold rounded-lg transition-colors ${
                    order2Departed
                      ? "bg-secondary text-on-secondary"
                      : "bg-primary-container text-on-primary hover:bg-primary"
                  }`}
                  type="button"
                >
                  {order2Departed ? "Departed ✓" : "Confirm Departure"}
                </button>
              </div>
            </div>

            <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-sm shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">#ORD-2026-8820</span>
                  <span className="text-outline">·</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Waybill #WB-9872</span>
                </div>
                <span className="self-start sm:self-auto px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <Icon name="check_circle" className="text-[14px]" /> Delivered &amp; Verified
                </span>
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
                <ScreenDialog title="Proof-of-Delivery" side="center" panel={modalPodPhoto}>
                  <button onClick={() => {}} className="text-primary font-semibold hover:underline" type="button">
                    View PoD Photo
                  </button>
                </ScreenDialog>
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
              <p className="font-body-sm text-body-sm text-on-surface">
                NAFDAC has issued a high alert for adulterated bags of <strong>NPK 20:10:10</strong> circulating in northern border corridors (Niger State / Kwara boundary). Bags have missing thermal tamper seals.
              </p>
              <div className="flex items-center gap-space-sm pt-space-xs">
                <ScreenDialog title="Adulteration Guide" side="center" panel={modalVisualGuide}>
                  <button onClick={() => {}} className="px-space-md py-1 bg-surface-container-lowest text-error font-label-sm text-label-sm font-semibold rounded hover:bg-error-container/40 transition-colors" type="button">
                    View Visual ID Guide
                  </button>
                </ScreenDialog>
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
                <button
                  onClick={() => {
                    downloadFile(
                      "IITA & NASC CERTIFIED SEED RELEASE CERTIFICATE\nSerial: NASC/2025/MZ-19\nCrop: Hybrid Maize SAMMAZ-52\nBreeder: IITA Ibadan / NCRI\nGermination Rate: 96.5%\nPure Seed: 99.2%\nPurity Pass Date: 12 Jan 2026\n",
                      "IITA-SAMMAZ-52-Seed-Certificate.txt",
                      "text/plain"
                    );
                    showScreenToast("IITA Seed Certification downloaded.");
                  }}
                  className="text-primary hover:text-on-surface"
                  title="Download Certificate PDF"
                  type="button"
                >
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
                <button
                  onClick={() => {
                    downloadFile(
                      "NAFDAC LABORATORY SERVICES - CERTIFICATE OF ANALYSIS\nBatch: EM-26-03 & JUB-25-H8\nActive Ingredient Assay: 99.4% standard compliance\nImpurity Level: <0.02% (Pass)\nHeavy Metals: Undetectable\nAuthorized Chemist: Dr. K. Adeoti, NAFDAC Central Labs Yaba\n",
                      "NAFDAC-Chemical-Purity-Assay.txt",
                      "text/plain"
                    );
                    showScreenToast("NAFDAC Chemical Purity Assay downloaded.");
                  }}
                  className="text-primary hover:text-on-surface"
                  title="Download Certificate PDF"
                  type="button"
                >
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
            <button
              onClick={handleExportAudit}
              className="px-space-md py-1.5 bg-surface-container-low text-on-surface font-label-sm text-label-sm font-semibold rounded-lg hover:bg-surface-container transition-colors"
              type="button"
            >
              Audit Log
            </button>
            <button
              onClick={handleExportRegulatoryReport}
              className="px-space-md py-1.5 bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold rounded-lg hover:bg-primary transition-colors"
              type="button"
            >
              Generate Regulatory Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
