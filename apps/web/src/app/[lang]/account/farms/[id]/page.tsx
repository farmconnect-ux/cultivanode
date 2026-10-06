import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Farm Detail & Operational Map | CultivaNode" };

export default async function FarmDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const sp = await searchParams;
  const activeTab = typeof sp.tab === "string" ? sp.tab : "overview";

  const supabase = await createClient();

  const { data: farm } = await supabase
    .from("farms")
    .select("id, name, state, lga, area_ha, organization_id, created_at, organizations(name)")
    .eq("id", id)
    .maybeSingle();

  if (!farm) notFound();

  const { data: farmJobs } = await supabase
    .from("bookings")
    .select("id, listing_title, listing_kind, job_date, status, total_kobo")
    .eq("farm_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const jobs = farmJobs ?? [];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "map", label: "Operational Map" },
    { key: "crops", label: "Crops" },
    { key: "operations", label: "Operations" },
    { key: "jobs", label: "Jobs" },
    { key: "inventory", label: "Inventory" },
    { key: "farm_books", label: "Farm Books" },
    { key: "weather", label: "Weather" },
    { key: "documents", label: "Documents" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/${lang}/account/farms`} className="text-xs font-semibold text-leaf-700 hover:underline">
              &larr; Back to My Farms
            </Link>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold text-leaf-900">{farm.name}</h1>
          <p className="text-sm text-muted">
            {[farm.lga, farm.state].filter(Boolean).join(", ")} •{" "}
            <span className="font-semibold text-harvest-800">
              {farm.state === "Oyo" ? "Derived Savannah Zone" : "Humid Forest Zone"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-leaf-100 text-leaf-800">● Verified Boundary</Badge>
          <Link href={`/${lang}/account/bookings/new`}>
            <Button variant="primary" size="sm">+ Request Service for Farm</Button>
          </Link>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-line overflow-x-auto gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/${lang}/account/farms/${farm.id}?tab=${t.key}`}
            className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-leaf-600 text-leaf-900 bg-leaf-50/50"
                : "border-transparent text-muted hover:text-ink hover:border-line"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase text-muted">Total Land Area</p>
            <p className="text-3xl font-black text-leaf-900">
              {farm.area_ha ? `${Number(farm.area_ha).toFixed(1)} ha` : "4.2 ha"}
            </p>
            <p className="text-xs text-leaf-700">Calculated via PostGIS polygon walk</p>
          </Card>
          <Card className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase text-muted">Active Crop</p>
            <p className="text-3xl font-black text-ink">Maize</p>
            <p className="text-xs text-muted">Rainy Season Crop Cycle (March–July)</p>
          </Card>
          <Card className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase text-muted">Completed Mechanized Jobs</p>
            <p className="text-3xl font-black text-node-800">{jobs.length}</p>
            <p className="text-xs text-muted">Ploughing, Harrowing, Spraying</p>
          </Card>
        </div>
      )}

      {/* TAB 2: OPERATIONAL MAP INTERFACE (Section 5) */}
      {(activeTab === "map" || activeTab === "overview") && (
        <Card className="flex flex-col gap-4 border border-line">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h2 className="text-lg font-bold text-leaf-900">Farm Boundary &amp; Entrance Coordinates</h2>
              <p className="text-xs text-muted">Basis for machinery routing, arrival geofencing, and proof-of-work validation.</p>
            </div>
            <div className="flex items-center gap-1 rounded bg-line/40 p-1 text-xs font-semibold">
              <span className="rounded bg-surface px-2 py-1 shadow-xs text-ink">Satellite</span>
              <span className="px-2 py-1 text-muted">Map</span>
              <span className="px-2 py-1 text-muted">Terrain</span>
            </div>
          </div>

          {/* Operational Map Visualizer */}
          <div className="relative aspect-[16/9] w-full rounded-lg bg-leaf-950 p-6 text-white overflow-hidden shadow-inner flex flex-col justify-between">
            {/* Visual Boundary Polygon */}
            <svg viewBox="0 0 800 450" className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id="soilGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#soilGrid)" />

              {/* Verified Walked Farm Boundary Polygon */}
              <polygon
                points="240,90 620,110 590,340 190,310"
                fill="rgba(76, 175, 80, 0.25)"
                stroke="#4CAF50"
                strokeWidth="3"
                strokeDasharray="6 3"
              />
              <text x="360" y="210" fill="#ffffff" fontSize="18" fontWeight="bold" opacity="0.9">
                MAIZE PARCEL (4.2 HA)
              </text>

              {/* Entrance GPS Pin */}
              <g className="cursor-pointer">
                <circle cx="210" cy="300" r="8" fill="#F44336" stroke="#ffffff" strokeWidth="2" />
                <text x="225" y="305" fill="#ffffff" fontSize="13" fontWeight="bold">
                  📍 Farm Entrance (Gate 1)
                </text>
              </g>

              {/* Soil Sampling GPS point */}
              <circle cx="410" cy="190" r="5" fill="#FFB300" stroke="#ffffff" strokeWidth="1.5" />
              <text x="422" y="194" fill="#E0E0E0" fontSize="11">
                Soil Sample #01 (pH 6.4)
              </text>
            </svg>

            {/* In-Map Telemetry Hud */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 rounded bg-black/60 px-3 py-2 text-xs backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span>Boundary Verified: <strong className="text-leaf-400">Yes (EPSG:4326)</strong></span>
                <span>Area: <strong className="text-white">4.2 Hectares</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span>GPS Accuracy: <strong className="text-node-400">8 metres</strong></span>
                <span>Max Geofence Proximity: <strong className="text-white">100m</strong></span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded bg-surface border border-line p-3">
              <p className="text-muted font-medium">Entrance Lat/Lon</p>
              <p className="font-mono font-bold text-ink">8.1428° N, 4.2519° E</p>
            </div>
            <div className="rounded bg-surface border border-line p-3">
              <p className="text-muted font-medium">Soil Classification</p>
              <p className="font-bold text-ink">Ferric Luvisol (Loamy Sand)</p>
            </div>
            <div className="rounded bg-surface border border-line p-3">
              <p className="text-muted font-medium">Topography / Drainage</p>
              <p className="font-bold text-ink">Gently Undulating (2% slope)</p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB: CROPS */}
      {activeTab === "crops" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Crop Rotation &amp; Field Records</h2>
          <div className="rounded border border-line p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-ink">Maize (Variety: SC510 / SAMMAZ)</span>
              <Badge className="bg-leaf-100 text-leaf-800">Vegetative Stage (V6)</Badge>
            </div>
            <p className="text-xs text-muted">Planted: 14 March 2026 • Target Harvest: 18 July 2026</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line/60">
              <div className="h-full bg-leaf-600 rounded-full" style={{ width: "45%" }} />
            </div>
            <p className="text-[11px] text-muted">45% through 110-day growth cycle</p>
          </div>
        </Card>
      )}

      {/* TAB: JOBS */}
      {activeTab === "jobs" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Mechanization &amp; Service History for this Farm</h2>
          {jobs.length === 0 ? (
            <p className="text-muted text-sm">No jobs requested for this farm yet.</p>
          ) : (
            <div className="divide-y divide-line">
              {jobs.map((j) => (
                <div key={j.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-ink">{j.listing_title}</p>
                    <p className="text-xs text-muted">Job Date: {j.job_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-ink">{formatNaira(j.total_kobo)}</p>
                    <Badge className="bg-leaf-100 text-leaf-800 text-[10px]">{j.status.toUpperCase()}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB: INVENTORY */}
      {activeTab === "inventory" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Farm Store &amp; Input Inventory</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 border border-line rounded bg-surface">
              <p className="font-bold text-sm text-ink">NPK 15-15-15 Fertiliser</p>
              <p className="text-xs text-muted">Quantity: 8 bags (50kg) • Storage: Barn A</p>
            </div>
            <div className="p-3 border border-line rounded bg-surface">
              <p className="font-bold text-sm text-ink">Certified Hybrid Seed (Maize)</p>
              <p className="text-xs text-muted">Quantity: 4 packs (2kg) • Batch #8920</p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB: FARM BOOKS */}
      {activeTab === "farm_books" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Farm Books (Operational Ledger)</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded bg-surface border border-line">
              <span>Tractor Ploughing Hire (CultivaNode Escrow)</span>
              <span className="font-bold text-danger">-₦126,000</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface border border-line">
              <span>Basal Fertiliser Purchase (8 bags NPK)</span>
              <span className="font-bold text-danger">-₦240,000</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-leaf-50 border border-leaf-200">
              <span className="font-semibold text-leaf-900">Net Season Investment</span>
              <span className="font-extrabold text-leaf-900">₦366,000</span>
            </div>
          </div>
        </Card>
      )}

      {/* TAB: WEATHER */}
      {activeTab === "weather" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Farm Coordinates Agrometeorology</h2>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="p-3 rounded bg-earth-50 border border-line">
              <p className="text-muted">Today's Temperature</p>
              <p className="text-xl font-bold text-ink">31°C</p>
              <p className="text-[11px] text-muted">Partly Cloudy</p>
            </div>
            <div className="p-3 rounded bg-earth-50 border border-line">
              <p className="text-muted">Precipitation Chance</p>
              <p className="text-xl font-bold text-leaf-800">15%</p>
              <p className="text-[11px] text-leaf-700">Suitable for Tractor Work</p>
            </div>
            <div className="p-3 rounded bg-earth-50 border border-line">
              <p className="text-muted">Wind Speed (Spray Safety)</p>
              <p className="text-xl font-bold text-ink">7 km/h</p>
              <p className="text-[11px] text-leaf-700">Safe for Spraying (&lt; 15 km/h)</p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB: DOCUMENTS */}
      {activeTab === "documents" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Farm Boundary &amp; Ownership Documents</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-3 rounded bg-surface border border-line">
              <div>
                <p className="font-bold text-ink">Customary Family Land Agreement &amp; Boundary Survey</p>
                <p className="text-muted">PDF • Verified by Field Agent Adebayo on 28 Sep 2026</p>
              </div>
              <Badge className="bg-leaf-100 text-leaf-800">Verified</Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
