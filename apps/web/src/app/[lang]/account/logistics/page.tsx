import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ds/page-header";
import { Chip, DataTable, KpiGrid, Section, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { ago, label, naira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Logistics & haulage" };

export default async function Page({ params }: PageProps<"/[lang]/account/logistics">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  // Shipments visible to this account: ones they carry, or on orders they bought or sold (RLS decides).
  const { data } = await supabase
    .from("marketplace_shipments")
    .select("id, tracking_code, carrier_type, carrier_profile_id, vehicle_type, status, pickup_time, delivery_time, created_at, marketplace_fulfilments(fulfilment_number, subtotal_kobo, delivery_fee_kobo, order_id, marketplace_sellers(business_name))")
    .order("created_at", { ascending: false })
    .limit(50);
  const s = data ?? [];
  const mine = s.filter((x) => x.carrier_profile_id === account.userId);
  const inTransit = s.filter((x) => ["picked_up", "in_transit", "arrived"].includes(x.status ?? ""));
  const waiting = s.filter((x) => ["created", "assigned", "pickup_pending"].includes(x.status ?? ""));
  const fees = mine.reduce((sum, x) => sum + Number(x.marketplace_fulfilments?.delivery_fee_kobo ?? 0), 0);

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="local_shipping">{s.length} shipments</Chip>}
        title="Logistics & Haulage"
        description="Produce and input shipments you carry, send or receive — pickup, transit and proof of delivery."
      />
      {!s.length && <StartHere icon="local_shipping" title="No shipments yet">Shipments appear when an order you sell, buy or carry is dispatched.</StartHere>}
      <KpiGrid>
        <MetricCard label="In transit" value={inTransit.length} icon="local_shipping" foot="Picked up, on the road or arrived" />
        <MetricCard label="Awaiting pickup" value={waiting.length} icon="pending_actions" foot="Created, assigned or pending" />
        <MetricCard label="Hauled by you" value={mine.length} icon="airport_shuttle" foot={`${s.filter((x) => x.status === "delivered").length} delivered overall`} />
        <MetricCard label="Delivery fees carried" value={naira(fees)} icon="payments" foot="On shipments you drove" />
      </KpiGrid>
      <Section title="Shipments" icon="route">
        <DataTable
          rows={s}
          rowKey={(x) => x.id}
          columns={[
            { label: "Tracking", cell: (x) => <span className="font-medium">{x.tracking_code}</span> },
            { label: "Order", cell: (x) => (x.marketplace_fulfilments ? <Link className="text-primary-container hover:underline" href={`/${lang}/account/marketplace/orders/${x.marketplace_fulfilments.order_id}`}>{x.marketplace_fulfilments.fulfilment_number}</Link> : "—") },
            { label: "Seller", cell: (x) => x.marketplace_fulfilments?.marketplace_sellers?.business_name ?? "—" },
            { label: "Carrier", cell: (x) => `${label(x.carrier_type)}${x.carrier_profile_id === account.userId ? " (you)" : ""}` },
            { label: "Vehicle", cell: (x) => x.vehicle_type ?? "—" },
            { label: "Picked up", cell: (x) => ago(x.pickup_time) },
            { label: "Goods value", numeric: true, cell: (x) => naira(x.marketplace_fulfilments?.subtotal_kobo) },
            { label: "Status", cell: (x) => <Status value={x.status} /> },
          ]}
        />
      </Section>
    </Stack>
  );
}
