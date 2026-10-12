import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { SupplierHub } from "@/components/screens/supplier-hub";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Input supplier & agro-dealer hub" };

export default async function Page({ params }: PageProps<"/[lang]/account/supplier">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, state, lga")
    .or(scope.join(","))
    .order("created_at");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: inventory } = farmIds.length
    ? await (supabase.from("farm_inventory") as any)
        .select("*")
        .in("farm_id", farmIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const items = (inventory ?? []) as any[];
  const hasLiveItems = items.length > 0;

  return (
    <>
      <LiveStrip tone={hasLiveItems ? "live" : "preview"}>
        {hasLiveItems
          ? `Connected to ${items.length} verified input inventory record${items.length === 1 ? "" : "s"} across active supply depot nodes.`
          : "Agro-dealer command hub displays reference input catalogues until stock items are registered."}
      </LiveStrip>

      <SupplierHub
        lang={lang}
        slots={{
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm self-start md:self-auto">
              <Link
                href={`/${lang}/account/inventory`}
                className="flex items-center gap-space-xs px-space-md py-2 bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-primary transition-colors font-semibold"
              >
                <Icon name="add_circle" className="text-[18px]" />
                <span>+ Add Stock Line</span>
              </Link>
              <Link
                href={`/${lang}/account/logistics`}
                className="flex items-center gap-space-xs px-space-md py-2 bg-surface-container-lowest text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm hover:bg-surface-container-high transition-colors"
              >
                <Icon name="local_shipping" className="text-[18px] text-secondary" />
                <span>Logistics Manifest</span>
              </Link>
            </div>
          ),
        }}
      />
    </>
  );
}
