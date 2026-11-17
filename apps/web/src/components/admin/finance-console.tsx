"use client";

import { useState } from "react";
import { processSettlementAction } from "@/actions/admin-finance";
import { AdminForm } from "@/components/admin/admin-form";
import { EmptyState } from "@/components/ds/empty-state";
import { Badge } from "@/components/shadcn/badge";
import { formatNaira } from "@cultivanode/shared";

export type LedgerAccountRow = {
  id: string;
  name: string;
  type: string;
  debitsKobo: number;
  creditsKobo: number;
  balanceKobo: number;
};

export type JournalPostingRow = {
  id: string;
  account_id: string;
  direction: "DEBIT" | "CREDIT";
  amount_kobo: number;
  memo: string | null;
};

export type JournalEntryRow = {
  id: string;
  reference_id: string;
  reference_type: string;
  description: string;
  current_hash: string;
  created_at: string;
  postings: JournalPostingRow[];
};

export type PaymentRow = {
  id: string;
  order_id: string;
  order_number: string | null;
  payment_reference: string;
  provider: string;
  amount_kobo: number;
  status: string;
  verified_at: string | null;
  created_at: string;
};

export type SettlementRow = {
  id: string;
  escrow_id: string;
  seller_name: string | null;
  gross_amount_kobo: number;
  commission_kobo: number;
  net_payout_kobo: number;
  payout_reference: string | null;
  status: string;
  processed_at: string | null;
  created_at: string;
};

