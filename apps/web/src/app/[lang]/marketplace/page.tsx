import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { AddToCart } from "@/components/marketplace/add-to-cart";
import { OpenMarketplace } from "@/components/screens/open-marketplace";
import { Badge } from "@/components/shadcn/badge";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";
import { createClient } from "@/lib/supabase/server";
import { getMarketplaceCategories, getMarketplaceStats } from "@/lib/public-cache";
import { serverPhrasebook, setPageLocale } from "@/i18n/marketing-server";
import YO from "@/i18n/yo-marketing/marketplace-page";

const tYo = serverPhrasebook(YO);

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/marketplace", "CultivaNode Marketplace", t.marketplace.intro);
}

type Row = {
  id: string;
  title: string;
  listing_type: string;
  base_price_kobo: number;
  unit: string;
  available_quantity: number | null;
  min_order_quantity: number | null;
  images: string[] | null;
  marketplace_inventory_lots: { physical_quantity: number; reserved_quantity: number | null; allocated_quantity: number | null }[] | null;
  location_state: string | null;
  location_lga: string | null;
  marketplace_categories: { name: string; slug: string } | null;
  marketplace_sellers: { id: string; business_name: string; seller_type: string; rating_avg: number | null } | null;
  marketplace_produce_provenance: { id: string }[] | null;
};

const TYPE_ICON: Record<string, "grass" | "inventory_2" | "agriculture" | "engineering"> = {
  produce: "grass",
  input: "inventory_2",
  equipment: "agriculture",
  service: "engineering",
};

export const dynamic = "force-dynamic";
const PAGE_SIZE = 24;

/** One query-string value, trimmed and capped so it is safe to put in a filter. */
function param(value: string | string[] | undefined, max = 60): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").trim().slice(0, max);
}

