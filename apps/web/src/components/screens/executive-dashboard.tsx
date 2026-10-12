"use client";

// Ported from the "executive_farm_operations_dashboard" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export type ExecutiveDashboardSlot =
  | "eyebrow"
  | "greeting"
  | "heroMeta"
  | "heroActions"
  | "kpis"
  | "operations"
  | "statusBar";

interface OperationItem {
  id: string;
  name: string;
  subtext: string;
  plot: string;
  cropArea: string;
  timeline: string;
  timingNote: string;
  resource: string;
  resourceIcon: string;
  location: string;
  status: string;
  statusTone: "ready" | "delay" | "active" | "scout" | "scheduled" | "completed";
  actionLabel: string;
}

const INITIAL_OPERATIONS: OperationItem[] = [
  {
    id: "op-1",
    name: "Split-N Top-Dressing",
    subtext: "Side-placement 5cm from stalk",
    plot: "Plot A2",
    cropArea: "Maize (9.0 Ha)",
    timeline: "Due in 2 days",
    timingNote: "Optimal: Pre-rain window",
    resource: "12 Bags Urea (In Stock)",
    resourceIcon: "inventory_2",
    location: "Store Room 01",
    status: "Ready to Execute",
    statusTone: "ready",
    actionLabel: "Log Completion",
  },
  {
    id: "op-2",
    name: "Fungicide Shield (Mancozeb 80WP)",
    subtext: "Alternaria Solani prevention",
    plot: "Plot B1",
    cropArea: "Tomato (6.5 Ha)",
    timeline: "Delayed +48h",
    timingNote: "NiMet Guardrail active",
    resource: "14kg Mancozeb",
    resourceIcon: "water_drop",
    location: "Knapsack Crews ready",
    status: "Weather Hold (Rain 42mm)",
    statusTone: "delay",
    actionLabel: "Override Rule",
  },
  {
    id: "op-3",
    name: "Tractor Rotary Weeding",
    subtext: "Mechanical inter-row cultivator",
    plot: "Plot A1",
    cropArea: "Maize (9.0 Ha)",
    timeline: "Tomorrow 08:00 WAT",
    timingNote: "Operator Check-in Verified",
    resource: "JD 5075E Tractor",
    resourceIcon: "precision_manufacturing",
    location: "Escrow #ES-49201",
    status: "GPS Dispatched",
    statusTone: "active",
    actionLabel: "Live GPS Telemetry",
  },
  {
    id: "op-4",
    name: "Aphid & Thrips Scouting",
    subtext: "10-point random quadrant check",
    plot: "Plot B3",
    cropArea: "Cowpea (4.0 Ha)",
    timeline: "Today 16:30 WAT",
    timingNote: "Field Scout Assigned",
    resource: "Field Agent Babatunde",
    resourceIcon: "person_search",
    location: "Offline PowerSync App",
    status: "In Field Scout",
    statusTone: "scout",
    actionLabel: "Scout Sheet",
  },
  {
    id: "op-5",
    name: "Livestock Vaccination / NDV Booster",
    subtext: "Lasota strain ocular/drinking water administration",
    plot: "Poultry House 1",
    cropArea: "Broilers B4 (1,250 birds)",
    timeline: "Tomorrow 07:00 WAT",
    timingNote: "Early morning cool window",
    resource: "Lasota Vials (Vet Cold-Chain)",
    resourceIcon: "vaccines",
    location: "Dr. Alabi Scheduled",
    status: "Vet Scheduled",
    statusTone: "scheduled",
    actionLabel: "Review Protocol",
  },
];

