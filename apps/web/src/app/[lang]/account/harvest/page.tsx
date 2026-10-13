import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { recordHarvest } from "@/actions/farm-ops";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Bars, Chip, DataTable, KpiGrid, Section, Split, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cycleLabel, cycleOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, mass, naira, num } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Produce & harvest commerce" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/harvest">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const cycleIds = scope.cycles.map((c) => c.id).concat("00000000-0000-0000-0000-000000000000");
  const { data: seller } = await supabase.from("marketplace_sellers").select("id").eq("profile_id", account.userId).maybeSingle();
  const [{ data: harvests }, { data: listings }, { data: sales }] = await Promise.all([
    supabase.from("crop_harvests").select("*").in("crop_cycle_id", cycleIds).order("harvest_date", { ascending: false }),
    seller
      ? supabase.from("marketplace_listings").select("id, title, unit, base_price_kobo, status, listing_type, marketplace_inventory_lots(physical_quantity, reserved_quantity, sold_quantity)").eq("seller_id", seller.id).eq("listing_type", "produce")
      : Promise.resolve({ data: [] }),
    seller ? supabase.from("marketplace_order_items").select("title, quantity, unit, subtotal_kobo, seller_earnings_kobo, created_at").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
  ]);
  const h = harvests ?? [];
  const cycles = new Map(scope.cycles.map((c) => [c.id, c]));
  const total = h.reduce((s, x) => s + Number(x.quantity_kg), 0);
  const gradeA = h.filter((x) => x.quality_grade === "A").reduce((s, x) => s + Number(x.quantity_kg), 0);
  const avgLoss = h.length ? h.reduce((s, x) => s + Number(x.loss_pct ?? 0), 0) / h.length : 0;
  const revenue = (sales ?? []).reduce((s, x) => s + Number(x.seller_earnings_kobo), 0);
  const byDest = Object.entries(h.reduce<Record<string, number>>((m, x) => ((m[x.destination ?? "store"] = (m[x.destination ?? "store"] ?? 0) + Number(x.quantity_kg)), m), {})).map(([k, v]) => ({ label: label(k), value: v }));

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="storefront">{(listings ?? []).filter((l) => l.status === "active").length} produce listings live</Chip>}
        title="Produce & Harvest Commerce"
        description="Every harvest batch from field to buyer — grade, losses, where it went and what it earned."
        actions={
          <>
            <Link href={`/${lang}/account/marketplace/new-listing`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3.5 py-2 font-label-md text-label-md text-on-surface shadow-sm ring-1 ring-outline-variant/60 hover:bg-surface-container-low">
              <Icon name="tag" className="text-base" /> List produce
            </Link>
            {scope.cycles.length > 0 && (
              <ActionDialog
                title="Record a harvest"
                trigger="Record harvest"
                icon="agriculture"
                action={recordHarvest}
                hidden={{ lang }}
                fields={[
                  { name: "crop_cycle_id", label: "Crop cycle", type: "select", required: true, options: cycleOptions(scope, false), wide: true },
                  { name: "quantity_kg", label: "Quantity (kg)", type: "number", required: true },
                  { name: "harvest_date", label: "Date", type: "date" },
                  { name: "quality_grade", label: "Grade", type: "select", options: opt(["A", "B", "C", "reject"]) },
                  { name: "destination", label: "Destination", type: "select", required: true, defaultValue: "store", options: opt(["store", "marketplace", "offtaker", "processing", "home_use"]) },
                  { name: "moisture_pct", label: "Moisture %", type: "number" },
                  { name: "loss_pct", label: "Loss %", type: "number" },
                ]}
              />
            )}
          </>
        }
      />
      <KpiGrid>
        <MetricCard label="Harvested" value={mass(total)} icon="grain" foot={`${h.length} batches`} />
        <MetricCard label="Grade A share" value={total ? `${Math.round((gradeA / total) * 100)}%` : "—"} icon="workspace_premium" foot={mass(gradeA)} />
        <MetricCard label="Post-harvest loss" value={`${num(avgLoss, 1)}%`} icon="report" iconTone={avgLoss > 8 ? "bg-caution-soft text-[#b45309]" : undefined} foot="Average across batches" />
        <MetricCard label="Marketplace earnings" value={naira(revenue)} icon="payments" foot="After commission" />
      </KpiGrid>
      <Split
        wide={
          <Section title="Harvest batches" icon="inventory">
            <DataTable
              rows={h}
              rowKey={(x) => x.id}
              empty="No harvests recorded yet."
              columns={[
                { label: "Batch", cell: (x) => <span className="font-medium">{x.batch_code}</span> },
                { label: "Crop", cell: (x) => (cycles.get(x.crop_cycle_id) ? cycleLabel(cycles.get(x.crop_cycle_id)!) : "—") },
                { label: "Date", cell: (x) => (x.harvest_date ? formatDay(x.harvest_date, lang) : "—") },
                { label: "Quantity", numeric: true, cell: (x) => mass(x.quantity_kg) },
                { label: "Grade", cell: (x) => x.quality_grade ?? "—" },
                { label: "Loss", numeric: true, cell: (x) => (x.loss_pct != null ? `${x.loss_pct}%` : "—") },
                { label: "To", cell: (x) => label(x.destination) },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Where the harvest went" icon="alt_route">
            <Bars items={byDest} format={(n) => mass(n)} />
          </Section>
        }
      />
      <Section title="Your produce listings" icon="storefront" action={<Link className="font-label-md text-label-md text-primary-container" href={`/${lang}/account/marketplace/seller`}>Seller centre →</Link>}>
        <DataTable
          rows={listings ?? []}
          rowKey={(l) => l.id}
          empty="No produce listed yet."
          columns={[
            { label: "Listing", cell: (l) => <span className="font-medium">{l.title}</span> },
            { label: "Price", numeric: true, cell: (l) => `${naira(l.base_price_kobo)}/${l.unit}` },
            {
              label: "Available",
              numeric: true,
              cell: (l) => {
                const lots = l.marketplace_inventory_lots ?? [];
                return `${num(lots.reduce((s, x) => s + Number(x.physical_quantity) - Number(x.reserved_quantity ?? 0), 0))} ${l.unit}`;
              },
            },
            { label: "Sold", numeric: true, cell: (l) => num((l.marketplace_inventory_lots ?? []).reduce((s, x) => s + Number(x.sold_quantity ?? 0), 0)) },
            { label: "Status", cell: (l) => <Status value={l.status} /> },
          ]}
        />
      </Section>
    </Stack>
  );
}
