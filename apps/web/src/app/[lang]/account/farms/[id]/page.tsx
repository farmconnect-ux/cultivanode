import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { hasLocale, type Locale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { createFarmPlot, deleteFarmPlot } from "@/actions/farm-plots";

interface Props {
  params: Promise<{ lang: string; id: string }>;
}

export default async function FarmDetailPage({ params }: Props) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang as Locale);
  const supabase = await createClient();

  const { data: farm } = await supabase
    .from("farms")
    .select("*, organizations(name)")
    .eq("id", id)
    .single();

  if (!farm) notFound();

  // Fetch plots for this farm
  const { data: plots } = await supabase
    .from("plots")
    .select("*")
    .eq("farm_id", id)
    .order("name");

  const totalPlotArea = (plots || []).reduce((acc, p) => acc + (Number(p.size_hectares) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href={`/${lang}/account/farms`} className="hover:underline">
              ← Back to Farms
            </Link>
            <span>/</span>
            <span className="font-semibold text-ink">{farm.name}</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-leaf-900 sm:text-3xl">{farm.name}</h1>
          <p className="text-xs text-muted">
            {[farm.lga, farm.state].filter(Boolean).join(", ")} &bull;{" "}
            {farm.area_ha ? `${Number(farm.area_ha).toFixed(1)} ha total land` : "Unspecified land size"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${lang}/account/crops?farm_id=${farm.id}`}
            className="rounded-lg bg-leaf-700 px-3 py-2 text-xs font-bold text-white hover:bg-leaf-800 transition-colors"
          >
            🌽 View Crop Cycles
          </Link>
          <Link
            href={`/${lang}/account/find?farm=${farm.id}`}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink hover:bg-neutral-50 transition-colors"
          >
            🚜 Hire Machinery
          </Link>
        </div>
      </div>

      {/* Farm Land Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-leaf-600">
          <p className="text-xs font-medium text-muted">Total Farm Size</p>
          <p className="text-lg font-black text-leaf-900 mt-1">
            {farm.area_ha ? `${Number(farm.area_ha).toFixed(1)} ha` : "N/A"}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-harvest-600">
          <p className="text-xs font-medium text-muted">Delineated Plots</p>
          <p className="text-lg font-black text-harvest-900 mt-1">{plots?.length || 0} Plots</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-sky-600">
          <p className="text-xs font-medium text-muted">Mapped Cultivated Area</p>
          <p className="text-lg font-black text-sky-900 mt-1">{totalPlotArea.toFixed(1)} ha</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <p className="text-xs font-medium text-muted">Agro-Ecological Zone</p>
          <p className="text-sm font-bold text-indigo-900 mt-1">
            {farm.state === "Oyo" ? "Derived Savannah" : farm.state === "Osun" ? "Guinea Savannah" : "Humid Forest"}
          </p>
        </Card>
      </div>

      {/* Main Plots Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Plots Listing */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Field Plots & Parcels</h2>
            <Badge tone="leaf">{plots?.length || 0} Registered</Badge>
          </div>

          {(!plots || plots.length === 0) ? (
            <Card className="p-8 text-center border-dashed">
              <span className="text-3xl">🗺️</span>
              <p className="mt-2 text-sm font-bold text-ink">No field plots registered yet</p>
              <p className="text-xs text-muted mt-1">
                Sub-divide your farm into distinct plots to manage crop cycles, soil tests, and operations.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {plots.map((plot) => (
                <Card key={plot.id} className="p-4 border border-line flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-ink">{plot.name}</h3>
                      {plot.code && <Badge tone="default">{plot.code}</Badge>}
                    </div>
                    <p className="text-xs font-semibold text-leaf-800">
                      {Number(plot.size_hectares).toFixed(2)} Hectares
                    </p>
                    <div className="flex flex-wrap gap-1 text-[11px] text-muted pt-1">
                      {plot.soil_type && <span>Soil: {plot.soil_type} &bull;</span>}
                      <span>Slope: {plot.slope} &bull;</span>
                      <span>{plot.irrigation_status}</span>
                    </div>
                    {plot.notes && <p className="text-[11px] text-neutral-500 italic mt-1">{plot.notes}</p>}
                  </div>

                  <div className="border-t border-line pt-2 flex items-center justify-between">
                    <Link
                      href={`/${lang}/account/crops?farm_id=${farm.id}&plot_id=${plot.id}`}
                      className="text-xs font-bold text-leaf-700 hover:underline"
                    >
                      🌽 Start Crop Cycle
                    </Link>
                    <form action={deleteFarmPlot}>
                      <input type="hidden" name="plot_id" value={plot.id} />
                      <input type="hidden" name="farm_id" value={farm.id} />
                      <button
                        type="submit"
                        className="text-xs text-danger-600 hover:text-danger-800 transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right: Add Plot Form */}
        <div>
          <Card className="p-5 border border-line shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink">Register Field Plot</h2>
              <p className="text-xs text-muted mt-0.5">Define a distinct cultivation plot or parcel.</p>
            </div>

            <form action={createFarmPlot} className="space-y-3">
              <input type="hidden" name="farm_id" value={farm.id} />

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Plot Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Block A - North Field"
                  className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Code / Identifier</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g. PL-01"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Size (Hectares) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="size_hectares"
                    required
                    placeholder="e.g. 2.5"
                    className="w-full rounded-md border border-line px-3 py-2 text-xs focus:outline-leaf-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Soil Type</label>
                  <select
                    name="soil_type"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Silt Loam">Silt Loam</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Clay">Clay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Slope Profile</label>
                  <select
                    name="slope"
                    className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                  >
                    <option value="flat">Flat (0-2%)</option>
                    <option value="gentle">Gentle (2-5%)</option>
                    <option value="moderate">Moderate (5-10%)</option>
                    <option value="steep">Steep (&gt;10%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Irrigation Availability</label>
                <select
                  name="irrigation_status"
                  className="w-full rounded-md border border-line px-2 py-2 text-xs focus:outline-leaf-600 bg-surface"
                >
                  <option value="rainfed">Rainfed Only</option>
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler System</option>
                  <option value="furrow">Furrow / Flood</option>
                  <option value="borehole_access">Nearby Borehole / River</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Plot Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Notes on previous crop, weed pressure, or drainage..."
                  className="w-full rounded-md border border-line px-3 py-1.5 text-xs focus:outline-leaf-600"
                />
              </div>

              <Button type="submit" className="w-full bg-leaf-700 hover:bg-leaf-800 text-white font-bold text-xs py-2">
                ➕ Save Field Plot
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
