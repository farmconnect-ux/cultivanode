import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { ListingDetailView, type FullListingDetails } from "@/components/marketplace/listing-detail";
export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();

  const supabase = (await createClient()) as any;

  const { data: listing, error } = await supabase
    .from("marketplace_listings")
    .select(`
      id,
      title,
      description,
      listing_type,
      unit,
      price_model,
      base_price_kobo,
      available_quantity,
      min_order_quantity,
      location_state,
      location_lga,
      delivery_options,
      delivery_radius_km,
      marketplace_categories ( name ),
      marketplace_sellers ( id, business_name, seller_type, rating_avg, verification_status ),
      marketplace_produce_provenance (
        batch_code,
        harvest_date,
        grade,
        moisture_pct,
        is_organic,
        farms ( id, name )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !listing) {
    notFound();
  }

  const provenanceRecord = Array.isArray(listing.marketplace_produce_provenance)
    ? listing.marketplace_produce_provenance[0]
    : listing.marketplace_produce_provenance;

  const fullListing: FullListingDetails = {
    id: listing.id,
    seller_id: (listing.marketplace_sellers as any)?.id ?? "",
    seller_name: (listing.marketplace_sellers as any)?.business_name ?? "Verified Seller",
    seller_type: (listing.marketplace_sellers as any)?.seller_type ?? "farmer",
    seller_rating: Number((listing.marketplace_sellers as any)?.rating_avg ?? 5.0),
    seller_verified: (listing.marketplace_sellers as any)?.verification_status === "verified",
    title: listing.title,
    description: listing.description,
    listing_type: listing.listing_type,
    category_name: (listing.marketplace_categories as any)?.name ?? "General",
    unit: listing.unit,
    price_model: listing.price_model,
    base_price_kobo: listing.base_price_kobo,
    available_quantity: listing.available_quantity,
    min_order_quantity: listing.min_order_quantity,
    location_state: listing.location_state,
    location_lga: listing.location_lga,
    delivery_options: listing.delivery_options ?? ["pickup"],
    delivery_radius_km: Number(listing.delivery_radius_km ?? 30),
    provenance: provenanceRecord
      ? {
          farm_id: (provenanceRecord as any).farms?.id,
          farm_name: (provenanceRecord as any).farms?.name,
          batch_code: (provenanceRecord as any).batch_code,
          harvest_date: (provenanceRecord as any).harvest_date,
          grade: (provenanceRecord as any).grade,
          moisture_pct: (provenanceRecord as any).moisture_pct,
          is_organic: (provenanceRecord as any).is_organic,
        }
      : null,
  };

  return (
    <Container className="py-10 sm:py-14 flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href={`/${lang}/marketplace`} className="hover:text-leaf-800">
          ← Back to Marketplace
        </Link>
        <span>/</span>
        <span className="text-ink font-semibold">{fullListing.category_name}</span>
      </div>

      <ListingDetailView lang={lang} listing={fullListing} />
    </Container>
  );
}
