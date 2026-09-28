"use client";

import { useState } from "react";
import { formatNaira } from "@cultivanode/shared";
import { answerBooking, markInboxRead, requestBooking } from "@/actions/bookings";
import { Button, Field, Input, Select, TextArea } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { fill } from "@/lib/text";
import { ActionForm } from "./action-form";

type Acct = Dictionary["acct"];
type Units = Dictionary["units"];

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
            <p className="text-lg font-bold tabular-nums">{estimate !== null ? fill(b.estimate, { total: formatNaira(estimate) }) : " "}</p>
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
