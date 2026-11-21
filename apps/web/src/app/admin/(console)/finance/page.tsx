import type { Metadata } from "next";
import Link from "next/link";
import {
  FinanceConsole,
  type JournalEntryRow,
  type LedgerAccountRow,
  type PaymentRow,
  type SettlementRow,
} from "@/components/admin/finance-console";
import { PageHeader } from "@/components/ds/page-header";
import { MetricCard } from "@/components/live/metric-card";
import { Alert } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@cultivanode/shared";

export const metadata: Metadata = { title: "Platform Finance & Ledger" };

const PAGE_SIZE = 25;

type FinanceSummaryRpc = {
  can_read_ledger: boolean;
  can_read_payments: boolean;
  accounts: {
    id: string;
    name: string;
    type: string;
    debits_kobo: number;
    credits_kobo: number;
    balance_kobo: number;
  }[];
  commission_ledger_kobo: number;
  payments: {
    total_count?: number;
    successful_kobo?: number;
    pending_kobo?: number;
    failed_kobo?: number;
    refunded_kobo?: number;
    by_provider?: Record<string, { count: number; successful_kobo: number }>;
  };
  escrows: {
    held_kobo?: number;
    released_kobo?: number;
    refunded_kobo?: number;
    disputed_kobo?: number;
  };
  settlements: {
    pending_kobo?: number;
    completed_kobo?: number;
    failed_kobo?: number;
    commission_kobo?: number;
    total_count?: number;
  };
};

