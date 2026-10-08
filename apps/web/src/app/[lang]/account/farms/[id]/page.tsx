import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira, computeFarmGrossMargin, getCropById } from "@cultivanode/shared";
import {
  AddPlotForm,
  AddSoilRecordForm,
  UpdateBoundaryForm,
  AddLivestockForm,
  AddFarmWorkerForm,
  AddInventoryItemForm,
  RecordFarmTransactionForm,
  AddFarmRecordForm,
  PrintReportButton,
  AddMachineryForm,
  LogMachineryUsageForm,
  AddEquipmentForm,
  RecordAttendanceForm,
  AddOperationalTaskForm,
  AddIndividualLivestockForm,
  LogLivestockHealthForm,
  MoveInventoryTransactionalForm,
  RecordPlanActualVarianceForm,
  AddFarmBudgetForm,
} from "@/components/account/farm-operations-forms";
import { Badge, Button, Card } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Farm Enterprise Hub | CultivaNode" };

export default async function FarmDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
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
    .select("id, name, area_ha, notes, soil_texture, irrigation_type, drainage, created_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const plots = plotsData ?? [];
  const plotIds = plots.map((p) => p.id);

  // 3. Fetch real crop cycles on this farm's plots
  let cropCycles: any[] = [];
  if (plotIds.length > 0) {
    const { data: cycles } = await (supabase as any)
      .from("crop_cycles")
      .select(`
        id, plot_id, crop_id, variety_id, season, status, target_area_ha, planting_date,
        expected_harvest_date, target_yield_kg, actual_yield_kg, current_stage,
        health_score, health_status, estimated_budget_kobo, actual_cost_kobo,
        plots(name)
      `)
      .in("plot_id", plotIds)
      .order("created_at", { ascending: false });
    cropCycles = cycles ?? [];
  }

  // 4. Fetch real livestock groups for this farm
  const { data: livestockData } = await (supabase as any)
    .from("farm_livestock")
    .select("id, animal_type, breed, identifier, head_count, housing_location, health_status, purpose, notes, created_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const livestock = livestockData ?? [];
  const totalHeadCount = livestock.reduce((acc: number, l: any) => acc + (Number(l.head_count) || 0), 0);

  // 5. Fetch real farm workers for this farm
  const { data: workersData } = await (supabase as any)
    .from("farm_workers")
    .select("id, full_name, phone, role, employment_type, daily_wage_kobo, status, emergency_contact, created_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const workers = workersData ?? [];

  // 6. Fetch real farm inventory for this farm
  const { data: inventoryData } = await (supabase as any)
    .from("farm_inventory")
    .select("id, item_name, category, quantity, unit, reorder_threshold, storage_location, unit_cost_kobo, expiry_date, created_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const inventory = inventoryData ?? [];
  const lowStockItems = inventory.filter((item: any) => Number(item.quantity) <= Number(item.reorder_threshold));

  // 7. Fetch real farm financial transactions
  const { data: financialsData } = await (supabase as any)
    .from("farm_financial_transactions")
    .select("id, crop_cycle_id, type, category, amount_kobo, transaction_date, receipt_number, payment_method, description, created_at")
    .eq("farm_id", id)
    .order("transaction_date", { ascending: false });
  const financials = financialsData ?? [];

  // 8. Fetch real soil records for plots on this farm
  let soilRecords: any[] = [];
  if (plotIds.length > 0) {
    const { data: soils } = await supabase
      .from("soil_records")
      .select("id, plot_id, soil_type, ph, organic_matter_pct, nitrogen_pct, phosphorus_ppm, potassium_cmol_kg, lab_name, tested_on, notes")
      .in("plot_id", plotIds)
      .order("tested_on", { ascending: false });
    soilRecords = soils ?? [];
  }

  // 9. Fetch general farm records
  const { data: generalRecordsData } = await (supabase as any)
    .from("farm_general_records")
    .select("id, record_type, title, details, document_url, recorded_date, created_at")
    .eq("farm_id", id)
    .order("recorded_date", { ascending: false });
  const generalRecords = generalRecordsData ?? [];

  // 10. Fetch real bookings/jobs for this farm
  const { data: farmJobs } = await supabase
    .from("bookings")
    .select("id, listing_title, listing_kind, job_date, status, total_kobo, created_at, disputed_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const jobs = farmJobs ?? [];

  // 11. Fetch Machinery Fleet & Equipment
  const { data: machineryData } = await (supabase as any)
    .from("farm_machinery_assets")
    .select("id, asset_code, machinery_type, make, model, registration_number, engine_hours, current_status, fuel_type, purchase_cost_kobo, created_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const machinery = machineryData ?? [];

  const { data: equipmentData } = await (supabase as any)
    .from("farm_equipment_assets")
    .select("id, equipment_name, category, quantity, storage_location, condition, status, created_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const equipment = equipmentData ?? [];

  // 12. Fetch Tasks & Attendance
  const { data: tasksData } = await (supabase as any)
    .from("farm_operational_tasks")
    .select("id, title, priority, status, start_date, due_date, estimated_duration_hours, actual_duration_hours, estimated_cost_kobo, assigned_worker_id, created_at")
    .eq("farm_id", id)
    .order("due_date", { ascending: true });
  const tasks = tasksData ?? [];

  const { data: attendanceData } = await (supabase as any)
    .from("farm_attendance_records")
    .select("id, worker_id, attendance_date, status, overtime_minutes, daily_wage_kobo, created_at")
    .eq("farm_id", id)
    .order("attendance_date", { ascending: false })
    .limit(20);
  const attendance = attendanceData ?? [];

  // 13. Fetch Individual Livestock Pedigree & Health
  const { data: animalsData } = await (supabase as any)
    .from("farm_livestock_animals")
    .select("id, tag_number, rfid_number, animal_type, breed, sex, date_of_birth, status, current_weight_kg, housing_location, created_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const individualAnimals = animalsData ?? [];

  // 14. Fetch Standard vs Plan vs Actual Variances
  const { data: variancesData } = await (supabase as any)
    .from("farm_plan_actual_variances")
    .select("id, entity_type, metric_name, unit, standard_value, plan_value, actual_value, standard_vs_plan_variance, standard_vs_actual_variance, plan_vs_actual_variance, is_farmer_override, farmer_deviation_reason, created_at")
    .eq("farm_id", id)
    .order("created_at", { ascending: false });
  const variances = variancesData ?? [];

  // 15. Fetch Farm Budgets
  const { data: budgetsData } = await (supabase as any)
    .from("farm_budgets")
    .select("id, name, fiscal_year, enterprise_type, total_budgeted_expense_kobo, total_budgeted_income_kobo, status, created_at")
    .eq("farm_id", id)
    .order("fiscal_year", { ascending: false });
  const budgets = budgetsData ?? [];

  // Financial aggregates
  let totalSpentKobo = 0;
  jobs.forEach((j) => {
    if (["accepted", "in_progress", "awaiting_confirmation", "confirmed", "completed"].includes(j.status)) {
      totalSpentKobo += j.total_kobo || 0;
    }
  });

  const totalIncomeKobo = financials
    .filter((f: any) => f.type === "income")
    .reduce((acc: number, f: any) => acc + (f.amount_kobo || 0), 0);

  const totalLedgerExpenseKobo = financials
    .filter((f: any) => f.type === "expense")
    .reduce((acc: number, f: any) => acc + (f.amount_kobo || 0), 0);

  const overallExpenseKobo = totalLedgerExpenseKobo + totalSpentKobo;
  const netOperatingMarginKobo = totalIncomeKobo - overallExpenseKobo;

  // Land utilization metrics
  const measuredTotalHa = farm.area_ha ? Number(farm.area_ha) : plots.reduce((acc: number, p: any) => acc + (Number(p.area_ha) || 0), 0);
  const totalCultivatedHa = cropCycles
    .filter((c: any) => ["planning", "active", "harvesting"].includes(c.status))
    .reduce((acc: number, c: any) => acc + (Number(c.target_area_ha) || 0), 0);
  const fallowAvailableHa = Math.max(0, measuredTotalHa - totalCultivatedHa);

  type FarmSubMenu = {
    key: string;
    label: string;
    icon: string;
    count?: number | null;
  };

  type FarmParentDomain = {
    id: string;
    label: string;
    icon: string;
    description: string;
    subMenus: FarmSubMenu[];
  };

  const parentDomains: FarmParentDomain[] = [
    {
      id: "land_production",
      label: "Land & Production",
      icon: "🌾",
      description: "Land parcels, crop production cycles, and livestock herds",
      subMenus: [
        { key: "overview", label: "Overview", icon: "📊" },
        { key: "plots", label: "Fields & Plots", icon: "🗺️", count: plots.length },
        { key: "crops", label: "Crop Cycles & GAP", icon: "🌽", count: cropCycles.length },
        { key: "livestock", label: "Livestock Enterprise", icon: "🐄", count: totalHeadCount + individualAnimals.length },
      ],
    },
    {
      id: "operations_assets",
      label: "Operations & Fleet",
      icon: "🚜",
      description: "Daily task rosters, attendance, machinery fleet, and warehouse stock",
      subMenus: [
        { key: "tasks", label: "Tasks & Labour", icon: "✅", count: tasks.length },
        { key: "machinery", label: "Machinery & Equipment", icon: "🚜", count: machinery.length + equipment.length },
        { key: "inventory", label: "Multi-Location Inventory", icon: "📦", count: inventory.length },
        { key: "jobs", label: "Service Bookings", icon: "🛠️", count: jobs.length },
      ],
    },
    {
      id: "financials_intelligence",
      label: "Financials & Variance",
      icon: "💰",
      description: "Farm books, enterprise budgets, agronomic standard-plan-actual variances, and soil documents",
      subMenus: [
        { key: "farm_books", label: "Accounts & Budgets", icon: "💰", count: financials.length },
        { key: "variance", label: "Standard vs Actual", icon: "⚖️", count: variances.length },
        { key: "records", label: "Soil & Documents", icon: "📁", count: soilRecords.length + generalRecords.length },
      ],
    },
  ];

  // Auto-detect which parent domain the active tab belongs to
  const activeDomain =
    parentDomains.find((d) => d.subMenus.some((m) => m.key === activeTab)) ??
    parentDomains[0];

  const activeSubMenu =
    activeDomain.subMenus.find((m) => m.key === activeTab) ??
    activeDomain.subMenus[0];

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
          <Badge className="bg-leaf-100 text-leaf-800">● Active Farm Enterprise</Badge>
          <Link href={`/${lang}/account/bookings/new?farm=${farm.id}`}>
            <Button variant="primary" size="sm">+ Request Service for Farm</Button>
          </Link>
        </div>
      </div>

      {/* Two-Level Parent and Sub-Menu Navigation */}
      <div className="flex flex-col gap-3">
        {/* Level 1: Parent Domains */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="tablist" aria-label="Farm enterprise domains">
          {parentDomains.map((domain) => {
            const isDomainActive = domain.id === activeDomain.id;
            const targetSub = domain.subMenus[0].key;
            const totalDomainCount = domain.subMenus.reduce((sum, sm) => sum + (sm.count || 0), 0);

            return (
              <Link
                key={domain.id}
                href={`/${lang}/account/farms/${farm.id}?tab=${isDomainActive ? activeTab : targetSub}`}
                className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                  isDomainActive
                    ? "bg-leaf-800 text-white border-leaf-900 shadow-sm"
                    : "bg-white text-neutral-800 border-line hover:border-leaf-300 hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl" aria-hidden="true">{domain.icon}</span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">{domain.label}</h3>
                    <p className={`text-[11px] truncate max-w-[180px] ${isDomainActive ? "text-leaf-200" : "text-muted"}`}>
                      {domain.subMenus.length} modules
                    </p>
                  </div>
                </div>
                {totalDomainCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDomainActive ? "bg-white text-leaf-900" : "bg-leaf-100 text-leaf-800"
                    }`}
                  >
                    {totalDomainCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Level 2: Sub-Parent Menus for Active Domain */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-line">
          {activeDomain.subMenus.map((m) => {
            const isCurrent = activeTab === m.key;
            return (
              <Link
                key={m.key}
                href={`/${lang}/account/farms/${farm.id}?tab=${m.key}`}
                className={`px-3 py-2 text-xs font-bold whitespace-nowrap rounded-lg transition-colors flex items-center gap-1.5 ${
                  isCurrent
                    ? "bg-leaf-100 text-leaf-900 border border-leaf-300 shadow-2xs font-extrabold"
                    : "text-neutral-600 hover:text-ink hover:bg-neutral-100 border border-transparent"
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
                {m.count !== undefined && m.count !== null && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isCurrent ? "bg-leaf-700 text-white" : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {m.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Context Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-muted px-1 bg-surface/50 py-1.5 rounded-lg border border-line/60">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-leaf-900">{activeDomain.label}</span>
            <span>&rarr;</span>
            <span className="font-bold text-ink flex items-center gap-1">
              <span>{activeSubMenu.icon}</span>
              <span>{activeSubMenu.label}</span>
            </span>
          </div>
          <span className="text-[11px] hidden md:inline">{activeDomain.description}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase text-muted">Measured Farm Area</p>
              <p className="text-2xl font-black text-leaf-900">
                {farm.area_ha ? `${Number(farm.area_ha).toFixed(1)} ha` : "Not measured"}
              </p>
              <p className="text-xs text-muted">Across {plots.length} registered plots</p>
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase text-muted">Active Crop Cycles</p>
              <p className="text-2xl font-black text-ink">{cropCycles.length}</p>
              <p className="text-xs text-muted">
                {cropCycles.filter((c: any) => c.status === "active").length} actively growing
              </p>
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase text-muted">Livestock Head Count</p>
              <p className="text-2xl font-black text-forest-800">{totalHeadCount}</p>
              <p className="text-xs text-muted">Across {livestock.length} animal groups/pens</p>
            </Card>

            <Card className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase text-muted">Net Farm Cash Flow</p>
              <p className={`text-2xl font-black ${netOperatingMarginKobo >= 0 ? "text-leaf-800" : "text-danger"}`}>
                {formatNaira(netOperatingMarginKobo)}
              </p>
              <p className="text-xs text-muted">Income: {formatNaira(totalIncomeKobo)}</p>
            </Card>
          </div>

          {/* Land Allocation & Cultivation Profile Card */}
          <Card className="flex flex-col gap-3 bg-gradient-to-r from-leaf-50/40 via-surface to-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
              <div>
                <h3 className="text-sm font-bold text-leaf-900">Land Allocation &amp; Cultivation Profile</h3>
                <p className="text-xs text-muted">Acreage breakdown across registered fields, active crop cycles, and fallow land.</p>
              </div>
              <Link href={`/${lang}/account/farms/${farm.id}?tab=plots`}>
                <Button variant="secondary" size="sm">Manage {plots.length} Fields &rarr;</Button>
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-4 text-xs">
              <div className="p-3 rounded-xl bg-white border border-line">
                <span className="text-muted block text-[11px] uppercase font-semibold">Total Farm Land</span>
                <p className="text-xl font-black text-leaf-900 mt-0.5">{measuredTotalHa.toFixed(2)} ha</p>
                <span className="text-[11px] text-muted">{(measuredTotalHa * 2.471).toFixed(1)} acres</span>
              </div>
              <div className="p-3 rounded-xl bg-forest-50/80 border border-forest-200">
                <span className="text-forest-800 block text-[11px] uppercase font-semibold">Under Active Crops</span>
                <p className="text-xl font-black text-forest-900 mt-0.5">{totalCultivatedHa.toFixed(2)} ha</p>
                <span className="text-[11px] text-forest-700">{Math.round((totalCultivatedHa / (measuredTotalHa || 1)) * 100)}% of land</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <span className="text-amber-800 block text-[11px] uppercase font-semibold">Available / Fallow Land</span>
                <p className="text-xl font-black text-amber-900 mt-0.5">{fallowAvailableHa.toFixed(2)} ha</p>
                <span className="text-[11px] text-amber-700">Ready for next cycle</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-blue-800 block text-[11px] uppercase font-semibold">Registered Parcels</span>
                <p className="text-xl font-black text-blue-900 mt-0.5">{plots.length} plots</p>
                <span className="text-[11px] text-blue-700">{cropCycles.length} active cycles</span>
              </div>
            </div>
          </Card>

          {/* Quick Action Dock */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Link
              href={`/${lang}/account/farms/${farm.id}?tab=plots`}
              className="p-3.5 bg-leaf-50/80 hover:bg-leaf-100 rounded-xl border border-leaf-200 flex flex-col gap-1 transition-colors"
            >
              <span className="text-xl">🗺️</span>
              <strong className="text-xs font-bold text-leaf-900">+ Add Field / Plot</strong>
              <span className="text-[11px] text-leaf-700">Parcel boundary &amp; soil texture</span>
            </Link>

            <Link
              href={`/${lang}/account/crops/new?farm=${farm.id}`}
              className="p-3.5 bg-forest-50/80 hover:bg-forest-100 rounded-xl border border-forest-200 flex flex-col gap-1 transition-colors"
            >
              <span className="text-xl">🌽</span>
              <strong className="text-xs font-bold text-forest-900">+ Plan Crop Cycle</strong>
              <span className="text-[11px] text-forest-700">Anchor dates &amp; operations</span>
            </Link>

            <Link
              href={`/${lang}/account/farms/${farm.id}?tab=livestock`}
              className="p-3.5 bg-amber-50/80 hover:bg-amber-100 rounded-xl border border-amber-200 flex flex-col gap-1 transition-colors"
            >
              <span className="text-xl">🐄</span>
              <strong className="text-xs font-bold text-amber-900">+ Add Livestock</strong>
              <span className="text-[11px] text-amber-700">Poultry, cattle &amp; ruminants</span>
            </Link>

            <Link
              href={`/${lang}/account/farms/${farm.id}?tab=farm_books`}
              className="p-3.5 bg-emerald-50/80 hover:bg-emerald-100 rounded-xl border border-emerald-200 flex flex-col gap-1 transition-colors"
            >
              <span className="text-xl">💰</span>
              <strong className="text-xs font-bold text-emerald-900">+ Transaction</strong>
              <span className="text-[11px] text-emerald-700">Harvest income or expenses</span>
            </Link>

            <Link
              href={`/${lang}/account/farms/${farm.id}?tab=workers`}
              className="p-3.5 bg-blue-50/80 hover:bg-blue-100 rounded-xl border border-blue-200 flex flex-col gap-1 transition-colors"
            >
              <span className="text-xl">👥</span>
              <strong className="text-xs font-bold text-blue-900">+ Farm Worker</strong>
              <span className="text-[11px] text-blue-700">Labour, wages &amp; supervisory</span>
            </Link>
          </div>

          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-leaf-900">Farm Information &amp; Agro-Ecological Profile</h2>
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
                <span className="text-muted">Registration Date:</span>
                <p className="font-semibold text-ink">{new Date(farm.created_at).toLocaleDateString()}</p>
              </div>
              <div className="rounded border border-line bg-surface p-3">
                <span className="text-muted">Soil Tests On File:</span>
                <p className="font-semibold text-ink">{soilRecords.length} laboratory test records</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------------ TAB 2: FIELDS & PLOTS */}
      {activeTab === "plots" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Fields &amp; Land Parcels</h2>
              <p className="text-xs text-neutral-500">
                Manage physical plots, soil characteristics, irrigation infrastructure, and active plantings for {farm.name}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${lang}/account/crops/map`}>
                <Button variant="secondary" size="sm">🗺️ Geo Parcel Map</Button>
              </Link>
              <Link href={`/${lang}/account/crops/new?farm=${farm.id}`}>
                <Button variant="primary" size="sm">+ Plan Crop Cycle</Button>
              </Link>
            </div>
          </div>

          {/* Land Allocation Summary Banner */}
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <Card className="flex flex-col gap-1 p-3.5">
              <span className="text-[11px] font-semibold uppercase text-muted">Total Measured Land</span>
              <p className="text-xl font-black text-leaf-900">{measuredTotalHa.toFixed(2)} ha</p>
              <span className="text-[10px] text-muted">{(measuredTotalHa * 2.471).toFixed(1)} acres</span>
            </Card>
            <Card className="flex flex-col gap-1 p-3.5 bg-forest-50/50 border-forest-200">
              <span className="text-[11px] font-semibold uppercase text-forest-800">Under Cultivation</span>
              <p className="text-xl font-black text-forest-900">{totalCultivatedHa.toFixed(2)} ha</p>
              <span className="text-[10px] text-forest-700">{cropCycles.filter((c: any) => ["planning", "active", "harvesting"].includes(c.status)).length} active cycles</span>
            </Card>
            <Card className="flex flex-col gap-1 p-3.5 bg-amber-50/50 border-amber-200">
              <span className="text-[11px] font-semibold uppercase text-amber-800">Available / Fallow</span>
              <p className="text-xl font-black text-amber-900">{fallowAvailableHa.toFixed(2)} ha</p>
              <span className="text-[10px] text-amber-700">Ready for new planting</span>
            </Card>
          </div>

          {/* Registered Fields List */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-leaf-900">Registered Fields ({plots.length})</h3>
                <p className="text-xs text-muted">Each field can host multiple crop cycles across planting seasons.</p>
              </div>
              <Badge className="bg-leaf-100 text-leaf-800">{plots.length} Parcels</Badge>
            </div>

            {plots.length === 0 ? (
              <div className="py-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                <span className="text-3xl">🗺️</span>
                <p className="text-sm font-semibold text-neutral-800 mt-2">No fields or plots recorded yet</p>
                <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                  Register your first plot below to begin planning crop cycles, recording soil tests, and tracking field tasks.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plots.map((p) => {
                  const activeCycle = cropCycles.find(
                    (c: any) => c.plot_id === p.id && ["planning", "active", "harvesting"].includes(c.status)
                  );
                  const cropObj = activeCycle ? getCropById(activeCycle.crop_id) : null;
                  const areaHaNum = p.area_ha ? Number(p.area_ha) : 1.0;

                  return (
                    <div key={p.id} className="rounded-xl border border-line bg-surface p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-leaf-400 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <strong className="text-base font-bold text-ink block">{p.name}</strong>
                            <span className="text-xs text-muted font-medium">
                              {p.area_ha ? `${areaHaNum.toFixed(2)} ha (${(areaHaNum * 2.471).toFixed(1)} ac)` : "Unmeasured area"}
                            </span>
                          </div>
                          {activeCycle ? (
                            <Badge className="bg-leaf-100 text-leaf-800 text-xs">● Active Crop</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">○ Fallow / Ready</Badge>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-white border border-neutral-100 text-xs space-y-1">
                          <div className="flex justify-between text-neutral-600">
                            <span>Soil:</span>
                            <strong className="capitalize text-neutral-900">{p.soil_texture?.replace(/_/g, " ") ?? "Sandy loam"}</strong>
                          </div>
                          <div className="flex justify-between text-neutral-600">
                            <span>Irrigation:</span>
                            <strong className="capitalize text-neutral-900">{p.irrigation_type?.replace(/_/g, " ") ?? "Rainfed"}</strong>
                          </div>
                          {p.notes && (
                            <p className="text-[11px] text-muted italic pt-1 border-t border-neutral-100">{p.notes}</p>
                          )}
                        </div>

                        {activeCycle ? (
                          <div className="p-2.5 rounded-lg bg-leaf-50/80 border border-leaf-200 text-xs">
                            <span className="text-leaf-800 font-semibold block">Current Planting:</span>
                            <p className="font-bold text-leaf-950 mt-0.5">
                              🌽 {cropObj?.name ?? activeCycle.crop_id} ({activeCycle.variety_id ?? "Certified"})
                            </p>
                            <span className="text-leaf-700 text-[11px]">Stage: <span className="capitalize">{activeCycle.current_stage ?? "Growing"}</span></span>
                            <div className="mt-2">
                              <Link
                                href={`/${lang}/account/crops/${activeCycle.id}`}
                                className="text-[11px] font-bold text-leaf-800 hover:underline inline-flex items-center gap-1"
                              >
                                View Crop Cycle Details &rarr;
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
                            <span>No active crop cycle in this field. Ready for planting.</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-line flex flex-wrap gap-2">
                        <Link
                          href={`/${lang}/account/crops/new?farm=${farm.id}&plot=${p.id}`}
                          className="flex-1 text-center py-2 px-3 bg-leaf-600 hover:bg-leaf-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          🌽 Plan Crop on this Plot
                        </Link>
                        <Link
                          href={`/${lang}/account/farms/${farm.id}?tab=records`}
                          className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors"
                        >
                          🧪 Soil Data
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Plot Form */}
            <div className="border-t border-line pt-5 mt-2">
              <h4 className="text-sm font-bold text-leaf-900 mb-1">+ Add New Field / Plot to {farm.name}</h4>
              <p className="text-xs text-muted mb-4">
                Define parcel area, soil texture, and irrigation infrastructure to enable accurate fertilizer and spray planning.
              </p>
              <AddPlotForm farmId={farm.id} lang={lang} />
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------------ TAB 3: CROP MANAGEMENT */}
      {activeTab === "crops" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Crop Production Management</h2>
              <p className="text-xs text-neutral-500">
                Manage crop cycles, growth stages, field tasks, and harvest for {farm.name}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/${lang}/account/crops/map`}>
                <Button variant="secondary" size="sm">🗺️ Field Parcel Map</Button>
              </Link>
              <Link href={`/${lang}/account/crops/new?farm=${farm.id}`}>
                <Button variant="primary" size="sm">+ Plan Crop Cycle</Button>
              </Link>
            </div>
          </div>

          {/* Active Crop Cycles on this Farm */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Active Crop Cycles ({cropCycles.length})</h3>
              <Badge className="bg-leaf-100 text-leaf-800">{cropCycles.length} Cycles on Farm</Badge>
            </div>

            {cropCycles.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-3">
                <p className="text-sm text-neutral-500">No crop cycles planned on this farm yet.</p>
                <Link href={`/${lang}/account/crops/new?farm=${farm.id}`}>
                  <Button variant="primary" size="sm">+ Plan First Crop Cycle for {farm.name}</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cropCycles.map((c: any) => {
                  const crop = getCropById(c.crop_id);
                  return (
                    <div key={c.id} className="p-4 rounded-xl border border-line bg-white flex flex-col justify-between gap-3 shadow-xs">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <strong className="text-base text-neutral-900">{crop?.name ?? c.crop_id}</strong>
                            <p className="text-xs text-forest-700 font-medium">Field: {c.plots?.name ?? "Assigned Plot"}</p>
                          </div>
                          <Badge className="bg-leaf-100 text-leaf-800 capitalize text-xs">
                            {c.status}
                          </Badge>
                        </div>
                        <div className="mt-3 text-xs text-neutral-600 flex flex-col gap-1">
                          <div>Stage: <strong className="capitalize">{c.current_stage?.replace(/_/g, " ")}</strong></div>
                          <div>Health: <strong>{Math.round(Number(c.health_score || 1) * 100)}%</strong> ({c.health_status})</div>
                          <div>Planted: <strong>{c.planting_date}</strong></div>
                          <div>Harvest ~ <strong>{c.expected_harvest_date}</strong></div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-line flex justify-end">
                        <Link href={`/${lang}/account/crops/${c.id}`} className="text-xs font-bold text-forest-700 hover:underline">
                          View Crop Operations &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Cross-Link to Fields & Plots */}
          <div className="p-4 bg-leaf-50/80 border border-leaf-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🗺️</span>
              <div>
                <strong className="text-leaf-950 font-bold block">
                  Looking to manage physical fields or add a new parcel? ({plots.length} registered)
                </strong>
                <span className="text-leaf-700">
                  Configure boundaries, soil classifications, and irrigation systems in the dedicated Fields tab.
                </span>
              </div>
            </div>
            <Link href={`/${lang}/account/farms/${farm.id}?tab=plots`}>
              <Button variant="secondary" size="sm">Open Fields &amp; Plots Tab &rarr;</Button>
            </Link>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ TAB 3: LIVESTOCK MANAGEMENT */}
      {activeTab === "livestock" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Livestock &amp; Animal Husbandry</h2>
              <p className="text-xs text-neutral-500">
                Track poultry, cattle, small ruminants, health and housing for {farm.name}.
              </p>
            </div>
            <Badge className="bg-amber-100 text-amber-800 font-bold">{totalHeadCount} Total Head</Badge>
          </div>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Livestock Groups ({livestock.length})</h3>
            </div>

            {livestock.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No livestock recorded for this farm yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {livestock.map((l: any) => (
                  <div key={l.id} className="p-4 rounded-xl border border-line bg-white flex flex-col justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-base capitalize text-neutral-900">{l.animal_type}</strong>
                          <p className="text-xs text-amber-800 font-semibold">{l.breed}</p>
                        </div>
                        <Badge
                          className={
                            l.health_status === "healthy"
                              ? "bg-leaf-100 text-leaf-800"
                              : l.health_status === "treatment"
                              ? "bg-harvest-100 text-harvest-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {l.health_status}
                        </Badge>
                      </div>
                      <div className="mt-3 text-xs text-neutral-600 flex flex-col gap-1">
                        <div>Head Count: <strong className="text-sm font-bold text-neutral-900">{l.head_count}</strong></div>
                        <div>Housing / Pen: <strong>{l.housing_location || "Open Pasture"}</strong></div>
                        <div>Purpose: <strong className="capitalize">{l.purpose}</strong></div>
                        <div>Identifier: <strong>{l.identifier}</strong></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line pt-4">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Register Livestock Group / Flock</h4>
              <AddLivestockForm farmId={farm.id} lang={lang} />
            </div>
          </Card>

          {/* Individual Pedigree Tracking Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-leaf-900">Individual Animals &amp; Pedigree ({individualAnimals.length})</h3>
                <p className="text-xs text-muted">Tag-tracked breeding stock, dairy cows, and individual medical records.</p>
              </div>
              <Badge className="bg-amber-100 text-amber-800 font-bold">{individualAnimals.length} Tagged</Badge>
            </div>

            {individualAnimals.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No individual animals registered with tag IDs yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {individualAnimals.map((a: any) => (
                  <div key={a.id} className="p-3.5 rounded-xl border border-line bg-surface flex flex-col justify-between gap-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-sm text-ink">{a.tag_number}</strong>
                        <p className="text-xs text-muted capitalize">{a.animal_type} • {a.breed}</p>
                      </div>
                      <Badge className="bg-leaf-100 text-leaf-800 text-xs capitalize">{a.status}</Badge>
                    </div>
                    <div className="text-xs text-neutral-600 flex flex-col gap-0.5">
                      <div>Sex: <strong className="capitalize">{a.sex}</strong></div>
                      <div>Weight: <strong>{a.current_weight_kg ? `${a.current_weight_kg} kg` : "Not weighed"}</strong></div>
                      {a.rfid_number && <div>RFID: <strong>{a.rfid_number}</strong></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line pt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Register Individual Animal</h4>
                <AddIndividualLivestockForm farmId={farm.id} lang={lang} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Record Health / Vet Event</h4>
                <LogLivestockHealthForm farmId={farm.id} animals={individualAnimals} groups={livestock} lang={lang} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------------ TAB 4: FARM ACCOUNT (FARM BOOKS) */}
      {activeTab === "farm_books" && (() => {
        const measuredHa = farm.area_ha ? Number(farm.area_ha) : 1.0;
        const totalYieldKg = Math.round(measuredHa * 3800);
        const estimatedRevenueKobo = Math.round(totalYieldKg * 35000);
        const estimatedInputsKobo = Math.round(measuredHa * 18000000);
        const estimatedLabourKobo = Math.round(measuredHa * 7000000);

        const marginReport = computeFarmGrossMargin({
          cropId: "maize",
          plotId: plots[0]?.id ?? farm.id,
          areaHectares: measuredHa,
          totalYieldKg,
          revenueKobo: totalIncomeKobo > 0 ? totalIncomeKobo : estimatedRevenueKobo,
          costs: {
            machineryKobo: totalSpentKobo,
            labourKobo: estimatedLabourKobo,
            seedsKobo: Math.round(estimatedInputsKobo * 0.3),
            fertiliserKobo: Math.round(estimatedInputsKobo * 0.5),
            chemicalsKobo: Math.round(estimatedInputsKobo * 0.2),
          },
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Farm Books &amp; Operating Ledger</h2>
                <p className="text-xs text-neutral-500">
                  Income, input costs, mechanization, and gross margin analysis for {farm.name}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PrintReportButton farmName={farm.name} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase text-muted">Total Recorded Inflow</span>
                <p className="text-2xl font-black text-leaf-800">{formatNaira(totalIncomeKobo)}</p>
                <span className="text-[10px] text-muted">Harvest &amp; produce sales</span>
              </Card>

              <Card className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase text-muted">Total Recorded Outflow</span>
                <p className="text-2xl font-black text-accent-700">{formatNaira(overallExpenseKobo)}</p>
                <span className="text-[10px] text-muted">Inputs, wages &amp; mechanization</span>
              </Card>

              <Card className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase text-muted">Net Operating Cash</span>
                <p className={`text-2xl font-black ${netOperatingMarginKobo >= 0 ? "text-leaf-800" : "text-danger"}`}>
                  {formatNaira(netOperatingMarginKobo)}
                </p>
                <span className="text-[10px] text-muted">Ledger gross position</span>
              </Card>

              <Card className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase text-muted">Direct Mechanization</span>
                <p className="text-2xl font-black text-ink">{formatNaira(totalSpentKobo)}</p>
                <span className="text-[10px] text-muted">Across {jobs.length} service requests</span>
              </Card>
            </div>

            {/* Enterprise Gross Margin Card */}
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="text-base font-bold text-leaf-900">Enterprise Gross Margin Analysis</h3>
                  <p className="text-xs text-muted">Automated agricultural economics per hectare.</p>
                </div>
                <Badge className="bg-leaf-100 text-leaf-800">Farm Books Engine</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="p-3 rounded bg-surface border border-line">
                  <span className="text-muted">Gross Margin / Hectare:</span>
                  <p className="text-lg font-bold text-leaf-800 mt-1">{formatNaira(marginReport.grossMarginPerHectareKobo)}</p>
                </div>
                <div className="p-3 rounded bg-surface border border-line">
                  <span className="text-muted">Direct Cost / kg produced:</span>
                  <p className="text-lg font-bold text-ink mt-1">{formatNaira(marginReport.costOfProductionPerKgKobo)}</p>
                </div>
                <div className="p-3 rounded bg-surface border border-line">
                  <span className="text-muted">Return on Investment (ROI):</span>
                  <p className="text-lg font-bold text-harvest-800 mt-1">{marginReport.roiPercentage}%</p>
                </div>
              </div>
            </Card>

            {/* Transaction Ledger Table */}
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-base font-bold text-leaf-900">Financial Ledger ({financials.length})</h3>
              </div>

              {financials.length === 0 ? (
                <p className="text-xs text-muted py-4 text-center">No ledger entries recorded yet. Record your first transaction below.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 text-neutral-600 border-b">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5 text-right">Amount (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {financials.map((f: any) => (
                        <tr key={f.id} className="hover:bg-neutral-50/50">
                          <td className="p-2.5">{f.transaction_date}</td>
                          <td className="p-2.5 font-bold">
                            <span className={f.type === "income" ? "text-leaf-700" : "text-red-700"}>
                              {f.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 capitalize">{f.category?.replace(/_/g, " ")}</td>
                          <td className="p-2.5">{f.description}</td>
                          <td className="p-2.5 capitalize">{f.payment_method?.replace(/_/g, " ")}</td>
                          <td className="p-2.5 text-right font-bold">
                            <span className={f.type === "income" ? "text-leaf-800" : "text-neutral-900"}>
                              {f.type === "income" ? "+" : "-"}{formatNaira(f.amount_kobo)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-line pt-4">
                <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Record Transaction in Farm Books</h4>
                <RecordFarmTransactionForm
                  farmId={farm.id}
                  cropCycles={cropCycles.map((c: any) => ({
                    id: c.id,
                    cropName: `${getCropById(c.crop_id)?.name ?? c.crop_id} (${c.plots?.name ?? "Field"})`,
                  }))}
                  lang={lang}
                />
              </div>
            </Card>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------------ TAB 5: TASKS & LABOUR MANAGEMENT */}
      {(activeTab === "tasks" || activeTab === "workers") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Farm Tasks, Labour &amp; Daily Attendance</h2>
              <p className="text-xs text-neutral-500">
                Assign tasks to plots and crops, log field attendance with GPS, and track worker wages.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-leaf-100 text-leaf-800">{tasks.length} Operational Tasks</Badge>
              <Badge className="bg-node-100 text-node-800">{workers.length} Personnel</Badge>
            </div>
          </div>

          {/* Operational Tasks Console */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Operational Tasks ({tasks.length})</h3>
              <span className="text-xs text-muted">Planned, Assigned, In-Progress, and Completed</span>
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No tasks assigned yet. Assign work below.</p>
            ) : (
              <div className="divide-y divide-line">
                {tasks.map((t: any) => (
                  <div key={t.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-ink">{t.title}</strong>
                        <Badge
                          className={
                            t.priority === "urgent"
                              ? "bg-red-100 text-red-800"
                              : t.priority === "high"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-surface text-muted"
                          }
                        >
                          {t.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        Due: <strong>{t.due_date}</strong> • Est: {t.estimated_duration_hours}h • Cost: {formatNaira(t.estimated_cost_kobo)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          t.status === "COMPLETED"
                            ? "bg-leaf-100 text-leaf-800"
                            : t.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-neutral-100 text-neutral-800"
                        }
                      >
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line pt-4">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Assign New Operational Task</h4>
              <AddOperationalTaskForm
                farmId={farm.id}
                workers={workers}
                plots={plots}
                cropCycles={cropCycles}
                lang={lang}
              />
            </div>
          </Card>

          {/* Daily Attendance & Labour Shift Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-leaf-900">Attendance Log ({attendance.length})</h3>
                <p className="text-xs text-muted">Daily clock-in records, shift status, and overtime verification.</p>
              </div>
            </div>

            {attendance.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No attendance logged yet. Record worker clock-in below.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-600 border-b">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Worker</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Overtime</th>
                      <th className="p-2.5">Daily Wage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {attendance.map((a: any) => {
                      const worker = workers.find((w: any) => w.id === a.worker_id);
                      return (
                        <tr key={a.id} className="hover:bg-neutral-50/50">
                          <td className="p-2.5 font-semibold text-neutral-900">{a.attendance_date}</td>
                          <td className="p-2.5">{worker?.full_name || "Worker"}</td>
                          <td className="p-2.5 capitalize">
                            <Badge className="bg-leaf-100 text-leaf-800 text-xs">{a.status}</Badge>
                          </td>
                          <td className="p-2.5">{a.overtime_minutes ? `${a.overtime_minutes} mins` : "None"}</td>
                          <td className="p-2.5 font-bold">{formatNaira(a.daily_wage_kobo)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-line pt-4">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Record Daily Attendance</h4>
              <RecordAttendanceForm farmId={farm.id} workers={workers} lang={lang} />
            </div>
          </Card>

          {/* Worker Directory Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Worker Directory ({workers.length})</h3>
            </div>

            {workers.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No workers registered on this farm yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-600 border-b">
                    <tr>
                      <th className="p-2.5">Full Name</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Employment</th>
                      <th className="p-2.5">Daily Wage</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {workers.map((w: any) => (
                      <tr key={w.id} className="hover:bg-neutral-50/50">
                        <td className="p-2.5 font-bold text-neutral-900">{w.full_name}</td>
                        <td className="p-2.5">{w.phone || "—"}</td>
                        <td className="p-2.5 capitalize">{w.role?.replace(/_/g, " ")}</td>
                        <td className="p-2.5 capitalize">{w.employment_type?.replace(/_/g, " ")}</td>
                        <td className="p-2.5 font-semibold">{formatNaira(w.daily_wage_kobo)}/day</td>
                        <td className="p-2.5">
                          <Badge className="bg-leaf-100 text-leaf-800 capitalize text-xs">{w.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-line pt-4">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Register New Farm Worker</h4>
              <AddFarmWorkerForm farmId={farm.id} lang={lang} />
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------------ TAB 6: INVENTORY MANAGEMENT */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Farm Inventory &amp; Stores</h2>
              <p className="text-xs text-neutral-500">
                Seeds, fertilisers, agrochemicals, animal feed, and harvest stock in storage.
              </p>
            </div>
            <Badge className="bg-leaf-100 text-leaf-800">{inventory.length} Stock Items</Badge>
          </div>

          {lowStockItems.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center justify-between">
              <div>
                <strong>Reorder Alert:</strong> {lowStockItems.length} items at or below reorder threshold (
                {lowStockItems.map((i: any) => i.item_name).join(", ")})
              </div>
            </div>
          )}

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Current Inventory ({inventory.length})</h3>
            </div>

            {inventory.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No inventory items recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-600 border-b">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Quantity</th>
                      <th className="p-2.5">Reorder At</th>
                      <th className="p-2.5">Location</th>
                      <th className="p-2.5">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {inventory.map((item: any) => (
                      <tr key={item.id} className="hover:bg-neutral-50/50">
                        <td className="p-2.5 font-bold text-neutral-900">{item.item_name}</td>
                        <td className="p-2.5 capitalize">{item.category}</td>
                        <td className="p-2.5 font-semibold">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-2.5 text-neutral-500">
                          {item.reorder_threshold} {item.unit}
                        </td>
                        <td className="p-2.5">{item.storage_location || "Main Store"}</td>
                        <td className="p-2.5 font-semibold">{formatNaira(item.unit_cost_kobo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-line pt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Add Inventory Item</h4>
                <AddInventoryItemForm farmId={farm.id} lang={lang} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Record Transactional Movement</h4>
                <MoveInventoryTransactionalForm farmId={farm.id} items={inventory} lang={lang} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------------ TAB: MACHINERY & FLEET */}
      {activeTab === "machinery" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Machinery Fleet &amp; Small Equipment</h2>
              <p className="text-xs text-neutral-500">
                Track tractors, implements, engine hours, maintenance schedules, and farm equipment.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-leaf-100 text-leaf-800">{machinery.length} Machines</Badge>
              <Badge className="bg-node-100 text-node-800">{equipment.length} Equipment</Badge>
            </div>
          </div>

          {/* Machinery Fleet Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Machinery Registry ({machinery.length})</h3>
            </div>

            {machinery.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No heavy machinery registered yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {machinery.map((m: any) => (
                  <div key={m.id} className="p-4 rounded-xl border border-line bg-surface flex flex-col justify-between gap-2 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-sm text-ink">{m.asset_code}</strong>
                        <p className="text-xs text-muted capitalize">{m.make} {m.model} ({m.machinery_type})</p>
                      </div>
                      <Badge className="bg-leaf-100 text-leaf-800 text-xs">{m.current_status}</Badge>
                    </div>
                    <div className="text-xs text-neutral-600 flex flex-col gap-0.5 mt-2">
                      <div>Engine Hours: <strong className="text-ink">{m.engine_hours} hrs</strong></div>
                      <div>Fuel: <strong className="capitalize">{m.fuel_type}</strong></div>
                      {m.registration_number && <div>Reg: <strong>{m.registration_number}</strong></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line pt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Register Machinery Asset</h4>
                <AddMachineryForm farmId={farm.id} lang={lang} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Record Machine Operation / Hours</h4>
                <LogMachineryUsageForm
                  farmId={farm.id}
                  machinery={machinery}
                  workers={workers}
                  plots={plots}
                  lang={lang}
                />
              </div>
            </div>
          </Card>

          {/* Small Equipment Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Farm Equipment &amp; Tools ({equipment.length})</h3>
              <span className="text-xs text-muted">Sprayers, irrigation fittings, PPE, and hand tools</span>
            </div>

            {equipment.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No equipment items registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-600 border-b">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Quantity</th>
                      <th className="p-2.5">Condition</th>
                      <th className="p-2.5">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {equipment.map((e: any) => (
                      <tr key={e.id} className="hover:bg-neutral-50/50">
                        <td className="p-2.5 font-bold text-ink">{e.equipment_name}</td>
                        <td className="p-2.5 capitalize">{e.category?.replace(/_/g, " ")}</td>
                        <td className="p-2.5">{e.quantity}</td>
                        <td className="p-2.5 capitalize">{e.condition}</td>
                        <td className="p-2.5">{e.storage_location || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-line pt-4">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Add Equipment Asset</h4>
              <AddEquipmentForm farmId={farm.id} lang={lang} />
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------------ TAB: VARIANCE ENGINE */}
      {activeTab === "variance" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Standard &rarr; Plan &rarr; Actual Variance Engine</h2>
              <p className="text-xs text-neutral-500">
                CultivaNode recommends. The farmer decides. CultivaNode learns from the difference.
              </p>
            </div>
            <Badge className="bg-leaf-100 text-leaf-800">{variances.length} Variance Records</Badge>
          </div>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Recorded Variances &amp; Farmer Decisions ({variances.length})</h3>
            </div>

            {variances.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">
                No farmer overrides or variance records logged for this farm yet.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {variances.map((v: any) => (
                  <div key={v.id} className="py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-sm text-ink">{v.metric_name}</strong>
                        <span className="text-xs text-muted ml-2">({v.entity_type})</span>
                      </div>
                      <Badge className={v.is_farmer_override ? "bg-amber-100 text-amber-800" : "bg-leaf-100 text-leaf-800"}>
                        {v.is_farmer_override ? "Farmer Override" : "Standard"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs bg-surface p-2.5 rounded-lg border border-line">
                      <div>
                        <span className="text-muted block text-[10px] uppercase font-bold">Standard Recommendation</span>
                        <strong className="text-ink">{v.standard_value} {v.unit}</strong>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase font-bold">Farmer Plan</span>
                        <strong className="text-ink">{v.plan_value} {v.unit}</strong>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase font-bold">Actual Field Result</span>
                        <strong className="text-leaf-800">{v.actual_value} {v.unit}</strong>
                      </div>
                    </div>
                    {v.farmer_deviation_reason && (
                      <p className="text-xs text-neutral-600 italic">
                        &ldquo;{v.farmer_deviation_reason}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line pt-4">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Record Farmer Decision &amp; Variance</h4>
              <RecordPlanActualVarianceForm farmId={farm.id} lang={lang} />
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------------ TAB 7: FARM RECORDS */}
      {activeTab === "records" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Farm Records &amp; Cadastral Documentation</h2>
              <p className="text-xs text-neutral-500">
                Soil test analyses, PostGIS boundary polygon, land titles, water sources, and inspection reports.
              </p>
            </div>
            <Badge className="bg-leaf-100 text-leaf-800">
              {soilRecords.length + generalRecords.length} Records
            </Badge>
          </div>

          {/* 1. Cadastral Boundary */}
          <Card className="flex flex-col gap-4 border border-line">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-leaf-900">PostGIS Boundary Polygon &amp; Geofence</h3>
                <p className="text-xs text-muted">Stored as PostGIS geography column (SRID 4326).</p>
              </div>
              <Badge className="bg-leaf-100 text-leaf-800">EPSG:4326 PostGIS</Badge>
            </div>

            <div className="relative aspect-[16/9] w-full rounded-lg bg-leaf-950 p-6 text-white overflow-hidden shadow-inner flex flex-col justify-between">
              <svg viewBox="0 0 800 450" className="absolute inset-0 h-full w-full">
                <defs>
                  <pattern id="soilGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#soilGrid)" />
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

            <div className="border-t border-line pt-4">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">Update Boundary Coordinates</h4>
              <UpdateBoundaryForm farmId={farm.id} lang={lang} />
            </div>
          </Card>

          {/* 2. Soil Analysis */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Laboratory Soil Test Records ({soilRecords.length})</h3>
            </div>

            {soilRecords.length === 0 ? (
              <p className="text-xs text-muted py-2">No soil tests on file for this farm yet.</p>
            ) : (
              <div className="divide-y divide-line">
                {soilRecords.map((s: any) => (
                  <div key={s.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-ink">Soil Test: {s.soil_type || "Standard"}</strong>
                      <span className="text-xs text-muted">Tested on: {s.tested_on}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
                      <div className="rounded bg-earth-50 p-2">pH: <strong>{s.ph ?? "—"}</strong></div>
                      <div className="rounded bg-earth-50 p-2">Nitrogen: <strong>{s.nitrogen_pct ? `${s.nitrogen_pct}%` : "—"}</strong></div>
                      <div className="rounded bg-earth-50 p-2">Phosphorus: <strong>{s.phosphorus_ppm ? `${s.phosphorus_ppm} ppm` : "—"}</strong></div>
                      <div className="rounded bg-earth-50 p-2">Potassium: <strong>{s.potassium_cmol_kg ? `${s.potassium_cmol_kg} cmol` : "—"}</strong></div>
                    </div>
                    {s.lab_name && <p className="text-xs text-muted">Lab: {s.lab_name}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line pt-4">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Record Laboratory Soil Analysis</h4>
              <AddSoilRecordForm plots={plots.map((p) => ({ id: p.id, name: p.name }))} lang={lang} />
            </div>
          </Card>

          {/* 3. General Records & Tenure Documents */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-leaf-900">Land Titles, Water Sources &amp; Certifications ({generalRecords.length})</h3>
            </div>

            {generalRecords.length === 0 ? (
              <p className="text-xs text-muted py-2">No title or lease documents logged.</p>
            ) : (
              <div className="divide-y divide-line">
                {generalRecords.map((r: any) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <strong className="text-sm text-ink">{r.title}</strong>
                      <p className="text-xs text-muted capitalize">{r.record_type?.replace(/_/g, " ")} • {r.recorded_date}</p>
                      {r.details && <p className="text-xs text-neutral-600 mt-1">{r.details}</p>}
                    </div>
                    <Badge className="bg-leaf-100 text-leaf-800 capitalize text-xs">Verified</Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line pt-4">
              <h4 className="text-sm font-bold text-leaf-900 mb-2">+ Save New Farm Record / Agreement</h4>
              <AddFarmRecordForm farmId={farm.id} lang={lang} />
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------------ TAB 8: SERVICE JOBS */}
      {activeTab === "jobs" && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-lg font-bold text-leaf-900">Service Jobs &amp; Mechanization Requests</h2>
              <p className="text-xs text-muted">Tractor plowing, harrowing, planting and spraying jobs requested for this farm.</p>
            </div>
            <Link href={`/${lang}/account/bookings/new?farm=${farm.id}`}>
              <Button variant="primary" size="sm">+ Request Service for Farm</Button>
            </Link>
          </div>

          {jobs.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">No service requests recorded for this farm in the bookings table.</p>
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
    </div>
  );
}
