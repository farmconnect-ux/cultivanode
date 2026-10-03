"use client";

import { useState, useTransition } from "react";
import { formatNaira } from "@cultivanode/shared";
import {
  addDisputeEvidence, answerBooking, checkInBooking, confirmWork, disputeBooking, finishWork,
  markInboxRead, markPaid, rateBooking, requestBooking, submitProof,
} from "@/actions/bookings";
import type { ActionState } from "@/actions/account";
import { Button, Field, Input, Select, TextArea } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { DISPUTE_CATEGORIES } from "@/lib/account/bookings";
import { createClient } from "@/lib/supabase/client";
import { fill } from "@/lib/text";
import { ActionForm, messageFor } from "./action-form";

type Acct = Dictionary["acct"];
type Units = Dictionary["units"];
type Bookings = Acct["bookings"];
type Errors = Acct["bookingErrors"];

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The request form: day, unit, amount and a note, with the estimated total from the listing's price. */
export function RequestForm({
  lang, t, units, listingId, farmId, rates, today,
}: {
  lang: Locale;
  t: Pick<Acct, "book" | "bookingErrors">;
  units: Units;
  listingId: string;
  farmId: string;
  rates: Record<string, number>;
  today: string;
}) {
  const b = t.book;
  const offered = Object.keys(rates) as (keyof Units)[];
  const [unit, setUnit] = useState<keyof Units>(offered[0]);
  const [quantity, setQuantity] = useState("1");
  const qty = Number(quantity.replace(",", "."));
  const estimate = Number.isFinite(qty) && qty > 0 && qty <= 10000 ? Math.round(rates[unit] * Math.round(qty * 100) / 100) : null;

  return (
    <ActionForm action={requestBooking} hidden={{ lang, listing: listingId, farm: farmId }} messages={[t.bookingErrors]}>
      {(pending) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="book-date" label={b.date} hint={b.dateHint}>
              <Input id="book-date" name="job_date" type="date" required min={today} max={addDays(today, 60)}
                     defaultValue={addDays(today, 1)} aria-describedby="book-date-hint" />
            </Field>
            <Field id="book-unit" label={b.unit}>
              <Select id="book-unit" name="unit" value={unit} onChange={(e) => setUnit(e.target.value as keyof Units)}>
                {offered.map((u) => <option key={u} value={u}>{formatNaira(rates[u])} {units[u]}</option>)}
              </Select>
            </Field>
            <Field id="book-qty" label={b.quantity} hint={b.quantityHints[unit]}>
              <Input id="book-qty" name="quantity" inputMode="decimal" required value={quantity}
                     onChange={(e) => setQuantity(e.target.value)} aria-describedby="book-qty-hint" />
            </Field>
          </div>
          <div role="status" aria-live="polite" className="rounded-md bg-leaf-50 p-4">
            <p className="text-lg font-bold tabular-nums">{estimate !== null ? fill(b.estimate, { total: formatNaira(estimate) }) : " "}</p>
            <p className="text-sm text-muted">{b.estimateHint}</p>
          </div>
          <Field id="book-note" label={b.note} hint={b.noteHint}>
            <TextArea id="book-note" name="note" maxLength={500} placeholder={b.notePlaceholder} className="min-h-24"
                      aria-describedby="book-note-hint" />
          </Field>
          <Button type="submit" disabled={pending} className="self-start">{pending ? b.sending : b.submit}</Button>
        </>
      )}
    </ActionForm>
  );
}

