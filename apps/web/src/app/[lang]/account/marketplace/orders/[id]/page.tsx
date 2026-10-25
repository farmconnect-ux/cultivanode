import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card, Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { confirmDeliveryAndReleaseEscrowAction } from "@/actions/marketplace";
import { initiateOrderPayment } from "@/actions/checkout";
import type { SupabaseClient } from "@supabase/supabase-js";
import { confirmDirectDelivery, reportDirectPayment } from "@/actions/direct-payment";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { isOn } from "@/lib/flags";

type DirectRow = { id: string; seller_id: string; direct_payment_status: string | null; buyer_payment_reference: string | null };
type Payout = { seller_id: string; bank_name: string; account_name: string; account_number: string };
const HANDED_OVER = ["ready_for_pickup", "dispatched", "in_transit", "delivered"];

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
  searchParams?: Promise<{ error?: string; payment?: string; flw?: string; placed?: string }>;
}) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();

  const sp = searchParams ? await searchParams : {};
  const account = await requireAccount(lang, { customer: true });
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("marketplace_orders")
    .select(`
      id,
      order_number,
      order_type,
      currency,
      items_subtotal_kobo,
      delivery_fee_kobo,
      total_amount_kobo,
      status,
      payment_status,
      delivery_address,
      placed_at,
      paid_at,
      completed_at,
      marketplace_order_items (
        id,
        title,
        quantity,
        unit,
        unit_price_kobo,
        subtotal_kobo,
        seller_id,
        marketplace_sellers ( business_name )
      ),
      marketplace_fulfilments (
        id,
        fulfilment_number,
        seller_id,
        status,
        subtotal_kobo,
        delivery_method,
        tracking_number,
        notes,
        dispatched_at,
        delivered_at,
        marketplace_sellers ( business_name )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  const items = order.marketplace_order_items ?? [];
  const fulfilments = order.marketplace_fulfilments ?? [];

  // Direct payment (escrow switched off): newer columns and table, read through an untyped client.
  const loose = supabase as unknown as SupabaseClient;
  const [escrowOn, { data: modeRow }, { data: directRows }] = await Promise.all([
    isOn("escrow_payments"),
    loose.from("marketplace_orders").select("payment_mode").eq("id", id).maybeSingle(),
    loose.from("marketplace_fulfilments").select("id, seller_id, direct_payment_status, buyer_payment_reference").eq("order_id", id),
  ]);
  const isDirect = (modeRow as { payment_mode?: string } | null)?.payment_mode === "direct";
  const direct = new Map(((directRows ?? []) as DirectRow[]).map((d) => [d.id, d]));
  let payouts = new Map<string, Payout>();
  if (isDirect) {
    const sellerIds = [...new Set(fulfilments.map((f) => f.seller_id))];
    const { data } = await loose.from("marketplace_seller_payout_accounts").select("seller_id, bank_name, account_name, account_number").in("seller_id", sellerIds);
    payouts = new Map(((data ?? []) as Payout[]).map((p) => [p.seller_id, p]));
  }
  const isPaid = ["paid", "escrowed", "released"].includes(order.payment_status);

  return (
    <Container className="py-10 sm:py-14 max-w-4xl flex flex-col gap-8">
      {sp.error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm font-medium">
          ⚠️ {sp.error}
        </div>
      )}
      {isDirect && sp.placed === "1" && !isPaid && (
        <div role="status" className="p-4 bg-leaf-50 border border-leaf-200 text-leaf-900 rounded-lg text-sm">
          Order placed. Pay each seller below by bank transfer, using the reference shown, then tap “I&apos;ve sent the money”.
          The seller confirms when it arrives and then sends your order.
        </div>
      )}
      {!isDirect && sp.payment === "pending" && order.payment_status === "pending" && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          ⏳ Order placed! Please complete payment below to escrow funds and dispatch delivery.
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/${lang}/marketplace`} className="text-xs text-muted hover:text-leaf-800">
              ← Marketplace
            </Link>
            <Badge className="bg-leaf-100 text-leaf-800 text-[11px] font-bold uppercase">
              {order.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl font-mono">
            {order.order_number}
          </h1>
          <p className="text-xs text-muted">
            Placed on {order.placed_at ? new Date(order.placed_at).toLocaleDateString() : "Today"}
          </p>
        </div>

        <div className="text-right flex flex-col items-end gap-2">
          <span className="text-xs text-muted block">Payment Status</span>
          <Badge className={isPaid ? "bg-node-100 text-node-800" : "bg-earth-100 text-ink"}>
            {isDirect ? (isPaid ? "Paid to seller" : "Pay seller directly") : `Escrow: ${order.payment_status}`}
          </Badge>
          {!isDirect && !isPaid && !escrowOn && (
            <span className="max-w-xs text-xs text-muted">Paying through CultivaNode is coming soon.</span>
          )}
          {!isDirect && escrowOn && !isPaid && (
            <form action={async () => {
              "use server";
              const res = await initiateOrderPayment(order.id, lang);
              if (res.ok && res.redirectUrl) {
                redirect(res.redirectUrl);
              }
              redirect(`/${lang}/account/marketplace/orders/${order.id}?error=${encodeURIComponent(res.error || "Could not connect to payment gateway")}`);
            }}>
              <Button variant="primary" type="submit" className="text-xs font-bold py-1.5 px-3">
                Pay Now via Gateway →
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Visual Order Timeline */}
      <Card className="p-6 bg-earth-50/60 border border-line">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Order Lifecycle Timeline</h2>
        <div className="grid grid-cols-4 text-center text-xs">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-leaf-700 text-white flex items-center justify-center font-bold mb-1">✓</div>
            <span className="font-bold text-ink">Placed</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1 ${
              order.status !== 'placed' && order.status !== 'draft' ? 'bg-leaf-700 text-white' : 'bg-line text-muted'
            }`}>
              {order.status !== 'placed' && order.status !== 'draft' ? '✓' : '2'}
            </div>
            <span className="font-bold text-ink">{isDirect ? "Paid" : "Paid / Escrow"}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1 ${
              order.status === 'delivered' || order.status === 'completed' ? 'bg-leaf-700 text-white' : 'bg-line text-muted'
            }`}>
              {order.status === 'delivered' || order.status === 'completed' ? '✓' : '3'}
            </div>
            <span className="font-bold text-ink">Dispatched</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1 ${
              order.status === 'completed' ? 'bg-leaf-700 text-white' : 'bg-line text-muted'
            }`}>
              {order.status === 'completed' ? '✓' : '4'}
            </div>
            <span className="font-bold text-ink">{isDirect ? "Received" : "Settled"}</span>
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card className="p-6 bg-white border border-line">
        <h2 className="text-lg font-bold text-ink mb-4">Purchased Items</h2>
        <div className="divide-y divide-line">
          {items.map((item) => (
            <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <h3 className="font-bold text-ink">{item.title}</h3>
                <p className="text-xs text-muted">
                  Seller: {item.marketplace_sellers?.business_name} · {item.quantity} {item.unit} @ {formatNaira(item.unit_price_kobo)}/{item.unit}
                </p>
              </div>
              <div className="font-extrabold text-ink">{formatNaira(item.subtotal_kobo)}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-line space-y-1.5 text-sm">
          <div className="flex justify-between text-muted">
            <span>Items Subtotal:</span>
            <span className="font-semibold text-ink">{formatNaira(order.items_subtotal_kobo)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Delivery Fee:</span>
            <span className="font-semibold text-ink">{formatNaira(order.delivery_fee_kobo)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-leaf-900 pt-2 border-t border-line">
            <span>{isDirect ? "Total to pay sellers:" : isPaid ? "Total paid (held until delivery):" : "Total:"}</span>
            <span>{formatNaira(order.total_amount_kobo)}</span>
          </div>
        </div>
      </Card>

      {/* Multi-Seller Fulfilments & Escrow Release */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-ink">{isDirect ? "Pay and track each seller" : "Fulfilments & escrow release"}</h2>
        {isDirect && (
          <p className="text-sm text-muted">
            You pay each seller&apos;s bank account directly. Paying through CultivaNode, with your money held until delivery, is coming soon.
            Only send money to the account shown here, and use the reference so the seller can find your payment.
          </p>
        )}

        {fulfilments.map((f) => (
          <Card key={f.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-line bg-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-leaf-800">{f.fulfilment_number}</span>
                <Badge className="bg-leaf-100 text-leaf-800 text-[10px] uppercase font-bold">{f.status}</Badge>
              </div>
              <h3 className="font-bold text-ink mt-1">Seller: {f.marketplace_sellers?.business_name}</h3>
              <p className="text-xs text-muted">Method: {f.delivery_method} · Amount: {formatNaira(f.subtotal_kobo)}</p>
              {f.tracking_number && <p className="text-xs text-ink">Tracking / vehicle: <strong>{f.tracking_number}</strong></p>}
              {f.notes && <p className="mt-1 whitespace-pre-line text-xs text-muted">Seller notes: {f.notes}</p>}
              {isDirect && <DirectPayBox d={direct.get(f.id)} payout={payouts.get(f.seller_id)} reference={f.fulfilment_number} amount={formatNaira(f.subtotal_kobo)} />}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Release only once the goods are on their way or handed over, and only money that is actually held. */}
              {isDirect ? (
                <DirectActions f={f} d={direct.get(f.id)} lang={lang} orderId={order.id} />
              ) : HANDED_OVER.includes(f.status) && ["escrowed", "paid"].includes(order.payment_status) ? (
                <form action={async () => {
                  "use server";
                  await confirmDeliveryAndReleaseEscrowAction(f.id, lang);
                }}>
                  <Button variant="primary" type="submit" className="text-xs font-bold py-2">
                    I received it — release payment
                  </Button>
                </form>
              ) : f.status === "rejected" ? (
                <span className="text-xs font-semibold text-danger">The seller couldn&apos;t fulfil this part of your order.</span>
              ) : f.status === "accepted" ? (
                <span className="text-xs font-semibold text-leaf-800">Received · payment released</span>
              ) : (
                <span className="text-xs text-muted">Waiting for the seller to {f.status === "placed" ? "confirm" : "send"} your order.</span>
              )}
              <Link
                href={`/${lang}/account/support?dispute_order=${order.id}&fulfilment=${f.id}`}
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-danger hover:bg-red-100 transition"
              >
                Dispute
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}

function DirectPayBox({ d, payout, reference, amount }: { d: DirectRow | undefined; payout: Payout | undefined; reference: string; amount: string }) {
  const st = d?.direct_payment_status ?? "awaiting_payment";
  return (
    <div className="mt-3 rounded-lg border border-line bg-earth-50/60 p-3 text-xs">
      {payout ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-muted">Amount</dt>
          <dd className="font-bold text-ink">{amount}</dd>
          <dt className="text-muted">Bank</dt>
          <dd className="font-semibold text-ink">{payout.bank_name}</dd>
          <dt className="text-muted">Account name</dt>
          <dd className="font-semibold text-ink">{payout.account_name}</dd>
          <dt className="text-muted">Account number</dt>
          <dd className="font-mono font-bold text-ink">{payout.account_number}</dd>
          <dt className="text-muted">Reference</dt>
          <dd className="font-mono font-bold text-ink">{reference}</dd>
        </dl>
      ) : (
        <p className="text-muted">This seller hasn&apos;t added a bank account yet. Contact support before paying.</p>
      )}
      <p className="mt-2 font-semibold text-ink">
        {st === "confirmed" ? "The seller has confirmed your payment." : st === "buyer_reported" ? "Waiting for the seller to confirm your payment arrived." : "Not paid yet."}
        {d?.buyer_payment_reference && <span className="font-normal text-muted"> Your note: {d.buyer_payment_reference}</span>}
      </p>
    </div>
  );
}

function DirectActions({ f, d, lang, orderId }: { f: { id: string; status: string }; d: DirectRow | undefined; lang: string; orderId: string }) {
  const st = d?.direct_payment_status ?? "awaiting_payment";
  if (f.status === "rejected" || f.status === "cancelled") return <span className="text-xs font-semibold text-danger">The seller couldn&apos;t fulfil this part of your order.</span>;
  if (f.status === "accepted") return <span className="text-xs font-semibold text-leaf-800">Received · complete</span>;
  if (st !== "confirmed") {
    return (
      <ActionDialog
        title="I've sent the money"
        description="We'll tell the seller to check their account. Add the transfer reference or the name your bank shows, if you have it."
        trigger={st === "buyer_reported" ? "Update payment note" : "I've sent the money"}
        icon="send_money"
        tone={st === "buyer_reported" ? "secondary" : "primary"}
        action={reportDirectPayment}
        hidden={{ lang, fulfilment_id: f.id, order_id: orderId }}
        submit="Tell the seller"
        fields={[{ name: "reference", label: "Transfer reference or note (optional)", placeholder: "e.g. GTB transfer from Ade Bello, 10:42am" }]}
      />
    );
  }
  if (HANDED_OVER.includes(f.status)) {
    return <ActionButton action={confirmDirectDelivery} hidden={{ lang, fulfilment_id: f.id, order_id: orderId }} label="I received it" icon="task_alt" tone="primary" />;
  }
  return <span className="text-xs text-muted">Paid. Waiting for the seller to {f.status === "placed" ? "confirm" : "send"} your order.</span>;
}
