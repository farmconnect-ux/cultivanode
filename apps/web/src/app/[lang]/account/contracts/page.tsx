import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createOfftakeContract, recordContractDelivery, setContractStatus } from "@/actions/ecosystem";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Meter, Section, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { sellerParties } from "@/lib/account/counterparties";
import { requireAccount } from "@/lib/account/session";
import { mass, naira, share } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Off-take contracts" };

export default async function Page({ params }: PageProps<"/[lang]/account/contracts">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  const uid = account.userId;
  const [{ data: contracts }, growers] = await Promise.all([
    supabase.from("offtake_contracts").select("*, contract_deliveries(id, delivered_on, quantity_kg, grade, accepted, weighbridge_ref)").or(`buyer_id.eq.${uid},grower_id.eq.${uid}`).order("delivery_start"),
    sellerParties(["farmer", "external_farmer", "cooperative", "aggregator"]),
  ]);
  const all = contracts ?? [];
  const asGrower = all.filter((c) => c.grower_id === uid);
  const asBuyer = all.filter((c) => c.buyer_id === uid);
  const live = all.filter((c) => ["signed", "active", "delivering"].includes(c.status ?? ""));
  const value = live.reduce((s, c) => s + Number(c.contracted_kg) * Number(c.price_per_kg_kobo), 0);
  const delivered = live.reduce((s, c) => s + Number(c.delivered_kg ?? 0), 0);
  const contracted = live.reduce((s, c) => s + Number(c.contracted_kg), 0);
  const deliveries = all.flatMap((c) => (c.contract_deliveries ?? []).map((d) => ({ ...d, contract: c.contract_number, commodity: c.commodity }))).sort((a, b) => (b.delivered_on ?? "").localeCompare(a.delivered_on ?? ""));

  const table = (rows: typeof all, side: "grower" | "buyer") => (
    <DataTable
      rows={rows}
      rowKey={(c) => c.id}
      empty={side === "grower" ? "No buyer has contracted your produce yet." : "You haven't offered any contracts."}
      columns={[
        { label: "Contract", cell: (c) => <span className="font-medium">{c.contract_number}</span> },
        { label: side === "grower" ? "Buyer" : "Commodity", cell: (c) => (side === "grower" ? c.buyer_name : c.commodity) },
        { label: side === "grower" ? "Commodity" : "Grade", cell: (c) => (side === "grower" ? `${c.commodity}${c.grade ? ` · ${c.grade}` : ""}` : c.grade ?? "—") },
        { label: "Price", numeric: true, cell: (c) => `${naira(c.price_per_kg_kobo)}/kg` },
        {
          label: "Delivered",
          cell: (c) => (
            <div className="w-36">
              <Meter value={share(Number(c.delivered_kg ?? 0), Number(c.contracted_kg))} />
              <span className="text-body-sm text-on-surface-variant">
                {mass(c.delivered_kg)} of {mass(c.contracted_kg)}
              </span>
            </div>
          ),
        },
        { label: "Window", cell: (c) => `${formatDay(c.delivery_start, lang)} – ${formatDay(c.delivery_end, lang)}` },
        { label: "Status", cell: (c) => <Status value={c.status} /> },
        {
          label: "",
          cell: (c) =>
            side === "grower" && c.status === "offered" ? (
              <span className="flex gap-1">
                <ActionButton action={setContractStatus} hidden={{ lang, id: c.id, status: "signed" }} label="Sign" icon="draw" tone="primary" />
                <ActionButton action={setContractStatus} hidden={{ lang, id: c.id, status: "cancelled" }} label="Decline" icon="close" />
              </span>
            ) : side === "buyer" && ["signed", "active", "delivering"].includes(c.status ?? "") ? (
              <ActionDialog
                title={`Record delivery — ${c.contract_number}`}
                trigger="Delivery"
                icon="local_shipping"
                tone="ghost"
                action={recordContractDelivery}
                hidden={{ lang, contract_id: c.id }}
                fields={[
                  { name: "quantity_kg", label: "Quantity (kg)", type: "number", required: true },
                  { name: "delivered_on", label: "Date", type: "date" },
                  { name: "grade", label: "Grade" },
                  { name: "moisture_pct", label: "Moisture %", type: "number" },
                  { name: "weighbridge_ref", label: "Weighbridge ticket" },
                  { name: "accepted", label: "Accepted?", type: "select", required: true, defaultValue: "yes", options: [{ value: "yes", label: "Accepted" }, { value: "no", label: "Rejected" }] },
                ]}
              />
            ) : null,
        },
      ]}
    />
  );

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="handshake">{live.length} live contracts</Chip>
            <Chip icon="agriculture">{asGrower.length} as grower</Chip>
            <Chip icon="shopping_bag">{asBuyer.length} as buyer</Chip>
          </>
        }
        title="Off-take Contracts"
        description="Forward contracts between growers and buyers — price, volume, delivery window and every weighbridge ticket against them."
        actions={
          <ActionDialog
            title="Offer an off-take contract"
            description="The grower sees it under their contracts and can sign or decline."
            trigger="Offer contract"
            icon="handshake"
            action={createOfftakeContract}
            hidden={{ lang }}
            fields={[
              { name: "grower_id", label: "Grower", type: "select", required: true, options: growers.filter((g) => g.value !== account.userId), wide: true },
              { name: "commodity", label: "Commodity", required: true },
              { name: "grade", label: "Grade" },
              { name: "contracted_kg", label: "Volume (kg)", type: "number", required: true },
              { name: "price_per_kg", label: "Price (₦/kg)", type: "number", required: true },
              { name: "delivery_start", label: "Delivery from", type: "date", required: true },
              { name: "delivery_end", label: "Delivery to", type: "date", required: true },
              { name: "delivery_point", label: "Delivery point" },
              { name: "advance_paid", label: "Advance (₦)", type: "number" },
              { name: "terms", label: "Terms", type: "textarea" },
            ]}
          />
        }
      />
      <KpiGrid>
        <MetricCard label="Contract value" value={naira(value)} icon="handshake" foot="Live contracts at contract price" />
        <MetricCard label="Delivered" value={`${Math.round(share(delivered, contracted))}%`} icon="local_shipping" foot={`${mass(delivered)} of ${mass(contracted)}`} />
        <MetricCard label="Awaiting signature" value={all.filter((c) => c.status === "offered").length} icon="draw" foot="Offered, not yet signed" />
        <MetricCard label="Deliveries logged" value={deliveries.length} icon="scale" foot={`${deliveries.filter((d) => d.accepted === false).length} rejected`} />
      </KpiGrid>
      <Section title="My produce under contract" icon="agriculture" description="Contracts where you are the grower.">
        {table(asGrower, "grower")}
      </Section>
      <Section title="Contracts I've offered" icon="shopping_bag" description="Contracts where you are the buyer.">
        {table(asBuyer, "buyer")}
      </Section>
      <Section title="Delivery ledger" icon="scale">
        <DataTable
          rows={deliveries}
          rowKey={(d) => d.id}
          empty="No deliveries yet."
          columns={[
            { label: "Date", cell: (d) => (d.delivered_on ? formatDay(d.delivered_on, lang) : "—") },
            { label: "Contract", cell: (d) => d.contract },
            { label: "Commodity", cell: (d) => d.commodity },
            { label: "Quantity", numeric: true, cell: (d) => mass(d.quantity_kg) },
            { label: "Grade", cell: (d) => d.grade ?? "—" },
            { label: "Ticket", cell: (d) => d.weighbridge_ref ?? "—" },
            { label: "Result", cell: (d) => <Status value={d.accepted === false ? "rejected" : "accepted"} /> },
          ]}
        />
      </Section>
    </Stack>
  );
}
