import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { GovernmentIntel } from "@/components/screens/government-intel";
import { hasLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Government agricultural intelligence & food security" };

export default async function Page({ params }: PageProps<"/[lang]/account/gov">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const supabase = await createClient();

  const [{ count: farmCount }, { count: listingCount }] = await Promise.all([
    supabase.from("farms").select("*", { count: "exact", head: true }),
    supabase.from("marketplace_listings").select("*", { count: "exact", head: true }),
  ]);

  const hasData = (farmCount ?? 0) > 0;

  return (
    <>
      <LiveStrip tone={hasData ? "live" : "preview"}>
        {hasData
          ? `Oyo State Agri-Oversight: Monitoring ${farmCount} registered agro-parcels and ${listingCount ?? 0} active food supply listings across all 33 LGAs.`
          : "Government food security command terminal displays reference regional census indices until state nodes sync."}
      </LiveStrip>
      <GovernmentIntel lang={lang} />
    </>
  );
}
