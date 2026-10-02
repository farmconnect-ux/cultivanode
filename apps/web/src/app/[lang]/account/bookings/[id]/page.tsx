import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import {
  BookingActions, CheckInButton, ConfirmDispute, FinishWork, MarkPaidForm, ProofFlow, RatingForm,
} from "@/components/account/booking-forms";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { BOOKING_TONE, qty, type BookingDetail } from "@/lib/account/bookings";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill, formatDateTime, formatDay, localPhone } from "@/lib/text";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n}/5`} className="text-harvest-500">
      {"★".repeat(n)}<span className="text-line">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default async function BookingPage({ params }: PageProps<"/[lang]/account/bookings/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang) || !UUID.test(id)) notFound();
  const account = await requireAccount(lang);
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

  // Signed links for the proof photos (private bucket; the database already checked who may see them).
  const signed = new Map<string, string>();
  if (x.proofs.length) {
    const { data: urls } = await supabase.storage.from("booking-proofs")
      .createSignedUrls(x.proofs.map((p) => p.path), 3600);
    for (const u of urls ?? []) if (u.signedUrl && u.path) signed.set(u.path, u.signedUrl);
  }

  const name = x.other?.name || "—";
  const phone = x.other?.phone ?? null;
  const place = [x.job_lga, x.job_state].filter(Boolean).join(", ");
  const typeLabel = x.kind === "equipment"
    ? t.equipmentTypes[x.equipment_type as keyof typeof t.equipmentTypes]
    : t.providerTypes[x.provider_type as keyof typeof t.providerTypes];
  const showPlace = x.my_side === "provider"
    && !["accepted", "in_progress", "awaiting_confirmation", "confirmed", "disputed", "completed"].includes(x.status);

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
      {x.status === "awaiting_confirmation" && x.my_side === "farmer" && x.confirm_by && (
        <p role="note" className="rounded-md border-l-4 border-harvest-500 bg-harvest-50 p-3 font-semibold">
          {fill(b.confirmPrompt, { time: formatDateTime(x.confirm_by, lang) })}
        </p>
      )}
      {x.status === "disputed" && (
        <p role="alert" className="rounded-md border-l-4 border-danger bg-red-50 p-3">
          {fill(b.disputedNote, { reason: x.dispute_reason ?? "" })}
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
          <dd>{showPlace ? place || "—" : [x.farm_name, place].filter(Boolean).join(" · ")}</dd>
          <dt className="font-semibold">{b.distance}</dt>
          <dd>{x.distance_km} km</dd>
          {x.hectares_done && (
            <>
              <dt className="font-semibold">{b.hectaresDone}</dt>
              <dd className="tabular-nums">{qty(x.hectares_done)} ha</dd>
            </>
          )}
          {x.farmer_note && (
            <>
              <dt className="font-semibold">{b.note}</dt>
              <dd className="whitespace-pre-line">{x.farmer_note}</dd>
            </>
          )}
        </dl>
        <p className="text-sm text-muted">{b.payDirect}</p>
      </Card>

      {(x.can.check_in || x.checked_in_at || (x.my_side === "farmer" && ["accepted", "in_progress"].includes(x.status))) && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">{b.jobDay}</h2>
          {x.checked_in_at ? (
            <p>
              {fill(b.checkedInAt, { time: formatDateTime(x.checked_in_at, lang) })}
              {x.check_in_distance_m !== null && (
                <span className="ml-2 text-sm text-muted">
                  {fill(b.checkInDistance, { m: String(x.check_in_distance_m) })}
                </span>
              )}
            </p>
          ) : x.my_side === "farmer" ? (
            <p className="text-muted">{b.waitingCheckIn}</p>
          ) : null}
          {x.can.check_in && <CheckInButton lang={lang} t={t.acct} id={x.id} />}
        </Card>
      )}

      {(x.proofs.length > 0 || x.can.submit_proof) && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{b.proofTitle}</h2>
          {x.proofs.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {x.proofs.map((p) => (
                <li key={p.id} className="flex flex-col gap-1">
                  {signed.get(p.path) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset
                    <img src={signed.get(p.path)} alt={b.proofKinds[p.kind]} className="aspect-square w-full rounded-md object-cover" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-md bg-cream text-sm text-muted">{b.proofKinds[p.kind]}</div>
                  )}
                  <span className="text-sm">
                    <span className="font-semibold">{b.proofKinds[p.kind]}</span>
                    {p.gps_distance_m !== null && <span className="ml-1 text-muted">✓ GPS</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {x.can.submit_proof && (
            <>
              <ProofFlow lang={lang} t={t.acct} id={x.id} userId={account.userId}
                         hasBefore={x.proofs.some((p) => p.kind === "before")}
                         hasAfter={x.proofs.some((p) => p.kind === "after")} />
              <FinishWork lang={lang} t={t.acct} id={x.id}
                          ready={x.proofs.some((p) => p.kind === "before") && x.proofs.some((p) => p.kind === "after")} />
            </>
          )}
        </Card>
      )}

      {x.my_side === "farmer" && (x.can.confirm || x.can.dispute) && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{b.yourAnswer}</h2>
          <p className="text-muted">{b.confirmHint}</p>
          <ConfirmDispute lang={lang} t={t.acct} id={x.id} confirmBy={x.confirm_by} />
        </Card>
      )}

      {["confirmed", "completed"].includes(x.status) && x.my_side !== "staff" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{b.payment}</h2>
          {x.payment.disputed ? (
            <p role="alert" className="rounded-md border-l-4 border-danger bg-red-50 p-3">{b.paymentMismatch}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              <li>{x.payment.mine && "kobo" in x.payment.mine
                ? fill(b.youMarked, { amount: formatNaira(x.payment.mine.kobo) })
                : b.youNotMarked}</li>
              <li className="text-muted">{x.payment.theirs_marked ? b.theyMarked : b.theyNotMarked}</li>
            </ul>
          )}
          {x.can.mark_paid && <MarkPaidForm lang={lang} t={t.acct} id={x.id} totalKobo={x.total_kobo} side={x.my_side as "farmer" | "provider"} />}
        </Card>
      )}

      {(x.my_rating || x.their_rating || x.can.rate) && x.my_side !== "staff" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{b.ratings}</h2>
          {x.my_rating && (
            <p><Stars n={x.my_rating.stars} /> <span className="ml-2 text-sm text-muted">{b.yourRating}</span>
              {x.my_rating.comment && <span className="block">“{x.my_rating.comment}”</span>}</p>
          )}
          {x.their_rating && (
            <p><Stars n={x.their_rating.stars} /> <span className="ml-2 text-sm text-muted">{b.theirRating}</span>
              {x.their_rating.comment && <span className="block">“{x.their_rating.comment}”</span>}</p>
          )}
          {x.can.rate && <RatingForm lang={lang} t={t.acct} id={x.id} name={name} />}
        </Card>
      )}

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
              <span className="font-semibold">{b.events[e.event as keyof typeof b.events] ?? e.event}</span> {b.by[e.by]}
              <span className="block text-sm text-muted">{formatDateTime(e.at, lang)}</span>
              {e.note && <span className="block text-sm">“{e.note}”</span>}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
