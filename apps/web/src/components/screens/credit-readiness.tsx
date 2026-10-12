"use client";

// Ported from the "verified_farm_record_credit_readiness_9.1_9.6" design.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface SeasonRecord {
  season: string;
  cropArea: string;
  yieldMT: string;
  salesNGN: string;
  costNGN: string;
  netMargin: string;
  dscr: string;
  status: string;
}

const SEASONS_DATA: SeasonRecord[] = [
  {
    season: "2025 Late Rains (Oct - Jan)",
    cropArea: "Yellow Maize (SAMMAZ-52) · 25.0 Ha",
    yieldMT: "112.5 MT (4.5 MT/Ha)",
    salesNGN: "₦47,250,000",
    costNGN: "₦18,200,000",
    netMargin: "₦29,050,000 (61.5%)",
    dscr: "2.85x",
    status: "100% Escrow Cleared",
  },
  {
    season: "2025 Early Rains (May - Aug)",
    cropArea: "Cassava (TME-419) · 17.5 Ha",
    yieldMT: "399.0 MT (22.8 MT/Ha)",
    salesNGN: "₦45,885,000",
    costNGN: "₦16,400,000",
    netMargin: "₦29,485,000 (64.3%)",
    dscr: "2.60x",
    status: "Factory Weighbridge Matched",
  },
  {
    season: "2024 Late Rains (Oct - Jan)",
    cropArea: "Non-GMO Soybean · 20.0 Ha",
    yieldMT: "44.0 MT (2.2 MT/Ha)",
    salesNGN: "₦29,920,000",
    costNGN: "₦12,100,000",
    netMargin: "₦17,820,000 (59.6%)",
    dscr: "2.15x",
    status: "Audited & Certified",
  },
  {
    season: "2024 Early Rains (May - Aug)",
    cropArea: "Yellow Maize (SAMMAZ-15) · 22.5 Ha",
    yieldMT: "92.2 MT (4.1 MT/Ha)",
    salesNGN: "₦34,114,000",
    costNGN: "₦14,300,000",
    netMargin: "₦19,814,000 (58.1%)",
    dscr: "1.98x",
    status: "Historical Closed",
  },
];

