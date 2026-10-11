"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import type { Locale } from "@/i18n/config";

export interface ListingCardItem {
  id: string;
  title: string;
  listing_type: string;
  category_name: string;
  category_slug: string;
  base_price_kobo: number;
  unit: string;
  available_quantity: number;
  seller_id: string;
  seller_name: string;
  seller_type: string;
  seller_rating: number;
  distance_km?: number | null;
  location_state?: string | null;
  location_lga?: string | null;
  has_provenance?: boolean;
}

export function MarketGrid({
  lang,
  initialListings,
}: {
  lang: Locale;
  initialListings: ListingCardItem[];
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedRadius, setSelectedRadius] = useState<string>("50");

  const categories = [
    { slug: "all", label: "All Items" },
    { slug: "produce", label: "Farm Produce" },
    { slug: "inputs", label: "Farm Inputs" },
    { slug: "machinery", label: "Machinery Hire" },
    { slug: "labour", label: "Farm Labour" },
    { slug: "services", label: "Agri Services" },
  ];

  const filtered = initialListings.filter((item) => {
    const matchesTab =
      activeTab === "all" ||
      item.listing_type === activeTab ||
      item.category_slug.includes(activeTab);
    const matchesQuery =
      query.trim() === "" ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.seller_name.toLowerCase().includes(query.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <Input
            placeholder="Search produce, fertilizers, tractors, labour..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="w-full"
          />
          <Select
            value={selectedRadius}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRadius(e.target.value)}
          >
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
            <option value="200">Across Region</option>
          </Select>
          <Button variant="primary" onClick={() => {}}>
            Search
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setActiveTab(c.slug)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activeTab === c.slug
                  ? "bg-primary-container text-white shadow-sm"
                  : "bg-earth-50 text-on-surface hover:bg-earth-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Listings */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-12 text-center">
          <span className="text-4xl mb-3">🌾</span>
          <h3 className="text-lg font-bold text-on-surface">No marketplace listings match your query</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Try adjusting your search terms, increasing radius, or switching categories.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between hover:shadow-md transition">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge className="bg-secondary-container/40 text-primary uppercase tracking-wider text-[11px]">
                    {item.category_name}
                  </Badge>
                  {item.has_provenance && (
                    <Badge className="bg-node-100 text-node-800 text-[11px] font-bold">
                      ✓ Farm Verified
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-on-surface line-clamp-2">
                    <Link href={`/${lang}/marketplace/${item.id}`} className="hover:text-primary-container">
                      {item.title}
                    </Link>
                  </h3>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Seller: <span className="font-semibold text-on-surface">{item.seller_name}</span> · ★ {item.seller_rating.toFixed(1)}
                  </p>
                </div>

                <div className="rounded-md bg-earth-50 p-2.5">
                  <div className="text-xs text-on-surface-variant">Available Stock</div>
                  <div className="text-sm font-bold text-primary">
                    {item.available_quantity} {item.unit} available
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>📍 {item.location_lga ? `${item.location_lga}, ${item.location_state}` : "South-West Nigeria"}</span>
                  {item.distance_km != null && (
                    <span className="font-semibold text-primary">{item.distance_km} km away</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-on-surface-variant">Price</div>
                  <div className="text-lg font-extrabold text-primary">
                    {formatNaira(item.base_price_kobo)}
                    <span className="text-xs font-normal text-on-surface-variant"> /{item.unit}</span>
                  </div>
                </div>

                <Link
                  href={`/${lang}/marketplace/${item.id}`}
                  className="rounded-lg bg-primary-container px-4 py-2 text-sm font-bold text-white hover:bg-primary transition"
                >
                  View Details
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
