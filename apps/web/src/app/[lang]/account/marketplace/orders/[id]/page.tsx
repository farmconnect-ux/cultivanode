import { notFound } from "next/navigation";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card, Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { confirmDeliveryAndReleaseEscrowAction } from "@/actions/marketplace";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();

  const account = await requireAccount(lang);
  const supabase = (await createClient()) as any;

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

  const items = order.marketplace_order_items as any[];
  const fulfilments = order.marketplace_fulfilments as any[];

  return (
    <Container className="py-10 sm:py-14 max-w-4xl flex flex-col gap-8">
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

        <div className="text-right">
          <span className="text-xs text-muted block">Payment Status</span>
          <Badge className={order.payment_status === "escrowed" || order.payment_status === "paid" ? "bg-node-100 text-node-800" : "bg-earth-100 text-ink"}>
            🛡️ Escrow: {order.payment_status.toUpperCase()}
          </Badge>
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
            <span className="font-bold text-ink">Paid / Escrow</span>
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
            <span className="font-bold text-ink">Settled</span>
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
            <span>Total Amount Paid (Held in Escrow):</span>
            <span>{formatNaira(order.total_amount_kobo)}</span>
          </div>
        </div>
      </Card>

      {/* Multi-Seller Fulfilments & Escrow Release */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-ink">Fulfilments &amp; Escrow Release</h2>

        {fulfilments.map((f) => (
          <Card key={f.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-line bg-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-leaf-800">{f.fulfilment_number}</span>
                <Badge className="bg-leaf-100 text-leaf-800 text-[10px] uppercase font-bold">{f.status}</Badge>
              </div>
              <h3 className="font-bold text-ink mt-1">Seller: {f.marketplace_sellers?.business_name}</h3>
              <p className="text-xs text-muted">Method: {f.delivery_method} · Amount: {formatNaira(f.subtotal_kobo)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form action={async () => {
                "use server";
                await confirmDeliveryAndReleaseEscrowAction(f.id, lang);
              }}>
                <Button variant="primary" type="submit" className="text-xs font-bold py-2">
                  Confirm Delivery &amp; Release Escrow
                </Button>
              </form>
              <button
                type="button"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-danger hover:bg-red-100 transition"
              >
                Dispute
              </button>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}
