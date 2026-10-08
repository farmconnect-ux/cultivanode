import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";
import { createClient } from "@/lib/supabase/server";
import { MarketGrid, type ListingCardItem } from "@/components/marketplace/market-grid";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/marketplace", "CultivaNode Marketplace", t.marketplace.intro);
}

export default async function MarketplacePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const supabase = (await createClient()) as any;

  // Fetch active listings
  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select(`
      id,
      title,
      listing_type,
      base_price_kobo,
      unit,
      available_quantity,
      location_state,
      location_lga,
      marketplace_categories ( name, slug ),
      marketplace_sellers ( id, business_name, seller_type, rating_avg ),
      marketplace_produce_provenance ( id )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  const cardItems: ListingCardItem[] = (listings ?? []).map((l: any) => ({
    id: l.id,
    title: l.title,
    listing_type: l.listing_type,
    category_name: l.marketplace_categories?.name ?? "General",
    category_slug: l.marketplace_categories?.slug ?? "general",
    base_price_kobo: l.base_price_kobo,
    unit: l.unit,
    available_quantity: l.available_quantity,
    seller_id: l.marketplace_sellers?.id ?? "",
    seller_name: l.marketplace_sellers?.business_name ?? "Verified Seller",
    seller_type: l.marketplace_sellers?.seller_type ?? "farmer",
    seller_rating: Number(l.marketplace_sellers?.rating_avg ?? 5.0),
    location_state: l.location_state,
    location_lga: l.location_lga,
    has_provenance: Boolean(l.marketplace_produce_provenance && l.marketplace_produce_provenance.length > 0),
  }));

  return (
    <Container className="flex flex-col gap-10 py-10 sm:py-14">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-8">
        <div className="flex flex-col items-start gap-3 max-w-2xl">
          <Badge className="bg-leaf-100 text-leaf-800 font-bold uppercase tracking-wider">
            Agricultural Commerce &amp; Supply Chain
          </Badge>
          <h1 className="text-4xl font-extrabold text-leaf-900 sm:text-5xl tracking-tight">
            CultivaNode Market
          </h1>
          <p className="text-lg text-muted">
            Direct farm produce, certified agricultural inputs, machinery hire and farm labour with transparent escrow payments and harvest batch traceability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${lang}/marketplace/rfq`}
            className="rounded-lg border-2 border-leaf-700 bg-white px-4 py-2.5 text-sm font-bold text-leaf-800 hover:bg-leaf-50 transition shadow-sm"
          >
            📋 Bulk Procurement (RFQ)
          </Link>
          <Link
            href={`/${lang}/account/marketplace/new-listing`}
            className="rounded-lg bg-leaf-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-leaf-800 transition shadow-sm"
          >
            ➕ Sell on Marketplace
          </Link>
        </div>
      </div>

      {/* Main Grid and Search Section */}
      <MarketGrid lang={lang} initialListings={cardItems} />
    </Container>
  );
}
