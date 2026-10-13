import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createInventoryItem, recordStockMovement } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Bars, Chip, DataTable, KpiGrid, Pill, Section, Split, Stack, StartHere } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cycleOptions, farmOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { ago, label, naira, num, relDays, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inventory & supplies" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/inventory">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const [{ data: items }, { data: moves }] = await Promise.all([
    supabase.from("farm_inventory").select("*").in("farm_id", ids).order("category").order("item_name"),
    supabase.from("farm_inventory_transactions").select("id, inventory_id, transaction_type, quantity, unit_cost_kobo, notes, created_at").in("farm_id", ids).order("created_at", { ascending: false }).limit(25),
  ]);
  const list = items ?? [];
  const name = new Map(list.map((i) => [i.id, `${i.item_name}`]));
  const unit = new Map(list.map((i) => [i.id, i.unit]));
  const farmName = new Map(scope.farms.map((f) => [f.id, f.name]));
  const value = list.reduce((s, i) => s + Number(i.quantity ?? 0) * Number(i.unit_cost_kobo ?? 0), 0);
  const low = list.filter((i) => Number(i.reorder_threshold) > 0 && Number(i.quantity) <= Number(i.reorder_threshold));
  const expiring = list.filter((i) => i.expiry_date && Date.parse(i.expiry_date) - nowMs() < 30 * 86_400_000);
  const byCat = Object.entries(list.reduce<Record<string, number>>((m, i) => ((m[i.category] = (m[i.category] ?? 0) + Number(i.quantity) * Number(i.unit_cost_kobo)), m), {}))
    .map(([k, v]) => ({ label: label(k), value: v }))
    .sort((a, b) => b.value - a.value);
  const hidden = { lang };

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="inventory_2">{list.length} stock lines</Chip>
            {low.length > 0 && <Chip icon="production_quantity_limits">{low.length} below reorder level</Chip>}
          </>
        }
        title="Inventory & Supplies"
        description="Seed, fertiliser, chemicals, feed, fuel and stored produce — with every receipt and issue to the field."
        actions={
          scope.farms.length > 0 && (
            <>
              {list.length > 0 && (
                <ActionDialog
                  title="Record a stock movement"
                  trigger="Stock movement"
                  icon="swap_horiz"
                  tone="secondary"
                  action={recordStockMovement}
                  hidden={hidden}
                  fields={[
                    { name: "inventory_id", label: "Item", type: "select", required: true, options: list.map((i) => ({ value: i.id, label: `${i.item_name} (${num(i.quantity, 1)} ${i.unit})` })), wide: true },
                    { name: "transaction_type", label: "Movement", type: "select", required: true, options: opt(["purchase", "receipt", "issue_to_field", "consumption", "adjustment", "return", "loss", "damage", "sale"]) },
                    { name: "quantity", label: "Quantity", type: "number", required: true },
                    { name: "unit_cost", label: "Unit cost (₦)", type: "number", hint: "For purchases" },
                    { name: "crop_cycle_id", label: "Crop cycle", type: "select", options: cycleOptions(scope) },
                    { name: "notes", label: "Notes", type: "textarea" },
                  ]}
                />
              )}
              <ActionDialog
                title="Add a stock item"
                trigger="Add item"
                action={createInventoryItem}
                hidden={hidden}
                fields={[
                  { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                  { name: "item_name", label: "Item", required: true },
                  { name: "category", label: "Category", type: "select", required: true, options: opt(["seed", "fertiliser", "chemical", "feed", "tool_equipment", "harvest_produce", "fuel", "other"]) },
                  { name: "unit", label: "Unit", type: "select", required: true, options: opt(["kg", "liters", "bags", "units", "tons", "crates", "bundles"]) },
                  { name: "quantity", label: "Opening quantity", type: "number" },
                  { name: "reorder_threshold", label: "Reorder at", type: "number" },
                  { name: "unit_cost", label: "Unit cost (₦)", type: "number" },
                  { name: "expiry_date", label: "Expiry", type: "date" },
                  { name: "sku", label: "SKU" },
                  { name: "storage_location", label: "Stored at" },
                ]}
              />
            </>
          )
        }
      />
      {!scope.farms.length && <StartHere title="Register a farm to track stock" />}
      <KpiGrid>
        <MetricCard label="Stock value" value={naira(value)} icon="account_balance_wallet" foot="Quantity × unit cost" />
        <MetricCard label="Below reorder level" value={low.length} icon="production_quantity_limits" iconTone={low.length ? "bg-caution-soft text-[#b45309]" : undefined} foot={low.slice(0, 2).map((i) => i.item_name).join(", ") || "All stocked"} />
        <MetricCard label="Expiring in 30 days" value={expiring.length} icon="event_busy" foot={expiring.slice(0, 2).map((i) => i.item_name).join(", ") || "Nothing expiring"} />
        <MetricCard label="Movements" value={(moves ?? []).length} icon="swap_horiz" foot="Latest receipts and issues" />
      </KpiGrid>
      <Section title="Stock register" icon="inventory_2">
        <DataTable
          rows={list}
          rowKey={(i) => i.id}
          empty="No stock items yet."
          columns={[
            { label: "Item", cell: (i) => <span className="font-medium">{i.item_name}</span> },
            { label: "Category", cell: (i) => label(i.category) },
            { label: "Farm", cell: (i) => farmName.get(i.farm_id) },
            {
              label: "On hand",
              numeric: true,
              cell: (i) => (
                <span className="inline-flex items-center gap-2">
                  {num(i.quantity, 1)} {i.unit}
                  {Number(i.reorder_threshold) > 0 && Number(i.quantity) <= Number(i.reorder_threshold) && <Pill tone="caution">reorder</Pill>}
                </span>
              ),
            },
            { label: "Unit cost", numeric: true, cell: (i) => naira(i.unit_cost_kobo) },
            { label: "Value", numeric: true, cell: (i) => naira(Number(i.quantity) * Number(i.unit_cost_kobo)) },
            { label: "Expiry", cell: (i) => (i.expiry_date ? relDays(i.expiry_date) : "—") },
            { label: "Location", cell: (i) => i.storage_location ?? "—" },
          ]}
        />
      </Section>
      <Split
        wide={
          <Section title="Recent movements" icon="history">
            <DataTable
              rows={moves ?? []}
              rowKey={(m) => m.id}
              columns={[
                { label: "When", cell: (m) => ago(m.created_at) },
                { label: "Item", cell: (m) => name.get(m.inventory_id) },
                { label: "Movement", cell: (m) => label(m.transaction_type) },
                { label: "Qty", numeric: true, cell: (m) => `${["purchase", "receipt", "return"].includes(m.transaction_type) ? "+" : "−"}${num(m.quantity, 1)} ${unit.get(m.inventory_id) ?? ""}` },
                { label: "Notes", cell: (m) => m.notes ?? "—" },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Value by category" icon="pie_chart">
            <Bars items={byCat} format={(n) => naira(n)} />
          </Section>
        }
      />
    </Stack>
  );
}
