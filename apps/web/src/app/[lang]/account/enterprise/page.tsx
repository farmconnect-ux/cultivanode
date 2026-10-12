import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { EnterpriseDashboard } from "@/components/screens/enterprise-dashboard";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Enterprise agribusiness command center" };

export default async function Page({ params }: PageProps<"/[lang]/account/enterprise">) {
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
    .select("id, name, state, lga, area_ha")
    .or(scope.join(","))
    .order("created_at");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: cycles } = farmIds.length
    ? await (supabase.from("crop_cycles") as any).select("*").in("farm_id", farmIds)
    : { data: [] };

  const totalHa = farmList.reduce((sum, f) => sum + (Number(f.area_ha) || 0), 0);
  const hasLiveFarms = farmList.length > 0;

  return (
    <>
      <LiveStrip tone={hasLiveFarms ? "live" : "preview"}>
        {hasLiveFarms
          ? `Enterprise cluster active: ${farmList.length} estates/farms (${totalHa.toFixed(1)} ha aggregated land bank, ${(cycles ?? []).length} active production cycles).`
          : "Enterprise agribusiness command center displays sample multi-estate operations until your estates are registered."}
      </LiveStrip>
      <EnterpriseDashboard lang={lang} />
    </>
  );
}
