import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { BookingActions } from "@/components/account/booking-forms";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { BOOKING_TONE, qty, type BookingDetail } from "@/lib/account/bookings";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill, formatDateTime, formatDay, localPhone } from "@/lib/text";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BookingPage({ params }: PageProps<"/[lang]/account/bookings/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang) || !UUID.test(id)) notFound();
  await requireAccount(lang);
  const t = await getDictionary(lang);
  const b = t.acct.bookings;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("booking_detail", { p_booking: id });
  if (error || !data) notFound();
  const x = data as unknown as BookingDetail;

  // Reading a booking clears its unread messages.
  await supabase.from("notifications").select("id").eq("booking_id", id).is("read_at", null).then(async ({ data: unread }) => {
    if (unread?.length) await supabase.rpc("mark_notifications_read", { p_ids: unread.map((n) => n.id) });
  });

  const name = x.other?.name || "—";
  const phone = x.other?.phone ?? null;
  const place = [x.job_lga, x.job_state].filter(Boolean).join(", ");
  const typeLabel = x.kind === "equipment"
    ? t.equipmentTypes[x.equipment_type as keyof typeof t.equipmentTypes]
    : t.providerTypes[x.provider_type as keyof typeof t.providerTypes];

  return (
    <>
      <Link href={`/${lang}/account/bookings`} className="font-semibold text-leaf-700 underline">← {b.back}</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-800">{x.title}</h1>
          <p className="mt-1 text-muted">{typeLabel}</p>
        </div>
        <Badge className={BOOKING_TONE[x.status]}>{t.bookingStatus[x.status]}</Badge>
      </div>

      {x.status === "requested" && x.my_side === "farmer" && (
        <p role="note" className="rounded-md border-l-4 border-harvest-500 bg-harvest-50 p-3">
          {fill(b.waitingForProvider, { name, time: formatDateTime(x.expires_at, lang) })}
        </p>
      )}
      {x.status === "accepted" && x.my_side !== "staff" && (
        <p role="note" className="rounded-md border-l-4 border-leaf-600 bg-leaf-50 p-3 font-semibold">
          {x.my_side === "farmer" ? fill(b.agreedFarmer, { name }) : b.agreedProvider}
        </p>
      )}
      {x.closed_reason && (x.status === "declined" || x.status === "cancelled") && (
        <p className="rounded-md bg-cream p-3">{fill(b.closedReason, { reason: x.closed_reason })}</p>
      )}

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{b.job}</h2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold">{b.date}</dt>
          <dd>{formatDay(x.job_date, lang)}</dd>
          <dt className="font-semibold">{b.amount}</dt>
          <dd className="tabular-nums">{qty(x.quantity)} × {formatNaira(x.rate_kobo)} {t.units[x.unit]}</dd>
          <dt className="font-semibold">{b.total}</dt>
          <dd className="text-lg font-bold tabular-nums">{formatNaira(x.total_kobo)}</dd>
          <dt className="font-semibold">{b.farm}</dt>
          <dd>{x.my_side === "provider" && x.status !== "accepted" ? place || "—" : [x.farm_name, place].filter(Boolean).join(" · ")}</dd>
          <dt className="font-semibold">{b.distance}</dt>
          <dd>{x.distance_km} km</dd>
          {x.farmer_note && (
            <>
              <dt className="font-semibold">{b.note}</dt>
              <dd className="whitespace-pre-line">{x.farmer_note}</dd>
            </>
          )}
        </dl>
        <p className="text-sm text-muted">{b.payDirect}</p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{b.contact}</h2>
        <p className="font-semibold">{name}</p>
        {phone ? (
          <a href={`tel:+${phone}`} className="inline-flex min-h-11 items-center self-start rounded-md bg-leaf-700 px-4 font-semibold text-white">
            {fill(b.call, { phone: localPhone(phone) })}
          </a>
        ) : x.my_side === "provider" && x.status === "requested" ? (
          <p className="text-muted">{b.hiddenUntilAccepted}</p>
        ) : null}
        {x.location && (x.my_side !== "farmer" || x.status === "accepted") && (
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">{b.location}</h3>
            {x.location.hint && <p>{x.location.hint}</p>}
            <a href={`https://www.google.com/maps/search/?api=1&query=${x.location.lat},${x.location.lng}`}
               target="_blank" rel="noopener noreferrer" className="font-semibold text-leaf-700 underline">
              {b.directions}
            </a>
          </div>
        )}
      </Card>

      {x.my_side !== "staff" && (
        <BookingActions lang={lang} t={t.acct} id={x.id} can={x.can} status={x.status} />
      )}

      <section aria-labelledby="history-h" className="flex flex-col gap-2">
        <h2 id="history-h" className="text-xl font-bold">{b.history}</h2>
        <ol className="flex flex-col gap-2 border-l-2 border-line pl-4">
          {x.events.map((e, i) => (
            <li key={i}>
              <span className="font-semibold">{b.events[e.event]}</span> {b.by[e.by]}
              <span className="block text-sm text-muted">{formatDateTime(e.at, lang)}</span>
              {e.note && <span className="block text-sm">“{e.note}”</span>}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
