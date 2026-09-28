import type { Metadata } from "next";
import Link from "next/link";
import { EQUIPMENT_TYPE_LABELS, formatNaira, NIGERIAN_STATES, PROVIDER_TYPE_LABELS, type EquipmentType, type ProviderType } from "@cultivanode/shared";
import { moderateListing, setFeatureFlag } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Alert, Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import { phoneLabel, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Marketplace" };

const PILOT_STATES = ["Oyo", "Ogun", "Osun", "Ondo", "Ekiti", "Lagos"] as const;
const STATUSES = ["active", "paused", "draft", "suspended"] as const;

type AdminListing = {
  id: string;
  kind: "equipment" | "service";
  equipment_type: EquipmentType | null;
  provider_type: ProviderType | null;
  title: string;
  status: (typeof STATUSES)[number];
  service_radius_km: number;
  suspended_reason: string | null;
  created_at: string;
  owner_id: string;
  owner_name: string | null;
  owner_phone: string | null;
  owner_state: string | null;
  owner_tier: number;
  owner_suspended: boolean;
  lat: number;
  lng: number;
  rates: Record<string, number> | null;
};

const UNIT: Record<string, string> = { hour: "/hour", day: "/day", hectare: "/ha", job: "/job" };

export default async function MarketplacePage({ searchParams }: PageProps<"/admin/marketplace">) {
  const staff = await requireStaff();
  if (!staff) return null;
  const canFlags = can(staff, "settings.manage");
  const canModerate = can(staff, "listings.moderate");
  if (!canFlags && !canModerate) return <Alert tone="danger">You need the listings.moderate or settings.manage permission.</Alert>;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const statusRaw = typeof sp.status === "string" ? sp.status : "";
  const status = (STATUSES as readonly string[]).includes(statusRaw) ? (statusRaw as (typeof STATUSES)[number]) : undefined;

  const supabase = await createClient();
  const [{ data: flag }, listingsRes] = await Promise.all([
    supabase.from("feature_flags").select("key, enabled, states, updated_at").eq("key", "marketplace_live").maybeSingle(),
    canModerate ? supabase.rpc("admin_listings", { p_status: status, p_query: q || undefined, p_limit: 200 }) : Promise.resolve({ data: null, error: null }),
  ]);
  const listings = (listingsRes.data ?? []) as unknown as AdminListing[];
  const on = flag?.enabled === true;
  const where = flag?.states?.length ? flag.states.join(", ") : "all states";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-leaf-800">Marketplace</h1>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold">Kill switch</h2>
          <Badge className={on ? "bg-leaf-100 text-leaf-800" : "bg-red-50 text-danger"}>
            {on ? `Open in ${where}` : "Closed"}
          </Badge>
        </div>
        <p className="text-muted">
          When closed, farmers see no search results and providers can only save drafts. Open it per pilot state
          (by the state on each person&apos;s profile). {flag?.updated_at && <>Last changed {when(flag.updated_at)}.</>}
        </p>
        {canFlags ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminForm action={setFeatureFlag} hidden={{ key: "marketplace_live", do: "on" }} buttons={[{ label: on ? "Update states" : "Open the marketplace" }]}>
              <fieldset className="flex flex-col gap-2">
                <legend className="font-semibold">Open for (none ticked = every state)</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {PILOT_STATES.map((s) => (
                    <label key={s} className="inline-flex min-h-11 items-center gap-2">
                      <input type="checkbox" name="states" value={s} defaultChecked={flag?.states?.includes(s) ?? false} className="size-5 accent-leaf-700" />
                      {s}
                    </label>
                  ))}
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted">Other states</summary>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                    {NIGERIAN_STATES.filter((s) => !(PILOT_STATES as readonly string[]).includes(s)).map((s) => (
                      <label key={s} className="inline-flex min-h-11 items-center gap-2">
                        <input type="checkbox" name="states" value={s} defaultChecked={flag?.states?.includes(s) ?? false} className="size-5 accent-leaf-700" />
                        {s}
                      </label>
                    ))}
                  </div>
                </details>
              </fieldset>
              <Field id="flag-on-reason" label="Reason">
                <Input id="flag-on-reason" name="reason" maxLength={500} required placeholder="For example: Oke-Ogun beta starts" />
              </Field>
            </AdminForm>
            {on && (
              <AdminForm action={setFeatureFlag} hidden={{ key: "marketplace_live", do: "off" }} buttons={[{ label: "Close the marketplace", variant: "secondary" }]}>
                <Field id="flag-off-reason" label="Reason" hint="Search and publishing stop for everyone at once. Listings are kept.">
                  <Input id="flag-off-reason" name="reason" maxLength={500} required aria-describedby="flag-off-reason-hint" />
                </Field>
              </AdminForm>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">Only staff with settings.manage can change the switch.</p>
        )}
      </Card>

      {canModerate && (
        <section className="flex flex-col gap-4" aria-labelledby="listings-h">
          <h2 id="listings-h" className="text-2xl font-bold">Listings</h2>
          <form className="flex flex-wrap items-end gap-2" role="search">
            <label htmlFor="lq" className="sr-only">Search listings</label>
            <Input id="lq" name="q" defaultValue={q} placeholder="Title, owner name or phone" className="max-w-md" />
            <label htmlFor="ls" className="sr-only">Status</label>
            <Select id="ls" name="status" defaultValue={status ?? ""} className="w-auto">
              <option value="">Any status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Button type="submit">Search</Button>
          </form>
          {listingsRes.error && <Alert tone="danger">Could not load listings.</Alert>}
          {listings.length === 0 && <p className="text-muted">No listings found.</p>}
          <ul className="flex flex-col gap-4">
            {listings.map((x) => (
              <li key={x.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold">{x.title}</h3>
                      <p className="text-sm text-muted">
                        {x.kind === "equipment" ? EQUIPMENT_TYPE_LABELS[x.equipment_type!] : PROVIDER_TYPE_LABELS[x.provider_type!]}
                        {" · "}{x.service_radius_km} km radius · pin {x.lat.toFixed(4)}, {x.lng.toFixed(4)} · listed {when(x.created_at)}
                      </p>
                      <p className="text-sm">
                        <Link href={`/admin/users/${x.owner_id}`} className="font-semibold text-leaf-700 underline">{x.owner_name ?? "(no name)"}</Link>
                        {" · "}{phoneLabel(x.owner_phone)} · {x.owner_state ?? "-"} · level {x.owner_tier}
                        {x.owner_suspended && <strong className="ml-1 text-danger">(account suspended)</strong>}
                      </p>
                    </div>
                    <Badge className={x.status === "active" ? "bg-leaf-100 text-leaf-800" : x.status === "suspended" ? "bg-red-50 text-danger" : ""}>
                      {x.status}
                    </Badge>
                  </div>
                  <p className="flex flex-wrap gap-x-4 font-semibold tabular-nums">
                    {Object.entries(x.rates ?? {}).map(([u, k]) => <span key={u}>{formatNaira(k)}{UNIT[u]}</span>)}
                    {!x.rates && <span className="text-muted">No prices (hidden from search)</span>}
                  </p>
                  {x.status === "suspended" && <p className="text-sm text-danger">Suspended: {x.suspended_reason}</p>}
                  <AdminForm action={moderateListing} hidden={{ listing_id: x.id, do: x.status === "suspended" ? "restore" : "suspend" }}
                             buttons={[{ label: x.status === "suspended" ? "Restore (as paused)" : "Suspend listing", variant: "secondary" }]}
                             className="max-w-xl">
                    <Field id={`mod-${x.id}`} label="Reason (the owner sees it)">
                      <Input id={`mod-${x.id}`} name="reason" maxLength={500} required />
                    </Field>
                  </AdminForm>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
