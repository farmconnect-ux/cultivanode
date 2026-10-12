import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui";
import { Icon } from "@/components/ds/icon";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { createCropCycle } from "@/actions/crop-plans";

export const metadata: Metadata = { title: "Start New Crop Cycle" };

const CROP_TEMPLATES = [
  { name: "Maize (Agbado)", variety: "DMR-LSR-Y", standardId: "maize_savanna_v2", cycleDays: 110, targetYieldPerHa: 4500 },
  { name: "Cassava (Ege)", variety: "TME 419", standardId: "cassava_savanna_v2", cycleDays: 330, targetYieldPerHa: 28000 },
  { name: "Tomato (Tomati)", variety: "Roma VF", standardId: "tomato_irrigated_v1", cycleDays: 95, targetYieldPerHa: 22000 },
  { name: "Cowpea (Ewa)", variety: "SAMPEA-14", standardId: "cowpea_savanna_v1", cycleDays: 75, targetYieldPerHa: 1800 },
  { name: "Rice (Iresi)", variety: "FARO 44", standardId: "rice_lowland_v1", cycleDays: 120, targetYieldPerHa: 5000 },
  { name: "Soybean", variety: "TGX 1448-2E", standardId: "soybean_savanna_v1", cycleDays: 105, targetYieldPerHa: 2200 },
];

interface Props {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ error?: string }>;
}

export default async function NewCropCyclePage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const sp = searchParams ? await searchParams : {};

  // Compute default harvest date once to avoid impure Date.now() in render
  // eslint-disable-next-line react-hooks/purity -- Server Component: default date computed once per request
  const defaultHarvestDate = new Date(Date.now() + 110 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const errorMessage = sp?.error ? decodeURIComponent(sp.error) : null;
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
    .order("name");

  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);

  const { data: plots } = farmIds.length
    ? await supabase.from("plots").select("id, farm_id, name, area_ha").in("farm_id", farmIds).order("name")
    : { data: [] };

  const plotList = plots ?? [];

  async function handleCreate(formData: FormData) {
    "use server";
    const res = await createCropCycle(formData);
    if (res && "error" in res && res.error) {
      redirect(`/${lang}/account/crops/new?error=${encodeURIComponent(res.error)}`);
    }
    redirect(`/${lang}/account/crops`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-3 shadow-sm">
          <Icon name="error" className="text-2xl text-red-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Unable to launch crop cycle</p>
            <p className="text-xs mt-0.5 text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/${lang}/account/crops`}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            <Icon name="arrow_back" className="text-base" /> Back to Crop Management
          </Link>
          <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">
            Start New Crop Cycle
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Initialize phenology modeling, Growing Degree Day (GDD) tracking, and split-input schedule for your plot.
          </p>
        </div>
      </div>

      {farmList.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
          <Icon name="add_location_alt" className="mx-auto text-4xl text-secondary" />
          <h2 className="mt-4 font-headline-sm text-headline-sm text-on-surface font-semibold">
            No farms registered yet
          </h2>
          <p className="mt-2 text-body-sm text-on-surface-variant max-w-md mx-auto">
            You must register a farm and at least one plot before launching a crop cycle.
          </p>
          <div className="mt-6">
            <Link
              href={`/${lang}/account/farms/new`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 font-label-md text-label-md text-on-primary hover:bg-primary transition-all font-semibold"
            >
              <Icon name="add" className="text-base" /> Register Farm First
            </Link>
          </div>
        </div>
      ) : (
        <form action={handleCreate} className="space-y-6">
          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant space-y-6">
            <h2 className="font-headline-md text-headline-md text-primary font-semibold flex items-center gap-2">
              <Icon name="terrain" className="text-secondary" /> Plot &amp; Location Allocation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Target Farm <span className="text-error">*</span>
                </label>
                <select
                  name="farm_id"
                  required
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {farmList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({[f.lga, f.state].filter(Boolean).join(", ") || "Oyo"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Target Plot
                </label>
                <select
                  name="plot_id"
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Whole Farm (No specific plot)</option>
                  {plotList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.area_ha ? `(${p.area_ha} Ha)` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Planted Area (Hectares) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  name="planted_area_hectares"
                  step="0.1"
                  min="0.1"
                  defaultValue="2.5"
                  required
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Production Season <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="season"
                  defaultValue="Early Rains 2026 (Igba Ewe)"
                  required
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant space-y-6">
            <h2 className="font-headline-md text-headline-md text-primary font-semibold flex items-center gap-2">
              <Icon name="eco" className="text-secondary" /> Crop Variety &amp; Agronomic Standard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Crop Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="crop_name"
                  placeholder="e.g. Maize, Tomato, Cassava"
                  defaultValue="Maize"
                  required
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Cultivar / Variety Name
                </label>
                <input
                  type="text"
                  name="variety"
                  placeholder="e.g. DMR-LSR-Y, TME 419, Roma VF"
                  defaultValue="DMR-LSR-Y"
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Standard Agronomic Protocol Engine
              </label>
              <select
                name="standard_id"
                defaultValue="maize_savanna_v2"
                className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Custom Farmer Protocol (No automated stage schedule)</option>
                {CROP_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.standardId} value={tmpl.standardId}>
                    {tmpl.name} · {tmpl.variety} ({tmpl.cycleDays} Days · Target {tmpl.targetYieldPerHa.toLocaleString()} kg/Ha)
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-on-surface-variant">
                Preloads NIHORT / IITA validated split-fertilizer timings, phenology GDD stages, and compliance pre-harvest intervals.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">
                Input Planning Preference
              </label>
              <select
                name="input_strategy"
                defaultValue="adopt_advisory"
                className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="adopt_advisory">
                  🌱 Adopt Advisory Benchmark (Recommended Advice — You can edit or adjust anytime)
                </option>
                <option value="custom_plan">
                  ✏️ Self-Managed Inputs (Show Advisory as guidance only; I will enter my own planned inputs)
                </option>
              </select>
              <p className="mt-1 text-xs text-on-surface-variant">
                CultivaNode provides agronomic recommendations based on validated research. You always have full autonomy to decide your actual inputs.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant space-y-6">
            <h2 className="font-headline-md text-headline-md text-primary font-semibold flex items-center gap-2">
              <Icon name="calendar_today" className="text-secondary" /> Schedule &amp; Production Targets
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Planting / Emergence Date <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Expected Harvest Date
                </label>
                <input
                  type="date"
                  name="target_harvest_date"
                  defaultValue={defaultHarvestDate}
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Target Harvest Yield (Total Kg)
                </label>
                <input
                  type="number"
                  name="target_yield_kg"
                  defaultValue="11250"
                  step="50"
                  min="0"
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Budget Cap (Kobo / Minor Units)
                </label>
                <input
                  type="number"
                  name="budget_cap_minor"
                  placeholder="e.g. 85000000 (for ₦850,000)"
                  defaultValue="85000000"
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href={`/${lang}/account/crops`}
              className="px-5 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors font-medium"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all font-semibold flex items-center gap-2 shadow-sm"
            >
              <Icon name="check_circle" className="text-lg" />
              <span>Launch Crop Cycle</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
