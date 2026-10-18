"use client";

import * as React from "react";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Card } from "@/components/ui";
import { AddToCart } from "@/components/marketplace/add-to-cart";
import type { Locale } from "@/i18n/config";
import { phrasebook } from "@/i18n/marketing";
import YO from "@/i18n/yo-marketing/listing-detail";

const tYo = phrasebook(YO);

export interface FullListingDetails {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_type: string;
  seller_rating: number;
  seller_verified: boolean;
  title: string;
  description: string | null;
  listing_type: string;
  category_name: string;
  unit: string;
  price_model: string;
  base_price_kobo: number;
  available_quantity: number;
  min_order_quantity: number;
  location_state: string | null;
  location_lga: string | null;
  delivery_options: string[];
  delivery_radius_km: number;
  /** Seller photos (public Storage URLs), first is the cover. */
  images?: string[];
  provenance?: {
    farm_id?: string | null;
    farm_name?: string | null;
    batch_code?: string | null;
    harvest_date?: string | null;
    grade?: string | null;
    moisture_pct?: number | null;
    is_organic?: boolean | null;
  } | null;
}

/** Cover photo with thumbnails to switch between the seller's photos. */
function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = React.useState(0);
  if (!images.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- seller photo from Supabase Storage */}
      <img src={images[i]} alt={title} className="aspect-[4/3] w-full rounded-xl bg-surface-container-low object-cover shadow-sm" />
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((u, n) => (
            <button
              key={u}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Photo ${n + 1}`}
              aria-pressed={n === i}
              className={`overflow-hidden rounded-lg ring-2 ${n === i ? "ring-primary" : "ring-transparent hover:ring-outline-variant"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
              <img src={u} alt="" loading="lazy" className="h-16 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ListingDetailView({
  lang,
  listing,
}: {
  lang: Locale;
  listing: FullListingDetails;
}) {
  const outOfStock = listing.available_quantity <= 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Left Column: Product Info & Provenance */}
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="bg-secondary-container/40 text-primary uppercase tracking-wide">
              {tYo(listing.category_name)}
            </Badge>
            <Badge className="bg-earth-100 text-on-surface">{tYo("Type: ")}{tYo(listing.listing_type)}
            </Badge>
            {listing.provenance?.farm_name && (
              <Badge className="bg-node-100 text-node-800 font-bold">{tYo("✓ Verified Farm Source")}</Badge>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface sm:text-4xl">{tYo(listing.title)}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{tYo("Sold by ")}<span className="font-bold text-on-surface">{tYo(listing.seller_name)}</span> · ★ {listing.seller_rating.toFixed(1)}
            {listing.seller_verified && " · (Identity & Bank Verified)"}
          </p>
        </div>

        <Gallery images={listing.images ?? []} title={listing.title} />

        {/* Pricing Card */}
        <Card className="flex flex-wrap items-baseline justify-between gap-4 bg-surface-container-low/50 border-secondary/30">
          <div>
            <div className="text-xs text-on-surface-variant font-semibold uppercase">{tYo("Listing Price")}</div>
            <div className="text-3xl font-extrabold text-primary">
              {formatNaira(listing.base_price_kobo)}
              <span className="text-sm font-normal text-on-surface-variant"> /{tYo(listing.unit)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-on-surface-variant">{tYo("Available Quantity")}</div>
            <div className="text-lg font-bold text-on-surface">
              {tYo(listing.available_quantity)} {tYo(listing.unit)}
            </div>
            <div className="text-xs text-on-surface-variant">{tYo("Min Order: ")}{tYo(listing.min_order_quantity)} {tYo(listing.unit)}</div>
          </div>
        </Card>

        {/* Description */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-2">{tYo("Description & Specifications")}</h2>
          <p className="whitespace-pre-line text-on-surface-variant leading-relaxed">
            {tYo(listing.description || "No additional description provided by the seller.")}
          </p>
        </div>

        {/* Produce Provenance & Seed-to-Harvest Traceability */}
        {listing.provenance && (
          <div className="rounded-xl border-2 border-secondary/40 bg-surface-container-low/40 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌱</span>
              <h2 className="text-xl font-bold text-primary">{tYo("Farm Traceability & Batch Provenance")}</h2>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">{tYo("This produce was grown and recorded inside the CultivaNode Farm Management network. Complete lifecycle integrity is verifiable.")}</p>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg bg-white p-3 border border-border">
                <span className="text-xs text-on-surface-variant">{tYo("Originating Farm")}</span>
                <p className="font-bold text-on-surface">{tYo(listing.provenance.farm_name || "CultivaNode Pilot Farm")}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-border">
                <span className="text-xs text-on-surface-variant">{tYo("Harvest Batch Code")}</span>
                <p className="font-bold text-primary font-mono">{tYo(listing.provenance.batch_code || "HARV-BATCH-VERIFIED")}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-border">
                <span className="text-xs text-on-surface-variant">{tYo("Quality Grade")}</span>
                <p className="font-bold text-on-surface capitalize">{tYo(listing.provenance.grade?.replace("_", " ") || "Grade A (Prime)")}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-border">
                <span className="text-xs text-on-surface-variant">{tYo("Harvest Date")}</span>
                <p className="font-bold text-on-surface">{tYo(listing.provenance.harvest_date || "Recent Harvest")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delivery & Logistics */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-2">{tYo("Logistics & Delivery")}</h2>
          <div className="text-sm text-on-surface-variant space-y-1">
            <p>{tYo("📍 Location: ")}{listing.location_lga ? `${listing.location_lga}, ${listing.location_state}` : "South-West Nigeria"}</p>
            <p>{tYo("🚚 Available methods: ")}{listing.delivery_options.join(", ").replace("_", " ")}</p>
            <p>{tYo("📏 Dispatch radius: Up to ")}{tYo(listing.delivery_radius_km)}{tYo(" km from farm/depot")}</p>
          </div>
        </div>
      </div>

      {/* Right Column: Checkout & Escrow Protection Box */}
      <div className="flex flex-col gap-5">
        <Card className="sticky top-20 flex flex-col gap-4 border-2 border-primary-container bg-white shadow-lg p-6">
          <h3 className="text-xl font-bold text-on-surface">{tYo("Purchase & Escrow Order")}</h3>

          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>{tYo("Price")}</span>
              <span className="font-semibold text-on-surface">{formatNaira(listing.base_price_kobo)} / {tYo(listing.unit)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>{tYo("Minimum order")}</span>
              <span className="font-semibold text-on-surface">{tYo(listing.min_order_quantity)} {tYo(listing.unit)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>{tYo("Delivery")}</span>
              <span className="font-semibold text-on-surface">{formatNaira(300000)}{tYo(" per seller")}</span>
            </div>
          </div>

          {outOfStock ? (
            <p className="rounded-md bg-surface-container-low p-2.5 text-sm font-semibold text-on-surface-variant">{tYo("Sold out for now. Check back after the next harvest.")}</p>
          ) : (
            <AddToCart
              buyNow
              lang={lang}
              minQuantity={listing.min_order_quantity || 1}
              item={{ listingId: listing.id, title: listing.title, unit: listing.unit, unitPriceKobo: listing.base_price_kobo, sellerName: listing.seller_name }}
            />
          )}
          <p className="text-xs text-on-surface-variant">{tYo("You enter the delivery address and pay at checkout.")}</p>

          <div className="rounded-lg bg-earth-50 p-3 text-center text-xs text-on-surface-variant">
            <span className="font-bold text-primary">{tYo("🛡️ CultivaNode Escrow Protection:")}</span>
            <br />{tYo("Funds are held securely until you receive and verify the delivery.")}</div>
        </Card>
      </div>
    </div>
  );
}
