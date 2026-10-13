import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { DataTable, KpiGrid, Section, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { naira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "My orders" };

const OPEN = ["placed", "payment_pending", "paid", "confirmed", "processing", "dispatched", "in_transit", "partially_delivered"];

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang, { customer: true });
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketplace_orders")
    .select("id, order_number, total_amount_kobo, status, payment_status, placed_at, marketplace_order_items ( title, quantity, unit )")
    .eq("buyer_id", account.userId)
    .order("placed_at", { ascending: false })
    .limit(100);
  const orders = data ?? [];
  const open = orders.filter((o) => OPEN.includes(o.status));
  const awaitingPayment = orders.filter((o) => o.payment_status === "pending" && o.status !== "cancelled");
  const spent = orders.filter((o) => o.payment_status === "paid" || o.payment_status === "released").reduce((s, o) => s + Number(o.total_amount_kobo), 0);

  return (
    <Stack>
      <PageHeader
        title="My orders"
        description="Everything you've bought on the marketplace. Your payment stays in escrow until you confirm delivery."
        actions={
          <Link href={`/${lang}/marketplace`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-label-md text-on-primary hover:bg-primary">
            <Icon name="storefront" className="text-base" /> Shop the marketplace
          </Link>
        }
      />
      <KpiGrid>
        <MetricCard label="Open orders" value={open.length} icon="local_shipping" foot="Not yet delivered" />
        <MetricCard label="Awaiting payment" value={awaitingPayment.length} icon="pending_actions" foot="Finish paying to start delivery" />
        <MetricCard label="Paid to date" value={naira(spent)} icon="payments" foot="Held in escrow or released" />
        <MetricCard label="All orders" value={orders.length} icon="receipt_long" />
      </KpiGrid>
      <Section title="Orders" icon="receipt_long">
        <DataTable
          rows={orders}
          rowKey={(o) => o.id}
          empty="You haven't placed an order yet. Browse the marketplace to get started."
          columns={[
            {
              label: "Order",
              cell: (o) => (
                <Link href={`/${lang}/account/marketplace/orders/${o.id}`} className="font-medium text-primary hover:underline">
                  {o.order_number}
                </Link>
              ),
            },
            {
              label: "Items",
              cell: (o) =>
                (o.marketplace_order_items ?? [])
                  .map((i) => `${i.title} (${Number(i.quantity).toLocaleString("en-NG")} ${i.unit})`)
                  .join(", ") || "—",
            },
            { label: "Placed", cell: (o) => (o.placed_at ? formatDay(o.placed_at.slice(0, 10), lang) : "—") },
            { label: "Total", cell: (o) => naira(o.total_amount_kobo) },
            { label: "Payment", cell: (o) => <Status value={o.payment_status} /> },
            { label: "Status", cell: (o) => <Status value={o.status} /> },
          ]}
        />
      </Section>
    </Stack>
  );
}
