import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { OpenMarketplace } from "@/components/screens/open-marketplace";
import { Badge } from "@/components/shadcn/badge";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";
import { createClient } from "@/lib/supabase/server";

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

export default async function MarketplacePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const supabase = await createClient();

  // marketplace_* tables are newer than the generated types, hence the loose client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("marketplace_listings")
    .select(`
      id, title, listing_type, base_price_kobo, unit, available_quantity, location_state, location_lga,
      marketplace_categories ( name, slug ),
      marketplace_sellers ( id, business_name, seller_type, rating_avg ),
      marketplace_produce_provenance ( id )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);
  const listings = (data ?? []) as Row[];

  return (
    <OpenMarketplace
      lang={lang}
      slots={{
        lots:
          listings.length === 0 ? (
            <EmptyState
              icon="storefront"
              title="No lots are live yet"
              description="Verified farmers and suppliers are listing their first lots. Join the pilot to be notified, or list your own produce."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href={`/${lang}/account/marketplace/new-listing`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-label-md text-white hover:bg-primary">
                    <Icon name="add_circle" className="text-base" /> Sell on CultivaNode
                  </Link>
                  <Link href={`/${lang}/marketplace/rfq`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-4 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-container-high">
                    <Icon name="request_quote" className="text-base" /> Post a bulk request (RFQ)
                  </Link>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {listings.map((l) => {
                const seller = l.marketplace_sellers;
                const traced = (l.marketplace_produce_provenance ?? []).length > 0;
                return (
                  <article key={l.id} className="card-interactive flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
                    <div className="relative flex h-32 items-end justify-between bg-gradient-to-br from-primary-container to-secondary p-4 text-white">
                      <Icon name={TYPE_ICON[l.listing_type] ?? "storefront"} className="absolute right-4 top-3 text-[4rem] opacity-15" />
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-label-sm text-label-sm">
                          {l.marketplace_categories?.name ?? "General"}
                        </span>
                        {traced && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 font-label-sm text-label-sm text-on-secondary-container">
                            <Icon name="qr_code_2" className="text-sm" /> Traceable batch
                          </span>
                        )}
                      </div>
                      {l.available_quantity != null && (
                        <span className="rounded-lg bg-surface-container-lowest/95 px-2 py-1 font-label-sm text-label-sm text-primary">
                          {Number(l.available_quantity).toLocaleString("en-NG")} {l.unit} available
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-3 p-5">
                      <div>
                        <p className="flex items-center gap-1 text-label-sm font-medium text-on-surface-variant">
                          <Icon name="pin_drop" className="text-sm text-secondary" />
                          {[l.location_lga, l.location_state].filter(Boolean).join(", ") || "South-West Nigeria"}
                        </p>
                        <h3 className="mt-1 font-headline-sm text-headline-sm text-on-surface">{l.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                          {seller?.business_name ?? "Verified seller"}
                          {seller?.rating_avg != null && (
                            <Badge tone="caution" className="py-0"><Icon name="star" filled /> {Number(seller.rating_avg).toFixed(1)}</Badge>
                          )}
                        </p>
                      </div>
                      <div className="flex items-end justify-between gap-3 border-t border-surface-container pt-3">
                        <p className="font-metric-num text-headline-md text-primary">
                          {formatNaira(l.base_price_kobo)}
                          <span className="ml-1 text-label-sm font-normal text-on-surface-variant">/ {l.unit}</span>
                        </p>
                        <Link href={`/${lang}/marketplace/${l.id}`} className="inline-flex items-center gap-1 rounded-lg bg-primary-container px-3 py-2 font-label-md text-label-md text-white hover:bg-primary">
                          View lot <Icon name="arrow_forward" className="text-base" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ),
      }}
    />
  );
}
