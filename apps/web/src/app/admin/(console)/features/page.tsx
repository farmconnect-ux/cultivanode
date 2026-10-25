import type { Metadata } from "next";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setFeatureFlag } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Alert, Badge, Card, Field, Input } from "@/components/ui";
import { when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Feature switches" };

type FlagRow = { key: string; description: string; enabled: boolean; states: string[] | null; updated_at: string };

/** How each switch is grouped and named on this page. Unknown keys still show, under "Other". */
const GROUPS: { title: string; intro: string; keys: Record<string, string> }[] = [
  {
    title: "Payments",
    intro: "Escrow stays off until a licensed payment partner is signed. While off, buyers pay sellers directly and sellers confirm the money arrived.",
    keys: { escrow_payments: "Marketplace escrow (pay online, held until delivery)", hiring_escrow: "Escrow for tractor and farm-hand jobs" },
  },
  {
    title: "Modules in the menu",
    intro: "Switch a module on when it is finished. While off it is hidden from the menu on the website and in the app.",
    keys: {
      module_livestock: "Livestock and aquaculture",
      module_farm_map: "Farm map",
      module_fleet: "Fleet and workshop",
      module_harvest: "Produce and harvest commerce",
      module_telemetry: "Machine telemetry and tracking",
      module_iot: "IoT and smart farm",
      module_irrigation: "Smart irrigation",
      module_contracts: "Off-take contracts",
      module_credit_reports: "Verified records and credit",
      module_risk: "Farm health and risk",
      module_logistics: "Logistics and haulage",
      module_pow_log: "Proof-of-work log (providers)",
      ecosystem_hubs: "Partner workspaces (lender, insurance, grants, investor, government, NGO, research and others)",
    },
  },
  {
    title: "Farm assistant",
    intro: "Photo diagnosis stays off until it uses a real model checked by agronomists.",
    keys: { ai_photo_diagnosis: "Diagnose a plant problem from a photo" },
  },
];

export default async function FeaturesPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "settings.manage")) return <Alert tone="danger">You need the settings.manage permission.</Alert>;

  // feature_flags is newer than the generated types: read it through an untyped client.
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data, error } = await supabase.from("feature_flags").select("key, description, enabled, states, updated_at").order("key");
  const rows = (data ?? []) as FlagRow[];
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const known = new Set(GROUPS.flatMap((g) => Object.keys(g.keys)).concat("marketplace_live"));
  const other = rows.filter((r) => !known.has(r.key));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-leaf-800">Feature switches</h1>
        <p className="max-w-3xl text-on-surface-variant">
          Turn finished features on for everyone. Every change needs a reason and is written to the audit log. The marketplace
          open/close switch, which can be limited to pilot states, lives on the <Link href="/admin/marketplace" className="font-semibold underline">Equipment &amp; Listings</Link> page.
        </p>
      </div>
      {error && <Alert tone="danger">Could not load the switches. Check that the latest database migration has been applied.</Alert>}

      {GROUPS.map((g) => (
        <section key={g.title} className="flex flex-col gap-3" aria-labelledby={`h-${g.title}`}>
          <div>
            <h2 id={`h-${g.title}`} className="text-xl font-bold">{g.title}</h2>
            <p className="text-sm text-on-surface-variant">{g.intro}</p>
          </div>
          <ul className="grid gap-3 lg:grid-cols-2">
            {Object.entries(g.keys).map(([key, label]) => (
              <li key={key}>
                <FlagCard row={byKey.get(key)} flagKey={key} label={label} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {other.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="h-other">
          <h2 id="h-other" className="text-xl font-bold">Other</h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {other.map((r) => (
              <li key={r.key}>
                <FlagCard row={r} flagKey={r.key} label={r.key} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FlagCard({ row, flagKey, label }: { row: FlagRow | undefined; flagKey: string; label: string }) {
  if (!row) {
    return (
      <Card className="flex flex-col gap-1">
        <h3 className="font-bold">{label}</h3>
        <p className="text-sm text-on-surface-variant">Not in the database yet: apply the latest migration.</p>
      </Card>
    );
  }
  const on = row.enabled;
  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-bold">{label}</h3>
        <Badge className={on ? "bg-leaf-100 text-leaf-800" : "bg-surface-container text-on-surface-variant"}>{on ? "On" : "Off"}</Badge>
      </div>
      <p className="text-sm text-on-surface-variant">{row.description}</p>
      <p className="text-xs text-on-surface-variant">Last changed {when(row.updated_at)}</p>
      <AdminForm
        action={setFeatureFlag}
        hidden={{ key: flagKey, do: on ? "off" : "on" }}
        buttons={[{ label: on ? "Switch off" : "Switch on", variant: on ? "secondary" : "primary" }]}
      >
        <Field id={`reason-${flagKey}`} label="Reason">
          <Input id={`reason-${flagKey}`} name="reason" maxLength={500} required placeholder={on ? "For example: needs more testing" : "For example: tested with pilot farmers"} />
        </Field>
      </AdminForm>
    </Card>
  );
}
