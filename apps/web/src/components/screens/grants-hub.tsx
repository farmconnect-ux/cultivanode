"use client";

// Ported from the "grants_subsidies_programmes_9.4" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.

import { useState, useMemo } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface BeneficiaryRecord {
  id: string;
  name: string;
  nin: string;
  coop: string;
  lga: string;
  perimeter: string;
  programme: string;
  packageDetails: string;
  status: "Redeemed" | "Issued" | "Payout Ready";
  statusText: string;
  depot: string;
  auditHash: string;
  auditTime: string;
  amount: string;
}

const INITIAL_BENEFICIARIES: BeneficiaryRecord[] = [
  {
    id: "BEN-01",
    name: "Adeyemi Sikiru",
    nin: "4819-****-2018",
    coop: "Oke-Ogun Soya Alliance",
    lga: "Saki West LGA",
    perimeter: "2.4 Ha Polygon",
    programme: "NAGS-AP 50% Wet Season",
    packageDetails: "4x NPK + 2x Urea + 25kg Maize",
    status: "Redeemed",
    statusText: "Redeemed (₦112,400)",
    depot: "Saki Central Agro-Depot",
    auditHash: "SHA256: 8f9b..c2",
    auditTime: "Today, 09:14 AM",
    amount: "₦112,400",
  },
  {
    id: "BEN-02",
    name: "Folake Alabi",
    nin: "9021-****-7104",
    coop: "Iseyin Women Cassava Hub",
    lga: "Iseyin LGA",
    perimeter: "1.8 Ha Polygon",
    programme: "OYSADEP Clean Seed Multiplier",
    packageDetails: "60 Bundles TME-419 + Inoculant",
    status: "Redeemed",
    statusText: "Redeemed (100% Free)",
    depot: "Iseyin Farmers Exchange",
    auditHash: "SHA256: 4a11..90",
    auditTime: "Today, 08:42 AM",
    amount: "Free Breeder Input",
  },
  {
    id: "BEN-03",
    name: "Rasheed Gbadamosi",
    nin: "6184-****-5529",
    coop: "Iseyin Savanna Maize Co-op",
    lga: "Iseyin East",
    perimeter: "3.0 Ha Polygon",
    programme: "NAGS-AP 50% Wet Season",
    packageDetails: "6x NPK + 3x Urea + 30kg Maize",
    status: "Issued",
    statusText: "Voucher Issued (USSD #*384*)",
    depot: "Oyo Agro-Chemicals Ltd",
    auditHash: "Pending OTP",
    auditTime: "Yesterday",
    amount: "₦168,000",
  },
  {
    id: "BEN-04",
    name: "Bilikisu Jimoh",
    nin: "3341-****-9811",
    coop: "Oyo South Agroforestry Syndicate",
    lga: "Afijio LGA",
    perimeter: "4.1 Ha Sentinel Validated",
    programme: "Climate Resilience Carbon Rebate",
    packageDetails: "₦45,000 / Ha Biochar Soil Prep",
    status: "Payout Ready",
    statusText: "Ready for Payout (₦184,500)",
    depot: "Direct NIBSS Co-op Wallet",
    auditHash: "SHA256: ee02..87",
    auditTime: "24 Mar 2026",
    amount: "₦184,500",
  },
];

