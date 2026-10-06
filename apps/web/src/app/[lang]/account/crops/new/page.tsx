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

  // Fetch plots for the current authenticated user's farms
  const { data: rawPlots } = await (supabase as any)
    .from("plots")
    .select("id, name, area_ha, soil_texture, irrigation_type, farm_id, farms(id, name, zone)")
    .order("name");

  let filteredPlots = (rawPlots ?? []) as any[];
  let scopedFarmName = "";
  if (farmIdParam) {
    const scoped = filteredPlots.filter((p: any) => p.farm_id === farmIdParam);
    if (scoped.length > 0) {
      filteredPlots = scoped;
      scopedFarmName = scoped[0]?.farms?.name ?? "";
    }
  }

  const plots = filteredPlots.map((p: any) => ({
    id: p.id,
    name: p.name,
    area_ha: p.area_ha ? Number(p.area_ha) : 1.0,
    soil_texture: p.soil_texture,
    irrigation_type: p.irrigation_type,
    farm_id: p.farm_id,
    farm_name: p.farms?.name ?? "My Farm",
  }));

  const primaryZone = (filteredPlots[0] as any)?.farms?.zone ?? "derived_savanna";

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
      />
    </div>
  );
}