export function ExecutiveDashboard({ slots }: ScreenProps<ExecutiveDashboardSlot>) {
  // Operational state
  const [operations, setOperations] = useState<OperationItem[]>(INITIAL_OPERATIONS);
  const [plotFilter, setPlotFilter] = useState<string>("all");
  const [powConfirmed, setPowConfirmed] = useState(false);
  const [aiLang, setAiLang] = useState<"EN" | "YORUBA">("EN");
  const [aiQuery, setAiQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([]);

  // Filtered operations
  const displayedOps = operations.filter((op) => {
    if (plotFilter === "all") return true;
    return op.plot.toLowerCase().includes(plotFilter.toLowerCase());
  });

  // Handler: Log Completion
  const handleLogCompletion = (opId: string) => {
    setOperations((prev) =>
      prev.map((op) => {
        if (op.id === opId) {
          const isDone = op.statusTone === "completed";
          return {
            ...op,
            status: isDone ? "Ready to Execute" : "Completed & Verified",
            statusTone: isDone ? "ready" : "completed",
            actionLabel: isDone ? "Log Completion" : "Completed ✓",
          };
        }
        return op;
      })
    );
    showScreenToast("Operation status updated and recorded in offline SQLite ledger.");
  };

  // Handler: Override Weather Rule
  const handleOverrideRule = (opId: string) => {
    setOperations((prev) =>
      prev.map((op) => {
        if (op.id === opId) {
          return {
            ...op,
            status: "Override Approved (Operator Risk)",
            statusTone: "active",
            timeline: "Ready for Execution",
            actionLabel: "Log Completion",
          };
        }
        return op;
      })
    );
    showScreenToast("Agronomy rule overridden with agronomist supervisor waiver #WAIV-082.");
  };

  // Handler: Export Operations Roster
  const handleExportRoster = () => {
    const csvHeader = "Operation,Subtext,Plot,Crop & Area,Timeline,Resource,Location,Status\n";
    const csvRows = operations
      .map(
        (o) =>
          `"${o.name}","${o.subtext}","${o.plot}","${o.cropArea}","${o.timeline}","${o.resource}","${o.location}","${o.status}"`
      )
      .join("\n");
    downloadFile(csvHeader + csvRows, `CultivaNode-Operations-Roster-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showScreenToast("Field operations roster exported successfully.");
  };

  // Handler: Confirm Proof of Work
  const handleConfirmPoW = () => {
    setPowConfirmed(true);
    showScreenToast("Proof of Work verified! Escrow payment ₦95,000 scheduled for Alhaji Kazeem Syndicate.");
  };

  // Handler: AI Query Submit
  const handleAiSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiQuery.trim()) return;
    const q = aiQuery.trim();
    setAiQuery("");
    setAiMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      {
        role: "bot",
        text:
          aiLang === "YORUBA"
            ? `Àyẹ̀wò Agronomist: Fún àrùn lórí ${q}, pèsè oògùn Copper Hydroxide (2.5g/L) lẹ́yìn tí òjò bá dá. Ma fi oògùn kankan sí koríko ní àkókò òjò ńlá.`
            : `AI Agronomist Diagnosis: For "${q}", ensure soil drainage furrows are unblocked. Recommended intervention is 2.5g/L Copper Hydroxide 48h following the heavy rain event.`,
      },
    ]);
  };

  // Modals content definition
  const modalNewPlanting = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="add_circle" className="text-secondary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">New Planting Cycle</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Register crop stand, plot allocation & target harvest timeline</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          showScreenToast("New planting cycle initiated and synced with crop phenology tracker!");
        }}
        className="p-space-lg space-y-space-md text-left"
      >
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Crop & Variety</label>
          <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
            <option>Maize DMR-LSR-Y (Yellow, Downy Mildew Resistant)</option>
            <option>Cassava TME 419 (High Starch, Pro-Vitamin A)</option>
            <option>Tomato Roma VF (Early Blight Tolerant)</option>
            <option>Soybeans TGx 1448-2E (Savanna Standard)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Assigned Plot</label>
            <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
              <option>Plot A1 (9.0 Ha - Mechanized)</option>
              <option>Plot A2 (9.0 Ha - Top-Dressing)</option>
              <option>Plot B1 (6.5 Ha - Drip Irrigated)</option>
              <option>Plot B2 (14.0 Ha - Cassava Stand)</option>
            </select>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Planting Date</label>
            <input defaultValue={new Date().toISOString().slice(0, 10)} className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="date" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Seed Rate (kg/Ha)</label>
            <input defaultValue="20" className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="number" />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Projected Yield (MT/Ha)</label>
            <input defaultValue="4.8" step="0.1" className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="number" />
          </div>
        </div>
        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="submit">
              Confirm Planting Cycle
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const modalBookMachinery = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="precision_manufacturing" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Book Machinery (Direct Syndicate)</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">0% Commission Pilot · Direct escrow lock & telemetry verification</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          showScreenToast("Machinery booking locked! Escrow created and provider notified.");
        }}
        className="p-space-lg space-y-space-md text-left"
      >
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Equipment / Service</label>
          <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
            <option>John Deere 5075E (75 HP) Rotary Weeder - ₦25,000/Ha</option>
            <option>Massey Ferguson 375 + Disc Harrow - ₦28,000/Ha</option>
            <option>Tractor Boom Sprayer (600L Tank) - ₦15,000/Ha</option>
            <option>Claas Dominator 130 Combine Harvester - ₦65,000/Ha</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Target Area (Hectares)</label>
            <input defaultValue="9.0" step="0.5" className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="number" />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Target Operation Date</label>
            {/* eslint-disable react-hooks/purity -- Client component: default date for form input */}
            <input defaultValue={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="date" />
          </div>
        </div>
        <div className="p-space-md rounded-lg bg-surface-container-low border border-surface-container space-y-1">
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Estimated Escrow Lock:</span>
            <span className="font-bold text-primary">₦225,000 (9 Ha @ ₦25k)</span>
          </div>
          <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span>Platform Commission:</span>
            <span className="text-secondary font-semibold">₦0 (0% Pilot Rate)</span>
          </div>
        </div>
        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="submit">
              Lock Escrow & Dispatch
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const modalLogOperation = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="edit_calendar" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Log Field Operation</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Record activity, input consumption, and agronomic observations</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          showScreenToast("Field operation recorded into Farm Books & agronomy ledger!");
        }}
        className="p-space-lg space-y-space-md text-left"
      >
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Operation Type</label>
          <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
            <option>Top-Dressing Fertilizer Application</option>
            <option>Preventative Crop Protection Spray</option>
            <option>Manual / Mechanical Weed Suppression</option>
            <option>Soil Sampling / Moisture Calibration</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Target Plot</label>
            <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
              <option>Plot A1 (Maize)</option>
              <option>Plot A2 (Maize)</option>
              <option>Plot B1 (Tomato)</option>
              <option>Plot B3 (Cowpea)</option>
            </select>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Labor Crew Size</label>
            <input defaultValue="4" className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="number" />
          </div>
        </div>
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Field Supervisor Observations</label>
          <textarea rows={3} placeholder="Note stand uniformity, pest pressure, or soil condition..." className="w-full p-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none resize-none" />
        </div>
        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="submit">
              Submit Field Log
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  const modalWeatherDetails = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="thunderstorm" className="text-tertiary-container text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">NiMet Agro-Met Weather Guardrail</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Iseyin Weather Station #04 · Synchronized 06:00 WAT</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="p-space-lg space-y-space-md text-left">
        <div className="p-space-md rounded-lg bg-error-container/20 border border-error-container">
          <div className="flex items-center gap-2">
            <Icon name="warning" className="text-error" />
            <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">42mm Frontal Downpour Expected</h4>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Intense rain event Thursday 14:00 – Friday 22:00 WAT. High risk of agrochemical wash-off, nutrient leaching, and topsoil runoff.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="p-space-sm bg-surface-container-low rounded-lg">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Soil Moisture (15cm)</span>
            <p className="font-headline-sm text-headline-sm text-on-surface mt-1">68% (Optimal)</p>
          </div>
          <div className="p-space-sm bg-surface-container-low rounded-lg">
            <span className="font-label-sm text-label-sm text-on-surface-variant">ET₀ Evapotranspiration</span>
            <p className="font-headline-sm text-headline-sm text-on-surface mt-1">3.8 mm/day</p>
          </div>
          <div className="p-space-sm bg-surface-container-low rounded-lg">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Barometric Pressure</span>
            <p className="font-headline-sm text-headline-sm text-on-surface mt-1">1012 hPa (Falling)</p>
          </div>
          <div className="p-space-sm bg-surface-container-low rounded-lg">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Safe Spray Window</span>
            <p className="font-headline-sm text-headline-sm text-secondary mt-1">Opens Sat 08:00 WAT</p>
          </div>
        </div>
        <div className="pt-space-md flex items-center justify-end border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => showScreenToast("Weather guardrail acknowledged.")} className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="button">
              Acknowledge Guardrail
            </button>
          </ScreenDialogClose>
        </div>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="mb-space-lg">
          <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none" />
            <div className="absolute right-96 -bottom-20 h-48 w-48 rounded-full bg-secondary/5 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-space-lg lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                {slot(
                  slots,
                  "eyebrow",
                  <div className="flex flex-wrap items-center gap-space-xs mb-space-xs">
                    <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm">
                      <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" /> Pilot Agro-Cluster Phase 1
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                      <Icon name="verified" className="text-sm text-secondary" /> NiMet Agro-Met Synced (06:00 WAT)
                    </span>
                  </div>
                )}
                {slot(
                  slots,
                  "greeting",
                  <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">
                    E káàrọ̀, Quadri Olapade
                  </h1>
                )}
                {slot(
                  slots,
                  "heroMeta",
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Iseyin Farm Hub • Plots A1-B3 (42.5 Ha) • Derived Savanna Ecological Zone, Oyo State
                  </p>
                )}
              </div>
              {slot(
                slots,
                "heroActions",
                <div className="flex flex-wrap items-center gap-space-sm">
                  <ScreenDialog title="New Planting" side="center" panel={modalNewPlanting}>
                    <button onClick={() => {}} className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-sm" type="button">
                      <Icon name="add_circle" className="text-base text-secondary" />
                      <span>New Planting</span>
                    </button>
                  </ScreenDialog>
                  <ScreenDialog title="Book Machinery" side="center" panel={modalBookMachinery}>
                    <button onClick={() => {}} className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-tertiary-container text-on-tertiary font-label-md text-label-md hover:opacity-95 transition-all shadow-sm" type="button">
                      <Icon name="precision_manufacturing" className="text-base" />
                      <span>Book Machinery (Direct)</span>
                    </button>
                  </ScreenDialog>
                  <ScreenDialog title="Log Field Operation" side="center" panel={modalLogOperation}>
                    <button onClick={() => {}} className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-sm" type="button">
                      <Icon name="edit_calendar" className="text-base" />
                      <span>Log Field Operation</span>
                    </button>
                  </ScreenDialog>
                </div>
              )}
            </div>
            <div className="mt-space-lg pt-space-md border-t border-surface-container flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-low/60 -mx-space-lg -mb-space-lg px-space-lg py-space-md">
              <div className="flex flex-wrap items-center gap-space-lg">
                <div className="flex items-center gap-space-sm">
                  <div className="h-10 w-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                    <Icon name="partly_cloudy_day" className="text-2xl" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline-md text-headline-md text-on-surface">29°C</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Partly Cloudy</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Iseyin Weather Stn #04</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-md">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Relative Humidity</p>
                    <p className="font-headline-sm text-headline-sm text-on-surface">72% <span className="font-label-sm text-label-sm text-secondary">Normal</span></p>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Soil Moisture (15cm)</p>
                    <p className="font-headline-sm text-headline-sm text-on-surface">68% <span className="font-label-sm text-label-sm text-secondary">Optimal</span></p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">ET₀ Evapotranspiration</p>
                    <p className="font-headline-sm text-headline-sm text-on-surface">3.8 mm/day</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-sm p-space-sm px-space-md rounded-lg bg-surface-container-lowest shadow-sm max-w-xl">
                <Icon name="thunderstorm" className="text-xl text-on-tertiary-container animate-bounce" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-wider font-bold">Weather Guardrail Alert</span>
                    <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[0.625rem]">42mm Rain Outlook</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Heavy frontal rain Thursday–Friday. All chemical spray orders held 48h pre-downpour.</p>
                </div>
                <ScreenDialog title="Weather Guardrail" side="center" panel={modalWeatherDetails}>
                  <button onClick={() => {}} className="shrink-0 p-1 text-on-surface-variant hover:text-primary" title="Details" type="button">
                    <Icon name="chevron_right" className="text-lg" />
                  </button>
                </ScreenDialog>
              </div>
            </div>
          </div>
        </section>
        <section className="mb-space-lg bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border-l-4 border-l-error">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
            <div className="flex items-center gap-space-xs">
              <Icon name="priority_high" className="text-error animate-pulse" />
              <h2 className="font-headline-md text-headline-md text-on-surface">What Needs Attention Today?</h2>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">4 Action Items</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Ranked by urgency · CultivaNode Diagnostic Engine</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md mt-space-md">
            <div className="p-space-sm rounded-lg bg-error-container/20 border border-error-container flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="px-1.5 py-0.5 rounded bg-error text-on-error font-label-sm text-[0.625rem] font-bold uppercase">Priority 1 · Weather Guardrail</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Plot B1 (Tomato)</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold mt-2">NiMet 42mm Heavy Rain Frontal Warning</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Mancozeb chemical sprays held 48h to prevent wash-off &amp; waterway run-off.</p>
              <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary font-medium">NiMet Sync 06:00 WAT</span>
                <ScreenDialog title="Mancozeb Protocol" side="center" panel={modalWeatherDetails}>
                  <button onClick={() => {}} className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold transition-colors" type="button">
                    View Protocol
                  </button>
                </ScreenDialog>
              </div>
            </div>
            <div className="p-space-sm rounded-lg bg-tertiary-fixed/20 border border-tertiary-fixed flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary font-label-sm text-[0.625rem] font-bold uppercase">Priority 2 · Agronomy Window</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Plot A2 (Maize)</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold mt-2">Split-Nitrogen Top-Dressing Due (Urea 46%)</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Side-placement 5cm from stalk required in 48-hour pre-rain window.</p>
              <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary font-medium">IITA Savanna Standard</span>
                <button
                  onClick={() => showScreenToast("Crew of 4 field hands dispatched to Plot A2 for Urea side-placement.")}
                  className="px-2 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors"
                  type="button"
                >
                  Dispatch Crew
                </button>
              </div>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container-low border border-surface-container flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[0.625rem] font-bold uppercase">Priority 3 · Inventory Reorder</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Hub Store #1</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold mt-2">Granular Urea Stock Shortfall</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Only 6 bags in stock; 14 additional bags needed to complete Plots A1 &amp; A2.</p>
              <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Iseyin Agro-Dealer</span>
                <button
                  onClick={() => showScreenToast("Dispatched instant replenishment PO for 14 bags Indorama Urea to Iseyin Dealer.")}
                  className="px-2 py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold hover:bg-primary transition-colors"
                  type="button"
                >
                  Instant Reorder
                </button>
              </div>
            </div>
            <div className="p-space-sm rounded-lg bg-secondary-container/20 border border-secondary-container flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="px-1.5 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-[0.625rem] font-bold uppercase">Priority 4 · Livestock Feed</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Poultry House 1</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold mt-2">Broiler Finisher Reorder Threshold</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">142 kg/day intake; current buffer 4 days. NDV booster timing synchronized.</p>
              <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-secondary font-medium">Livestock Bio-Track</span>
                <button
                  onClick={() => showScreenToast("Broiler feed roster loaded: 142 kg Grower/Finisher allocated for tomorrow's morning cycle.")}
                  className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold transition-colors"
                  type="button"
                >
                  Feed Roster
                </button>
              </div>
            </div>
          </div>
        </section>
        {slot(
          slots,
          "kpis",
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Cultivated Land Mass</span>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-primary tracking-tight">42.5</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface-variant">Ha</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary">
                  <Icon name="crop_free" />
                </div>
              </div>
              <div className="mt-space-md">
                <div className="flex items-center justify-between font-label-sm text-label-sm mb-1.5">
                  <span className="text-on-surface-variant">Cluster Allocation (6 Plots)</span>
                  <span className="text-primary font-bold">94% Active</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: "94%" }} />
                </div>
                <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant mt-2">
                  <span className="flex items-center gap-1 text-secondary font-medium"><Icon name="trending_up" className="text-xs" /> +4.2 Ha expansion</span>
                  <span>Derived Savanna</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Enterprise Portfolio</span>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface tracking-tight">6</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface-variant">Enterprises</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
                  <Icon name="hub" />
                </div>
              </div>
              <div className="mt-space-md space-y-1.5">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary" /> 4 Crop Stands (Maize, Cassava, Tomato, Cowpea)</span>
                  <span className="text-on-surface-variant font-medium">42.5 Ha</span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-container" /> Broilers B4 (1,250 birds)</span>
                  <span className="text-secondary font-semibold">98.8% Livab.</span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-tertiary-container" /> Catfish Pond P2 (3,400 fingerlings)</span>
                  <span className="text-on-surface-variant font-medium">1.15 MT Biomass</span>
                </div>
                <div className="p-1.5 rounded bg-surface-container-low flex items-center justify-between mt-1 font-label-sm text-label-sm">
                  <span className="text-on-surface-variant flex items-center gap-1"><Icon name="pets" className="text-xs text-secondary" /> Active Livestock:</span>
                  <span className="text-primary font-bold">4,650 head · 98.4% Livability</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Agronomy Ops Velocity</span>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface tracking-tight">18<span className="text-headline-md text-on-surface-variant">/22</span></span>
                    <span className="font-label-md text-label-md text-secondary font-bold">82%</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <Icon name="checklist" />
                </div>
              </div>
              <div className="mt-space-md">
                <div className="p-space-sm bg-surface-container-low rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface">Next 72 Hours</span>
                    <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm">4 Pending</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Split-N top-dressing (Maize A2) &amp; tractor rotary weeding.</p>
                </div>
                <div className="flex items-center gap-1.5 mt-2 font-label-sm text-label-sm text-on-surface-variant">
                  <Icon name="verified" className="text-sm text-secondary" />
                  <span>Zero SOP non-compliance logged</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Farm Capital &amp; Settlement</span>
                  <div className="flex items-baseline gap-space-xs mt-1">
                    <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">₦4.85M</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Proj. Gross</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-tertiary-fixed/60 flex items-center justify-center text-tertiary">
                  <Icon name="account_balance" />
                </div>
              </div>
              <div className="mt-space-md pt-space-xs space-y-2">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">Deployed Input Capital:</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">₦1,240,000</span>
                </div>
                <div className="flex flex-col p-1.5 rounded bg-surface-container-low">
                  <div className="flex items-center justify-between text-body-sm font-body-sm">
                    <span className="text-tertiary flex items-center gap-1 font-medium"><Icon name="handshake" className="text-sm" /> Active Service Bookings:</span>
                    <span className="font-label-md text-label-md text-tertiary-container font-bold">₦320,000</span>
                  </div>
                  <span className="text-[0.625rem] text-secondary font-medium mt-0.5">Direct Settlement · 0% Commission Pilot</span>
                </div>
              </div>
            </div>
          </section>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm pb-space-md border-b border-surface-container">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <Icon name="psychiatry" className="text-secondary" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">Active Crop Cycles &amp; Phenology</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Synchronized with IITA Savanna Protocols • Growing Degree Days Tracking</p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="px-space-sm py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-bold">Derived Savanna Early Rains 2025</span>
                </div>
              </div>
              <div className="mt-space-md space-y-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="h-12 w-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0">
                        <Icon name="grain" className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Maize DMR-LSR-Y</h3>
                          <span className="px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-[0.625rem]">Plot A1 &amp; A2 • 18 Ha</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Planted 24 days ago (18 Feb) • Target Yield: <strong className="text-on-surface">4.8 MT/Ha</strong> <span className="text-secondary">(+50% vs regional avg)</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm md:text-right">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md">V6 Stage (Week 5)</span>
                    </div>
                  </div>
                  <div className="mt-space-md">
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                      <span>Vegetative Growth (Rapid N Uptake)</span>
                      <span>Harvest Window: May 22 - May 29 (68 days left)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden flex">
                      <div className="h-full bg-secondary" style={{ width: "38%" }} />
                      <div className="h-full bg-secondary-fixed-dim" style={{ width: "15%" }} />
                    </div>
                  </div>
                  <div className="mt-space-sm flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-lowest text-body-sm font-body-sm">
                    <div className="flex items-center gap-2 text-on-surface">
                      <Icon name="science" className="text-base text-secondary" />
                      <span>Split-Nitrogen Top-Dressing (Urea 46%) triggers in 48 hours for Plot A2.</span>
                    </div>
                    <button
                      onClick={() => showScreenToast("Displaying IITA Nitrogen Protocol: Apply 60 kg N/ha side-dressed 5cm away from root crown.")}
                      className="text-secondary hover:text-primary font-label-sm text-label-sm font-semibold"
                      type="button"
                    >
                      View Protocol
                    </button>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="h-12 w-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm shrink-0">
                        <Icon name="spa" className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Cassava (TME 419 High Starch)</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-[0.625rem]">Plot B2 • 14 Ha</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Planted 82 days ago (Dec Late Rains) • Est. Bulk: <strong className="text-on-surface">26.5 MT/Ha</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm md:text-right">
                      <span className="px-space-sm py-1 rounded-full bg-surface-container text-on-surface font-label-md text-label-md">Month 3: Early Root Bulking</span>
                    </div>
                  </div>
                  <div className="mt-space-md">
                    <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant mb-1">
                      <span>Canopy Closure Complete • Weed Resistance High</span>
                      <span>Harvest: Nov 2025 (9-10 Mos)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
                      <div className="h-full bg-primary-container" style={{ width: "28%" }} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="p-space-md rounded-xl bg-surface-container-low">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-error" />
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">Tomato (Roma VF)</h4>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Plot B1 • 6.5 Ha • Drip Irrigated</span>
                      </div>
                      <span className="px-space-xs py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">Mildew Guardrail</span>
                    </div>
                    <div className="mt-space-sm">
                      <div className="flex items-baseline justify-between text-body-sm font-body-sm">
                        <span>Week 7: 1st Fruit Set</span>
                        <span className="font-medium">Harvest: 28 days</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-lowest mt-1 overflow-hidden">
                        <div className="h-full bg-tertiary-container" style={{ width: "62%" }} />
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm flex items-center gap-1"><Icon name="warning" className="text-sm text-tertiary" /> Hold copper fungicide spray until Saturday rain clear.</p>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-low">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                          <h4 className="font-headline-sm text-headline-sm text-on-surface">Cowpea (SAMPEA-14)</h4>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Plot B3 • 4.0 Ha • Cover / Relay</span>
                      </div>
                      <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Biological Nitrogen Fix</span>
                    </div>
                    <div className="mt-space-sm">
                      <div className="flex items-baseline justify-between text-body-sm font-body-sm">
                        <span>Week 3: Vegetative</span>
                        <span className="font-medium">Nodulation Active</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-lowest mt-1 overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: "30%" }} />
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm flex items-center gap-1"><Icon name="pest_control" className="text-sm text-secondary" /> Pod-borer scouting planned for Monday morning.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm pb-space-md border-b border-surface-container">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <Icon name="pets" className="text-secondary" />
                    <h2 className="font-headline-md text-headline-md text-on-surface">Active Livestock Enterprises &amp; Production</h2>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Intensive Poultry &amp; Recirculating Aquaculture • Biosecurity Level 1 Protocols</p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="px-space-sm py-1 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-bold">Mixed Farm Integration</span>
                  <span className="px-space-sm py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">2 Batches Active</span>
                </div>
              </div>
              <div className="mt-space-md space-y-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="h-12 w-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm shrink-0">
                        <Icon name="egg" className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Broilers (Kuroiler / Cobb 500)</h3>
                          <span className="px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-[0.625rem]">Batch B4 • Poultry House 1</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">1,250 Birds • Day 28 (Week 4 Grower) • Livability: <strong className="text-secondary">98.8%</strong> (15 mortalities to date)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm md:text-right">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md font-semibold">FCR: 1.62 (Target: 1.65)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mt-space-md">
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Avg Bird Weight</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">1.35 kg <span className="font-label-sm text-label-sm text-on-surface-variant">/ 1.40 kg</span></p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Daily Feed Intake</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">142 kg/day</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Biosecurity Status</span>
                      <p className="font-label-md text-label-md text-secondary font-semibold mt-0.5 flex items-center gap-1"><Icon name="verified" className="text-sm" /> Footbath Active</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Feed Inventory</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">4 Days Buffer</p>
                    </div>
                  </div>
                  <div className="mt-space-sm flex items-center justify-between p-space-xs px-space-sm rounded bg-surface-container-lowest text-body-sm font-body-sm">
                    <div className="flex items-center gap-2 text-on-surface">
                      <Icon name="medical_services" className="text-base text-secondary" />
                      <span>NDV Lasota Booster vaccination due in 48h. Cold-chain confirmed at Hub Store.</span>
                    </div>
                    <button
                      onClick={() => showScreenToast("Veterinary protocol: Administer Lasota strain in clean non-chlorinated drinking water with skimmed milk buffer.")}
                      className="text-secondary hover:text-primary font-label-sm text-label-sm font-semibold"
                      type="button"
                    >
                      Vet Protocol
                    </button>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="h-12 w-12 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm shrink-0">
                        <Icon name="phishing" className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Aquaculture / Clarias Catfish</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-[0.625rem]">Pond 02 • Recirculating Tank</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">3,400 Fingerlings • Month 2 Grow-out • Est. Total Biomass: <strong className="text-on-surface">1.15 MT</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-sm md:text-right">
                      <span className="px-space-sm py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-label-md text-label-md font-semibold">Water Quality: Optimal</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mt-space-md">
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Water Temperature</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">27.5°C</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Dissolved Oxygen</span>
                      <p className="font-headline-sm text-headline-sm text-secondary mt-0.5">6.2 mg/L</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Feeding Protocol</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5">18 kg/day</p>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Feed Type</span>
                      <p className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">4mm Floating Pellet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {slot(
              slots,
              "operations",
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm pb-space-md border-b border-surface-container">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Scheduled Farm Operations</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Governed by: <span className="font-medium text-on-surface">Savanna Maize Standard v2.1 (Oyo-Derived Protocol)</span></p>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <select
                      value={plotFilter}
                      onChange={(e) => setPlotFilter(e.target.value)}
                      className="px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer focus:outline-none"
                    >
                      <option value="all">All Plots & Units</option>
                      <option value="Plot A1">Plot A1 (Maize)</option>
                      <option value="Plot A2">Plot A2 (Maize)</option>
                      <option value="Plot B1">Plot B1 (Tomato)</option>
                      <option value="Plot B3">Plot B3 (Cowpea)</option>
                      <option value="Poultry">Poultry House 1</option>
                    </select>
                    <button
                      onClick={handleExportRoster}
                      className="px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1"
                      type="button"
                    >
                      <Icon name="download" className="text-sm" />
                      <span>Export Roster</span>
                    </button>
                  </div>
                </div>
                <div className="mt-space-md overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-space-sm px-space-sm">Operation / Task</th>
                        <th className="py-space-sm px-space-sm">Plot &amp; Area</th>
                        <th className="py-space-sm px-space-sm">Timeline</th>
                        <th className="py-space-sm px-space-sm">Resource / Inputs</th>
                        <th className="py-space-sm px-space-sm">Status &amp; Protocol</th>
                        <th className="py-space-sm px-space-sm text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
                      {displayedOps.map((op) => (
                        <tr key={op.id} className={`hover:bg-surface-container-low transition-colors ${op.statusTone === "completed" ? "opacity-60 bg-secondary-container/10" : ""}`}>
                          <td className="py-space-md px-space-sm">
                            <div className="font-label-md text-label-md text-on-surface font-semibold">{op.name}</div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant">{op.subtext}</div>
                          </td>
                          <td className="py-space-md px-space-sm">
                            <span className="font-label-md text-label-md text-on-surface font-medium">{op.plot}</span>
                            <div className="text-on-surface-variant">{op.cropArea}</div>
                          </td>
                          <td className="py-space-md px-space-sm">
                            <span className={`font-label-md text-label-md ${op.statusTone === "delay" ? "text-error font-semibold" : "text-on-surface"}`}>{op.timeline}</span>
                            <div className="text-on-surface-variant">{op.timingNote}</div>
                          </td>
                          <td className="py-space-md px-space-sm">
                            <div className="flex items-center gap-1 font-medium text-on-surface">
                              <Icon name={op.resourceIcon as any} className="text-sm text-secondary" />
                              <span>{op.resource}</span>
                            </div>
                            <div className="text-on-surface-variant">{op.location}</div>
                          </td>
                          <td className="py-space-md px-space-sm">
                            <span className={`inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full font-label-sm text-label-sm ${
                              op.statusTone === "ready"
                                ? "bg-secondary-container/50 text-on-secondary-container"
                                : op.statusTone === "delay"
                                ? "bg-tertiary-fixed text-on-tertiary-fixed"
                                : op.statusTone === "active"
                                ? "bg-secondary-container/50 text-on-secondary-container"
                                : op.statusTone === "completed"
                                ? "bg-secondary text-on-secondary font-bold"
                                : "bg-surface-container text-on-surface-variant"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${op.statusTone === "delay" ? "bg-tertiary" : "bg-secondary"}`} />
                              <span>{op.status}</span>
                            </span>
                          </td>
                          <td className="py-space-md px-space-sm text-right">
                            {op.actionLabel === "Override Rule" ? (
                              <button
                                onClick={() => handleOverrideRule(op.id)}
                                className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
                                type="button"
                              >
                                {op.actionLabel}
                              </button>
                            ) : op.actionLabel === "Live GPS Telemetry" ? (
                              <button
                                onClick={() => showScreenToast("JD 5075E Telemetry: Lat 7.9124, Lon 3.5931 · Speed 4.2 km/h · PTO 1,420 RPM active.")}
                                className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm transition-colors"
                                type="button"
                              >
                                {op.actionLabel}
                              </button>
                            ) : op.actionLabel === "Scout Sheet" ? (
                              <button
                                onClick={() => showScreenToast("Scout Sheet for Plot B3: Aphids count low (1.2/stalk), zero thrips infestation detected.")}
                                className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm transition-colors"
                                type="button"
                              >
                                {op.actionLabel}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLogCompletion(op.id)}
                                className={`px-space-sm py-1 rounded-lg font-label-sm text-label-sm transition-colors ${
                                  op.statusTone === "completed"
                                    ? "bg-surface-container text-secondary font-bold"
                                    : "bg-primary text-on-primary hover:bg-primary-container"
                                }`}
                                type="button"
                              >
                                {op.actionLabel}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <Icon name="precision_manufacturing" className="text-secondary" />
                  <h2 className="font-headline-md text-headline-md text-on-surface">Machinery &amp; Equipment</h2>
                </div>
                <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[0.625rem] font-bold uppercase">0% Comm. Pilot</span>
              </div>
              <div className="mt-space-md p-space-md rounded-xl bg-surface-container-low space-y-space-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">John Deere 5075E (75 HP)</div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Alhaji Kazeem Syndicate • Oyo North</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                    {powConfirmed ? "Verified Done" : "In Field"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="p-space-sm bg-surface-container-lowest rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Agreed Direct Fee</span>
                    <p className="font-headline-sm text-headline-sm text-primary font-bold">₦95,000</p>
                  </div>
                  <div className="p-space-sm bg-surface-container-lowest rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Telemetry Status</span>
                    <p className="font-label-md text-label-md text-secondary flex items-center gap-1 mt-0.5"><span className="h-2 w-2 rounded-full bg-secondary" /> 1,420 RPM Active</p>
                  </div>
                </div>
                <div className="pt-space-xs">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Plot A1 Rotary Weeding (9 Ha)</span>
                    <span className="font-bold text-on-surface">{powConfirmed ? "9.0 Ha Done (100%)" : "6.2 Ha Done (68%)"}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-lowest mt-1.5 overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: powConfirmed ? "100%" : "68%" }} />
                  </div>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant italic">Direct settlement between farmer &amp; provider. Proof of Work (GPS boundary &amp; photos) verified before milestone signoff.</p>
                <div className="flex items-center gap-space-xs pt-space-xs">
                  <button
                    onClick={() => showScreenToast("GPS Route telemetry: 14 swaths completed at 1.8m spacing. Geofence bounds respected 100%.")}
                    className="flex-1 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md text-center transition-colors"
                    type="button"
                  >
                    Inspect GPS Route
                  </button>
                  <button
                    onClick={handleConfirmPoW}
                    disabled={powConfirmed}
                    className={`flex-1 py-2 rounded-lg font-label-md text-label-md text-center transition-colors ${
                      powConfirmed
                        ? "bg-surface-container text-secondary font-bold cursor-default"
                        : "bg-secondary text-on-secondary hover:bg-primary"
                    }`}
                    type="button"
                  >
                    {powConfirmed ? "PoW Signed ✓" : "Confirm Proof of Work"}
                  </button>
                </div>
              </div>
              <div className="mt-space-md pt-space-md border-t border-surface-container">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Verified Providers Nearby</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">4 Verified Units</span>
                </div>
                <div className="space-y-space-xs">
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon name="agriculture" className="text-sm text-secondary" />
                      <span className="font-label-md text-label-md text-on-surface">MF 375 + Disc Harrow</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">6km away • ₦28k/Ha</span>
                  </div>
                  <div className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon name="stream_apps" className="text-sm text-secondary" />
                      <span className="font-label-md text-label-md text-on-surface">Tractor Boom Sprayer (600L)</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">11km away • ₦15k/Ha</span>
                  </div>
                </div>
                <button
                  onClick={() => showScreenToast("Browsing Oyo/Ogun syndicate pool: 11 active tractors and implements within 30km.")}
                  className="w-full mt-space-sm py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md text-center transition-colors font-semibold"
                  type="button"
                >
                  Browse Syndicate Pool (Oyo/Ogun)
                </button>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <Icon name="smart_toy" className="text-secondary" />
                  <h2 className="font-headline-md text-headline-md text-on-surface">AI Field Agronomist Triage</h2>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAiLang("EN")}
                    className={`px-1.5 py-0.5 rounded font-label-sm text-[0.625rem] font-bold ${
                      aiLang === "EN" ? "bg-secondary text-on-secondary" : "bg-surface-container text-on-surface"
                    }`}
                    type="button"
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setAiLang("YORUBA")}
                    className={`px-1.5 py-0.5 rounded font-label-sm text-[0.625rem] font-bold ${
                      aiLang === "YORUBA" ? "bg-secondary text-on-secondary" : "bg-surface-container text-on-surface"
                    }`}
                    type="button"
                  >
                    YORÙBÁ
                  </button>
                </div>
              </div>
              <div className="mt-space-md space-y-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="coronavirus" className="text-error" />
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Plot B1: Tomato Leaf Triage</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">94% Match</span>
                  </div>
                  <div className="mt-2 text-body-sm font-body-sm text-on-surface-variant">
                    <strong className="text-on-surface">Early Blight (Alternaria solani)</strong> detected via leaf lesion scan at Node 03.
                  </div>
                  <div className="mt-space-sm p-space-sm rounded bg-surface-container-lowest">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-secondary font-bold">Verified Prescription:</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Dr. Funke A. (IITA Alum)</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface mt-1">
                      Apply Copper Hydroxide 50WP (2.5g/L water) 48h after the forecast rain stops. Do not apply prior to Friday downpour.
                    </p>
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between">
                    <button
                      onClick={() => showScreenToast("Ẹ̀rọ ń gbọ́ ohùn: 'Àkíyèsí pàtàkì: Ma fi oògùn sí i títí òjò yóò fi dá...' (0:45 playback started).")}
                      className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors font-medium"
                      type="button"
                    >
                      <Icon name="volume_up" className="text-sm text-secondary" />
                      <span>Gbọ́ ní Yorùbá (Voice Note)</span>
                    </button>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">0:45 audio</span>
                  </div>
                </div>

                {aiMessages.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {aiMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg text-body-sm font-body-sm ${
                          m.role === "user"
                            ? "bg-primary text-on-primary ml-4"
                            : "bg-surface-container-low text-on-surface mr-4 border border-surface-container"
                        }`}
                      >
                        {m.text}
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAiSubmit} className="relative">
                  <input
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    className="w-full h-11 pl-3 pr-20 bg-surface-container-low rounded-lg text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                    placeholder={
                      aiLang === "YORUBA"
                        ? "Béèrè àrùn tàbí oògùn ní Yorùbá..."
                        : "Ask symptom in English, Pidgin, or Yorùbá..."
                    }
                    type="text"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={() => {
                        setAiQuery("Yellow spots on maize leaves after rain");
                        showScreenToast("Voice note transcribed: 'Yellow spots on maize leaves after rain'");
                      }}
                      className="p-1 text-on-surface-variant hover:text-secondary"
                      title="Voice Input"
                      type="button"
                    >
                      <Icon name="mic" className="text-lg" />
                    </button>
                    <button
                      onClick={() => {}}
                      type="submit"
                      className="h-7 w-7 rounded bg-secondary text-on-secondary flex items-center justify-center hover:bg-primary transition-colors"
                    >
                      <Icon name="arrow_forward" className="text-sm" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <Icon name="inventory" className="text-secondary" />
                  <h2 className="font-headline-md text-headline-md text-on-surface">Input Stock Watch</h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Hub Store #1</span>
              </div>
              <div className="mt-space-md space-y-space-md">
                <div>
                  <div className="flex items-center justify-between font-label-md text-label-md mb-1">
                    <span className="text-on-surface font-medium">NPK 15-15-15 (Golden Fertilizer)</span>
                    <span className="text-secondary font-bold">28 Bags (Optimal)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between font-label-md text-label-md mb-1">
                    <span className="text-on-surface font-medium">Granular Urea 46% (Indorama)</span>
                    <span className="text-on-tertiary-container font-bold">6 Bags (Low Stock)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-tertiary-container rounded-full" style={{ width: "22%" }} />
                  </div>
                  <p className="font-label-sm text-label-sm text-on-tertiary-container mt-1 flex items-center gap-1"><Icon name="info" className="text-xs" /> Required for Plot A2 + Plot A1 top-dress: Need 14 additional bags.</p>
                </div>
                <div>
                  <div className="flex items-center justify-between font-label-md text-label-md mb-1">
                    <span className="text-on-surface font-medium">Neem Bio-Extract (3000 PPM)</span>
                    <span className="text-on-surface-variant font-bold">15 Litres</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "55%" }} />
                  </div>
                </div>
                <button
                  onClick={() => showScreenToast("Redirecting to Iseyin Verified Dealer: Batch order created for 14 bags Indorama Urea.")}
                  className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface font-label-md text-label-md text-center transition-all flex items-center justify-center gap-2 font-semibold"
                  type="button"
                >
                  <Icon name="local_shipping" className="text-base" />
                  <span>Order from Verified Iseyin Agro-Dealer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {slot(
          slots,
          "statusBar",
          <div className="mt-space-xl p-space-md rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm text-body-sm font-body-sm text-on-surface-variant">
            <div className="flex items-center gap-space-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-secondary animate-ping" />
              <span className="font-label-md text-label-md text-on-surface font-semibold">Local SQLite Engine Active:</span>
              <span>1,842 plot records synced with cloud master • Zero packet loss</span>
            </div>
            <div className="flex items-center gap-space-md text-label-sm font-label-sm">
              <span>Latency: 42ms (MTN 4G / Iseyin Tower)</span>
              <span>•</span>
              <span className="text-secondary font-bold">CultivaNode OS v2.4.1 (Derived Savanna Build)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