/** Accept, decline or call off, as the booking allows (the database decides; this only offers what it said). */
export function BookingActions({
  lang, t, id, can, status,
}: {
  lang: Locale;
  t: Pick<Acct, "bookings" | "bookingErrors">;
  id: string;
  can: { accept: boolean; decline: boolean; cancel: boolean };
  status: string;
}) {
  const b = t.bookings;
  const msgs = [t.bookingErrors];
  if (!can.accept && !can.decline && !can.cancel) return null;
  return (
    <div className="flex flex-col gap-6">
      {can.accept && (
        <ActionForm action={answerBooking} hidden={{ lang, id, do: "accept" }} messages={msgs} success={b.done}>
          {(pending) => <Button type="submit" disabled={pending} className="self-start">{pending ? b.accepting : b.accept}</Button>}
        </ActionForm>
      )}
      {can.decline && (
        <ActionForm action={answerBooking} hidden={{ lang, id, do: "decline" }} messages={msgs} success={b.done}>
          {(pending) => (
            <>
              <Field id={`decline-${id}`} label={b.declineReason}>
                <Input id={`decline-${id}`} name="reason" maxLength={500} />
              </Field>
              <Button type="submit" variant="secondary" disabled={pending} className="self-start">{b.decline}</Button>
            </>
          )}
        </ActionForm>
      )}
      {can.cancel && (
        <ActionForm action={answerBooking} hidden={{ lang, id, do: "cancel" }} messages={msgs} success={b.done}>
          {(pending) => (
            <>
              {status === "accepted" && (
                <Field id={`cancel-${id}`} label={b.cancelReason} hint={b.cancelReasonHint}>
                  <Input id={`cancel-${id}`} name="reason" minLength={5} maxLength={500} required aria-describedby={`cancel-${id}-hint`} />
                </Field>
              )}
              <Button type="submit" variant="secondary" disabled={pending} className="self-start">
                {status === "accepted" ? b.cancelJob : b.cancelRequest}
              </Button>
            </>
          )}
        </ActionForm>
      )}
    </div>
  );
}

export function MarkAllRead({ lang, t }: { lang: Locale; t: Pick<Acct, "inbox" | "bookingErrors"> }) {
  return (
    <ActionForm action={markInboxRead} hidden={{ lang }} messages={[t.bookingErrors]} success={t.inbox.marked}>
      {(pending) => <Button type="submit" variant="secondary" disabled={pending} className="self-start">{t.inbox.markAll}</Button>}
    </ActionForm>
  );
}

/* ------------------------------------------------------------------ MVP week 3: the job itself */

/** The phone's GPS, or null (best effort, 8 seconds). */
function locate(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}

/** One message line under an imperative action. */
function Note({ state, b, errors }: { state: ActionState | null; b: Bookings; errors: Errors }) {
  if (!state?.at) return null;
  const text = state.ok ? (state.message ? messageFor(state.message, [b, errors]) : b.done)
                        : messageFor(state.error, [errors]);
  return (
    <p key={state.at} role={state.ok ? "status" : "alert"} className={state.ok ? "font-medium text-leaf-700" : "font-medium text-danger"}>
      {text}
    </p>
  );
}

/** The provider checks in on the job day: the browser's GPS is sent with the tap. */
export function CheckInButton({ lang, t, id }: { lang: Locale; t: Pick<Acct, "bookings" | "bookingErrors">; id: string }) {
  const b = t.bookings;
  const [state, setState] = useState<ActionState | null>(null);
  const [pending, start] = useTransition();

  const checkIn = () => start(async () => {
    const c = await locate();
    if (!c) { setState({ ok: false, error: "no_gps", at: Date.now() }); return; }
    const form = new FormData();
    form.set("lang", lang);
    form.set("id", id);
    form.set("lat", String(c.lat));
    form.set("lng", String(c.lng));
    setState(await checkInBooking({} as ActionState, form));
  });

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={checkIn} disabled={pending} className="self-start">
        {pending ? b.checkingIn : b.checkIn}
      </Button>
      <p className="text-sm text-muted">{b.checkInHint}</p>
      <Note state={state} b={b} errors={t.bookingErrors} />
    </div>
  );
}

/** Re-encode a photo on a canvas: strips EXIF (including any embedded GPS) and shrinks it for 3G. */
async function stripPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.85));
}

