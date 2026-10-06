import type { Metadata } from "next";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Card } from "@/components/ui";
import { phoneLabel, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Disputes Console" };

export default async function AdminDisputesListPage() {
  const staff = await requireStaff();
  if (!staff) return null;

  const supabase = await createClient();
  const { data: disputes } = await supabase
    .from("bookings")
    .select(
      "id, listing_title, farm_name, job_state, job_lga, job_date, total_kobo, dispute_category, dispute_reason, disputed_at, disputed_by, farmer_id, provider_id, profiles!bookings_farmer_id_fkey(full_name, phone)",
    )
    .eq("status", "disputed")
    .order("disputed_at", { ascending: false });

  const list = (disputes ?? []) as unknown as Array<{
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
  }>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-danger">Disputes Arbitration Console</h1>
          <p className="mt-1 text-sm text-muted">
            Evidence-before-opinion workstation for arbitrating contested field bookings.
          </p>
        </div>
        <Badge className="bg-red-100 font-bold text-danger">
          {list.length} Awaiting Arbitration
        </Badge>
      </div>

      {list.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-leaf-100 text-2xl text-leaf-800">
            ✓
          </span>
          <div>
            <h2 className="text-xl font-bold text-leaf-900">No Open Disputes</h2>
            <p className="text-sm text-muted">All active bookings are proceeding normally or confirmed.</p>
          </div>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((d) => (
            <li key={d.id}>
              <Card className="flex flex-col gap-4 border-2 border-red-200 bg-red-50/20 p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-danger uppercase tracking-wider">
                      DISPUTE #CN-{d.id.slice(0, 8).toUpperCase()}
                    </span>
                    <h2 className="text-xl font-extrabold text-leaf-900 mt-0.5">
                      {d.listing_title} · {d.farm_name}
                    </h2>
                    <p className="text-sm text-muted">
                      Location: {[d.job_lga, d.job_state].filter(Boolean).join(", ")} · Job Date: {d.job_date}
                    </p>
                  </div>
                  <Badge className="bg-red-100 text-danger font-bold text-xs">
                    Category: {d.dispute_category?.replaceAll("_", " ") ?? "General Problem"}
                  </Badge>
                </div>

                <div className="rounded-lg bg-white p-4 border border-line">
                  <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Claim Statement
                  </span>
                  <p className="mt-1 text-sm font-medium italic text-ink">
                    &quot;{d.dispute_reason || "No written statement provided."}&quot;
                  </p>
                  <span className="mt-2 block text-xs text-muted">
                    Filed {when(d.disputed_at ?? "")} by {d.disputed_by === d.farmer_id ? "Farmer" : "Provider"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="font-mono font-bold text-leaf-900">
                    Contested Amount: {formatNaira(d.total_kobo)}
                  </span>
                  <Link
                    href={`/admin/disputes/${d.id}`}
                    className="inline-flex items-center rounded-md bg-leaf-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-leaf-800"
                  >
                    Open Evidence Workstation →
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
