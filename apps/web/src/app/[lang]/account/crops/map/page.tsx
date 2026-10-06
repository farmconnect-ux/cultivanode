import { notFound } from "next/navigation";
import Link from "next/link";
import { getCropById } from "@cultivanode/shared";
import { Badge, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export default async function CropMapPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const supabase = await createClient();

  const { data: rawPlots } = await (supabase as any)
    .from("plots")
    .select(`
      id, name, area_ha,
      farms(id, name, state, lga, zone),
      crop_cycles(id, crop_id, variety_id, status, current_stage, health_score, health_status, planting_date, expected_harvest_date)
    `)
    .order("name");

  const plots: any[] = rawPlots ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            <Link href={`/${lang}/account/crops`} className="hover:text-neutral-700">
              Crops
            </Link>
            <span>/</span>
            <span>Geospatial Map</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            Field & Parcel Map
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Spatial distribution of fields, crop rotations, and live agronomic stages.
          </p>
        </div>

        <Link
          href={`/${lang}/account/crops/new`}
          className="px-4 py-2 text-sm font-bold text-white bg-forest-600 rounded-xl hover:bg-forest-700"
        >
          + Plan New Cycle
        </Link>
      </div>

      {/* Geospatial Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plots.map((p) => {
          const farm = p.farms as any;
          const activeCycle = (p.crop_cycles ?? []).find((c: any) =>
            ["planning", "active", "harvesting"].includes(c.status)
          );
          const crop = activeCycle ? getCropById(activeCycle.crop_id) : null;

          return (
            <Card
              key={p.id}
              className={`p-6 flex flex-col justify-between gap-4 border-2 transition-all ${
                activeCycle
                  ? "border-forest-500/80 bg-white"
                  : "border-neutral-200 bg-neutral-50/50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      {farm?.name ?? "My Farm"}
                    </span>
                    <h3 className="text-lg font-bold text-neutral-900">{p.name}</h3>
                  </div>
                  <Badge
                    className={
                      activeCycle
                        ? "bg-leaf-100 text-leaf-800"
                        : "bg-neutral-100 text-neutral-700"
                    }
                  >
                    {activeCycle ? "Occupied" : "Fallow / Idle"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-col gap-2 text-xs text-neutral-600">
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span>Area:</span>
                    <strong>{p.area_ha ?? "—"} ha</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span>Soil Texture:</span>
                    <strong className="capitalize">{p.soil_texture ?? "Sandy loam"}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span>Irrigation:</span>
                    <strong className="capitalize">{p.irrigation_type ?? "Rainfed"}</strong>
                  </div>
                </div>

                {activeCycle ? (
                  <div className="mt-4 p-3 bg-forest-50/70 border border-forest-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-forest-950 text-sm">{crop?.name}</span>
                      <Badge className="bg-leaf-100 text-leaf-800">
                        {Math.round(Number(activeCycle.health_score) * 100)}% Health
                      </Badge>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      Stage: <strong className="capitalize">{activeCycle.current_stage.replace(/_/g, " ")}</strong>
                    </div>
                    <div className="text-xs text-neutral-500">
                      Harvest window ~ {activeCycle.expected_harvest_date}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-neutral-100 rounded-xl text-xs text-neutral-500 text-center">
                    No active crop cycle in this parcel
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex justify-end">
                {activeCycle ? (
                  <Link
                    href={`/${lang}/account/crops/${activeCycle.id}`}
                    className="text-xs font-bold text-forest-700 hover:underline"
                  >
                    View Operations & Telemetry →
                  </Link>
                ) : (
                  <Link
                    href={`/${lang}/account/crops/new`}
                    className="text-xs font-bold text-neutral-700 hover:underline"
                  >
                    Plan Crop Cycle →
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
