import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { BuyerHub } from "@/components/screens/buyer-hub";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Produce buyer & aggregator hub" };

export default async function Page({ params }: PageProps<"/[lang]/account/buyer">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const { data: batches } = await (supabase.from("farm_harvest_batches") as any)
    .select("*, farms(name, state, lga)")
    .order("created_at", { ascending: false })
    .limit(10);

  const batchList = (batches ?? []) as any[];
  const hasLiveBatches = batchList.length > 0;

  return (
    <>
      <LiveStrip tone={hasLiveBatches ? "live" : "preview"}>
        {hasLiveBatches
          ? `Connected to ${batchList.length} verified farmgate produce batch${batchList.length === 1 ? "" : "es"} open for corporate procurement and direct settlement.`
          : "Buyer & aggregator command hub displays reference procurement mandates until lots are syndicated."}
      </LiveStrip>

      <BuyerHub
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <Link
                href={`/${lang}/account/contracts`}
                className="bg-primary text-on-primary px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-primary-container transition-colors shadow-sm font-semibold"
              >
                <Icon name="handshake" className="text-[20px]" />
                <span>Review Off-take Contracts</span>
              </Link>
              <Link
                href={`/${lang}/account/harvest`}
                className="bg-surface-container text-on-surface px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-surface-container-high transition-colors"
              >
                <Icon name="grain" className="text-[20px] text-primary" />
                <span>Produce Lots Hub</span>
              </Link>
              <Link
                href={`/${lang}/account/logistics`}
                className="bg-surface-container-low text-on-surface-variant px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-space-xs hover:bg-surface-container transition-colors"
              >
                <Icon name="local_shipping" className="text-[20px] text-secondary" />
                <span>Haulage Fleet</span>
              </Link>
            </div>
          ),
        }}
      />
    </>
  );
}