/** Proof photos: before and after, taken at the farm. Uploaded EXIF-free, then recorded with time and GPS. */
export function ProofFlow({
  lang, t, id, userId, hasBefore, hasAfter,
}: {
  lang: Locale;
  t: Pick<Acct, "bookings" | "bookingErrors">;
  id: string;
  userId: string;
  hasBefore: boolean;
  hasAfter: boolean;
}) {
  const b = t.bookings;
  const [state, setState] = useState<ActionState | null>(null);
  const [busy, setBusy] = useState<"before" | "after" | "extra" | null>(null);
  const [counts, setCounts] = useState({ before: hasBefore, after: hasAfter });

  const addPhoto = (kind: "before" | "after" | "extra") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(kind);
    setState(null);
    try {
      const [blob, c] = await Promise.all([stripPhoto(file), locate()]);
      const path = `${id}/${userId}/${crypto.randomUUID()}.jpg`;
      const { error: up } = await createClient().storage.from("booking-proofs").upload(path, blob, { contentType: "image/jpeg" });
      if (up) { setState({ ok: false, error: "proof_not_found", at: Date.now() }); return; }
      const form = new FormData();
      form.set("lang", lang);
      form.set("id", id);
      form.set("path", path);
      form.set("kind", kind);
      form.set("taken_at", new Date().toISOString());
      if (c) { form.set("lat", String(c.lat)); form.set("lng", String(c.lng)); }
      const result = await submitProof({} as ActionState, form);
      setState(result);
      if (result.ok && kind !== "extra") setCounts((old) => ({ ...old, [kind]: true }));
    } catch {
      setState({ ok: false, error: "errorGeneric", at: Date.now() });
    } finally {
      setBusy(null);
    }
  };

  const row = (kind: "before" | "after", label: string, done: boolean) => (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold">{label}{done && <span className="ml-2 text-leaf-700" aria-label={b.photoAdded}>✓</span>}</span>
      <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-leaf-700 px-4 font-semibold text-white">
        {busy === kind ? b.uploading : done ? b.replacePhoto : b.addPhoto}
        <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy !== null}
               onChange={addPhoto(kind)} aria-label={label} />
      </label>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {row("before", b.photoBefore, counts.before)}
      {row("after", b.photoAfter, counts.after)}
      <p className="text-sm text-muted">{b.proofHint}</p>
      <Note state={state} b={b} errors={t.bookingErrors} />
    </div>
  );
}

/** The provider hands the job over: at least a before and an after photo must be in. */
export function FinishWork({ lang, t, id, ready }: { lang: Locale; t: Pick<Acct, "bookings" | "bookingErrors">; id: string; ready: boolean }) {
  const b = t.bookings;
  return (
    <ActionForm action={finishWork} hidden={{ lang, id }} messages={[t.bookingErrors]} success={b.done}>
      {(pending) => (
        <>
          <Field id={`ha-${id}`} label={b.hectaresLabel} hint={b.hectaresHint}>
            <Input id={`ha-${id}`} name="hectares" inputMode="decimal" aria-describedby={`ha-${id}-hint`} />
          </Field>
          <Button type="submit" disabled={pending || !ready} className="self-start"
                  title={!ready ? b.proofNeededHint : undefined}>
            {pending ? b.sending : b.finishWork}
          </Button>
        </>
      )}
    </ActionForm>
  );
}

/** The farmer checks the proof and confirms, or opens a dispute with a reason. */
/** The farmer checks the proof and confirms the work. */
export function ConfirmWork({ lang, t, id }: { lang: Locale; t: Pick<Acct, "bookings" | "bookingErrors">; id: string }) {
  const b = t.bookings;
  return (
    <ActionForm action={confirmWork} hidden={{ lang, id }} messages={[t.bookingErrors]} success={b.done}>
      {(pending) => <Button type="submit" disabled={pending} className="self-start">{pending ? b.sending : b.confirmWork}</Button>}
    </ActionForm>
  );
}

/** Either side raises a problem (master plan): one reason category, optional details; evidence photos follow. */
export function DisputeForm({ lang, t, id }: { lang: Locale; t: Pick<Acct, "bookings" | "bookingErrors">; id: string }) {
  const b = t.bookings;
  return (
    <ActionForm action={disputeBooking} hidden={{ lang, id }} messages={[t.bookingErrors]} success={b.done}>
      {(pending) => (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-semibold">{b.disputeReason}</legend>
            {DISPUTE_CATEGORIES.map((c) => (
              <label key={c} className="inline-flex min-h-11 items-center gap-3">
                <input type="radio" name="category" value={c} required className="size-5 accent-leaf-700" />
                {b.disputeCategories[c]}
              </label>
            ))}
          </fieldset>
          <Field id={`dispute-${id}`} label={b.disputeDetails} hint={b.disputeReasonHint}>
            <TextArea id={`dispute-${id}`} name="details" maxLength={500} className="min-h-20" aria-describedby={`dispute-${id}-hint`} />
          </Field>
          <Button type="submit" variant="secondary" disabled={pending} className="self-start">{b.dispute}</Button>
        </>
      )}
    </ActionForm>
  );
}

