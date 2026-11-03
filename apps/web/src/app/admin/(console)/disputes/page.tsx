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

const OUTCOME_LABEL: Record<NonNullable<Dispute["dispute_outcome"]>, string> = {
  uphold_provider: "Upheld Provider",
  uphold_farmer: "Upheld Farmer",
  settlement: "Mutual Settlement",
};

export default async function AdminDisputesListPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  const supabase = await createClient();

  const [{ data: openData }, { data: resolvedData }] = await Promise.all([
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
  ]);

  const list = (openData ?? []) as unknown as Dispute[];
  const resolvedList = (resolvedData ?? []) as unknown as Dispute[];
  const frozen = list.reduce((s, d) => s + d.total_kobo, 0);
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
              <MetricCard label="Open disputes" value={list.length} icon="gavel" iconTone="bg-error-container/60 text-error" foot={overSlaCount > 0 ? `${overSlaCount} over 48h SLA` : "Awaiting arbitration"} />
              <MetricCard label="Contested value" value={formatNaira(frozen).replace(/\.00$/, "")} icon="lock_clock" iconTone="bg-tertiary-fixed/50 text-tertiary-container" foot="Sum of disputed bookings" />
              <MetricCard label="Oldest open" value={list.length ? Math.round(oldestH) : "—"} unit={list.length ? "hours" : undefined} icon="speed" foot="Target SLA: ≤ 48 hours" />
              <MetricCard label="Raised by farmers" value={list.length ? `${byFarmer}/${list.length}` : "—"} icon="agriculture" iconTone="bg-surface-container-high text-primary" foot="The rest were raised by providers" />
            </div>
          </div>
        ),
        queue: (
          <div className="mb-space-xl overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Arbitration queue</h2>
                <p className="text-body-sm text-on-surface-variant">Evidence before opinion — open a case to review proof photos, GPS and both statements.</p>
              </div>
              <Badge tone={list.length ? "critical" : "positive"} dot>{list.length} awaiting arbitration</Badge>
            </div>
            {list.length === 0 ? (
              <div className="p-space-md">
                <EmptyState icon="task_alt" title="No open disputes" description="All active bookings are proceeding normally or have been confirmed." />
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
        ),
        dossier: null,
        trail: resolvedList.length > 0 ? (
          <div className="mb-space-xl overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Recently resolved disputes</h2>
                <p className="text-body-sm text-on-surface-variant">Completed arbitration decisions. Open any case to inspect the audit trail or reopen if new evidence arrives.</p>
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
        ) : null,
      }}
    />
  );
}
