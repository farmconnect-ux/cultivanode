import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { Alert, Badge, Card } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { BOOKING_TONE, qty, type BookingSummary } from "@/lib/account/bookings";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill, formatDateTime, formatDay } from "@/lib/text";

export default async function BookingsPage({ params }: PageProps<"/[lang]/account/bookings">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const b = t.acct.bookings;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_bookings", { p_limit: 200 });
  const all = (data ?? []) as unknown as BookingSummary[];
  const toMe = all.filter((x) => x.my_side === "provider");
  const mine = all.filter((x) => x.my_side === "farmer");
  const isProvider = account.isOwner || account.serviceTypes.length > 0;

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{b.title}</h1>
        <p className="mt-2 text-muted">{b.intro}</p>
      </div>
      {error && <Alert tone="danger">{t.acct.bookingErrors.errorGeneric}</Alert>}

      {(isProvider || toMe.length > 0) && (
        <section aria-labelledby="to-me-h" className="flex flex-col gap-3">
          <h2 id="to-me-h" className="text-2xl font-bold">{b.asProvider}</h2>
          <BookingList lang={lang} t={t} items={toMe} />
        </section>
      )}
      {(account.isFarmer || mine.length > 0) && (
        <section aria-labelledby="mine-h" className="flex flex-col gap-3">
          <h2 id="mine-h" className="text-2xl font-bold">{b.asFarmer}</h2>
          <BookingList lang={lang} t={t} items={mine} />
          {account.isFarmer && (
            <Link href={`/${lang}/account/find`} className="font-semibold text-leaf-700 underline">{b.findHelp}</Link>
          )}
        </section>
      )}
    </>
  );
}

function BookingList({ lang, t, items }: { lang: Locale; t: Dictionary; items: BookingSummary[] }) {
  const b = t.acct.bookings;
  if (items.length === 0) return <p className="text-muted">{b.none}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((x) => {
        const place = [x.job_lga, x.job_state].filter(Boolean).join(", ");
        return (
          <li key={x.id}>
            <Card className="flex flex-col gap-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-bold">
                  <Link href={`/${lang}/account/bookings/${x.id}`} className="text-leaf-800 underline decoration-leaf-300 underline-offset-4">
                    {x.title}
                  </Link>
                </h3>
                <Badge className={BOOKING_TONE[x.status]}>{t.bookingStatus[x.status]}</Badge>
              </div>
              <p className="font-semibold">{formatDay(x.job_date, lang)}</p>
              <p className="text-muted">
                {fill(x.my_side === "provider" ? b.from : b.withName, { name: x.other_name || "—" })}
                {x.my_side === "provider" && place ? ` · ${place}` : ""}
                {x.my_side === "farmer" ? ` · ${x.farm_name}` : ""}
                {` · ${x.distance_km} km`}
              </p>
              <p className="tabular-nums">
                {qty(x.quantity)} × {formatNaira(x.rate_kobo)} {t.units[x.unit]} = <strong>{formatNaira(x.total_kobo)}</strong>
              </p>
              {x.status === "requested" && x.my_side === "provider" && (
                <p className="text-sm font-semibold text-harvest-700">{fill(b.answerBy, { time: formatDateTime(x.expires_at, lang) })}</p>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
