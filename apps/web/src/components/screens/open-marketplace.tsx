"use client";

// Open marketplace screen. Rebuilt from the "cultivanode_open_produce_commodities_marketplace" design
// keeping only what is real: live lots (passed in by the page), a search that filters them on the
// server, the browser cart, and a link to the real bulk-request (RFQ) page.
// Removed from the design: sample lots, hard-coded counts ("83 lots"), fake filter/RFQ/enterprise
// confirmations, invented delivery activity and escrow claims.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import { cart, useCart } from "@/lib/cart";
import { slot, type ScreenProps } from "./types";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/open-marketplace";

const tYo = phrasebook(YO);

export type OpenMarketplaceSlot = "lots";

export type MarketplaceFilters = { q: string; state: string; category: string };

type Props = ScreenProps<OpenMarketplaceSlot> & {
  /** Counts from the database, not the design. */
  stats: { lots: number; sellers: number };
  filters: MarketplaceFilters;
  categories: { slug: string; name: string }[];
  states: readonly string[];
};

/** Delivery charge shown in the cart; the checkout page re-prices everything on the server. */
const DELIVERY_PER_SELLER_NAIRA = 3000;

export function OpenMarketplace({ slots, lang, stats, filters, categories, states }: Props) {
  const router = useRouter();

  // The cart lives in the browser and is shared with the checkout page; prices are re-checked there.
  const cartItems = useCart();
  const subtotal = cartItems.reduce((acc, item) => acc + (item.unitPriceKobo * item.quantity) / 100, 0);
  const sellerCount = new Set(cartItems.map((i) => i.sellerName ?? i.listingId)).size;
  const deliveryCost = sellerCount * DELIVERY_PER_SELLER_NAIRA;
  const grandTotal = subtotal + deliveryCost;
  const filtering = Boolean(filters.q || filters.state || filters.category);

  const handleRemoveFromCart = (id: string, name: string) => {
    cart.remove(id);
    showScreenToast(`Removed ${name} from cart.`);
  };

  const goToCheckout = () => {
    if (cartItems.length === 0) {
      showScreenToast(tYo.now("Your cart is empty. Add a lot first."));
      return;
    }
    router.push(`/${lang}/marketplace/checkout`);
  };

  return (
    <div className="screen">
      <div className="flex w-full flex-col">
        {/* Hero, real counts and search */}
        <section className="w-full bg-surface-container-low pb-12 pt-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 lg:px-12">
            <div className="flex max-w-3xl flex-col gap-3">
              <span className="self-start rounded-full bg-surface-container-highest px-3 py-1 font-label-sm text-label-sm uppercase tracking-wide text-primary">
                {tYo("South-West pilot")}
              </span>
              <h1 className="font-headline-xl text-headline-xl-mobile tracking-tight text-primary sm:text-headline-xl">{tYo("CultivaNode Market")}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                {tYo("Buy produce, seed and farm inputs straight from farms and suppliers in the South-West. Pay by card, bank transfer or USSD at checkout.")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm md:grid-cols-3">
              <div className="flex flex-col gap-1 p-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{tYo("Lots for sale")}</span>
                <span className="font-metric-num text-metric-num text-primary">{stats.lots.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex flex-col gap-1 p-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{tYo("Sellers")}</span>
                <span className="font-metric-num text-metric-num text-primary">{stats.sellers.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex flex-col gap-1 p-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{tYo("Pilot Commission")}</span>
                <span className="font-metric-num text-metric-num text-secondary">0%</span>
              </div>
            </div>

            {/* A plain GET form: filtering happens on the server, so it also works without JavaScript. */}
            <form
              method="get"
              action={`/${lang}/marketplace`}
              role="search"
              className="grid grid-cols-1 items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-md md:grid-cols-12 md:p-6"
            >
              <label className="relative md:col-span-5">
                <span className="sr-only">{tYo("Search")}</span>
                <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant" />
                <input
                  name="q"
                  defaultValue={filters.q}
                  className="h-11 w-full rounded-lg bg-surface pl-11 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:bg-surface-container-low focus:outline-none"
                  placeholder={tYo("Search, e.g. maize, cassava, NPK")}
                  type="search"
                />
              </label>
              <label className="relative md:col-span-3">
                <span className="sr-only">{tYo("State")}</span>
                <Icon name="location_on" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant" />
                <select
                  name="state"
                  defaultValue={filters.state}
                  className="h-11 w-full cursor-pointer appearance-none rounded-lg bg-surface pl-11 pr-8 font-body-sm text-body-sm text-on-surface focus:outline-none"
                >
                  <option value="">{tYo("All states")}</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="relative md:col-span-2">
                <span className="sr-only">{tYo("Category")}</span>
                <select
                  name="category"
                  defaultValue={filters.category}
                  className="h-11 w-full cursor-pointer appearance-none rounded-lg bg-surface px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
                >
                  <option value="">{tYo("All Categories")}</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {tYo(c.name)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container md:col-span-2"
                type="submit"
              >
                <Icon name="tune" className="text-[18px]" />
                <span>{tYo("Filter Lots")}</span>
              </button>
              {filtering && (
                <Link href={`/${lang}/marketplace`} className="font-label-sm text-label-sm text-secondary hover:underline md:col-span-12">
                  {tYo("Clear search and filters")}
                </Link>
              )}
            </form>
          </div>
        </section>

        {/* Lots and cart */}
        <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-12">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <h2 className="font-headline-lg text-headline-lg text-primary">{filtering ? tYo("Matching lots") : tYo("Lots for sale")}</h2>
              {slot(slots, "lots", null)}
              <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-xl bg-surface-container-low p-6 md:flex-row">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm font-bold text-primary">{tYo("Buying in bulk?")}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {tYo("Post what you need, how much and by when. Sellers reply with their offers.")}
                  </p>
                </div>
                <Link
                  href={`/${lang}/marketplace/rfq`}
                  className="shrink-0 rounded-lg bg-surface-container-lowest px-5 py-2.5 font-label-md text-label-md text-primary shadow-sm transition-colors hover:bg-surface-container"
                >
                  {tYo("Post a bulk request (RFQ)")}
                </Link>
              </div>
            </div>

            <aside className="sticky top-28 flex flex-col gap-6 lg:col-span-4" id="quick-checkout">
              <div className="flex flex-col gap-5 rounded-xl bg-surface-container-lowest p-6 shadow-md">
                <div className="-mx-6 -mt-6 flex items-center justify-between rounded-t-xl bg-surface-container-low/50 p-6 pb-3">
                  <div className="flex items-center gap-2">
                    <Icon name="shopping_bag" className="text-[22px] text-primary" />
                    <h3 className="font-headline-sm text-headline-sm font-bold text-primary">{tYo("Your cart")}</h3>
                  </div>
                  <span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-fixed">
                    {cartItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {cartItems.length === 0 ? (
                    <div className="rounded-lg bg-surface-container-low p-4 text-center text-body-sm text-on-surface-variant">
                      <Icon name="shopping_cart" className="mx-auto mb-1 text-[24px] text-outline" />
                      <p>{tYo("Your cart is empty.")}</p>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.listingId} className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-label-md text-label-md font-semibold text-on-surface">{tYo(item.title)}</h4>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              {item.quantity} {tYo(item.unit)}
                              {item.sellerName ? ` · ${item.sellerName}` : ""}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-label-lg text-label-lg font-bold text-primary">
                              ₦{Math.round((item.unitPriceKobo * item.quantity) / 100).toLocaleString()}
                            </span>
                            <button onClick={() => handleRemoveFromCart(item.listingId, item.title)} className="pt-0.5 text-[11px] text-error hover:underline" type="button">
                              {tYo("Remove")}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="rounded-lg bg-surface p-3 font-body-sm text-body-sm text-on-surface-variant">
                  {tYo("Delivery is ₦3,000 per seller. You enter the drop-off address at checkout.")}
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>{tYo("Subtotal")}</span>
                    <span className="font-semibold text-on-surface">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>{tYo("Delivery")}</span>
                    <span className="font-semibold text-on-surface">₦{deliveryCost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-2">
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">{tYo("Total")}</span>
                    <span className="font-headline-lg text-headline-lg font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={goToCheckout}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container"
                  type="button"
                >
                  <Icon name="lock" className="text-[20px]" />
                  <span>{tYo("Go to checkout")}</span>
                </button>
                <Link href={`/${lang}/account/marketplace/orders`} className="text-center font-label-sm text-label-sm text-secondary hover:underline">
                  {tYo("Track my orders")}
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
