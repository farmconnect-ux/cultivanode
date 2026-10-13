import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createRfq, setQuoteStatus } from "@/actions/ecosystem";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Section, Split, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { label, mass, naira, num } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Produce buyer & aggregator" };

export default async function Page({ params }: PageProps<"/[lang]/account/buyer">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  const uid = account.userId;
  const [{ data: rfqs }, { data: orders }, { data: contracts }, { data: cats }, { data: prices }] = await Promise.all([
    supabase.from("buyer_requests").select("*, buyer_request_responses(id, offered_quantity, unit_price_kobo, total_quote_kobo, offered_grade, estimated_delivery_date, status, seller_notes, marketplace_sellers(business_name))").eq("buyer_id", uid).order("created_at", { ascending: false }),
    supabase.from("marketplace_orders").select("id, order_number, order_type, total_amount_kobo, status, payment_status, placed_at").eq("buyer_id", uid).order("placed_at", { ascending: false }).limit(20),
    supabase.from("offtake_contracts").select("contract_number, commodity, contracted_kg, delivered_kg, price_per_kg_kobo, status").eq("buyer_id", uid),
    supabase.from("marketplace_categories").select("id, name, parent_id").order("sort_order"),
    supabase.from("market_prices").select("commodity, market, unit, price_kobo, observed_on").order("observed_on", { ascending: false }).limit(48),
  ]);
  const r = rfqs ?? [];
  const quotes = r.flatMap((x) => (x.buyer_request_responses ?? []).map((q) => ({ ...q, rfq: x.title, unit: x.unit })));
  const spend = (orders ?? []).filter((o) => o.payment_status !== "pending" && o.payment_status !== "failed").reduce((s, o) => s + Number(o.total_amount_kobo), 0);
  const contractVol = (contracts ?? []).filter((c) => c.status !== "cancelled").reduce((s, c) => s + Number(c.contracted_kg), 0);
  const latest = new Map<string, NonNullable<typeof prices>[number]>();
  for (const p of prices ?? []) if (!latest.has(`${p.commodity}|${p.market}`)) latest.set(`${p.commodity}|${p.market}`, p);

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="request_quote">{r.filter((x) => x.status === "open" || x.status === "evaluating").length} open requests</Chip>
            <Chip icon="handshake">{(contracts ?? []).length} contracts</Chip>
          </>
        }
        title="Produce Buyer & Aggregator"
        description="Source produce at volume: publish requests for quotation, compare seller quotes, and track orders and forward contracts."
        actions={
          <>
            <Link href={`/${lang}/marketplace`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3.5 py-2 font-label-md text-label-md text-on-surface shadow-sm ring-1 ring-outline-variant/60 hover:bg-surface-container-low">
              <Icon name="storefront" className="text-base" /> Browse marketplace
            </Link>
            <ActionDialog
              title="Request for quotation"
              description="Verified sellers in the category see your request and send quotes."
              trigger="New RFQ"
              icon="request_quote"
              action={createRfq}
              hidden={{ lang }}
              fields={[
                { name: "title", label: "Title", required: true, wide: true, placeholder: "Yellow maize for feed mill — 60 t" },
                { name: "category_id", label: "Category", type: "select", required: true, options: (cats ?? []).filter((c) => c.parent_id).map((c) => ({ value: c.id, label: c.name })) },
                { name: "target_crop_or_commodity", label: "Commodity", required: true },
                { name: "required_quantity", label: "Quantity", type: "number", required: true },
                { name: "unit", label: "Unit", type: "select", required: true, defaultValue: "tonne", options: ["kg", "tonne", "bag", "crate", "basket", "piece", "litre"].map((u) => ({ value: u, label: u })) },
                { name: "target_grade", label: "Grade", type: "select", options: ["grade_a", "grade_b", "grade_c", "processing_grade"].map((g) => ({ value: g, label: label(g) })) },
                { name: "delivery_location", label: "Deliver to", required: true },
                { name: "deadline_date", label: "Needed by", type: "date", required: true },
                { name: "target_budget", label: "Budget (₦)", type: "number" },
                { name: "notes", label: "Specs and notes", type: "textarea" },
              ]}
            />
          </>
        }
      />
      <KpiGrid>
        <MetricCard label="Quotes received" value={quotes.length} icon="inbox" foot={`${quotes.filter((q) => q.status === "submitted").length} awaiting review`} />
        <MetricCard label="Marketplace spend" value={naira(spend)} icon="payments" foot={`${(orders ?? []).length} orders`} />
        <MetricCard label="Contracted volume" value={mass(contractVol)} icon="handshake" href={`/${lang}/account/contracts`} foot="Forward contracts with growers" />
        <MetricCard label="Market prices tracked" value={latest.size} icon="query_stats" href={`/${lang}/account/market-intel`} foot="Commodity × market" />
      </KpiGrid>
      <Section title="Requests & quotes" icon="request_quote">
        <div className="flex flex-col gap-space-lg">
          {r.map((x) => (
            <div key={x.id} className="rounded-xl border border-outline-variant/40 p-space-md">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface">{x.title}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {x.request_number} · {num(x.required_quantity)} {x.unit} {x.target_grade ? `· ${label(x.target_grade)}` : ""} · by {formatDay(x.deadline_date, lang)} · {x.delivery_location}
                  </p>
                </div>
                <Status value={x.status} />
              </div>
              <DataTable
                rows={x.buyer_request_responses ?? []}
                rowKey={(q) => q.id}
                empty="No quotes yet."
                columns={[
                  { label: "Seller", cell: (q) => <span className="font-medium">{q.marketplace_sellers?.business_name ?? "Seller"}</span> },
                  { label: "Quantity", numeric: true, cell: (q) => `${num(q.offered_quantity, 1)} ${x.unit}` },
                  { label: "Unit price", numeric: true, cell: (q) => naira(q.unit_price_kobo) },
                  { label: "Total", numeric: true, cell: (q) => naira(q.total_quote_kobo) },
                  { label: "Delivery", cell: (q) => formatDay(q.estimated_delivery_date, lang) },
                  { label: "Status", cell: (q) => <Status value={q.status} /> },
                  {
                    label: "",
                    cell: (q) =>
                      q.status === "submitted" || q.status === "shortlisted" ? (
                        <span className="flex gap-1">
                          <ActionButton action={setQuoteStatus} hidden={{ lang, id: q.id, status: "accepted" }} label="Accept" tone="primary" />
                          <ActionButton action={setQuoteStatus} hidden={{ lang, id: q.id, status: "rejected" }} label="Reject" icon="close" />
                        </span>
                      ) : null,
                  },
                ]}
              />
            </div>
          ))}
          {!r.length && <p className="py-4 text-center text-body-sm text-on-surface-variant">No requests yet — publish an RFQ to get quotes.</p>}
        </div>
      </Section>
      <Split
        wide={
          <Section title="Orders" icon="receipt_long">
            <DataTable
              rows={orders ?? []}
              rowKey={(o) => o.id}
              empty="No orders yet."
              columns={[
                { label: "Order", cell: (o) => <Link className="font-medium text-primary-container hover:underline" href={`/${lang}/account/marketplace/orders/${o.id}`}>{o.order_number}</Link> },
                { label: "Type", cell: (o) => label(o.order_type) },
                { label: "Placed", cell: (o) => (o.placed_at ? formatDay(o.placed_at.slice(0, 10), lang) : "—") },
                { label: "Total", numeric: true, cell: (o) => naira(o.total_amount_kobo) },
                { label: "Payment", cell: (o) => <Status value={o.payment_status} /> },
                { label: "Status", cell: (o) => <Status value={o.status} /> },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Latest prices" icon="query_stats">
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {[...latest.values()].slice(0, 10).map((p) => (
                <li key={`${p.commodity}${p.market}`} className="flex justify-between gap-2 py-1.5 text-body-sm">
                  <span className="text-on-surface">
                    {p.commodity} <span className="text-on-surface-variant">· {p.market}</span>
                  </span>
                  <span className="tabular-nums">
                    {naira(p.price_kobo)}/{p.unit}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        }
      />
    </Stack>
  );
}
