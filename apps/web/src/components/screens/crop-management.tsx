"use client";

// Ported from the "crop_management_phenology_engine" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";
import { slot } from "./types";

interface CropPlot {
  id: string;
  name: string;
  variety: string;
  localName: string;
  category: "all" | "cereals" | "tubers" | "horticulture";
  stageBadge: string;
  stageBadgeClass: string;
  progressTitle: string;
  progressSubtitle: string;
  progressPct: number;
  stages: string[];
  currentStageIdx: number;
  metric1Label: string;
  metric1Val: string;
  metric2Label: string;
  metric2Val: string;
  alertIcon: string;
  alertTitle: string;
  alertDesc: string;
  alertClass: string;
  fieldLead: string;
}

const PLOTS: CropPlot[] = [
  {
    id: "plot-1",
    name: "Plot A1 & A2 · 18.0 Ha",
    variety: "Maize DMR-LSR-Y",
    localName: "Agbado Oloyin (Savanna Standard v2.1)",
    category: "cereals",
    stageBadge: "Vegetative V6",
    stageBadgeClass: "bg-secondary-container text-on-secondary-container",
    progressTitle: "V6 Stage Progression",
    progressSubtitle: "68% to V8 Tasseling",
    progressPct: 68,
    stages: ["VE (Em.)", "V6 (Current)", "VT (Tassel)", "R6 (Maturity)"],
    currentStageIdx: 1,
    metric1Label: "Thermal Sum (GDD)",
    metric1Val: "540 / 890 °C·d",
    metric2Label: "Yield Projection",
    metric2Val: "4.8 MT/Ha",
    alertIcon: "hourglass_top",
    alertTitle: "Split-N Urea Countdown:",
    alertDesc: "Top-dressing execution due in 3 Days (V7 threshold). Pre-mix ready at Store 1.",
    alertClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    fieldLead: "Adeleke O.",
  },
  {
    id: "plot-2",
    name: "Plot B2 · 14.0 Ha",
    variety: "Cassava (TME 419)",
    localName: "Ege Giga-Starch (Late Rains 2024 Cycle)",
    category: "tubers",
    stageBadge: "Month 3 Bulking",
    stageBadgeClass: "bg-surface-container-high text-on-surface",
    progressTitle: "Canopy Closure Rate",
    progressSubtitle: "94% Full Cover",
    progressPct: 94,
    stages: ["Sprouting", "Branching", "Bulking", "Harvest (Nov '25)"],
    currentStageIdx: 2,
    metric1Label: "Weed Suppression",
    metric1Val: "Autonomous",
    metric2Label: "Target Starch Yield",
    metric2Val: "28.5 MT/Ha",
    alertIcon: "verified_user",
    alertTitle: "Cassava Mosaic Disease (CMD):",
    alertDesc: "Resistance level confirmed 100% stable; zero whitefly vectors on leaf collars.",
    alertClass: "bg-surface-container text-on-surface",
    fieldLead: "Babatunde G.",
  },
  {
    id: "plot-3",
    name: "Plot B1 · 6.5 Ha",
    variety: "Tomato Roma VF",
    localName: "Tomati Drip Precision Block",
    category: "horticulture",
    stageBadge: "Week 7 Fruit Set",
    stageBadgeClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    progressTitle: "Fruit Cluster Index",
    progressSubtitle: "4.2 Clusters/Plant",
    progressPct: 58,
    stages: ["Nursery", "Flower", "Fruit Set", "Breaker / Ripening"],
    currentStageIdx: 2,
    metric1Label: "Irrigation Regime",
    metric1Val: "12.4 m³/Ha/d",
    metric2Label: "Pre-Harvest Int.",
    metric2Val: "14 Days",
    alertIcon: "fmd_bad",
    alertTitle: "Downy Mildew Guardrail Hold:",
    alertDesc: "High morning leaf wetness. Copper Hydroxide spray cleared for morning 06:30.",
    alertClass: "bg-error-container text-on-error-container",
    fieldLead: "Quadri Olapade",
  },
  {
    id: "plot-4",
    name: "Plot B3 · 4.0 Ha",
    variety: "Cowpea SAMPEA-14",
    localName: "Ewa Biological Nitrogen Fixation",
    category: "tubers",
    stageBadge: "Week 3 Nodulation",
    stageBadgeClass: "bg-secondary-container text-on-secondary-container",
    progressTitle: "Symbiotic Nodulation",
    progressSubtitle: "Active (Pink Legh.)",
    progressPct: 35,
    stages: ["Emergence", "Nodules", "Flowering", "Pod Fill"],
    currentStageIdx: 1,
    metric1Label: "Natural N Fixed",
    metric1Val: "~42 kg N/Ha",
    metric2Label: "PBP Trap Count",
    metric2Val: "0 / Trap (Safe)",
    alertIcon: "pest_control",
    alertTitle: "Pod Borer Scouting Sweep:",
    alertDesc: "Maruca vitrata pheromone trap inspection scheduled for Thursday 08:00.",
    alertClass: "bg-surface-container text-on-surface",
    fieldLead: "Quadri Olapade",
  },
];

