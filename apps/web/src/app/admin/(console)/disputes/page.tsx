import type { Metadata } from "next";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { MetricCard } from "@/components/live/metric-card";
import { DisputeResolution } from "@/components/screens/dispute-resolution";
import { Badge } from "@/components/shadcn/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { when } from "@/lib/admin/labels";
import { requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dispute resolution & PoW" };

type Dispute = {
  id: string;
  listing_title: string;
  farm_name: string;
  job_state: string | null;
  job_lga: string | null;
  job_date: string;
  total_kobo: number;
  dispute_category: string | null;
  dispute_reason: string | null;
  disputed_at: string | null;
  disputed_by: string | null;
  dispute_outcome: "uphold_provider" | "uphold_farmer" | "settlement" | null;
  dispute_decision: string | null;
  settlement_kobo: number | null;
  dispute_decided_at: string | null;
  status: string;
  farmer_id: string;
  provider_id: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

type MarketplaceDisputeRow = {
  id: string;
  order_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  decision: string | null;
  refund_amount_kobo: number | null;
  resolved_at: string | null;
  marketplace_orders: { order_number: string; total_amount_kobo: number; payment_mode: string } | null;
  marketplace_sellers: { business_name: string } | null;
  profiles: { full_name: string | null } | null;
};

const OUTCOME_LABEL: Record<NonNullable<Dispute["dispute_outcome"]>, string> = {
  uphold_provider: "Upheld Provider",
  uphold_farmer: "Upheld Farmer",
  settlement: "Mutual Settlement",
};

export default async function AdminDisputesListPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  const supabase = await createClient();

  const mktQuery = (
    supabase.from("marketplace_disputes") as unknown as {
      select: (q: string) => {
        order: (c: string, o: { ascending: boolean }) => Promise<{
          data: MarketplaceDisputeRow[] | null;
        }>;
      };
    }
  );

  const [{ data: openData }, { data: resolvedData }, { data: mktData }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, listing_title, farm_name, job_state, job_lga, job_date, total_kobo, dispute_category, dispute_reason, disputed_at, disputed_by, dispute_outcome, dispute_decision, settlement_kobo, dispute_decided_at, status, farmer_id, provider_id, profiles!bookings_farmer_id_fkey(full_name, phone)",
      )
      .eq("status", "disputed")
      .order("disputed_at", { ascending: false }),
    supabase
      .from("bookings")
      .select(
        "id, listing_title, farm_name, job_state, job_lga, job_date, total_kobo, dispute_category, dispute_reason, disputed_at, disputed_by, dispute_outcome, dispute_decision, settlement_kobo, dispute_decided_at, status, farmer_id, provider_id, profiles!bookings_farmer_id_fkey(full_name, phone)",
      )
      .not("dispute_outcome", "is", null)
      .neq("status", "disputed")
      .order("dispute_decided_at", { ascending: false })
      .limit(20),
    mktQuery
      .select(
        "id, order_id, reason, description, status, created_at, decision, refund_amount_kobo, resolved_at, marketplace_orders(order_number, total_amount_kobo, payment_mode), marketplace_sellers(business_name), profiles!marketplace_disputes_initiator_id_fkey(full_name)"
      )
      .order("created_at", { ascending: false }),
  ]);

  const list = (openData ?? []) as unknown as Dispute[];
  const resolvedList = (resolvedData ?? []) as unknown as Dispute[];
  const mktList = (mktData ?? []) as MarketplaceDisputeRow[];
  const openMktList = mktList.filter((m) => m.status !== "resolved" && m.status !== "closed");

  const frozen = list.reduce((s, d) => s + d.total_kobo, 0);
  const mktFrozen = openMktList.reduce((s, d) => s + (d.marketplace_orders?.total_amount_kobo ?? 0), 0);

  // eslint-disable-next-line react-hooks/purity -- Server Component: timestamp for age calculation
  const now = Date.now();
  const agesH = list.map((d) => (d.disputed_at ? (now - new Date(d.disputed_at).getTime()) / 36e5 : 0));
  const oldestH = agesH.length ? Math.max(...agesH) : 0;
  const overSlaCount = agesH.filter((h) => h > 48).length;
  const byFarmer = list.filter((d) => d.disputed_by === d.farmer_id).length;

  return (
    <DisputeResolution
      lang="en"
      slots={{
        kpis: (
          <div className="mb-space-xl flex flex-col gap-space-md">
            {overSlaCount > 0 && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-l-4 border-error bg-error-container/30 px-4 py-3 text-sm font-semibold text-on-surface"
              >
                <span>
                  SLA alert: {overSlaCount} open {overSlaCount === 1 ? "dispute has" : "disputes have"} exceeded the 48-hour arbitration target (oldest: {Math.round(oldestH)}h).
                </span>
                <Badge tone="critical">{overSlaCount} &gt; 48h SLA</Badge>
              </div>
            )}
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Open disputes"
                value={list.length + openMktList.length}
                icon="gavel"
                iconTone="bg-error-container/60 text-error"
                foot={`${list.length} Bookings · ${openMktList.length} Marketplace Orders`}
              />
              <MetricCard
                label="Contested value"
                value={formatNaira(frozen + mktFrozen).replace(/\.00$/, "")}
                icon="lock_clock"
                iconTone="bg-tertiary-fixed/50 text-tertiary-container"
                foot="Sum of disputed bookings & orders"
              />
              <MetricCard
                label="Oldest open"
                value={list.length ? Math.round(oldestH) : "—"}
                unit={list.length ? "hours" : undefined}
                icon="speed"
                foot="Target SLA: ≤ 48 hours"
              />
              <MetricCard
                label="Raised by farmers"
                value={list.length ? `${byFarmer}/${list.length}` : "—"}
                icon="agriculture"
                iconTone="bg-surface-container-high text-primary"
                foot="The rest were raised by providers"
              />
            </div>
          </div>
        ),
        queue: (
          <div className="space-y-8">
            {/* 1. Machinery & Labor Booking Disputes */}
            <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Machinery &amp; Labor Arbitration Queue</h2>
                  <p className="text-body-sm text-on-surface-variant">Evidence before opinion — open a case to review proof photos, GPS and both statements.</p>
                </div>
                <Badge tone={list.length ? "critical" : "positive"} dot>{list.length} bookings awaiting arbitration</Badge>
              </div>
              {list.length === 0 ? (
                <div className="p-space-md">
                  <EmptyState icon="task_alt" title="No open booking disputes" description="All active tractor and farm-hand jobs are proceeding normally." />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5">Case</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Parties</TableHead>
                      <TableHead className="text-right">Contested</TableHead>
                      <TableHead>Claim</TableHead>
                      <TableHead className="pr-5 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((d) => {
                      const ageH = d.disputed_at ? (now - new Date(d.disputed_at).getTime()) / 36e5 : 0;
                      const overSla = ageH > 48;
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-label-sm font-bold text-error">#CN-{d.id.slice(0, 8).toUpperCase()}</p>
                              {overSla && <Badge tone="critical">&gt; 48h SLA</Badge>}
                            </div>
                            <p className="font-semibold">{d.listing_title}</p>
                            <p className="text-label-sm font-normal text-on-surface-variant">{d.farm_name} · {[d.job_lga, d.job_state].filter(Boolean).join(", ")}</p>
                          </TableCell>
                          <TableCell><Badge tone="critical">{d.dispute_category?.replaceAll("_", " ") ?? "general"}</Badge></TableCell>
                          <TableCell>
                            <p>{d.profiles?.full_name ?? "Farmer"}</p>
                            <p className="text-label-sm font-normal text-on-surface-variant">Filed by {d.disputed_by === d.farmer_id ? "farmer" : "provider"} · {when(d.disputed_at)}</p>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatNaira(d.total_kobo)}</TableCell>
                          <TableCell className="max-w-xs"><p className="line-clamp-2 italic text-on-surface-variant">“{d.dispute_reason || "No written statement"}”</p></TableCell>
                          <TableCell className="pr-5 text-right">
                            <Link href={`/admin/disputes/${d.id}`} className="inline-flex items-center gap-1 rounded-lg bg-primary-container px-3 py-1.5 font-label-sm text-label-sm text-white hover:bg-primary">
                              Open evidence <Icon name="arrow_forward" className="text-sm" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* 2. Marketplace Order Disputes */}
            <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm border border-line">
              <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Marketplace Order Disputes</h2>
                  <p className="text-body-sm text-on-surface-variant">Agrochemicals, seeds, and equipment orders with delivery or payment disputes.</p>
                </div>
                <Badge tone={openMktList.length ? "critical" : "positive"} dot>{openMktList.length} orders awaiting resolution</Badge>
              </div>
              {openMktList.length === 0 ? (
                <div className="p-space-md">
                  <EmptyState icon="shopping_bag" title="No open marketplace disputes" description="All physical marketplace deliveries are in good standing." />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5">Order / Case</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Seller / Merchant</TableHead>
                      <TableHead>Mode / Value</TableHead>
                      <TableHead>Claim Summary</TableHead>
                      <TableHead className="pr-5 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openMktList.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="pl-5">
                          <p className="font-mono text-label-sm font-bold text-error">#{m.marketplace_orders?.order_number ?? m.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted">Initiator: {m.profiles?.full_name ?? "User"} · {when(m.created_at)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge tone="critical">{m.reason.replaceAll("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">{m.marketplace_sellers?.business_name ?? "Seller"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">{formatNaira(m.marketplace_orders?.total_amount_kobo ?? 0)}</p>
                          <span className="text-[11px] capitalize text-muted">
                            {m.marketplace_orders?.payment_mode ?? "direct"} mode
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="line-clamp-2 italic text-on-surface-variant">“{m.description}”</p>
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <Link
                            href={`/admin/disputes/marketplace/${m.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-leaf-800 px-3 py-1.5 font-label-sm text-label-sm text-white hover:bg-leaf-900 transition"
                          >
                            Arbitrate <Icon name="arrow_forward" className="text-sm" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        ),
        dossier: null,
        trail: (
          <div className="space-y-6">
            {resolvedList.length > 0 && (
              <div className="mb-space-xl overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Recently resolved booking disputes</h2>
                    <p className="text-body-sm text-on-surface-variant">Completed booking arbitration decisions.</p>
                  </div>
                  <Badge tone="positive">{resolvedList.length} decided</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5">Case</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead className="text-right">Agreed / Settlement</TableHead>
                      <TableHead>Decision Summary</TableHead>
                      <TableHead>Decided</TableHead>
                      <TableHead className="pr-5 text-right">Dossier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resolvedList.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="pl-5">
                          <p className="font-mono text-label-sm font-bold text-on-surface">#CN-{d.id.slice(0, 8).toUpperCase()}</p>
                          <p className="font-semibold">{d.listing_title}</p>
                          <p className="text-label-sm font-normal text-on-surface-variant">{d.farm_name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge tone={d.dispute_outcome === "uphold_farmer" ? "caution" : "positive"}>
                            {d.dispute_outcome ? OUTCOME_LABEL[d.dispute_outcome] : d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {d.dispute_outcome === "settlement" && d.settlement_kobo !== null
                            ? `${formatNaira(d.settlement_kobo)} (of ${formatNaira(d.total_kobo)})`
                            : formatNaira(d.total_kobo)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="line-clamp-2 text-on-surface-variant">{d.dispute_decision || "—"}</p>
                        </TableCell>
                        <TableCell className="text-label-sm text-on-surface-variant">{when(d.dispute_decided_at)}</TableCell>
                        <TableCell className="pr-5 text-right">
                          <Link href={`/admin/disputes/${d.id}`} className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm text-on-surface hover:bg-surface-container">
                            Inspect <Icon name="arrow_forward" className="text-sm" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ),
      }}
    />
  );
}
