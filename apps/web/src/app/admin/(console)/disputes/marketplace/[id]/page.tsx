import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import {
  adminResolveMarketplaceDispute,
  adminReopenMarketplaceDispute,
  adminRequestMarketplaceDisputeEvidence,
} from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Badge, Card, Field, Input, Select, TextArea } from "@/components/ui";
import { when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Marketplace Dispute Arbitration Workstation" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MarketplaceDisputeDetail = {
  id: string;
  reason: string;
  description: string;
  evidence_urls: string[];
  status: string;
  decision: "uphold_buyer" | "uphold_seller" | "settlement" | null;
  decision_text: string | null;
  settlement_instructions: string | null;
  refund_amount_kobo: number | null;
  resolution: string | null;
  resolution_type: string | null;
  evidence_requested_from: string | null;
  evidence_deadline: string | null;
  evidence_request_note: string | null;
  created_at: string;
  resolved_at: string | null;
  reopened_at: string | null;
  reopened_reason: string | null;
  order: {
    id: string;
    order_number: string;
    total_amount_kobo: number;
    payment_mode: "direct" | "escrow";
    payment_status: string;
    status: string;
    created_at: string;
  };
  buyer: {
    id: string;
    full_name: string;
    phone: string;
  };
  seller: {
    id: string;
    business_name: string;
    seller_type: string;
    profile_name: string;
    phone: string;
    payout_bank: string | null;
    payout_account_number: string | null;
    payout_account_name: string | null;
  };
  fulfilment: {
    id: string;
    fulfilment_number: string;
    status: string;
    subtotal_kobo: number;
    delivery_method: string;
    tracking_number: string | null;
  } | null;
  items: {
    title: string;
    quantity: number;
    unit_price_kobo: number;
    subtotal_kobo: number;
  }[];
  is_staff: boolean;
};