type PagedResult<T> = {
  total_count: number;
  limit: number;
  offset: number;
  items: T[];
};

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; provider?: string; from?: string; to?: string; tab?: string; page?: string }>;
}) {
  const staff = await requireStaff();
  if (!staff) return null;

  const canReadLedger = can(staff, "ledger.read");
  const canReadPayments = can(staff, "payments.read");
  const canApprovePayouts = can(staff, "payouts.approve");

  if (!canReadLedger && !canReadPayments) {
    return (
      <Alert tone="danger">
        You need the <code>ledger.read</code> or <code>payments.read</code> permission to view Platform Finance.
      </Alert>
    );
  }

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const statusFilter = (sp.status ?? "").trim();
  const providerFilter = (sp.provider ?? "").trim();
  const fromDate = (sp.from ?? "").trim();
  const toDate = (sp.to ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const defaultTab = canReadPayments ? "payments" : "ledger";
  const activeTab =
    sp.tab && ((sp.tab === "payments" || sp.tab === "settlements") ? canReadPayments : canReadLedger)
      ? sp.tab
      : defaultTab;

  const fromIso = fromDate ? `${fromDate}T00:00:00.000Z` : null;
  const toIso = toDate ? `${toDate}T23:59:59.999Z` : null;

  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as unknown as <T>(
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: T | null; error: { message: string } | null }>;

  const errors: string[] = [];

  const [summaryRes, jeRes, payRes, setRes] = await Promise.all([
    rpc<FinanceSummaryRpc>("admin_finance_summary"),
    canReadLedger
      ? rpc<PagedResult<JournalEntryRow>>("admin_finance_journal_entries", {
          p_q: q || null,
          p_type: null,
          p_from: fromIso,
          p_to: toIso,
          p_limit: PAGE_SIZE,
          p_offset: offset,
        })
      : Promise.resolve({ data: null, error: null }),
    canReadPayments
      ? rpc<PagedResult<PaymentRow>>("admin_finance_payments", {
          p_q: q || null,
          p_status: statusFilter || null,
          p_provider: providerFilter || null,
          p_from: fromIso,
          p_to: toIso,
          p_limit: PAGE_SIZE,
          p_offset: offset,
        })
      : Promise.resolve({ data: null, error: null }),
    canReadPayments
      ? rpc<PagedResult<SettlementRow>>("admin_finance_settlements", {
          p_q: q || null,
          p_status: statusFilter || null,
          p_from: fromIso,
          p_to: toIso,
          p_limit: PAGE_SIZE,
          p_offset: offset,
        })
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (summaryRes.error) errors.push(`Summary: ${summaryRes.error.message}`);
  if (jeRes.error) errors.push(`Journal entries: ${jeRes.error.message}`);
  if (payRes.error) errors.push(`Payments: ${payRes.error.message}`);
  if (setRes.error) errors.push(`Settlements: ${setRes.error.message}`);

  const summary = summaryRes.data;
  const accounts: LedgerAccountRow[] = (summary?.accounts ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    debitsKobo: Number(a.debits_kobo ?? 0),
    creditsKobo: Number(a.credits_kobo ?? 0),
    balanceKobo: Number(a.balance_kobo ?? 0),
  }));

  const journalEntries = jeRes.data?.items ?? [];
  const journalTotal = Number(jeRes.data?.total_count ?? 0);
  const payments = payRes.data?.items ?? [];
  const paymentsTotal = Number(payRes.data?.total_count ?? 0);
  const settlements = setRes.data?.items ?? [];
  const settlementsTotal = Number(setRes.data?.total_count ?? 0);

  const clearedKobo = Number(summary?.payments?.successful_kobo ?? 0);
  const heldEscrowKobo = Number(summary?.escrows?.held_kobo ?? 0);
  const pendingPayoutsKobo = Number(summary?.settlements?.pending_kobo ?? 0);
  const commissionKobo = canReadLedger
    ? Number(summary?.commission_ledger_kobo ?? 0)
    : Number(summary?.settlements?.commission_kobo ?? 0);

  const activeTotal =
    activeTab === "payments" ? paymentsTotal : activeTab === "settlements" ? settlementsTotal : activeTab === "ledger" ? journalTotal : accounts.length;
  const totalPages = activeTab === "accounts" ? 1 : Math.max(1, Math.ceil(activeTotal / PAGE_SIZE));

  const buildPageHref = (nextPage: number, nextTab = activeTab) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    if (providerFilter) params.set("provider", providerFilter);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    params.set("tab", nextTab);
    params.set("page", String(nextPage));
    return `/admin/finance?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Finance & Double-Entry Ledger"
        description="Authoritative database-aggregated marketplace payments, escrow custody, seller settlements, and cryptographic journal entries."
      />

      {errors.length > 0 && (
        <Alert tone="danger">
          Could not load complete financial records: {errors.join(" · ")}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="payments" label="Total Cleared Payments" value={formatNaira(clearedKobo)} />
        <MetricCard icon="lock" label="Held in Escrow" value={formatNaira(heldEscrowKobo)} />
        <MetricCard icon="account_balance" label="Pending Seller Payouts" value={formatNaira(pendingPayoutsKobo)} />
        <MetricCard icon="receipt_long" label="Commission Revenue" value={formatNaira(commissionKobo)} />
      </div>

      {canReadPayments && summary?.payments?.by_provider && Object.keys(summary.payments.by_provider).length > 0 && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-body-sm">
          <span className="font-semibold text-on-surface">Cleared by provider:</span>
          {Object.entries(summary.payments.by_provider).map(([prov, stats]) => (
            <span key={prov} className="text-on-surface-variant">
              <span className="capitalize font-medium text-on-surface">{prov.replace("_", " ")}</span>: {formatNaira(Number(stats.successful_kobo ?? 0))} ({stats.count})
            </span>
          ))}
        </div>
      )}

      <form method="get" className="grid grid-cols-1 gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 sm:grid-cols-6">
        <input type="hidden" name="tab" value={activeTab} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search ref, order #, seller…"
          className="rounded-lg border border-outline-variant/50 px-3 py-1.5 text-body-sm sm:col-span-2"
        />
        <select name="status" defaultValue={statusFilter} className="rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="successful">Successful</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select name="provider" defaultValue={providerFilter} className="rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm">
          <option value="">All providers</option>
          <option value="paystack">Paystack</option>
          <option value="flutterwave">Flutterwave</option>
          <option value="direct_transfer">Direct transfer</option>
          <option value="test_adapter">Test adapter</option>
        </select>
        <input type="date" name="from" defaultValue={fromDate} className="rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm" />
        <div className="flex gap-2">
          <input type="date" name="to" defaultValue={toDate} className="w-full rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm" />
          <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-label-md font-medium text-on-primary">
            Filter
          </button>
        </div>
      </form>

      <FinanceConsole
        accounts={accounts}
        journalEntries={journalEntries}
        payments={payments}
        settlements={settlements}
        canReadLedger={canReadLedger}
        canReadPayments={canReadPayments}
        canApprovePayouts={canApprovePayouts}
        initialTab={activeTab}
        paymentsTotalCount={paymentsTotal}
        settlementsTotalCount={settlementsTotal}
        journalTotalCount={journalTotal}
      />

      {activeTab !== "accounts" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-body-sm">
          <span className="text-on-surface-variant">
            Page {page} of {totalPages} ({activeTotal} matching records)
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={buildPageHref(page - 1)} className="rounded-lg border border-outline-variant/50 px-3 py-1 text-label-sm font-medium">
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={buildPageHref(page + 1)} className="rounded-lg border border-outline-variant/50 px-3 py-1 text-label-sm font-medium">
                Next
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
