import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { MarketIntelligence } from "@/components/screens/market-intelligence";
import { hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Food security & market intelligence terminal" };

export default async function Page({ params }: PageProps<"/[lang]/account/market-intel">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const supabase = await createClient();

  const { data: prices } = await (supabase.from("farm_market_commodity_prices") as any)
    .select("*")
    .order("recorded_date", { ascending: false });

  const priceList = (prices ?? []) as any[];
  const hasLivePrices = priceList.length > 0;

  return (
    <>
      <LiveStrip tone={hasLivePrices ? "live" : "preview"}>
        {hasLivePrices
          ? `Live terminal feed: ${priceList.length} monitored regional commodities across Bodija, Mile 12, Dawanau, and Shasha wholesale hubs.`
          : "Regional commodity price watchdog displays reference market rates across agricultural trade corridors."}
      </LiveStrip>

      <MarketIntelligence
        lang={lang}
        slots={{
          actions: (
            <div className="flex items-center gap-space-xs">
              <Link
                href={`/${lang}/account/harvest`}
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 shadow-sm hover:bg-primary-container transition-colors font-semibold"
              >
                <Icon name="add_shopping_cart" className="text-[16px]" />
                <span>Post Produce Listing</span>
              </Link>
              <Link
                href={`/${lang}/account/contracts`}
                className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1.5 shadow-sm hover:bg-surface-container-high transition-colors"
              >
                <Icon name="handshake" className="text-[16px] text-secondary" />
                <span>Forward Contracts</span>
              </Link>
            </div>
          ),
        }}
      />
    </>
  );
}
