import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { ListingControls, ListingForm, type MyListing } from "@/components/account/listing-forms";
import { Alert, Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

const STATUS_TONE: Record<MyListing["status"], string> = {
  draft: "bg-line/60 text-ink",
  active: "bg-leaf-100 text-leaf-800",
  paused: "bg-harvest-100 text-harvest-700",
  suspended: "bg-red-50 text-danger",
};

export default async function ListingsPage({ params }: PageProps<"/[lang]/account/listings">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const l = t.acct.listings;
  const supabase = await createClient();

  const canList = account.isOwner || account.serviceTypes.length > 0;
  const [{ data: listingsJson }, { data: open }] = await Promise.all([
    supabase.rpc("my_listings"),
    supabase.rpc("marketplace_open"),
  ]);
  const listings = (listingsJson ?? []) as MyListing[];
  const tierOk = account.profile.verification_tier >= 2;
  const canPublish = canList && tierOk && open === true && !account.profile.suspended_at;

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{l.title}</h1>
        <p className="mt-2 text-muted">{l.intro}</p>
      </div>

      {!canList ? (
        <Alert tone="danger">{l.needsRole}</Alert>
      ) : (
        <>
          {!tierOk && <p role="note" className="rounded-md border-l-4 border-harvest-500 bg-harvest-50 p-3">{l.needsTier}</p>}
          {tierOk && open !== true && <p role="note" className="rounded-md border-l-4 border-node-500 bg-node-50 p-3">{l.marketplaceClosed}</p>}

          {listings.length === 0 ? (
            <p className="text-muted">{l.none}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {listings.map((x) => (
                <li key={x.id}>
                  <Card className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-bold">{x.title}</h2>
                        <p className="text-muted">
                          {x.kind === "equipment"
                            ? t.equipmentTypes[x.equipment_type as keyof typeof t.equipmentTypes]
                            : t.providerTypes[x.provider_type as keyof typeof t.providerTypes]}
                          {" · "}{x.service_radius_km} km
                        </p>
                      </div>
                      <Badge className={STATUS_TONE[x.status]}>{t.listingStatus[x.status]}</Badge>
                    </div>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 font-semibold tabular-nums">
                      {Object.entries(x.rates).map(([u, k]) => (
                        <span key={u}>{formatNaira(k)} {t.units[u as keyof typeof t.units]}</span>
                      ))}
                    </p>
                    {x.status === "suspended" && (
                      <p className="text-danger">{fill(l.suspendedNote, { reason: x.suspended_reason ?? "" })}</p>
                    )}
                    <ListingControls lang={lang} t={t} listing={x} canPublish={canPublish} />
                    {x.status !== "suspended" && (
                      <details className="rounded-md border-2 border-line p-3">
                        <summary className="cursor-pointer font-semibold">{l.edit}</summary>
                        <div className="mt-4">
                          <ListingForm lang={lang} t={t} listing={x} equipmentAllowed={account.isOwner}
                                       serviceTypes={account.serviceTypes} canPublish={canPublish} />
                        </div>
                      </details>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}

          {/* Service Area Card (Section 9) */}
          <Card className="flex flex-col gap-4 border border-line bg-earth-50/50">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-bold text-leaf-900">Service Area &amp; Dispatch Geography</h2>
                <p className="text-xs text-muted">Controls which jobs match your equipment in the marketplace radius.</p>
              </div>
              <Badge className="bg-leaf-100 text-leaf-800">Operational Matching: Active</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Maximum Travel Distance</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-ink">50 km</span>
                  <span className="text-xs text-muted">from base station ({account.profile.state ?? "Oyo"})</span>
                </div>
                <p className="text-xs text-leaf-700">Covers standard rural cluster radii in South-West corridor.</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Operating Pilot States</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded bg-leaf-600 px-2.5 py-1 text-xs font-bold text-white">Oyo (Active)</span>
                  <span className="rounded bg-leaf-100 px-2.5 py-1 text-xs font-bold text-leaf-800">Osun</span>
                  <span className="rounded bg-leaf-100 px-2.5 py-1 text-xs font-bold text-leaf-800">Ogun</span>
                  <span className="rounded bg-line/60 px-2.5 py-1 text-xs font-medium text-muted">Kwara (Expansion)</span>
                </div>
              </div>
            </div>
          </Card>

          {!account.profile.suspended_at && tierOk && (
            <Card className="flex flex-col gap-3">
              <h2 className="text-xl font-bold">{l.add}</h2>
              <ListingForm lang={lang} t={t} equipmentAllowed={account.isOwner} serviceTypes={account.serviceTypes} canPublish={canPublish} />
            </Card>
          )}
        </>
      )}
    </>
  );
}
