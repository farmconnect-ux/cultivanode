"use client";

// Ported from the "platform_finance_operations_dashboard" design.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface LedgerEntry {
  timestamp: string;
  ref: string;
  title: string;
  debitAccount: string;
  debitName: string;
  creditAccount: string;
  creditName: string;
  amount: number;
  hash: string;
  parentHash: string;
  status: "Matched" | "Zero-Verified";
}

const INITIAL_LEDGER: LedgerEntry[] = [
  {
    timestamp: "2026-03-29 16:14:02",
    ref: "#JE-2026-8914",
    title: "PoW Release #BKG-0489",
    debitAccount: "2010 · Escrow Liability",
    debitName: "Paystack Trustee Sub-Ledger",
    creditAccount: "1020 · NIBSS Outflow Clearing",
    creditName: "Provider Disbursal Acct",
    amount: 220000,
    hash: "0x9b7a...3c2f",
    parentHash: "0x8a1c...10ea",
    status: "Matched",
  },
  {
    timestamp: "2026-03-29 15:58:33",
    ref: "#JE-2026-8913",
    title: "Inflow Deposit #DEP-1102",
    debitAccount: "1010 · Paystack Clearing",
    debitName: "Zenith Trustee Deposit",
    creditAccount: "2010 · Escrow Liability",
    creditName: "Farmer Offtake Lock",
    amount: 1500000,
    hash: "0x8a1c...10ea",
    parentHash: "0x7f4e...8801",
    status: "Matched",
  },
  {
    timestamp: "2026-03-29 15:22:19",
    ref: "#JE-2026-8912",
    title: "USSD Farm Batch #FLW-8930",
    debitAccount: "1015 · Flutterwave Transit",
    debitName: "Wema Virtual Account Collection",
    creditAccount: "2010 · Escrow Liability",
    creditName: "Farmer Syndicate Deposit",
    amount: 640000,
    hash: "0x7f4e...8801",
    parentHash: "0x6e2a...991d",
    status: "Matched",
  },
  {
    timestamp: "2026-03-29 15:22:19",
    ref: "#JE-2026-8911",
    title: "Pilot Commission Verification",
    debitAccount: "4010 · Platform Revenue",
    debitName: "Commission Ledger",
    creditAccount: "4020 · Pilot Subsidy Offset",
    creditName: "Zero-Fee Waiver Policy",
    amount: 0,
    hash: "0x6e2a...991d",
    parentHash: "RULE_0_COMMISSION",
    status: "Zero-Verified",
  },
];

