import type { Metadata } from "next";
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

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; provider?: string; from?: string; to?: string }>;
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
  const q = (sp.q ?? "").trim().toLowerCase();
  const statusFilter = (sp.status ?? "").trim();
  const providerFilter = (sp.provider ?? "").trim();
  const fromDate = (sp.from ?? "").trim();
  const toDate = (sp.to ?? "").trim();

  const supabase = await createClient();
  const errors: string[] = [];

  let accounts: LedgerAccountRow[] = [];
  let journalEntries: JournalEntryRow[] = [];
  let payments: PaymentRow[] = [];
  let settlements: SettlementRow[] = [];
  let heldEscrowKobo = 0;
  let commissionKobo = 0;

  if (canReadLedger) {
    const [acctRes, jeRes, postRes] = await Promise.all([
      supabase.from("marketplace_ledger_accounts").select("id, name, type").order("id"),
      supabase.from("marketplace_journal_entries").select("id, reference_id, reference_type, description, current_hash, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("marketplace_journal_postings").select("id, entry_id, account_id, direction, amount_kobo, memo").limit(500),
    ]);

    if (acctRes.error) errors.push(`Ledger accounts: ${acctRes.error.message}`);
    if (jeRes.error) errors.push(`Journal entries: ${jeRes.error.message}`);
    if (postRes.error) errors.push(`Journal postings: ${postRes.error.message}`);

    const postingsByEntry = new Map<string, JournalEntryRow["postings"]>();
    const totalsByAcct = new Map<string, { debits: number; credits: number }>();

    for (const pt of postRes.data ?? []) {
      const list = postingsByEntry.get(pt.entry_id) ?? [];
      list.push({
        id: pt.id,
        account_id: pt.account_id,
        direction: pt.direction as "DEBIT" | "CREDIT",
        amount_kobo: Number(pt.amount_kobo),
        memo: pt.memo,
      });
      postingsByEntry.set(pt.entry_id, list);

      const cur = totalsByAcct.get(pt.account_id) ?? { debits: 0, credits: 0 };
      if (pt.direction === "DEBIT") cur.debits += Number(pt.amount_kobo);
      else cur.credits += Number(pt.amount_kobo);
      totalsByAcct.set(pt.account_id, cur);
    }

    accounts = (acctRes.data ?? []).map((a) => {
      const t = totalsByAcct.get(a.id) ?? { debits: 0, credits: 0 };
      const normalDebit = a.type === "asset" || a.type === "expense";
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        debitsKobo: t.debits,
        creditsKobo: t.credits,
        balanceKobo: normalDebit ? t.debits - t.credits : t.credits - t.debits,
      };
    });

    commissionKobo = accounts.find((a) => a.id === "REVENUE_MARKETPLACE_COMMISSION")?.balanceKobo ?? 0;

    journalEntries = (jeRes.data ?? [])
      .filter((je) => {
        if (fromDate && je.created_at.slice(0, 10) < fromDate) return false;
        if (toDate && je.created_at.slice(0, 10) > toDate) return false;
        if (q && !`${je.reference_id} ${je.reference_type} ${je.description}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .map((je) => ({
        id: je.id,
        reference_id: je.reference_id,
        reference_type: je.reference_type,
        description: je.description,
        current_hash: je.current_hash,
        created_at: je.created_at,
        postings: postingsByEntry.get(je.id) ?? [],
      }));
  }

  if (canReadPayments) {
    const [payRes, escRes, setRes] = await Promise.all([
      supabase
        .from("marketplace_payments")
        .select("id, order_id, payment_reference, provider, amount_kobo, status, verified_at, created_at, marketplace_orders(order_number)")
        .order("created_at", { ascending: false })
        .limit(150),
      supabase.from("marketplace_escrows").select("amount_kobo, commission_kobo, status"),
      supabase
        .from("marketplace_settlements")
        .select("id, escrow_id, gross_amount_kobo, commission_kobo, net_payout_kobo, payout_reference, status, processed_at, created_at, marketplace_sellers(business_name)")
        .order("created_at", { ascending: false })
        .limit(150),
    ]);

    if (payRes.error) errors.push(`Payments: ${payRes.error.message}`);
    if (escRes.error) errors.push(`Escrows: ${escRes.error.message}`);
    if (setRes.error) errors.push(`Settlements: ${setRes.error.message}`);

    heldEscrowKobo = (escRes.data ?? [])
      .filter((e) => e.status === "held" || e.status === "awaiting_confirmation" || e.status === "disputed")
      .reduce((s, e) => s + Number(e.amount_kobo), 0);

    if (!canReadLedger) {
      commissionKobo = (escRes.data ?? [])
        .filter((e) => e.status === "released")
        .reduce((s, e) => s + Number(e.commission_kobo), 0);
    }

    payments = (payRes.data ?? [])
      .map((p) => ({
        id: p.id,
        order_id: p.order_id,
        order_number: (p.marketplace_orders as { order_number?: string } | null)?.order_number ?? null,
        payment_reference: p.payment_reference,
        provider: p.provider,
        amount_kobo: Number(p.amount_kobo),
        status: p.status,
        verified_at: p.verified_at,
        created_at: p.created_at,
      }))
      .filter((p) => {
        if (statusFilter && p.status !== statusFilter) return false;
        if (providerFilter && p.provider !== providerFilter) return false;
        if (fromDate && p.created_at.slice(0, 10) < fromDate) return false;
        if (toDate && p.created_at.slice(0, 10) > toDate) return false;
        if (q && !`${p.payment_reference} ${p.order_number ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      });

    settlements = (setRes.data ?? [])
      .map((s) => ({
        id: s.id,
        escrow_id: s.escrow_id,
        seller_name: (s.marketplace_sellers as { business_name?: string } | null)?.business_name ?? null,
        gross_amount_kobo: Number(s.gross_amount_kobo),
        commission_kobo: Number(s.commission_kobo),
        net_payout_kobo: Number(s.net_payout_kobo),
        payout_reference: s.payout_reference,
        status: s.status,
        processed_at: s.processed_at,
        created_at: s.created_at,
      }))
      .filter((s) => {
        if (fromDate && s.created_at.slice(0, 10) < fromDate) return false;
        if (toDate && s.created_at.slice(0, 10) > toDate) return false;
        if (q && !`${s.payout_reference ?? ""} ${s.seller_name ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      });
  }

  const clearedKobo = payments.filter((p) => p.status === "successful").reduce((s, p) => s + p.amount_kobo, 0);
  const pendingPayoutsKobo = settlements.filter((s) => s.status === "pending" || s.status === "processing").reduce((s, x) => s + x.net_payout_kobo, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Finance & Double-Entry Ledger"
        description="Authoritative marketplace payments, escrow custody, seller settlements, and cryptographic journal entries."
      />

      {errors.length > 0 && (
        <Alert tone="danger">
          Could not load complete financial records: {errors.join(" · ")}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="payments" label="Cleared Payments (Filtered)" value={formatNaira(clearedKobo)} />
        <MetricCard icon="lock" label="Held in Escrow" value={formatNaira(heldEscrowKobo)} />
        <MetricCard icon="account_balance" label="Pending Seller Payouts" value={formatNaira(pendingPayoutsKobo)} />
        <MetricCard icon="receipt_long" label="Commission Revenue" value={formatNaira(commissionKobo)} />
      </div>

      <form method="get" className="grid grid-cols-1 gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 sm:grid-cols-6">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search ref, order, seller…"
          className="rounded-lg border border-outline-variant/50 px-3 py-1.5 text-body-sm sm:col-span-2"
        />
        <select name="status" defaultValue={statusFilter} className="rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm">
          <option value="">All statuses</option>
          <option value="successful">Successful</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select name="provider" defaultValue={providerFilter} className="rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm">
          <option value="">All providers</option>
          <option value="paystack">Paystack</option>
          <option value="flutterwave">Flutterwave</option>
          <option value="direct_transfer">Direct transfer</option>
        </select>
        <input type="date" name="from" defaultValue={fromDate} aria-label="From date" className="rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm" />
        <div className="flex gap-2">
          <input type="date" name="to" defaultValue={toDate} aria-label="To date" className="w-full rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm" />
          <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-label-md font-medium text-on-primary">
            Filter
          </button>
        </div>
      </form>

      <FinanceConsole
        canApprovePayouts={canApprovePayouts}
        canReadLedger={canReadLedger}
        canReadPayments={canReadPayments}
        accounts={accounts}
        journalEntries={journalEntries}
        payments={payments}
        settlements={settlements}
      />
    </div>
  );
}
