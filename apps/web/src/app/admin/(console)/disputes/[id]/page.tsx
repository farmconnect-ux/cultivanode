import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { adminResolveDispute } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Badge, Card, Field, Input, Select, TextArea } from "@/components/ui";
import { when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dispute Arbitration Workstation" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminDisputeDetailPage({
  params,
}: PageProps<"/admin/disputes/[id]">) {
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
    status: string;
    job_date: string;
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

  const farmerProofs = x.proofs.filter((p) => p.by === "farmer");
  const providerProofs = x.proofs.filter((p) => p.by === "provider");

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <Link href="/admin/disputes" className="text-xs font-bold text-leaf-700 underline">
          ← Back to Disputes List
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-bold text-danger uppercase tracking-wider">
              DISPUTE #CN-{x.id.slice(0, 8).toUpperCase()}
            </span>
            <h1 className="text-3xl font-extrabold text-leaf-900">Evidence Arbitration Workstation</h1>
            <p className="mt-1 text-sm text-muted">
              {x.title} · {x.farm_name} ({[x.job_lga, x.job_state].filter(Boolean).join(", ")})
            </p>
          </div>
          <Badge className="bg-red-100 text-danger font-bold text-sm">
            STATUS: Awaiting Arbitration
          </Badge>
        </div>
      </div>

      {/* SECTION 1: CLAIM & PROBLEM STATEMENT (Evidence Before Opinion) */}
      <Card className="flex flex-col gap-3 border-2 border-danger/40 bg-red-50/20 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-danger">
            Claim Under Arbitration
          </span>
          <span className="text-xs font-semibold text-muted">
            Filed {when(x.disputed_at ?? "")} by {x.disputed_by === "farmer" ? "Farmer" : "Provider"}
          </span>
        </div>
        <h2 className="text-lg font-bold text-leaf-900">
          Reason Category: {x.dispute_category?.replaceAll("_", " ") ?? "General Problem"}
        </h2>
        <blockquote className="rounded-lg border-l-4 border-danger bg-white p-4 italic text-ink shadow-xs">
          &quot;{x.dispute_reason || "No written statement provided."}&quot;
        </blockquote>
        <div className="flex items-center justify-between text-xs text-muted border-t border-line/60 pt-2">
          <span>Escrow Amount: <strong className="font-mono text-leaf-900">{formatNaira(x.total_kobo)}</strong></span>
          <span>Claimed Hectares: {x.hectares_done ? `${x.hectares_done} ha` : "Not confirmed"}</span>
        </div>
      </Card>

      {/* SECTION 2: SIDE-BY-SIDE EVIDENCE COMPARISON */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* FARMER EVIDENCE */}
        <Card className="flex flex-col gap-4 p-5 border-l-4 border-l-node-600">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="font-bold text-leaf-900">Farmer Evidence ({farmerProofs.length})</h3>
            <span className="text-xs text-muted">Claimant</span>
          </div>
          {farmerProofs.length === 0 ? (
            <p className="text-sm text-muted italic">No separate photos attached by farmer.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {farmerProofs.map((p) => {
                const url = signed.get(p.path);
                return (
                  <div key={p.id} className="flex flex-col gap-1 rounded-lg border border-line p-2">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="Farmer Evidence" className="aspect-square w-full rounded-md object-cover" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-md bg-cream text-xs text-muted">Photo</div>
                    )}
                    <span className="text-xs font-semibold">{when(p.taken_at)}</span>
                    <span className="text-[10px] text-muted">{p.gps_distance_m !== null ? `✓ GPS (${p.gps_distance_m}m)` : "No GPS"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* PROVIDER EVIDENCE */}
        <Card className="flex flex-col gap-4 p-5 border-l-4 border-l-leaf-600">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="font-bold text-leaf-900">Provider Evidence ({providerProofs.length})</h3>
            <span className="text-xs text-muted">Operator</span>
          </div>
          {providerProofs.length === 0 ? (
            <p className="text-sm text-muted italic">No proof photos submitted by provider.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {providerProofs.map((p) => {
                const url = signed.get(p.path);
                return (
                  <div key={p.id} className="flex flex-col gap-1 rounded-lg border border-line p-2">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={p.kind} className="aspect-square w-full rounded-md object-cover" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-md bg-cream text-xs text-muted">Photo</div>
                    )}
                    <span className="text-xs font-bold capitalize text-leaf-800">{p.kind} Photo</span>
                    <span className="text-[10px] text-muted">{p.gps_distance_m !== null ? `✓ GPS (${p.gps_distance_m}m)` : "No GPS"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 3: GEOLOCATION TELEMETRY */}
      <Card className="flex flex-col gap-4 p-5">
        <h3 className="font-bold text-leaf-900 border-b border-line pb-2">
          Geolocation & PostGIS Boundary Proximity
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-cream p-4">
            <span className="block text-xs font-bold uppercase text-muted">Farm Boundary Pin</span>
            <span className="mt-1 block font-mono text-sm font-bold text-ink">
              {x.location ? `${x.location.lat.toFixed(5)}, ${x.location.lng.toFixed(5)}` : "Not available"}
            </span>
          </div>

          <div className="rounded-lg border border-line bg-cream p-4">
            <span className="block text-xs font-bold uppercase text-muted">Check-In Coordinates</span>
            <span className="mt-1 block font-mono text-sm font-bold text-ink">
              {x.checked_in_at ? when(x.checked_in_at) : "No check-in"}
            </span>
          </div>

          <div className="rounded-lg border border-line bg-cream p-4">
            <span className="block text-xs font-bold uppercase text-muted">Distance from Farm Boundary</span>
            <span className="mt-1 block text-2xl font-extrabold text-leaf-800">
              {x.check_in_distance_m !== null ? `${x.check_in_distance_m} metres` : "Unknown"}
            </span>
            <span className="text-xs text-muted">
              {x.check_in_distance_m !== null && x.check_in_distance_m <= 100
                ? "✓ Within 100m tolerance threshold"
                : "⚠️ Exceeded tolerance threshold"}
            </span>
          </div>
        </div>
      </Card>

      {/* SECTION 4: TIMELINE CHECKPOINTS */}
      <Card className="flex flex-col gap-3 p-5">
        <h3 className="font-bold text-leaf-900 border-b border-line pb-2">
          Chronological Audit Checkpoints
        </h3>
        <ol className="flex flex-col gap-2.5 border-l-2 border-line pl-4 text-sm">
          {x.events.map((e, idx) => (
            <li key={idx}>
              <span className="font-bold text-leaf-900 capitalize">{e.event.replaceAll("_", " ")}</span>{" "}
              <span className="text-xs text-muted">({e.by})</span> · {when(e.at)}
              {e.note && <span className="block text-xs italic text-ink">“{e.note}”</span>}
            </li>
          ))}
        </ol>
      </Card>

      {/* SECTION 5: ADMIN DECISION WORKSTATION (Section 18) */}
      <Card className="flex flex-col gap-5 border-2 border-leaf-700 bg-leaf-50/40 p-6 shadow-sm">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-leaf-800">
            ARBITRATION DECISION
          </span>
          <h3 className="text-2xl font-extrabold text-leaf-900">Issue Arbitration Resolution</h3>
          <p className="text-sm text-muted">
            The decision is final and written to the tamper-evident audit log with your staff credentials.
          </p>
        </div>

        <AdminForm
          action={adminResolveDispute}
          hidden={{ booking_id: x.id }}
          buttons={[{ label: "Issue Resolution & Close Dispute ⚖️", variant: "primary" }]}
          className="flex flex-col gap-4"
        >
          <Field id="arb-decision" label="Select Arbitration Finding">
            <Select id="arb-decision" name="decision" required defaultValue="uphold_farmer">
              <option value="uphold_farmer">Uphold Farmer (100% Refund / Job Cancelled)</option>
              <option value="uphold_provider">Uphold Provider (Release Escrow / Job Completed)</option>
              <option value="settlement">Mutual Settlement (Partial Adjustment)</option>
            </Select>
          </Field>

          <Field
            id="arb-reason"
            label="Formal Resolution Reason (Seen by both Farmer & Provider)"
            hint="At least 5 characters. Explain the factual rationale based on GPS and photos."
          >
            <Input
              id="arb-reason"
              name="reason"
              maxLength={500}
              required
              placeholder="e.g. Geolocation and photo evidence confirm incomplete harrowing on northern half."
            />
          </Field>

          <Field
            id="arb-note"
            label="Internal Staff Note (Confidential, for audit log only)"
            optional="Optional"
          >
            <TextArea
              id="arb-note"
              name="internal_note"
              rows={2}
              placeholder="Internal risk observations or provider advisory notes..."
            />
          </Field>
        </AdminForm>
      </Card>
    </div>
  );
}
