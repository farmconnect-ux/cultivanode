import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createLivestockGroup, logFeeding, logHealthEvent, logProduction } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, LineChart, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { farmOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num, relDays, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Livestock & aquaculture" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/livestock">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const since = new Date(nowMs() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: groups }, { data: health }, { data: feed }, { data: prod }, { data: animals }] = await Promise.all([
    supabase.from("farm_livestock_groups").select("*").in("farm_id", ids).order("created_at"),
    supabase.from("farm_livestock_health_events").select("*").in("farm_id", ids).order("administered_on", { ascending: false }).limit(30),
    supabase.from("farm_livestock_feedings").select("group_id, quantity_kg, cost_kobo, feeding_date").in("farm_id", ids).gte("feeding_date", since),
    supabase.from("farm_livestock_production_logs").select("*").in("farm_id", ids).gte("log_date", since).order("log_date"),
    supabase.from("farm_livestock_animals").select("id, tag_number, species, breed, sex, current_weight_kg, health_status, group_id").in("farm_id", ids).order("tag_number"),
  ]);
  const g = groups ?? [];
  const gName = new Map(g.map((x) => [x.id, x.group_name]));
  const head = g.reduce((s, x) => s + x.population, 0);
  const feedCost = (feed ?? []).reduce((s, f) => s + Number(f.cost_kobo), 0);
  const revenue = (prod ?? []).reduce((s, p) => s + Number(p.revenue_kobo), 0);
  const withdrawals = (health ?? []).filter((h) => h.withdrawal_end_date && h.withdrawal_end_date >= new Date().toISOString().slice(0, 10));
  const eggDays = new Map<string, number>();
  for (const p of prod ?? []) if (p.product_type === "eggs") eggDays.set(p.log_date ?? "", (eggDays.get(p.log_date ?? "") ?? 0) + Number(p.quantity));
  const eggSeries = [...eggDays.entries()].sort().map(([d, v]) => ({ x: d.slice(5), y: v }));
  const groupOpts = g.map((x) => ({ value: x.id, label: x.group_name }));
  const hidden = { lang };

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="pets">{g.length} groups</Chip>
            {withdrawals.length > 0 && <Chip icon="medication">{withdrawals.length} in drug withdrawal</Chip>}
          </>
        }
        title="Livestock & Aquaculture"
        description="Flocks, herds and ponds — head count, health events, feed and what they produce."
        actions={
          scope.farms.length > 0 && (
            <>
              {g.length > 0 && (
                <>
                  <ActionDialog
                    title="Log feeding"
                    trigger="Feeding"
                    icon="restaurant"
                    tone="secondary"
                    action={logFeeding}
                    hidden={hidden}
                    fields={[
                      { name: "group_id", label: "Group", type: "select", required: true, options: groupOpts },
                      { name: "feed_type", label: "Feed", required: true, placeholder: "Broiler finisher" },
                      { name: "quantity_kg", label: "Quantity (kg)", type: "number", required: true },
                      { name: "cost", label: "Cost (₦)", type: "number" },
                      { name: "feeding_date", label: "Date", type: "date" },
                    ]}
                  />
                  <ActionDialog
                    title="Health event"
                    trigger="Health"
                    icon="vaccines"
                    tone="secondary"
                    action={logHealthEvent}
                    hidden={hidden}
                    fields={[
                      { name: "group_id", label: "Group", type: "select", required: true, options: groupOpts },
                      { name: "event_type", label: "Event", type: "select", required: true, options: opt(["vaccination", "treatment", "disease_diagnosis", "vet_visit", "routine_check", "mortality"]) },
                      { name: "disease_or_condition", label: "Condition" },
                      { name: "medication_name", label: "Medication" },
                      { name: "dosage", label: "Dosage" },
                      { name: "head_affected", label: "Head affected", type: "number" },
                      { name: "withdrawal_period_days", label: "Withdrawal (days)", type: "number" },
                      { name: "cost", label: "Cost (₦)", type: "number" },
                      { name: "vet_name", label: "Vet" },
                      { name: "administered_on", label: "Date", type: "date" },
                    ]}
                  />
                  <ActionDialog
                    title="Log production"
                    trigger="Production"
                    icon="egg"
                    tone="secondary"
                    action={logProduction}
                    hidden={hidden}
                    fields={[
                      { name: "group_id", label: "Group", type: "select", required: true, options: groupOpts },
                      { name: "product_type", label: "Product", type: "select", required: true, options: opt(["eggs", "milk", "meat", "fish", "honey", "manure", "other"]) },
                      { name: "quantity", label: "Quantity", type: "number", required: true },
                      { name: "unit", label: "Unit", placeholder: "crates, litres, kg" },
                      { name: "destination", label: "Destination", type: "select", defaultValue: "inventory", options: opt(["inventory", "marketplace", "home_consumption", "spoilage"]) },
                      { name: "revenue", label: "Revenue (₦)", type: "number" },
                      { name: "log_date", label: "Date", type: "date" },
                    ]}
                  />
                </>
              )}
              <ActionDialog
                title="Add a livestock group"
                trigger="New group"
                action={createLivestockGroup}
                hidden={hidden}
                fields={[
                  { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                  { name: "group_name", label: "Name", required: true, placeholder: "Broiler batch B-15" },
                  { name: "animal_type", label: "Type", type: "select", required: true, options: opt(["cattle", "goats", "sheep", "poultry", "pigs", "fish", "rabbits", "snails", "other"]) },
                  { name: "purpose", label: "Purpose", type: "select", defaultValue: "meat", options: opt(["meat", "dairy", "eggs", "breeding", "multi"]) },
                  { name: "breed", label: "Breed" },
                  { name: "population", label: "Head count", type: "number", required: true },
                  { name: "age_weeks", label: "Age (weeks)", type: "number" },
                  { name: "housing_location", label: "Housing" },
                ]}
              />
            </>
          )
        }
      />
      {!scope.farms.length && <StartHere title="Register a farm to add livestock" />}
      <KpiGrid>
        <MetricCard label="Total head" value={num(head)} icon="pets" foot={`${g.length} groups`} />
        <MetricCard label="Feed cost, 30 days" value={naira(feedCost)} icon="restaurant" foot={`${num((feed ?? []).reduce((s, f) => s + Number(f.quantity_kg), 0))} kg fed`} />
        <MetricCard label="Production revenue, 30 days" value={naira(revenue)} icon="tag" foot="Eggs, fish, milk and meat sold" />
        <MetricCard label="Health watch" value={g.filter((x) => x.health_status !== "healthy").length} icon="health_and_safety" foot="Groups not marked healthy" />
      </KpiGrid>
      <Split
        wide={
          <>
            <Section title="Groups" icon="groups">
              <DataTable
                rows={g}
                rowKey={(x) => x.id}
                empty="No livestock groups yet."
                columns={[
                  { label: "Group", cell: (x) => <span className="font-medium">{x.group_name}</span> },
                  { label: "Type", cell: (x) => `${label(x.animal_type)}${x.breed ? ` · ${x.breed}` : ""}` },
                  { label: "Purpose", cell: (x) => label(x.purpose) },
                  { label: "Head", numeric: true, cell: (x) => num(x.population) },
                  { label: "Age", numeric: true, cell: (x) => (x.age_weeks != null ? `${x.age_weeks} wk` : "—") },
                  { label: "Housing", cell: (x) => x.housing_location ?? "—" },
                  { label: "Health", cell: (x) => <Status value={x.health_status} /> },
                ]}
              />
            </Section>
            <Section title="Health & treatment log" icon="vaccines">
              <DataTable
                rows={health ?? []}
                rowKey={(h) => h.id}
                empty="No health events yet."
                columns={[
                  { label: "Date", cell: (h) => (h.administered_on ? formatDay(h.administered_on, lang) : "—") },
                  { label: "Group", cell: (h) => (h.group_id ? gName.get(h.group_id) : "—") },
                  { label: "Event", cell: (h) => label(h.event_type) },
                  { label: "Condition / drug", cell: (h) => [h.disease_or_condition, h.medication_name].filter(Boolean).join(" · ") || "—" },
                  { label: "Head", numeric: true, cell: (h) => h.head_affected ?? "—" },
                  { label: "Withdrawal ends", cell: (h) => (h.withdrawal_end_date ? relDays(h.withdrawal_end_date) : "—") },
                  { label: "Cost", numeric: true, cell: (h) => naira(h.cost_kobo) },
                ]}
              />
            </Section>
          </>
        }
        side={
          <>
            <Section title="Egg output, crates/day" icon="egg">
              <LineChart points={eggSeries} />
            </Section>
            <Section title="Tagged animals" icon="tag">
              <ul className="flex flex-col divide-y divide-outline-variant/30">
                {(animals ?? []).map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 text-body-sm">
                    <span>
                      <span className="font-medium text-on-surface">{a.tag_number}</span> <span className="text-on-surface-variant">· {label(a.sex)} · {a.current_weight_kg ?? "—"} kg</span>
                    </span>
                    <Status value={a.health_status} />
                  </li>
                ))}
                {!animals?.length && <li className="py-4 text-center text-body-sm text-on-surface-variant">No individually tagged animals.</li>}
              </ul>
            </Section>
          </>
        }
      />
    </Stack>
  );
}