export function GrantsHub(_props: ScreenProps) {
  const [activeTab, setActiveTab] = useState<"admin" | "farmer">("admin");
  const [programmeFilter, setProgrammeFilter] = useState("All Active Programmes (6 Windows)");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [newGrantCallOpen, setNewGrantCallOpen] = useState(false);
  const [batchAuthorizeOpen, setBatchAuthorizeOpen] = useState(false);
  const [inspectionDossierOpen, setInspectionDossierOpen] = useState(false);
  const [tranche3Open, setTranche3Open] = useState(false);
  const [disbursementModalOpen, setDisbursementModalOpen] = useState(false);
  const [videoLogOpen, setVideoLogOpen] = useState(false);
  const [depotsModalOpen, setDepotsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BeneficiaryRecord | null>(null);

  // New grant call form state
  const [newGrantForm, setNewGrantForm] = useState({
    title: "National Smallholder Pulses & Legumes Facility",
    donor: "AfDB & Federal Ministry of Agriculture (FMAFS)",
    budget: "150000000",
    maxPerHa: "85000",
    valueChain: "Soya & Cowpea",
    tenorMonths: "12",
  });

  // Filtered beneficiaries
  const filteredBeneficiaries = useMemo(() => {
    return INITIAL_BENEFICIARIES.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.coop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.depot.toLowerCase().includes(searchQuery.toLowerCase());

      const matchProg =
        programmeFilter === "All Active Programmes (6 Windows)" ||
        (programmeFilter.includes("NAGS-AP") && item.programme.includes("NAGS-AP")) ||
        (programmeFilter.includes("SAPZ") && item.programme.includes("SAPZ")) ||
        (programmeFilter.includes("OYSADEP") && item.programme.includes("OYSADEP")) ||
        (programmeFilter.includes("Climate") && item.programme.includes("Climate"));

      return matchSearch && matchProg;
    });
  }, [searchQuery, programmeFilter]);

  const handleExportCSV = () => {
    const csvHeader = "ID,Beneficiary,NIN,Cooperative,LGA,Perimeter,Programme,Package,Status,AgroDepot,Amount,AuditStamp,AuditTime\n";
    const csvRows = INITIAL_BENEFICIARIES.map(
      (b) =>
        `"${b.id}","${b.name}","${b.nin}","${b.coop}","${b.lga}","${b.perimeter}","${b.programme}","${b.packageDetails}","${b.status}","${b.depot}","${b.amount}","${b.auditHash}","${b.auditTime}"`
    ).join("\n");
    downloadFile("cultivanode-grants-redemption-ledger.csv", csvHeader + csvRows, "text/csv");
    showScreenToast("Export Complete", "Cultivanode Grants & e-Voucher ledger CSV downloaded successfully.");
  };

  const handleDownloadNAGSDossier = () => {
    const markdown = `# Federal NAGS-AP 2026 Early Rains Statutory Dossier
Accredited Node: #FG-AGR-881
Audit Cycle: Q1-2026 Sovereign Verified
Total Subsidized Pool: ₦280.00M | Released: ₦198.40M (70.8%)

## 1. Input Subsidy Window Breakdown
- Quota: 4 Bags NPK 20-10-10, 2 Bags Urea, 25kg Certified Seed per Hectare
- Cleared Smallholders: 2,150 Farmers (100% NIN & Cadastral Bounds)
- Depot Redemptions: 1,980 Vouchers (Saki Central & Iseyin Farmers Hub)

## 2. Cryptographic Attestation
- USSD Token Authentication: Merkle SHA-256 Engine
- Double Dipping Check: 0 Conflicts across NIRSAL CRG / Bank Anchor Registries
- Field Agronomist Sign-off: Q. Olapade (Lead Field Agronomist)
- FMAFS Sovereign Sign-off: Engr. Balogun (Desk Auditor)
`;
    downloadFile("cultivanode-nags-ap-dossier.md", markdown, "text/markdown");
    showScreenToast("NAGS Dossier Downloaded", "National Agricultural Growth Scheme dossier generated.");
  };

  const handleDownloadMacroImpact = () => {
    const markdown = `# SAPZ Macro Yield & Socioeconomic Impact Dossier #2026-B
Region: Oyo Savanna Basin (Saki West, Iseyin, Ibarapa)

## Key Performance Indicators
- Modeled Smallholder Productivity: 4.2 MT/Ha vs 3.0 MT control (+40.0%)
- Projected Harvest Wealth: ₦1,180,000,000 across 4,820 beneficiary hectares
- Off-take Pre-Contract Coverage: 84.2% Committed to Olam & Flour Mills of Nigeria
- Repayment / Cost-Share Health: 100% Zero-Default Co-op Escrow

## Infrastructure Deployment
- 38 Massey Ferguson 375 Tractors & Ripper Harrows
- 42 Solar Tube-Wells Energized across Iseyin & Saki
- COREN Attestation: #COR-NG-9042 GPS Logged
`;
    downloadFile("cultivanode-sapz-macro-impact-dossier.md", markdown, "text/markdown");
    showScreenToast("Impact Dossier Downloaded", "SAPZ Macro Impact report markdown file downloaded.");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        {/* Sovereign verification top banner */}
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
              <button
                type="button"
                className="text-secondary hover:text-primary transition-colors flex items-center p-0.5"
                title="Verify Sovereign Signature"
                onClick={() => showScreenToast("Audit Verified", "FMAFS Sovereign Certificate #FG-AGR-881 signed by Federal Comptroller.")}
              >
                <Icon name="verified" className="text-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* View toggle and primary actions */}
        <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg">
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-sm">
            <button
              className={`flex items-center gap-space-xs px-space-md py-1.5 rounded-lg font-label-lg text-label-lg transition-all ${
                activeTab === "admin"
                  ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              id="tab-admin"
              type="button"
              onClick={() => setActiveTab("admin")}
            >
              <Icon name="policy" className="text-[18px] text-primary" /> Programme Administrator &amp; Donor Desk
            </button>
            <button
              className={`flex items-center gap-space-xs px-space-md py-1.5 rounded-lg font-label-lg text-label-lg transition-all ${
                activeTab === "farmer"
                  ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              id="tab-farmer"
              type="button"
              onClick={() => {
                setActiveTab("farmer");
                showScreenToast("Beneficiary View", "Switched to Farmer & Co-operative Beneficiary View (4,820 Smallholders).");
              }}
            >
              <Icon name="groups_2" className="text-[18px] text-outline" /> Farmer &amp; Co-operative Beneficiary View
            </button>
          </div>
          <div className="flex items-center gap-space-sm">
            {_props.slots?.actions ?? (
              <>
                <div className="flex items-center bg-surface-container-lowest px-space-sm py-1.5 rounded-lg shadow-sm">
                  <Icon name="filter_list" className="text-[18px] text-outline mr-space-xs" />
                  <select
                    className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
                    value={programmeFilter}
                    onChange={(e) => setProgrammeFilter(e.target.value)}
                  >
                    <option>All Active Programmes (6 Windows)</option>
                    <option>National NAGS-AP (Dry &amp; Wet)</option>
                    <option>AfDB SAPZ Infrastructure</option>
                    <option>OYSADEP Clean Seed Multiplier</option>
                    <option>Global Climate Resilience Fund</option>
                  </select>
                </div>
                <button
                  className="flex items-center gap-space-xs px-space-md py-1.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-lg shadow-sm hover:bg-surface-container transition-all"
                  type="button"
                  onClick={handleExportCSV}
                >
                  <Icon name="cloud_download" className="text-[18px] text-secondary" /> Export Ledger (.CSV)
                </button>
                <button
                  className="flex items-center gap-space-xs px-space-md py-1.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-primary transition-all font-semibold"
                  type="button"
                  onClick={() => setNewGrantCallOpen(true)}
                >
                  <Icon name="assignment_add" className="text-[18px] text-secondary-fixed" /> New Grant Call / Allocation
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metric cards */}
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

        {/* Main portfolios and adjudication column */}
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

            {/* Federal NAGS-AP facility */}
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
                  <button
                    className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors font-medium"
                    type="button"
                    onClick={handleDownloadNAGSDossier}
                  >
                    Download NAGS Dossier
                  </button>
                  <button
                    className="px-space-md py-1.5 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md rounded-lg transition-colors font-semibold flex items-center gap-space-xs"
                    type="button"
                    onClick={() => setBatchAuthorizeOpen(true)}
                  >
                    <Icon name="done_all" className="text-[16px] text-secondary-fixed" /> Batch Authorize e-Vouchers
                  </button>
                </div>
              </div>
            </div>

            {/* AfDB SAPZ facility */}
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
                  <button
                    className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg transition-colors font-medium"
                    type="button"
                    onClick={() => setInspectionDossierOpen(true)}
                  >
                    Review Inspection Dossier
                  </button>
                  <button
                    className="px-space-md py-1.5 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-label-md rounded-lg transition-colors font-semibold"
                    type="button"
                    onClick={() => setTranche3Open(true)}
                  >
                    Trigger Tranche 3 (₦28.50M)
                  </button>
                </div>
              </div>
            </div>

            {/* OYSADEP and Green Climate facilities */}
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

          {/* Right sidebar: Adjudication Dossier and Field Telemetry */}
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
                <button
                  className="w-full py-2 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold shadow-sm flex items-center justify-center gap-space-xs transition-colors"
                  type="button"
                  onClick={() => setDisbursementModalOpen(true)}
                >
                  <Icon name="send_money" className="text-[18px] text-secondary-fixed" /> Authorize Batch Disbursement (₦34.80M)
                </button>
                <button
                  className="w-full py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg font-medium transition-colors text-center"
                  type="button"
                  onClick={() => setVideoLogOpen(true)}
                >
                  View Field Agent Video Verification Log
                </button>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Field Verification Telemetry</span>
                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">Live Feed</span>
              </div>
              <div className="relative w-full h-36 rounded-lg overflow-hidden mb-space-sm shadow-sm cursor-pointer" onClick={() => setVideoLogOpen(true)}>
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

        {/* Beneficiary e-Voucher & Input Redemption Ledger */}
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
                <input
                  className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder-outline w-56"
                  placeholder="Filter by NIN, Farmer, or Co-op..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg font-medium transition-colors"
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) {
                    showScreenToast("Audit Filter Applied", `Showing ${filteredBeneficiaries.length} records matching "${searchQuery}".`);
                  } else {
                    showScreenToast("Full Ledger Loaded", "All 4,820 Smallholder voucher records indexed.");
                  }
                }}
              >
                Audit Query
              </button>
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
                {filteredBeneficiaries.map((b, idx) => (
                  <tr
                    key={b.id}
                    className={`${idx % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface-container-low"} hover:bg-surface-container transition-colors cursor-pointer`}
                    onClick={() => setSelectedRecord(b)}
                  >
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">{b.name}</span>
                        <span className="font-label-sm text-label-sm text-outline font-mono">NIN: {b.nin}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-medium">{b.coop}</span>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">{b.lga}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex items-center gap-space-xs text-primary font-medium">
                        <Icon name="crop_free" className="text-[16px] text-secondary" />
                        <span>{b.perimeter}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="text-on-surface font-semibold">{b.programme}</span>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">{b.packageDetails}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span
                        className={`font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                          b.status === "Redeemed"
                            ? "bg-secondary-fixed text-on-secondary-fixed"
                            : b.status === "Issued"
                            ? "bg-tertiary-fixed text-on-tertiary-fixed"
                            : "bg-surface-variant text-on-surface-variant"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.status === "Redeemed" ? "bg-secondary" : b.status === "Issued" ? "bg-tertiary" : "bg-primary-container"
                          }`}
                        />
                        {b.statusText}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="text-on-surface">{b.depot}</span>
                    </td>
                    <td className="py-space-md px-space-md text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">{b.auditHash}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{b.auditTime}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lower row: Deployment matrix, fulfillment, and macro impact */}
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
              <button
                className="text-primary font-label-md text-label-md font-semibold hover:underline flex items-center gap-0.5"
                type="button"
                onClick={() => setDepotsModalOpen(true)}
              >
                Audit All 12 Depots <Icon name="chevron_right" className="text-[16px]" />
              </button>
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
              <button
                className="px-space-md py-1.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg font-semibold hover:bg-primary transition-colors flex items-center gap-space-xs"
                type="button"
                onClick={handleDownloadMacroImpact}
              >
                <Icon name="bar_chart" className="text-[16px] text-secondary-fixed" /> Full Impact Dossier
              </button>
            </div>
          </div>
        </div>

        {/* Modal 1: New Grant Call / Allocation */}
        {newGrantCallOpen && (
          <ScreenDialog
            title="New Grant Call &amp; Subsidy Facility Allocation"
            subtitle="Configure sovereign intervention pool, target LGA clusters, and eligibility criteria under FMAFS NAGS-AP protocol"
            onClose={() => setNewGrantCallOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Programme Title</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={newGrantForm.title}
                      onChange={(e) => setNewGrantForm({ ...newGrantForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Donor / Sovereign Window</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={newGrantForm.donor}
                      onChange={(e) => setNewGrantForm({ ...newGrantForm, donor: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Committed Pool (₦)</label>
                    <input
                      type="number"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={newGrantForm.budget}
                      onChange={(e) => setNewGrantForm({ ...newGrantForm, budget: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Max Subsidy / Hectare (₦)</label>
                    <input
                      type="number"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={newGrantForm.maxPerHa}
                      onChange={(e) => setNewGrantForm({ ...newGrantForm, maxPerHa: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Target Value Chain</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={newGrantForm.valueChain}
                      onChange={(e) => setNewGrantForm({ ...newGrantForm, valueChain: e.target.value })}
                    />
                  </div>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-label-sm font-semibold text-primary block mb-1">Statutory Verification Safeguards</span>
                  <div className="grid grid-cols-2 gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded accent-primary" />
                      <span>PostGIS Cadastral Polygon Validation</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded accent-primary" />
                      <span>NIN Biometric Deduplication</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded accent-primary" />
                      <span>USSD OTP Agro-Dealer Check-in</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded accent-primary" />
                      <span>Merkle Tree Payout Logging</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setNewGrantCallOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary-container transition-colors shadow-sm"
                    onClick={() => {
                      setNewGrantCallOpen(false);
                      showScreenToast(
                        "Grant Allocation Registered",
                        `Allocation of ₦${(Number(newGrantForm.budget) / 1000000).toFixed(2)}M created for ${newGrantForm.title}. Notification broadcast to co-operatives.`
                      );
                    }}
                  >
                    Publish Grant Facility Call
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal 2: Batch Authorize e-Vouchers */}
        {batchAuthorizeOpen && (
          <ScreenDialog
            title="Batch Authorize Input e-Vouchers (NAGS-AP)"
            subtitle="Release USSD redemption tokens for 170 smallholders across Saki West and Iseyin LGA depots"
            onClose={() => setBatchAuthorizeOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">Batch Volume: 170 Smallholder Vouchers</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block mt-0.5">Aggregate Subsidy Value: ₦19,108,000.00</span>
                  </div>
                  <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded-full">
                    Pre-cleared 100%
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs text-body-sm font-body-sm">
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Fertilizer Component (680 Bags NPK):</span>
                    <span className="font-bold text-on-surface">₦11,560,000.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Urea Component (340 Bags):</span>
                    <span className="font-bold text-on-surface">₦5,780,000.00</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-on-surface-variant">Hybrid Seed Component (4,250 kg):</span>
                    <span className="font-bold text-on-surface">₦1,768,000.00</span>
                  </div>
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setBatchAuthorizeOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
                    onClick={() => {
                      setBatchAuthorizeOpen(false);
                      showScreenToast("Tokens Dispatched", "170 USSD redemption tokens (*384*#) issued via Termii SMS gateway to farmers.");
                    }}
                  >
                    <Icon name="send" className="text-[16px]" /> Dispatch 170 Vouchers
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal 3: Inspection Dossier (AfDB SAPZ) */}
        {inspectionDossierOpen && (
          <ScreenDialog
            title="SAPZ Milestone 2 Technical Inspection Dossier"
            subtitle="COREN Engineering and Agronomic Field Attestation #COR-NG-9042"
            onClose={() => setInspectionDossierOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="bg-surface-container-low p-space-md rounded-lg">
                    <span className="font-label-sm text-label-sm text-outline uppercase">Syndicated Mechanization</span>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">38 MF 375 Tractors</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Inspected at Iseyin Cluster Central Yard. J1939 telematics CAN-bus connected with geofence lockout active.</p>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-lg">
                    <span className="font-label-sm text-label-sm text-outline uppercase">Solar Tube-Well Energization</span>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">42 Solar Wells Active</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Discharge rate: 12.5–18.0 m³/hr. Static water table tested between 14m and 22m depth across Oyo Savanna.</p>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface-variant flex items-center justify-between">
                  <span>COREN Supervising Engineer: Engr. M. B. Adeleke (COREN #R48201)</span>
                  <span className="font-semibold text-secondary">Verified GPS Timestamped</span>
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setInspectionDossierOpen(false)}>Close</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-secondary text-on-secondary font-label-md text-label-md rounded-lg font-bold hover:bg-secondary/90 transition-colors"
                    onClick={() => {
                      setInspectionDossierOpen(false);
                      setTranche3Open(true);
                    }}
                  >
                    Proceed to Tranche 3 Sign-off
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal 4: Tranche 3 Liquidation */}
        {tranche3Open && (
          <ScreenDialog
            title="SAPZ Tranche 3 Disbursement Authorization"
            subtitle="Release ₦28,500,000.00 capital grant liquidation to verified equipment vendors and contractors"
            onClose={() => setTranche3Open(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-md text-label-md text-on-surface-variant">Approved Facility</span>
                    <span className="font-label-md text-label-md text-primary font-bold">AfDB SAPZ Mechanization &amp; Wells</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-md text-label-md text-on-surface-variant">Amount to Liquidate</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold">₦28,500,000.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-label-md text-on-surface-variant">Escrow Custody</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Stanbic IBTC Agribusiness Custody</span>
                  </div>
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setTranche3Open(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-secondary text-on-secondary font-label-md text-label-md rounded-lg font-bold hover:bg-secondary/90 transition-colors shadow-sm"
                    onClick={() => {
                      setTranche3Open(false);
                      showScreenToast("Tranche 3 Released", "₦28,500,000.00 disbursed via NIBSS Settlement to vendor account. Ledger updated.");
                    }}
                  >
                    Authorize ₦28.50M Release
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal 5: Batch Disbursement #042 */}
        {disbursementModalOpen && (
          <ScreenDialog
            title="Adjudication Dossier #042 - Batch Payout Sign-off"
            subtitle="Authorizing ₦34,800,000.00 for Oke-Ogun Soya Alliance across 310 Smallholder Cadastral Polygons"
            onClose={() => setDisbursementModalOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Beneficiary Cluster:</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">Oke-Ogun Soya Alliance (310 Farmers)</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Validated Land Area:</span>
                    <span className="font-label-md text-label-md font-semibold text-primary">220.0 Hectares (Zero Overlap)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Disbursement Total:</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-secondary">₦34,800,000.00</span>
                  </div>
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setDisbursementModalOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary-container transition-colors shadow-sm"
                    onClick={() => {
                      setDisbursementModalOpen(false);
                      showScreenToast(
                        "Batch Payout Executed",
                        "₦34,800,000.00 disbursed to Oke-Ogun Soya Alliance Co-op Account. SMS notification broadcast to all 310 members."
                      );
                    }}
                  >
                    Sign &amp; Release Payout
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal 6: Video Verification Log */}
        {videoLogOpen && (
          <ScreenDialog
            title="Field Agent Biometric &amp; Cadastral Video Log"
            subtitle="Agent Babatunde K. · GPS: 8.019° N, 3.421° E · Saki West Cluster · Starlink Uplink #08"
            onClose={() => setVideoLogOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-sm">
                  <img
                    className="w-full h-full object-cover"
                    src="/images/screens/84eefa29f5c5.webp"
                    alt="Field video verification recording"
                  />
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-surface-container-lowest/90 flex items-center justify-center text-primary shadow-lg">
                      <Icon name="play_arrow" className="text-[36px]" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-primary/80 backdrop-blur-sm p-2 rounded-lg flex items-center justify-between text-on-primary font-label-sm text-label-sm">
                    <span>Camera: Rugged Tablet XT-4 · 1080p 30fps</span>
                    <span>EXIF GPS: 8.019° N, 3.421° E (±1.4m accuracy)</span>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface-variant">
                  <p>Attestation note: All 45 registered farmers in Saki West Village Block 3 had fingerprint templates matched against NIMC national biometric database in real-time. Zero phantom identities detected.</p>
                </div>
                <div className="flex justify-end gap-space-sm">
                  <ScreenDialogClose onClick={() => setVideoLogOpen(false)}>Close Log</ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* Modal 7: Audit All 12 Accredited Depots */}
        {depotsModalOpen && (
          <ScreenDialog
            title="Accredited Agro-Dealer Fulfillment Network (12 Depots)"
            subtitle="Live inventory balance, POS biometric synchronization, and subsidy redemption quota"
            onClose={() => setDepotsModalOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  <div className="p-space-md bg-surface-container-low rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Saki Central Depot</span>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">98% Redeemed</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">Premier Feeds &amp; Agro Limited</span>
                    <span className="font-label-sm text-label-sm text-primary block mt-1">Stock: 82 Bags NPK remaining</span>
                  </div>
                  <div className="p-space-md bg-surface-container-low rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Iseyin Farmers Exchange</span>
                      <span className="font-label-sm text-label-sm text-primary font-bold">94% Redeemed</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">Iseyin Farmers Agro-Hub Exchange</span>
                    <span className="font-label-sm text-label-sm text-primary block mt-1">Stock: 140 Bags Urea remaining</span>
                  </div>
                  <div className="p-space-md bg-surface-container-low rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Oyo High-Yield Chemicals</span>
                      <span className="font-label-sm text-label-sm text-tertiary-container font-bold">91% Redeemed</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">Oyo High-Yield Chemicals Ltd</span>
                    <span className="font-label-sm text-label-sm text-primary block mt-1">Stock: 310kg Certified Maize</span>
                  </div>
                  <div className="p-space-md bg-surface-container-low rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Ibarapa West Agro-Link</span>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">88% Redeemed</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">Eruwa Cooperative Depot</span>
                    <span className="font-label-sm text-label-sm text-primary block mt-1">Stock: 220 Bundles Cassava Stems</span>
                  </div>
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setDepotsModalOpen(false)}>Close</ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* Modal 8: Beneficiary Inspection Detail */}
        {selectedRecord && (
          <ScreenDialog
            title={`Beneficiary Voucher Dossier: ${selectedRecord.name}`}
            subtitle={`NIN: ${selectedRecord.nin} · Co-op: ${selectedRecord.coop} (${selectedRecord.lga})`}
            onClose={() => setSelectedRecord(null)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="grid grid-cols-2 gap-space-sm bg-surface-container-low p-space-md rounded-lg font-body-sm text-body-sm">
                  <div>
                    <span className="text-on-surface-variant block">Surveyed Parcel:</span>
                    <span className="font-bold text-on-surface">{selectedRecord.perimeter}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Subsidy Package:</span>
                    <span className="font-bold text-on-surface">{selectedRecord.packageDetails}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Agro-Depot Location:</span>
                    <span className="font-bold text-on-surface">{selectedRecord.depot}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Redemption Value:</span>
                    <span className="font-bold text-primary">{selectedRecord.amount}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-space-sm bg-surface-container-low rounded-lg text-label-sm font-label-sm">
                  <span className="text-on-surface-variant">Cryptographic Audit Stamp:</span>
                  <span className="font-mono font-bold text-secondary">{selectedRecord.auditHash} ({selectedRecord.auditTime})</span>
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setSelectedRecord(null)}>Close</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-semibold hover:bg-primary-container transition-colors"
                    onClick={() => {
                      showScreenToast("Voucher Re-sent", `USSD token SMS resent to farmer ${selectedRecord.name} on MTN/Airtel network.`);
                      setSelectedRecord(null);
                    }}
                  >
                    Resend USSD Token SMS
                  </button>
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
