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
  farmer_id: string;
  provider_id: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export default async function AdminDisputesListPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, listing_title, farm_name, job_state, job_lga, job_date, total_kobo, dispute_category, dispute_reason, disputed_at, disputed_by, farmer_id, provider_id, profiles!bookings_farmer_id_fkey(full_name, phone)",
    )
    .eq("status", "disputed")
    .order("disputed_at", { ascending: false });
  const list = (data ?? []) as unknown as Dispute[];
  const frozen = list.reduce((s, d) => s + d.total_kobo, 0);
  // eslint-disable-next-line react-hooks/purity -- Server Component: timestamp for age calculation
  const now = Date.now();
  const oldestH = list.length
    ? Math.max(...list.map((d) => (d.disputed_at ? (now - new Date(d.disputed_at).getTime()) / 36e5 : 0)))
    : 0;
  const byFarmer = list.filter((d) => d.disputed_by === d.farmer_id).length;

  return (
    <DisputeResolution
      lang="en"
      slots={{
        kpis: (
          <div className="mb-space-xl grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Open disputes" value={list.length} icon="gavel" iconTone="bg-error-container/60 text-error" foot="Awaiting arbitration" />
            <MetricCard label="Contested value" value={formatNaira(frozen).replace(/\.00$/, "")} icon="lock_clock" iconTone="bg-tertiary-fixed/50 text-tertiary-container" foot="Sum of disputed bookings" />
            <MetricCard label="Oldest open" value={list.length ? Math.round(oldestH) : "—"} unit={list.length ? "hours" : undefined} icon="speed" foot="Since the dispute was filed" />
            <MetricCard label="Raised by farmers" value={list.length ? `${byFarmer}/${list.length}` : "—"} icon="agriculture" iconTone="bg-surface-container-high text-primary" foot="The rest were raised by providers" />
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
                  {list.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="pl-5">
                        <p className="font-mono text-label-sm font-bold text-error">#CN-{d.id.slice(0, 8).toUpperCase()}</p>
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
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ),
        dossier: null,
        trail: null,
      }}
    />
  );
}