export function FinanceConsole({
  canApprovePayouts,
  canReadLedger,
  canReadPayments,
  accounts,
  journalEntries,
  payments,
  settlements,
}: {
  canApprovePayouts: boolean;
  canReadLedger: boolean;
  canReadPayments: boolean;
  accounts: LedgerAccountRow[];
  journalEntries: JournalEntryRow[];
  payments: PaymentRow[];
  settlements: SettlementRow[];
}) {
  const [tab, setTab] = useState<"payments" | "settlements" | "ledger" | "accounts">(
    canReadPayments ? "payments" : "ledger",
  );
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-outline-variant/40 pb-2">
        {canReadPayments && (
          <>
            <button
              type="button"
              onClick={() => setTab("payments")}
              className={`rounded-lg px-3 py-1.5 text-label-md font-medium ${
                tab === "payments" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              Payments ({payments.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("settlements")}
              className={`rounded-lg px-3 py-1.5 text-label-md font-medium ${
                tab === "settlements" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              Seller Settlements ({settlements.length})
            </button>
          </>
        )}
        {canReadLedger && (
          <>
            <button
              type="button"
              onClick={() => setTab("ledger")}
              className={`rounded-lg px-3 py-1.5 text-label-md font-medium ${
                tab === "ledger" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              Journal Entries ({journalEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("accounts")}
              className={`rounded-lg px-3 py-1.5 text-label-md font-medium ${
                tab === "accounts" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              Ledger Accounts ({accounts.length})
            </button>
          </>
        )}
      </div>

      {tab === "payments" && canReadPayments && (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
          {payments.length === 0 ? (
            <EmptyState icon="payments" title="No payments match" body="Adjust your filters or date range to view marketplace payment records." />
          ) : (
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-outline-variant/40 bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2.5">Reference</th>
                  <th className="px-3 py-2.5">Order</th>
                  <th className="px-3 py-2.5">Provider</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2.5 font-mono text-xs">{p.payment_reference}</td>
                    <td className="px-3 py-2.5">{p.order_number ?? p.order_id.slice(0, 8)}</td>
                    <td className="px-3 py-2.5 capitalize">{p.provider.replace("_", " ")}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatNaira(p.amount_kobo)}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={p.status === "successful" ? "success" : p.status === "failed" ? "danger" : "warning"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-on-surface-variant">{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "settlements" && canReadPayments && (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
          {settlements.length === 0 ? (
            <EmptyState icon="account_balance" title="No seller settlements" body="Settlement rows are created when buyers confirm escrow delivery." />
          ) : (
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-outline-variant/40 bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2.5">Payout Ref</th>
                  <th className="px-3 py-2.5">Seller</th>
                  <th className="px-3 py-2.5 text-right">Gross</th>
                  <th className="px-3 py-2.5 text-right">Commission</th>
                  <th className="px-3 py-2.5 text-right">Net Payout</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25">
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2.5 font-mono text-xs">{s.payout_reference ?? s.id.slice(0, 8)}</td>
                    <td className="px-3 py-2.5">{s.seller_name ?? "Seller"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNaira(s.gross_amount_kobo)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-on-surface-variant">{formatNaira(s.commission_kobo)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatNaira(s.net_payout_kobo)}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={s.status === "completed" ? "success" : s.status === "failed" ? "danger" : "warning"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      {canApprovePayouts && (s.status === "pending" || s.status === "processing") ? (
                        <div className="flex flex-wrap gap-2">
                          <AdminForm
                            action={processSettlementAction}
                            submitLabel="Mark completed"
                            hidden={{ settlement_id: s.id, status: "completed", note: "Approved via Finance Console" }}
                          />
                          <AdminForm
                            action={processSettlementAction}
                            submitLabel="Mark failed"
                            tone="danger"
                            hidden={{ settlement_id: s.id, status: "failed", note: "Payout failed" }}
                          />
                        </div>
                      ) : (
                        <span className="text-caption text-on-surface-variant">
                          {s.processed_at ? new Date(s.processed_at).toLocaleDateString() : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "ledger" && canReadLedger && (
        <div className="space-y-3">
          {journalEntries.length === 0 ? (
            <EmptyState icon="receipt_long" title="No journal entries" body="Double-entry journal entries appear here when escrow payments, releases, or payouts occur." />
          ) : (
            journalEntries.map((je) => {
              const open = expandedEntryId === je.id;
              return (
                <div key={je.id} className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{je.reference_type}</Badge>
                        <span className="font-mono text-xs text-on-surface-variant">{je.reference_id}</span>
                      </div>
                      <p className="mt-1 font-medium text-on-surface">{je.description}</p>
                      <p className="font-mono text-[11px] text-on-surface-variant">
                        Hash: {je.current_hash.slice(0, 16)}… · {new Date(je.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedEntryId(open ? null : je.id)}
                      className="rounded-lg border border-outline-variant/50 px-3 py-1 text-label-sm font-medium text-on-surface hover:bg-surface-container-low"
                    >
                      {open ? "Hide postings" : `View postings (${je.postings.length})`}
                    </button>
                  </div>
                  {open && (
                    <table className="mt-3 w-full border-t border-outline-variant/30 pt-2 text-left text-body-sm">
                      <thead>
                        <tr className="text-label-sm text-on-surface-variant">
                          <th className="py-1.5">Account</th>
                          <th className="py-1.5">Direction</th>
                          <th className="py-1.5 text-right">Amount</th>
                          <th className="py-1.5">Memo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {je.postings.map((pt) => (
                          <tr key={pt.id}>
                            <td className="py-1.5 font-mono text-xs">{pt.account_id}</td>
                            <td className="py-1.5">{pt.direction}</td>
                            <td className="py-1.5 text-right tabular-nums">{formatNaira(pt.amount_kobo)}</td>
                            <td className="py-1.5 text-on-surface-variant">{pt.memo ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "accounts" && canReadLedger && (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-outline-variant/40 bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="px-3 py-2.5">Account ID</th>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5 text-right">Debits</th>
                <th className="px-3 py-2.5 text-right">Credits</th>
                <th className="px-3 py-2.5 text-right">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/25">
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2.5 font-mono text-xs">{a.id}</td>
                  <td className="px-3 py-2.5">{a.name}</td>
                  <td className="px-3 py-2.5 capitalize">{a.type}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNaira(a.debitsKobo)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNaira(a.creditsKobo)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatNaira(a.balanceKobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
