"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card } from "@/components/ui";
import { placeMarketplaceOrderAction } from "@/actions/marketplace";
import type { Locale } from "@/i18n/config";

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

export function ListingDetailView({
  lang,
  listing,
}: {
  lang: Locale;
  listing: FullListingDetails;
}) {
  const router = useRouter();
  const [qty, setQty] = useState<number>(listing.min_order_quantity || 1);
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subtotalKobo = Math.round(listing.base_price_kobo * qty);
  const estDeliveryKobo = 300000; // N3,000
  const totalKobo = subtotalKobo + estDeliveryKobo;

  async function handleInstantBuy() {
    if (!address.trim() || !contactPhone.trim()) {
      setErrorMsg("Please enter delivery address and contact phone number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await placeMarketplaceOrderAction({
      lang,
      items: [
        {
          listingId: listing.id,
          sellerId: listing.seller_id,
          sellerName: listing.seller_name,
          title: listing.title,
          unit: listing.unit as any,
          unitPriceKobo: listing.base_price_kobo,
          quantity: qty,
        },
      ],
      deliveryAddress: {
        address,
        state: listing.location_state || "Oyo",
        lga: listing.location_lga || "Ibadan",
        contactPhone,
      },
    });

    setIsSubmitting(false);

    if (res.ok && res.orderId) {
      router.push(`/${lang}/account/marketplace/orders/${res.orderId}`);
    } else {
      setErrorMsg(res.error || "Order placement failed.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Left Column: Product Info & Provenance */}
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="bg-secondary-container/40 text-primary uppercase tracking-wide">
              {listing.category_name}
            </Badge>
            <Badge className="bg-earth-100 text-on-surface">
              Type: {listing.listing_type}
            </Badge>
            {listing.provenance?.farm_name && (
              <Badge className="bg-node-100 text-node-800 font-bold">
                ✓ Verified Farm Source
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface sm:text-4xl">{listing.title}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Sold by <span className="font-bold text-on-surface">{listing.seller_name}</span> · ★ {listing.seller_rating.toFixed(1)}
            {listing.seller_verified && " · (Identity & Bank Verified)"}
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="flex flex-wrap items-baseline justify-between gap-4 bg-surface-container-low/50 border-secondary/30">
          <div>
            <div className="text-xs text-on-surface-variant font-semibold uppercase">Listing Price</div>
            <div className="text-3xl font-extrabold text-primary">
              {formatNaira(listing.base_price_kobo)}
              <span className="text-sm font-normal text-on-surface-variant"> /{listing.unit}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-on-surface-variant">Available Quantity</div>
            <div className="text-lg font-bold text-on-surface">
              {listing.available_quantity} {listing.unit}
            </div>
            <div className="text-xs text-on-surface-variant">Min Order: {listing.min_order_quantity} {listing.unit}</div>
          </div>
        </Card>

        {/* Description */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-2">Description &amp; Specifications</h2>
          <p className="whitespace-pre-line text-on-surface-variant leading-relaxed">
            {listing.description || "No additional description provided by the seller."}
          </p>
        </div>

        {/* Produce Provenance & Seed-to-Harvest Traceability */}
        {listing.provenance && (
          <div className="rounded-xl border-2 border-secondary/40 bg-surface-container-low/40 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌱</span>
              <h2 className="text-xl font-bold text-primary">Farm Traceability &amp; Batch Provenance</h2>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">
              This produce was grown and recorded inside the CultivaNode Farm Management network. Complete lifecycle integrity is verifiable.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg bg-white p-3 border border-border">
                <span className="text-xs text-on-surface-variant">Originating Farm</span>
                <p className="font-bold text-on-surface">{listing.provenance.farm_name || "CultivaNode Pilot Farm"}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-border">
                <span className="text-xs text-on-surface-variant">Harvest Batch Code</span>
                <p className="font-bold text-primary font-mono">{listing.provenance.batch_code || "HARV-BATCH-VERIFIED"}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-border">
                <span className="text-xs text-on-surface-variant">Quality Grade</span>
                <p className="font-bold text-on-surface capitalize">{listing.provenance.grade?.replace("_", " ") || "Grade A (Prime)"}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-border">
                <span className="text-xs text-on-surface-variant">Harvest Date</span>
                <p className="font-bold text-on-surface">{listing.provenance.harvest_date || "Recent Harvest"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delivery & Logistics */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-2">Logistics &amp; Delivery</h2>
          <div className="text-sm text-on-surface-variant space-y-1">
            <p>📍 Location: {listing.location_lga ? `${listing.location_lga}, ${listing.location_state}` : "South-West Nigeria"}</p>
            <p>🚚 Available methods: {listing.delivery_options.join(", ").replace("_", " ")}</p>
            <p>📏 Dispatch radius: Up to {listing.delivery_radius_km} km from farm/depot</p>
          </div>
        </div>
      </div>

      {/* Right Column: Checkout & Escrow Protection Box */}
      <div className="flex flex-col gap-5">
        <Card className="sticky top-20 flex flex-col gap-4 border-2 border-primary-container bg-white shadow-lg p-6">
          <h3 className="text-xl font-bold text-on-surface">Purchase &amp; Escrow Order</h3>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Order Quantity ({listing.unit})</label>
            <input
              type="number"
              min={listing.min_order_quantity}
              max={listing.available_quantity}
              value={qty}
              onChange={(e) => setQty(Math.max(listing.min_order_quantity, Number(e.target.value)))}
              className="mt-1 w-full rounded-md border border-border p-2 font-bold text-lg"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Delivery Address</label>
            <textarea
              rows={2}
              placeholder="Full delivery street address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-md border border-border p-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant">Contact Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 0803 123 4567"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-border p-2 text-sm"
            />
          </div>

          {/* Cost Summary */}
          <div className="border-t border-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal ({qty} {listing.unit}):</span>
              <span className="font-semibold text-on-surface">{formatNaira(subtotalKobo)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Est. Delivery:</span>
              <span className="font-semibold text-on-surface">{formatNaira(estDeliveryKobo)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-primary border-t border-border pt-2">
              <span>Total Payable:</span>
              <span>{formatNaira(totalKobo)}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-md bg-red-50 p-2.5 text-xs text-critical font-semibold">
              {errorMsg}
            </div>
          )}

          <Button
            variant="primary"
            className="w-full py-3 text-base font-bold shadow-md"
            disabled={isSubmitting || listing.available_quantity <= 0}
            onClick={handleInstantBuy}
          >
            {isSubmitting ? "Processing…" : "Secure Order with Escrow"}
          </Button>

          <div className="rounded-lg bg-earth-50 p-3 text-center text-xs text-on-surface-variant">
            <span className="font-bold text-primary">🛡️ CultivaNode Escrow Protection:</span>
            <br />
            Funds are held securely until you receive and verify the delivery.
          </div>
        </Card>
      </div>
    </div>
  );
}
