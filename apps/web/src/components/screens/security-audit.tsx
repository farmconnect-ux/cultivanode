"use client";

// Ported from the "security_audit_compliance" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useDeferredValue, useState } from "react";
import { Icon } from "@/components/ds/icon";
import { showScreenToast, ScreenDialog, ScreenDialogClose } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export type SecurityAuditSlot = "kpis" | "ledger" | "access" | "incidents" | "trail";

type AuditRecord = {
  id: string;
  timestamp: string;
  type: string;
  typeCategory: "kyc" | "rls" | "settlement" | "standard" | "escrow";
  actor: string;
  actorKey: string;
  target: string;
  hash: string;
  verificationBadge: string;
};

const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  {
    id: "rec1",
    timestamp: "2026-04-12 16:42:18",
    type: "KYC Sign-off",
    typeCategory: "kyc",
    actor: "verification.officer",
    actorKey: "KEY#8841-FIDO2",
    target: "public.verifications",
    hash: "0xa34e8891f09bbca1170942ef331a980c",
    verificationBadge: "Verified #48,291",
  },
  {
    id: "rec2",
    timestamp: "2026-04-12 16:41:04",
    type: "RLS Reload",
    typeCategory: "rls",
    actor: "platform.ops",
    actorKey: "KEY#0192-mTLS",
    target: "pg_policy_definitions",
    hash: "0x55bc1484920abef9948201ad8992ca10",
    verificationBadge: "Verified #48,290",
  },
  {
    id: "rec3",
    timestamp: "2026-04-12 16:30:12",
    type: "Settlement",
    typeCategory: "settlement",
    actor: "automated.daemon#01",
    actorKey: "VAULT#SYS-CRON",
    target: "public.postings",
    hash: "0x992fa17482937748102bdc90184200ea",
    verificationBadge: "Verified #48,289",
  },
  {
    id: "rec4",
    timestamp: "2026-04-12 16:15:45",
    type: "Standard Update",
    typeCategory: "standard",
    actor: "Dr. Quadri Olapade",
    actorKey: "KEY#YUBI-5C-0941",
    target: "agronomy_standards",
    hash: "0x117ca884029109ad552bba9901452efc",
    verificationBadge: "Verified #48,288",
  },
  {
    id: "rec5",
    timestamp: "2026-04-12 15:58:20",
    type: "Escrow Override",
    typeCategory: "escrow",
    actor: "zenith.trustee#ops",
    actorKey: "KEY#HSM-ESCROW-2",
    target: "escrow_dispatches",
    hash: "0x88ee273b1104812fcc091a27748bb701",
    verificationBadge: "Verified #48,287",
  },
];

