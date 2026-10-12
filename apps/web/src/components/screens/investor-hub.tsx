"use client";

// Ported from the "investor_agricultural_investment_hub_9.5" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface TrancheDeal {
  id: string;
  ref: string;
  title: string;
  location: string;
  category: "all" | "grain" | "cassava" | "cashew" | "aquaculture";
  subscribedPct: number;
  tenor: string;
  projectedIrr: number;
  capitalSeeking: string;
  buyerContract: string;
  buyerName: string;
  security: string;
  closingDays: number;
  description: string;
}

const DEALS: TrancheDeal[] = [
  {
    id: "deal-1",
    ref: "#OPP-2026-01",
    title: "Oke-Ogun High-Yield Maize & Grain Aggregation Hub",
    location: "350 Ha Commercial Core + 450 Ha Outgrower Syndicate · Iseyin & Saki Valley, Oyo State",
    category: "grain",
    subscribedPct: 70,
    tenor: "18-Month Tenor",
    projectedIrr: 26.5,
    capitalSeeking: "₦350.0M",
    buyerContract: "₦480.0M",
    buyerName: "Grand Cereals Ltd.",
    security: "First-loss 75% NIRSAL CRG coverage · 850 MT grain silo debenture",
    closingDays: 12,
    description: "Multi-season aggregation scheme with forward contracts signed with premier industrial poultry feed producers.",
  },
  {
    id: "deal-2",
    ref: "#OPP-2026-02",
    title: "Psaltry Cassava Starch Outgrower Expansion",
    location: "Iseyin–Ado Awaye Industrial Agricultural Corridor, 600 Ha Aggregation Syndicate",
    category: "cassava",
    subscribedPct: 85,
    tenor: "12-Month Tenor",
    projectedIrr: 23.2,
    capitalSeeking: "₦280.0M",
    buyerContract: "₦325.0M Tripartite",
    buyerName: "Psaltry International Processing Factory",
    security: "CAMA Escrow Lien on intake weighbridge vouchers",
    closingDays: 5,
    description: "Export and domestic pharmaceutical-grade sorbitol and starch delivery contracts.",
  },
  {
    id: "deal-3",
    ref: "#OPP-2026-03",
    title: "Egba Lowland Mechanized Rice Syndicate",
    location: "Ogun River Basin Alluvial Lowlands, 400 Ha Direct Irrigation Scheme",
    category: "grain",
    subscribedPct: 45,
    tenor: "9-Month Crop Cycle",
    projectedIrr: 25.0,
    capitalSeeking: "₦190.0M",
    buyerContract: "Olam Agri Forward",
    buyerName: "Olam Agri Nigeria",
    security: "100% Laser-Leveled Alluvial Fields · PostGIS Cadastral Registry",
    closingDays: 19,
    description: "High-yield FARO-44 lowland paddy rice scheme with automated laser-guided water management.",
  },
];