export function CropManagement({ lang, slots }: ScreenProps<"actions" | "kpis" | "portfolios" | "scouting">) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showScoutingModal, setShowScoutingModal] = useState(false);
  const [showRecalibrateModal, setShowRecalibrateModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // Scouting Form
  const [scoutForm, setScoutForm] = useState({
    plot: "Plot B1 · Tomato Roma VF",
    stage: "Week 7 Fruit Set",
    gps: "7.9532° N, 3.5971° E (Iseyin)",
    notes: "",
  });

  const filteredPlots = PLOTS.filter((p) => {
    if (activeCategory === "all") return true;
    return p.category === activeCategory;
  });

  const handleSaveScoutObservation = (e: React.FormEvent) => {
    e.preventDefault();
    const obsRef = "SCT-" + Math.floor(1000 + Math.random() * 9000);
    showScreenToast(`Scouting observation ${obsRef} saved! CultivaVision AI classified with 96% confidence.`);
    setShowScoutingModal(false);
    setScoutForm({
      plot: "Plot B1 · Tomato Roma VF",
      stage: "Week 7 Fruit Set",
      gps: "7.9532° N, 3.5971° E (Iseyin)",
      notes: "",
    });
  };

  const handleRecalibrate = () => {
    showScreenToast("Phenology models re-calibrated against latest Copernicus Sentinel-2 L2A telemetry.");
    setShowRecalibrateModal(false);
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-space-xl space-y-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                Section 3.3 · Agronomy Telemetry
              </span>
              <span className="px-space-xs py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                Season: Early Rains 2026 (Igba Ewe)
              </span>
              <span className="px-space-xs py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm flex items-center gap-1">
                <Icon name="satellite_alt" className="text-xs" /> Copernicus Sentinel-2 L2A Synced
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Crop Phenology &amp; Production Engine</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Real-time growth tracking, automated Growing Degree Days (GDD), split-input scheduling, and pest scouting logs for Iseyin Cluster.</p>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex items-center gap-space-sm flex-wrap self-start md:self-center">
              <button
                onClick={() => setShowScoutingModal(true)}
                className="flex items-center gap-space-xs px-space-md py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-lg text-label-lg transition-all shadow-sm cursor-pointer"
                type="button"
              >
                <Icon name="add_a_photo" className="text-lg" />
                <span>Log Field Scout (Iroyin Aaye)</span>
              </button>
              <button
                onClick={() => setShowRecalibrateModal(true)}
                className="flex items-center gap-space-xs px-space-md py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface rounded-lg font-label-lg text-label-lg transition-all cursor-pointer"
                type="button"
              >
                <Icon name="tune" className="text-lg text-secondary" />
                <span>Re-calibrate Phenology Models</span>
              </button>
            </div>
          )}
        </div>

        {slot(
          slots,
          "kpis",
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Planted Area</span>
                <div className="p-2 rounded-lg bg-surface-container text-secondary">
                  <Icon name="fence" className="text-xl" />
                </div>
              </div>
              <div className="my-space-md">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">42.5</span>
                  <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">Ha</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">100% farm cluster operational</p>
              </div>
              <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-semibold">
                <Icon name="check_circle" className="text-sm" />
                <span>6 Active Plots (Gbogbo Aaye)</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Projected Season Yield</span>
                <div className="p-2 rounded-lg bg-surface-container text-secondary">
                  <Icon name="grain" className="text-xl" />
                </div>
              </div>
              <div className="my-space-md">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">162.8</span>
                  <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">MT</span>
                </div>
                <div className="flex items-center gap-1 text-secondary font-label-md text-label-md font-bold mt-1">
                  <Icon name="trending_up" className="text-sm" />
                  <span>+24.6% vs Regional Avg</span>
                </div>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: "78%" }} />
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Input Plan Adherence</span>
                <div className="p-2 rounded-lg bg-surface-container text-secondary">
                  <Icon name="science" className="text-xl" />
                </div>
              </div>
              <div className="my-space-md">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">94.0</span>
                  <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">%</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Split-N timing fully on schedule</p>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Variance: -2 bags Urea</span>
                <span className="text-secondary font-semibold">Optimal</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Scouting Health Index</span>
                <div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container">
                  <Icon name="verified" className="text-xl" />
                </div>
              </div>
              <div className="my-space-md">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-secondary font-bold">91%</span>
                  <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">Clean</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">1 mild pest vector identified</p>
              </div>
              <div className="flex items-center gap-space-xs text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                <Icon name="warning" className="text-sm" />
                <span>Plot B1: Leaf Curvature Alert</span>
              </div>
            </div>
          </div>
        )}

        {slot(
          slots,
          "portfolios",
          <div className="flex flex-col space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Active Crop Portfolios &amp; Phenology Stages</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Live telemetry calculated from temperature sums, canopy reflectance &amp; phenological modeling.</p>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-lg">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-3 py-1 font-label-md text-label-md rounded cursor-pointer transition-colors ${activeCategory === "all" ? "bg-surface-container-lowest text-primary shadow-sm font-semibold" : "text-on-surface-variant hover:text-on-surface"}`}
                  type="button"
                >
                  All Plots ({PLOTS.length})
                </button>
                <button
                  onClick={() => setActiveCategory("cereals")}
                  className={`px-3 py-1 font-label-md text-label-md rounded cursor-pointer transition-colors ${activeCategory === "cereals" ? "bg-surface-container-lowest text-primary shadow-sm font-semibold" : "text-on-surface-variant hover:text-on-surface"}`}
                  type="button"
                >
                  Cereals
                </button>
                <button
                  onClick={() => setActiveCategory("tubers")}
                  className={`px-3 py-1 font-label-md text-label-md rounded cursor-pointer transition-colors ${activeCategory === "tubers" ? "bg-surface-container-lowest text-primary shadow-sm font-semibold" : "text-on-surface-variant hover:text-on-surface"}`}
                  type="button"
                >
                  Tubers &amp; Legumes
                </button>
                <button
                  onClick={() => setActiveCategory("horticulture")}
                  className={`px-3 py-1 font-label-md text-label-md rounded cursor-pointer transition-colors ${activeCategory === "horticulture" ? "bg-surface-container-lowest text-primary shadow-sm font-semibold" : "text-on-surface-variant hover:text-on-surface"}`}
                  type="button"
                >
                  Horticulture
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
              {filteredPlots.map((plot) => (
                <div key={plot.id} className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="p-space-lg space-y-space-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">{plot.name}</span>
                        <h3 className="font-headline-md text-headline-md text-on-surface mt-1">{plot.variety}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{plot.localName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full ${plot.stageBadgeClass} font-label-sm text-label-sm font-bold`}>{plot.stageBadge}</span>
                    </div>

                    <div className="bg-surface-container-low p-space-md rounded-lg space-y-space-xs">
                      <div className="flex items-center justify-between text-on-surface font-label-sm text-label-sm">
                        <span className="font-semibold">{plot.progressTitle}</span>
                        <span className="text-secondary font-bold">{plot.progressSubtitle}</span>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-2">
                        <div className="bg-secondary h-2 rounded-full" style={{ width: `${plot.progressPct}%` }} />
                      </div>
                      <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant pt-1">
                        {plot.stages.map((stg, i) => (
                          <span key={i} className={i === plot.currentStageIdx ? "font-bold text-primary" : ""}>
                            {stg}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-space-sm font-label-sm text-label-sm">
                      <div className="bg-surface p-space-sm rounded">
                        <p className="text-on-surface-variant">{plot.metric1Label}</p>
                        <p className="font-metric-num text-headline-sm text-primary font-bold">{plot.metric1Val}</p>
                      </div>
                      <div className="bg-surface p-space-sm rounded">
                        <p className="text-on-surface-variant">{plot.metric2Label}</p>
                        <p className="font-metric-num text-headline-sm text-secondary font-bold">{plot.metric2Val}</p>
                      </div>
                    </div>

                    <div className={`p-space-sm ${plot.alertClass} rounded-lg flex items-start gap-space-xs`}>
                      <Icon name={plot.alertIcon as any} className="text-base mt-0.5 text-current" />
                      <div className="text-xs leading-tight">
                        <span className="font-bold">{plot.alertTitle}</span>
                        <p className="mt-0.5">{plot.alertDesc}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-low px-space-lg py-space-sm flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">Field Lead: {plot.fieldLead}</span>
                    <Link className="text-secondary hover:text-primary font-semibold flex items-center gap-0.5" href={`/${lang}/account/farms/field`}>
                      Details <Icon name="arrow_forward" className="text-sm" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div>
              <div className="flex items-center gap-space-xs">
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Phenological Calendar &amp; Lifecycle Windows</h2>
                <span className="px-2 py-0.5 bg-surface-container font-label-sm text-label-sm text-on-surface-variant rounded">Season 2026</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Integrated Gantt tracking critical agronomic interventions across the Iseyin Hub plots.</p>
            </div>
            <div className="flex items-center gap-space-md text-xs font-semibold flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-surface-container-high" />
                <span>Land Prep</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary-container" />
                <span>Planting &amp; V-Stages</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-on-tertiary-container" />
                <span>Split Input / Chem</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-secondary" />
                <span>Harvest Window</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pt-space-xs">
            <div className="min-w-[760px] space-y-space-sm">
              <div className="grid grid-cols-12 text-center font-label-sm text-label-sm text-on-surface-variant font-bold bg-surface-container-low p-2 rounded-lg">
                <div className="text-left pl-2">Plot / Variety</div>
                <div>W1 Mar</div>
                <div>W2 Mar</div>
                <div>W3 Mar</div>
                <div>W4 Mar</div>
                <div className="text-primary font-bold bg-secondary-container/40 rounded">W1 Apr (Now)</div>
                <div>W2 Apr</div>
                <div>W3 Apr</div>
                <div>W4 Apr</div>
                <div>W1 May</div>
                <div>W2 May</div>
                <div>W3 May+</div>
              </div>
              <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate pr-2">Plot A1/A2 · Maize DMR</div>
                <div className="col-span-2 bg-surface-container-high text-on-surface text-center py-1.5 rounded-l text-[10px] font-semibold">Tillage &amp; Ridge</div>
                <div className="col-span-2 bg-primary-container text-on-primary-container text-center py-1.5 text-[10px] font-semibold">Planting + Basal</div>
                <div className="col-span-2 bg-on-tertiary-container text-on-tertiary text-center py-1.5 text-[10px] font-bold shadow-sm animate-pulse">V6 Split-Urea (Active)</div>
                <div className="col-span-3 bg-surface-container text-on-surface-variant text-center py-1.5 text-[10px] font-semibold">Tasseling &amp; R-Stages</div>
                <div className="col-span-2 bg-secondary text-on-secondary text-center py-1.5 rounded-r text-[10px] font-semibold">Harvest</div>
              </div>
              <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate pr-2">Plot B2 · Cassava 419</div>
                <div className="col-span-4 bg-primary-container text-on-primary-container text-center py-1.5 rounded-l text-[10px] font-semibold">Stem Cutting &amp; Pre-Em</div>
                <div className="col-span-4 bg-secondary text-on-secondary text-center py-1.5 text-[10px] font-bold">Canopy Close &amp; Bulking</div>
                <div className="col-span-4 bg-surface-container text-on-surface-variant text-center py-1.5 rounded-r text-[10px] font-semibold">Starch Storing (Harvest Nov)</div>
              </div>
              <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate pr-2">Plot B1 · Roma VF</div>
                <div className="col-span-2 bg-surface-container-high text-on-surface text-center py-1.5 rounded-l text-[10px] font-semibold">Nursery Beds</div>
                <div className="col-span-2 bg-primary-container text-on-primary-container text-center py-1.5 text-[10px] font-semibold">Transplant + Drip</div>
                <div className="col-span-2 bg-on-tertiary-container text-on-tertiary text-center py-1.5 text-[10px] font-bold">Fruit-Set + Mildew Hold</div>
                <div className="col-span-2 bg-surface-container text-on-surface-variant text-center py-1.5 text-[10px] font-semibold">Breaker Stage</div>
                <div className="col-span-4 bg-secondary text-on-secondary text-center py-1.5 rounded-r text-[10px] font-semibold">Weekly Staggered Crate Pick</div>
              </div>
              <div className="grid grid-cols-12 items-center text-xs p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="font-label-md text-label-md text-on-surface font-semibold truncate pr-2">Plot B3 · Cowpea SAMPEA</div>
                <div className="col-span-3 bg-surface-container-high text-on-surface text-center py-1.5 rounded-l text-[10px] font-semibold">Zero-Till Sowing</div>
                <div className="col-span-3 bg-primary-container text-on-primary-container text-center py-1.5 text-[10px] font-semibold">Inoculation &amp; Nodules</div>
                <div className="col-span-3 bg-surface-container text-on-surface-variant text-center py-1.5 text-[10px] font-semibold">Pod Borer Scouting Sweep</div>
                <div className="col-span-3 bg-secondary text-on-secondary text-center py-1.5 rounded-r text-[10px] font-semibold">Pod Desiccation &amp; Combine</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Input Planner &amp; Inventory Sync</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Nutrient timing, safety PHI, and local store allocations.</p>
              </div>
              <span className="p-2 bg-surface-container rounded-lg text-secondary">
                <Icon name="inventory_2" />
              </span>
            </div>

            <div className="space-y-space-sm">
              <div className="p-space-md bg-surface-container-low rounded-lg space-y-space-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Urea 46% N (Granular)</span>
                      <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold">Split 2 Due</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Allocated for Plot A1 &amp; A2 (Maize V6-V8 Topdress)</p>
                  </div>
                  <span className="text-secondary font-label-md text-label-md font-bold">In-Stock</span>
                </div>
                <div className="grid grid-cols-3 gap-space-xs text-xs pt-1">
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Required:</span>
                    <span className="font-bold text-on-surface">2,250 kg (45 Bags)</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Iseyin Silo Store:</span>
                    <span className="font-bold text-secondary">52 Bags Cached</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Application Window:</span>
                    <span className="font-bold text-on-tertiary-container">Apr 4 - Apr 7</span>
                  </div>
                </div>
              </div>

              <div className="p-space-md bg-surface-container-low rounded-lg space-y-space-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">Copper Hydroxide 53.8%</span>
                      <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Pest Guardrail</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Target: Plot B1 Tomato (Fungal Prevention)</p>
                  </div>
                  <span className="text-error font-label-md text-label-md font-bold">Low Buffer (-2.5 kg)</span>
                </div>
                <div className="grid grid-cols-3 gap-space-xs text-xs pt-1">
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Required:</span>
                    <span className="font-bold text-on-surface">15.0 kg</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Store Balance:</span>
                    <span className="font-bold text-error">12.5 kg Available</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded">
                    <span className="text-on-surface-variant block">Re-entry Interval:</span>
                    <span className="font-bold text-on-surface">48 Hours (REI)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-secondary font-semibold pt-1">
                  <span className="flex items-center gap-1"><Icon name="local_shipping" className="text-sm" /> Ibadan Hub Delivery ETA: 4 hrs</span>
                  <button
                    onClick={() => showScreenToast("Reorder of 25.0 kg Copper Hydroxide approved. Supplier invoice #PO-CHEM-9812 created.")}
                    className="text-primary underline cursor-pointer font-bold"
                    type="button"
                  >
                    Approve Reorder
                  </button>
                </div>
              </div>

              <div className="p-space-md bg-surface-container-low rounded-lg space-y-space-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">NPK 15-15-15 + Zn Micro</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Basal Applied</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Cycle: Completed across 18 Ha Maize &amp; 6.5 Ha Tomato</p>
                  </div>
                  <span className="text-secondary font-label-md text-label-md font-bold">100% Completed</span>
                </div>
              </div>
            </div>

            <div className="p-space-md bg-surface-container text-on-surface rounded-lg space-y-space-xs">
              <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md font-bold">
                <Icon name="shield" className="text-base" />
                <span>Compliance &amp; Pre-Harvest Interval (PHI) Warnings</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Tomato Plot B1 is entering fruit development. All synthetic chemical applications must halt 14 days prior to harvest window. Personal Protective Equipment (PPE) Level 3 required during Copper Hydroxide spray execution.</p>
            </div>

            <button
              onClick={() => setShowDispatchModal(true)}
              className="w-full py-2.5 bg-secondary hover:bg-primary text-on-secondary rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-space-xs cursor-pointer"
              type="button"
            >
              <Icon name="local_shipping" className="text-lg" />
              <span>Dispatch Input Kit to Field Team (Adeleke O.)</span>
            </button>
          </div>

          <div className="lg:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div>
                <div className="flex items-center gap-space-xs">
                  <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Scouting Observations &amp; AI Disease Log</h2>
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm font-bold">AI Diagnostics Active</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Geo-tagged agronomic inspections with computer vision disease classification.</p>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">Synced via PowerSync Engine</span>
            </div>

            {slot(
              slots,
              "scouting",
              <>
                <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md">
                  <div className="flex flex-col md:flex-row gap-space-md items-start">
                    <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-highest">
                      <img className="w-full h-full object-cover" data-alt="Early blight on tomato leaf" src="/images/screens/291f3f537ac2.webp" alt="" loading="lazy" decoding="async" />
                      <div className="absolute bottom-1 right-1 bg-surface-container-lowest/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-primary flex items-center gap-0.5">
                        <Icon name="pin_drop" className="text-xs" /> 7.9532° N, 3.5971° E
                      </div>
                    </div>
                    <div className="flex-1 space-y-space-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">Plot B1 · Roma VF (Row 14, Plant 82)</span>
                          <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Action Required</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Scouted Today, 08:42 WAT</span>
                      </div>
                      <div className="flex items-center gap-space-sm bg-surface-container-lowest p-2 rounded-lg">
                        <Icon name="psychology" className="text-secondary" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-primary">Diagnosis: Early Blight (Alternaria solani)</span>
                            <span className="font-bold text-secondary">94% Confidence</span>
                          </div>
                          <div className="w-full bg-surface-container rounded-full h-1.5 mt-1">
                            <div className="bg-secondary h-1.5 rounded-full" style={{ width: "94%" }} />
                          </div>
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface">Concentric ring spot lesions identified on 3 lower canopy leaves. Symptoms isolated to south-east furrow near micro-irrigation valve B-12.</p>
                      <div className="p-space-xs bg-surface-container rounded font-label-sm text-label-sm text-on-surface space-y-0.5">
                        <span className="font-bold text-primary flex items-center gap-1">
                          <Icon name="recommend" className="text-sm" /> Agronomist Approved SOP (Quadri Olapade):
                        </span>
                        <p className="text-xs text-on-surface-variant">Prune and burn affected lower leaves. Apply Copper Hydroxide spray (2.5 g/L) at sunset. Check neighboring Plot B3 buffer rows.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs text-xs">
                    <div className="flex items-center gap-space-sm text-on-surface-variant">
                      <span>Inspector: Adeleke O.</span>
                      <span>·</span>
                      <span>Batch ID: #SCT-2026-0402</span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <button
                        onClick={() => showScreenToast("Early Blight vector dismissed as localized minor symptom.")}
                        className="px-3 py-1 bg-surface-container text-on-surface hover:bg-surface-container-high rounded font-semibold transition-colors cursor-pointer"
                        type="button"
                      >
                        Dismiss Vector
                      </button>
                      <button
                        onClick={() => showScreenToast("Spray Ticket #ST-2026-081 authorized for Plot B1. Applicator gang notified.")}
                        className="px-3 py-1 bg-primary text-on-primary rounded font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                        type="button"
                      >
                        Confirm Spray Ticket
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md">
                  <div className="flex flex-col md:flex-row gap-space-md items-start">
                    <div className="w-full md:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-highest">
                      <img className="w-full h-full object-cover" data-alt="Cowpea root nodules" src="/images/screens/78bb747ef667.webp" alt="" loading="lazy" decoding="async" />
                      <div className="absolute bottom-1 right-1 bg-surface-container-lowest/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-primary flex items-center gap-0.5">
                        <Icon name="pin_drop" className="text-xs" /> 7.9540° N, 3.5985° E
                      </div>
                    </div>
                    <div className="flex-1 space-y-space-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">Plot B3 · Cowpea SAMPEA-14 (Plot Sector 2)</span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">Optimum Vigor</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Scouted Yesterday, 16:15 WAT</span>
                      </div>
                      <div className="flex items-center gap-space-sm bg-surface-container-lowest p-2 rounded-lg">
                        <Icon name="psychology" className="text-secondary" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-secondary">Diagnosis: Active Leghemoglobin Nodulation</span>
                            <span className="font-bold text-secondary">98% Confidence</span>
                          </div>
                          <div className="w-full bg-surface-container rounded-full h-1.5 mt-1">
                            <div className="bg-secondary h-1.5 rounded-full" style={{ width: "98%" }} />
                          </div>
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface">Nodule bisection demonstrates strong internal pink color indicative of intense nitrogenase activity. Inoculation with Bradyrhizobium fully successful. Zero defoliator caterpillar sign.</p>
                      <div className="p-space-xs bg-surface-container rounded font-label-sm text-label-sm text-on-surface space-y-0.5">
                        <span className="font-bold text-secondary flex items-center gap-1">
                          <Icon name="eco" className="text-sm" /> Biological Nitrogen Enrichment:
                        </span>
                        <p className="text-xs text-on-surface-variant">Recommended: Zero synthetic N addition needed. Maintain soil moisture levels for next 14 days.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs text-xs">
                    <div className="flex items-center gap-space-sm text-on-surface-variant">
                      <span>Inspector: Quadri Olapade</span>
                      <span>·</span>
                      <span>Batch ID: #SCT-2026-0401</span>
                    </div>
                    <button
                      onClick={() => showScreenToast("Observation #SCT-2026-0401 archived to seasonal agronomy registry.")}
                      className="px-3 py-1 bg-surface-container text-on-surface hover:bg-surface-container-high rounded font-semibold transition-colors cursor-pointer"
                      type="button"
                    >
                      Archive Observation
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scouting Observation Modal */}
      {showScoutingModal && (
        <ScreenDialog
          title="Log New Scouting Observation"
          subtitle="Geo-referenced field inspection with automated CultivaVision AI"
          onClose={() => setShowScoutingModal(false)}
          panel={
            <form onSubmit={handleSaveScoutObservation} className="flex flex-col gap-space-md p-space-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm font-semibold">Target Plot &amp; Variety</label>
                <select
                  value={scoutForm.plot}
                  onChange={(e) => setScoutForm({ ...scoutForm, plot: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                >
                  <option>Plot A1 &amp; A2 · Maize DMR-LSR-Y</option>
                  <option>Plot B2 · Cassava TME 419</option>
                  <option>Plot B1 · Tomato Roma VF</option>
                  <option>Plot B3 · Cowpea SAMPEA-14</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">Phenology Stage</label>
                  <input
                    type="text"
                    value={scoutForm.stage}
                    onChange={(e) => setScoutForm({ ...scoutForm, stage: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm font-semibold">GPS Location</label>
                  <input
                    type="text"
                    value={scoutForm.gps}
                    onChange={(e) => setScoutForm({ ...scoutForm, gps: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm font-semibold">Scout Field Notes (Akiyesi)</label>
                <textarea
                  rows={3}
                  placeholder="Describe foliar symptoms, insect signs, or moisture stress..."
                  value={scoutForm.notes}
                  onChange={(e) => setScoutForm({ ...scoutForm, notes: e.target.value })}
                  className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                />
              </div>

              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowScoutingModal(false)}>Cancel</ScreenDialogClose>
                <button type="submit" className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-md font-bold cursor-pointer">
                  Analyze &amp; Save Log
                </button>
              </div>
            </form>
          }
        />
      )}

      {/* Recalibrate Modal */}
      {showRecalibrateModal && (
        <ScreenDialog
          title="Re-calibrate Phenology Models"
          subtitle="Sync thermal heat units (GDD) with local agro-meteorological station"
          onClose={() => setShowRecalibrateModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <p className="text-body-sm text-on-surface-variant">
                Recalibrates thermal accumulation curves against Iseyin microclimate station data (Base temp: 10°C, Upper cap: 30°C).
              </p>
              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowRecalibrateModal(false)}>Cancel</ScreenDialogClose>
                <button
                  onClick={handleRecalibrate}
                  className="px-space-lg py-2 rounded-lg bg-primary text-on-primary font-label-md font-semibold cursor-pointer"
                  type="button"
                >
                  Run GDD Recalibration
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* Dispatch Kit Modal */}
      {showDispatchModal && (
        <ScreenDialog
          title="Dispatch Input Kit to Field Team"
          subtitle="Requisition release for Field Lead Adeleke O."
          onClose={() => setShowDispatchModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="bg-surface-container-low p-space-md rounded-xl space-y-1 text-body-sm">
                <div className="font-bold text-on-surface">Requisition Manifest #REQ-INP-084:</div>
                <div>• 45 Bags Urea 46% N (Granular) from Iseyin Silo Store</div>
                <div>• PPE Level 3 safety kits (2 sets)</div>
                <div>• Calibrated knapsack spray nozzles (4 units)</div>
              </div>
              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowDispatchModal(false)}>Cancel</ScreenDialogClose>
                <button
                  onClick={() => {
                    showScreenToast("Input kit release order #REQ-INP-084 signed and dispatched to warehouse team.");
                    setShowDispatchModal(false);
                  }}
                  className="px-space-lg py-2.5 rounded-lg bg-secondary text-on-secondary font-label-md font-bold cursor-pointer"
                  type="button"
                >
                  Authorize Warehouse Release
                </button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