export default async function MarketplacePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  setPageLocale(lang);
  const supabase = await createClient();
  const sp = await searchParams;
  const filters = { q: param(sp.q), state: param(sp.state), category: param(sp.category) };
  const page = Math.max(1, Math.min(200, Number.parseInt(param(sp.page), 10) || 1));

  // marketplace_* tables are newer than the generated types, hence the loose client.
  let query = supabase
    .from("marketplace_listings")
    .select(`
      id, title, listing_type, base_price_kobo, unit, available_quantity, min_order_quantity, location_state, location_lga, images,
      marketplace_inventory_lots ( physical_quantity, reserved_quantity, allocated_quantity ),
      marketplace_categories${filters.category ? "!inner" : ""} ( name, slug ),
      marketplace_sellers ( id, business_name, seller_type, rating_avg ),
      marketplace_produce_provenance ( id )
    `)
    .eq("status", "active");
  // Search the title; strip characters that have a meaning in PostgREST filters or LIKE patterns.
  const words = filters.q.replace(/[%_,()*\\]/g, " ").trim();
  if (words) query = query.ilike("title", `%${words}%`);
  if (filters.state) query = query.eq("location_state", filters.state);
  if (filters.category) query = query.eq("marketplace_categories.slug", filters.category);

  // One extra row tells us whether there is a next page without counting the whole table.
  const from = (page - 1) * PAGE_SIZE;
  const [{ data }, market, categories] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE),
    // Real numbers for the header (cached for everyone, refreshed every few minutes).
    getMarketplaceStats(),
    getMarketplaceCategories(),
  ]);
  const rows = (data ?? []) as Row[];
  const hasNext = rows.length > PAGE_SIZE;
  const listings = rows.slice(0, PAGE_SIZE);
  const stats = { lots: market.lots, sellers: market.sellers };
  const states = market.states;
  const pageHref = (n: number) => {
    const q = new URLSearchParams();
    if (filters.q) q.set("q", filters.q);
    if (filters.state) q.set("state", filters.state);
    if (filters.category) q.set("category", filters.category);
    if (n > 1) q.set("page", String(n));
    const qs = q.toString();
    return `/${lang}/marketplace${qs ? `?${qs}` : ""}`;
  };

  return (
    <OpenMarketplace
      lang={lang}
      stats={stats}
      filters={filters}
      categories={categories}
      states={states}
      slots={{
        lots:
          listings.length === 0 ? (
            <EmptyState
              icon="storefront"
              title={filters.q || filters.state || filters.category ? tYo("No lots match your search") : tYo("No lots are live yet")}
              description={
                filters.q || filters.state || filters.category
                  ? tYo("Try another word or clear the filters. You can also post a bulk request and let sellers come to you.")
                  : tYo("Verified farmers and suppliers are listing their first lots. Join the pilot to be notified, or list your own produce.")
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href={`/${lang}/account/marketplace/new-listing`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-label-md text-white hover:bg-primary">
                    <Icon name="add_circle" className="text-base" />{tYo(" Sell on CultivaNode")}</Link>
                  <Link href={`/${lang}/marketplace/rfq`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-4 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-container-high">
                    <Icon name="request_quote" className="text-base" />{tYo(" Post a bulk request (RFQ)")}</Link>
                </div>
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {listings.map((l) => {
                const seller = l.marketplace_sellers;
                const traced = (l.marketplace_produce_provenance ?? []).length > 0;
                const lots = l.marketplace_inventory_lots ?? [];
                // Stock lives in inventory lots; fall back to the listing's own count for services.
                const available = lots.length
                  ? lots.reduce((s, x) => s + Number(x.physical_quantity) - Number(x.reserved_quantity ?? 0) - Number(x.allocated_quantity ?? 0), 0)
                  : l.available_quantity;
                return (
                  <article key={l.id} className="card-interactive flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
                    <div className={`relative flex items-end justify-between bg-gradient-to-br from-primary-container to-secondary p-4 text-white ${l.images?.[0] ? "h-44" : "h-32"}`}>
                      {l.images?.[0] ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- seller photo from Supabase Storage */}
                          <img src={l.images[0]} alt={l.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/70 via-[#0b1c30]/10 to-transparent" />
                        </>
                      ) : (
                        <Icon name={TYPE_ICON[l.listing_type] ?? "storefront"} className="absolute right-4 top-3 text-[4rem] opacity-15" />
                      )}
                      <div className="relative flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-label-sm text-label-sm">
                          {tYo(l.marketplace_categories?.name ?? "General")}
                        </span>
                        {traced && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 font-label-sm text-label-sm text-on-secondary-container">
                            <Icon name="qr_code_2" className="text-sm" />{tYo(" Traceable batch")}</span>
                        )}
                      </div>
                      {available != null && (
                        <span className="relative rounded-lg bg-surface-container-lowest/95 px-2 py-1 font-label-sm text-label-sm text-primary">
                          {Number(available).toLocaleString("en-NG")} {tYo(l.unit)}{tYo(" available")}</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-3 p-5">
                      <div>
                        <p className="flex items-center gap-1 text-label-sm font-medium text-on-surface-variant">
                          <Icon name="pin_drop" className="text-sm text-secondary" />
                          {tYo([l.location_lga, l.location_state].filter(Boolean).join(", ") || "South-West Nigeria")}
                        </p>
                        <h3 className="mt-1 font-headline-sm text-headline-sm text-on-surface">{tYo(l.title)}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                          {tYo(seller?.business_name ?? "Verified seller")}
                          {seller?.rating_avg ? (
                            <Badge tone="caution" className="py-0"><Icon name="star" filled /> {Number(seller.rating_avg).toFixed(1)}</Badge>
                          ) : (
                            <Badge className="py-0">{tYo("New seller")}</Badge>
                          )}
                        </p>
                      </div>
                      <div className="flex items-end justify-between gap-3 border-t border-surface-container pt-3">
                        <p className="font-metric-num text-headline-md text-primary">
                          {formatNaira(l.base_price_kobo)}
                          <span className="ml-1 text-label-sm font-normal text-on-surface-variant">/ {tYo(l.unit)}</span>
                        </p>
                        <Link href={`/${lang}/marketplace/${l.id}`} className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">{tYo("View lot ")}<Icon name="arrow_forward" className="text-base" />
                        </Link>
                      </div>
                      <AddToCart
                        compact
                        lang={lang}
                        minQuantity={Number(l.min_order_quantity ?? 1)}
                        disabled={available != null && available <= 0}
                        item={{ listingId: l.id, title: l.title, unit: l.unit, unitPriceKobo: Number(l.base_price_kobo), sellerName: seller?.business_name }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
            {(page > 1 || hasNext) && (
              <nav aria-label={tYo("Pages")} className="flex items-center justify-between gap-3">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-4 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-container-high">
                    <Icon name="arrow_back" className="text-base" />{tYo("Previous")}</Link>
                ) : <span />}
                <span className="text-body-sm text-on-surface-variant">{tYo("Page")} {page}</span>
                {hasNext ? (
                  <Link href={pageHref(page + 1)} className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-4 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-container-high">
                    {tYo("Next")}<Icon name="arrow_forward" className="text-base" /></Link>
                ) : <span />}
              </nav>
            )}
            </div>
          ),
      }}
    />
  );
}
