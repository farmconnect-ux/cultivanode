import "server-only";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";

// Public numbers that are the same for every visitor, cached across requests so busy pages
// don't re-count the whole marketplace each time. Only public (anon-readable) data goes here.

/** Live lot count, seller count and the states that have lots (refreshed every 5 minutes). */
export const getMarketplaceStats = unstable_cache(
  async () => {
    const { data } = await createAnonClient().from("marketplace_listings").select("seller_id, location_state").eq("status", "active").limit(5000);
    const rows = (data ?? []) as { seller_id: string; location_state: string | null }[];
    return {
      lots: rows.length,
      sellers: new Set(rows.map((r) => r.seller_id)).size,
      states: [...new Set(rows.map((r) => r.location_state).filter((s): s is string => Boolean(s)))].sort(),
    };
  },
  ["marketplace-stats"],
  { revalidate: 300, tags: ["marketplace"] },
);

/** Active marketplace categories (refreshed hourly). */
export const getMarketplaceCategories = unstable_cache(
  async () => {
    const { data } = await createAnonClient().from("marketplace_categories").select("slug, name").eq("is_active", true).order("sort_order");
    return (data ?? []) as { slug: string; name: string }[];
  },
  ["marketplace-categories"],
  { revalidate: 3600, tags: ["marketplace"] },
);
