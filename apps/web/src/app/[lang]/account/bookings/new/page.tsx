import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestForm } from "@/components/account/booking-forms";
import { ServiceRequestWizard } from "@/components/account/service-request-wizard";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

type ForBooking = {
  id: string;
  title: string;
  description: string | null;
  kind: "equipment" | "service";
  equipment_type: string | null;
  provider_type: string | null;
  operator_included: boolean;
  service_radius_km: number;
  rates: Record<string, number>;
  provider: { name: string; state: string | null; tier: number };
  farm: { id: string; name: string };
  distance_km: number;
  in_range: boolean;
  today: string;
};

export default async function NewBookingPage({ params, searchParams }: PageProps<"/[lang]/account/bookings/new">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const k = t.acct.book;
  const q = await searchParams;
  const listingId = one(q.listing);
  const farmId = one(q.farm);
  const supabase = await createClient();

  // If user is requesting without a specific listing, launch the 5-step guided wizard!
  if (!listingId) {
    const scope = [
      `owner_id.eq.${account.userId}`,
      ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
    ];
    const { data: farms } = await supabase
      .from("farms")
      .select("id, name, state, lga, area_ha")
      .or(scope.join(","))
      .order("created_at");

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href={`/${lang}/account?ws=farmer`} className="font-semibold text-leaf-700 underline">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold text-leaf-800">Request a Field Service</h1>
          <p className="mt-1 text-muted">Guided 5-step booking for verified tractors, implements, and agronomy operators.</p>
        </div>

        {account.profile.verification_tier < 1 && (
          <p role="note" className="rounded-md border-l-4 border-harvest-500 bg-harvest-50 p-3">
            {k.tierNeeded}{" "}
            <Link href={`/${lang}/account/verification?ws=farmer`} className="font-semibold text-leaf-700 underline">
              {k.verifyNow}
            </Link>
          </p>
        )}

        <ServiceRequestWizard lang={lang} farms={farms ?? []} t={t} />
      </div>
    );
  }

  // Otherwise, user is booking a specific listing
  const back = `/${lang}/account/find${UUID.test(farmId) ? `?farm=${farmId}` : ""}`;
  const header = (
    <div>
      <Link href={back} className="font-semibold text-leaf-700 underline">← {k.backToSearch}</Link>
      <h1 className="mt-3 text-3xl font-extrabold text-leaf-800">{k.title}</h1>
      <p className="mt-2 text-muted">{k.intro}</p>
    </div>
  );

  if (!account.isFarmer) return <>{header}<p>{t.acct.bookingErrors.farmer_role_needed}</p></>;
  if (account.profile.verification_tier < 1) {
    return (
      <>
        {header}
        <p role="note" className="rounded-md border-l-4 border-harvest-500 bg-harvest-50 p-3">
          {k.tierNeeded}{" "}
          <Link href={`/${lang}/account/verification`} className="font-semibold text-leaf-700 underline">{k.verifyNow}</Link>
        </p>
      </>
    );
  }
  if (!UUID.test(listingId) || !UUID.test(farmId)) return <>{header}<p>{k.notAvailable}</p></>;

  const { data, error } = await supabase.rpc("listing_for_booking", { p_listing: listingId, p_farm: farmId });
  if (error || !data) return <>{header}<p role="alert">{k.notAvailable}</p></>;
  const x = data as unknown as ForBooking;
  const typeLabel = x.kind === "equipment"
    ? t.equipmentTypes[x.equipment_type as keyof typeof t.equipmentTypes]
    : t.providerTypes[x.provider_type as keyof typeof t.providerTypes];

  return (
    <>
      {header}
      <Card className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">{x.title}</h2>
        <p className="text-muted">
          {typeLabel} · {fill(t.acct.find.byProvider, { name: x.provider.name })}{x.provider.state ? `, ${x.provider.state}` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {x.provider.tier >= 2 && <Badge className="bg-leaf-100 text-leaf-800">✓ {t.acct.find.verified}</Badge>}
          {x.kind === "equipment" && x.operator_included && <Badge className="bg-node-50 text-node-700">{t.acct.find.operator}</Badge>}
        </div>
        {x.description && <p className="whitespace-pre-line">{x.description}</p>}
        <p className="text-sm text-muted">{fill(k.forFarm, { farm: x.farm.name })} · {fill(k.distance, { km: x.distance_km })}</p>
      </Card>

      {x.in_range ? (
        <Card>
          <RequestForm lang={lang} t={t.acct} units={t.units} listingId={x.id} farmId={x.farm.id} rates={x.rates} today={x.today} />
        </Card>
      ) : (
        <p role="alert" className="rounded-md border-l-4 border-danger bg-red-50 p-3">
          {fill(k.outOfRange, { km: x.distance_km, radius: x.service_radius_km })}
        </p>
      )}
    </>
  );
}
