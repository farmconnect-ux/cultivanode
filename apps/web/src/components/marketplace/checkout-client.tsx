"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { checkoutCart, quoteCart, type PricedLine } from "@/actions/checkout";
import { Icon } from "@/components/ds/icon";
import { cart, useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
const DELIVERY_PER_SELLER_KOBO = 300_000;
const input = "h-10 w-full rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:bg-surface-container-lowest";

export function CheckoutClient({
  lang,
  signedIn,
  defaults,
  escrowOn = false,
}: {
  lang: string;
  signedIn: boolean;
  defaults: { state: string; lga: string; phone: string };
  /** Admin switch: while off, the order is placed and the buyer pays each seller by bank transfer. */
  escrowOn?: boolean;
}) {
  const entries = useCart();
  const [priced, setPriced] = useState<PricedLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const key = entries.map((e) => `${e.listingId}:${e.quantity}`).join(",");

  useEffect(() => {
    let live = true;
    quoteCart(entries.map((e) => ({ listingId: e.listingId, quantity: e.quantity }))).then((p) => live && setPriced(p));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-price only when ids/quantities change
  }, [key]);

  const sellers = useMemo(() => new Set((priced ?? []).map((p) => p.sellerId)).size, [priced]);
  const subtotal = (priced ?? []).reduce((s, p) => s + p.unitPriceKobo * p.quantity, 0);
  const delivery = sellers * DELIVERY_PER_SELLER_KOBO;
  const problems = (priced ?? []).filter((p) => p.problem);

  function submit(form: FormData) {
    setError(null);
    start(async () => {
      const res = await checkoutCart({
        lang,
        lines: entries.map((e) => ({ listingId: e.listingId, quantity: e.quantity })),
        address: String(form.get("address") ?? ""),
        state: String(form.get("state") ?? ""),
        lga: String(form.get("lga") ?? ""),
        phone: String(form.get("phone") ?? ""),
        notes: String(form.get("notes") ?? ""),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      cart.clear();
      window.location.href = res.redirectUrl;
    });
  }

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
        <Icon name="shopping_cart" className="text-4xl text-secondary" />
        <p className="font-headline-sm text-headline-sm text-on-surface">Your cart is empty</p>
        <p className="max-w-sm text-body-sm text-on-surface-variant">Add produce, inputs or services from the marketplace, then come back here to place your order.</p>
        <Link href={`/${lang}/marketplace`} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-label-md text-on-primary hover:bg-primary">
          <Icon name="storefront" className="text-base" /> Browse the marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-[1fr_380px]">
      <section className="self-start rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <h2 className="mb-3 font-headline-sm text-headline-sm text-on-surface">Items ({entries.length})</h2>
        <ul className="flex flex-col divide-y divide-outline-variant/30">
          {entries.map((e) => {
            const p = priced?.find((x) => x.listingId === e.listingId);
            return (
              <li key={e.listingId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/${lang}/marketplace/${e.listingId}`} className="font-label-lg text-label-lg text-on-surface hover:underline">
                    {p?.title ?? e.title}
                  </Link>
                  <p className="text-body-sm text-on-surface-variant">
                    {p?.sellerName ?? e.sellerName ?? ""} {p?.location ? `· ${p.location}` : ""} · {naira(p?.unitPriceKobo ?? e.unitPriceKobo)}/{p?.unit ?? e.unit}
                  </p>
                  {p?.problem && <p className="text-body-sm font-medium text-critical">{p.problem}</p>}
                  {priced && !p && <p className="text-body-sm font-medium text-critical">This listing is no longer available.</p>}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={p?.minQuantity ?? 1}
                    step="any"
                    defaultValue={e.quantity}
                    onBlur={(ev) => cart.setQuantity(e.listingId, Number(ev.target.value))}
                    className="h-9 w-20 rounded-lg bg-surface-container-low px-2 text-right text-body-md"
                    aria-label="Quantity"
                  />
                  <span className="w-28 text-right font-label-lg text-label-lg tabular-nums">{naira((p?.unitPriceKobo ?? e.unitPriceKobo) * e.quantity)}</span>
                  <button type="button" onClick={() => cart.remove(e.listingId)} className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-low" aria-label="Remove">
                    <Icon name="delete" className="text-lg" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <form action={submit} className="flex flex-col gap-3 self-start rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Delivery & payment</h2>
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Delivery address *</span>
          <input name="address" required minLength={5} className={input} placeholder="Street, town or market" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">State *</span>
            <input name="state" required defaultValue={defaults.state} className={input} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">LGA</span>
            <input name="lga" defaultValue={defaults.lga} className={input} />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Phone for the driver *</span>
          <input name="phone" type="tel" required defaultValue={defaults.phone} className={input} placeholder="0803 123 4567" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Notes for the seller</span>
          <textarea name="notes" rows={2} className={cn(input, "h-auto py-2")} />
        </label>
        <dl className="mt-1 flex flex-col gap-1 border-t border-outline-variant/40 pt-3 text-body-sm">
          <div className="flex justify-between"><dt className="text-on-surface-variant">Items</dt><dd className="tabular-nums">{priced ? naira(subtotal) : "…"}</dd></div>
          <div className="flex justify-between"><dt className="text-on-surface-variant">Delivery ({sellers} {sellers === 1 ? "seller" : "sellers"})</dt><dd className="tabular-nums">{priced ? naira(delivery) : "…"}</dd></div>
          <div className="flex justify-between border-t border-outline-variant/40 pt-2 font-label-lg text-label-lg text-primary"><dt>{escrowOn ? "Total into escrow" : "Total to pay sellers"}</dt><dd className="tabular-nums">{priced ? naira(subtotal + delivery) : "…"}</dd></div>
        </dl>
        {error && <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-body-sm text-[#b91c1c]">{error}</p>}
        {signedIn ? (
          <button type="submit" disabled={pending || !priced || problems.length > 0} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-container px-4 py-3 font-label-lg text-label-lg text-on-primary shadow-sm hover:bg-primary disabled:opacity-60">
            <Icon name={pending ? "progress_activity" : "lock"} className={cn("text-base", pending && "animate-spin")} /> {pending ? "Placing order…" : escrowOn ? "Pay into escrow" : "Place order"}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <Link href={`/${lang}/sign-up?as=customer&next=${encodeURIComponent(`/${lang}/marketplace/checkout`)}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-container px-4 py-3 font-label-lg text-label-lg text-on-primary hover:bg-primary">
              <Icon name="person_add" className="text-base" /> Create an account to check out
            </Link>
            <Link href={`/${lang}/sign-in?as=customer&next=${encodeURIComponent(`/${lang}/marketplace/checkout`)}`} className="text-center font-label-md text-label-md text-primary hover:underline">
              Already have an account? Sign in
            </Link>
            <p className="text-body-sm text-on-surface-variant">Your cart is kept on this device while you sign up.</p>
          </div>
        )}
        <p className="flex items-start gap-1.5 text-body-sm text-on-surface-variant">
          <Icon name={escrowOn ? "shield_lock" : "account_balance"} className="text-base text-secondary" />
          {escrowOn
            ? "Your money is held in escrow and released to the seller only after you confirm delivery."
            : "After you place the order you'll see each seller's bank account and a reference to use. The seller confirms your payment, then sends the order. Paying through CultivaNode is coming soon."}
        </p>
      </form>
    </div>
  );
}