/** Evidence photos for an open dispute, from either side: stripped of EXIF, uploaded, then recorded. */
export function EvidenceUpload({ lang, t, id, userId }: {
  lang: Locale; t: Pick<Acct, "bookings" | "bookingErrors">; id: string; userId: string;
}) {
  const b = t.bookings;
  const [state, setState] = useState<ActionState | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setState(null);
    try {
      const [blob, c] = await Promise.all([stripPhoto(file), locate()]);
      const path = `${id}/${userId}/${crypto.randomUUID()}.jpg`;
      const { error: up } = await createClient().storage.from("booking-proofs").upload(path, blob, { contentType: "image/jpeg" });
      if (up) { setState({ ok: false, error: "proof_not_found", at: Date.now() }); return; }
      const form = new FormData();
      form.set("lang", lang);
      form.set("id", id);
      form.set("path", path);
      form.set("taken_at", new Date().toISOString());
      if (c) { form.set("lat", String(c.lat)); form.set("lng", String(c.lng)); }
      setState(await addDisputeEvidence({} as ActionState, form));
    } catch {
      setState({ ok: false, error: "errorGeneric", at: Date.now() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="inline-flex min-h-11 cursor-pointer items-center self-start rounded-md bg-leaf-700 px-4 font-semibold text-white">
        {busy ? b.uploading : b.addEvidence}
        <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy} onChange={add}
               aria-label={b.addEvidence} />
      </label>
      <p className="text-sm text-muted">{b.evidenceHint}</p>
      <Note state={state} b={b} errors={t.bookingErrors} />
    </div>
  );
}

/** Each side marks what was paid or received; matching amounts close the job, a mismatch flags it. */
export function MarkPaidForm({ lang, t, id, totalKobo, side }: {
  lang: Locale; t: Pick<Acct, "bookings" | "bookingErrors">; id: string; totalKobo: number; side: "farmer" | "provider";
}) {
  const b = t.bookings;
  return (
    <ActionForm action={markPaid} hidden={{ lang, id }} messages={[t.bookingErrors]} success={b.done}>
      {(pending) => (
        <>
          <Field id={`paid-${id}`} label={side === "farmer" ? b.amountPaid : b.amountReceived} hint={b.markPaidHint}>
            <Input id={`paid-${id}`} name="amount" inputMode="numeric" required
                   defaultValue={String(Math.round(totalKobo / 100))} aria-describedby={`paid-${id}-hint`} />
          </Field>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? b.sending : side === "farmer" ? b.markPaid : b.markReceived}
          </Button>
        </>
      )}
    </ActionForm>
  );
}

const POSITIVE_TAGS = ["on_time", "good_work", "careful", "fair_price", "good_communication"] as const;
const NEGATIVE_TAGS = ["late", "poor_work", "overcharged", "rude", "no_show"] as const;

/** One rating per side after confirmation: stars, tags and an optional note. */
export function RatingForm({ lang, t, id, name }: {
  lang: Locale; t: Pick<Acct, "bookings" | "bookingErrors">; id: string; name: string;
}) {
  const b = t.bookings;
  const [stars, setStars] = useState(0);
  const tags = stars >= 4 ? POSITIVE_TAGS : stars > 0 ? NEGATIVE_TAGS : [];
  return (
    <ActionForm action={rateBooking} hidden={{ lang, id }} messages={[t.bookingErrors]} success={b.done}>
      {(pending) => (
        <>
          <fieldset>
            <legend className="mb-2 font-semibold">{fill(b.rateTitle, { name })}</legend>
            <div className="flex gap-1" role="radiogroup" aria-label={b.starsLabel}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-line text-2xl">
                  <input type="radio" name="stars" value={n} required className="sr-only" onChange={() => setStars(n)} />
                  <span aria-hidden className={n <= stars ? "text-harvest-500" : "text-line"}>★</span>
                  <span className="sr-only">{n}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {tags.length > 0 && (
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">{b.tagsLabel}</legend>
              {tags.map((tag) => (
                <label key={tag} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line px-3">
                  <input type="checkbox" name="tags" value={tag} />
                  {b.tagLabels[tag]}
                </label>
              ))}
            </fieldset>
          )}
          <Field id={`rate-note-${id}`} label={b.ratingComment}>
            <TextArea id={`rate-note-${id}`} name="comment" maxLength={500} className="min-h-20" />
          </Field>
          <Button type="submit" disabled={pending || stars === 0} className="self-start">{pending ? b.sending : b.sendRating}</Button>
        </>
      )}
    </ActionForm>
  );
}
