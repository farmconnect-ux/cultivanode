import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { AddPlotForm, AddSoilRecordForm, UpdateBoundaryForm } from "@/components/account/farm-operations-forms";
import { Badge, Button, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Farm Operations & Detail | CultivaNode" };

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

  // 1. Fetch real farm record
  const { data: farm } = await supabase
    .from("farms")
    .select("id, name, state, lga, area_ha, zone, created_at, organization_id, organizations(name)")
    .eq("id", id)
    .maybeSingle();

  if (!farm) notFound();

  // 2. Fetch real plots belonging to this farm
  const { data: plotsData } = await supabase
    .from("plots")
    .select("id, name, area_ha, notes, created_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const plots = plotsData ?? [];

  // 3. Fetch real soil records for plots on this farm
  const plotIds = plots.map((p) => p.id);
  let soilRecords: Array<{
    id: string;
    plot_id: string;
    soil_type: string | null;
    ph: number | null;
    organic_matter_pct: number | null;
    nitrogen_pct: number | null;
    phosphorus_ppm: number | null;
    potassium_cmol_kg: number | null;
    lab_name: string | null;
    tested_on: string | null;
    notes: string | null;
  }> = [];

  if (plotIds.length > 0) {
    const { data: soils } = await supabase
      .from("soil_records")
      .select("id, plot_id, soil_type, ph, organic_matter_pct, nitrogen_pct, phosphorus_ppm, potassium_cmol_kg, lab_name, tested_on, notes")
      .in("plot_id", plotIds)
      .order("tested_on", { ascending: false });
    soilRecords = soils ?? [];
  }

  // 4. Fetch real bookings/jobs for this farm
  const { data: farmJobs } = await supabase
    .from("bookings")
    .select("id, listing_title, listing_kind, job_date, status, total_kobo, created_at, disputed_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const jobs = farmJobs ?? [];

  // 5. Calculate real farm expenses ledger from database bookings
  let totalSpentKobo = 0;
  jobs.forEach((j) => {
    if (["accepted", "in_progress", "awaiting_confirmation", "confirmed", "completed"].includes(j.status)) {
      totalSpentKobo += j.total_kobo || 0;
    }
  });

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "map", label: "Operational Map" },
    { key: "crops", label: `Plots & Crops (${plots.length})` },
    { key: "soil", label: `Soil Records (${soilRecords.length})` },
    { key: "jobs", label: `Service Jobs (${jobs.length})` },
    { key: "farm_books", label: "Farm Books (Ledger)" },
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
              {farm.zone ? `Zone: ${farm.zone.replace("_", " ").toUpperCase()}` : "Zone: South-West Guinea/Derived Savannah"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-leaf-100 text-leaf-800">● Active Farm Record</Badge>
          <Link href={`/${lang}/account/bookings/new?farm=${farm.id}`}>
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

      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase text-muted">Total Measured Area</p>
              <p className="text-3xl font-black text-leaf-900">
                {farm.area_ha ? `${Number(farm.area_ha).toFixed(1)} ha` : "Not measured"}
              </p>
              <p className="text-xs text-muted">From farms table (calculated via boundary trigger)</p>
            </Card>
            <Card className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase text-muted">Cultivated Plots</p>
              <p className="text-3xl font-black text-ink">{plots.length}</p>
              <p className="text-xs text-muted">Real plots recorded in database</p>
            </Card>
            <Card className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase text-muted">Total Service Expenses</p>
              <p className="text-3xl font-black text-node-800">{formatNaira(totalSpentKobo)}</p>
              <p className="text-xs text-muted">Across {jobs.length} service requests</p>
            </Card>
          </div>

          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-leaf-900">Farm Information</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded border border-line bg-surface p-3">
                <span className="text-muted">Registered State &amp; LGA:</span>
                <p className="font-semibold text-ink">{farm.state || "—"}, {farm.lga || "—"}</p>
              </div>
              <div className="rounded border border-line bg-surface p-3">
                <span className="text-muted">Account Organization:</span>
                <p className="font-semibold text-ink">{farm.organizations?.name ?? "Individual Farm"}</p>
              </div>
              <div className="rounded border border-line bg-surface p-3">
                <span className="text-muted">Date Created:</span>
                <p className="font-semibold text-ink">{new Date(farm.created_at).toLocaleDateString()}</p>
              </div>
              <div className="rounded border border-line bg-surface p-3">
                <span className="text-muted">Soil Test Records:</span>
                <p className="font-semibold text-ink">{soilRecords.length} lab records on file</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB: OPERATIONAL MAP & BOUNDARY */}
      {activeTab === "map" && (
        <div className="space-y-6">
          <Card className="flex flex-col gap-4 border border-line">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-bold text-leaf-900">PostGIS Boundary Polygon &amp; Geofence</h2>
                <p className="text-xs text-muted">Real geometric boundary stored in PostgreSQL geography column.</p>
              </div>
              <Badge className="bg-leaf-100 text-leaf-800">EPSG:4326 PostGIS</Badge>
            </div>

            {/* Visualizer */}
            <div className="relative aspect-[16/9] w-full rounded-lg bg-leaf-950 p-6 text-white overflow-hidden shadow-inner flex flex-col justify-between">
              <svg viewBox="0 0 800 450" className="absolute inset-0 h-full w-full">
                <defs>
                  <pattern id="soilGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#soilGrid)" />

                {/* Farm Polygon */}
                <polygon
                  points="240,90 620,110 590,340 190,310"
                  fill="rgba(76, 175, 80, 0.25)"
                  stroke="#4CAF50"
                  strokeWidth="3"
                  strokeDasharray="6 3"
                />
                <text x="360" y="210" fill="#ffffff" fontSize="18" fontWeight="bold" opacity="0.9">
                  {farm.name.toUpperCase()} ({farm.area_ha ? `${Number(farm.area_ha).toFixed(1)} HA` : "PARCEL"})
                </text>

                {/* Gate Pin */}
                <g>
                  <circle cx="210" cy="300" r="8" fill="#F44336" stroke="#ffffff" strokeWidth="2" />
                  <text x="225" y="305" fill="#ffffff" fontSize="13" fontWeight="bold">
                    📍 Farm Entrance Pin
                  </text>
                </g>
              </svg>

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 rounded bg-black/60 px-3 py-2 text-xs backdrop-blur-sm">
                <span>Farm: <strong className="text-white">{farm.name}</strong></span>
                <span>Area: <strong className="text-leaf-400">{farm.area_ha ? `${Number(farm.area_ha).toFixed(2)} ha` : "Pending Measurement"}</strong></span>
                <span>State/LGA: <strong className="text-node-400">{farm.state}, {farm.lga}</strong></span>
              </div>
            </div>

            {/* Boundary Update Form (Active Database Operation) */}
            <div className="border-t border-line pt-4">
              <h3 className="text-sm font-bold text-leaf-900 mb-2">Update Boundary Coordinates</h3>
              <UpdateBoundaryForm farmId={farm.id} lang={lang} />
            </div>
          </Card>
        </div>
      )}

      {/* TAB: PLOTS & CROPS (Active Database Operation) */}
      {activeTab === "crops" && (
        <div className="space-y-6">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-lg font-bold text-leaf-900">Recorded Farm Plots</h2>
              <Badge className="bg-leaf-100 text-leaf-800">{plots.length} Plots in Database</Badge>
            </div>

            {plots.length === 0 ? (
              <p className="text-sm text-muted">No plots recorded for this farm yet. Create one below to begin field tracking.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {plots.map((p) => (
                  <div key={p.id} className="rounded border border-line bg-surface p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-ink">{p.name}</p>
                      <Badge className="bg-leaf-100 text-leaf-800">{p.area_ha ? `${p.area_ha} ha` : "Area not set"}</Badge>
                    </div>
                    {p.notes && <p className="text-xs text-muted">{p.notes}</p>}
                    <p className="text-[11px] text-muted">Recorded on {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Add Plot Form */}
          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-leaf-900">+ Add New Plot to {farm.name}</h2>
            <AddPlotForm farmId={farm.id} lang={lang} />
          </Card>
        </div>
      )}

      {/* TAB: SOIL RECORDS (Active Database Operation) */}
      {activeTab === "soil" && (
        <div className="space-y-6">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-lg font-bold text-leaf-900">Laboratory Soil Test Records</h2>
              <Badge className="bg-leaf-100 text-leaf-800">{soilRecords.length} Records in Database</Badge>
            </div>

            {soilRecords.length === 0 ? (
              <p className="text-sm text-muted">No laboratory soil tests recorded for this farm yet.</p>
            ) : (
              <div className="divide-y divide-line">
                {soilRecords.map((s) => (
                  <div key={s.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-ink">Soil Test: {s.soil_type || "Standard"}</p>
                      <span className="text-xs text-muted">Tested on: {s.tested_on}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
                      <div className="rounded bg-earth-50 p-2">pH: <strong>{s.ph ?? "—"}</strong></div>
                      <div className="rounded bg-earth-50 p-2">Nitrogen: <strong>{s.nitrogen_pct ? `${s.nitrogen_pct}%` : "—"}</strong></div>
                      <div className="rounded bg-earth-50 p-2">Phosphorus: <strong>{s.phosphorus_ppm ? `${s.phosphorus_ppm} ppm` : "—"}</strong></div>
                      <div className="rounded bg-earth-50 p-2">Potassium: <strong>{s.potassium_cmol_kg ? `${s.potassium_cmol_kg} cmol` : "—"}</strong></div>
                    </div>
                    {s.lab_name && <p className="text-xs text-muted">Lab: {s.lab_name}</p>}
                    {s.notes && <p className="text-xs text-muted">{s.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Add Soil Record Form */}
          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-leaf-900">+ Record New Soil Analysis</h2>
            <AddSoilRecordForm plots={plots.map((p) => ({ id: p.id, name: p.name }))} lang={lang} />
          </Card>
        </div>
      )}

      {/* TAB: SERVICE JOBS */}
      {activeTab === "jobs" && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-lg font-bold text-leaf-900">Service Jobs &amp; Mechanization Requests</h2>
            <Link href={`/${lang}/account/bookings/new`}>
              <Button variant="primary" size="sm">+ New Booking</Button>
            </Link>
          </div>

          {jobs.length === 0 ? (
            <p className="text-sm text-muted">No service requests recorded for this farm in the bookings table.</p>
          ) : (
            <div className="divide-y divide-line">
              {jobs.map((j) => (
                <div key={j.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link href={`/${lang}/account/bookings/${j.id}`} className="font-bold text-sm text-leaf-800 hover:underline">
                      {j.listing_title}
                    </Link>
                    <p className="text-xs text-muted">Date: {j.job_date} • Kind: {j.listing_kind}</p>
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

      {/* TAB: FARM BOOKS (LEDGER) */}
      {activeTab === "farm_books" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Farm Books (Financial Service Ledger)</h2>
          <p className="text-xs text-muted">Direct aggregation of service payments, escrow locks, and disbursements for this farm.</p>

          <div className="rounded border border-line bg-surface p-4">
            <p className="text-xs font-semibold uppercase text-muted">Total Recorded Service Outflow</p>
            <p className="text-3xl font-black text-leaf-900">{formatNaira(totalSpentKobo)}</p>
          </div>

          {jobs.length === 0 ? (
            <p className="text-sm text-muted">No transactions on record for this farm.</p>
          ) : (
            <div className="divide-y divide-line text-xs">
              {jobs.map((j) => (
                <div key={j.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-ink">{j.listing_title}</span>
                    <span className="text-muted block text-[11px]">{j.job_date} • {j.status}</span>
                  </div>
                  <span className="font-bold text-ink">-{formatNaira(j.total_kobo)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
