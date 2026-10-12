"use client";

// Ported from the "dispute_resolution_pow_arbitration_hub" design.
// Augmented with real interactive state: dynamic category filtering, interactive settlement proration slider,
// one-click escrow execution, dossier export, and field inspection triggers.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export type DisputeResolutionSlot = "kpis" | "queue" | "dossier" | "trail";

export function DisputeResolution({ slots }: ScreenProps<DisputeResolutionSlot>) {
  const [activeFilter, setActiveFilter] = useState<"all" | "machinery" | "produce" | "labour" | "archive">("all");
  const [splitRatio, setSplitRatio] = useState<number>(85); // 85% operator / 15% farmer

  const totalDisputeEscrow = 47000;
  const operatorPayout = Math.round(totalDisputeEscrow * (splitRatio / 100));
  const farmerRefund = totalDisputeEscrow - operatorPayout;

  const handleDownloadDossier = () => {
    const docket = `CULTIVANODE AGRO-ENTERPRISE DISPUTE ARBITRATION DOCKET
============================================================
Case ID: #DSP-2026-014
Category: Machinery Harrowing Coverage Dispute (Job #BKG-2026-0482)
Arbiter: Quadri Olapade (FIDO2 Hardware Token #9921)
Date: ${new Date().toLocaleDateString("en-NG")}

PARTIES:
- Complainant: Gbadamosi Lateef (Smallholder Farmer, Saki West)
- Respondent: Muritala Lawal (Syndicate Tractor Lead, Machine #04)

ESCROW CONTEXT:
- Fiduciary Custodian: Zenith Bank Trustee Segregated Account
- Total Frozen Value: ₦47,000.00
- Pilot Commission Deducted: ₦0.00 (0% Waiver Active)

EVIDENCE AUDIT CHAIN:
1. PostGIS Cadastral Perimeter: 4.50 Hectares Target
2. CAN-Bus Traversed Area: 3.82 Hectares Verified (84.89%)
3. Natural Granite Ridge: 0.68 Hectares (15.11% Geological Hazard)
4. Photographic Proof: 4/4 Verified with EXIF SHA-256 Timestamps
5. Extension Agent Report: Verified Impassable Submerged Bedrock

ARBITRATION RULING:
- Current Settlement Ratio: ${splitRatio}% Operator / ${100 - splitRatio}% Farmer
- Operator Net Payout: ₦${operatorPayout.toLocaleString()} NGN
- Farmer Pro-Rata Refund: ₦${farmerRefund.toLocaleString()} NGN

Statutory Compliance: Nigerian Arbitration Act 2023 & CultivaNode Master Terms §11.3.`;

    downloadFile("Arbitration-Dossier-DSP-2026-014.txt", docket, "text/plain");
    showScreenToast("Arbitration Dossier PDF/Text downloaded for Case #DSP-2026-014.");
  };

  const handleExecuteSettlement = () => {
    showScreenToast(
      `Executed settlement: ₦${operatorPayout.toLocaleString()} to Muritala Lawal, ₦${farmerRefund.toLocaleString()} refund to Gbadamosi Lateef. Paystack/NIBSS instruction queued.`
    );
  };

  const handleFullOperatorRelease = () => {
    setSplitRatio(100);
    showScreenToast("Authorized 100% Escrow Release (₦47,000) to Operator Muritala Lawal.");
  };

  const handleFullFarmerRefund = () => {
    setSplitRatio(0);
    showScreenToast("Authorized 100% Escrow Refund (₦47,000) to Farmer Gbadamosi Lateef.");
  };

  const handleEscalateBoard = () => {
    showScreenToast("Case #DSP-2026-014 escalated to Chief Arbitrator & Agronomy Board.");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16">
        {/* Navigation & Title */}
        <div className="flex flex-col gap-space-sm pt-space-md pb-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              <span>Platform Administration</span>
              <span className="text-outline-variant">/</span>
              <span>Trust &amp; Safety</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-bold">Dispute Resolution &amp; Proof-of-Work Arbitration (§11.3)</span>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Pilot 0% Commission Policy Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Escrow Frozen: ₦615,000 (3 Active Claims)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
                <Icon name="timer" className="text-[14px]" /> 48-Hour Arbitration SLA
              </span>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mt-1">
            <div className="max-w-4xl">
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">Dispute Resolution &amp; PoW Arbitration</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
                Investigate disagreements regarding machinery tillage quality, boundary gaps, weighbridge grain variances, and off-taker logistics using multi-spectral GIS polygons, CAN-bus engine telemetry, and tamper-evident SHA-256 evidence vaults.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs shrink-0">
              <button
                onClick={handleDownloadDossier}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-high transition-colors"
                type="button"
              >
                <Icon name="picture_as_pdf" className="text-[18px] text-on-surface-variant" />
                <span>Arbitration Dossier (PDF/Text)</span>
              </button>
              <button
                onClick={() => showScreenToast("Field agent inspection dispatched. Extension Officer Quadri Olapade notified via Termii SMS.")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-high transition-colors"
                type="button"
              >
                <Icon name="person_search" className="text-[18px] text-primary" />
                <span>Request Field Agent Inspection</span>
              </button>
              <button
                onClick={() => showScreenToast("Zenith Trustee settlement reconciliation batch executed. ₦615,000 across 3 disputes verified.")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow hover:bg-primary-container transition-colors"
                type="button"
              >
                <Icon name="account_balance_wallet" className="text-[18px]" />
                <span>Batch Escrow Reconciliation</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        {slot(slots, "kpis", (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Active Disputes Queue</span>
                <span className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center">
                  <Icon name="gavel" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-on-surface">3 Cases</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">-67% vs last mo</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">1 Critical · 1 Telemetry Review · 1 Awaiting Counterparty</p>
              </div>
              <div className="mt-space-sm pt-2 bg-surface-container-low px-2 py-1.5 rounded-lg flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Portfolio Dispute Rate</span>
                <span className="font-bold text-on-surface">0.38% (482 contracts)</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Total Frozen Escrow</span>
                <span className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                  <Icon name="lock_clock" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-on-surface">₦615,000</span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">100% Segregated</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Zenith Bank Trustee Segregated Fiduciary Account</p>
              </div>
              <div className="mt-space-sm pt-2 bg-secondary-container text-on-secondary-container px-2 py-1.5 rounded-lg flex items-center justify-between font-label-sm text-label-sm">
                <span>Fee Policy</span>
                <span className="font-bold">Zero commission deducted (₦0.00)</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Average Resolution SLA</span>
                <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <Icon name="speed" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-on-surface">28.4 Hours</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">Within Policy</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Target threshold: &lt; 48 Hours Strict SLA</p>
              </div>
              <div className="mt-space-sm pt-2 bg-surface-container-low px-2 py-1.5 rounded-lg flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Prorated Speed</span>
                <span className="font-bold text-secondary">19.6h faster than manual</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant">Algorithmic Proration Rate</span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                  <Icon name="auto_awesome" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-metric-num text-metric-num text-on-surface">88.2%</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">+12.4% MoM</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Settled via CAN-Bus/GIS geometry without court litigation</p>
              </div>
              <div className="mt-space-sm pt-2 bg-surface-container-low px-2 py-1.5 rounded-lg flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Human Escalation</span>
                <span className="font-bold text-on-surface">11.8% handled by Agronomists</span>
              </div>
            </div>
          </div>
        ))}

        {/* Queue Table */}
        {slot(slots, "queue", (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-space-xl">
            <div className="p-space-md flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                    activeFilter === "all" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  All Disputes (3)
                </button>
                <button
                  onClick={() => setActiveFilter("machinery")}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                    activeFilter === "machinery" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Machinery &amp; Tillage (1)
                </button>
                <button
                  onClick={() => setActiveFilter("produce")}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                    activeFilter === "produce" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Produce &amp; Off-take (1)
                </button>
                <button
                  onClick={() => setActiveFilter("labour")}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                    activeFilter === "labour" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Labour &amp; Weeding (1)
                </button>
                <button
                  onClick={() => {
                    setActiveFilter("archive");
                    showScreenToast("Viewing 42 resolved arbitration archives.");
                  }}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                    activeFilter === "archive" ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Resolved Archive (42)
                </button>
              </div>
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
                <Icon name="verified_user" className="text-[16px] text-secondary" />
                <span>Auto-sync enabled with Zenith Trustee API</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-space-md">Case ID &amp; Severity</th>
                    <th className="py-3 px-space-md">Category &amp; Ref</th>
                    <th className="py-3 px-space-md">Disputing Parties</th>
                    <th className="py-3 px-space-md">Escrow Frozen</th>
                    <th className="py-3 px-space-md w-1/4">Claim Core Issue</th>
                    <th className="py-3 px-space-md">PoW Score</th>
                    <th className="py-3 px-space-md">Status</th>
                    <th className="py-3 px-space-md text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {(activeFilter === "all" || activeFilter === "machinery") && (
                    <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                      <td className="py-3.5 px-space-md font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-error" />
                          <span className="font-headline-sm text-headline-sm text-on-surface">#DSP-2026-014</span>
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-error-container text-on-error-container">Action Required</span>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-semibold text-on-surface">Machinery Harrowing</div>
                        <div className="text-on-surface-variant text-[11px] font-mono">Job #BKG-2026-0482</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="text-on-surface font-semibold">Gbadamosi Lateef (Smallholder)</div>
                        <div className="text-on-surface-variant text-[11px]">vs Muritala Lawal (Tractor #04)</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₦47,000</span>
                        <div className="text-secondary text-[11px] font-semibold">Ready for split</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <p className="line-clamp-2 text-on-surface-variant leading-snug">Farmer asserts 0.68 Ha abandoned in north zone. Operator claims submerged granite ridge made sector impassable and hazardous to disc harrow.</p>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div className="bg-secondary h-full rounded-full" style={{ width: "98%" }} />
                          </div>
                          <span className="font-bold text-on-surface text-[12px]">98%</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant">CAN-Bus + GPS + Photos</span>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Proration Ready
                        </span>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <button
                          onClick={() => {
                            const elem = document.getElementById("activeDossierSection");
                            if (elem) elem.scrollIntoView({ behavior: "smooth" });
                            showScreenToast("Opened case #DSP-2026-014 in Arbitration Workbench.");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm shadow hover:bg-primary-container transition-colors"
                          type="button"
                        >
                          Arbitrate Case
                        </button>
                      </td>
                    </tr>
                  )}
                  {(activeFilter === "all" || activeFilter === "produce") && (
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-space-md font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-tertiary" />
                          <span className="text-on-surface">#DSP-2026-015</span>
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed text-on-tertiary-fixed">Under Review</span>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-semibold text-on-surface">Weighbridge Starch Variance</div>
                        <div className="text-on-surface-variant text-[11px] font-mono">CTR-2026-081</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="text-on-surface font-semibold">Psaltry International PLC</div>
                        <div className="text-on-surface-variant text-[11px]">vs Odo-Ogun Outgrower Union</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="font-bold text-on-surface">₦388,000</span>
                        <div className="text-on-surface-variant text-[11px]">4.2 MT disputed</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <p className="line-clamp-2 text-on-surface-variant leading-snug">Offtaker deducted 4.2 MT citing low starch (&lt;21%) &amp; soil tare. Outgrower presents farmgate NIR scan certifying 23.8% prior to transit.</p>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div className="bg-secondary h-full rounded-full" style={{ width: "85%" }} />
                          </div>
                          <span className="font-bold text-on-surface text-[12px]">85%</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant">Weighbridge slip + NIR</span>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline" /> Lab Re-test Pending
                        </span>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <button
                          onClick={() => showScreenToast("Viewing Psaltry vs Odo-Ogun NIR assay scan & weighbridge slip #CTR-2026-081.")}
                          className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          Inspect Waybill
                        </button>
                      </td>
                    </tr>
                  )}
                  {(activeFilter === "all" || activeFilter === "labour") && (
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-space-md font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-outline" />
                          <span className="text-on-surface">#DSP-2026-016</span>
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">New Claim</span>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-semibold text-on-surface">Labour Syndicate Weeding</div>
                        <div className="text-on-surface-variant text-[11px] font-mono">BKG-2026-0478</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="text-on-surface font-semibold">Saki West Maize Cluster</div>
                        <div className="text-on-surface-variant text-[11px]">vs Tawa Yusuf Weeding Crew</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="font-bold text-on-surface">₦180,000</span>
                        <div className="text-on-surface-variant text-[11px]">3.5 Ha claim</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <p className="line-clamp-2 text-on-surface-variant leading-snug">Inter-row weeding incomplete before rainfall. Crew reports boundary beacons were shifted by adjoining tenant farmer overnight.</p>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div className="bg-tertiary h-full rounded-full" style={{ width: "62%" }} />
                          </div>
                          <span className="font-bold text-on-surface text-[12px]">62%</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant">GPS track only</span>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-error" /> Missing Visuals
                        </span>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <button
                          onClick={() => showScreenToast("SMS notification sent to Tawa Yusuf crew requesting on-site weeding photos.")}
                          className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                          type="button"
                        >
                          Request Photos
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Dossier Section */}
        {slot(slots, "dossier", (
          <div className="flex flex-col gap-space-md mb-space-xl" id="activeDossierSection">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="w-3 h-8 rounded-full bg-primary" />
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Active Arbitration Dossier: Case #DSP-2026-014</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Tillage &amp; Soil Preparation Coverage Dispute · Massey Ferguson 375 4WD (SYND-04)</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm">
                <span className="text-on-surface-variant">Arbiter Assigned:</span>
                <span className="font-semibold text-primary">Quadri Olapade (FIDO2 Hardware Auth)</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                  <div className="flex flex-wrap items-center justify-between gap-space-xs">
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Geospatial Audit</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Cadastral Boundary vs. Tractor CAN-Bus Telemetry Overlay</h3>
                    </div>
                    <div className="flex items-center gap-1 font-label-sm text-label-sm">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">RTK Accuracy: ±2.5cm</span>
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold">PostGIS 3.4 Validated</span>
                    </div>
                  </div>
                  <div className="relative w-full h-80 rounded-xl bg-surface-dim overflow-hidden shadow-inner flex items-center justify-center">
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#134e33_1px,transparent_1px)] [background-size:16px_16px]" />
                    <svg className="w-full h-full p-4" fill="none" viewBox="0 0 600 320">
                      <line stroke="#c0c9c0" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="40" y1="20" y2="300" />
                      <line stroke="#c0c9c0" strokeDasharray="3 3" strokeWidth="1" x1="300" x2="300" y1="20" y2="300" />
                      <line stroke="#c0c9c0" strokeDasharray="3 3" strokeWidth="1" x1="560" x2="560" y1="20" y2="300" />
                      <line stroke="#c0c9c0" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="560" y1="160" y2="160" />
                      <polygon fill="#eff4ff" points="70,50 530,40 510,270 90,280" stroke="#003620" strokeDasharray="6 4" strokeWidth="2.5" />
                      <path d="M 72,120 L 525,110 L 510,268 L 92,278 Z" fill="#6cf8bb" fillOpacity="0.35" stroke="#006c49" strokeWidth="1.5" />
                      <path d="M 85,140 L 515,130 M 85,160 L 512,150 M 87,180 L 510,170 M 89,200 L 508,190 M 90,220 L 507,210 M 91,240 L 505,230 M 92,260 L 503,250" stroke="#006c49" strokeDasharray="4 2" strokeOpacity="0.6" strokeWidth="1.2" />
                      <polygon fill="#ffdcc3" fillOpacity="0.75" points="70,52 528,42 525,110 72,120" stroke="#6a3700" strokeWidth="2" />
                      <path d="M 120,68 Q 135,60 150,75 Q 165,90 145,95 Z" fill="#6a3700" fillOpacity="0.4" />
                      <path d="M 280,62 Q 310,50 330,72 Q 320,95 275,88 Z" fill="#6a3700" fillOpacity="0.5" />
                      <path d="M 410,65 Q 440,55 460,78 Q 430,102 395,85 Z" fill="#6a3700" fillOpacity="0.4" />
                      <circle cx="140" cy="80" fill="#ffdad6" r="10" stroke="#ba1a1a" strokeWidth="1.5" />
                      <circle cx="140" cy="80" fill="#ba1a1a" r="3" />
                      <circle cx="310" cy="72" fill="#ffdad6" r="12" stroke="#ba1a1a" strokeWidth="1.5" />
                      <circle cx="310" cy="72" fill="#ba1a1a" r="3" />
                      <circle cx="430" cy="78" fill="#ffdad6" r="10" stroke="#ba1a1a" strokeWidth="1.5" />
                      <circle cx="430" cy="78" fill="#ba1a1a" r="3" />
                      <g transform="translate(90, 260)">
                        <circle cx="0" cy="0" fill="#003620" r="8" />
                        <circle cx="0" cy="0" fill="#ffffff" r="4" />
                        <text fill="#003620" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="700" x="12" y="4">07:14 Start</text>
                      </g>
                      <g transform="translate(480, 115)">
                        <circle cx="0" cy="0" fill="#ba1a1a" r="9" />
                        <polygon fill="#ffffff" points="0,-4 3,3 -3,3" />
                        <text fill="#ba1a1a" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="700" x="-120" y="-10">12:45 Safety Abort Trigger</text>
                      </g>
                    </svg>
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container-lowest/90 backdrop-blur shadow-sm text-on-surface font-mono text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> RPM: 1,640
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container-lowest/90 backdrop-blur shadow-sm text-on-surface font-mono text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Speed: 4.8 km/h
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-error-container text-on-error-container font-mono text-[11px] font-bold shadow-sm">
                        <Icon name="warning" className="text-[12px]" /> Slip Angle: 22° (Tilt Hazard Trip)
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 bg-surface-container-lowest/95 backdrop-blur p-2 rounded-lg shadow-sm flex flex-col gap-1 text-[11px] font-label-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-sm border-2 border-primary bg-surface-container-low" />
                        <span className="text-on-surface">Contract Boundary (4.50 Ha)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-sm bg-secondary-container" />
                        <span className="text-on-surface">Verified Tilled (3.82 Ha)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-sm bg-tertiary-fixed" />
                        <span className="text-on-surface">Granite Hazard (0.68 Ha)</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-body-sm text-body-sm">
                    <div className="p-2.5 bg-surface-container-low rounded-lg">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Total Contract Parcel</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">4.50 Ha</span>
                      <span className="text-[11px] text-on-surface-variant">100.0% expected</span>
                    </div>
                    <div className="p-2.5 bg-secondary-container rounded-lg text-on-secondary-container">
                      <span className="font-label-sm text-label-sm block">CAN-Bus Cultivated</span>
                      <span className="font-headline-sm text-headline-sm font-bold">3.82 Ha</span>
                      <span className="text-[11px] font-semibold">84.89% actual area</span>
                    </div>
                    <div className="p-2.5 bg-tertiary-fixed rounded-lg text-on-tertiary-fixed">
                      <span className="font-label-sm text-label-sm block">Verified Granite Outcrop</span>
                      <span className="font-headline-sm text-headline-sm font-bold">0.68 Ha</span>
                      <span className="text-[11px] font-semibold">15.11% excluded</span>
                    </div>
                    <div className="p-2.5 bg-surface-container-low rounded-lg">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Engine Work Hours</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">5.2 hrs</span>
                      <span className="text-[11px] text-secondary font-semibold">98.1% of 5.3h billable</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Visual Proof-of-Work</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">EXIF &amp; GPS-Anchored Photographic Evidence Chain (4/4 Verified)</h3>
                    </div>
                    <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold">
                      <Icon name="verified" className="text-[16px]" /> Cryptographically Stamped
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-space-sm">
                    <div className="group relative rounded-lg overflow-hidden bg-surface-container">
                      <img className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200" data-alt="Dry flat savanna soil before plowing" src="/images/screens/c86ff925b5e4.webp" alt="Pre-Tillage" loading="lazy" decoding="async" />
                      <div className="p-2 bg-surface-container-low">
                        <span className="font-label-sm text-label-sm font-bold text-on-surface block truncate">1. Pre-Tillage Baseline</span>
                        <span className="font-mono text-[10px] text-on-surface-variant block">07:18 WAT · Lat 7.9732°</span>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container text-[10px] font-semibold">Verified Parcel</span>
                      </div>
                    </div>
                    <div className="group relative rounded-lg overflow-hidden bg-surface-container">
                      <img className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200" data-alt="Freshly plowed agricultural land" src="/images/screens/43991769a9a2.webp" alt="Completed Sectors" loading="lazy" decoding="async" />
                      <div className="p-2 bg-surface-container-low">
                        <span className="font-label-sm text-label-sm font-bold text-on-surface block truncate">2. Completed Sectors A/B</span>
                        <span className="font-mono text-[10px] text-on-surface-variant block">10:42 WAT · 3.82 Ha</span>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container text-[10px] font-semibold">A-Grade Quality</span>
                      </div>
                    </div>
                    <div className="group relative rounded-lg overflow-hidden bg-surface-container">
                      <img className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200" data-alt="Granite rock boulder outcrops" src="/images/screens/90fd18b0af25.webp" alt="Granite Hazard" loading="lazy" decoding="async" />
                      <div className="p-2 bg-surface-container-low">
                        <span className="font-label-sm text-label-sm font-bold text-on-surface block truncate">3. Granite Ridge Hazard</span>
                        <span className="font-mono text-[10px] text-on-surface-variant block">12:20 WAT · Disc strike marks</span>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">Impassable Stone</span>
                      </div>
                    </div>
                    <div className="group relative rounded-lg overflow-hidden bg-surface-container">
                      <img className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200" data-alt="Field Agent on-site audit" src="/images/screens/4f4241d07409.webp" alt="Agent Audit" loading="lazy" decoding="async" />
                      <div className="p-2 bg-surface-container-low">
                        <span className="font-label-sm text-label-sm font-bold text-on-surface block truncate">4. Field Agent Audit</span>
                        <span className="font-mono text-[10px] text-on-surface-variant block">Agent Quadri O. · On-site</span>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">Signed Report</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arbitrator controls */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Disputant Testimonies</span>
                  <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold text-[11px]">GL</span>
                        <span className="font-label-md text-label-md text-on-surface font-bold">Gbadamosi Lateef</span>
                        <span className="text-[11px] text-on-surface-variant">(Smallholder)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-[10px] font-semibold">Tier 1 · BVN Valid</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface italic mt-1 leading-snug">
                      “I paid ₦47,000 for full 4.5 hectares plowing. Operator left 15% undone in the north sector. I had to pay manual day-labourers with hoes to finish the edges. I request ₦12,000 partial refund.”
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[11px]">ML</span>
                        <span className="font-label-md text-label-md text-on-surface font-bold">Muritala Lawal</span>
                        <span className="text-[11px] text-on-surface-variant">(Syndicate #04)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono text-[10px] font-semibold">4.95★ · 48 Jobs</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface italic mt-1 leading-snug">
                      “The northern boundary contains natural submerged granite boulders. My disc harrow sheer pins snapped twice. Forcing work on raw bedrock would shatter the tractor hydraulic arms. I completed every inch of plowable soil (3.82 Ha).”
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container text-on-surface flex items-start gap-2 text-[12px]">
                    <Icon name="policy" className="text-[18px] text-primary shrink-0" />
                    <div className="leading-tight">
                      <span className="font-bold">CultivaNode ToS §5.4 (Impassable Terrain &amp; Safety Abort):</span>
                      <span className="text-on-surface-variant">Operators are contractually protected from working unplowable geological hazards. Payout is prorated strictly against verified PostGIS traversed area.</span>
                    </div>
                  </div>
                </div>

                {/* Mathematical Proration Section */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Automated Math Engine</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Algorithmic Escrow Settlement Split</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">84.89% Verified</span>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant">Total Contract Escrow (Zenith Trustee)</span>
                      <span className="font-mono font-bold text-on-surface">₦47,000.00</span>
                    </div>
                    <div className="flex items-center justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant">Traversed Cultivable Area (PostGIS)</span>
                      <span className="font-mono text-on-surface">3.82 / 4.50 Ha (84.89%)</span>
                    </div>
                    <div className="flex items-center justify-between font-body-sm text-body-sm">
                      <span className="text-on-surface-variant">Platform Arbitration Commission</span>
                      <span className="font-mono text-secondary font-bold">₦0.00 (Pilot 0% Waiver)</span>
                    </div>
                    <div className="h-px bg-surface-container my-1" />
                    <div className="flex items-center justify-between font-headline-sm text-headline-sm">
                      <span className="text-primary font-bold">Operator Payout ({splitRatio}%):</span>
                      <span className="font-mono text-primary font-bold">₦{operatorPayout.toLocaleString()}.00</span>
                    </div>
                    <div className="flex items-center justify-between font-headline-sm text-headline-sm">
                      <span className="text-tertiary-container font-bold">Farmer Refund ({100 - splitRatio}%):</span>
                      <span className="font-mono text-tertiary-container font-bold">₦{farmerRefund.toLocaleString()}.00</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between font-label-sm text-label-sm">
                      <span className="text-on-surface-variant">Discretionary Arbitrator Adjustment</span>
                      <span className="font-mono text-primary font-bold" id="splitLabel">{splitRatio}% Operator / {100 - splitRatio}% Farmer</span>
                    </div>
                    <input
                      className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
                      max="100"
                      min="0"
                      type="range"
                      value={splitRatio}
                      onChange={(e) => setSplitRatio(Number(e.target.value))}
                    />
                    <span className="text-[11px] text-on-surface-variant leading-tight">Drag to override if unplowed boundary was due to operator negligence rather than natural granite.</span>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={handleExecuteSettlement}
                      className="w-full py-2.5 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold shadow hover:bg-primary-container transition-all flex items-center justify-center gap-2"
                      type="button"
                    >
                      <Icon name="gavel" className="text-[18px]" />
                      <span>Execute Telemetry-Prorated Settlement (₦{operatorPayout.toLocaleString()} / ₦{farmerRefund.toLocaleString()})</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleFullOperatorRelease}
                        className="py-2 px-3 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors text-center"
                        type="button"
                      >
                        Full Operator Release (₦47,000)
                      </button>
                      <button
                        onClick={handleFullFarmerRefund}
                        className="py-2 px-3 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors text-center"
                        type="button"
                      >
                        Full Farmer Refund (₦47,000)
                      </button>
                    </div>
                    <button
                      onClick={handleEscalateBoard}
                      className="w-full py-1.5 text-center text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-colors flex items-center justify-center gap-1"
                      type="button"
                    >
                      <Icon name="supervisor_account" className="text-[16px]" />
                      <span>Escalate to Chief Arbitrator &amp; Agronomy Board</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Audit Trail */}
        {slot(slots, "trail", (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="security" className="text-secondary text-[22px]" />
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Proof-of-Work Arbitration Audit Trail</h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Append-only ledger cryptographically anchoring dispute decisions, evidence hashes, and NIBSS refund triggers (§11.7).</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-mono text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Merkle Root: 0x93bf...771e
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp (WAT)</th>
                    <th className="py-2.5 px-3">Case ID</th>
                    <th className="py-2.5 px-3">Arbitrator / Method</th>
                    <th className="py-2.5 px-3">Evidence Hash (SHA-256)</th>
                    <th className="py-2.5 px-3">Ruling Outcome</th>
                    <th className="py-2.5 px-3 text-right">Settlement State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-mono text-[12px]">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3 text-on-surface">2026-04-20 11:15 WAT</td>
                    <td className="py-3 px-3 font-bold text-primary font-sans">#DSP-2026-014</td>
                    <td className="py-3 px-3 font-sans text-on-surface">Quadri Olapade (FIDO2 Hard-Token)</td>
                    <td className="py-3 px-3 text-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface">0x8f2a...c89e</span>
                      <span className="text-[10px] text-on-surface-variant block font-sans">RTK GeoJSON + 4 Exif JPGs</span>
                    </td>
                    <td className="py-3 px-3 font-sans text-on-surface"><span className="font-bold text-secondary">Prorated:</span> {splitRatio}% Operator / {100 - splitRatio}% Farmer</td>
                    <td className="py-3 px-3 text-right font-sans">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Paystack Split Queued</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3 text-on-surface">2026-04-18 16:30 WAT</td>
                    <td className="py-3 px-3 font-bold text-on-surface font-sans">#DSP-2026-013</td>
                    <td className="py-3 px-3 font-sans text-on-surface">Algorithmic Auto-Release (48h SLA)</td>
                    <td className="py-3 px-3 text-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface">0x4e1b...902a</span>
                      <span className="text-[10px] text-on-surface-variant block font-sans">Full Area RTK Verified (12.4 Ha)</span>
                    </td>
                    <td className="py-3 px-3 font-sans text-on-surface">100% Provider Release (₦125,000)</td>
                    <td className="py-3 px-3 text-right font-sans">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">NIBSS Transfer Cleared</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3 text-on-surface">2026-04-15 09:40 WAT</td>
                    <td className="py-3 px-3 font-bold text-on-surface font-sans">#DSP-2026-012</td>
                    <td className="py-3 px-3 font-sans text-on-surface">Support Panel (Weather Force Majeure)</td>
                    <td className="py-3 px-3 text-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface">0x3d9f...7104</span>
                      <span className="text-[10px] text-on-surface-variant block font-sans">NiMet Radar 54mm Rain Event</span>
                    </td>
                    <td className="py-3 px-3 font-sans text-on-surface">100% Farmer Free Reschedule</td>
                    <td className="py-3 px-3 text-right font-sans">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">Escrow Re-locked</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-space-sm pt-2 bg-surface-container-low p-3 rounded-lg text-on-surface-variant font-label-sm text-label-sm">
              <div className="flex flex-wrap items-center gap-space-md">
                <span className="flex items-center gap-1 text-on-surface"><Icon name="verified_user" className="text-[16px] text-secondary" /> NDPA 2023 Compliant PII Masking</span>
                <span className="flex items-center gap-1 text-on-surface"><Icon name="account_tree" className="text-[16px] text-primary" /> Zero-Trust Merkle Tree Root Verified</span>
              </div>
              <span className="text-[11px] text-on-surface-variant italic">All dispute decisions are legally binding under CultivaNode Pilot Master Agreement &amp; Nigerian Arbitration Act 2023.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
