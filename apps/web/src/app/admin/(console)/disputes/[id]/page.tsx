import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  arbitrateDispute,
  formatNaira,
  type DisputeCategory,
} from "@cultivanode/shared";
import {
  adminReopenDispute,
  adminRequestDisputeEvidence,
  adminResolveDispute,
} from "@/actions/admin-console";
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
    dispute: {
      outcome: "uphold_provider" | "uphold_farmer" | "settlement";
      decision: string | null;
      settlement_kobo: number | null;
      decided_at: string | null;
    } | null;
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

  // Deterministic Suggested Finding from @cultivanode/shared arbitration engine
  const farmLoc = x.location ? { lat: x.location.lat, lng: x.location.lng } : { lat: 0, lng: 0 };
  const suggestion = arbitrateDispute({
    disputeId: x.id,
    bookingId: x.id,
    category: ((x.dispute_category as DisputeCategory | null) ?? "other") as DisputeCategory,
    farmerClaim: x.dispute_reason ?? "",
    agreedPriceKobo: x.total_kobo,
    farmLocation: farmLoc,
    evidences: x.proofs.map((p) => ({
      evidenceId: p.id,
      role: p.by === "farmer" ? "farmer" : "provider",
      photoUrl: p.path,
      timestamp: new Date(p.taken_at).getTime(),
      gps: p.gps_distance_m !== null && p.gps_distance_m <= 1000 ? farmLoc : undefined,
    })),
  });

  const suggestedDecision: "uphold_farmer" | "uphold_provider" | "settlement" =
    suggestion.decision === "full_refund_to_farmer"
      ? "uphold_farmer"
      : suggestion.decision === "full_payout_to_provider"
        ? "uphold_provider"
        : "settlement";

  const suggestedSettlementNaira =
    suggestedDecision === "settlement" && suggestion.providerPayoutKobo > 0
      ? Math.round(suggestion.providerPayoutKobo / 100)
      : Math.round(x.total_kobo / 200);

  const canDecide = can(staff, "disputes.decide");

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
          <Badge className={x.status === "disputed" ? "bg-red-100 text-danger font-bold text-sm" : "bg-leaf-100 text-leaf-800 font-bold text-sm"}>
            STATUS: {x.status === "disputed" ? "Awaiting Arbitration" : `Resolved (${x.dispute?.outcome?.replaceAll("_", " ") ?? x.status})`}
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
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted border-t border-line/60 pt-2">
          <span>
            Agreed Amount (Direct Payment):{" "}
            <strong className="font-mono text-leaf-900">{formatNaira(x.total_kobo)}</strong>
          </span>
          <span>Claimed Hectares: {x.hectares_done ? `${x.hectares_done} ha` : "Not confirmed"}</span>
        </div>
      </Card>

      {/* SECTION 2: SIDE-BY-SIDE EVIDENCE COMPARISON */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* FARMER EVIDENCE */}
        <Card className="flex flex-col gap-4 p-5 border-l-4 border-l-node-600">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="font-bold text-leaf-900">Farmer Evidence ({farmerProofs.length})</h3>
            <span className="text-xs text-muted">Farmer</span>
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
          Geolocation &amp; PostGIS Boundary Proximity
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-cream p-4">
            <span className="block text-xs font-bold uppercase text-muted">Farm Boundary Pin</span>
            <span className="mt-1 block font-mono text-sm font-bold text-ink">
              {x.location ? `${x.location.lat.toFixed(5)}, ${x.location.lng.toFixed(5)}` : "Not available"}
            </span>
          </div>

          <div className="rounded-lg border border-line bg-cream p-4">
            <span className="block text-xs font-bold uppercase text-muted">Check-In Timestamp</span>
            <span className="mt-1 block font-mono text-sm font-bold text-ink">
              {x.checked_in_at ? when(x.checked_in_at) : "No check-in"}
            </span>
          </div>

          <div className="rounded-lg border border-line bg-cream p-4">
            <span className="block text-xs font-bold uppercase text-muted">Distance from Farm Pin</span>
            <span className="mt-1 block text-2xl font-extrabold text-leaf-800">
              {x.check_in_distance_m !== null ? `${x.check_in_distance_m} metres` : "Unknown"}
            </span>
            <span className="text-xs text-muted">
              {x.check_in_distance_m !== null && x.check_in_distance_m <= 100
                ? "✓ Within 100m tolerance threshold"
                : "⚠️ Exceeded 100m boundary tolerance"}
            </span>
          </div>
        </div>
      </Card>

      {/* SECTION 3B: DETERMINISTIC ARBITRATION ENGINE SUGGESTION */}
      <Card className="flex flex-col gap-3 border border-harvest-500/50 bg-harvest-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-harvest-500 text-white font-bold text-xs">
              Suggested Finding
            </Badge>
            <span className="text-sm font-bold text-leaf-900">
              {suggestedDecision === "uphold_farmer"
                ? "Uphold Farmer (No payment owed)"
                : suggestedDecision === "uphold_provider"
                  ? "Uphold Provider (Full agreed amount owed)"
                  : `Partial Settlement (Provider paid ${formatNaira(suggestion.providerPayoutKobo)})`}
            </span>
          </div>
          <span className="text-xs text-muted">
            GPS-valid photos: Farmer {suggestion.evidenceScores.farmerEvidenceValidCount} · Provider{" "}
            {suggestion.evidenceScores.providerEvidenceValidCount}
          </span>
        </div>
        <p className="text-sm text-ink">{suggestion.notes}</p>
        <p className="text-xs text-muted">
          Advisory only — review the actual photos and statements above before issuing a final decision.
        </p>
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

      {/* SECTION 5: REQUEST MORE EVIDENCE (when dispute is open) */}
      {x.status === "disputed" && canDecide && (
        <Card className="flex flex-col gap-4 border border-line p-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted">
              EVIDENCE REQUEST LOOP
            </span>
            <h3 className="text-xl font-bold text-leaf-900">Ask a Party for Specific Evidence</h3>
            <p className="text-sm text-muted">
              Sends an in-app notice and SMS asking the farmer, provider, or both to upload additional photos while the dispute remains open.
            </p>
          </div>
          <AdminForm
            action={adminRequestDisputeEvidence}
            hidden={{ booking_id: x.id }}
            buttons={[{ label: "Send Evidence Request", variant: "secondary" }]}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field id="req-to" label="Who should respond?">
              <Select id="req-to" name="to" defaultValue="both">
                <option value="both">Both Farmer &amp; Provider</option>
                <option value="farmer">Farmer only</option>
                <option value="provider">Provider only</option>
              </Select>
            </Field>
            <Field id="req-hours" label="Response window (hours, 1–168)">
              <Input id="req-hours" name="hours" type="number" min={1} max={168} defaultValue={24} required />
            </Field>
            <div className="sm:col-span-2">
              <Field
                id="req-note"
                label="What specific photo or detail do you need?"
                hint="At least 10 characters. Seen by the recipient(s)."
              >
                <Input
                  id="req-note"
                  name="note"
                  maxLength={500}
                  required
                  placeholder="e.g. Please upload a close-up photo of the western half of the plot."
                />
              </Field>
            </div>
          </AdminForm>
        </Card>
      )}

      {/* SECTION 6: ADMIN DECISION WORKSTATION (when dispute is open) */}
      {x.status === "disputed" && canDecide && (
        <Card className="flex flex-col gap-5 border-2 border-leaf-700 bg-leaf-50/40 p-6 shadow-sm">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-leaf-800">
              ARBITRATION DECISION
            </span>
            <h3 className="text-2xl font-extrabold text-leaf-900">Issue Arbitration Resolution</h3>
            <p className="text-sm text-muted">
              Writes to the booking timeline, notifies both parties by SMS and in-app inbox, and logs to the tamper-evident audit trail.
            </p>
          </div>

          <AdminForm
            action={adminResolveDispute}
            hidden={{ booking_id: x.id }}
            buttons={[{ label: "Issue Resolution & Close Dispute ⚖️", variant: "primary" }]}
            className="flex flex-col gap-4"
          >
            <Field id="arb-decision" label="Select Arbitration Finding">
              <Select id="arb-decision" name="decision" required defaultValue={suggestedDecision}>
                <option value="uphold_farmer">Uphold Farmer (Job Cancelled · No payment owed)</option>
                <option value="uphold_provider">
                  Uphold Provider (Work Stands · Farmer pays {formatNaira(x.total_kobo)} directly)
                </option>
                <option value="settlement">
                  Mutual Settlement (Partial Direct Payment Agreed)
                </option>
              </Select>
            </Field>

            <Field
              id="arb-settlement-naira"
              label="Agreed Settlement Amount in Naira (Required only if 'Mutual Settlement' is selected)"
              hint={`Agreed job total is ${formatNaira(x.total_kobo)}. Suggested partial payout: ₦${suggestedSettlementNaira.toLocaleString("en-NG")}. Leave blank for Uphold Farmer / Uphold Provider.`}
              optional="For settlement only"
            >
              <Input
                id="arb-settlement-naira"
                name="settlement_naira"
                type="number"
                min={1}
                max={Math.floor(x.total_kobo / 100)}
                step="1"
                placeholder={`e.g. ${suggestedSettlementNaira}`}
              />
            </Field>

            <Field
              id="arb-decision-text"
              label="Message to Farmer & Provider (Shown on their booking page)"
              hint="Clear explanation of the decision and what should be paid directly."
            >
              <Input
                id="arb-decision-text"
                name="decision_text"
                maxLength={1000}
                required
                defaultValue={suggestion.notes}
                placeholder="e.g. Half the plot was harrowed; both parties agreed the farmer pays half the price directly."
              />
            </Field>

            <Field
              id="arb-reason"
              label="Staff Audit Reasoning (At least 10 characters, recorded in admin_actions)"
              hint="Factual rationale referencing check-in distance, photo timestamps, and statements."
            >
              <TextArea
                id="arb-reason"
                name="reason"
                rows={2}
                required
                placeholder="e.g. Provider checked in within 15m and uploaded before/after photos; farmer photo shows northern corner unploughed."
              />
            </Field>
          </AdminForm>
        </Card>
      )}

      {/* SECTION 7: RESOLVED OUTCOME & REOPEN WORKSTATION (when already decided) */}
      {x.dispute && (
        <Card className="flex flex-col gap-4 border-2 border-leaf-700 bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-leaf-800">
                RECORDED ARBITRATION OUTCOME
              </span>
              <h3 className="text-xl font-bold text-leaf-900 capitalize">
                {x.dispute.outcome.replaceAll("_", " ")}
              </h3>
            </div>
            {x.dispute.decided_at && (
              <span className="text-xs text-muted">Decided {when(x.dispute.decided_at)}</span>
            )}
          </div>
          {x.dispute.decision && (
            <blockquote className="rounded-lg border-l-4 border-leaf-700 bg-cream p-4 text-sm text-ink">
              “{x.dispute.decision}”
            </blockquote>
          )}
          {x.dispute.settlement_kobo && (
            <p className="text-sm font-semibold text-leaf-900">
              Agreed Direct Settlement Payment: {formatNaira(x.dispute.settlement_kobo)} (of{" "}
              {formatNaira(x.total_kobo)} original job total)
            </p>
          )}

          {canDecide && (
            <div className="border-t border-line pt-4 mt-2">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">
                Reopen Dispute (Appeal / New Evidence)
              </h4>
              <AdminForm
                action={adminReopenDispute}
                hidden={{ booking_id: x.id }}
                buttons={[{ label: "Reopen Dispute", variant: "secondary" }]}
                className="flex flex-col gap-3 max-w-xl"
              >
                <Field
                  id="reopen-reason"
                  label="Reason for reopening (at least 10 characters)"
                >
                  <Input
                    id="reopen-reason"
                    name="reason"
                    maxLength={1000}
                    required
                    placeholder="e.g. Provider called in with additional timestamped video of the completed plot."
                  />
                </Field>
              </AdminForm>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