export function CreditReadiness({ lang, slots }: ScreenProps<"actions">) {
  // Modal states
  const [isRequestAuditOpen, setIsRequestAuditOpen] = useState(false);
  const [isManageConsentOpen, setIsManageConsentOpen] = useState(false);
  const [isUploadTcnOpen, setIsUploadTcnOpen] = useState(false);
  const [isFilterSeasonsOpen, setIsFilterSeasonsOpen] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState<string>("ALL");
  const [isAgronomicMemoOpen, setIsAgronomicMemoOpen] = useState(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<{ title: string; subtitle: string; content: React.ReactNode } | null>(null);

  // Institution access statuses
  const [sterlingAccessRevoked, setSterlingAccessRevoked] = useState(false);
  const [nirsalStatus, setNirsalStatus] = useState<"pending" | "approved" | "declined">("pending");

  const filteredSeasons = SEASONS_DATA.filter((s) => {
    if (seasonFilter === "ALL") return true;
    return s.season.includes(seasonFilter);
  });

  const handleDownloadDossier = () => {
    const dossier = {
      title: "CultivaNode Statutory §9.1 & §9.6 Credit Readiness Dossier",
      farmerName: "Babatunde G. Lawal (Adekunle Farmland Cooperative)",
      farmLocation: "Iseyin, Oyo State (7.9625° N, 3.5936° E)",
      cadastralAreaHa: 42.5,
      auditIntegrityScore: "94.2% Class A Evidence",
      debtServiceCoverageRatio: "2.42x",
      cumulativeRevenueNGN: 62450000,
      activeEscrowSettledRatio: "100%",
      seasonsRecorded: 4,
      leadwayInsurancePolicy: "#LWY-992-MPO",
      merkleProvenanceHash: "0x9b4f...8a22d",
      statutoryCompliance: "NDPA 2023 §31, CBN / NIRSAL Standard",
      generatedAt: new Date().toISOString(),
    };
    downloadFile(JSON.stringify(dossier, null, 2), `CultivaNode_Credit_Readiness_Dossier_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    showScreenToast("Downloaded Credit Underwriting Dossier (JSON).");
  };

  const handleExportCSV = () => {
    const csvHeader = "Season,Crop_Area,Yield,Gross_Sales_NGN,Operating_Cost_NGN,Net_Margin,DSCR,Status\n";
    const csvRows = SEASONS_DATA.map(
      (s) => `"${s.season}","${s.cropArea}","${s.yieldMT}","${s.salesNGN}","${s.costNGN}","${s.netMargin}","${s.dscr}","${s.status}"`
    ).join("\n");
    downloadFile(csvHeader + csvRows, `Multi_Season_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showScreenToast("Exported Multi-Season Production & Settlement Ledger (CSV).");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-space-lg mb-space-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs max-w-3xl">
              <div className="flex items-center gap-space-sm">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold tracking-wide uppercase">Statutory §9.1 &amp; §9.6 Dossier</span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold"><Icon name="lock" className="text-[14px]" /> Tamper-Evident SHA-256 Ledger</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Verified Farm Record &amp; Credit Readiness Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Consent-governed cryptographic farm ledger, counterparty-corroborated harvest histories, and multi-tier creditworthiness underwriting dossier. Formalized for institutional agricultural lending without opaque algorithmic scoring.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
              {slots?.actions ?? (
                <>
                  <button
                    onClick={() => setIsRequestAuditOpen(true)}
                    className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors font-label-lg text-label-lg shadow-sm"
                    type="button"
                  >
                    <Icon name="verified_user" className="text-[18px] text-primary" />
                    <span>Request Audit</span>
                  </button>
                  <button
                    onClick={() => setIsManageConsentOpen(true)}
                    className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors font-label-lg text-label-lg shadow-sm"
                    type="button"
                  >
                    <Icon name="vpn_key" className="text-[18px] text-tertiary" />
                    <span>Manage Consent</span>
                  </button>
                  <button
                    onClick={handleDownloadDossier}
                    className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-label-lg text-label-lg shadow-sm"
                    type="button"
                  >
                    <Icon name="picture_as_pdf" className="text-[18px] text-primary-fixed" />
                    <span>Download Underwriting Dossier</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-secondary-fixed/50 flex items-center justify-center shrink-0">
                <Icon name="verified" className="text-secondary text-[22px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Data Privacy Protocol</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">NDPA 2023 Consent-Controlled</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-primary-fixed/40 flex items-center justify-center shrink-0">
                <Icon name="account_balance" className="text-primary text-[22px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Regulatory Compliance</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">CBN / NIRSAL Standard</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center shrink-0">
                <Icon name="shield_with_heart" className="text-tertiary text-[22px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Risk Architecture</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">Leadway Multi-Peril Scored</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <Icon name="dataset" className="text-primary text-[22px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Integrity Anchor</span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate">SHA-256 Merkle Provenance</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-space-md mb-space-xl">
          <div className="xl:col-span-2 p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit Integrity Level</span>
                <span className="font-headline-lg text-headline-lg text-primary mt-space-xs">94.2% Verified</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Class A Evidence</span>
            </div>
            <div className="my-space-md flex flex-col gap-space-xs">
              <div className="w-full bg-surface-container-low rounded-full h-2.5 overflow-hidden flex">
                <div className="bg-primary h-full" style={{ width: "78%" }} title="78% Counterparty Corroborated" />
                <div className="bg-secondary h-full" style={{ width: "16%" }} title="16% Document Verified" />
                <div className="bg-tertiary-fixed-dim h-full" style={{ width: "6%" }} title="6% Self-Reported" />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />78% Counterparty</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary inline-block" />16% Documented</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim inline-block" />6% Self-Log</span>
              </div>
            </div>
            <div className="pt-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
              <span>Historical Dataset Size</span>
              <span className="font-semibold text-on-surface">318 Event Blocks</span>
            </div>
          </div>
          <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Multi-Season History</span>
              <Icon name="calendar_month" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <span className="font-metric-num text-metric-num text-on-surface block leading-none">4 Seasons</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">Consecutive cultivation cycles</span>
            </div>
            <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary">
              <Icon name="check_circle" className="text-[16px]" />
              <span>2024E → 2026E (Active)</span>
            </div>
          </div>
          <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Verified Revenue</span>
              <Icon name="monetization_on" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <span className="font-metric-num text-metric-num text-on-surface block leading-none">₦62.45M</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">Reconciled cumulative sales</span>
            </div>
            <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary">
              <Icon name="account_balance_wallet" className="text-[16px]" />
              <span>100% Settled via Escrow</span>
            </div>
          </div>
          <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Coverage Ratio (DSCR)</span>
              <Icon name="analytics" className="text-[20px] text-primary" />
            </div>
            <div className="my-space-sm">
              <span className="font-metric-num text-metric-num text-primary block leading-none">2.42x</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">Min. benchmark: 1.25x</span>
            </div>
            <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary">
              <Icon name="trending_up" className="text-[16px]" />
              <span>Low-Risk Underwriting Band</span>
            </div>
          </div>
          <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Lending Tier</span>
              <Icon name="military_tech" className="text-[20px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <span className="font-metric-num text-metric-num text-secondary block leading-none">Tier 3</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">Institutional Prime Access</span>
            </div>
            <div className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
              <span>Up to ₦25,000,000 Facility</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Credit Readiness Matrix (§9.6)</span>
                <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold">5 of 6 Satisfied</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-space-xs">Pillars of Empirical Creditworthiness</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Objective underwriting criteria corroborated by third-party off-takers, commercial banks, and spatial imagery.</p>
              <div className="flex flex-col gap-space-sm">
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Cadastral Land Tenure &amp; Geofenced Boundary</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">42.5 Ha verified GPS polygon · Cadastral survey registry #OYO-ISE-2023-887 with Baale Attestation.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Verified</span>
                    <button
                      onClick={() =>
                        setDetailModal({
                          title: "Cadastral Land Tenure Attestation",
                          subtitle: "Survey Registry #OYO-ISE-2023-887",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Survey ID:</strong> OY/ISY/C-4428/2023</div>
                              <div><strong>Area:</strong> 42.5 Hectares (Boundary walk verified)</div>
                              <div><strong>Baale Endorsement:</strong> High Chief Adekunle of Iseyinland</div>
                              <div><strong>Coordinates:</strong> 7.9625° N, 3.5936° E</div>
                            </div>
                          ),
                        })
                      }
                      className="text-on-surface-variant hover:text-primary p-1"
                      type="button"
                    >
                      <Icon name="attachment" className="text-[18px]" />
                    </button>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">3-Year Empirical Yield &amp; Weighbridge Corroboration</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Historical avg: Maize 4.2 MT/Ha, Cassava 22.8 MT/Ha. All supported by certified off-taker tickets.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Verified</span>
                    <button
                      onClick={() =>
                        setDetailModal({
                          title: "Weighbridge Corroboration Tickets",
                          subtitle: "Certified off-taker intake weighbridge slips",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Ticket 1:</strong> #WB-2025-0819 · Grand Cereals (112.5 MT Maize)</div>
                              <div><strong>Ticket 2:</strong> #WB-2025-0442 · Psaltry PLC (399.0 MT Cassava)</div>
                              <div><strong>Average Moisture:</strong> 12.6% (Zero deductions applied)</div>
                            </div>
                          ),
                        })
                      }
                      className="text-on-surface-variant hover:text-primary p-1"
                      type="button"
                    >
                      <Icon name="receipt_long" className="text-[18px]" />
                    </button>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Double-Entry Ledger &amp; Settlement Reconciliation</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">CultivaNode Farm Books fully reconciled against Zenith Bank Commercial Statement (Account #...0914).</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Verified</span>
                    <button
                      onClick={() =>
                        setDetailModal({
                          title: "Double-Entry Bank Reconciliation",
                          subtitle: "Zenith Bank Escrow Statement Matching",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Zenith Bank Statement:</strong> Account #1029380914</div>
                              <div><strong>Reconciled Volume:</strong> ₦62,450,000.00</div>
                              <div><strong>Discrepancy Variance:</strong> ₦0.00 (Zero variance)</div>
                            </div>
                          ),
                        })
                      }
                      className="text-on-surface-variant hover:text-primary p-1"
                      type="button"
                    >
                      <Icon name="sync_alt" className="text-[18px]" />
                    </button>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">CAMA 2020 Enforceable Offtake Contracts</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Tripartite escrow delivery history with Psaltry International &amp; Grand Cereals. Zero defaults recorded.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Verified</span>
                    <button
                      onClick={() =>
                        setDetailModal({
                          title: "CAMA 2020 Offtake Agreement Contracts",
                          subtitle: "Tripartite Escrow Forward Supply Contracts",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Counterparties:</strong> Psaltry PLC, Grand Cereals, Olam Agri</div>
                              <div><strong>Legal Status:</strong> Valid and enforceable under Nigerian Law</div>
                              <div><strong>Default History:</strong> 0 defaults across 6 contracts</div>
                            </div>
                          ),
                        })
                      }
                      className="text-on-surface-variant hover:text-primary p-1"
                      type="button"
                    >
                      <Icon name="gavel" className="text-[18px]" />
                    </button>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="verified" className="text-secondary text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">Collateral &amp; Insurance Protection Structure</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Active Multi-Peril Policy #LWY-992 (Leadway Assurance) + Certified Warehouse Receipt #WR-2025-41 (85 MT).</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed/70 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Active Policy</span>
                    <button
                      onClick={() =>
                        setDetailModal({
                          title: "Insurance & Collateral Structure",
                          subtitle: "Leadway Assurance Policy #LWY-992",
                          content: (
                            <div className="space-y-2 text-sm">
                              <div><strong>Policy Ref:</strong> #LWY-992-MPO (Multi-Peril Crop Insurance)</div>
                              <div><strong>Underwriter:</strong> Leadway Assurance Company Ltd</div>
                              <div><strong>Warehouse Receipt:</strong> #WR-2025-41 (85 MT Maize in Iseyin Silo)</div>
                            </div>
                          ),
                        })
                      }
                      className="text-on-surface-variant hover:text-primary p-1"
                      type="button"
                    >
                      <Icon name="verified_user" className="text-[18px]" />
                    </button>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm">
                    <Icon name="pending_actions" className="text-on-tertiary-container text-[22px] mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">2025 Audited Tax Clearance &amp; Joint Liability Sign-off</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Required to unlock Level 4 Prime Lending (Sub-9% Single Digit Interest Window).</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">Pending Action</span>
                    <button
                      onClick={() => setIsUploadTcnOpen(true)}
                      className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container"
                      type="button"
                    >
                      Upload TCN
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-space-md p-space-sm bg-surface-container rounded-lg flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5"><Icon name="info" className="text-[16px] text-primary" /> Underwriting scores are completely transparent: Zero artificial algorithms or black-box rating penalties applied.</span>
              <Link className="font-label-sm text-label-sm font-semibold text-primary hover:underline" href={`/${lang}/legal`}>Read Audit Methodology</Link>
            </div>
          </div>

          <div className="lg:col-span-4 bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Geospatial Validation</span>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Cadastral Active</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">Iseyin Savanna Cluster Parcel</h2>
              <div className="w-full h-44 rounded-lg bg-cover bg-center relative overflow-hidden mb-space-md shadow-sm" data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/659c2df88d78.webp')" }}>
                <div className="absolute inset-0 bg-primary/20" />
                <div className="absolute top-2 left-2 px-2 py-1 bg-surface/90 rounded text-on-surface font-label-sm text-label-sm backdrop-blur flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> 42.5 Hectares Validated</div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-primary text-on-primary rounded font-label-sm text-label-sm shadow">GPS: 7.9625° N, 3.5936° E</div>
              </div>
              <div className="flex flex-col gap-space-xs text-body-sm font-body-sm">
                <div className="flex justify-between py-1 bg-surface-container-low px-space-sm rounded">
                  <span className="text-on-surface-variant">Survey Register ID</span>
                  <span className="font-semibold text-on-surface">OY/ISY/C-4428/2023</span>
                </div>
                <div className="flex justify-between py-1 px-space-sm">
                  <span className="text-on-surface-variant">Soil Organic Matter (SOM)</span>
                  <span className="font-semibold text-secondary">2.82% (Optimal Savanna)</span>
                </div>
                <div className="flex justify-between py-1 bg-surface-container-low px-space-sm rounded">
                  <span className="text-on-surface-variant">NDVI Remote Biomass</span>
                  <span className="font-semibold text-on-surface">0.78 (Sentinel-2 VHR)</span>
                </div>
                <div className="flex justify-between py-1 px-space-sm">
                  <span className="text-on-surface-variant">Leadway Insurance Policy</span>
                  <span className="font-semibold text-primary">#LWY-992-MPO (Fully Paid)</span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm text-label-sm">Supervising Agronomist</span>
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">Q. Olapade (NIN: 7291...33)</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm mb-space-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm mb-space-md">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Audit-Ready Empirical Farming History</span>
              <h2 className="font-headline-md text-headline-md text-primary">Multi-Season Production &amp; Settlement Ledger (§9.1)</h2>
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                onClick={() => setIsFilterSeasonsOpen(true)}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1"
                type="button"
              >
                <Icon name="filter_list" className="text-[16px]" />
                <span>Filter Seasons {seasonFilter !== "ALL" ? `(${seasonFilter})` : ""}</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1"
                type="button"
              >
                <Icon name="file_download" className="text-[16px]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-sm px-space-md rounded-l">Season / Cycle</th>
                  <th className="py-space-sm px-space-md">Cultivated Crop &amp; Area</th>
                  <th className="py-space-sm px-space-md text-right">Harvest Yield</th>
                  <th className="py-space-sm px-space-md text-right">Gross Sales</th>
                  <th className="py-space-sm px-space-md text-right">Operating Cost</th>
                  <th className="py-space-sm px-space-md text-right">Net Farm Margin</th>
                  <th className="py-space-sm px-space-md text-center">DSCR</th>
                  <th className="py-space-sm px-space-md rounded-r text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10 text-body-sm font-body-sm">
                {filteredSeasons.map((s, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-space-md font-semibold text-on-surface">{s.season}</td>
                    <td className="py-3 px-space-md text-on-surface-variant">{s.cropArea}</td>
                    <td className="py-3 px-space-md text-right font-medium text-on-surface">{s.yieldMT}</td>
                    <td className="py-3 px-space-md text-right font-semibold text-primary">{s.salesNGN}</td>
                    <td className="py-3 px-space-md text-right text-on-surface-variant">{s.costNGN}</td>
                    <td className="py-3 px-space-md text-right font-bold text-secondary">{s.netMargin}</td>
                    <td className="py-3 px-space-md text-center">
                      <span className="px-2 py-0.5 rounded bg-secondary-fixed/50 text-on-secondary-fixed font-bold font-mono text-xs">{s.dscr}</span>
                    </td>
                    <td className="py-3 px-space-md text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                        <Icon name="verified" className="text-sm" /> {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm mb-space-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm pb-space-md mb-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Granular NDPA 2023 Controls</span>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Farmer Sovereign Consent</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mt-0.5">Consent &amp; Institutional Data-Sharing Authorization (§9.1)</h2>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="text-body-sm font-body-sm text-on-surface-variant">Active External Consents: <strong className="text-on-surface">2</strong></span>
              <button
                onClick={() => setIsAuditTrailOpen(true)}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1"
                type="button"
              >
                <Icon name="history" className="text-[16px]" />
                <span>Complete Audit Trail</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-md">
            <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">Sterling Bank Agri-Finance</span>
                  <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${sterlingAccessRevoked ? "bg-error-container text-on-error-container" : "bg-secondary-fixed text-on-secondary-fixed"}`}>
                    {sterlingAccessRevoked ? "Revoked" : "Active"}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mb-space-sm">Purpose: Working Capital Loan Requisition (₦15.0M facility)</span>
                <div className="flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant bg-surface-container-lowest p-space-sm rounded">
                  <div className="flex justify-between">
                    <span>Authorized Scope:</span>
                    <span className="font-semibold text-on-surface">4-Season Production &amp; Bank Logs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeframe:</span>
                    <span className="text-primary font-semibold">Expires in 18 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Type:</span>
                    <span className="text-on-surface font-semibold">Read-Only (PDF + API)</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between">
                <button
                  onClick={() => {
                    setSterlingAccessRevoked((prev) => !prev);
                    showScreenToast(sterlingAccessRevoked ? "Re-activated Sterling Bank access" : "Revoked Sterling Bank access to farm records");
                  }}
                  className={`font-label-sm text-label-sm font-semibold hover:underline flex items-center gap-1 ${sterlingAccessRevoked ? "text-primary" : "text-error"}`}
                  type="button"
                >
                  <Icon name={sterlingAccessRevoked ? "check_circle" : "block"} className="text-[14px]" />
                  <span>{sterlingAccessRevoked ? "Restore Access" : "Revoke Access"}</span>
                </button>
                <button
                  onClick={() =>
                    setDetailModal({
                      title: "Sterling Bank Data Pull Logs",
                      subtitle: "Institutional API Query Trail",
                      content: (
                        <div className="space-y-2 text-xs font-mono">
                          <div>2026-03-28 14:12 WAT: Pulled 4-season production summary</div>
                          <div>2026-03-24 10:05 WAT: Pulled Cadastral parcel boundary GeoJSON</div>
                          <div>2026-03-18 09:30 WAT: Verified Zenith Bank escrow inflow statements</div>
                        </div>
                      ),
                    })
                  }
                  className="font-label-sm text-label-sm font-semibold text-primary hover:underline"
                  type="button"
                >
                  View Pull Logs (4)
                </button>
              </div>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">Leadway Assurance Agro-Desk</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Active</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mb-space-sm">Purpose: Multi-Peril Index Cover (#LWY-992 Underwriting)</span>
                <div className="flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant bg-surface-container-lowest p-space-sm rounded">
                  <div className="flex justify-between">
                    <span>Authorized Scope:</span>
                    <span className="font-semibold text-on-surface">GPS Parcels, Weather &amp; Loss Logs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeframe:</span>
                    <span className="text-primary font-semibold">Seasonal (Until Aug 2026)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Type:</span>
                    <span className="text-on-surface font-semibold">Continuous Telemetry</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between">
                <button
                  onClick={() =>
                    setDetailModal({
                      title: "Modify Scope: Leadway Assurance",
                      subtitle: "Underwriting Telemetry Permissions",
                      content: (
                        <div className="space-y-3 text-sm">
                          <p>Current telemetry granted: Sentinel-2 NDVI vegetative indices and NiMet localized rainfall stations.</p>
                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailModal(null);
                                showScreenToast("Scope updated: Restricted to vegetative indices only.");
                              }}
                              className="px-3 py-1.5 rounded bg-primary text-on-primary text-xs font-semibold"
                            >
                              Restrict Scope
                            </button>
                          </div>
                        </div>
                      ),
                    })
                  }
                  className="font-label-sm text-label-sm font-semibold text-primary hover:underline flex items-center gap-1"
                  type="button"
                >
                  <Icon name="tune" className="text-[14px]" />
                  <span>Modify Scope</span>
                </button>
                <button
                  onClick={() =>
                    setDetailModal({
                      title: "Leadway Assurance Data Pull Logs",
                      subtitle: "Automated Satellite Telemetry Queries",
                      content: (
                        <div className="space-y-2 text-xs font-mono">
                          <div>2026-03-29 06:00 WAT: Automated 10-day rainfall index query (0.0mm recorded)</div>
                          <div>2026-03-20 06:00 WAT: Automated 10-day rainfall index query (44.2mm recorded)</div>
                        </div>
                      ),
                    })
                  }
                  className="font-label-sm text-label-sm font-semibold text-primary hover:underline"
                  type="button"
                >
                  View Pull Logs (12)
                </button>
              </div>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">NIRSAL Microfinance Bank</span>
                  <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                    nirsalStatus === "approved" ? "bg-secondary-fixed text-on-secondary-fixed" : nirsalStatus === "declined" ? "bg-error-container text-on-error-container" : "bg-tertiary-fixed text-on-tertiary-fixed"
                  }`}>
                    {nirsalStatus === "approved" ? "Approved" : nirsalStatus === "declined" ? "Declined" : "Pending Request"}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mb-space-sm">Purpose: Tractor Mechanization Asset Finance (₦8.5M Requisition)</span>
                <div className="flex flex-col gap-1 text-label-sm font-label-sm text-on-surface-variant bg-surface-container-lowest p-space-sm rounded">
                  <div className="flex justify-between">
                    <span>Requested Scope:</span>
                    <span className="font-semibold text-on-surface">Equipment Proof-of-Work Logs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Request Date:</span>
                    <span className="text-outline font-semibold">Today, 08:30 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Originating Desk:</span>
                    <span className="text-on-surface font-semibold">Ibadan Regional Credit Desk</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between gap-space-xs">
                {nirsalStatus === "pending" ? (
                  <>
                    <button
                      onClick={() => {
                        setNirsalStatus("declined");
                        showScreenToast("Declined data-sharing request from NIRSAL Microfinance Bank.");
                      }}
                      className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-error font-label-sm text-label-sm"
                      type="button"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => {
                        setNirsalStatus("approved");
                        showScreenToast("Approved data-sharing request for NIRSAL Microfinance Bank (Proof-of-Work logs).");
                      }}
                      className="px-space-md py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors"
                      type="button"
                    >
                      Approve Access
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Decision: {nirsalStatus.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
            <div className="flex items-start gap-space-sm">
              <Icon name="verified_user" className="text-secondary text-[24px] mt-0.5" />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface">Nigeria Data Protection Act (NDPA) 2023 Enforcement Notice</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-4xl">You maintain unconstrained ownership of your agronomy logs and financial records. Every query executed by commercial banks or insurers creates an immutable SHA-256 ledger record. You can instantly revoke or edit any institution’s access privileges at zero financial penalty.</p>
              </div>
            </div>
            <div className="shrink-0 self-start sm:self-center">
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-secondary font-semibold bg-surface-container-lowest px-2 py-1 rounded"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Ledger Synced: 2026-03-29</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Request Audit */}
      {isRequestAuditOpen && (
        <ScreenDialog
          title="Request Agronomic & Financial Audit"
          subtitle="Submit formal audit requisition to Lead Agronomist and Verification Hub"
          onClose={() => setIsRequestAuditOpen(false)}
          panel={
            <div className="space-y-4 text-sm">
              <p className="text-on-surface-variant">
                Request an on-site cadastral review and counterparty ledger audit by supervising agronomist <strong>Dr. Quadri Olapade</strong>.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <ScreenDialogClose onClick={() => setIsRequestAuditOpen(false)}>
                  Cancel
                </ScreenDialogClose>
                <button
                  type="button"
                  onClick={() => {
                    setIsRequestAuditOpen(false);
                    showScreenToast("Audit requisition dispatched. Assigned to Dr. Quadri Olapade.");
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container"
                >
                  Submit Audit Request
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 2: Manage Consent */}
      {isManageConsentOpen && (
        <ScreenDialog
          title="NDPA 2023 Sovereign Consent Dashboard"
          subtitle="Real-time control over which institutions can access your farm records"
          onClose={() => setIsManageConsentOpen(false)}
          panel={
            <div className="space-y-3 text-sm">
              <p className="text-on-surface-variant text-xs">
                In strict accordance with the Nigeria Data Protection Act (NDPA) 2023 §31, you possess the inviolable right to grant, restrict, or revoke access to your agricultural data at any moment.
              </p>
              <div className="p-3 rounded-lg bg-surface-container-low space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span>Sterling Bank Agri-Finance:</span>
                  <span className="font-semibold text-secondary">{sterlingAccessRevoked ? "Revoked" : "Active"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Leadway Assurance Agro-Desk:</span>
                  <span className="font-semibold text-secondary">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>NIRSAL Microfinance Bank:</span>
                  <span className="font-semibold text-primary">{nirsalStatus.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <ScreenDialogClose onClick={() => setIsManageConsentOpen(false)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 3: Upload TCN */}
      {isUploadTcnOpen && (
        <ScreenDialog
          title="Upload 2025 Tax Clearance Certificate (TCN)"
          subtitle="Unlock Level 4 Prime Lending (Sub-9% Single Digit Interest Window)"
          onClose={() => setIsUploadTcnOpen(false)}
          panel={
            <div className="space-y-4 text-sm">
              <p className="text-on-surface-variant text-xs">
                Upload your Oyo State Internal Revenue Service (OYIRS) or FIRS Tax Clearance Certificate to qualify for subsidized CBN/NIRSAL anchor borrowing schemes.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <ScreenDialogClose onClick={() => setIsUploadTcnOpen(false)}>
                  Cancel
                </ScreenDialogClose>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadTcnOpen(false);
                    showScreenToast("TCN submitted for agronomist verification. Prime lending unlocked.");
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container"
                >
                  Upload &amp; Verify TCN
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 4: Filter Seasons */}
      {isFilterSeasonsOpen && (
        <ScreenDialog
          title="Filter Multi-Season Production History"
          subtitle="Select cultivation year or cropping cycle"
          onClose={() => setIsFilterSeasonsOpen(false)}
          panel={
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {[
                  { id: "ALL", label: "All Seasons (4 Cycles)" },
                  { id: "2025 Late", label: "2025 Late Rains" },
                  { id: "2025 Early", label: "2025 Early Rains" },
                  { id: "2024 Late", label: "2024 Late Rains" },
                  { id: "2024 Early", label: "2024 Early Rains" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSeasonFilter(s.id);
                      setIsFilterSeasonsOpen(false);
                      showScreenToast(`Filtered ledger by: ${s.label}`);
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      seasonFilter === s.id
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-outline/20 bg-surface-container-low hover:bg-surface-container"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <ScreenDialogClose onClick={() => setIsFilterSeasonsOpen(false)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 5: Detail Inspection Modal */}
      {detailModal && (
        <ScreenDialog
          title={detailModal.title}
          subtitle={detailModal.subtitle}
          onClose={() => setDetailModal(null)}
          panel={
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low">
                {detailModal.content}
              </div>
              <div className="flex justify-end pt-2">
                <ScreenDialogClose onClick={() => setDetailModal(null)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 6: Audit Trail Modal */}
      {isAuditTrailOpen && (
        <ScreenDialog
          title="Immutable NDPA 2023 Access Audit Log"
          subtitle="Cryptographic query audit log of all external commercial entities"
          onClose={() => setIsAuditTrailOpen(false)}
          panel={
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-surface-container-low">
                <div>2026-03-29 08:30 WAT · NIRSAL MFB requested Tractor PoW records</div>
                <div className="text-[10px] text-on-surface-variant">Hash: 0x9f88..32a1 · Operator: Ibadan Credit Desk</div>
              </div>
              <div className="p-2.5 rounded bg-surface-container-low">
                <div>2026-03-28 14:12 WAT · Sterling Bank accessed 4-Season summary</div>
                <div className="text-[10px] text-on-surface-variant">Hash: 0x8e77..21b0 · Token: JWT_AUDIT_STB</div>
              </div>
              <div className="p-2.5 rounded bg-surface-container-low">
                <div>2026-03-24 10:05 WAT · Sterling Bank accessed Cadastral GeoJSON</div>
                <div className="text-[10px] text-on-surface-variant">Hash: 0x7d66..10c9 · Scope: Boundary Geofence</div>
              </div>
              <div className="flex justify-end pt-2">
                <ScreenDialogClose onClick={() => setIsAuditTrailOpen(false)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