export function InvestorHub({ lang }: ScreenProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [irrSort, setIrrSort] = useState<"desc" | "asc">("desc");
  const [tenorFilter, setTenorFilter] = useState<string>("all");

  // Modals
  const [selectedCommitDeal, setSelectedCommitDeal] = useState<TrancheDeal | null>(null);
  const [commitAmount, setCommitAmount] = useState<string>("25000000");
  const [commitCurrency, setCommitCurrency] = useState<"NGN" | "USD">("NGN");
  const [commitBank, setCommitBank] = useState<string>("Zenith Bank");
  const [showCadastralModal, setShowCadastralModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  const filteredDeals = DEALS.filter((d) => {
    if (activeCategory !== "all" && d.category !== activeCategory) return false;
    if (tenorFilter !== "all" && !d.tenor.toLowerCase().includes(tenorFilter)) return false;
    return true;
  }).sort((a, b) => {
    if (irrSort === "desc") return b.projectedIrr - a.projectedIrr;
    return a.projectedIrr - b.projectedIrr;
  });

  const handleDownloadDossier = (deal: TrancheDeal) => {
    const content = `# Due Diligence Investment Memorandum: ${deal.title}
Reference: ${deal.ref}
Regulatory Framework: SEC Nigeria / PenCom Regulated Agritech Framework (CAMA 2020)
Qualified Institutional Investor (QII) Syndicate Information Pack

## 1. Executive Summary
- Location: ${deal.location}
- Capital Seeking: ${deal.capitalSeeking}
- Projected Net IRR: ${deal.projectedIrr}% p.a.
- Underwriting Covenant: ${deal.buyerContract} (${deal.buyerName})
- Security Structure: ${deal.security}
- Allocation Status: ${deal.subscribedPct}% committed

## 2. Risk Mitigation & De-risking
- First-Loss Protection: NIRSAL Credit Risk Guarantee
- Escrow Custodian: Zenith Bank / Stanbic IBTC Trust
- Parametric Insurance: Leadway Assurance Weather Index Cover

Issued by CultivaNode Institutional Investor Desk.`;

    downloadFile(`due-diligence-${deal.ref.replace("#", "")}.md`, content, "text/markdown");
    showScreenToast(`Downloaded due diligence dossier for ${deal.ref}.`);
  };

  const handleDownloadFullPack = () => {
    const pack = `PORTFOLIO AUDIT & FINANCIAL REPORT (Q2 2026)
Consolidated Institutional AUM: ₦2.45 Billion ($1.68M USD)
Trailing Default Rate: 0.00% (Tripartite Escrow Swept)
Weighted Net IRR: 24.8% p.a.
Audited by: KPMG Nigeria (Reference #CIT-2026-FIRS-882)

Summary of Active Tranches:
1. Oke-Ogun Savanna Maize: ₦350.0M (26.5% Net IRR)
2. Psaltry Cassava Starch: ₦280.0M (23.2% Net IRR)
3. Egba Rice Syndicate: ₦190.0M (25.0% Net IRR)`;

    downloadFile("cultivanode-institutional-investor-pack.txt", pack, "text/plain");
    showScreenToast("Investor Audit & Financial Pack downloaded successfully.");
  };

  const handleConfirmCommitment = () => {
    if (!selectedCommitDeal) return;
    const ref = "INV-TRN-" + Math.floor(100000 + Math.random() * 900000);
    showScreenToast(
      `Capital commitment of ${commitCurrency === "NGN" ? "₦" : "$"}${Number(commitAmount).toLocaleString()} locked for ${selectedCommitDeal.ref}! Allocation ref: ${ref}`
    );
    setSelectedCommitDeal(null);
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="w-full bg-surface-container-low px-space-lg py-space-sm rounded-lg mb-space-md shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-sm text-label-sm font-label-sm text-on-surface-variant">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-container text-on-primary-container font-semibold">
                <Icon name="verified_user" filled className="text-[15px]" /> SEC Nigeria / PenCom Regulated Agritech Framework
              </span>
              <span className="text-outline">/</span>
              <span className="font-medium text-on-surface">Closed Qualified Institutional Investor (QII) Window</span>
              <span className="text-outline">/</span>
              <span>CAMA 2020 Asset-Backed Syndications</span>
              <span className="text-outline">/</span>
              <span className="inline-flex items-center gap-1 text-secondary font-medium">
                <Icon name="lock" className="text-[14px]" /> Audit Stamp: #SEC-AGR-2026-Q2
              </span>
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
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                    {filteredDeals.length} Open Tranches
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTenorFilter((t) => (t === "all" ? "12-month" : "all"));
                      showScreenToast(tenorFilter === "all" ? "Filtering by 12-Month Tenors." : "Tenor filter cleared.");
                    }}
                    className={`px-space-sm py-1 rounded font-label-sm text-label-sm flex items-center gap-1 transition-colors cursor-pointer ${tenorFilter !== "all" ? "bg-primary text-on-primary font-bold" : "bg-surface-container-low hover:bg-surface-container text-on-surface"}`}
                    type="button"
                  >
                    <Icon name="tune" className="text-[16px]" /> Filter Tenor
                  </button>
                  <button
                    onClick={() => {
                      const next = irrSort === "desc" ? "asc" : "desc";
                      setIrrSort(next);
                      showScreenToast(`Sorted by IRR: ${next === "desc" ? "Highest First" : "Lowest First"}`);
                    }}
                    className="px-space-sm py-1 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors cursor-pointer"
                    type="button"
                  >
                    <Icon name="sort" className="text-[16px]" /> IRR {irrSort === "desc" ? "Descending" : "Ascending"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-space-xs overflow-x-auto pb-1 text-label-sm font-label-sm no-scrollbar">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-space-md py-1.5 rounded-lg whitespace-nowrap shadow-sm cursor-pointer ${activeCategory === "all" ? "bg-primary-container text-on-primary font-semibold" : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium"}`}
                  type="button"
                >
                  All Opportunities ({DEALS.length})
                </button>
                <button
                  onClick={() => setActiveCategory("grain")}
                  className={`px-space-md py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${activeCategory === "grain" ? "bg-primary-container text-on-primary font-semibold" : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium"}`}
                  type="button"
                >
                  Grain &amp; Silo Infra (2)
                </button>
                <button
                  onClick={() => setActiveCategory("cassava")}
                  className={`px-space-md py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${activeCategory === "cassava" ? "bg-primary-container text-on-primary font-semibold" : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium"}`}
                  type="button"
                >
                  Cassava Industrial (1)
                </button>
                <button
                  onClick={() => {
                    setActiveCategory("cashew");
                    showScreenToast("Export Cashew & Oil Palm syndication pipeline opens in Q3.");
                  }}
                  className={`px-space-md py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${activeCategory === "cashew" ? "bg-primary-container text-on-primary font-semibold" : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium"}`}
                  type="button"
                >
                  Export Cashew &amp; Oil Palm
                </button>
              </div>
            </div>

            {filteredDeals.map((deal) => (
              <div key={deal.id} className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
                <div className="flex flex-wrap items-start justify-between gap-space-sm">
                  <div className="flex flex-col max-w-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">{deal.ref}</span>
                      <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {deal.subscribedPct}% Subscribed
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">{deal.tenor}</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">{deal.title}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{deal.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Projected Net IRR</div>
                    <div className="font-metric-num text-metric-num text-secondary">
                      {deal.projectedIrr}% <span className="font-label-sm text-label-sm text-on-surface">p.a.</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm bg-surface-container-low p-space-md rounded-lg">
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Capital Seeking</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{deal.capitalSeeking}</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Forward Off-take</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{deal.buyerContract}</span>
                    <span className="font-label-sm text-label-sm text-secondary block mt-0.5">{deal.buyerName}</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Security / Guarantee</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold">NIRSAL / Lien</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Closing Window</span>
                    <span className="font-headline-sm text-headline-sm text-tertiary font-bold">{deal.closingDays} Days Left</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                    <span>Syndication Progress</span>
                    <span>{deal.subscribedPct}% of target subscribed</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${deal.subscribedPct}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <button
                      onClick={() => handleDownloadDossier(deal)}
                      className="px-space-md py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-lg text-label-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      type="button"
                    >
                      <Icon name="description" className="text-[18px]" /> Review Due Diligence Dossier (.pdf)
                    </button>
                    <button
                      onClick={() => setShowCadastralModal(true)}
                      className="px-space-sm py-2 rounded-lg text-on-surface-variant hover:text-primary font-label-sm text-label-sm flex items-center gap-1 cursor-pointer"
                      type="button"
                    >
                      <Icon name="share_location" className="text-[18px]" /> View Cadastral Map
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedCommitDeal(deal)}
                    className="px-space-lg py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                    type="button"
                  >
                    <Icon name="add_circle" className="text-[20px]" /> Commit Capital Allocation (₦)
                  </button>
                </div>
              </div>
            ))}
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
                <div
                  className="bg-cover bg-center w-full h-48 relative flex flex-col justify-between p-space-md"
                  data-alt="Sentinel-2 satellite imagery of agricultural maize farmland in Oke-Ogun savanna Nigeria"
                  style={{ backgroundImage: "url('/images/screens/c69d185c76f9.webp')" }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="px-2.5 py-1 rounded bg-inverse-surface/90 text-inverse-on-surface font-label-sm text-label-sm flex items-center gap-1.5 backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" /> Sentinel-2 Polling: 4h Ago
                    </span>
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
                    <button
                      onClick={() => setShowCadastralModal(true)}
                      className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold shadow-md hover:bg-primary-container transition-colors cursor-pointer"
                      type="button"
                    >
                      Inspect Parcel Map
                    </button>
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
                    <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Active Locked
                    </span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">Zenith Bank Escrow</span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline">Parametric Cover</span>
                    <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Leadway Insured
                    </span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">Drought &amp; Flood Yield</span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline">Side-Selling Drift</span>
                    <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 0 Deviations
                    </span>
                    <span className="text-[11px] text-on-surface-variant mt-0.5">350 Ha Polygon Lock</span>
                  </div>
                </div>
              </div>

              <div className="pt-space-xs">
                <button
                  onClick={handleDownloadFullPack}
                  className="w-full py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  type="button"
                >
                  <Icon name="download" className="text-[20px]" /> Download Investor Audit &amp; Financial Pack (.xlsx / .pdf)
                </button>
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
                <Link className="font-label-sm text-label-sm text-primary font-bold hover:underline flex items-center gap-1" href={`/${lang}/marketplace`}>
                  Open Trading Desk <Icon name="arrow_forward" className="text-[14px]" />
                </Link>
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
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> Active
                </span>
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
              <button
                onClick={() => setShowLedgerModal(true)}
                className="px-3 py-1 rounded bg-surface-container-low hover:bg-surface-container text-primary font-bold cursor-pointer"
                type="button"
              >
                View Full Ledger (§9.5)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Capital Commitment Modal */}
      {selectedCommitDeal && (
        <ScreenDialog
          title={`Commit Capital Allocation: ${selectedCommitDeal.ref}`}
          subtitle={`Underwrite Tranche in ${selectedCommitDeal.title}`}
          onClose={() => setSelectedCommitDeal(null)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-1.5">
                <div className="flex justify-between text-body-sm">
                  <span>Projected Net IRR:</span>
                  <span className="font-bold text-secondary">{selectedCommitDeal.projectedIrr}% p.a.</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span>Buyer Forward Contract:</span>
                  <span className="font-bold text-primary">{selectedCommitDeal.buyerContract}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span>Security Collateral:</span>
                  <span className="font-semibold text-on-surface">{selectedCommitDeal.security}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">Denomination</label>
                  <select
                    value={commitCurrency}
                    onChange={(e) => setCommitCurrency(e.target.value as "NGN" | "USD")}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  >
                    <option value="NGN">NGN (Nigerian Naira)</option>
                    <option value="USD">USD (US Dollar Equivalent)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">Allocation Amount</label>
                  <input
                    type="number"
                    value={commitAmount}
                    onChange={(e) => setCommitAmount(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm font-semibold">Institutional Custody Escrow Partner</label>
                <select
                  value={commitBank}
                  onChange={(e) => setCommitBank(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                >
                  <option value="Zenith Bank">Zenith Bank Agritech Custody Vault</option>
                  <option value="Stanbic IBTC">Stanbic IBTC Institutional Trustees</option>
                  <option value="Providus Bank">Providus Bank Direct NIBSS Escrow</option>
                </select>
              </div>

              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setSelectedCommitDeal(null)}>Cancel</ScreenDialogClose>
                <button
                  onClick={handleConfirmCommitment}
                  className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md font-bold cursor-pointer"
                  type="button"
                >
                  Lock Allocation &amp; Authorize Escrow Call
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Cadastral Map Modal */}
      {showCadastralModal && (
        <ScreenDialog
          title="Cadastral Parcel GIS Monitor"
          subtitle="Sentinel-2 Multi-spectral Polygons (Oyo & Ogun Agrarian Belts)"
          onClose={() => setShowCadastralModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="w-full h-80 rounded-xl bg-surface-container relative overflow-hidden flex items-center justify-center">
                <img src="/images/screens/c69d185c76f9.webp" alt="Cadastral Map" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/20 flex flex-col justify-between p-space-md">
                  <div className="flex justify-between items-center">
                    <span className="bg-surface-container-lowest/90 px-3 py-1 rounded text-primary font-bold text-label-sm shadow">
                      Mean NDVI: 0.79 (Optimal Vigor)
                    </span>
                    <span className="bg-surface-container-lowest/90 px-2 py-1 rounded text-secondary font-mono text-xs shadow">
                      Zero Side-Selling
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-space-xs">
                <ScreenDialogClose onClick={() => setShowCadastralModal(false)}>Close GIS Inspector</ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* Ledger Modal */}
      {showLedgerModal && (
        <ScreenDialog
          title="Consolidated Statutory Audit Ledger (§9.5)"
          subtitle="KPMG Nigeria Audited Accounts (Tax Clearance #CIT-2026-FIRS-882)"
          onClose={() => setShowLedgerModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="bg-surface-container-low p-space-md rounded-xl space-y-2 text-body-sm">
                <div className="flex justify-between font-bold border-b pb-1">
                  <span>Tranche Identifier</span>
                  <span>Disbursed</span>
                  <span>Recovered</span>
                  <span>Net Return</span>
                </div>
                <div className="flex justify-between">
                  <span>#TR-2025-01 Maize Early</span>
                  <span>₦420,000,000</span>
                  <span>₦528,000,000</span>
                  <span className="text-secondary font-bold">+25.7%</span>
                </div>
                <div className="flex justify-between">
                  <span>#TR-2025-02 Cassava Outgrowers</span>
                  <span>₦310,000,000</span>
                  <span>₦384,000,000</span>
                  <span className="text-secondary font-bold">+23.8%</span>
                </div>
                <div className="flex justify-between">
                  <span>#TR-2025-03 Rice Lowland Scheme</span>
                  <span>₦280,000,000</span>
                  <span>₦348,000,000</span>
                  <span className="text-secondary font-bold">+24.3%</span>
                </div>
              </div>
              <div className="flex justify-end pt-space-xs">
                <ScreenDialogClose onClick={() => setShowLedgerModal(false)}>Close Ledger</ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
