import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { FarmGeospatialMap } from "@/components/screens/farm-geospatial-map";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Farm map & cadastre" };

export default async function Page({ params }: PageProps<"/[lang]/account/farms/map">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const [{ data: farms }, { data: plots }] = await Promise.all([
    supabase.from("farms").select("id, name, state, lga, area_ha, boundary_geojson, centroid_lat, centroid_lng").or(scope.join(",")).order("created_at"),
    supabase.from("plots").select("id, farm_id, name, area_ha, boundary_geojson, crop_name, variety, season, planted_date").or(scope.join(",")).order("created_at"),
  ]);

  const farmList = farms ?? [];
  const plotList = plots ?? [];

  const hasLiveData = farmList.length > 0;

  return (
    <>
      <LiveStrip tone={hasLiveData ? "live" : "preview"}>
        {hasLiveData
          ? `Showing ${farmList.length} farm${farmList.length === 1 ? "" : "s"} with ${plotList.length} plot${plotList.length === 1 ? "" : "s"} on interactive cadastral map.`
          : "Interactive farm map shows reference cadastral design until you register your first farm."}
      </LiveStrip>
      <FarmGeospatialMap
        lang={lang}
        farms={farmList}
        plots={plotList}
      />
    </>
  );
}
