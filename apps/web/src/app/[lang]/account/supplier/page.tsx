import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { respondToRfq } from "@/actions/ecosystem";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Pill, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num, relDays } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Input supplier & agro-dealer" };

export default async function Page({ params }: PageProps<"/[lang]/account/supplier">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  const { data: seller } = await supabase.from("marketplace_sellers").select("id, business_name, rating_avg, rating_count, verification_status, commission_rate_bps").eq("profile_id", account.userId).maybeSingle();
  const sid = seller?.id ?? "00000000-0000-0000-0000-000000000000";
  const [{ data: listings }, { data: fulfilments }, { data: rfqs }, { data: myQuotes }] = await Promise.all([
    supabase.from("marketplace_listings").select("id, title, unit, base_price_kobo, status, listing_type, marketplace_inventory_lots(physical_quantity, reserved_quantity, sold_quantity, expiry_date)").eq("seller_id", sid).order("title"),
    supabase.from("marketplace_fulfilments").select("id, fulfilment_number, status, subtotal_kobo, delivery_method, created_at, order_id").eq("seller_id", sid).order("created_at", { ascending: false }).limit(25),
    supabase.from("buyer_requests").select("id, request_number, title, target_crop_or_commodity, required_quantity, unit, deadline_date, delivery_location, target_grade, buyer_id").eq("status", "open").neq("buyer_id", account.userId).order("deadline_date").limit(20),
    supabase.from("buyer_request_responses").select("request_id, status").eq("seller_id", sid),
  ]);
  const l = listings ?? [];
  const stock = (x: (typeof l)[number]) => (x.marketplace_inventory_lots ?? []).reduce((s, lot) => s + Number(lot.physical_quantity) - Number(lot.reserved_quantity ?? 0), 0);
  const sold = l.reduce((s, x) => s + (x.marketplace_inventory_lots ?? []).reduce((a, lot) => a + Number(lot.sold_quantity ?? 0), 0), 0);
  const quoted = new Map((myQuotes ?? []).map((q) => [q.request_id, q.status]));
  const pending = (fulfilments ?? []).filter((f) => ["placed", "confirmed", "preparing", "ready_for_pickup"].includes(f.status ?? ""));
  const gmv = (fulfilments ?? []).reduce((s, f) => s + Number(f.subtotal_kobo), 0);

  return (
    <Stack>
      <PageHeader
        eyebrow={
          seller ? (
            <>
              <Chip icon="store">{seller.business_name}</Chip>
              <Status value={seller.verification_status} />
              <Chip icon="star">
                {num(seller.rating_avg, 1)} ({seller.rating_count})
              </Chip>
            </>
          ) : undefined
        }
        title="Input Supplier & Agro-dealer"
        description="Your catalogue, stock on hand, orders to pack and open buyer requests you can quote on."
        actions={
          <>
            <Link href={`/${lang}/account/marketplace/seller`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3.5 py-2 font-label-md text-label-md text-on-surface shadow-sm ring-1 ring-outline-variant/60 hover:bg-surface-container-low">
              <Icon name="storefront" className="text-base" /> Seller centre
            </Link>
            <Link href={`/${lang}/account/marketplace/new-listing`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-3.5 py-2 font-label-md text-label-md text-on-primary shadow-sm hover:bg-primary">
              <Icon name="add" className="text-base" /> New listing
            </Link>
          </>
        }
      />
      {!seller && <StartHere icon="store" title="Open your seller profile" action={<Link className="font-label-md text-primary-container" href={`/${lang}/account/marketplace/new-listing`}>Create your first listing →</Link>}>Your catalogue, orders and RFQs appear here once you sell on the marketplace.</StartHere>}
      <KpiGrid>
        <MetricCard label="Active listings" value={l.filter((x) => x.status === "active").length} icon="inventory_2" foot={`${l.length} in catalogue`} />
        <MetricCard label="Orders to pack" value={pending.length} icon="inventory" foot="Placed, confirmed or preparing" />
        <MetricCard label="Sales value" value={naira(gmv)} icon="payments" foot={`${num(sold)} units sold`} />
        <MetricCard label="Open buyer requests" value={(rfqs ?? []).length} icon="request_quote" foot={`${quoted.size} quoted by you`} />
      </KpiGrid>
      <Section title="Catalogue & stock" icon="inventory_2">
        <DataTable
          rows={l}
          rowKey={(x) => x.id}
          empty="No listings yet."
          columns={[
            { label: "Listing", cell: (x) => <span className="font-medium">{x.title}</span> },
            { label: "Type", cell: (x) => label(x.listing_type) },
            { label: "Price", numeric: true, cell: (x) => `${naira(x.base_price_kobo)}/${x.unit}` },
            { label: "Available", numeric: true, cell: (x) => (stock(x) < 20 ? <Pill tone="caution">{num(stock(x))} {x.unit}</Pill> : `${num(stock(x))} ${x.unit}`) },
            { label: "Expiry", cell: (x) => { const e = (x.marketplace_inventory_lots ?? []).map((lot) => lot.expiry_date).filter(Boolean).sort()[0]; return e ? relDays(e) : "—"; } },
            { label: "Status", cell: (x) => <Status value={x.status} /> },
          ]}
        />
      </Section>
      <Split
        wide={
          <Section title="Buyer requests to quote" icon="request_quote">
            <DataTable
              rows={rfqs ?? []}
              rowKey={(x) => x.id}
              empty="No open requests right now."
              columns={[
                { label: "Request", cell: (x) => <span className="font-medium">{x.title}</span> },
                { label: "Quantity", numeric: true, cell: (x) => `${num(x.required_quantity)} ${x.unit}` },
                { label: "Needed by", cell: (x) => formatDay(x.deadline_date, lang) },
                { label: "Deliver to", cell: (x) => x.delivery_location },
                {
                  label: "",
                  cell: (x) =>
                    quoted.has(x.id) ? (
                      <Status value={quoted.get(x.id)} />
                    ) : seller ? (
                      <ActionDialog
                        title={`Quote — ${x.request_number}`}
                        description={`${x.title} · ${num(x.required_quantity)} ${x.unit}`}
                        trigger="Quote"
                        tone="ghost"
                        icon="send"
                        action={respondToRfq}
                        hidden={{ lang, request_id: x.id }}
                        fields={[
                          { name: "offered_quantity", label: `Quantity (${x.unit})`, type: "number", required: true, defaultValue: x.required_quantity },
                          { name: "unit_price", label: `Price per ${x.unit} (₦)`, type: "number", required: true },
                          { name: "delivery_fee", label: "Delivery fee (₦)", type: "number" },
                          { name: "estimated_delivery_date", label: "Delivery date", type: "date", required: true },
                          { name: "offered_grade", label: "Grade", type: "select", options: ["grade_a", "grade_b", "grade_c", "processing_grade"].map((g) => ({ value: g, label: label(g) })) },
                          { name: "seller_notes", label: "Notes", type: "textarea" },
                        ]}
                      />
                    ) : null,
                },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Recent orders" icon="receipt_long">
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {(fulfilments ?? []).slice(0, 10).map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 py-2 text-body-sm">
                  <Link href={`/${lang}/account/marketplace/orders/${f.order_id}`} className="text-primary-container hover:underline">{f.fulfilment_number}</Link>
                  <span className="tabular-nums">{naira(f.subtotal_kobo)}</span>
                  <Status value={f.status} />
                </li>
              ))}
              {!fulfilments?.length && <li className="py-4 text-center text-body-sm text-on-surface-variant">No orders yet.</li>}
            </ul>
          </Section>
        }
      />
    </Stack>
  );
}
