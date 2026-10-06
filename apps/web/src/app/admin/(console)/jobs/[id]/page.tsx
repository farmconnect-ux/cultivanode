import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { adminCancelJob } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Badge, Card, Field, Input } from "@/components/ui";
import { phoneLabel, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Job Details" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminJobDetailPage({
  params,
}: PageProps<"/admin/jobs/[id]">) {
  const staff = await requireStaff();
  if (!staff) return null;

  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: jobRes, error } = await supabase.rpc("booking_detail", { p_booking: id });
  if (error || !jobRes) notFound();

  const x = jobRes as unknown as {
    id: string;
    title: string;
    kind: string;
    status: string;
    job_date: string;
    unit: string;
    quantity: number;
    rate_kobo: number;
    total_kobo: number;
    distance_km: number;
    farm_name: string;
    job_state: string;
    job_lga: string;
    checked_in_at: string | null;
    check_in_distance_m: number | null;
    work_submitted_at: string | null;
    hectares_done: number | null;
    disputed_at: string | null;
    dispute_category: string | null;
    dispute_reason: string | null;
    disputed_by: string | null;
    farmer_note: string | null;
    closed_reason: string | null;
    created_at: string;
    other: { name: string; phone: string | null; tier: number } | null;
    location: { lat: number; lng: number; hint: string | null } | null;
    proofs: Array<{
      id: string;
      kind: string;
      path: string;
      taken_at: string;
      gps_distance_m: number | null;
      by: string;
    }>;
    events: Array<{
      event: string;
      at: string;
      note: string | null;
      by: string;
    }>;
  };

  // Signed links for evidence photos
  const signed = new Map<string, string>();
  if (x.proofs.length) {
    const { data: urls } = await supabase.storage
      .from("booking-proofs")
      .createSignedUrls(x.proofs.map((p) => p.path), 3600);
    for (const u of urls ?? []) if (u.signedUrl && u.path) signed.set(u.path, u.signedUrl);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/jobs" className="text-xs font-bold text-leaf-700 underline">
          ← Back to Jobs Console
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-leaf-900">
            Job CN-{x.id.slice(0, 8).toUpperCase()}
          </h1>
          <Badge className="bg-leaf-100 text-leaf-800 font-bold text-sm">
            Status: {x.status.replaceAll("_", " ")}
          </Badge>
        </div>
      </div>

      {/* SPLIT DETAIL: JOB INFORMATION & TIMELINE (Section 17) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-lg font-bold text-leaf-900 border-b border-line pb-2">
            Job Information
          </h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted font-medium">Service:</dt>
            <dd className="font-bold text-ink">{x.title}</dd>

            <dt className="text-muted font-medium">Farm Name:</dt>
            <dd className="font-semibold text-ink">{x.farm_name}</dd>

            <dt className="text-muted font-medium">Location:</dt>
            <dd>{[x.job_lga, x.job_state].filter(Boolean).join(", ")}</dd>

            <dt className="text-muted font-medium">Date:</dt>
            <dd className="font-bold">{x.job_date}</dd>

            <dt className="text-muted font-medium">Amount:</dt>
            <dd className="tabular-nums">
              {x.quantity} {x.unit} × {formatNaira(x.rate_kobo)} ={" "}
              <strong className="text-leaf-800">{formatNaira(x.total_kobo)}</strong>
            </dd>

            <dt className="text-muted font-medium">Distance:</dt>
            <dd>{x.distance_km} km</dd>

            {x.farmer_note && (
              <>
                <dt className="text-muted font-medium">Instructions:</dt>
                <dd className="italic bg-cream p-2 rounded-md">&quot;{x.farmer_note}&quot;</dd>
              </>
            )}

            {x.closed_reason && (
              <>
                <dt className="text-muted font-medium">Close Reason:</dt>
                <dd className="text-danger font-semibold">{x.closed_reason}</dd>
              </>
            )}
          </dl>
        </Card>

        {/* STATUS & TIMELINE */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-lg font-bold text-leaf-900 border-b border-line pb-2">
            Execution Timeline Checkpoints
          </h2>
          <ol className="flex flex-col gap-3 border-l-2 border-line pl-4 text-sm">
            {x.events.map((e, idx) => (
              <li key={idx}>
                <span className="font-bold text-leaf-900 capitalize">
                  {e.event.replaceAll("_", " ")}
                </span>{" "}
                <span className="text-xs text-muted">by {e.by}</span>
                <span className="block text-xs text-muted">{when(e.at)}</span>
                {e.note && <span className="block text-xs italic text-ink mt-0.5">“{e.note}”</span>}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* GEOLOCATION & POSTGIS TELEMETRY (Section 17) */}
      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-lg font-bold text-leaf-900 border-b border-line pb-2">
          Geolocation & Boundary Telemetry
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-cream p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted">
              Farm Boundary Pin
            </span>
            <span className="mt-1 block font-mono text-sm font-bold text-ink">
              {x.location ? `${x.location.lat.toFixed(5)}, ${x.location.lng.toFixed(5)}` : "Not pinned"}
            </span>
            {x.location?.hint && (
              <span className="mt-1 block text-xs text-muted">Landmark: {x.location.hint}</span>
            )}
          </div>

          <div className="rounded-lg border border-line bg-cream p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted">
              Provider Check-in Point
            </span>
            <span className="mt-1 block font-mono text-sm font-bold text-ink">
              {x.checked_in_at ? when(x.checked_in_at) : "Awaiting arrival"}
            </span>
            {x.check_in_distance_m !== null && (
              <span className="mt-1 block text-xs font-semibold text-leaf-700">
                {x.check_in_distance_m}m from boundary ✓ Valid
              </span>
            )}
          </div>

          <div className="rounded-lg border border-line bg-cream p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted">
              Hectares Verified
            </span>
            <span className="mt-1 block text-xl font-extrabold text-leaf-900">
              {x.hectares_done ? `${x.hectares_done} ha` : "In progress"}
            </span>
          </div>
        </div>
      </Card>

      {/* EVIDENCE GALLERY (Section 17) */}
      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-lg font-bold text-leaf-900 border-b border-line pb-2">
          Work Evidence & Photographs ({x.proofs.length})
        </h2>
        {x.proofs.length === 0 ? (
          <p className="text-sm text-muted">No proof photos uploaded yet for this booking.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {x.proofs.map((p) => {
              const url = signed.get(p.path);
              return (
                <div key={p.id} className="flex flex-col gap-1.5 rounded-lg border border-line p-2">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={p.kind}
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-md bg-cream text-xs text-muted">
                      Photo
                    </div>
                  )}
                  <span className="text-xs font-bold uppercase text-leaf-900 capitalize">
                    {p.kind} Photo
                  </span>
                  <span className="text-[11px] text-muted">
                    {when(p.taken_at)} · {p.gps_distance_m !== null ? `✓ GPS (${p.gps_distance_m}m)` : "No GPS"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ADMIN ACTIONS (Section 17) */}
      <Card className="flex flex-col gap-4 border-2 border-line bg-cream/50 p-5">
        <h2 className="text-lg font-bold text-leaf-900">Admin Operations & Interventions</h2>
        <div className="flex flex-wrap gap-4">
          {x.status === "disputed" && (
            <Link
              href={`/admin/disputes/${x.id}`}
              className="inline-flex items-center rounded-md bg-danger px-4 py-2 font-bold text-white hover:bg-danger/90"
            >
              Open Dispute Arbitration Console →
            </Link>
          )}

          {can(staff, "disputes.decide") && x.status !== "completed" && x.status !== "cancelled" && (
            <AdminForm
              action={adminCancelJob}
              hidden={{ booking_id: x.id }}
              buttons={[{ label: "Cancel Job (Staff Override)", variant: "secondary" }]}
              className="max-w-md"
            >
              <Field id="cancel-job-reason" label="Reason for staff intervention (written to audit log)">
                <Input id="cancel-job-reason" name="reason" maxLength={500} required />
              </Field>
            </AdminForm>
          )}
        </div>
      </Card>
    </div>
  );
}