export default async function AdminMarketplaceDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaff();
  if (!staff) return null;

  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: MarketplaceDisputeDetail | null; error: unknown }>;

  const { data: d, error } = await rpc("marketplace_dispute_detail", { p_dispute: id });
  if (error || !d) notFound();

  const canDecide = can(staff, "disputes.decide");
  const isResolved = d.status === "resolved" || d.status === "closed";
  const isDirect = d.order.payment_mode === "direct";

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb / Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/disputes"
              className="text-xs font-semibold text-leaf-800 hover:underline"
            >
              &larr; Back to Disputes Queue
            </Link>
            <span className="text-muted text-xs">•</span>
            <Badge className="bg-leaf-100 text-leaf-800 text-xs">
              Order Dispute #{d.order.order_number}
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-ink">
            Marketplace Dispute #{d.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-xs text-muted">
            Opened {when(d.created_at)} • Payment Mode:{" "}
            <strong className="text-ink capitalize">{d.order.payment_mode}</strong> (
            {isDirect ? "Direct Bank Transfer" : "Platform Escrow"})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className={
              d.status === "resolved"
                ? "bg-leaf-100 text-leaf-800"
                : d.status === "evidence_required"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-danger"
            }
          >
            {d.status.toUpperCase()}
          </Badge>
          {d.decision && (
            <Badge className="bg-surface-container text-ink">
              {d.decision.replaceAll("_", " ").toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Grid: Details on Left, Arbitration Action on Right */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Case Information, Order & Evidence */}
        <div className="space-y-6 lg:col-span-2">
          {/* Dispute Claim Summary */}
          <Card className="p-5 border border-line space-y-4">
            <div className="border-b border-line pb-3">
              <span className="text-xs uppercase font-bold text-muted">Dispute Reason</span>
              <h3 className="text-lg font-bold text-ink capitalize">
                {d.reason.replaceAll("_", " ")}
              </h3>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted">Initiator Written Statement:</span>
              <p className="mt-1 rounded-md bg-earth-50/70 p-3 text-sm italic text-ink border border-line">
                &ldquo;{d.description}&rdquo;
              </p>
            </div>

            {d.evidence_urls && d.evidence_urls.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-muted">Submitted Evidence Proofs:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.evidence_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-line p-2 text-xs font-semibold text-leaf-800 hover:bg-earth-50 transition"
                    >
                      Proof #{i + 1} &nearr;
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Evidence Loop State */}
          {d.status === "evidence_required" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-1">
              <p className="font-bold">
                Evidence Requested from: {d.evidence_requested_from?.toUpperCase()}
              </p>
              <p className="text-xs">
                Deadline: {d.evidence_deadline ? new Date(d.evidence_deadline).toLocaleString() : "24 hours"}
              </p>
              {d.evidence_request_note && (
                <p className="text-xs italic bg-white/60 p-2 rounded border border-blue-200 mt-2">
                  Note to party: &ldquo;{d.evidence_request_note}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Resolution Outcome Box (If Resolved) */}
          {isResolved && (
            <Card className="p-5 border border-emerald-300 bg-emerald-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-emerald-800">
                  Arbitration Decision: {d.decision?.replaceAll("_", " ").toUpperCase()}
                </span>
                <span className="text-xs text-muted">Resolved {when(d.resolved_at)}</span>
              </div>
              <p className="text-sm font-semibold text-ink">{d.decision_text}</p>
              {d.settlement_instructions && (
                <div className="rounded bg-white p-3 text-xs border border-emerald-200 space-y-1">
                  <p className="font-bold text-leaf-900">Direct Payment Settlement Instructions:</p>
                  <p className="text-ink">{d.settlement_instructions}</p>
                  {d.refund_amount_kobo != null && (
                    <p className="font-bold text-ink mt-1">
                      Settlement Value: {formatNaira(d.refund_amount_kobo)}
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Parties & Order Items */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Buyer Details */}
            <Card className="p-4 border border-line space-y-2">
              <span className="text-xs font-bold uppercase text-muted">Buyer (Customer)</span>
              <h4 className="font-bold text-ink">{d.buyer.full_name}</h4>
              <p className="text-xs text-muted">Phone: {d.buyer.phone}</p>
            </Card>

            {/* Seller Details */}
            <Card className="p-4 border border-line space-y-2">
              <span className="text-xs font-bold uppercase text-muted">Seller (Merchant)</span>
              <h4 className="font-bold text-ink">{d.seller.business_name}</h4>
              <p className="text-xs text-muted">
                Contact: {d.seller.profile_name} ({d.seller.phone})
              </p>
              {d.seller.payout_bank && (
                <div className="text-[11px] text-muted border-t border-line pt-1">
                  Payout Bank: <strong>{d.seller.payout_bank}</strong> •{" "}
                  <code>{d.seller.payout_account_number}</code>
                </div>
              )}
            </Card>
          </div>

          {/* Order Items Table */}
          <Card className="p-4 border border-line space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-xs font-bold uppercase text-muted">Order Line Items</span>
              <span className="text-xs font-bold text-ink">
                Total: {formatNaira(d.order.total_amount_kobo)}
              </span>
            </div>
            <div className="divide-y divide-line text-xs">
              {d.items.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-muted">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-mono font-semibold text-ink">
                    {formatNaira(item.subtotal_kobo)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Staff Arbitration Workstation Panel */}
        <div className="space-y-6">
          {!canDecide ? (
            <Card className="p-5 border border-line text-sm text-muted">
              You do not have the <code>disputes.decide</code> permission to arbitrate this case.
            </Card>
          ) : !isResolved ? (
            <>
              {/* Evidence Request Form */}
              <Card className="p-5 border border-line space-y-4">
                <div>
                  <h3 className="font-bold text-ink">Ask for Specific Evidence</h3>
                  <p className="text-xs text-muted">
                    Give the buyer or seller a clear deadline to upload missing waybill or damage photos.
                  </p>
                </div>

                <AdminForm
                  action={adminRequestMarketplaceDisputeEvidence}
                  hidden={{ dispute_id: d.id }}
                  buttons={[{ label: "Send Evidence Request", variant: "secondary" }]}
                >
                  <Field id="req-to" label="Request From">
                    <Select id="req-to" name="to" defaultValue="buyer">
                      <option value="buyer">Buyer only</option>
                      <option value="seller">Seller only</option>
                      <option value="both">Both parties</option>
                    </Select>
                  </Field>

                  <Field id="req-hours" label="Deadline Window (Hours)">
                    <Input id="req-hours" name="hours" type="number" defaultValue="24" min="1" max="168" />
                  </Field>

                  <Field id="req-note" label="Required Evidence Details">
                    <TextArea
                      id="req-note"
                      name="note"
                      placeholder="e.g. Please upload clear photo of delivery packaging seal and invoice."
                      rows={2}
                      required
                    />
                  </Field>
                </AdminForm>
              </Card>

              {/* Final Arbitration Form */}
              <Card className="p-5 border-2 border-primary-container bg-surface-container-lowest space-y-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-primary-container">Execute Arbitration Ruling</h3>
                  <p className="text-xs text-muted">
                    Decide remedy. In direct mode, this outputs binding bank refund/payout instructions to both parties.
                  </p>
                </div>

                <AdminForm
                  action={adminResolveMarketplaceDispute}
                  hidden={{ dispute_id: d.id }}
                  buttons={[{ label: "Submit Arbitration Decision", variant: "primary" }]}
                >
                  <Field id="arb-decision" label="Ruling Decision">
                    <Select id="arb-decision" name="decision" defaultValue="uphold_buyer">
                      <option value="uphold_buyer">Uphold Buyer (Cancel order / seller refund)</option>
                      <option value="uphold_seller">Uphold Seller (Dismiss dispute / order completed)</option>
                      <option value="settlement">Mutual Settlement (Partial adjustment)</option>
                    </Select>
                  </Field>

                  <Field id="arb-reason" label="Arbitration Finding / Reason">
                    <TextArea
                      id="arb-reason"
                      name="reason"
                      placeholder="Explain the verified factual evidence and rationale for this decision..."
                      rows={3}
                      required
                    />
                  </Field>

                  <Field id="arb-amount" label="Settlement Amount in Naira (Settlement only)">
                    <Input
                      id="arb-amount"
                      name="settlement_naira"
                      type="number"
                      placeholder={`Max: ${d.order.total_amount_kobo / 100}`}
                    />
                  </Field>

                  <Field id="arb-instructions" label="Direct Payment / Restitution Instructions">
                    <TextArea
                      id="arb-instructions"
                      name="settlement_instructions"
                      placeholder="e.g. Seller to transfer ₦15,000 to buyer account within 48 hours; buyer retains delivered inputs."
                      rows={2}
                    />
                  </Field>
                </AdminForm>
              </Card>
            </>
          ) : (
            /* Reopen Case Form */
            <Card className="p-5 border border-line space-y-4">
              <div>
                <h3 className="font-bold text-ink">Reopen Case</h3>
                <p className="text-xs text-muted">
                  If either party submits verified bank statements or proof contradicting the ruling, staff can reopen the case.
                </p>
              </div>

              <AdminForm
                action={adminReopenMarketplaceDispute}
                hidden={{ dispute_id: d.id }}
                buttons={[{ label: "Reopen Dispute for Review", variant: "secondary" }]}
              >
                <Field id="reopen-reason" label="Reason for Reopening">
                  <TextArea
                    id="reopen-reason"
                    name="reason"
                    placeholder="Document the appeal or new evidence justifying reopening this dispute..."
                    rows={3}
                    required
                  />
                </Field>
              </AdminForm>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
