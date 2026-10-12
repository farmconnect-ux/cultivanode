"use client";

// Ported from the "user_verification_kyc_hub" design.
// Augmented with real interactive state: active KYC dossier decisioning (approval, rejection, resubmission, escalation),
// investigation alert resolution, triage tab filtering, and compliance exports.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import { slot, type ScreenProps } from "./types";

export type VerificationHubSlot = "kpis" | "review" | "alert" | "triage" | "auditLog";

export function VerificationHub({ slots }: ScreenProps<VerificationHubSlot>) {
  const [activeDossierStatus, setActiveDossierStatus] = useState<
    "under_review" | "approved" | "rejected" | "resubmission" | "escalated"
  >("under_review");

  const [alertStatus, setAlertStatus] = useState<
    "flagged" | "declined" | "affidavit_requested" | "approved_secondary"
  >("flagged");

  const [triageFilter, setTriageFilter] = useState<
    "all" | "tier1" | "tier2" | "tier3" | "rejected" | "archive"
  >("all");

  const [triageSearch, setTriageSearch] = useState("");
  const [folakeApproved, setFolakeApproved] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleApproveDossier = () => {
    setActiveDossierStatus("approved");
    showScreenToast("Alhaji Kazeem Agro-Tractor Syndicate approved for Tier 3 Corporate (₦50M Escrow Authority).");
  };

  const handleRejectDossier = () => {
    setActiveDossierStatus("rejected");
    showScreenToast("Application #KYC-2026-0884 rejected. Reason code: NON_COMPLIANT.");
  };

  const handleRequestResubmission = () => {
    setActiveDossierStatus("resubmission");
    showScreenToast("Resubmission requested via Termii SMS & Email for Dossier #KYC-2026-0884.");
  };

  const handleEscalateDossier = () => {
    setActiveDossierStatus("escalated");
    showScreenToast("Dossier #KYC-2026-0884 escalated to Senior Compliance Lead.");
  };

  const handleManualBatch = () => {
    showScreenToast("Manual verification batch executed for 18 queued applications. Smile ID & NIMC synced.");
  };

  const handleReverificationPolicy = () => {
    showScreenToast("Re-Verification Policy: Annual 365-day certificate cycle under NDPA 2023 §11.2.");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16">
        {/* Title and Top Actions */}
        <div className="flex flex-col gap-space-sm mb-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
              <span>Platform Administration</span>
              <span className="text-outline">/</span>
              <span>Trust &amp; Safety</span>
              <span className="text-outline">/</span>
              <span className="text-primary font-bold">User Verification &amp; Accreditation (§11.2)</span>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span>Smile ID &amp; NIMC Biometric Gateway Live (98.2% Auto-Match)</span>
              </div>
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                <Icon name="verified_user" className="text-[14px] text-primary" />
                <span>NDPA 2023 Compliant PII Masking Active</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mt-space-xs">
            <div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface tracking-tight">User Verification &amp; KYC Hub</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-3xl">
                Process multi-tier identity checks, biometric verification, corporate CAC registration, and specialist equipment certifications across South-West Nigeria agro-clusters.
              </p>
            </div>
            <div className="flex items-center gap-space-sm shrink-0">
              <button
                onClick={handleReverificationPolicy}
                className="px-space-md py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-sm"
                type="button"
              >
                <Icon name="tune" className="text-[18px] text-on-surface-variant" />
                <span>Re-Verification Policy</span>
              </button>
              <a
                className="px-space-md py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-sm"
                href="/api/documents/compliance-audit"
              >
                <Icon name="download" className="text-[18px] text-on-surface-variant" />
                <span>Export Compliance Audit</span>
              </a>
              <button
                onClick={handleManualBatch}
                className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-sm"
                type="button"
              >
                <Icon name="fact_check" className="text-[18px]" />
                <span>Manual Verification Batch</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        {slot(slots, "kpis", (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Pending Verification Queue</span>
                <span className="p-1.5 rounded-lg bg-surface-container text-primary">
                  <Icon name="pending_actions" className="text-[20px]" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-on-surface">18</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Applications</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm">
                  <Icon name="trending_down" className="text-[14px]" />
                  <span>-22% backlog vs last week</span>
                </div>
              </div>
              <div className="mt-space-sm pt-space-xs bg-surface-container-low/60 rounded px-2 py-1.5 flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
                <span>11 Tier 1 (NIN)</span>
                <span className="text-outline">·</span>
                <span>5 Tier 2 (BVN)</span>
                <span className="text-outline">·</span>
                <span className="text-tertiary-container font-semibold">2 Tier 3 (CAC)</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Automated Clearance Rate</span>
                <span className="p-1.5 rounded-lg bg-secondary-container/40 text-secondary">
                  <Icon name="auto_awesome" className="text-[20px]" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-secondary">96.4%</span>
                  <span className="font-label-md text-label-md text-secondary">Pass</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-on-surface-variant font-label-sm text-label-sm">
                  <span>Smile ID AI Biometrics &amp; NIMC auto-cleared</span>
                </div>
              </div>
              <div className="mt-space-sm w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "96.4%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Average Turnaround Time</span>
                <span className="p-1.5 rounded-lg bg-surface-container text-primary">
                  <Icon name="avg_time" className="text-[20px]" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-on-surface">3.8</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Hours</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-secondary font-label-sm text-label-sm">
                  <Icon name="check_circle" className="text-[14px]" />
                  <span>Within 12-hour statutory SLA target</span>
                </div>
              </div>
              <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Instant for Tiers 0-1</span>
                <span>Corporate Tier 3 &lt; 8h</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant">Verified Member Directory</span>
                <span className="p-1.5 rounded-lg bg-surface-container text-primary">
                  <Icon name="badge" className="text-[20px]" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-on-surface">14,820</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">Profiles</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-on-surface-variant font-label-sm text-label-sm">
                  <span>Oyo, Ogun, Osun, Ondo &amp; Ekiti clusters</span>
                </div>
              </div>
              <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>100% Phone OTP</span>
                <span>84.6% NIN Bio</span>
                <span>48.2% BVN</span>
              </div>
            </div>
          </div>
        ))}

        {/* Active Review Dossier */}
        {slot(slots, "review", (
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg mb-space-lg relative overflow-hidden" id="activeReviewDossier">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-md border-b-0">
              <div className="flex flex-wrap items-center gap-space-sm">
                <div className="px-2.5 py-1 rounded-md bg-tertiary-container/15 text-tertiary-container font-label-sm text-label-sm font-bold tracking-wider uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary-container animate-ping" />
                  <span>
                    {activeDossierStatus === "approved"
                      ? "Approved Dossier #KYC-2026-0884"
                      : activeDossierStatus === "rejected"
                      ? "Rejected Dossier #KYC-2026-0884"
                      : activeDossierStatus === "resubmission"
                      ? "Resubmission Requested: Dossier #KYC-2026-0884"
                      : activeDossierStatus === "escalated"
                      ? "Escalated Dossier #KYC-2026-0884"
                      : "Active Review: Dossier #KYC-2026-0884"}
                  </span>
                </div>
                <span className="font-headline-md text-headline-md text-on-surface font-bold">Alhaji Kazeem Agro-Tractor Syndicate Ltd</span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">
                  <Icon name="shield_person" className="text-[14px]" />
                  <span>Target: Tier 3 — Corporate Syndicate</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">₦50,000,000 Escrow Clearance Authority</div>
              </div>
              <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low px-3 py-1.5 rounded-lg">
                <Icon name="schedule" className="text-[16px] text-primary" />
                <span>Submitted: 04 May 2026 · 09:14 WAT</span>
                <span className="text-outline">·</span>
                <span className="text-secondary font-semibold">Time Remaining: 08h 16m</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg pt-space-lg">
              {/* Col 1 */}
              <div className="lg:col-span-4 flex flex-col gap-space-md bg-surface-container-low/40 p-space-md rounded-xl">
                <div className="flex items-center justify-between pb-space-xs">
                  <div className="flex items-center gap-2">
                    <Icon name="domain" className="text-[20px] text-primary" />
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Identity &amp; CAC Registry</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container/50 text-on-secondary-container font-label-sm text-label-sm font-semibold">Verified Live</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">CAC Business Registration</span>
                    <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold"><Icon name="verified" className="text-[14px]" /> CAC API Valid</span>
                  </div>
                  <div className="font-label-lg text-label-lg text-on-surface">RC-1849201</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Alhaji Kazeem Agro-Tractor Syndicate Limited<br /> Incorporated: 12 Oct 2021 · Oyo State, Nigeria</div>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Managing Director (vNIN Check)</span>
                    <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold"><Icon name="fingerprint" className="text-[14px]" /> NIMC Match</span>
                  </div>
                  <div className="font-label-lg text-label-lg text-on-surface">Alhaji Kazeem Olalekan Gbadamosi</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">vNIN: <span className="font-mono text-on-surface font-semibold">4829-••••-1902</span><br /> DOB: 14 Aug 1974 · State of Origin: Oyo State</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary font-label-sm text-label-sm font-semibold">Phone Match: +234 803 ••• 4192</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Commercial Settlement (BVN)</span>
                    <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold"><Icon name="account_balance" className="text-[14px]" /> 100% Name Match</span>
                  </div>
                  <div className="font-label-lg text-label-lg text-on-surface">Zenith Bank Plc · Tier-3 Corporate</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Acc No: <span className="font-mono text-on-surface font-semibold">1018492019</span><br /> Account Title: Alhaji Kazeem Agro-Tractor Syndicate Ltd<br /> BVN Masked: <span className="font-mono text-on-surface font-semibold">2219••••840</span></div>
                </div>
              </div>

              {/* Col 2 */}
              <div className="lg:col-span-4 flex flex-col gap-space-md bg-surface-container-low/40 p-space-md rounded-xl">
                <div className="flex items-center justify-between pb-space-xs">
                  <div className="flex items-center gap-2">
                    <Icon name="precision_manufacturing" className="text-[20px] text-primary" />
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Fleet &amp; Asset Validation</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">5 Units Verified</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-2 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Declared Equipment Fleet</span>
                    <span className="text-secondary font-label-sm text-label-sm font-semibold">Proof of Ownership Attached</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                      <div className="flex items-center gap-2">
                        <Icon name="agriculture" className="text-[18px] text-primary" />
                        <div>
                          <div className="font-label-md text-label-md text-on-surface font-bold">4x Massey Ferguson MF 375</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">75 HP 4WD · S/N: MF-NG-2022-0941~0944</div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary font-label-sm text-label-sm">Inspected</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                      <div className="flex items-center gap-2">
                        <Icon name="shower" className="text-[18px] text-primary" />
                        <div>
                          <div className="font-label-md text-label-md text-on-surface font-bold">1x Agrional Boom Sprayer 800L</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">Hydraulic 12m Boom · Calibration: 2026-Q1</div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary font-label-sm text-label-sm">Certified</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Machinery &amp; Liability Insurance</span>
                    <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold"><Icon name="health_and_safety" className="text-[14px]" /> Policy Active</span>
                  </div>
                  <div className="font-label-lg text-label-lg text-on-surface">Leadway Assurance Agricultural Policy</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Policy #: <span className="font-mono text-on-surface font-semibold">AGR-2026-9812-OYS</span><br /> Valid Through: 31 Jan 2027 · Indemnity: ₦120,000,000<br /> Coverage: Accidental Damage, Fire, Theft &amp; Operator Liability</div>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-2 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Geofenced Base &amp; Workshop</span>
                    <span className="text-primary font-label-sm text-label-sm font-semibold">Cluster Registered</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="location_on" className="text-[18px] text-primary shrink-0 mt-0.5" />
                    <div className="font-body-sm text-body-sm text-on-surface">
                      <span className="font-semibold">Iseyin Central Hub &amp; Syndicate Bay 04</span>
                      <br />
                      <span className="text-on-surface-variant">Oyo-Iseyin Expressway, Iseyin Savanna Cluster</span>
                      <br />
                      <span className="font-mono text-label-sm text-label-sm text-on-surface-variant">GPS: 7.9732° N, 3.5901° E (Within boundary)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Col 3 */}
              <div className="lg:col-span-4 flex flex-col gap-space-md bg-surface-container-low/40 p-space-md rounded-xl">
                <div className="flex items-center justify-between pb-space-xs">
                  <div className="flex items-center gap-2">
                    <Icon name="face" className="text-[20px] text-primary" />
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Biometrics &amp; Risk Score</h2>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
                    <Icon name="bolt" className="text-[14px]" />
                    <span>99.1% Confidence</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Smile ID 3D Liveness vs NIMC Archive</span>
                    <span className="text-secondary font-label-sm text-label-sm font-bold">Passive Liveness: PASS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-sm">
                    <div className="flex flex-col items-center">
                      <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-high">
                        <img className="w-full h-full object-cover" data-alt="Portrait of Alhaji Kazeem" src="/images/screens/c82e0f541791.webp" alt="Live Selfie" loading="lazy" decoding="async" />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary/80 text-on-primary rounded font-label-sm text-label-sm">Live Selfie</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Captured 09:12 WAT</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-high">
                        <img className="w-full h-full object-cover" data-alt="NIMC database photo" src="/images/screens/438aef7c9074.webp" alt="NIMC Record" loading="lazy" decoding="async" />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-secondary/80 text-on-secondary rounded font-label-sm text-label-sm">NIMC Database</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">vNIN Record #1902</span>
                    </div>
                  </div>
                  <div className="mt-space-sm p-2 bg-secondary-container/20 rounded flex items-center justify-between font-label-sm text-label-sm text-on-secondary-container">
                    <span>Facial Geometry Match: 99.14%</span>
                    <span>Spoof Risk: 0.02%</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-2 shadow-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Attached Legal Instruments</span>
                  <div className="grid grid-cols-2 gap-2">
                    <a className="flex items-center gap-1.5 p-2 rounded bg-surface-container-low hover:bg-surface-container text-left transition-colors" href="/api/documents/compliance-audit">
                      <Icon name="description" className="text-[16px] text-primary" />
                      <span className="font-label-sm text-label-sm text-on-surface truncate">CAC_Form_1_1.pdf</span>
                    </a>
                    <a className="flex items-center gap-1.5 p-2 rounded bg-surface-container-low hover:bg-surface-container text-left transition-colors" href="/api/documents/compliance-audit">
                      <Icon name="receipt_long" className="text-[16px] text-primary" />
                      <span className="font-label-sm text-label-sm text-on-surface truncate">Zenith_Bank_Statement.pdf</span>
                    </a>
                    <a className="flex items-center gap-1.5 p-2 rounded bg-surface-container-low hover:bg-surface-container text-left transition-colors" href="/api/documents/compliance-audit">
                      <Icon name="assignment" className="text-[16px] text-primary" />
                      <span className="font-label-sm text-label-sm text-on-surface truncate">MF375_Invoices_Title.pdf</span>
                    </a>
                    <a className="flex items-center gap-1.5 p-2 rounded bg-surface-container-low hover:bg-surface-container text-left transition-colors" href="/api/documents/compliance-audit">
                      <Icon name="security" className="text-[16px] text-primary" />
                      <span className="font-label-sm text-label-sm text-on-surface truncate">Leadway_Policy_Cert.pdf</span>
                    </a>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col gap-1 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Sanctions &amp; AML Triage</span>
                    <span className="text-secondary font-label-sm text-label-sm font-bold">CLEAN</span>
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">PEP (Politically Exposed Person): <span className="text-on-surface font-semibold">Negative</span><br /> NFIU / EFCC Watchlist Scan: <span className="text-on-surface font-semibold">Clear</span> · Disputed Escrows: <span className="text-on-surface font-semibold">0</span></div>
                </div>
              </div>
            </div>

            {/* Officer Action Toolbar */}
            <div className="mt-space-lg pt-space-md border-t-0 bg-surface-container-low -mx-space-lg -mb-space-lg px-space-lg py-space-md flex flex-wrap items-center justify-between gap-space-md">
              <div className="flex items-center gap-2">
                <Icon name="gavel" className="text-[20px] text-primary" />
                <span className="font-label-md text-label-md text-on-surface font-semibold">Officer Decision Authority:</span>
                <span className="font-label-md text-label-md text-on-surface-variant font-mono">KYC-AUTH-QUADRI-9921</span>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm">
                <button
                  onClick={handleRejectDossier}
                  className="px-space-md py-2 rounded-lg bg-surface-container-lowest text-error hover:bg-error-container/40 transition-colors font-label-md text-label-md flex items-center gap-1.5"
                  type="button"
                >
                  <Icon name="block" className="text-[18px]" />
                  <span>Reject Application</span>
                </button>
                <button
                  onClick={handleRequestResubmission}
                  className="px-space-md py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md flex items-center gap-1.5"
                  type="button"
                >
                  <Icon name="replay" className="text-[18px]" />
                  <span>Request Resubmission</span>
                </button>
                <button
                  onClick={handleEscalateDossier}
                  className="px-space-md py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md flex items-center gap-1.5"
                  type="button"
                >
                  <Icon name="forward_to_inbox" className="text-[18px]" />
                  <span>Escalate to Senior Lead</span>
                </button>
                <button
                  onClick={handleApproveDossier}
                  className="px-space-lg py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-sm font-bold"
                  type="button"
                >
                  <Icon name="verified" className="text-[18px]" />
                  <span>Approve Tier 3 Syndicate</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Investigation Alert */}
        {slot(slots, "alert", (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md mb-space-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex items-start gap-space-sm">
                <span className="p-2 rounded-lg bg-tertiary-container/10 text-tertiary-container mt-0.5 shrink-0">
                  <Icon name="warning" className="text-[22px]" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">Investigation Alert #KYC-2026-0891: Name Divergence Flag</span>
                    <span className="px-2 py-0.5 rounded bg-tertiary-container/15 text-tertiary-container font-label-sm text-label-sm font-semibold">
                      {alertStatus === "flagged"
                        ? "Tier 2 Payout Blocked"
                        : alertStatus === "declined"
                        ? "Payout Tier Declined"
                        : alertStatus === "affidavit_requested"
                        ? "Affidavit Requested"
                        : "Approved via Secondary ID"}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Applicant: <span className="font-semibold text-on-surface">Babatunde Lawal</span> (Machinery Operator Applicant · Ido Local Govt, Ibadan Cluster). NIN identity returned <span className="font-mono text-on-surface">&quot;Babatunde G. Lawal&quot;</span>, while NIBSS BVN returned <span className="font-mono text-on-surface">&quot;Gbadamosi Babatunde Lawal&quot;</span> (Levenshtein Name Distance: 18%).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-space-xs shrink-0">
                <button
                  onClick={() => {
                    setAlertStatus("declined");
                    showScreenToast("Payout Tier 2 declined for Babatunde Lawal due to name divergence.");
                  }}
                  className="px-space-sm py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container font-label-sm text-label-sm transition-colors"
                  type="button"
                >
                  Decline Payout Tier
                </button>
                <button
                  onClick={() => {
                    setAlertStatus("affidavit_requested");
                    showScreenToast("Affidavit request dispatched to Babatunde Lawal via Termii SMS & Email.");
                  }}
                  className="px-space-sm py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container font-label-sm text-label-sm transition-colors"
                  type="button"
                >
                  Request Affidavit
                </button>
                <button
                  onClick={() => {
                    setAlertStatus("approved_secondary");
                    showScreenToast("Approved with voter's card secondary ID. Tier 2 unlocked for Babatunde Lawal.");
                  }}
                  className="px-space-md py-1.5 rounded-lg bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim transition-colors font-label-sm text-label-sm font-semibold flex items-center gap-1"
                  type="button"
                >
                  <Icon name="how_to_reg" className="text-[16px]" />
                  <span>Approve with Secondary ID</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Triage Queue */}
        {slot(slots, "triage", (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg mb-space-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-md">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Verification Triage Queue</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Filter applications by verification phase, role permissions, and compliance scores</p>
              </div>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-surface-container-low rounded-lg font-label-sm text-label-sm">
                <button
                  onClick={() => setTriageFilter("all")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    triageFilter === "all" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  All Pending (18)
                </button>
                <button
                  onClick={() => setTriageFilter("tier1")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    triageFilter === "tier1" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Tier 1 — NIN (11)
                </button>
                <button
                  onClick={() => setTriageFilter("tier2")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    triageFilter === "tier2" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Tier 2 — BVN (5)
                </button>
                <button
                  onClick={() => setTriageFilter("tier3")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    triageFilter === "tier3" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Tier 3 — CAC (2)
                </button>
                <button
                  onClick={() => setTriageFilter("rejected")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    triageFilter === "rejected" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Rejected (4)
                </button>
                <button
                  onClick={() => {
                    setTriageFilter("archive");
                    showScreenToast("Viewing 14,820 verified member archive records.");
                  }}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    triageFilter === "archive" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Archive (14,820)
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-space-sm mb-space-md">
              <div className="relative flex-1">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                <input
                  value={triageSearch}
                  onChange={(e) => setTriageSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:bg-surface-container transition-colors"
                  placeholder="Filter by applicant name, NIN, BVN, CAC RC number, phone or cooperative..."
                  type="text"
                />
              </div>
              <div className="flex items-center gap-space-xs shrink-0">
                <select className="h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm focus:outline-none">
                  <option>All Agro-Clusters (South-West)</option>
                  <option>Iseyin Savanna Cluster (Oyo)</option>
                  <option>Abeokuta Maize Syndicate (Ogun)</option>
                  <option>Ikole Cocoa Belt (Ekiti)</option>
                </select>
                <select className="h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm focus:outline-none">
                  <option>Confidence: &gt;95% Match</option>
                  <option>Confidence: 80% - 95%</option>
                  <option>Requires Manual Review</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-3 px-space-md rounded-l-lg">Applicant &amp; Phone</th>
                    <th className="py-3 px-space-sm">Requested Role</th>
                    <th className="py-3 px-space-sm">Target Tier</th>
                    <th className="py-3 px-space-sm">Submitted Documents</th>
                    <th className="py-3 px-space-sm">Biometric / API Score</th>
                    <th className="py-3 px-space-sm">Status</th>
                    <th className="py-3 px-space-md text-right rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {/* Row 1: Kazeem */}
                  {(triageFilter === "all" || triageFilter === "tier3") && (
                    <tr className="bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-space-md font-semibold text-on-surface">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          <div>
                            <div className="font-label-md text-label-md text-on-surface">Alhaji Kazeem Agro-Tractor Ltd</div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">+234 803 ••• 4192 · 04 May 2026</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">Machinery Syndicate</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-tertiary-container/15 text-tertiary-container font-label-sm text-label-sm font-semibold">Tier 3 (CAC + Escrow)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">CAC</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">BVN</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Fleet</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Insurance</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold">
                          <Icon name="verified" className="text-[16px]" />
                          <span>99.1% Face Match</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                          {activeDossierStatus === "approved"
                            ? "Approved"
                            : activeDossierStatus === "rejected"
                            ? "Rejected"
                            : "Under Active Inspection"}
                        </span>
                      </td>
                      <td className="py-3 px-space-md text-right">
                        <button
                          onClick={() => {
                            const elem = document.getElementById("activeReviewDossier");
                            if (elem) elem.scrollIntoView({ behavior: "smooth" });
                            showScreenToast("Viewing dossier for Alhaji Kazeem Agro-Tractor Syndicate.");
                          }}
                          className="px-3 py-1 rounded bg-primary-container text-on-primary font-label-sm text-label-sm hover:bg-primary transition-colors font-semibold"
                          type="button"
                        >
                          Reviewing
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* Row 2: Oluwaseun */}
                  {(triageFilter === "all" || triageFilter === "tier3") && (
                    <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-space-md text-on-surface">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Oluwaseun Adewale Agrochemicals</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">+234 814 ••• 9901 · 04 May 2026</div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-secondary-container/50 text-on-secondary-container font-label-sm text-label-sm font-semibold">Off-taker &amp; Inputs</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-tertiary-container/15 text-tertiary-container font-label-sm text-label-sm font-semibold">Tier 3 (CAC)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">CAC</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">BVN</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">NAFDAC</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold">
                          <Icon name="verified" className="text-[16px]" />
                          <span>98.8% Auto-Pass</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Awaiting Final Sign-off</span>
                      </td>
                      <td className="py-3 px-space-md text-right">
                        <button
                          onClick={() => showScreenToast("Dossier opened for Oluwaseun Adewale Agrochemicals (NAFDAC Cert #04-8921 Validated).")}
                          className="px-3 py-1 rounded bg-surface-container-low text-on-surface font-label-sm text-label-sm hover:bg-surface-container transition-colors"
                          type="button"
                        >
                          Open Dossier
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* Row 3: Folake */}
                  {(triageFilter === "all" || triageFilter === "tier1") && (
                    <tr className="bg-surface-container-low/20 hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-space-md text-on-surface">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Folake Ibironke (Ilesa Maize Coop)</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">+234 705 ••• 1120 · 04 May 2026</div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Smallholder Farmer</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold">Tier 1 (NIN Biometric)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">NIN Slip</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Selfie</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold">
                          <Icon name="verified" className="text-[16px]" />
                          <span>99.8% Liveness Pass</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">
                          {folakeApproved ? "Approved Tier 1" : "Auto-Cleared"}
                        </span>
                      </td>
                      <td className="py-3 px-space-md text-right">
                        <button
                          onClick={() => {
                            setFolakeApproved(true);
                            showScreenToast("Quick approved Folake Ibironke for Tier 1 Smallholder membership.");
                          }}
                          className="px-3 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm hover:bg-secondary-fixed transition-colors font-semibold"
                          type="button"
                        >
                          Quick Approve
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* Row 4: Babatunde */}
                  {(triageFilter === "all" || triageFilter === "tier2") && (
                    <tr className="bg-tertiary-container/5 hover:bg-tertiary-container/10 transition-colors">
                      <td className="py-3 px-space-md text-on-surface">
                        <div className="flex items-center gap-2">
                          <Icon name="error" className="text-[16px] text-tertiary-container" />
                          <div>
                            <div className="font-label-md text-label-md font-semibold text-on-surface">Babatunde Lawal</div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">+234 812 ••• 3311 · 04 May 2026</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Machinery Operator</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Tier 2 (BVN Payout)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">NIN</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">BVN</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Drivers Lic.</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1 text-tertiary-container font-label-sm text-label-sm font-bold">
                          <Icon name="warning" className="text-[16px]" />
                          <span>Name Mismatch (18%)</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary-container font-label-sm text-label-sm font-semibold">Manual Triage Needed</span>
                      </td>
                      <td className="py-3 px-space-md text-right">
                        <button
                          onClick={() => {
                            showScreenToast("Viewing investigation alert for Babatunde Lawal.");
                          }}
                          className="px-3 py-1 rounded bg-tertiary-container text-on-tertiary font-label-sm text-label-sm hover:opacity-90 transition-opacity font-semibold"
                          type="button"
                        >
                          Resolve Alert
                        </button>
                      </td>
                    </tr>
                  )}

                  {/* Row 5: Dr. Adekunle */}
                  {(triageFilter === "all" || triageFilter === "tier3") && (
                    <tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-space-md text-on-surface">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Dr. Adekunle Jimoh (DVM)</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">+234 802 ••• 8844 · 03 May 2026</div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">Lead Agronomist &amp; Vet</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-tertiary-container/15 text-tertiary-container font-label-sm text-label-sm font-semibold">Tier 3 (Specialist)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">NIN</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">VCN Reg</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">BVN</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold">
                          <Icon name="verified" className="text-[16px]" />
                          <span>VCN Active #2019/881</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Ready to Sign</span>
                      </td>
                      <td className="py-3 px-space-md text-right">
                        <button
                          onClick={() => showScreenToast("Opened accreditation docket for Dr. Adekunle Jimoh (Veterinary Council of Nigeria ID Verified).")}
                          className="px-3 py-1 rounded bg-surface-container-low text-on-surface font-label-sm text-label-sm hover:bg-surface-container transition-colors"
                          type="button"
                        >
                          Open Dossier
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-space-md pt-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
              <div>Showing 1 to 5 of 18 pending applications (Filtered from 14,838 total registry records)</div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors disabled:opacity-50"
                  disabled={currentPage === 1}
                  type="button"
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                      showScreenToast(`Viewing registry page ${currentPage - 1}`);
                    }
                  }}
                >
                  <Icon name="chevron_left" className="text-[16px]" />
                </button>
                <button
                  className={`px-2.5 py-1 rounded transition-colors ${currentPage === 1 ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container-low hover:bg-surface-container text-on-surface"}`}
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    showScreenToast("Viewing registry page 1");
                  }}
                >
                  1
                </button>
                <button
                  className={`px-2.5 py-1 rounded transition-colors ${currentPage === 2 ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container-low hover:bg-surface-container text-on-surface"}`}
                  type="button"
                  onClick={() => {
                    setCurrentPage(2);
                    showScreenToast("Viewing registry page 2");
                  }}
                >
                  2
                </button>
                <button
                  className={`px-2.5 py-1 rounded transition-colors ${currentPage === 3 ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container-low hover:bg-surface-container text-on-surface"}`}
                  type="button"
                  onClick={() => {
                    setCurrentPage(3);
                    showScreenToast("Viewing registry page 3");
                  }}
                >
                  3
                </button>
                <button
                  className="p-1.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors"
                  type="button"
                  onClick={() => {
                    if (currentPage < 3) {
                      setCurrentPage(currentPage + 1);
                      showScreenToast(`Viewing registry page ${currentPage + 1}`);
                    }
                  }}
                >
                  <Icon name="chevron_right" className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Audit Log */}
        {slot(slots, "auditLog", (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg mb-space-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md">
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="history_edu" className="text-[20px] text-primary" />
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Append-Only KYC Audit Log &amp; Checksum Proof</h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Every automated and manual identity accreditation is cryptographically stamped into SQLite PowerSync replication with SHA-256 integrity proofs.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-surface-container-low text-on-surface font-mono font-label-sm text-label-sm">Chain Block: #048,291 · Sync Active</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-2.5 px-space-md rounded-l-lg">Timestamp (WAT)</th>
                    <th className="py-2.5 px-space-sm">Verifier / Auth Key</th>
                    <th className="py-2.5 px-space-sm">Target Entity</th>
                    <th className="py-2.5 px-space-sm">Verification Gateway</th>
                    <th className="py-2.5 px-space-sm">Action Taken</th>
                    <th className="py-2.5 px-space-md text-right rounded-r-lg font-mono">SHA-256 Checksum Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  <tr className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-2.5 px-space-md font-mono text-on-surface-variant">04 May 2026 09:18:22</td>
                    <td className="py-2.5 px-space-sm font-semibold text-on-surface">Quadri Olapade (FIDO2)</td>
                    <td className="py-2.5 px-space-sm text-on-surface">Alhaji Kazeem Agro-Tractor Syndicate</td>
                    <td className="py-2.5 px-space-sm text-on-surface-variant">Smile ID Biometrics v3.4</td>
                    <td className="py-2.5 px-space-sm">
                      <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-secondary font-label-sm text-label-sm font-semibold">Dossier Inspection Initiated</span>
                    </td>
                    <td className="py-2.5 px-space-md text-right font-mono text-on-surface-variant text-label-sm text-label-sm">7f8a...c902b4</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-2.5 px-space-md font-mono text-on-surface-variant">04 May 2026 09:12:04</td>
                    <td className="py-2.5 px-space-sm text-on-surface-variant">Autonomous Daemon #03</td>
                    <td className="py-2.5 px-space-sm text-on-surface">Folake Ibironke (Farmer #9912)</td>
                    <td className="py-2.5 px-space-sm text-on-surface-variant">NIMC vNIN Gateway (Dojah API)</td>
                    <td className="py-2.5 px-space-sm">
                      <span className="px-2 py-0.5 rounded bg-secondary-container/40 text-secondary font-label-sm text-label-sm font-semibold">Automated Tier 1 Approved</span>
                    </td>
                    <td className="py-2.5 px-space-md text-right font-mono text-on-surface-variant text-label-sm text-label-sm">4b11...99e821</td>
                  </tr>
                  <tr className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-2.5 px-space-md font-mono text-on-surface-variant">04 May 2026 08:55:40</td>
                    <td className="py-2.5 px-space-sm text-on-surface-variant">Autonomous Daemon #01</td>
                    <td className="py-2.5 px-space-sm text-on-surface">Babatunde Lawal (Operator #104)</td>
                    <td className="py-2.5 px-space-sm text-on-surface-variant">NIBSS BVN API (Prembly)</td>
                    <td className="py-2.5 px-space-sm">
                      <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary-container font-label-sm text-label-sm font-semibold">Mismatch Flag Raised</span>
                    </td>
                    <td className="py-2.5 px-space-md text-right font-mono text-on-surface-variant text-label-sm text-label-sm">3c29...0189fa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Legal notice */}
        <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <Icon name="verified" className="text-[24px]" />
            </div>
            <div>
              <div className="font-label-lg text-label-lg text-on-surface font-bold">Nigeria Data Protection Act (NDPA) 2023 &amp; CBN Regulated Vault</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Biometric selfies, raw NIN numbers, and BVN hashes are encrypted using AES-256 at rest. Zero unmasked PII is rendered across public logs.</p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs shrink-0">
            <span className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm font-semibold shadow-sm">ISO/IEC 27001 Certified</span>
            <span className="px-2.5 py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">Tier-3 Encrypted Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
