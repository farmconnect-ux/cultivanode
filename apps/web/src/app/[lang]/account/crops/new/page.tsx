import { notFound } from "next/navigation";
import Link from "next/link";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { CropPlanningWizard } from "@/components/account/crop-planning-wizard";

export default async function NewCropPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ farm?: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const { farm: farmIdParam } = await searchParams;
  const supabase = await createClient();

  // 1. Fetch authenticated user's farms
  let farmsQuery = supabase
    .from("farms")
    .select("id, name, zone")
    .order("name");

  if (farmIdParam) {
    farmsQuery = farmsQuery.eq("id", farmIdParam);
  }

  const { data: farmsData } = await farmsQuery;
  const farms = (farmsData ?? []) as Array<{ id: string; name: string; zone?: string }>;
  const farmMap = new Map<string, { id: string; name: string; zone?: string }>();
  farms.forEach((f) => farmMap.set(f.id, f));

  // 2. Fetch plots using standard schema columns guaranteed across migrations
  let plotsQuery = supabase
    .from("plots")
    .select("id, farm_id, name, area_ha, notes")
    .order("name");

  if (farmIdParam) {
    plotsQuery = plotsQuery.eq("farm_id", farmIdParam);
  } else if (farms.length > 0) {
    plotsQuery = plotsQuery.in("farm_id", farms.map((f) => f.id));
  }

  const { data: rawPlots } = await plotsQuery;
  const plotsList = (rawPlots ?? []) as Array<{
    id: string;
    farm_id: string;
    name: string;
    area_ha: number | null;
    notes: string | null;
  }>;

  // Determine scoped farm information
  let scopedFarmName = "";
  let primaryZone = "derived_savanna";

  if (farmIdParam) {
    const targetFarm = farmMap.get(farmIdParam);
    if (targetFarm) {
      scopedFarmName = targetFarm.name;
      primaryZone = targetFarm.zone || "derived_savanna";
    }
  } else if (farms.length === 1 && farms[0]) {
    scopedFarmName = farms[0].name;
    primaryZone = farms[0].zone || "derived_savanna";
  } else if (plotsList.length > 0 && plotsList[0]) {
    const firstPlotFarm = farmMap.get(plotsList[0].farm_id);
    if (firstPlotFarm) {
      primaryZone = firstPlotFarm.zone || "derived_savanna";
    }
  }

  const plots = plotsList.map((p) => {
    const parentFarm = farmMap.get(p.farm_id);
    return {
      id: p.id,
      name: p.name,
      area_ha: p.area_ha ? Number(p.area_ha) : 1.0,
      soil_texture: "Sandy loam",
      irrigation_type: "Rainfed",
      farm_id: p.farm_id,
      farm_name: parentFarm?.name ?? (scopedFarmName || "My Farm"),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            {farmIdParam ? (
              <>
                <Link href={`/${lang}/account/farms/${farmIdParam}?tab=crops`} className="hover:text-neutral-700">
                  {scopedFarmName || "Farm Hub"} (Crops)
                </Link>
                <span>/</span>
              </>
            ) : (
              <>
                <Link href={`/${lang}/account/farms`} className="hover:text-neutral-700">
                  Farms
                </Link>
                <span>/</span>
              </>
            )}
            <span>Plan Crop Cycle</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Plan Crop Cycle {scopedFarmName ? `• ${scopedFarmName}` : ""}
          </h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            Design an operational agronomic calendar powered by certified Nigerian crop templates.
          </p>
        </div>
      </div>

      <CropPlanningWizard
        lang={lang}
        plots={plots}
        farmZone={primaryZone}
        farmId={farmIdParam}
      />
    </div>
  );
}