export function PlatformFinance(_props: ScreenProps) {
  const [reconciling, setReconciling] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isBatchPayoutOpen, setIsBatchPayoutOpen] = useState(false);
  const [isCbnLedgerOpen, setIsCbnLedgerOpen] = useState(false);
  const [activeTelemetryModal, setActiveTelemetryModal] = useState<Record<string, string | number> | null>(null);
  const [activeDisputeModal, setActiveDisputeModal] = useState<Record<string, string | number> | null>(null);
  const [activeProrateModal, setActiveProrateModal] = useState<Record<string, string | number> | null>(null);
  const [activeNibssStatusModal, setActiveNibssStatusModal] = useState<Record<string, string | number> | null>(null);

  // Dynamic statuses for table items
  const [payout0492Status, setPayout0492Status] = useState<"pending" | "authorized">("pending");
  const [contract081Status, setContract081Status] = useState<"holding" | "released">("holding");
  const [exc092Resolved, setExc092Resolved] = useState<string | null>(null);
  const [exc093Resolved, setExc093Resolved] = useState<string | null>(null);

  const filteredLedger = INITIAL_LEDGER.filter((entry) => {
    if (accountFilter === "ALL") return true;
    return (
      entry.debitAccount.includes(accountFilter) ||
      entry.creditAccount.includes(accountFilter)
    );
  });

  const handleReconcileFeed = () => {
    setReconciling(true);
    showScreenToast("Initiating live banking feeds polling (Paystack, Flutterwave, NIBSS)...");
    setTimeout(() => {
      setReconciling(false);
      showScreenToast("Reconciliation complete: 1,280 ledger lines verified with 0x00 variance.");
    }, 1200);
  };

  const handleExportCSV = () => {
    const csvHeader = "Timestamp,Reference,Title,Debit_Account,Credit_Account,Amount_NGN,Merkle_Hash,Status\n";
    const csvRows = INITIAL_LEDGER.map(
      (e) => `"${e.timestamp}","${e.ref}","${e.title}","${e.debitAccount}","${e.creditAccount}",${e.amount},"${e.hash}","${e.status}"`
    ).join("\n");
    downloadFile(csvHeader + csvRows, `CultivaNode_Platform_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showScreenToast("Exported Double-Entry Platform Money Ledger Journal (CSV).");
  };

  const handleDownloadCbnReport = () => {
    const report = {
      title: "CBN & NIBSS Statutory Compliance Ledger",
      regulatoryFramework: "CBN AML/CFT & Payment Service System Guidelines 2024",
      segregatedTrusteeDepository: "Zenith Bank PLC / Providus Bank",
      generatedAt: new Date().toISOString(),
      activeEscrowVolumeNGN: 18450000,
      dailyPayoutVolumeNGN: 8320000,
      clearedTransactions: 1280,
      varianceNGN: 0,
      cryptoMerkleRoot: "0x4e8b3941dfa92c9082bcfe0912ad581179ab8419",
    };
    downloadFile(JSON.stringify(report, null, 2), `CBN_NIBSS_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    showScreenToast("Downloaded CBN / NIBSS Statutory Audit Report.");
  };

  const handleDownloadComplianceCert = () => {
    const cert = {
      certificateId: "CERT-CBN-NDPA-2026-9902",
      organization: "CultivaNode Integrated Services Ltd",
      jurisdiction: "Federal Republic of Nigeria",
      statutes: [
        "Banks and Other Financial Institutions Act (BOFIA) 2020",
        "Nigeria Data Protection Act (NDPA) 2023 §31",
        "Central Bank of Nigeria Escrow Trustee Guidelines",
      ],
      trusteeAccount: "Zenith Bank Escrow Settlement Node #1029384721",
      bvnVerificationRail: "NIBSS Central Switch Biometric Integration",
      validity: "Active - Valid through 2026-12-31",
    };
    downloadFile(JSON.stringify(cert, null, 2), `CultivaNode_CBN_NDPA_Certificate.json`, "application/json");
    showScreenToast("Downloaded CBN & NDPA 2023 Statutory Compliance Certificate.");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="px-space-md lg:px-margin-desktop py-space-lg space-y-space-lg max-w-[1720px] mx-auto w-full">
          <div className="flex flex-col gap-space-sm md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Platform Administration</span>
                <span className="text-on-surface-variant/40 text-xs">/</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Financial Operations &amp; Settlement</span>
                <span className="text-on-surface-variant/40 text-xs">/</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold bg-primary-fixed px-2 py-0.5 rounded">§11.4 Operations</span>
              </div>
              <div className="flex items-center gap-space-sm mt-1">
                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Platform Finance Operations</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm font-semibold">
                  <span className={`w-2 h-2 rounded-full ${reconciling ? "bg-amber-500 animate-ping" : "bg-secondary animate-pulse"}`} />
                  {reconciling ? "Polling Banks..." : "Ledger Synchronized"}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl mt-0.5">
                Reconcile double-entry ledger journals, Paystack/Flutterwave gateway clearing, NIBSS instant settlement batches, and proof-of-work escrow disbursement queues with cryptographic audit integrity.
              </p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap shrink-0 mt-3 md:mt-0">
              <button
                className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-high transition-colors"
                type="button"
                onClick={handleReconcileFeed}
              >
                <Icon name="sync_alt" className={`text-lg text-primary ${reconciling ? "animate-spin" : ""}`} />
                <span>{reconciling ? "Reconciling..." : "Reconcile Settlement Feed"}</span>
              </button>
              <button
                className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg font-semibold shadow-sm hover:bg-surface-container-high transition-colors"
                type="button"
                onClick={() => setIsCbnLedgerOpen(true)}
              >
                <Icon name="verified_user" className="text-lg text-secondary" />
                <span>CBN / NIBSS Ledger</span>
              </button>
              <button
                className="flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold shadow-sm hover:bg-primary-container transition-colors"
                type="button"
                onClick={() => setIsBatchPayoutOpen(true)}
              >
                <Icon name="payments" className="text-lg text-secondary-fixed" />
                <span>Batch Payout Execution</span>
              </button>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-space-sm shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-primary">
                <Icon name="account_balance" className="text-lg" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="font-label-md text-label-md font-bold text-on-surface tracking-wide uppercase">Active Settlement Cycle:</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">NIBSS Automated Clearing System (NACS) · Batch Window WAT 16:30</span>
                <span className="hidden sm:inline text-on-surface-variant/40">•</span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary px-2 py-0.5 rounded bg-surface-container-lowest">
                  <Icon name="verified" className="text-sm text-secondary" /> Direct Pilot 0% Platform Commission Policy Active
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto text-on-surface-variant font-label-sm text-label-sm">
              <Icon name="schedule" className="text-sm" />
              <span>Next Inflow Settlement in: <strong className="text-primary font-semibold">27m 14s</strong></span>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-space-md">
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Total Platform GMV</span>
                <Icon name="stacked_bar_chart" className="p-1 rounded bg-surface-container-low text-primary text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">₦142,680,000</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Across 482 active contracts</p>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold pt-1">
                <Icon name="trending_up" className="text-sm" />
                <span>+14.8% vs past 30d</span>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Active Escrow Locked</span>
                <Icon name="lock_clock" className="p-1 rounded bg-surface-container-low text-tertiary-container text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">₦18,450,000</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Held in trustee escrow nodes</p>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm pt-1">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span>100% Segregated &amp; Liquid</span>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Daily Settled Payouts</span>
                <Icon name="outbound" className="p-1 rounded bg-surface-container-low text-secondary text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">₦8,320,000</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Disbursed to service syndicates</p>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold pt-1">
                <Icon name="verified" className="text-sm" />
                <span>100% BVN validated</span>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Reconciled Ratio</span>
                <Icon name="check_circle" className="p-1 rounded bg-surface-container-low text-secondary text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">99.98%</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">1,280 cleared ledger lines</p>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm pt-1">
                <span>₦0 unreconciled variance</span>
              </div>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Commission Accrual</span>
                <Icon name="savings" className="p-1 rounded bg-surface-container-low text-primary text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">₦0.00</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Pilot Zero-Take Phase</p>
              </div>
              <span className="inline-flex items-center text-primary font-label-sm text-label-sm font-semibold">100% Retained by Producers</span>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm font-semibold text-error uppercase tracking-wider">Exception Queue</span>
                <Icon name="error" className="p-1 rounded bg-error-container text-error text-base" />
              </div>
              <div className="my-space-xs">
                <div className="font-headline-lg text-headline-lg text-error tracking-tight font-bold">
                  {2 - (exc092Resolved ? 1 : 0) - (exc093Resolved ? 1 : 0)} Items
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {exc092Resolved && exc093Resolved ? "All exceptions resolved" : "Requires operational action"}
                </p>
              </div>
              <a className="text-error font-label-sm text-label-sm font-semibold hover:underline inline-flex items-center gap-1" href="#exception-panel">
                <span>Resolve in Queue</span>
                <Icon name="arrow_forward" className="text-xs" />
              </a>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
            <div className="xl:col-span-7 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <h2 className="font-headline-md text-headline-md text-primary font-bold">Banking Rail &amp; Gateway Clearing Mesh</h2>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Segregated escrow depository balances &amp; direct payout settlement nodes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-semibold">Real-Time Polling</span>
                    <button
                      className="p-1 rounded bg-surface-container hover:bg-surface-container-high text-primary"
                      title="Refresh Telemetry"
                      type="button"
                      onClick={() => {
                        showScreenToast("Refreshed banking mesh telemetry (Paystack, Flutterwave, Stripe, NIBSS).");
                      }}
                    >
                      <Icon name="autorenew" className="text-lg" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">Paystack Clearing</span>
                        <span className="font-label-md text-label-md text-primary font-bold">Zenith Bank Trustee</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed">HEALTHY</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦18,450,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">Acct: •••• 3741</div>
                    </div>
                    <div className="space-y-1 pt-1 font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex justify-between">
                        <span>Webhook Sync:</span>
                        <span className="text-secondary font-semibold">Active (0ms lag)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Settlement Tier:</span>
                        <span className="font-medium text-on-surface">T+0 Instant</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">Flutterwave Inflow</span>
                        <span className="font-label-md text-label-md text-primary font-bold">USSD / Virtual Accts</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-on-surface-variant">TRANSIT</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦2,140,000</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">Batch #FLW-8930</div>
                    </div>
                    <div className="space-y-1 pt-1 font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex justify-between">
                        <span>Window:</span>
                        <span className="font-medium text-on-surface">Daily 17:00 WAT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reconciliation:</span>
                        <span className="text-secondary font-semibold">Balanced</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">NIBSS Instant (NIP)</span>
                        <span className="font-label-md text-label-md text-primary font-bold">Direct Provider Rail</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed">LIVE</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">99.82%</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Success rate past 24h</div>
                    </div>
                    <div className="space-y-1 pt-1 font-label-sm text-label-sm text-on-surface-variant">
                      <div className="flex justify-between">
                        <span>Avg Latency:</span>
                        <span className="font-medium text-on-surface">14 seconds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failover:</span>
                        <span className="text-secondary font-semibold">Auto-Route</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container flex flex-col md:flex-row items-center justify-between gap-space-md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-container text-secondary-container flex items-center justify-center shrink-0">
                      <Icon name="schema" className="text-lg" />
                    </div>
                    <div>
                      <div className="font-headline-sm text-headline-sm text-primary font-bold">Strict Two-Ledger Isolation Enforced</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">Ledger 1 (Escrow Clearing &amp; Money Movement) is cryptographically isolated from Ledger 2 (Farmer Farm Books &amp; P&amp;L).</div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-surface-container-lowest font-mono text-label-sm text-label-sm text-primary font-bold shadow-sm">Audit Proof: Verified</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-5 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Daily Reconciliation Run-Rate</h2>
                    <span className="font-label-sm text-label-sm font-semibold text-secondary flex items-center gap-1">
                      <Icon name="balance" className="text-sm" /> ₦0 Variance
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Automated end-of-day balance between bank feeds &amp; platform ledger</p>
                </div>
                <div className="my-space-md space-y-space-md">
                  <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                        <Icon name="south_east" className="text-base" />
                      </span>
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">Escrow Inflows (Deposits)</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">42 Farm Cooperatives &amp; Aggregators</div>
                      </div>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-secondary font-bold">+₦14,890,000</div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-tertiary-container/10 text-tertiary-container flex items-center justify-center">
                        <Icon name="north_west" className="text-base" />
                      </span>
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">Provider Outflows (PoW Release)</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">Tractor Hubs &amp; Harvester Operators</div>
                      </div>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-tertiary-container font-bold">-₦8,320,000</div>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon name="lock" className="text-base" />
                      </span>
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">Net Escrow Increment Today</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">Held in Zenith Trustee Escrow</div>
                      </div>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-primary font-bold">+₦6,570,000</div>
                  </div>
                </div>
                <div className="pt-space-sm flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>Last Auto-Reconciliation: 15:42 WAT</span>
                  <span className="text-secondary font-semibold flex items-center gap-1">
                    <Icon name="done_all" className="text-xs" /> SHA-256 Merkle Cleared
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-space-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Live Escrow Disbursement &amp; Proof-of-Work Queue</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Disbursements staged for NIBSS release upon spatial polygon verification and field sign-off</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-semibold">4 Actionable Entries</span>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-on-surface">
                  <thead>
                    <tr className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      <th className="py-3 px-space-md">Booking / Contract ID</th>
                      <th className="py-3 px-space-md">Transacting Parties</th>
                      <th className="py-3 px-space-md">Escrow Sum</th>
                      <th className="py-3 px-space-md">Proof of Work (PoW) Telemetry</th>
                      <th className="py-3 px-space-md">Dispute Release Timer</th>
                      <th className="py-3 px-space-md text-right">Settlement Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0 font-body-sm text-body-sm">
                    <tr className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-primary font-mono">#BKG-2026-0492</div>
                        <div className="text-on-surface-variant text-xs">Rotary Weeding · 18.5 Ha</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Adekunle Farmland Coop</div>
                        <div className="text-on-surface-variant text-xs">Provider: Oyo AgroMach Syndicate #04</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦95,000</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">Held: Paystack Trustee</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> GPS Polygon 100% Cleared (18.5 Ha)
                        </span>
                        <div className="text-[11px] text-on-surface-variant mt-1">Telemetry Hour-Meter: 6.4h matched</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
                          <Icon name="task_alt" className="text-sm" />
                          <span>Farmer Sign-off Received</span>
                        </div>
                        <div className="text-xs text-on-surface-variant">Signed via Mobile USSD</div>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className={`px-3 py-1.5 rounded font-label-sm text-label-sm font-semibold transition-colors shadow-sm ${
                              payout0492Status === "authorized"
                                ? "bg-secondary text-on-secondary"
                                : "bg-primary text-on-primary hover:bg-primary-container"
                            }`}
                            type="button"
                            onClick={() => {
                              if (payout0492Status === "authorized") {
                                showScreenToast("Payout already executed via NIP rail.");
                                return;
                              }
                              setPayout0492Status("authorized");
                              showScreenToast("Authorized ₦95,000 payout via NIBSS NIP rail. Reference: #NIP-99402.");
                            }}
                          >
                            {payout0492Status === "authorized" ? "Payout Dispatched" : "Authorize NIP Payout"}
                          </button>
                          <button
                            className="p-1.5 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            title="Telemetry Log"
                            type="button"
                            onClick={() =>
                              setActiveTelemetryModal({
                                id: "#BKG-2026-0492",
                                service: "Rotary Weeding · 18.5 Ha",
                                operator: "Oyo AgroMach Syndicate #04",
                                boundary: "Saki West Sector 4 (8.6701° N, 3.3910° E)",
                                hourMeter: "6.4 hours confirmed",
                                fuelUsed: "28.5 Litres",
                                signedAt: "2026-03-29 14:10 WAT via USSD *384*20#",
                              })
                            }
                          >
                            <Icon name="map" className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr className="bg-surface-container-lowest/50 hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-primary font-mono">#CTR-2026-081</div>
                        <div className="text-on-surface-variant text-xs">Psaltry Cassava Offtake · 60 MT</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Psaltry International PLC</div>
                        <div className="text-on-surface-variant text-xs">Seller: Iseyin Outgrower Union</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦5,040,000</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">Held: Escrow Node A</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Weighbridge Digitally Certified (61.2 MT)
                        </span>
                        <div className="text-[11px] text-on-surface-variant mt-1">Starch content: 22.4% Verified</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1 text-on-surface font-label-sm text-label-sm font-semibold">
                          <Icon name="timer" className="text-sm text-tertiary-container" />
                          <span>{contract081Status === "released" ? "Released Early" : "Auto-release in 14h 20m"}</span>
                        </div>
                        <div className="text-xs text-on-surface-variant">48-Hour Grace Window Active</div>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="px-3 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors shadow-sm"
                            type="button"
                            onClick={() =>
                              setActiveTelemetryModal({
                                id: "#CTR-2026-081",
                                service: "Psaltry Cassava Offtake · 60 MT",
                                operator: "Psaltry Processing Weighbridge Ado-Awaye",
                                boundary: "Weighbridge Station WB-02",
                                hourMeter: "Gross: 92.4 MT / Net: 61.2 MT",
                                fuelUsed: "N/A (Fixed Facility)",
                                signedAt: "Digitally certified by Psaltry QC Officer on 2026-03-29",
                              })
                            }
                          >
                            Inspect Telemetry
                          </button>
                          <button
                            className={`px-3 py-1.5 rounded font-label-sm text-label-sm font-semibold transition-colors shadow-sm ${
                              contract081Status === "released"
                                ? "bg-secondary text-on-secondary"
                                : "bg-primary text-on-primary hover:bg-primary-container"
                            }`}
                            type="button"
                            onClick={() => {
                              if (contract081Status === "released") {
                                showScreenToast("Escrow has already been released to Iseyin Outgrower Union.");
                                return;
                              }
                              setContract081Status("released");
                              showScreenToast("Authorized early escrow release of ₦5,040,000 to Iseyin Outgrower Union.");
                            }}
                          >
                            {contract081Status === "released" ? "Released" : "Release Early"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-primary font-mono">#BKG-2026-0504</div>
                        <div className="text-on-surface-variant text-xs">Harrowing Syndicate · 34.0 Ha</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Oorelope Farmers Cooperative</div>
                        <div className="text-on-surface-variant text-xs">Provider: John Deere Syndicate 02</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-headline-sm text-headline-sm text-on-surface font-bold">₦400,000</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">Held: Paystack Trustee</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> GPS In Progress (28.2 / 34 Ha)
                        </span>
                        <div className="text-[11px] text-on-surface-variant mt-1">Expected completion: Today 18:00</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="text-on-surface-variant font-label-sm text-label-sm">Pending Job Completion</div>
                        <div className="text-xs text-on-surface-variant">Escrow locked securely</div>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <button
                          className="px-3 py-1.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm font-semibold hover:bg-surface-container transition-colors"
                          type="button"
                          onClick={() => {
                            showScreenToast("Escrow is safely locked pending remaining 5.8 Ha completion by operator.");
                          }}
                        >
                          Inspection Locked
                        </button>
                      </td>
                    </tr>

                    <tr className="bg-error-container/20 hover:bg-error-container/30 transition-colors">
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-error font-mono">#BKG-2026-0478</div>
                        <div className="text-on-surface-variant text-xs">Combined Harvesting · 12.0 Ha</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">Saki West Maize Cluster</div>
                        <div className="text-on-surface-variant text-xs">Provider: Northern Tractors Hub</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="font-headline-sm text-headline-sm text-error font-bold">₦180,000</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">Status: Frozen for Review</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                          <Icon name="warning" className="text-xs" /> Polygon Gap: Only 8.1 Ha verified
                        </span>
                        <div className="text-[11px] text-error font-semibold mt-1">Dispute Filed: Partial completion claim</div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1 text-error font-label-sm text-label-sm font-bold">
                          <Icon name="pause_circle" className="text-sm" />
                          <span>Dispute Hold Active</span>
                        </div>
                        <div className="text-xs text-on-surface-variant">Agronomist review underway</div>
                      </td>
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="px-3 py-1.5 rounded bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-semibold hover:bg-tertiary transition-colors shadow-sm"
                            type="button"
                            onClick={() =>
                              setActiveDisputeModal({
                                id: "#BKG-2026-0478",
                                contracted: "12.0 Ha Maize Harvesting (₦180,000)",
                                delivered: "8.1 Ha verified by GPS RTK receiver",
                                discrepancy: "3.9 Ha unharvested due to swamp boundary",
                                parties: "Saki West Maize Cluster vs Northern Tractors Hub",
                              })
                            }
                          >
                            Inspect Dispute
                          </button>
                          <button
                            className="px-3 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors shadow-sm"
                            type="button"
                            onClick={() =>
                              setActiveProrateModal({
                                id: "#BKG-2026-0478",
                                totalSum: 180000,
                                totalHa: 12.0,
                                completedHa: 8.1,
                                calculatedPayout: Math.round((8.1 / 12.0) * 180000), // ₦121,500
                                calculatedRefund: Math.round((3.9 / 12.0) * 180000), // ₦58,500
                              })
                            }
                          >
                            Prorate Payout
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="space-y-space-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Double-Entry Platform Money Ledger Journal</h2>
                    <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-primary font-bold">APPEND-ONLY</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Cryptographic immutable journal log · SHA-256 state chain verification</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors"
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                >
                  <Icon name="filter_list" className="text-base" />
                  <span>Filter Accounts {accountFilter !== "ALL" ? `(${accountFilter})` : ""}</span>
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors"
                  type="button"
                  onClick={handleExportCSV}
                >
                  <Icon name="download" className="text-base" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-on-surface font-mono">
                  <thead>
                    <tr className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-sans">
                      <th className="py-3 px-space-md">Timestamp (WAT)</th>
                      <th className="py-3 px-space-md">Entry # &amp; Ref</th>
                      <th className="py-3 px-space-md">Debit Account (Dr)</th>
                      <th className="py-3 px-space-md">Credit Account (Cr)</th>
                      <th className="py-3 px-space-md text-right">Amount (₦)</th>
                      <th className="py-3 px-space-md">Merkle / State Hash</th>
                      <th className="py-3 px-space-md text-center font-sans">Audit Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0 text-xs">
                    {filteredLedger.map((entry) => (
                      <tr key={entry.ref} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-space-md text-on-surface-variant">{entry.timestamp}</td>
                        <td className="py-3 px-space-md text-primary font-bold">
                          <div>{entry.ref}</div>
                          <span className="font-sans text-[11px] text-on-surface-variant">{entry.title}</span>
                        </td>
                        <td className="py-3 px-space-md">
                          <div className="text-on-surface font-semibold">{entry.debitAccount}</div>
                          <span className="font-sans text-[11px] text-on-surface-variant">{entry.debitName}</span>
                        </td>
                        <td className="py-3 px-space-md">
                          <div className="text-on-surface font-semibold">{entry.creditAccount}</div>
                          <span className="font-sans text-[11px] text-on-surface-variant">{entry.creditName}</span>
                        </td>
                        <td className="py-3 px-space-md text-right text-sm font-bold text-on-surface">
                          ₦{entry.amount.toLocaleString()}.00
                        </td>
                        <td className="py-3 px-space-md">
                          <div className="text-secondary font-mono text-[11px]">{entry.hash}</div>
                          <span className="font-sans text-[10px] text-on-surface-variant">Parent: {entry.parentHash}</span>
                        </td>
                        <td className="py-3 px-space-md text-center font-sans">
                          <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold">
                            <Icon name="check_circle" className="text-sm" /> {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="space-y-space-sm" id="exception-panel">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error animate-ping" />
                  <h2 className="font-headline-lg text-headline-lg text-error font-bold tracking-tight">Financial Exception &amp; Risk Resolution Queue</h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {exc092Resolved && exc093Resolved ? "All 2 exceptions successfully cleared." : "Unresolved exceptions requiring manual operational intervention or automated retry"}
                </p>
              </div>
              <span className="px-3 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
                {exc092Resolved && exc093Resolved ? "Queue Clear" : "High Operational Priority"}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-md">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-mono text-xs font-bold">#EXC-092 · PAYOUT STALLED</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1.5">Beneficiary BVN Name Discrepancy</h3>
                    </div>
                    <span className="text-on-surface-variant text-xs font-mono">
                      {exc092Resolved ? `Status: ${exc092Resolved}` : "Initiated: 2h 10m ago"}
                    </span>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low space-y-2 font-body-sm text-body-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Intended Recipient:</span>
                      <span className="font-semibold text-on-surface">Tractor Owner Syndicate #19</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Payout Sum:</span>
                      <span className="font-bold text-primary font-mono">₦175,000.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Registered CultivaNode Name:</span>
                      <span className="font-mono text-error font-semibold">&quot;Babatunde G. Lawal&quot;</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Commercial Bank BVN (GTBank):</span>
                      <span className="font-mono text-on-surface font-semibold">&quot;Babatunde Gbadamosi&quot;</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container text-xs text-on-surface-variant">
                      <strong>CBN AML Risk Flag:</strong> Partial surname divergence exceeds automated matching threshold (&gt;25% Levenshtein difference). Payout withheld pending confirmation.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <button
                    className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm"
                    type="button"
                    onClick={() => {
                      setExc092Resolved("KYC Re-match Dispatched via NIBSS");
                      showScreenToast("Requested automated KYC Re-match with NIBSS Central Biometrics for Babatunde Lawal.");
                    }}
                  >
                    Request KYC Re-match
                  </button>
                  <button
                    className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors shadow-sm"
                    type="button"
                    onClick={() => {
                      setExc092Resolved("Re-routed to Tier-2 BVN");
                      showScreenToast("Re-routed ₦175,000 payout to secondary verified Tier-2 BVN account.");
                    }}
                  >
                    Re-route to Verified Tier-2 BVN
                  </button>
                  <button
                    className="px-space-md py-2 rounded-lg bg-error-container text-on-error-container font-label-md text-label-md font-semibold hover:bg-error/20 transition-colors"
                    type="button"
                    onClick={() => {
                      setExc092Resolved("Refunded to Escrow");
                      showScreenToast("Refunded ₦175,000 to originating cooperative escrow account.");
                    }}
                  >
                    Refund to Escrow
                  </button>
                </div>
              </div>

              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-md">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono text-xs font-bold">#EXC-093 · NETWORK TIMEOUT</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1.5">NIBSS NIP Push Latency Timeout</h3>
                    </div>
                    <span className="text-on-surface-variant text-xs font-mono">
                      {exc093Resolved ? `Status: ${exc093Resolved}` : "Attempt 2 of 3"}
                    </span>
                  </div>
                  <div className="p-space-md rounded-lg bg-surface-container-low space-y-2 font-body-sm text-body-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Destination Rail:</span>
                      <span className="font-semibold text-on-surface">Access Bank PLC (044)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Batch Reference:</span>
                      <span className="font-mono text-on-surface">#NIP-99238-ACC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Amount:</span>
                      <span className="font-bold text-primary font-mono">₦320,000.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Switch Error Code:</span>
                      <span className="font-mono text-error font-semibold">91 - System Malfunction / Destination Timeout</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container text-xs text-on-surface-variant">
                      <strong>Idempotency Guard:</strong> Webhook received no debit confirmation. Payout locked in pending state to prevent duplicate disbursement.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <button
                    className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1.5"
                    type="button"
                    onClick={() => {
                      setExc093Resolved("NIP Retry Dispatched");
                      showScreenToast("Idempotent retry executed with NIBSS Switch. Transaction cleared successfully.");
                    }}
                  >
                    <Icon name="refresh" className="text-base" /> Force Immediate NIP Retry
                  </button>
                  <button
                    className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors shadow-sm"
                    type="button"
                    onClick={() =>
                      setActiveNibssStatusModal({
                        reference: "#NIP-99238-ACC",
                        destinationBank: "Access Bank PLC (044)",
                        amount: "₦320,000.00",
                        switchStatus: "RESOLVED_AFTER_DELAY",
                        sessionID: "9990442603291522001928374",
                        adviceCode: "00 (Approved)",
                      })
                    }
                  >
                    Query NIBSS Switch Status
                  </button>
                  <button
                    className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors shadow-sm"
                    type="button"
                    onClick={() => {
                      setExc093Resolved("Queued for 18:00 Settlement Batch");
                      showScreenToast("Transaction scheduled for automated release in the 18:00 WAT settlement window.");
                    }}
                  >
                    Hold for 18:00 Settlement Batch
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
                <Icon name="policy" className="text-xl" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">CBN Regulatory Compliance &amp; NDPA 2023 Verified</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold">Audit Active</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-5xl">
                  CultivaNode operates in strict compliance with the Central Bank of Nigeria (CBN) Anti-Money Laundering and Combating the Financing of Terrorism (AML/CFT) framework and Nigeria Data Protection Act (NDPA) 2023. All funds are maintained in segregated trustee accounts held at licensed commercial banks. Farmer private accounting records (&quot;Farm Books&quot;) remain cryptographically quarantined from platform financial operations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                className="px-space-md py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors shadow-sm flex items-center gap-1.5"
                type="button"
                onClick={handleDownloadComplianceCert}
              >
                <Icon name="verified" className="text-base text-secondary" />
                <span>Compliance Certificate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Filter Accounts */}
      {isFilterModalOpen && (
        <ScreenDialog
          title="Filter Platform Money Ledger Accounts"
          subtitle="Narrow double-entry journal view by specific ledger code or institution"
          onClose={() => setIsFilterModalOpen(false)}
          panel={
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: "ALL", label: "All Ledger Accounts", desc: "Show complete journal trail" },
                  { id: "1010", label: "1010 · Paystack Clearing", desc: "Zenith Trustee collections" },
                  { id: "1015", label: "1015 · Flutterwave Transit", desc: "Wema Virtual Accounts" },
                  { id: "1020", label: "1020 · NIBSS Outflow", desc: "Provider instant payouts" },
                  { id: "2010", label: "2010 · Escrow Liability", desc: "Locked cooperative funds" },
                  { id: "4010", label: "4010 · Platform Revenue", desc: "Pilot zero-commission ledger" },
                ].map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setAccountFilter(acc.id);
                      setIsFilterModalOpen(false);
                      showScreenToast(`Filtering journal by: ${acc.label}`);
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      accountFilter === acc.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline/20 bg-surface-container-low hover:bg-surface-container"
                    }`}
                  >
                    <div className="font-semibold text-sm">{acc.label}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5">{acc.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-3">
                <ScreenDialogClose onClick={() => setIsFilterModalOpen(false)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 2: Batch Payout Execution */}
      {isBatchPayoutOpen && (
        <ScreenDialog
          title="Execute NIBSS Batch Payout Run"
          subtitle="Disburse validated proof-of-work payouts across licensed commercial banks"
          onClose={() => setIsBatchPayoutOpen(false)}
          panel={
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Staged PoW Payouts:</span>
                  <span className="font-bold text-on-surface">3 Batches (52 Beneficiaries)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Total Disbursal Value:</span>
                  <span className="font-headline-sm text-primary font-bold">₦8,320,000.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Originating Escrow Vault:</span>
                  <span className="font-mono text-sm font-semibold">Zenith Bank Trustee #1029384721</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Payment Gateways:</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">Paystack &amp; Flutterwave Reconciled</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">
                Disbursements are protected by automated CBN AML checks and cryptographic two-person authorization.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <ScreenDialogClose onClick={() => setIsBatchPayoutOpen(false)}>
                  Cancel
                </ScreenDialogClose>
                <button
                  type="button"
                  onClick={() => {
                    setIsBatchPayoutOpen(false);
                    showScreenToast("Successfully executed batch payout of ₦8,320,000 to 52 beneficiaries via NIBSS NIP.");
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container"
                >
                  Confirm &amp; Transmit Payout Batch
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 3: CBN / NIBSS Ledger Modal */}
      {isCbnLedgerOpen && (
        <ScreenDialog
          title="Central Bank of Nigeria (CBN) Statutory Audit Ledger"
          subtitle="Regulatory compliance records for payment service provider licensing and inspection"
          onClose={() => setIsCbnLedgerOpen(false)}
          panel={
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Regulatory Status:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-secondary/20 text-secondary">FULLY COMPLIANT</span>
                </div>
                <div className="text-xs text-on-surface-variant space-y-1">
                  <div><strong>Trustee Depository:</strong> Zenith Bank Custodial Escrow (#1029384721)</div>
                  <div><strong>NIBSS Institution Code:</strong> 999814 (CultivaNode Escrow Clearing)</div>
                  <div><strong>AML Screening Rate:</strong> 100% Biometric BVN &amp; NIN matched</div>
                  <div><strong>Daily Audited Turnover:</strong> ₦142,680,000.00 GMV</div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleDownloadCbnReport}
                  className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center gap-1.5"
                >
                  <Icon name="download" className="text-sm" />
                  <span>Download Audit Packet (JSON)</span>
                </button>
                <ScreenDialogClose onClick={() => setIsCbnLedgerOpen(false)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 4: Telemetry Log */}
      {activeTelemetryModal && (
        <ScreenDialog
          title={`Proof of Work Telemetry: ${activeTelemetryModal.id}`}
          subtitle={activeTelemetryModal.service}
          onClose={() => setActiveTelemetryModal(null)}
          panel={
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2 text-sm">
                <div><strong>Operating Syndicate:</strong> {activeTelemetryModal.operator}</div>
                <div><strong>Spatial Boundary:</strong> {activeTelemetryModal.boundary}</div>
                <div><strong>Machine Telemetry:</strong> {activeTelemetryModal.hourMeter}</div>
                <div><strong>Resource Log:</strong> {activeTelemetryModal.fuelUsed}</div>
                <div><strong>Sign-off Verification:</strong> {activeTelemetryModal.signedAt}</div>
              </div>
              <div className="flex justify-end pt-2">
                <ScreenDialogClose onClick={() => setActiveTelemetryModal(null)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 5: Inspect Dispute */}
      {activeDisputeModal && (
        <ScreenDialog
          title={`Dispute Inspection: ${activeDisputeModal.id}`}
          subtitle="Satellite polygon variance and harvest arbitration"
          onClose={() => setActiveDisputeModal(null)}
          panel={
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2 text-sm">
                <div><strong>Contracted Scope:</strong> {activeDisputeModal.contracted}</div>
                <div><strong>GPS RTK Measured:</strong> {activeDisputeModal.delivered}</div>
                <div><strong>Identified Variance:</strong> {activeDisputeModal.discrepancy}</div>
                <div><strong>Parties:</strong> {activeDisputeModal.parties}</div>
              </div>
              <p className="text-xs text-on-surface-variant">
                Agronomist recommendation: Issue prorated settlement for 8.1 Ha completed, and refund remaining 3.9 Ha to farmer escrow.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <ScreenDialogClose onClick={() => setActiveDisputeModal(null)}>
                  Close
                </ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 6: Prorate Payout */}
      {activeProrateModal && (
        <ScreenDialog
          title={`Prorated Payout Settlement: ${activeProrateModal.id}`}
          subtitle="Split locked escrow between verified work and buyer refund"
          onClose={() => setActiveProrateModal(null)}
          panel={
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span>Total Locked Escrow:</span>
                  <span className="font-bold">₦{activeProrateModal.totalSum.toLocaleString()}.00 (12.0 Ha)</span>
                </div>
                <div className="border-t border-outline/10 pt-2 space-y-2 text-sm">
                  <div className="flex justify-between items-center text-primary font-semibold">
                    <span>Pay Operator (8.1 Ha verified):</span>
                    <span>₦{activeProrateModal.calculatedPayout.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center text-secondary font-semibold">
                    <span>Refund Cooperative (3.9 Ha unworked):</span>
                    <span>₦{activeProrateModal.calculatedRefund.toLocaleString()}.00</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <ScreenDialogClose onClick={() => setActiveProrateModal(null)}>
                  Cancel
                </ScreenDialogClose>
                <button
                  type="button"
                  onClick={() => {
                    setActiveProrateModal(null);
                    showScreenToast(`Executed prorated settlement: ₦${activeProrateModal.calculatedPayout.toLocaleString()} to operator, ₦${activeProrateModal.calculatedRefund.toLocaleString()} refunded to farmer.`);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container"
                >
                  Execute Split Payout
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* MODAL 7: NIBSS Switch Status */}
      {activeNibssStatusModal && (
        <ScreenDialog
          title={`NIBSS NIP Central Switch Packet`}
          subtitle={`Reference: ${activeNibssStatusModal.reference}`}
          onClose={() => setActiveNibssStatusModal(null)}
          panel={
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2 text-sm font-mono">
                <div><strong>Session ID:</strong> {activeNibssStatusModal.sessionID}</div>
                <div><strong>Destination:</strong> {activeNibssStatusModal.destinationBank}</div>
                <div><strong>Amount:</strong> {activeNibssStatusModal.amount}</div>
                <div><strong>Central Switch Advice:</strong> {activeNibssStatusModal.adviceCode}</div>
                <div><strong>Status:</strong> <span className="text-secondary">{activeNibssStatusModal.switchStatus}</span></div>
              </div>
              <div className="flex justify-end pt-2">
                <ScreenDialogClose onClick={() => setActiveNibssStatusModal(null)}>
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
