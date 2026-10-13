import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAggregation, recordAggregationVolume } from "@/actions/ecosystem";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Meter, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { label, mass, naira, share } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Cooperative management" };

export default async function Page({ params, searchParams }: PageProps<"/[lang]/account/cooperative">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  const sp = await searchParams;
  const { data: orgs } = account.orgIds.length ? await supabase.from("organizations").select("id, name, cac_number, owner_id").in("id", account.orgIds) : { data: [] };
  const org = (orgs ?? []).find((o) => o.id === sp.org) ?? (orgs ?? [])[0];
  const [{ data: members }, { data: aggs }, { data: farms }] = org
    ? await Promise.all([
        supabase.rpc("org_member_directory", { p_org: org.id }),
        supabase.from("cooperative_aggregations").select("*").eq("organization_id", org.id).order("closes_on"),
        supabase.from("farms").select("id, area_ha").eq("organization_id", org.id),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const a = aggs ?? [];
  const live = a.filter((x) => x.status !== "sold" && x.status !== "closed");
  const target = live.reduce((s, x) => s + Number(x.target_kg), 0);
  const pledged = live.reduce((s, x) => s + Number(x.pledged_kg ?? 0), 0);
  const sold = a.filter((x) => x.status === "sold").reduce((s, x) => s + Number(x.delivered_kg ?? 0) * Number(x.price_per_kg_kobo ?? 0), 0);
  const isManager = org && (org.owner_id === account.userId || (members ?? []).some((m) => m.profile_id === account.userId && (m.member_role === "owner" || m.member_role === "farm_manager")));

  return (
    <Stack>
      <PageHeader
        eyebrow={
          org ? (
            <>
              <Chip icon="groups">{org.name}</Chip>
              {org.cac_number && <Chip icon="verified">{org.cac_number}</Chip>}
              {(orgs ?? []).length > 1 && (orgs ?? []).map((o) => <a key={o.id} href={`?org=${o.id}`} className="rounded-full bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-high">{o.name}</a>)}
            </>
          ) : undefined
        }
        title="Cooperative Management"
        description="Members, bulking drives and collective sales — pledged and delivered volumes against each buyer's target."
        actions={
          org && isManager ? (
            <ActionDialog
              title="Open an aggregation drive"
              trigger="New drive"
              icon="inventory"
              action={createAggregation}
              hidden={{ lang, organization_id: org.id }}
              fields={[
                { name: "commodity", label: "Commodity", required: true },
                { name: "target_kg", label: "Target (kg)", type: "number", required: true },
                { name: "price_per_kg", label: "Price (₦/kg)", type: "number" },
                { name: "buyer_name", label: "Buyer" },
                { name: "collection_point", label: "Collection point" },
                { name: "closes_on", label: "Closes", type: "date" },
              ]}
            />
          ) : undefined
        }
      />
      {!org && <StartHere icon="groups" title="You're not in a cooperative yet" action={<Link className="font-label-md text-primary-container" href={`/${lang}/account/business`}>Set up an organisation →</Link>}>Create or join a cooperative to bulk produce and sell together.</StartHere>}
      {org && (
        <>
          <KpiGrid>
            <MetricCard label="Members" value={(members ?? []).length} icon="groups" foot={`${(farms ?? []).length} cooperative farms`} />
            <MetricCard label="Live drives" value={live.length} icon="inventory" foot={`Target ${mass(target)}`} />
            <MetricCard label="Pledged" value={`${Math.round(share(pledged, target))}%`} icon="volunteer_activism" foot={`${mass(pledged)} of ${mass(target)}`} />
            <MetricCard label="Collective sales" value={naira(sold)} icon="payments" foot="Closed and sold drives" />
          </KpiGrid>
          <Split
            wide={
              <Section title="Aggregation drives" icon="inventory">
                <DataTable
                  rows={a}
                  rowKey={(x) => x.id}
                  empty="No drives yet."
                  columns={[
                    { label: "Commodity", cell: (x) => <span className="font-medium">{x.commodity}</span> },
                    { label: "Buyer", cell: (x) => x.buyer_name ?? "Open" },
                    {
                      label: "Progress",
                      cell: (x) => (
                        <div className="w-40">
                          <Meter value={share(Number(x.delivered_kg ?? 0), Number(x.target_kg))} />
                          <span className="text-body-sm text-on-surface-variant">
                            {mass(x.delivered_kg)} delivered · {mass(x.pledged_kg)} pledged / {mass(x.target_kg)}
                          </span>
                        </div>
                      ),
                    },
                    { label: "Price", numeric: true, cell: (x) => (x.price_per_kg_kobo ? `${naira(x.price_per_kg_kobo)}/kg` : "—") },
                    { label: "Closes", cell: (x) => (x.closes_on ? formatDay(x.closes_on, lang) : "—") },
                    { label: "Status", cell: (x) => <Status value={x.status} /> },
                    {
                      label: "",
                      cell: (x) =>
                        isManager && x.status !== "sold" && x.status !== "closed" ? (
                          <ActionDialog
                            title={`Add volumes — ${x.commodity}`}
                            trigger="Volumes"
                            tone="ghost"
                            action={recordAggregationVolume}
                            hidden={{ lang, id: x.id }}
                            fields={[
                              { name: "pledged_kg", label: "New pledges (kg)", type: "number" },
                              { name: "delivered_kg", label: "New deliveries (kg)", type: "number" },
                            ]}
                          />
                        ) : null,
                    },
                  ]}
                />
              </Section>
            }
            side={
              <Section title="Members" icon="badge">
                <ul className="flex flex-col divide-y divide-outline-variant/30">
                  {(members ?? []).map((m) => (
                    <li key={m.profile_id} className="flex items-center justify-between gap-2 py-2 text-body-sm">
                      <span>
                        <span className="font-medium text-on-surface">{m.full_name}</span>
                        <span className="text-on-surface-variant"> · {[m.lga, m.state].filter(Boolean).join(", ")}</span>
                      </span>
                      <span className="text-on-surface-variant">{label(m.member_role)}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            }
          />
        </>
      )}
    </Stack>
  );
}
