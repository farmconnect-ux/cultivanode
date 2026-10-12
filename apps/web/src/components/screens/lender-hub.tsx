"use client";

// Ported from the "lender_agricultural_credit_9.2" design. Interactive client workspace
// with credit committee docket modal, CSV audit export, facility appraisal form, and Interswitch/NIBSS sweep execution.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogAction, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";

export function LenderHub(_props: ScreenProps) {
  const [showDocketModal, setShowDocketModal] = useState(false);
  const [showNewAppraisalModal, setShowNewAppraisalModal] = useState(false);
  const [showTermSheetModal, setShowTermSheetModal] = useState(false);
  const [disbursedTranche, setDisbursedTranche] = useState(false);
  const [resolutionSigned, setResolutionSigned] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "appraisal" | "kyc" | "approved" | "servicing">("all");

  // Appraisal Form
  const [appApplicant, setAppApplicant] = useState("");
  const [appCluster, setAppCluster] = useState("Iseyin Savanna Cluster");
  const [appLimit, setAppLimit] = useState("12000000");
  const [appCrop, setAppCrop] = useState("Hybrid SAMMAZ-52 Maize");
  const [appHectares, setAppHectares] = useState("30");

  const handleAuditExport = () => {
    const csv = [
      "Facility_Ref,Borrower_Or_Coop,Cluster_Ha,Limit_NGN,Approved_Terms,CRG_Guarantee,Status",
      "LN-2026-088,Quadri Olapade,Iseyin (42.5 Ha),15000000,9.50% APR (180-Day Bullet),75% NIRSAL CRG,Committee Approved",
      "LN-2026-089,Oke-Ogun Soya Alliance,Saki West (220 Ha),32000000,10.0% APR (Seasonal),75% NIRSAL CRG,Under Risk Review",
      "LN-2026-091,Ado-Awaye Outgrowers,Ado-Awaye (480 Farmers),24000000,Bullet 12-Mo,Leadway Multi-Peril,Approved Pending Signature",
      "",
      "Total_Credit_Portfolio_NGN,Active_Facilities,NPL_Ratio,Escrow_Sweep_Provider",
      "428500000.00,142 Facilities,1.82%,Interswitch & NIBSS Operational",
    ].join("\n");

    downloadFile(`lender-credit-facilities-audit-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    showScreenToast("Credit Portfolio Audit (.csv) exported successfully");
  };

  const handleExecuteSweep = () => {
    setDisbursedTranche(true);
    showScreenToast("Interswitch / NIBSS Sweep Executed: ₦7,500,000 disbursed to verified supplier escrow");
  };

  const handleSignResolution = () => {
    setResolutionSigned(true);
    showScreenToast("Credit Committee Resolution Docket Signed for Facility #LN-2026-088");
  };

  const handleCreateAppraisal = (e: React.FormEvent) => {
    e.preventDefault();
    setShowNewAppraisalModal(false);
    showScreenToast(`New Facility Appraisal created for ${appApplicant || "Applicant"} (₦${Number(appLimit).toLocaleString()})`);
  };

  const panelEscrowmodal = (
    <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-xl p-space-lg">
      <div className="flex items-center justify-between pb-space-sm border-b border-surface-container mb-space-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
            <Icon name="lock_reset" className="text-[20px]" />
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Confirm Escrow Tranche Disbursement</h3>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="text-on-surface-variant hover:text-on-surface" id="closeModalBtn" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">You are authorizing the release of Tranche 1 Working Capital for <strong className="text-on-surface">Quadri Olapade (Facility #LN-2026-088)</strong> directly into the verified input supplier and mechanization escrow contracts.</p>
      <div className="bg-surface-container-low p-space-md rounded-xl space-y-2 mb-space-lg text-body-sm">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Disbursement Amount:</span>
          <span className="font-bold text-on-surface">{disbursedTranche ? "₦7,500,000 (DISBURSED)" : "₦7,500,000 (Tranche 1 of 2)"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Designated Payee 1 (Seed/Inputs):</span>
          <span className="font-semibold text-on-surface">Premier Seed Nigeria Ltd (₦4,200,000)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Designated Payee 2 (Mechanization):</span>
          <span className="font-semibold text-on-surface">Iseyin Tractor Syndicate (₦3,300,000)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">NIRSAL CRG Backing:</span>
          <span className="font-bold text-secondary">Verified (75% Active)</span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-space-sm">
        <ScreenDialogClose>
          <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors" id="cancelModalBtn" type="button">Cancel</button>
        </ScreenDialogClose>
        <ScreenDialogAction>
          <button
            onClick={handleExecuteSweep}
            disabled={disbursedTranche}
            className="px-space-lg py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
            id="executeDisbursementBtn"
            type="button"
          >
            <Icon name="verified" className="text-[18px]" />
            {disbursedTranche ? "Disbursement Executed" : "Execute Interswitch / NIBSS Sweep"}
          </button>
        </ScreenDialogAction>
      </div>
    </div>
  );
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="bg-surface-container-lowest p-space-lg shadow-sm rounded-xl mb-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md">
            <div className="flex flex-wrap items-center gap-space-sm">
              <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm"><Icon name="verified_user" className="text-[15px] text-secondary-fixed" /> Authorized Commercial Lending Partner (CBN Supervised)</span>
              <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm"><span className="w-2 h-2 rounded-full bg-secondary" /> Desk: Sterling Agri-Finance · NIRSAL Tier-1 Window</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Framework: Master Spec §9.2 / §9.1 / §9.6</span>
            </div>
            <div className="flex items-center gap-space-sm">
              {_props.slots?.actions ?? (
                <>
                  <button
                    onClick={() => setShowDocketModal(true)}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container text-primary font-label-md text-label-md flex items-center gap-1.5 hover:bg-surface-container-high transition-colors"
                    id="docketBtn"
                    type="button"
                  >
                    <Icon name="folder_special" className="text-[18px]" />
                    Credit Committee Docket <span className="bg-primary text-on-primary px-1.5 py-0.2 rounded-full text-label-sm">3 Pending</span>
                  </button>
                  <button
                    onClick={handleAuditExport}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1 hover:bg-surface-container-high transition-colors"
                    type="button"
                  >
                    <Icon name="download" className="text-[18px]" />
                    Audit Export (.csv)
                  </button>
                  <button
                    onClick={() => setShowNewAppraisalModal(true)}
                    className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 hover:bg-primary-container transition-all shadow-sm"
                    type="button"
                  >
                    <Icon name="add_circle" className="text-[18px]" />
                    + New Facility Appraisal
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm p-space-sm bg-surface-container-low rounded-lg">
            <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-lowest rounded shadow-sm">
              <Icon name="token" className="text-[18px] text-secondary" />
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline truncate uppercase">NDPA 2023 Gateway</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Active · SHA-256 Consent</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-lowest rounded shadow-sm">
              <Icon name="security" className="text-[18px] text-primary" />
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline truncate uppercase">NIRSAL CRG Backing</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">75% First-Loss Guarantee</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-lowest rounded shadow-sm">
              <Icon name="account_balance" className="text-[18px] text-secondary" />
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline truncate uppercase">NIBSS / Interswitch</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Escrow Auto-Sweep Operational</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-lowest rounded shadow-sm">
              <Icon name="trending_down" className="text-[18px] text-secondary" />
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-outline truncate uppercase">NPL Portfolio Ratio</span>
                <span className="font-label-md text-label-md text-secondary font-bold truncate">1.82% <span className="text-on-surface-variant font-normal">(Target &lt; 5.0%)</span></span>
              </div>
            </div>
          </div>
        </section>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md mb-space-lg">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wide">Total Credit Portfolio</span>
              <Icon name="account_balance_wallet" className="text-[18px] text-primary" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary tracking-tight">₦428.50M</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">142 active facilities across Oyo, Ogun &amp; Osun</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded px-2 py-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary font-semibold">+18.4% YoY</span>
              <span className="font-label-sm text-label-sm text-outline">100% Covenants Intact</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wide">Pipeline in Underwriting</span>
              <Icon name="pending_actions" className="text-[18px] text-tertiary-container" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">₦96.40M</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">18 applications in underwriting / KYC</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded px-2 py-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-primary font-semibold">3.4 Days Avg SLA</span>
              <span className="font-label-sm text-label-sm text-outline">6 Pre-approved</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wide">Weighted NPL Rate</span>
              <Icon name="verified" className="text-[18px] text-secondary" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-secondary tracking-tight">1.82%</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Industry benchmark: 5.0%</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded px-2 py-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary font-semibold">0 Defaulted Tripartite</span>
              <span className="font-label-sm text-label-sm text-outline">CAMA 2020</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wide">Weighted DSCR</span>
              <Icon name="finance_mode" className="text-[18px] text-primary" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-on-surface tracking-tight">2.38x</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Internal floor limit: 1.30x</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded px-2 py-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary font-semibold">High Margin Buffer</span>
              <span className="font-label-sm text-label-sm text-outline">Verified Inflows</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wide">Repayment Efficiency</span>
              <Icon name="payments" className="text-[18px] text-secondary" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-secondary tracking-tight">98.6%</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">₦41.2M swept MTD via off-take escrow</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded px-2 py-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">Zenith Tripartite</span>
              <span className="font-label-sm text-label-sm text-outline">Auto-sweep</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wide">NIRSAL CRG De-Risked</span>
              <Icon name="shield_with_heart" className="text-[18px] text-primary" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary tracking-tight">₦321.38M</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">75% principal protection active</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded px-2 py-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary font-semibold">Capital Relief Active</span>
              <span className="font-label-sm text-label-sm text-outline">CAR Ratio +320bp</span>
            </div>
          </div>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container mb-space-md">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Credit Underwriting Queue &amp; Facilities</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Live applications evaluated against §9.1 Verified Farm Records and CAMA Off-take Contracts.</p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm bg-surface-container px-2.5 py-1 rounded-md text-primary font-semibold">Live Feed: Synchronized</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-surface-container-low rounded-lg mb-space-md text-body-sm">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-all ${
                    activeFilter === "all"
                      ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  All Applications (18)
                </button>
                <button
                  onClick={() => setActiveFilter("appraisal")}
                  className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-all ${
                    activeFilter === "appraisal"
                      ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Initial Appraisal (6)
                </button>
                <button
                  onClick={() => setActiveFilter("kyc")}
                  className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-all ${
                    activeFilter === "kyc"
                      ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Doc / KYC Pending (4)
                </button>
                <button
                  onClick={() => setActiveFilter("approved")}
                  className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-all ${
                    activeFilter === "approved"
                      ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Approved / Escrow Ready (5)
                </button>
                <button
                  onClick={() => setActiveFilter("servicing")}
                  className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-all ${
                    activeFilter === "servicing"
                      ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Active Servicing (142)
                </button>
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-lowest ring-2 ring-primary/20 shadow-sm transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary text-on-primary font-bold">#LN-2026-088</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Quadri Olapade</span>
                      <span className="text-body-sm text-outline">· Iseyin Savanna Cluster (42.5 Ha)</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Committee Approved</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm my-space-sm p-space-sm bg-surface-container-low rounded-lg">
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Requested Limit</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">₦15,000,000</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Historical Revenue</span>
                      <span className="font-label-lg text-label-lg font-bold text-secondary">₦62.45M (4-Seasons)</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Modelled DSCR</span>
                      <span className="font-label-lg text-label-lg font-bold text-primary">2.42x</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Off-take Lock</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">₦43.70M (Psaltry &amp; Grand)</span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Purpose: Hybrid SAMMAZ-52 Maize &amp; TME-419 Cassava Expansion. Tripartite contract with Psaltry &amp; Grand Cereals registered under CAMA 2020. 75% NIRSAL CRG coverage assigned.</p>
                  <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                    <div className="flex items-center gap-1.5 text-body-sm text-secondary">
                      <Icon name="verified" className="text-[16px]" />
                      <span className="font-label-sm text-label-sm">Agronomist Quad-attested (COREN #29184)</span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <button onClick={() => showScreenToast("Dossier loaded for Facility #LN-2026-088: Quadri Olapade (Oke-Ogun Maize & Cassava).")} className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors" type="button">Examine Dossier</button>
                      <ScreenDialog title="Confirm Escrow Tranche Disbursement" side="center" panel={panelEscrowmodal}>
                        <button onClick={() => {}} className="px-space-md py-1 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-all shadow-sm" id="disburseTrigger" type="button">Trigger Escrow Disbursement</button>
                      </ScreenDialog>
                    </div>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm hover:shadow transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-primary font-bold">#LN-2026-089</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Oke-Ogun Soya Alliance Co-op</span>
                      <span className="text-body-sm text-outline">· 310 Members · 220 Ha</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" /> Under Risk Review (Day 2)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm my-space-sm p-space-sm bg-surface-container-lowest rounded-lg">
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Requested Limit</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">₦32,000,000</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Pre-Financing Scope</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Mechanized Hire + Inoculant</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Off-take Partner</span>
                      <span className="font-label-lg text-label-lg font-bold text-secondary">Premium Edible Oils Ede</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Contract Volume</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">₦129.2M Bound</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1"><Icon name="sync_problem" className="text-[16px] text-tertiary-container" /> NDPA Member Consent: 298/310 Confirmed via SMS OTP</span>
                    <button onClick={() => showScreenToast("Farm dossier opened: Oke-Ogun Soya Alliance Co-op (310 members, 220 Ha, NIRSAL guaranteed).")} className="px-space-md py-1 rounded-lg bg-surface-container-highest text-primary font-label-sm text-label-sm hover:bg-surface-container transition-colors" type="button">Inspect Farm Dossier (§9.1)</button>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm hover:shadow transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-primary font-bold">#LN-2026-090</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Egba Rice Growers Syndicate</span>
                      <span className="text-body-sm text-outline">· 130 Smallholders · 110 Ha</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-error" /> Awaiting Docs / KYC</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm my-space-sm p-space-sm bg-surface-container-lowest rounded-lg">
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Requested Limit</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">₦18,500,000</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Calculated DSCR</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">1.88x (Adequate)</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Missing Requirement</span>
                      <span className="font-label-lg text-label-lg font-bold text-error">Co-op Board Resolution</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Disbursement Channel</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Batch Wallet Escrow</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1"><Icon name="sms" className="text-[16px] text-tertiary-container" /> Termii SMS Prompt queued for Syndicate President</span>
                    <button
                      onClick={() => showScreenToast("Termii SMS requirement prompt dispatched to Syndicate President")}
                      className="px-space-md py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                      type="button"
                    >
                      Request Missing Item via SMS
                    </button>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm hover:shadow transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-primary font-bold">#LN-2026-091</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Ado-Awaye Outgrowers Union</span>
                      <span className="text-body-sm text-outline">· 480 Farmers · Oyo State</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Approved · Pending Farmer Signature</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm my-space-sm p-space-sm bg-surface-container-lowest rounded-lg">
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Requested Limit</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">₦24,000,000</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Facility Type</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Clean Stem Multiplication</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Tenor</span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">12 Months (Bullet)</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline block">Insurance Carrier</span>
                      <span className="font-label-lg text-label-lg font-bold text-secondary">Leadway Multi-Peril</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1"><Icon name="thumb_up" className="text-[16px] text-secondary" /> Term Sheet dispatched to USSD *384*44#</span>
                    <button
                      onClick={() => setShowTermSheetModal(true)}
                      className="px-space-md py-1 rounded-lg bg-surface-container-highest text-primary font-label-sm text-label-sm hover:bg-surface-container transition-colors"
                      type="button"
                    >
                      View Term Sheet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container mb-space-md">
                <div className="flex items-center gap-2">
                  <Icon name="analytics" className="text-primary text-[22px]" />
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Appraisal Dossier: #LN-2026-088</h3>
                </div>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold">Grade A1 (94/100)</span>
              </div>
              <div className="relative rounded-lg overflow-hidden mb-space-md bg-surface-container">
                <img className="w-full h-36 object-cover" data-alt="High resolution aerial satellite view of agricultural parcel 4428/2023 in Iseyin Oyo State showing healthy lush green maize and cassava plots divided into clean rows under bright daylight with high NDVI vegetation vitality indicators." src="/images/screens/0e226a6588d9.webp" alt="" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-space-sm">
                  <div className="text-on-primary">
                    <span className="font-label-sm text-label-sm uppercase tracking-wide block text-secondary-fixed">Cadastral Polygon: Parcel #4428/2023 · Oyo State</span>
                    <span className="font-body-sm text-body-sm">42.5 Ha · GPS Perimeter Lat 7.962°N, Lon 3.598°E</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-space-xs mb-space-md text-center">
                <div className="p-space-xs bg-surface-container-low rounded">
                  <span className="font-label-sm text-label-sm text-outline block">NDVI Vitality</span>
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">0.78</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Sentinel-2 Sync</span>
                </div>
                <div className="p-space-xs bg-surface-container-low rounded">
                  <span className="font-label-sm text-label-sm text-outline block">Soil Carbon</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">2.82%</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Lab Verified</span>
                </div>
                <div className="p-space-xs bg-surface-container-low rounded">
                  <span className="font-label-sm text-label-sm text-outline block">Cash Margin</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">44.2%</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">4-Yr Trailing</span>
                </div>
              </div>
              <div className="mb-space-md p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface font-bold">Verified Bank Inflows (Zenith Reconciliation)</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">100% Matched</span>
                </div>
                <div className="space-y-1 font-body-sm text-body-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>2024 Early Rains (Maize/Cassava)</span>
                    <span className="font-semibold text-on-surface">₦14,820,000</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>2024 Late Rains (Maize/Soya)</span>
                    <span className="font-semibold text-on-surface">₦16,400,000</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>2025 Early Rains (Maize/Cassava)</span>
                    <span className="font-semibold text-on-surface">₦15,110,000</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>2025 Late Rains (Maize/Soya)</span>
                    <span className="font-semibold text-on-surface">₦16,120,000</span>
                  </div>
                </div>
              </div>
              <div className="mb-space-md p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-md text-label-md text-on-surface font-bold block mb-1">Downside Sensitivity Modeling</span>
                <div className="grid grid-cols-2 gap-space-xs font-body-sm text-body-sm">
                  <div className="p-space-xs bg-surface-container-lowest rounded shadow-sm">
                    <span className="font-label-sm text-label-sm text-outline block">Commodity Price Shock (-15%)</span>
                    <span className="font-label-lg text-label-lg font-bold text-secondary">DSCR 1.95x</span>
                    <span className="font-label-sm text-label-sm text-outline block mt-0.5">Compliant (&gt;1.30x)</span>
                  </div>
                  <div className="p-space-xs bg-surface-container-lowest rounded shadow-sm">
                    <span className="font-label-sm text-label-sm text-outline block">Drought Yield Deficit (-25%)</span>
                    <span className="font-label-lg text-label-lg font-bold text-primary">DSCR 2.15x</span>
                    <span className="font-label-sm text-label-sm text-outline block mt-0.5">Leadway Parametric Trigger</span>
                  </div>
                </div>
              </div>
              <div className="space-y-space-xs">
                <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-body-sm">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium"><Icon name="contract" className="text-[16px] text-secondary" /> CAMA Off-take Sweeper</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">₦43.7M Psaltry Escrow</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-body-sm">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium"><Icon name="policy" className="text-[16px] text-primary" /> NIRSAL CRG Guarantee Note</span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">#NIRSAL-CRG-2026-904</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-body-sm">
                  <span className="flex items-center gap-1.5 text-on-surface font-medium"><Icon name="warehouse" className="text-[16px] text-secondary" /> Electronic Warehouse Receipt</span>
                  <span className="font-label-sm text-label-sm text-on-surface font-bold">85 MT SAMMAZ-52 (Saki Silo)</span>
                </div>
              </div>
              <div className="mt-space-md p-space-md bg-primary-container text-on-primary rounded-xl">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-headline-sm text-headline-sm font-bold">Facility Approved Terms</span>
                  <span className="font-label-sm text-label-sm bg-surface-container-lowest text-primary px-2 py-0.5 rounded font-bold">CBN Window</span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm text-body-sm mb-space-sm">
                  <div>
                    <span className="text-on-primary-container block text-label-sm font-label-sm">Sanctioned Amount</span>
                    <span className="font-headline-sm text-headline-sm font-bold">₦15,000,000</span>
                  </div>
                  <div>
                    <span className="text-on-primary-container block text-label-sm font-label-sm">Concessionary APR</span>
                    <span className="font-headline-sm text-headline-sm font-bold">9.50% p.a.</span>
                  </div>
                  <div>
                    <span className="text-on-primary-container block text-label-sm font-label-sm">Tenor &amp; Structure</span>
                    <span className="font-label-md text-label-md font-semibold">180-Day Bullet Harvest</span>
                  </div>
                  <div>
                    <span className="text-on-primary-container block text-label-sm font-label-sm">Monthly Interest Service</span>
                    <span className="font-label-md text-label-md font-semibold">₦118,750 / Month</span>
                  </div>
                </div>
                <button
                  onClick={handleSignResolution}
                  disabled={resolutionSigned}
                  className="w-full py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                  type="button"
                >
                  <Icon name="verified" className="text-[18px]" />
                  {resolutionSigned ? "Resolution Docket Signed" : "Sign Credit Committee Resolution Docket"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg mb-space-lg">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-space-md">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Commodity Concentration</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Exposure spread across certified agro-value chains.</p>
              </div>
              <Icon name="pie_chart" className="text-outline text-[20px]" />
            </div>
            <div className="flex items-center justify-center py-space-sm">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" r="38" stroke="#e5eeff" strokeWidth="14" />
                <circle cx="50" cy="50" fill="transparent" r="38" stroke="#134e33" strokeDasharray="90.7 238.76" strokeDashoffset="0" strokeWidth="14" />
                <circle cx="50" cy="50" fill="transparent" r="38" stroke="#006c49" strokeDasharray="66.8 238.76" strokeDashoffset="-90.7" strokeWidth="14" />
                <circle cx="50" cy="50" fill="transparent" r="38" stroke="#6a3700" strokeDasharray="42.9 238.76" strokeDashoffset="-157.5" strokeWidth="14" />
                <circle cx="50" cy="50" fill="transparent" r="38" stroke="#00714d" strokeDasharray="28.6 238.76" strokeDashoffset="-200.4" strokeWidth="14" />
                <circle cx="50" cy="50" fill="transparent" r="38" stroke="#99d3b0" strokeDasharray="9.5 238.76" strokeDashoffset="-229" strokeWidth="14" />
              </svg>
            </div>
            <div className="space-y-2 font-body-sm text-body-sm mt-space-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-on-surface"><span className="w-3 h-3 rounded-full bg-primary-container" /> Maize Grain (Industrial)</span>
                <span className="font-bold text-on-surface">38% (₦162.8M)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-on-surface"><span className="w-3 h-3 rounded-full bg-secondary" /> Cassava Root (Starch/HQCF)</span>
                <span className="font-bold text-on-surface">28% (₦120.0M)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-on-surface"><span className="w-3 h-3 rounded-full bg-tertiary-container" /> Soybeans (Oilseed)</span>
                <span className="font-bold text-on-surface">18% (₦77.1M)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-on-surface"><span className="w-3 h-3 rounded-full bg-on-secondary-container" /> Paddy Rice (Lowland)</span>
                <span className="font-bold text-on-surface">12% (₦51.4M)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-on-surface"><span className="w-3 h-3 rounded-full bg-inverse-primary" /> High-Value Horticulture</span>
                <span className="font-bold text-on-surface">4% (₦17.2M)</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-space-md">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Territorial Risk Spread</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Cluster dispersion by rainfall &amp; climate corridor.</p>
              </div>
              <Icon name="map" className="text-outline text-[20px]" />
            </div>
            <div className="space-y-space-md">
              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1">
                  <span className="text-on-surface font-semibold">Oyo Derived Savanna (Iseyin, Saki, Ogbomoso)</span>
                  <span className="text-primary font-bold">54% · ₦231.4M</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: "54%" }} />
                </div>
                <span className="font-label-sm text-label-sm text-outline mt-0.5 block">Deep soils, highest mechanized productivity</span>
              </div>
              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1">
                  <span className="text-on-surface font-semibold">Ogun Rainforest Transition (Abeokuta, Ijebu)</span>
                  <span className="text-secondary font-bold">26% · ₦111.4M</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2.5">
                  <div className="bg-secondary h-2.5 rounded-full" style={{ width: "26%" }} />
                </div>
                <span className="font-label-sm text-label-sm text-outline mt-0.5 block">High cassava &amp; rice biomass density</span>
              </div>
              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1">
                  <span className="text-on-surface font-semibold">Osun Mixed Agro-Ecological (Ede, Osogbo, Ilesa)</span>
                  <span className="text-on-surface font-bold">20% · ₦85.7M</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2.5">
                  <div className="bg-primary-container h-2.5 rounded-full" style={{ width: "20%" }} />
                </div>
                <span className="font-label-sm text-label-sm text-outline mt-0.5 block">Soybeans and dual-cycle maize syndicates</span>
              </div>
            </div>
            <div className="mt-space-lg p-space-sm bg-surface-container-low rounded-lg flex items-center gap-space-sm">
              <Icon name="satellite_alt" className="text-secondary text-[24px]" />
              <div className="text-body-sm">
                <span className="font-label-sm text-label-sm text-on-surface font-bold block">Sentinel-2 Agro Sentinel Active</span>
                <span className="text-on-surface-variant font-label-sm text-label-sm">Daily vegetation health and rainfall anomaly sensors live across all 3 zones.</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-space-md">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Repayment Schedule (90 Days)</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Deterministic off-take harvest sweep projections.</p>
              </div>
              <Icon name="calendar_month" className="text-outline text-[20px]" />
            </div>
            <div className="space-y-space-sm">
              <div className="p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-md text-label-md font-bold text-on-surface">May 2026 Inflows</span>
                  <span className="font-label-lg text-label-lg font-bold text-primary">₦18.50M</span>
                </div>
                <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                  <span>Early dry-season harvest sweep</span>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.2 rounded font-semibold">100% Escrow Bound</span>
                </div>
              </div>
              <div className="p-space-sm bg-surface-container rounded-lg ring-1 ring-primary/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-md text-label-md font-bold text-on-surface">June 2026 Peak Inflow</span>
                  <span className="font-label-lg text-label-lg font-bold text-secondary">₦44.00M</span>
                </div>
                <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                  <span>Early Rains Maize intake at Psaltry &amp; Flour Mills</span>
                  <span className="font-label-sm text-label-sm bg-primary text-on-primary px-2 py-0.2 rounded font-semibold">Highest Liquidity</span>
                </div>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-md text-label-md font-bold text-on-surface">July 2026 Inflow</span>
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">₦32.50M</span>
                </div>
                <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                  <span>Cassava root bulk deliveries &amp; industrial starch intake</span>
                  <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-2 py-0.2 rounded font-semibold">Guaranteed</span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-sm border-t border-surface-container flex items-center justify-between text-body-sm">
              <span className="text-on-surface-variant font-label-sm text-label-sm">Total 90-Day Pipeline Recovery:</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">₦95.00M</span>
            </div>
          </div>
        </section>
        <section className="bg-surface-container-low p-space-md rounded-xl text-on-surface-variant text-body-sm mb-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-wrap items-center gap-space-md">
              <div className="flex items-center gap-1.5">
                <Icon name="gavel" className="text-[18px] text-secondary" />
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">CBN Agricultural Credit Guarantee Scheme (ACGSF) Registered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="security" className="text-[18px] text-primary" />
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">CRC Credit Bureau &amp; CreditRegistry Bi-directional Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="health_and_safety" className="text-[18px] text-secondary" />
                <span className="font-label-sm text-label-sm font-semibold text-on-surface">Leadway Agri-Sure Comprehensive Parametric Shield</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="font-label-sm text-label-sm text-outline">Session Hash: 89df2-sterling-cbn-9.2</span>
              <span className="w-2 h-2 rounded-full bg-secondary" />
            </div>
          </div>
        </section>

        {/* Credit Committee Docket Modal */}
        {showDocketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-space-md backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-xl max-w-2xl w-full p-space-lg shadow-elevation-3 border border-outline-variant flex flex-col gap-space-md animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-outline-variant pb-space-sm">
                <div className="flex items-center gap-space-xs text-primary font-headline-sm">
                  <Icon name="folder_special" className="text-[22px]" />
                  <span>Credit Committee Resolution Docket (3 Facilities)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocketModal(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <div className="space-y-space-sm text-body-sm">
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-on-surface">#LN-2026-088 · Quadri Olapade</div>
                    <div className="text-label-sm text-outline">₦15.0M · Iseyin Cluster · 9.5% APR</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm font-bold">Approved</span>
                </div>

                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-on-surface">#LN-2026-089 · Oke-Ogun Soya Alliance</div>
                    <div className="text-label-sm text-outline">₦32.0M · Saki West · 10.0% APR</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showScreenToast("Risk committee endorsement added for #LN-2026-089")}
                    className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-sm font-semibold hover:bg-primary-container"
                  >
                    Endorse Docket
                  </button>
                </div>

                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-on-surface">#LN-2026-091 · Ado-Awaye Outgrowers</div>
                    <div className="text-label-sm text-outline">₦24.0M · 480 Farmers · Bullet 12-Mo</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showScreenToast("Farmer term sheet dispatch re-triggered via USSD")}
                    className="px-space-sm py-1 rounded bg-surface-container-highest text-primary font-label-sm font-semibold hover:bg-surface-container"
                  >
                    Push USSD Notice
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowDocketModal(false)}
                  className="px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-colors"
                >
                  Close Docket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Facility Appraisal Modal */}
        {showNewAppraisalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-space-md backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-elevation-3 border border-outline-variant flex flex-col gap-space-md animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-outline-variant pb-space-sm">
                <div className="flex items-center gap-space-xs text-primary font-headline-sm">
                  <Icon name="analytics" className="text-[22px]" />
                  <span>+ New Facility Appraisal (§9.2 Underwriting)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewAppraisalModal(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <form onSubmit={handleCreateAppraisal} className="flex flex-col gap-space-md">
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm font-semibold text-on-surface">Borrower / Primary Enterprise</label>
                  <input
                    type="text"
                    required
                    value={appApplicant}
                    onChange={(e) => setAppApplicant(e.target.value)}
                    placeholder="e.g. Samuel Kolawole (Kolawole Agro Farms)"
                    className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Cluster / Jurisdiction</label>
                    <select
                      value={appCluster}
                      onChange={(e) => setAppCluster(e.target.value)}
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    >
                      <option value="Iseyin Savanna Cluster">Iseyin Savanna Cluster</option>
                      <option value="Saki Highland Zone">Saki Highland Zone</option>
                      <option value="Ago-Are Corridor">Ago-Are Corridor</option>
                      <option value="Sagamu Agro-Park">Sagamu Agro-Park</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Requested Limit (₦)</label>
                    <input
                      type="number"
                      required
                      value={appLimit}
                      onChange={(e) => setAppLimit(e.target.value)}
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Commodity / Value Chain</label>
                    <input
                      type="text"
                      required
                      value={appCrop}
                      onChange={(e) => setAppCrop(e.target.value)}
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm font-semibold text-on-surface">Cultivated Land (Ha)</label>
                    <input
                      type="number"
                      required
                      value={appHectares}
                      onChange={(e) => setAppHectares(e.target.value)}
                      className="w-full px-space-sm py-2 rounded-lg border border-outline bg-surface-container-low text-on-surface text-body-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-space-xs bg-surface-container-low rounded text-label-sm text-on-surface-variant flex items-center justify-between">
                  <span>Credit Protection:</span>
                  <span className="font-bold text-secondary">NIRSAL CRG 75% First-Loss Guarantee</span>
                </div>

                <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant">
                  <button
                    type="button"
                    onClick={() => setShowNewAppraisalModal(false)}
                    className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {}}
                    type="submit"
                    className="px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-colors"
                  >
                    Submit for Underwriting
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Term Sheet Modal */}
        {showTermSheetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-space-md backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-elevation-3 border border-outline-variant flex flex-col gap-space-md animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-outline-variant pb-space-sm">
                <div className="flex items-center gap-space-xs text-primary font-headline-sm">
                  <Icon name="description" className="text-[22px]" />
                  <span>Term Sheet: #LN-2026-091</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermSheetModal(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <div className="space-y-space-sm text-body-sm">
                <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Borrower Entity:</span>
                    <strong className="text-on-surface">Ado-Awaye Outgrowers Union</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Facility Amount:</span>
                    <strong className="text-primary">₦24,000,000.00</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Tenor:</span>
                    <span className="text-on-surface font-semibold">12 Months (Bullet at Harvest)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Interest Rate:</span>
                    <span className="text-on-surface font-semibold">9.75% per annum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Insurance Underwriter:</span>
                    <span className="text-secondary font-semibold">Leadway Multi-Peril Shield</span>
                  </div>
                </div>
                <div className="p-space-xs bg-surface-container rounded text-label-sm text-on-surface-variant">
                  Dispatched via USSD Code <strong>*384*44#</strong> with digital signature verification.
                </div>
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    downloadFile("term-sheet-LN-2026-091.csv", "Facility,Borrower,Amount,Rate\nLN-2026-091,Ado-Awaye Outgrowers Union,24000000,9.75%");
                    showScreenToast("Downloaded Term Sheet (.csv)");
                  }}
                  className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-semibold transition-colors"
                >
                  Download (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setShowTermSheetModal(false)}
                  className="px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
