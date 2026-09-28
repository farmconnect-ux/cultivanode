import Link from "next/link";
import { notFound } from "next/navigation";
import { DbConstants, formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card, Field, Select } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

const E = DbConstants.public.Enums;
const RADII = [10, 20, 30, 50, 100] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Result = {
  listing_id: string;
  kind: "equipment" | "service";
  equipment_type: string | null;
  provider_type: string | null;
  title: string;
  description: string | null;
  rates: Record<string, number>;
  operator_included: boolean;
  distance_km: number;
  provider: { name: string; state: string | null; tier: number };
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function FindPage({ params, searchParams }: PageProps<"/[lang]/account/find">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const f = t.acct.find;
  const q = await searchParams;
  const supabase = await createClient();

  if (!account.isFarmer) {
    return (
      <>
        <h1 className="text-3xl font-extrabold text-leaf-800">{f.title}</h1>
        <p className="text-muted">{f.needsFarmerRole}</p>
      </>
    );
  }

  const scope = [`owner_id.eq.${account.userId}`, ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : [])];
  const [{ data: farms }, { data: open }] = await Promise.all([
    supabase.from("farms").select("id, name").or(scope.join(",")).order("created_at"),
    supabase.rpc("marketplace_open"),
  ]);

  const farmId = UUID.test(one(q.farm)) ? one(q.farm) : farms?.[0]?.id ?? "";
  const typeRaw = one(q.type);
  const kindRaw = one(q.kind);
  // A chosen type implies its kind, so "Anything" + "Tractor" still searches tractors.
  const kind = kindRaw === "equipment" || kindRaw === "service" ? kindRaw
    : (E.equipment_type as readonly string[]).includes(typeRaw) ? "equipment"
    : (E.provider_type as readonly string[]).includes(typeRaw) ? "service" : "";
  const equipmentType = kind === "equipment" && (E.equipment_type as readonly string[]).includes(typeRaw) ? typeRaw : "";
  const providerType = kind === "service" && (E.provider_type as readonly string[]).includes(typeRaw) ? typeRaw : "";
  const radius = RADII.includes(Number(one(q.radius)) as (typeof RADII)[number]) ? Number(one(q.radius)) : 30;

  let results: Result[] = [];
  if (open === true && farmId) {
    const { data } = await supabase.rpc("nearby_listings_for_farm", {
      p_farm: farmId,
      p_radius_km: radius,
      ...(kind ? { p_kind: kind } : {}),
      ...(equipmentType ? { p_equipment_type: equipmentType as (typeof E.equipment_type)[number] } : {}),
      ...(providerType ? { p_provider_type: providerType as (typeof E.provider_type)[number] } : {}),
    });
    results = (data ?? []) as unknown as Result[];
  }
  const searched = Boolean(one(q.farm));

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{f.title}</h1>
        <p className="mt-2 text-muted">{f.intro}</p>
      </div>

      {(farms ?? []).length === 0 ? (
        <p>
          {f.needsFarm}{" "}
          <Link href={`/${lang}/account/farms`} className="font-semibold text-leaf-700 underline">{t.acct.nav.farms}</Link>
        </p>
      ) : open !== true ? (
        <p role="note" className="rounded-md border-l-4 border-node-500 bg-node-50 p-3">{f.marketplaceClosed}</p>
      ) : (
        <>
          <Card>
            <form method="get" className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="find-farm" label={f.farm}>
                <Select id="find-farm" name="farm" defaultValue={farmId}>
                  {(farms ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </Select>
              </Field>
              <Field id="find-kind" label={f.what}>
                <Select id="find-kind" name="kind" defaultValue={kind}>
                  <option value="">{f.anything}</option>
                  <option value="equipment">{f.equipment}</option>
                  <option value="service">{f.service}</option>
                </Select>
              </Field>
              <Field id="find-type" label={f.type}>
                <Select id="find-type" name="type" defaultValue={equipmentType || providerType}>
                  <option value="">{f.anyType}</option>
                  <optgroup label={f.equipment}>
                    {Object.entries(t.equipmentTypes).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </optgroup>
                  <optgroup label={f.service}>
                    {Object.entries(t.providerTypes).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </optgroup>
                </Select>
              </Field>
              <Field id="find-radius" label={f.radius}>
                <Select id="find-radius" name="radius" defaultValue={String(radius)}>
                  {RADII.map((r) => <option key={r} value={r}>{r} km</option>)}
                </Select>
              </Field>
              <Button type="submit" className="sm:col-span-2 lg:col-span-4 lg:justify-self-start">{f.search}</Button>
            </form>
          </Card>

          {searched && (
            <section aria-live="polite" className="flex flex-col gap-4">
              <p className="font-semibold">{fill(f.results, { count: String(results.length) })}</p>
              {results.length === 0 ? (
                <p className="text-muted">{f.none}</p>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {results.map((r) => (
                    <li key={r.listing_id}>
                      <Card className="flex h-full flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="text-lg font-bold">{r.title}</h2>
                          <span className="shrink-0 text-sm font-semibold text-muted tabular-nums">
                            {fill(f.away, { km: Number(r.distance_km).toLocaleString(lang === "yo" ? "yo-NG" : "en-NG", { maximumFractionDigits: 1 }) })}
                          </span>
                        </div>
                        <p className="text-muted">
                          {r.kind === "equipment"
                            ? t.equipmentTypes[r.equipment_type as keyof typeof t.equipmentTypes]
                            : t.providerTypes[r.provider_type as keyof typeof t.providerTypes]}
                          {" · "}{fill(f.byProvider, { name: r.provider.name })}
                          {r.provider.state ? `, ${r.provider.state}` : ""}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {r.provider.tier >= 2 && <Badge className="bg-leaf-100 text-leaf-800">✓ {f.verified}</Badge>}
                          {r.kind === "equipment" && r.operator_included && <Badge className="bg-node-50 text-node-700">{f.operator}</Badge>}
                        </div>
                        {r.description && <p className="line-clamp-3">{r.description}</p>}
                        <p className="flex flex-wrap gap-x-4 gap-y-1 font-semibold tabular-nums">
                          {Object.entries(r.rates).map(([u, k]) => (
                            <span key={u}>{formatNaira(k)} {t.units[u as keyof typeof t.units]}</span>
                          ))}
                        </p>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-muted">{f.bookingSoon}</p>
            </section>
          )}
        </>
      )}
    </>
  );
}