export function SecurityAudit({ slots }: ScreenProps<SecurityAuditSlot>) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  // Filter on a deferred copy so typing stays smooth while the list re-renders.
  const deferredSearchFilter = useDeferredValue(searchFilter);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lockReleased, setLockReleased] = useState(false);
  const [merkleVerifying, setMerkleVerifying] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);

  // Filtered audit records
  const filteredLogs = auditLogs.filter((log) => {
    if (filterType !== "all" && log.typeCategory !== filterType) return false;
    if (deferredSearchFilter.trim()) {
      const q = deferredSearchFilter.toLowerCase();
      const match =
        log.hash.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.type.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Handlers
  const handleExportProofs = () => {
    const jsonLd = JSON.stringify(
      {
        "@context": "https://w3id.org/security/v2",
        type: "MerkleProofBundle",
        epoch: 341,
        root: "0x93bf88a4e390c5021fa0bbd743a502ef194d89a19cbf44018e69771e843c0892",
        blockHeight: 48291,
        algorithm: "SHA-256d-RFC6962",
        timestamp: new Date().toISOString(),
        issuer: "did:cultivanode:trust-anchor-oyo-01",
        records: auditLogs.map((l) => ({
          target: l.target,
          hash: l.hash,
          operator: l.actorKey,
        })),
      },
      null,
      2
    );
    downloadFile(jsonLd, `CultivaNode-JSON-LD-Merkle-Proofs-Epoch-341.jsonld`, "application/ld+json");
    showScreenToast("Exported JSON-LD cryptographic Merkle proofs bundle.");
  };

  const handleExportCompliance = () => {
    const report =
      "FEDERAL REPUBLIC OF NIGERIA - NDPA 2023 STATUTORY COMPLIANCE DOSSIER\n" +
      `Date Generated: ${new Date().toLocaleDateString("en-NG", { dateStyle: "full" })}\n` +
      "Data Controller: CultivaNode Agro-Node Technologies Ltd (NDPC Registered)\n" +
      "Registration Number: #NDPC-FCT-2024-09881\n" +
      "Data Protection Officer: dpo@cultivanode.io (Zenith Chambers, Lagos)\n" +
      "\n--- ZERO-TRUST TECHNICAL ENFORCEMENT ---\n" +
      "1. FIDO2 / YubiKey 5C hardware authentication enforced for all privileged admin sessions.\n" +
      "2. Row Level Security (RLS): 35/35 tables strictly isolated with tenant partition rules.\n" +
      "3. Append-Only Ledger: 48,291 SHA-256 records verified against Merkle Root #341.\n" +
      "4. Data Minimization: NIN & BVN vaulted in AES-256-GCM hardware security module (HSM).\n" +
      "5. Data Subject Access Requests (DSAR): 14 completed, 0 statutory SLA breaches.\n";
    downloadFile(report, `CultivaNode-NDPA-2023-Statutory-Audit.txt`, "text/plain");
    showScreenToast("NDPA 2023 statutory audit compliance report generated.");
  };

  const handleRunMerkleProof = () => {
    setMerkleVerifying(true);
    setTimeout(() => {
      setMerkleVerifying(false);
      showScreenToast("On-Demand Merkle Proof verified: 48,291 SHA-256 block hashes valid. Zero discrepancies.");
    }, 800);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    showScreenToast(`Copied SHA-256 hash to clipboard: ${hash.slice(0, 16)}...`);
  };

  const handleLivePoll = () => {
    const newRecord: AuditRecord = {
      id: `rec-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      type: "Telemetry Anchor",
      typeCategory: "rls",
      actor: "automated.daemon#01",
      actorKey: "VAULT#EDGE-CRON",
      target: "public.iot_telemetry",
      hash: "0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2),
      verificationBadge: `Verified #${48291 + auditLogs.length}`,
    };
    setAuditLogs((prev) => [newRecord, ...prev]);
    showScreenToast("Live poll: Captured newest cryptographic leaf anchor.");
  };

  // Modals
  const modalLockdown = (
    <div className="flex flex-col gap-4 p-4 max-w-lg">
      <div className="flex items-center gap-2 text-error">
        <Icon name="lock_clock" className="text-2xl" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Emergency Platform Lockdown</h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        This high-consequence action suspends all non-critical microservices, revokes all unauthenticated sessions, freezes automated escrow sweeps, and requires Super Admin FIDO2 hardware re-attestation to restore.
      </p>
      <div className="p-3 bg-error-container/30 border border-error-container rounded-lg text-body-sm text-on-surface">
        <strong>Mandatory Safety Rule:</strong> Critical livestock ventilation controls and offline SQLite local synchronization will remain in read-only defensive mode.
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <ScreenDialogClose>
          <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md">
            Cancel
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button
            onClick={() => showScreenToast("Lockdown simulated: Platform entered defensive posture. Privileged sessions isolated.")}
            type="button"
            className="px-4 py-2 rounded-lg bg-error text-on-error font-label-md text-label-md font-semibold"
          >
            Confirm Defensive Lockdown
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const modalEditRules = (
    <div className="flex flex-col gap-4 p-4 max-w-lg">
      <div className="flex items-center gap-2">
        <Icon name="auto_delete" className="text-xl text-primary" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">NDPA 2023 Data Retention Rules</h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Configure automated cryptographic scrubbing intervals in accordance with Section 28 of the Nigeria Data Protection Act 2023.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          showScreenToast("Data retention rules updated and committed to append-only policy ledger.");
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Farmer Biometric Purge Interval</label>
          <select defaultValue="90" className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none">
            <option value="30">30 Days (Strict Minimization)</option>
            <option value="60">60 Days</option>
            <option value="90">90 Days (Standard Statutory)</option>
          </select>
        </div>
        <div>
          <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Machinery GPS Track Decimation</label>
          <select defaultValue="180" className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none">
            <option value="90">90 Days</option>
            <option value="180">180 Days (Polygon centroid compression)</option>
            <option value="365">365 Days (Full audit pack)</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose>
            <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button onClick={() => {}} type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">
              Save Policies
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const modalAlertLimits = (
    <div className="flex flex-col gap-4 p-4 max-w-lg">
      <div className="flex items-center gap-2">
        <Icon name="tune" className="text-xl text-primary" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Configure Heuristic Tripwires</h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Adjust velocity and gateway thresholds that automatically freeze tokens or issue Termii SMS challenges.
      </p>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-2.5 bg-surface-container-low rounded-lg">
          <div>
            <span className="font-label-md text-label-md text-on-surface font-semibold block">Impossible Travel Velocity</span>
            <span className="text-on-surface-variant text-label-sm">Trigger when login distance exceeds 300 km/h</span>
          </div>
          <span className="font-bold text-secondary text-sm">Active</span>
        </div>
        <div className="flex justify-between items-center p-2.5 bg-surface-container-low rounded-lg">
          <div>
            <span className="font-label-md text-label-md text-on-surface font-semibold block">vNIN Verification Burst Cap</span>
            <span className="text-on-surface-variant text-label-sm">Throttle at &gt; 40 checks/min per tenant</span>
          </div>
          <span className="font-bold text-secondary text-sm">Active</span>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <ScreenDialogClose>
          <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">
            Done
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  const modalContactDpo = (
    <div className="flex flex-col gap-4 p-4 max-w-lg">
      <div className="flex items-center gap-2">
        <Icon name="contact_mail" className="text-xl text-primary" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Contact Data Protection Officer</h3>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Submit statutory inquiries, data portability requests, or audit notifications directly to CultivaNode&apos;s Legal &amp; Compliance Chambers.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          showScreenToast("Inquiry dispatched to DPO (dpo@cultivanode.io). Statutory reference #DPO-2026-902 created.");
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Subject</label>
          <input
            required
            defaultValue="NDPA 2023 Section 31 Audit Inquiry"
            className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none"
          />
        </div>
        <div>
          <label className="font-label-sm text-label-sm font-semibold text-on-surface block mb-1">Inquiry / Notice Body</label>
          <textarea
            rows={3}
            required
            placeholder="Specify regulatory reference or data subject details..."
            className="w-full bg-surface-container-low p-2 rounded-lg text-body-sm border border-outline-variant focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <ScreenDialogClose>
            <button onClick={() => {}} type="button" className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button onClick={() => {}} type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">
              Send to DPO
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16 space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <nav className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
              <span className="hover:text-primary transition-colors cursor-pointer">Platform Administration</span>
              <span className="text-outline-variant">/</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Trust &amp; Governance</span>
              <span className="text-outline-variant">/</span>
              <span className="font-semibold text-primary">Security, Audit &amp; Compliance (§11.7)</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span>NDPA 2023 Audit Active</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-medium">
                <Icon name="verified_user" className="text-[14px] text-primary" />
                <span>Zero-Trust: 100% RLS</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-medium">
                <Icon name="account_tree" className="text-[14px] text-secondary" />
                <span>Merkle Root: Depth 24</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Telemetry: 5s Poll</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface-container-lowest p-6 rounded-xl shadow-sm">
            <div className="flex flex-col gap-1 max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
                  <Icon name="gavel" className="text-[24px]" />
                </div>
                <div>
                  <h1 className="font-headline-lg text-headline-lg text-on-background tracking-tight">
                    Security, Audit &amp; Compliance
                  </h1>
                  <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">
                    Statutory Oversight Specification §11.7 · Phase 1 Build Plan Doc 41
                  </p>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                Continuous cryptographic audit trails, privileged session authorization, Zero-Trust Row Level Security (RLS) enforcement, and NDPA 2023 regulatory data privacy oversight across all agro-nodes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleExportProofs}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-sm"
                id="btn-export-proof"
                type="button"
              >
                <Icon name="download_for_offline" className="text-[18px]" />
                <span>Export JSON-LD Proofs</span>
              </button>
              <button
                onClick={handleExportCompliance}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-sm"
                type="button"
              >
                <Icon name="policy" className="text-[18px]" />
                <span>NDPA Compliance Report</span>
              </button>
              <ScreenDialog title="Emergency Lockdown" side="center" panel={modalLockdown}>
                <button
                  onClick={() => {}}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-error-container text-error hover:bg-error hover:text-on-error font-label-md text-label-md transition-colors shadow-sm"
                  id="btn-lockdown"
                  type="button"
                >
                  <Icon name="lock_clock" className="text-[18px]" />
                  <span>Lockdown Protocol</span>
                </button>
              </ScreenDialog>
            </div>
          </div>
        </div>

        {slot(
          slots,
          "kpis",
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Merkle Ledger</span>
                <Icon name="verified" className="text-secondary text-[20px]" />
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-primary">100% Valid</div>
                <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">0 Broken Blocks</div>
              </div>
              <div className="mt-3 pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low px-2 py-1 rounded">
                48,291 SHA-256 links verified
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Privileged Access</span>
                <Icon name="vpn_key" className="text-primary text-[20px]" />
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-on-surface">4 Active</div>
                <div className="font-label-md text-label-md text-primary font-semibold mt-0.5">100% FIDO2 / YubiKey</div>
              </div>
              <div className="mt-3 pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low px-2 py-1 rounded">
                0 password-only sessions
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Postgres RLS</span>
                <Icon name="shield" className="text-secondary text-[20px]" />
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-primary">35 / 35</div>
                <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">100% Tables Guarded</div>
              </div>
              <div className="mt-3 pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low px-2 py-1 rounded">
                0 bypass leaks · pgTAP OK
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">NDPA Privacy</span>
                <Icon name="visibility_off" className="text-primary text-[20px]" />
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-on-surface">99.8%</div>
                <div className="font-label-md text-label-md text-primary font-semibold mt-0.5">Automated Scrubbing</div>
              </div>
              <div className="mt-3 pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low px-2 py-1 rounded">
                NIN / BVN AES-256 vaulted
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">Threat Triage</span>
                <Icon name="warning" className="text-tertiary-container text-[20px]" />
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-on-surface">1 Low</div>
                <div className="font-label-md text-label-md text-tertiary font-semibold mt-0.5">0 Critical / Elevated</div>
              </div>
              <div className="mt-3 pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low px-2 py-1 rounded">
                Geo-velocity alert isolated
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider">DSAR Queue</span>
                <Icon name="assignment_turned_in" className="text-primary text-[20px]" />
              </div>
              <div>
                <div className="font-metric-num text-metric-num text-on-surface">14 Closed</div>
                <div className="font-label-md text-label-md text-secondary font-semibold mt-0.5">0 SLA Breaches</div>
              </div>
              <div className="mt-3 pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low px-2 py-1 rounded">
                Portability &amp; Erasure &lt;24h
              </div>
            </div>
          </div>
        )}

        {slot(
          slots,
          "ledger",
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 bg-surface-container-low -mx-6 -mt-6 p-6 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <Icon name="account_tree" className="text-[22px]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-md text-headline-md text-on-surface">Append-Only Cryptographic Ledger</h2>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold">
                      Active Merkle Root
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Immutable SHA-256 Block Anchoring synchronized to Supabase pg_cron hash anchors &amp; WORM S3 mirror
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant" id="verif-timestamp">
                  Last verified: 42 seconds ago
                </span>
                <button
                  onClick={handleRunMerkleProof}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-label-md text-label-md shadow-sm"
                  id="btn-verify-merkle"
                  type="button"
                >
                  <Icon name={merkleVerifying ? "hourglass_top" : "sync"} className={`text-[18px] ${merkleVerifying ? "animate-spin" : ""}`} />
                  <span>{merkleVerifying ? "Verifying..." : "Run On-Demand Merkle Proof"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>CURRENT MERKLE ROOT (EPOCH #341)</span>
                  <span className="font-semibold text-secondary">Depth 24</span>
                </div>
                <div className="font-mono text-sm text-primary font-bold break-all bg-surface-container-lowest p-2 rounded">
                  0x93bf88a4e390c5021fa0bbd743a502ef194d89a19cbf44018e69771e843c0892
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
                  <span>Block Height: #048,291</span>
                  <span>Timestamp: 16:42:18 WAT</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span>PREVIOUS EPOCH ROOT (#340)</span>
                  <span className="text-on-surface font-medium">Reconciled</span>
                </div>
                <div className="font-mono text-sm text-on-surface font-medium break-all bg-surface-container-lowest p-2 rounded">
                  0x8f2a64c119e0029b4fa0120cd391ea2803b8cc156ff992b45e0dc89e77bfa210
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
                  <span>Block Height: #048,150</span>
                  <span>1,420 Txns / Epoch</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between">
                <div>
                  <div className="text-on-surface-variant font-label-sm text-label-sm mb-1 uppercase tracking-wider">Cryptographic Telemetry</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Proof Latency</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface">1.4 ms</p>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Ingestion Rate</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface">~1,420 blk/d</p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 text-secondary font-label-sm text-label-sm flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Dual Hash Replication: AWS eu-west-1 WORM</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-inner">
              <div className="flex items-center justify-between mb-3 text-on-surface font-label-sm text-label-sm font-semibold">
                <span>LIVE MERKLE TREE LEAF PIPELINE (RECENT CONCURRENT ANCHORS)</span>
                <span className="text-on-surface-variant font-normal">Algorithm: SHA-256d RFC 6962 Standard</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Leaf #48,291</span>
                    <span className="text-secondary font-bold">Anchored</span>
                  </div>
                  <div className="font-label-md text-label-md text-on-surface font-semibold truncate">KYC Approval #0884</div>
                  <span className="font-mono text-xs text-primary truncate">0xa34e8...31cc</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">16:42:18 WAT</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Leaf #48,290</span>
                    <span className="text-secondary font-bold">Anchored</span>
                  </div>
                  <div className="font-label-md text-label-md text-on-surface font-semibold truncate">RLS Policy Update</div>
                  <span className="font-mono text-xs text-primary truncate">0x55bc1...ef99</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">16:41:04 WAT</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Leaf #48,289</span>
                    <span className="text-secondary font-bold">Anchored</span>
                  </div>
                  <div className="font-label-md text-label-md text-on-surface font-semibold truncate">NIBSS Settlement Batch</div>
                  <span className="font-mono text-xs text-primary truncate">0x992fa...4481</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">16:30:12 WAT</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Leaf #48,288</span>
                    <span className="text-secondary font-bold">Anchored</span>
                  </div>
                  <div className="font-label-md text-label-md text-on-surface font-semibold truncate">Maize Standard v3.2</div>
                  <span className="font-mono text-xs text-primary truncate">0x117ca...09ad</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">16:15:45 WAT</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Leaf #48,287</span>
                    <span className="text-secondary font-bold">Anchored</span>
                  </div>
                  <div className="font-label-md text-label-md text-on-surface font-semibold truncate">Escrow Release ₦4.2M</div>
                  <span className="font-mono text-xs text-primary truncate">0x88ee2...73b1</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">15:58:20 WAT</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {slot(
          slots,
          "access",
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <Icon name="admin_panel_settings" className="text-[22px]" />
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Privileged Access &amp; Authentication Sentinel</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Zero-Trust hardware token enforcement (FIDO2 / YubiKey 5C) and active session risk scores
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span>Hardware MFA Enforced</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-3 px-4">Operator &amp; Role</th>
                    <th className="py-3 px-4">Auth Mechanism</th>
                    <th className="py-3 px-4">IP &amp; Geolocation / Network</th>
                    <th className="py-3 px-4">Target Resource / Scope</th>
                    <th className="py-3 px-4">Session Duration</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4 text-right">Sentinel Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">QO</div>
                        <div>
                          <div className="font-label-md text-label-md text-on-surface font-semibold">Dr. Quadri Olapade</div>
                          <div className="font-label-sm text-label-sm text-primary">Super Admin · Lead Agronomist</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <Icon name="token" className="text-secondary text-[16px]" />
                        <span className="font-semibold text-xs">YubiKey 5C FIDO2 + PIN</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Hardware Attested</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-on-surface">102.89.44.12</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Lagos (MTN Enterprise Fiber)</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-xs text-primary font-medium">agronomy_standards:v3.2</span>
                    </td>
                    <td className="py-3 px-4 text-on-surface">
                      1h 24m <span className="text-on-surface-variant text-xs">(Expires 4h)</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 0.02 (Nominal)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => showScreenToast("Step-up FIDO2 challenge triggered for Dr. Quadri Olapade.")}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                          title="Trigger Step-Up Auth"
                          type="button"
                        >
                          <Icon name="verified" className="text-[18px]" />
                        </button>
                        <button
                          onClick={() => showScreenToast("Session token revoked for Dr. Quadri Olapade.")}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                          title="Revoke Session Token"
                          type="button"
                        >
                          <Icon name="block" className="text-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-xs">PO</div>
                        <div>
                          <div className="font-label-md text-label-md text-on-surface font-semibold">platform.ops@cultivanode.io</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">DevOps &amp; Infrastructure Lead</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <Icon name="cloud_done" className="text-secondary text-[16px]" />
                        <span className="font-semibold text-xs">Cloudflare Zero Trust + Key</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Tunnel Client mTLS</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-on-surface">197.210.65.18</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ibadan (Airtel 5G Fixed)</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-xs text-primary font-medium">infra_edge:failover_sim</span>
                    </td>
                    <td className="py-3 px-4 text-on-surface">
                      34m <span className="text-on-surface-variant text-xs">(Expires 2h)</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 0.01 (Nominal)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => showScreenToast("Step-up challenge sent to platform.ops tunnel client.")}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                          title="Trigger Step-Up Auth"
                          type="button"
                        >
                          <Icon name="verified" className="text-[18px]" />
                        </button>
                        <button
                          onClick={() => showScreenToast("mTLS token revoked for platform.ops.")}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                          title="Revoke Session Token"
                          type="button"
                        >
                          <Icon name="block" className="text-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs">VO</div>
                        <div>
                          <div className="font-label-md text-label-md text-on-surface font-semibold">verification.officer@cultivanode.io</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Tier-3 KYC Compliance Auditor</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <Icon name="fingerprint" className="text-secondary text-[16px]" />
                        <span className="font-semibold text-xs">TOTP + Mobile Biometric</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Smile ID Attested Device</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-on-surface">102.89.33.204</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Ogbomoso (Starlink Node)</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-xs text-primary font-medium">dossier_kyc:0884</span>
                    </td>
                    <td className="py-3 px-4 text-on-surface">
                      2h 10m <span className="text-on-surface-variant text-xs">(Expires 1h)</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 0.04 (Nominal)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => showScreenToast("Biometric prompt re-issued to verification.officer device.")}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                          title="Trigger Step-Up Auth"
                          type="button"
                        >
                          <Icon name="verified" className="text-[18px]" />
                        </button>
                        <button
                          onClick={() => showScreenToast("Auditor session revoked.")}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                          title="Revoke Session Token"
                          type="button"
                        >
                          <Icon name="block" className="text-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">AD</div>
                        <div>
                          <div className="font-label-md text-label-md text-on-surface font-semibold">automated.daemon#01</div>
                          <div className="font-label-sm text-label-sm text-primary font-mono">Restricted System Worker</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-on-surface">
                        <Icon name="lock" className="text-primary text-[16px]" />
                        <span className="font-semibold text-xs">Supabase Service-Role Vault</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Edge Function Isolated</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-on-surface">172.67.190.12</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Cloudflare Edge (LOS Node)</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-xs text-primary font-medium">nibss_batch:WAT-16:30</span>
                    </td>
                    <td className="py-3 px-4 text-on-surface">
                      Task Complete <span className="text-on-surface-variant text-xs">(Job ID: 9021)</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 0.00 (Service)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => showScreenToast("Inspected Worker #01 execution audit log: All 1,420 NIBSS payout records reconciled.")}
                        className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-on-surface transition-colors"
                        type="button"
                      >
                        Audit Worker
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NDPA Privacy Console */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="policy" className="text-secondary text-[24px]" />
                  <h2 className="font-headline-md text-headline-md text-on-surface">NDPA 2023 Privacy Console</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                  Section 24-34 Mandates
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Nigeria Data Protection Act 2023 compliance engine. Tokenization of farmer identifiers, statutory DSAR handling, and auto-purge policies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface font-semibold">AES-256 GCM Vault Redaction Status</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold">100% Cryptographically Masked</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface-container-lowest p-2.5 rounded">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">National Identity (NIN)</span>
                  <p className="font-mono text-xs font-semibold text-primary mt-1">***-***-8419</p>
                </div>
                <div className="bg-surface-container-lowest p-2.5 rounded">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Bank Verification (BVN)</span>
                  <p className="font-mono text-xs font-semibold text-primary mt-1">222-*****-09</p>
                </div>
                <div className="bg-surface-container-lowest p-2.5 rounded">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Farmer Phone (Termii OTP)</span>
                  <p className="font-mono text-xs font-semibold text-primary mt-1">+234 803 *** 1290</p>
                </div>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                Raw BVN/NIN keys are stored exclusively in the isolated HSM vault. Only salted hashes are accessible to analytics and agronomic roster interfaces.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Active Data Subject Access Requests (DSAR)</span>
                <span className="font-label-sm text-label-sm text-primary font-medium">Statutory SLA: 30 Calendar Days</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-surface-container flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon name="file_download" className="text-secondary text-[20px] shrink-0" />
                    <div className="truncate">
                      <div className="font-label-md text-label-md text-on-surface font-semibold truncate">#DSAR-2026-004 · Portability Export</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant truncate">Farmer Folake Ibironke (Iseyin, Oyo) · 14 Farm Books</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                      Delivered
                    </span>
                    <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Encrypted ZIP (0.8MB)</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-container flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon name="person_remove" className="text-tertiary-container text-[20px] shrink-0" />
                    <div className="truncate">
                      <div className="font-label-md text-label-md text-on-surface font-semibold truncate">#DSAR-2026-005 · Consent Revocation</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant truncate">Off-taker Anonymization Request (AgroLanka Ltd)</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                      Processing
                    </span>
                    <div className="font-label-sm text-label-sm text-error font-medium mt-0.5">4h SLA Remaining</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between bg-surface-container-low p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name="auto_delete" className="text-[16px] text-primary" />
                <span>Retention Policy: Biometrics purged after 90d; Raw GPS tracks decimated to centroids after 180d.</span>
              </div>
              <ScreenDialog title="Retention Policies" side="center" panel={modalEditRules}>
                <span className="font-semibold text-primary cursor-pointer hover:underline">Edit Rules</span>
              </ScreenDialog>
            </div>
          </div>

          {/* PostgreSQL RLS Matrix */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="database" className="text-primary text-[24px]" />
                  <h2 className="font-headline-md text-headline-md text-on-surface">Zero-Trust PostgreSQL RLS Matrix</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                  35/35 Tables Guarded
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Strict policy enforcement: No application client can access cross-tenant partitions without verified tenant credentials and cryptographic ownership.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">public.farms</span>
                  <Icon name="check_circle" className="text-secondary text-[16px]" />
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">RLS: (auth.uid() = owner_id)</p>
                <span className="text-xs text-secondary font-medium mt-1">0 Bypass · pgTAP Pass</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">public.journal_entries</span>
                  <Icon name="check_circle" className="text-secondary text-[16px]" />
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">RLS: cluster_membership check</p>
                <span className="text-xs text-secondary font-medium mt-1">0 Bypass · Zenith Trustee Enforced</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">public.verifications</span>
                  <Icon name="check_circle" className="text-secondary text-[16px]" />
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">RLS: tier_accreditation role check</p>
                <span className="text-xs text-secondary font-medium mt-1">Vault Key Isolated</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">public.audit_log</span>
                  <Icon name="lock" className="text-secondary text-[16px]" />
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">RLS: Append-Only Immutable Rule</p>
                <span className="text-xs text-secondary font-medium mt-1">Hardened No-Delete Rule</span>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <Icon name="verified" className="text-[18px]" />
                </div>
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-semibold">Automated Penetration &amp; pgTAP Suite</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">Scheduled execution every 6 hours · 142 assert tests active</div>
                </div>
              </div>
              <button
                onClick={() => showScreenToast("pgTAP test suite completed: 142/142 tests passed. Zero tenant leakage detected.")}
                className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container font-label-sm text-label-sm font-semibold transition-colors shadow-sm shrink-0"
                type="button"
              >
                Run pgTAP Scan
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="key_off" className="text-secondary text-[16px]" />
                <span>Service-Role Master Key strictly banned from client bundles; restricted to Cloudflare / Edge.</span>
              </div>
              <span className="font-semibold text-secondary">Verified</span>
            </div>
          </div>
        </div>

        {slot(
          slots,
          "incidents",
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center shrink-0">
                  <Icon name="notification_important" className="text-[22px]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-md text-headline-md text-on-surface">Security Incident &amp; Anomaly Triage Queue</h2>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold">
                      {lockReleased ? "0 Active Alerts" : "1 Active Alert"}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Heuristic intrusion detection, velocity anomalies, and carrier gateway rate tripwires
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ScreenDialog title="Heuristic Tripwires" side="center" panel={modalAlertLimits}>
                  <button
                    onClick={() => {}}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors"
                    type="button"
                  >
                    Configure Alert Limits
                  </button>
                </ScreenDialog>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-tertiary-container text-on-tertiary mt-0.5 shrink-0">
                    <Icon name="speed" className="text-[20px]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Incident #SEC-2026-019</span>
                      <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                        {lockReleased ? "Resolved" : "Low Severity"}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">· 18 minutes ago</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface mt-1 font-medium">
                      Geographically Implausible Login Velocity: Field agent account attempt from Kano IP (102.89.112.44) 20 minutes after active field session in Iseyin, Oyo State (197.210.4.11).
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="flex items-center gap-1">
                        <Icon name="security" className="text-[14px] text-secondary" />{" "}
                        {lockReleased ? "Lock Released" : "Token Auto-Frozen"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="sms" className="text-[14px] text-primary" /> SMS Challenge issued via Termii Gateway
                      </span>
                      <span className="text-tertiary font-semibold">
                        Status: {lockReleased ? "Verified by Agent PIN" : "Awaiting Field Agent Callback"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => showScreenToast("Incident #SEC-2026-019 dossier opened: IP Kano 102.89.112.44 was verified through corporate VPN node.")}
                    className="px-3 py-1.5 rounded bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold transition-colors shadow-sm"
                    type="button"
                  >
                    Triage Dossier
                  </button>
                  <button
                    onClick={() => {
                      setLockReleased(true);
                      showScreenToast("Lock released on field agent account following supervisor authorization.");
                    }}
                    className={`px-3 py-1.5 rounded font-label-sm text-label-sm transition-colors ${
                      lockReleased
                        ? "bg-secondary text-on-secondary font-semibold"
                        : "bg-primary text-on-primary hover:bg-primary-container"
                    }`}
                    type="button"
                  >
                    {lockReleased ? "Lock Released ✓" : "Release Lock"}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-surface-container text-on-surface-variant mt-0.5 shrink-0">
                    <Icon name="check_circle" className="text-[20px]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Incident #SEC-2026-018</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">
                        Auto-Resolved
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">· 2h 14m ago</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      NIMC vNIN Gateway Rapid Query Burst: Rate limiter tripped at 45 requests/min on Dojah integration. Circuit breaker dynamically preserved tenant quota.
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-on-surface-variant font-label-sm text-label-sm">
                      <span>Automated Action: Throttled to 20 req/min</span>
                      <span>· Zero PII leaked</span>
                      <span className="text-secondary font-semibold">Circuit Health: Normal</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => showScreenToast("Displaying Dojah / NIMC gateway telemetry trace: Circuit recovery confirmed at 14:18 WAT.")}
                    className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors"
                    type="button"
                  >
                    View Telemetry Trace
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {slot(
          slots,
          "trail",
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <Icon name="list_alt" className="text-[22px]" />
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Cryptographic Audit Trail (§11.7 Explorer)</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Append-only, SHA-256 tamper-evident log stream with on-chain deterministic verification
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Icon name="filter_list" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-9 pl-8 pr-8 rounded-lg bg-surface-container-low text-on-surface font-label-sm text-label-sm focus:outline-none appearance-none cursor-pointer"
                    id="event-type-filter"
                  >
                    <option value="all">All Event Types</option>
                    <option value="kyc">KYC Sign-off</option>
                    <option value="rls">RLS Policy Reload</option>
                    <option value="settlement">Settlement</option>
                    <option value="standard">Agronomy Standard</option>
                    <option value="escrow">Escrow Override</option>
                  </select>
                </div>
                <div className="relative">
                  <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]" />
                  <input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="h-9 pl-8 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none w-48 sm:w-64"
                    id="audit-search"
                    placeholder="Search hash, actor, table..."
                    type="text"
                  />
                </div>
                <button
                  onClick={handleLivePoll}
                  className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors"
                  type="button"
                >
                  <Icon name="refresh" className="text-[16px]" />
                  <span>Live Poll</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp (WAT)</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Operator / Actor ID</th>
                    <th className="py-3 px-4">Target Entity / Table</th>
                    <th className="py-3 px-4">SHA-256 Checksum Hash</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-body-sm text-body-sm" id="audit-table-body">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-on-surface whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-label-md text-label-md text-on-surface font-medium">{log.actor}</div>
                        <div className="font-mono text-xs text-on-surface-variant">{log.actorKey}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-primary">{log.target}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-on-surface-variant">
                          <span className="truncate max-w-[180px]">{log.hash}</span>
                          <button
                            onClick={() => handleCopyHash(log.hash)}
                            className="copy-btn hover:text-primary transition-colors"
                            data-hash={log.hash}
                            title="Copy Hash"
                            type="button"
                          >
                            <Icon name="content_copy" className="text-[14px]" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold">
                          <Icon name="verified" className="text-[16px]" />
                          <span>{log.verificationBadge}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Displaying {filteredLogs.length} of 48,291 cryptographic records · Proof batch #0341
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-colors ${
                    currentPage === 1 ? "bg-primary text-on-primary font-semibold" : "bg-surface-container text-on-surface"
                  }`}
                  type="button"
                >
                  Page 1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-colors ${
                    currentPage === 2 ? "bg-primary text-on-primary font-semibold" : "bg-surface-container text-on-surface"
                  }`}
                  type="button"
                >
                  Page 2
                </button>
                <button
                  onClick={() => {
                    if (currentPage < 2) setCurrentPage(currentPage + 1);
                  }}
                  disabled={currentPage === 2}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <Icon name="shield" className="text-[20px]" />
              </div>
              <div>
                <div className="font-label-md text-label-md text-on-surface font-semibold">NDPA 2023 Certified</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Registered Data Controller: #NDPC-FCT-2024-09881</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                <Icon name="verified_user" className="text-[20px]" />
              </div>
              <div>
                <div className="font-label-md text-label-md text-on-surface font-semibold">ISO/IEC 27001 ISMS</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Continuous Audit Baseline Compliant</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                <Icon name="hub" className="text-[20px]" />
              </div>
              <div>
                <div className="font-label-md text-label-md text-on-surface font-semibold">Zero-Trust Cloud Mesh</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">NIST SP 800-207 Architecture Alignment</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto justify-between md:justify-end">
            <div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">Statutory Data Protection Officer</div>
              <div className="font-label-md text-label-md text-primary font-semibold">dpo@cultivanode.io · Zenith Chambers Lagos</div>
            </div>
            <ScreenDialog title="Contact DPO" side="center" panel={modalContactDpo}>
              <button
                onClick={() => {}}
                className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm font-medium transition-colors"
                type="button"
              >
                Contact DPO
              </button>
            </ScreenDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
