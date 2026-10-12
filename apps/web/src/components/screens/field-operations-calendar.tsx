"use client";

// Ported from the "field_operations_farm_calendar" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState, useMemo, useEffect } from "react";
import type { WeatherResponse, WeatherDay } from "@cultivanode/shared";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export interface OperationRecord {
  id: string;
  opCode: string;
  activity: string;
  method: string;
  enterprise: string;
  plot: string;
  dueWindow: string;
  dueDetail: string;
  resources: string;
  crew: string;
  status: "ready" | "weather_hold" | "gps_dispatched" | "in_progress" | "vet_confirmed" | "completed";
  statusText: string;
  statusBadgeClass: string;
}

export interface FieldOperationsCalendarProps extends ScreenProps<"actions" | "kpis" | "operations"> {
  weatherData?: WeatherResponse;
  liveTasks?: any[];
  livePlots?: any[];
  liveWorkers?: any[];
  liveFarms?: any[];
  cropCycles?: any[];
  cycleOperations?: any[];
}

const INITIAL_OPERATIONS: OperationRecord[] = [
  {
    id: "op-1",
    opCode: "#OP-2026-104",
    activity: "Split-N Top-Dressing (Urea 46%)",
    method: "Basal Band Placement @ 5cm offset",
    enterprise: "Maize DMR-LSR-Y • V6 Vegetative Stage",
    plot: "Plot A1 & A2 (18.0 Ha)",
    dueWindow: "Due in 2 Days",
    dueDetail: "Friday 07:00 WAT (Optimal Pre-Rain)",
    resources: "12 Bags Urea 46% (Verified)",
    crew: "Crew B (6 Workers • Lead: Adeleke O.)",
    status: "ready",
    statusText: "Ready to Execute",
    statusBadgeClass: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "op-2",
    opCode: "#OP-2026-105",
    activity: "Fungicide Shield (Mancozeb 80WP)",
    method: "Early Blight / Septoria Prevention Protocol",
    enterprise: "Tomato Roma VF • Flowering Stage",
    plot: "Plot B1 (6.5 Ha)",
    dueWindow: "Delayed +48h",
    dueDetail: "NiMet Wash-off Alert (42mm)",
    resources: "14 kg Mancozeb (In Chemical Locker)",
    crew: "4 Knapsack Sprayers Calibrated",
    status: "weather_hold",
    statusText: "Weather Hold (Rain 42mm)",
    statusBadgeClass: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
  {
    id: "op-3",
    opCode: "#OP-2026-106",
    activity: "Mechanical Rotary Inter-row Weeding",
    method: "Syndicate Machinery Dispatch #MCH-489",
    enterprise: "Maize • Canopy Closing Imminent",
    plot: "Plot A1 (9.0 Ha)",
    dueWindow: "Tomorrow 08:00 WAT",
    dueDetail: "Soil Moisture: 19% (Traction Optimal)",
    resources: "JD 5075E Tractor (Alhaji Kazeem Syndicate)",
    crew: "Operator: Babatunde Gbadamosi",
    status: "gps_dispatched",
    statusText: "GPS Dispatched / Locked",
    statusBadgeClass: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "op-4",
    opCode: "#OP-2026-107",
    activity: "Aphid & Pod Borer Scouting Sweep",
    method: "Systematic 5-point 'W' Grid Sampling",
    enterprise: "Cowpea SAMPEA-14 • Podding Stage",
    plot: "Plot B3 (4.0 Ha)",
    dueWindow: "Today 16:30 WAT",
    dueDetail: "Late afternoon insect activity peak",
    resources: "Quadri Olapade (Lead Agronomist)",
    crew: "PowerSync Mobile Field App Form #SC-2",
    status: "in_progress",
    statusText: "In Progress",
    statusBadgeClass: "bg-surface-container-high text-primary",
  },
  {
    id: "op-5",
    opCode: "#OP-2026-108",
    activity: "Livestock Vaccination: NDV Lasota Booster",
    method: "Drinking water delivery with skimmed milk stabilizer",
    enterprise: "Broilers B4 • 1,250 Birds (Day 21)",
    plot: "Poultry House 1",
    dueWindow: "Tomorrow 07:00 WAT",
    dueDetail: "Cool early morning stress minimization",
    resources: "Dr. Alabi (Veterinary Partner)",
    crew: "Cold-chain verified vial #NV-882 (4°C)",
    status: "vet_confirmed",
    statusText: "Vet Confirmed",
    statusBadgeClass: "bg-surface-container text-on-surface",
  },
  {
    id: "op-6",
    opCode: "#OP-2026-109",
    activity: "Pond Aeration & Water DO Flush",
    method: "Target Dissolved Oxygen: > 5.5 mg/L",
    enterprise: "Clarias Growout • 3,400 Fingerlings",
    plot: "Catfish Pond P2",
    dueWindow: "Daily Routine",
    dueDetail: "06:00 & 18:00 WAT Cycles",
    resources: "Solar Submersible Aerator Unit 2",
    crew: "Telemetry Node #WT-04",
    status: "completed",
    statusText: "Completed (18:00)",
    statusBadgeClass: "bg-secondary-container text-on-secondary-container",
  },
];

function weatherIconName(kind: string): any {
  switch (kind) {
    case "clear":
      return "sunny";
    case "partly":
      return "partly_cloudy_day";
    case "cloudy":
      return "cloud";
    case "fog":
      return "foggy";
    case "drizzle":
      return "rainy";
    case "rain":
      return "rainy";
    case "storm":
      return "thunderstorm";
    default:
      return "partly_cloudy_day";
  }
}

function buildOperationsFromLive(
  liveTasks?: any[],
  cycleOperations?: any[],
  cropCycles?: any[],
  livePlots?: any[],
  liveWorkers?: any[]
): OperationRecord[] {
  const hasTasks = liveTasks && liveTasks.length > 0;
  const hasCycleOps = cycleOperations && cycleOperations.length > 0;
  if (!hasTasks && !hasCycleOps) {
    return INITIAL_OPERATIONS;
  }

  const workerMap = new Map((liveWorkers || []).map((w: any) => [w.id, w]));
  const plotMap = new Map((livePlots || []).map((p: any) => [p.id, p]));
  const cycleMap = new Map((cropCycles || []).map((c: any) => [c.id, c]));

  const records: OperationRecord[] = [];
  const coveredCycleOpKeys = new Set<string>();

  (liveTasks || []).forEach((t: any) => {
    const plot = t.plot_id ? plotMap.get(t.plot_id) : undefined;
    const cycle = t.crop_cycle_id ? cycleMap.get(t.crop_cycle_id) : undefined;

    let workerNames: string[] = [];
    if (t.description && typeof t.description === "string" && t.description.includes("[assigned_workers:")) {
      const match = t.description.match(/\[assigned_workers:\s*([^\]]+)\]/);
      if (match && match[1]) {
        const ids = match[1].split(",").map((s: string) => s.trim());
        for (const wid of ids) {
          const w = workerMap.get(wid);
          if (w) workerNames.push(w.full_name);
        }
      }
    }
    if (workerNames.length === 0 && t.assigned_worker_id) {
      const w = workerMap.get(t.assigned_worker_id);
      if (w) workerNames.push(w.full_name);
    }
    const crewDisplay = workerNames.length > 0
      ? (workerNames.length > 1 ? `${workerNames.join(", ")} (${workerNames.length} Crew)` : workerNames[0])
      : "Unassigned";

    const cropLabel = cycle
      ? `${cycle.crop_name || cycle.crop_id || "Crop"} (${cycle.variety || cycle.season || "Active"})`
      : (t.description?.includes("[Plant Cycle:") ? "Crop Cycle Plan" : "General Enterprise");

    let opStatus: OperationRecord["status"] = "ready";
    let statusText = "Ready to Execute";
    let statusBadgeClass = "bg-secondary-container text-on-secondary-container";
    if (t.status === "completed") {
      opStatus = "completed";
      statusText = "Completed & Verified";
      statusBadgeClass = "bg-secondary-container text-on-secondary-container font-bold";
    } else if (t.status === "in_progress") {
      opStatus = "in_progress";
      statusText = "In Progress";
      statusBadgeClass = "bg-surface-container-high text-primary font-bold";
    } else if (t.priority === "urgent" || t.priority === "high") {
      statusText = "Urgent Hold / Time-Sensitive";
      statusBadgeClass = "bg-error text-on-error font-bold";
    }

    if (t.crop_cycle_id) {
      coveredCycleOpKeys.add(`${t.crop_cycle_id}::${String(t.title || "").toLowerCase()}`);
    }

    const tId = String(t.id || "task");
    records.push({
      id: t.id || `task-${Math.random()}`,
      opCode: `#OP-${tId.slice(0, 8).toUpperCase()}`,
      activity: t.title || "Field Operation",
      method: t.description ? String(t.description).replace(/\[assigned_workers:[^\]]+\]/g, "").trim() : "Standard Field Execution",
      enterprise: cropLabel,
      plot: plot ? `${plot.name} (${plot.area_ha || 1} Ha)` : "Whole Farm Plot",
      dueWindow: t.due_date ? `Due: ${t.due_date}` : "Scheduled",
      dueDetail: t.priority ? `Priority: ${String(t.priority).toUpperCase()}` : "Normal Window",
      resources: t.direct_cost_minor ? `₦${(t.direct_cost_minor / 100).toLocaleString()}` : "Staged Field Inputs",
      crew: crewDisplay,
      status: opStatus,
      statusText,
      statusBadgeClass,
    });
  });

  (cycleOperations || []).forEach((cop: any) => {
    const key = `${cop.crop_cycle_id}::${String(cop.name || "").toLowerCase()}`;
    if (!coveredCycleOpKeys.has(key)) {
      const cycle = cycleMap.get(cop.crop_cycle_id);
      const plot = cycle?.plot_id ? plotMap.get(cycle.plot_id) : undefined;
      const cropLabel = cycle
        ? `${cycle.crop_name || cycle.crop_id || "Crop"} (${cycle.variety || "Active"})`
        : "Planting Cycle";

      let workerNames: string[] = [];
      if (cop.notes && typeof cop.notes === "string" && cop.notes.includes("[assigned_workers:")) {
        const match = cop.notes.match(/\[assigned_workers:\s*([^\]]+)\]/);
        if (match && match[1]) {
          const ids = match[1].split(",").map((s: string) => s.trim());
          for (const wid of ids) {
            const w = workerMap.get(wid);
            if (w) workerNames.push(w.full_name);
          }
        }
      }
      if (workerNames.length === 0 && cop.assigned_worker_id) {
        const w = workerMap.get(cop.assigned_worker_id);
        if (w) workerNames.push(w.full_name);
      }
      const crewDisplay = workerNames.length > 0
        ? (workerNames.length > 1 ? `${workerNames.join(", ")} (${workerNames.length} Crew)` : workerNames[0])
        : "Unassigned (Plant Cycle)";

      const copId = String(cop.id || "cycle");
      records.push({
        id: `cycle-op-${cop.id}`,
        opCode: `#CYCLE-${copId.slice(0, 6).toUpperCase()}`,
        activity: cop.name || "Cycle Operation",
        method: `Stage: ${cop.stage || "Planned"}. ${Array.isArray(cop.required_inputs) ? JSON.stringify(cop.required_inputs) : ""}`,
        enterprise: cropLabel,
        plot: plot ? `${plot.name} (${plot.area_ha || 1} Ha)` : "Planting Plot",
        dueWindow: cop.scheduled_date ? `Due: ${cop.scheduled_date}` : "Upcoming Cycle",
        dueDetail: `Cycle Stage: ${cop.stage || "Planned"}`,
        resources: "Advisory Benchmark Inputs",
        crew: crewDisplay,
        status: cop.status === "completed" ? "completed" : "ready",
        statusText: cop.status === "completed" ? "Completed" : "Ready to Assign",
        statusBadgeClass: cop.status === "completed" ? "bg-secondary-container text-on-secondary-container" : "bg-primary-container text-on-primary-container",
      });
    }
  });

  return records.length > 0 ? records : INITIAL_OPERATIONS;
}

export function FieldOperationsCalendar({
  lang: _lang,
  slots,
  weatherData,
  liveTasks,
  livePlots,
  liveWorkers,
  liveFarms,
  cropCycles,
  cycleOperations,
}: FieldOperationsCalendarProps) {
  const initialOperations = useMemo(() => {
    return buildOperationsFromLive(liveTasks, cycleOperations, cropCycles, livePlots, liveWorkers);
  }, [liveTasks, cycleOperations, cropCycles, livePlots, liveWorkers]);

  const [operations, setOperations] = useState<OperationRecord[]>(initialOperations);

  useEffect(() => {
    setOperations(buildOperationsFromLive(liveTasks, cycleOperations, cropCycles, livePlots, liveWorkers));
  }, [liveTasks, cycleOperations, cropCycles, livePlots, liveWorkers]);

  const [viewMode, setViewMode] = useState<string>("roster");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<string>("verify");
  const [payrollReconciled, setPayrollReconciled] = useState<boolean>(false);

  // Filter Enterprise state
  const [filterEnterprise, setFilterEnterprise] = useState<string>("all");
  const [filterEnterpriseOpen, setFilterEnterpriseOpen] = useState<boolean>(false);

  // Bulk assign worker dialog state
  const [selectedBulkWorkerIds, setSelectedBulkWorkerIds] = useState<string[]>([]);
  const [bulkAssignOpen, setBulkAssignOpen] = useState<boolean>(false);

  // Telemetry map selected plot
  const [selectedMapPlot, setSelectedMapPlot] = useState<string>("plot-a1");

  // New operation modal form
  const [newActivity, setNewActivity] = useState<string>("");
  const [newPlot, setNewPlot] = useState<string>("Plot A1 Maize");
  const [newMethod, setNewMethod] = useState<string>("Basal placement");
  const [newLead, setNewLead] = useState<string>("Adeleke O. (Crew B)");
  const [newDate, setNewDate] = useState<string>("2026-05-10");

  // Parse weather from props or fallback to pilot station
  const pilotForecast = useMemo(() => {
    if (weatherData && weatherData.ok && weatherData.forecasts && weatherData.forecasts.length > 0) {
      return weatherData.forecasts[0];
    }
    return null;
  }, [weatherData]);

  const weatherDays = useMemo(() => {
    if (pilotForecast && pilotForecast.days.length > 0) {
      return pilotForecast.days.slice(0, 7).map((d: WeatherDay, idx: number) => {
        const isHazard = d.rainMm >= 25 || d.kind === "storm";
        const isPrime = d.rainMm === 0 && (d.kind === "clear" || d.kind === "partly");
        let safeLabel = "SAFE";
        let safeBadge = "bg-secondary-container text-on-secondary-container";
        if (isHazard) {
          safeLabel = "HAZARD";
          safeBadge = "bg-error text-on-error";
        } else if (isPrime) {
          safeLabel = "PRIME";
          safeBadge = "bg-secondary-container text-on-secondary-container";
        }
        let dayName = "TODAY";
        if (idx > 0) {
          try {
            const dateObj = new Date(d.date);
            dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
          } catch {
            dayName = `D+${idx}`;
          }
        }
        return {
          day: dayName,
          icon: weatherIconName(d.kind),
          high: `${Math.round(d.maxC)}°C`,
          low: `${Math.round(d.minC)}°C`,
          rain: `${d.rainMm}mm`,
          safe: safeLabel,
          safeBg: safeBadge,
          rainChance: d.rainChance,
          windKmh: d.windKmh,
        };
      });
    }
    return [
      { day: "TODAY", icon: "partly_cloudy_day", high: "31°C", low: "22°C", rain: "8mm", safe: "SAFE", safeBg: "bg-secondary-container text-on-secondary-container" },
      { day: "THU", icon: "cloud", high: "29°C", low: "21°C", rain: "18mm", safe: "SAFE", safeBg: "bg-secondary-container text-on-secondary-container" },
      { day: "FRI", icon: "thunderstorm", high: "26°C", low: "20°C", rain: "42mm", safe: "HAZARD", safeBg: "bg-error text-on-error" },
      { day: "SAT", icon: "sunny", high: "32°C", low: "22°C", rain: "0mm", safe: "PRIME", safeBg: "bg-secondary-container text-on-secondary-container" },
      { day: "SUN", icon: "sunny", high: "33°C", low: "23°C", rain: "0mm", safe: "PRIME", safeBg: "bg-secondary-container text-on-secondary-container" },
      { day: "MON", icon: "cloud", high: "30°C", low: "21°C", rain: "5mm", safe: "SAFE", safeBg: "bg-secondary-container text-on-secondary-container" },
      { day: "TUE", icon: "partly_cloudy_day", high: "31°C", low: "22°C", rain: "4mm", safe: "SAFE", safeBg: "bg-secondary-container text-on-secondary-container" },
    ];
  }, [pilotForecast]);

  const activeWeatherHazard = useMemo(() => {
    return weatherDays.find((w) => w.safe === "HAZARD");
  }, [weatherDays]);

  const filteredOps = operations.filter((op) => {
    if (filterEnterprise !== "all") {
      const matchEnterprise =
        (filterEnterprise === "grain" && (op.enterprise.toLowerCase().includes("maize") || op.enterprise.toLowerCase().includes("cowpea"))) ||
        (filterEnterprise === "horticulture" && op.enterprise.toLowerCase().includes("tomato")) ||
        (filterEnterprise === "livestock" && op.enterprise.toLowerCase().includes("broiler")) ||
        (filterEnterprise === "aquaculture" && (op.enterprise.toLowerCase().includes("pond") || op.enterprise.toLowerCase().includes("clarias")));
      if (!matchEnterprise) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      op.opCode.toLowerCase().includes(q) ||
      op.activity.toLowerCase().includes(q) ||
      op.plot.toLowerCase().includes(q) ||
      op.enterprise.toLowerCase().includes(q)
    );
  });

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredOps.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportRoster = () => {
    const csvContent =
      "Operation Code,Activity,Method,Enterprise,Field/Plot,Agronomic Window,Resources,Crew,Execution Status\n" +
      operations
        .map(
          (o) =>
            `"${o.opCode}","${o.activity}","${o.method}","${o.enterprise}","${o.plot}","${o.dueWindow} - ${o.dueDetail}","${o.resources}","${o.crew}","${o.statusText}"`
        )
        .join("\n");

    downloadFile("cultivanode-daily-field-operations-roster.csv", csvContent, "text/csv");
    showScreenToast("Daily field operations roster exported to CSV.");
  };

  const handleAddOperation = () => {
    if (!newActivity.trim()) {
      showScreenToast("Please provide the operation activity title.");
      return;
    }

    const created: OperationRecord = {
      id: `op-${Date.now()}`,
      opCode: `#OP-2026-${Math.floor(110 + Math.random() * 890)}`,
      activity: newActivity,
      method: newMethod,
      enterprise: "Scheduled Enterprise",
      plot: newPlot,
      dueWindow: newDate,
      dueDetail: "Scheduled Execution Window",
      resources: "Input Staging Pending",
      crew: newLead,
      status: "ready",
      statusText: "Ready to Execute",
      statusBadgeClass: "bg-secondary-container text-on-secondary-container",
    };

    setOperations([created, ...operations]);
    setNewActivity("");
    showScreenToast(`Operation ${created.opCode} scheduled for ${created.plot}.`);
  };

  const handleExecuteBatchAction = () => {
    if (selectedIds.length === 0) {
      showScreenToast("Select one or more operations in the table first.");
      return;
    }
    if (batchAction === "verify") {
      setOperations(
        operations.map((o) => (selectedIds.includes(o.id) ? { ...o, status: "completed", statusText: "Bulk Verified" } : o))
      );
      showScreenToast(`${selectedIds.length} operations marked as verified.`);
    } else if (batchAction === "reschedule") {
      setOperations(
        operations.map((o) => (selectedIds.includes(o.id) ? { ...o, dueWindow: "Rescheduled +24h" } : o))
      );
      showScreenToast(`${selectedIds.length} operations rescheduled +24 hours.`);
    } else {
      showScreenToast(`SMS alert triggered to operators for ${selectedIds.length} operations.`);
    }
    setSelectedIds([]);
  };

  const handleBulkAssignSubmit = () => {
    if (selectedIds.length === 0) {
      showScreenToast("Select operations to assign first.");
      return;
    }
    if (selectedBulkWorkerIds.length === 0) {
      showScreenToast("Select at least one worker or crew member.");
      return;
    }
    const workerMap = new Map((liveWorkers || []).map((w: any) => [w.id, w]));
    const names = selectedBulkWorkerIds.map((id) => workerMap.get(id)?.full_name || id);
    const crewString = names.length > 1 ? `${names.join(", ")} (${names.length} Crew)` : names[0];

    setOperations(
      operations.map((o) => (selectedIds.includes(o.id) ? { ...o, crew: crewString } : o))
    );
    showScreenToast(`Assigned ${crewString} to ${selectedIds.length} operations.`);
    setBulkAssignOpen(false);
    setSelectedIds([]);
    setSelectedBulkWorkerIds([]);
  };

  const moveKanbanTask = (id: string, newStatus: OperationRecord["status"]) => {
    setOperations(
      operations.map((o) => {
        if (o.id !== id) return o;
        let statusText = o.statusText;
        let statusBadgeClass = o.statusBadgeClass;
        if (newStatus === "ready") {
          statusText = "Ready to Execute";
          statusBadgeClass = "bg-secondary-container text-on-secondary-container";
        } else if (newStatus === "in_progress") {
          statusText = "In Progress";
          statusBadgeClass = "bg-surface-container-high text-primary font-bold";
        } else if (newStatus === "weather_hold") {
          statusText = "Weather Hold (NiMet Alert)";
          statusBadgeClass = "bg-tertiary-fixed text-on-tertiary-fixed font-bold";
        } else if (newStatus === "completed") {
          statusText = "Completed & Verified";
          statusBadgeClass = "bg-secondary-container text-on-secondary-container font-bold";
        }
        return { ...o, status: newStatus, statusText, statusBadgeClass };
      })
    );
    showScreenToast("Operation status updated.");
  };

  const panelScheduleNewOp = (
    <div className="w-full max-w-lg rounded-xl bg-surface-container-lowest shadow-2xl p-space-md flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <Icon name="add_circle" className="text-primary text-xl" />
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Schedule New Field Operation</h3>
        </div>
        <ScreenDialogClose>
          <button className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" className="text-lg" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Operation Activity</label>
          <input
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
            placeholder="e.g. 2nd Foliar Bio-stimulant Application"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Target Field / Plot</label>
            <input
              className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
              value={newPlot}
              onChange={(e) => setNewPlot(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Target Date</label>
            <input
              className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Application Method / Equipment</label>
          <input
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
            value={newMethod}
            onChange={(e) => setNewMethod(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Crew Lead / Operator</label>
          <input
            className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none"
            value={newLead}
            onChange={(e) => setNewLead(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
        <ScreenDialogClose>
          <button className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
            Cancel
          </button>
        </ScreenDialogClose>
        <ScreenDialogClose>
          <button
            className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container"
            type="button"
            onClick={handleAddOperation}
          >
            Schedule Operation
          </button>
        </ScreenDialogClose>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16 space-y-space-lg">
        {/* Real-time sync & weather indicator header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-md bg-surface-container-lowest rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center gap-space-sm text-body-sm font-body-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>
                {pilotForecast ? `${pilotForecast.place.town} Cluster Station (${pilotForecast.place.state})` : "Local Mesh Node #OY-ISE-04 Online"}
              </span>
            </div>
            <span className="text-on-surface-variant">•</span>
            <span className="text-on-surface-variant font-medium">
              Live Weather Feed: <strong className="text-on-surface">{weatherData?.ok ? "Open-Meteo Synced" : "Standby Satellite"}</strong>
            </span>
            <span className="text-on-surface-variant">•</span>
            <span className="text-on-surface-variant">
              Now: <span className="text-on-surface font-mono">{pilotForecast?.now ? `${Math.round(pilotForecast.now.tempC)}°C, ${pilotForecast.now.humidity}% RH` : "28.5°C"}</span>
            </span>
          </div>
          <div className="flex items-center gap-space-sm text-label-md font-label-md text-on-surface-variant">
            <Icon name="satellite_alt" className="text-secondary text-sm" />
            <span>
              Sentinel-2 L2A Passes: <strong className="text-on-surface">Today 11:42 WAT (Clear Sky 4%)</strong>
            </span>
          </div>
        </div>

        {/* Title and Action Buttons */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
          <div className="space-y-space-xs">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="px-space-sm py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                Multi-Enterprise Execution Hub
              </span>
              <span className="px-space-sm py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                Iseyin Savanna Protocol v2.1
              </span>
              <span className="px-space-sm py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                Zone 4A Agro-Ecological Grid
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">
              Field Operations &amp; Farm Calendar
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Centralized dispatch, agro-meteorological guardrails, and asset tracking across broadacre grain, horticultural rows, poultry cycles, and aquaculture ponds.
            </p>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex flex-wrap items-center gap-space-sm">
              <button
                className={`flex items-center gap-space-xs px-space-md py-2.5 rounded-lg font-label-lg text-label-lg shadow-sm transition-colors ${
                  filterEnterprise !== "all"
                    ? "bg-primary text-on-primary font-bold"
                    : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
                }`}
                type="button"
                onClick={() => setFilterEnterpriseOpen(!filterEnterpriseOpen)}
              >
                <Icon name="tune" className="text-base" />
                <span>
                  Filter Enterprise {filterEnterprise !== "all" ? `(${filterEnterprise})` : ""}
                </span>
              </button>
              <button
                className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-colors"
                type="button"
                onClick={() => {
                  if (selectedIds.length === 0) {
                    showScreenToast("Select one or more operations in the ledger table first.");
                  } else {
                    setBulkAssignOpen(true);
                  }
                }}
              >
                <Icon name="group_add" className="text-base" />
                <span>Bulk Assign Tasks {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}</span>
              </button>
              <button
                className="flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-colors"
                type="button"
                onClick={handleExportRoster}
              >
                <Icon name="picture_as_pdf" className="text-base text-primary" />
                <span>Export Roster (CSV)</span>
              </button>
              <ScreenDialog title="Schedule New Operation" side="center" panel={panelScheduleNewOp}>
                <button className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-colors" type="button">
                  <Icon name="add_circle" className="text-base" />
                  <span>Schedule New Operation</span>
                </button>
              </ScreenDialog>
            </div>
          )}
        </div>

        {/* Filter Enterprise Modal Dialog */}
        {filterEnterpriseOpen && (
          <div className="p-4 bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-bold text-on-surface">Filter Operations by Enterprise Cluster</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">View agronomic schedules dedicated to specific crop or livestock types:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "all", label: "All Enterprises" },
                { key: "grain", label: "Maize & Grains" },
                { key: "horticulture", label: "Horticulture & Tomato" },
                { key: "livestock", label: "Poultry & Livestock" },
                { key: "aquaculture", label: "Aquaculture Ponds" },
              ].map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => {
                    setFilterEnterprise(btn.key);
                    showScreenToast(`Filter set to: ${btn.label}`);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
                    filterEnterprise === btn.key
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFilterEnterpriseOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface text-label-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Bulk Assign Dialog */}
        {bulkAssignOpen && (
          <div className="p-4 bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
              <div>
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  Bulk Assign Staff to {selectedIds.length} Selected Operation{selectedIds.length === 1 ? "" : "s"}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Check one or more registered farm workers to assign together as a crew:
                </p>
              </div>
              <span className="text-xs font-semibold text-primary">
                {selectedBulkWorkerIds.length} worker{selectedBulkWorkerIds.length === 1 ? "" : "s"} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {(liveWorkers && liveWorkers.length > 0 ? liveWorkers : [
                { id: "w-1", full_name: "Adeleke O.", role: "Crew Lead" },
                { id: "w-2", full_name: "Babatunde Gbadamosi", role: "Operator" },
                { id: "w-3", full_name: "Quadri Olapade", role: "Agronomist" },
                { id: "w-4", full_name: "Tawa Yusuf", role: "Crew A Lead" },
                { id: "w-5", full_name: "Dr. Alabi", role: "Vet" },
              ]).map((w: any) => {
                const isChecked = selectedBulkWorkerIds.includes(w.id);
                return (
                  <label
                    key={w.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs font-medium border transition-colors ${
                      isChecked
                        ? "bg-secondary-container/50 border-secondary text-on-secondary-container font-semibold"
                        : "bg-surface-container-low border-outline-variant/20 text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedBulkWorkerIds(selectedBulkWorkerIds.filter((id) => id !== w.id));
                        } else {
                          setSelectedBulkWorkerIds([...selectedBulkWorkerIds, w.id]);
                        }
                      }}
                      className="rounded text-primary focus:ring-primary w-4 h-4"
                    />
                    <div className="flex flex-col truncate">
                      <span className="truncate">{w.full_name}</span>
                      <span className="text-[10px] text-on-surface-variant capitalize">{w.role.replace(/_/g, " ")}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setBulkAssignOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkAssignSubmit}
                className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container shadow-sm"
              >
                Apply Assignment ({selectedBulkWorkerIds.length})
              </button>
            </div>
          </div>
        )}

        {/* KPIs */}
        {slot(
          slots,
          "kpis",
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
            <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-start justify-between">
                <div className="space-y-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Execution Velocity</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-metric-num text-metric-num text-primary">81.8%</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">18 / 22 Done</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container">
                  <Icon name="task_alt" className="text-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: "81.8%" }} />
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>4 Pending in next 48h</span>
                  <span className="font-semibold text-secondary">0 Overdue / Blocked</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-start justify-between">
                <div className="space-y-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Active Workforce &amp; Fleet</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-metric-num text-metric-num text-on-surface">15 Heads</span>
                    <span className="font-label-md text-label-md px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container">Deployed</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-high text-primary">
                  <Icon name="agriculture" className="text-xl" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-on-surface">
                  <Icon name="badge" className="text-xs text-primary" /> 12 Field Hands
                </span>
                <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-on-surface">
                  <Icon name="precision_manufacturing" className="text-xs text-primary" /> 1 JD 5075E
                </span>
                <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-on-surface">
                  <Icon name="psychology" className="text-xs text-primary" /> 2 Agronomists
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-start justify-between">
                <div className="space-y-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Weather Guardrail Impact</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-metric-num text-metric-num text-tertiary">
                      {activeWeatherHazard ? "1 Hold" : "Optimal"}
                    </span>
                    <span className="font-label-md text-label-md px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                      {activeWeatherHazard ? "NiMet Alert" : "Clear Outlook"}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed">
                  <Icon name="thunderstorm" className="text-xl" />
                </div>
              </div>
              <div className="p-2 rounded bg-tertiary-fixed/30 font-body-sm text-body-sm text-on-tertiary-fixed leading-tight">
                <strong>{activeWeatherHazard ? `${activeWeatherHazard.rain} Rainfall Outlook:` : "Dry Agro Window:"}</strong>{" "}
                {activeWeatherHazard ? "Chemical spraying paused during high-rain front." : "Foliar and granular operations clear to proceed."}
              </div>
            </div>

            <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-start justify-between">
                <div className="space-y-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Input / Material Staging</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-metric-num text-metric-num text-primary">96.4%</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Staged &amp; Verified</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-high text-secondary">
                  <Icon name="warehouse" className="text-xl" />
                </div>
              </div>
              <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <Icon name="inventory_2" className="text-base text-secondary" />
                <span className="truncate">
                  14 Bags Granular Urea staged at <strong>Field Store 1</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Switching Tabs (Timeline & Gantt, Kanban Board, Daily Roster, Field Map) */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pb-1">
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-sm overflow-x-auto">
            {[
              { key: "gantt", label: "Timeline & Gantt", icon: "view_timeline" },
              { key: "kanban", label: "Kanban Board", icon: "view_kanban" },
              { key: "roster", label: "Daily Operations Roster", icon: "ballot" },
              { key: "map", label: "Field Map Telemetry", icon: "map" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`px-space-md py-2 rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  viewMode === tab.key
                    ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                type="button"
                onClick={() => {
                  setViewMode(tab.key);
                  showScreenToast(`View switched to ${tab.label}.`);
                }}
              >
                <Icon name={tab.icon as any} className="text-base" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <Icon name="filter_list" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base" />
              <input
                className="h-9 pl-9 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary w-64 placeholder:text-on-surface-variant/60 border border-surface-container"
                placeholder="Filter by plot, op ID or chemical..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="p-2 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-sm transition-colors"
              title="Refresh Telemetry"
              type="button"
              onClick={() => {
                showScreenToast("Telemetry refreshed: 12,410 SQLite records synced.");
              }}
            >
              <Icon name="cached" className="text-base" />
            </button>
          </div>
        </div>

        {/* 1. TIMELINE & GANTT VIEW */}
        {viewMode === "gantt" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Agronomic Timeline &amp; Gantt Dispatch
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Integrated 7-day schedule with weather rain probability overlay and machine allocations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container text-label-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Weather Guardrails Active
                </span>
              </div>
            </div>

            {/* Gantt Timeline Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[850px] space-y-3">
                {/* Header dates with weather badges */}
                <div className="grid grid-cols-12 gap-2 pb-2 border-b border-surface-container text-center font-label-sm text-label-sm">
                  <div className="col-span-4 text-left font-bold text-on-surface pl-2">Operation &amp; Plot</div>
                  {weatherDays.map((wd, i) => (
                    <div key={i} className="col-span-1 flex flex-col items-center">
                      <span className="font-bold text-on-surface">{wd.day}</span>
                      <span className="text-[11px] text-on-surface-variant">{wd.high}</span>
                      <span className={`text-[10px] px-1 rounded ${wd.safe === "HAZARD" ? "bg-error text-on-error font-bold" : "text-secondary"}`}>
                        {wd.rain}
                      </span>
                    </div>
                  ))}
                  <div className="col-span-1 font-bold text-on-surface">Status</div>
                </div>

                {/* Operations Gantt Bars */}
                {filteredOps.map((op, idx) => {
                  const startCol = (idx % 4) + 1;
                  const span = idx % 2 === 0 ? 3 : 2;
                  const isRainBlocked = op.status === "weather_hold";
                  return (
                    <div key={op.id} className="grid grid-cols-12 gap-2 items-center py-2 hover:bg-surface-container-low rounded-lg transition-colors">
                      <div className="col-span-4 pl-2">
                        <div className="font-bold text-body-md text-on-surface truncate">{op.activity}</div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1">
                          <span>{op.plot}</span> • <span className="text-secondary font-mono">{op.opCode}</span>
                        </div>
                      </div>
                      <div className="col-span-7 relative h-9 bg-surface-container-low rounded-lg overflow-hidden flex items-center px-1">
                        <div
                          className={`h-7 rounded-md flex items-center px-2 text-xs font-semibold shadow-sm transition-all ${
                            isRainBlocked
                              ? "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary"
                              : op.status === "completed"
                              ? "bg-secondary text-on-secondary"
                              : "bg-primary text-on-primary"
                          }`}
                          style={{
                            marginLeft: `${(startCol - 1) * 14.28}%`,
                            width: `${span * 14.28}%`,
                          }}
                        >
                          <span className="truncate">{op.crew.split("•")[0]}</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${op.statusBadgeClass}`}>
                          {op.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. KANBAN BOARD VIEW */}
        {viewMode === "kanban" && (
          <div className="space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Field Operations Kanban Board
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Interactive stage progression: advance field tasks or shift to weather holds
                </p>
              </div>
              <div className="text-body-sm text-on-surface-variant">
                Showing {filteredOps.length} cards across 4 execution stages
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
              {/* Ready / Scheduled */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <h3 className="font-label-md text-label-md font-bold text-on-surface">Scheduled &amp; Ready</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-xs font-bold">
                    {filteredOps.filter((o) => o.status === "ready").length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {filteredOps
                    .filter((o) => o.status === "ready")
                    .map((op) => (
                      <div key={op.id} className="p-3 bg-surface-container-low rounded-lg space-y-2 shadow-sm border border-outline-variant/20">
                        <div className="flex items-start justify-between">
                          <span className="text-[11px] font-mono text-secondary font-bold">{op.opCode}</span>
                          <span className="text-[10px] uppercase font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                            {op.dueWindow}
                          </span>
                        </div>
                        <h4 className="font-bold text-body-md text-on-surface">{op.activity}</h4>
                        <div className="text-xs text-on-surface-variant">{op.plot}</div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1">
                          <Icon name="person" className="text-xs text-secondary" />
                          <span>{op.crew}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-surface-container/60">
                          <button
                            type="button"
                            onClick={() => moveKanbanTask(op.id, "weather_hold")}
                            className="text-[11px] font-semibold text-tertiary hover:underline"
                          >
                            Hold for Rain
                          </button>
                          <button
                            type="button"
                            onClick={() => moveKanbanTask(op.id, "in_progress")}
                            className="px-2 py-1 bg-primary text-on-primary rounded text-xs font-semibold hover:bg-primary-container"
                          >
                            Start &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* In Progress / Dispatched */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <h3 className="font-label-md text-label-md font-bold text-on-surface">In Progress &amp; GPS Dispatched</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-xs font-bold">
                    {filteredOps.filter((o) => o.status === "in_progress" || o.status === "gps_dispatched").length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {filteredOps
                    .filter((o) => o.status === "in_progress" || o.status === "gps_dispatched")
                    .map((op) => (
                      <div key={op.id} className="p-3 bg-surface-container-low rounded-lg space-y-2 shadow-sm border border-outline-variant/20">
                        <div className="flex items-start justify-between">
                          <span className="text-[11px] font-mono text-secondary font-bold">{op.opCode}</span>
                          <span className="text-[10px] uppercase font-bold text-secondary bg-secondary-container px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        </div>
                        <h4 className="font-bold text-body-md text-on-surface">{op.activity}</h4>
                        <div className="text-xs text-on-surface-variant">{op.plot}</div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1">
                          <Icon name="groups" className="text-xs text-secondary" />
                          <span>{op.crew}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-surface-container/60">
                          <button
                            type="button"
                            onClick={() => moveKanbanTask(op.id, "ready")}
                            className="text-[11px] font-semibold text-on-surface-variant hover:underline"
                          >
                            &larr; Back
                          </button>
                          <button
                            type="button"
                            onClick={() => moveKanbanTask(op.id, "completed")}
                            className="px-2 py-1 bg-secondary text-on-secondary rounded text-xs font-semibold hover:bg-primary"
                          >
                            Verify &amp; Done &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Weather Hold / Alert */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                    <h3 className="font-label-md text-label-md font-bold text-on-surface">Weather Guardrail Holds</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold">
                    {filteredOps.filter((o) => o.status === "weather_hold").length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {filteredOps
                    .filter((o) => o.status === "weather_hold")
                    .map((op) => (
                      <div key={op.id} className="p-3 bg-tertiary-fixed/20 rounded-lg space-y-2 shadow-sm border border-tertiary/40">
                        <div className="flex items-start justify-between">
                          <span className="text-[11px] font-mono text-tertiary font-bold">{op.opCode}</span>
                          <span className="text-[10px] uppercase font-bold text-on-tertiary-fixed bg-tertiary-fixed px-1.5 py-0.5 rounded">
                            Delayed
                          </span>
                        </div>
                        <h4 className="font-bold text-body-md text-on-surface">{op.activity}</h4>
                        <div className="text-xs text-error font-semibold flex items-center gap-1">
                          <Icon name="thunderstorm" className="text-xs" />
                          <span>{op.dueDetail}</span>
                        </div>
                        <div className="text-xs text-on-surface-variant">{op.resources}</div>
                        <div className="flex items-center justify-end pt-2 border-t border-surface-container/60">
                          <button
                            type="button"
                            onClick={() => moveKanbanTask(op.id, "ready")}
                            className="px-2 py-1 bg-surface-container text-on-surface rounded text-xs font-semibold hover:bg-surface-container-high"
                          >
                            Release Hold &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Completed / Verified */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                    <h3 className="font-label-md text-label-md font-bold text-on-surface">Completed &amp; Signed Off</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                    {filteredOps.filter((o) => o.status === "completed" || o.status === "vet_confirmed").length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {filteredOps
                    .filter((o) => o.status === "completed" || o.status === "vet_confirmed")
                    .map((op) => (
                      <div key={op.id} className="p-3 bg-surface-container-low rounded-lg space-y-2 shadow-sm border border-outline-variant/20 opacity-90">
                        <div className="flex items-start justify-between">
                          <span className="text-[11px] font-mono text-secondary font-bold">{op.opCode}</span>
                          <span className="text-[10px] uppercase font-bold text-on-secondary-container bg-secondary-container px-1.5 py-0.5 rounded">
                            Archived
                          </span>
                        </div>
                        <h4 className="font-bold text-body-md text-on-surface line-through text-on-surface-variant">{op.activity}</h4>
                        <div className="text-xs text-on-surface-variant">{op.plot}</div>
                        <div className="text-xs text-secondary font-medium flex items-center gap-1">
                          <Icon name="check_circle" className="text-xs" />
                          <span>Signed off with GPS RTK anchor</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. FIELD MAP TELEMETRY VIEW */}
        {viewMode === "map" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Cadastral Field Map &amp; Real-Time Telemetry
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Interactive multi-plot spatial monitoring with live IoT soil probes, machinery CANBUS GPS, and crew geofences
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-mono text-xs font-bold">
                  RTK Precision: &plusmn;2.5cm
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
              {/* SVG Cadastral Map */}
              <div className="lg:col-span-8 bg-surface-container rounded-xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[420px]">
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 bg-surface-container-lowest/90 px-3 py-1 rounded-lg shadow-sm">
                    <Icon name="layers" className="text-primary text-sm" />
                    <span className="text-xs font-bold text-on-surface">Savanna Cluster Farm Map (28.5 Ha Total)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container-lowest/90 px-3 py-1 rounded-lg shadow-sm text-xs text-on-surface-variant">
                    <span>Sentinel-2 L2A Ortho Overlay</span>
                  </div>
                </div>

                {/* SVG Visual Parcel Grid */}
                <svg viewBox="0 0 800 450" className="w-full h-full my-4 drop-shadow-md">
                  <rect width="800" height="450" fill="#e8eee5" rx="8" />

                  {/* Roadways / Irrigation canals */}
                  <line x1="0" y1="220" x2="800" y2="220" stroke="#c2cfbe" strokeWidth="12" />
                  <line x1="400" y1="0" x2="400" y2="450" stroke="#89b4d8" strokeWidth="8" strokeDasharray="6,4" />

                  {/* Plot A1 (Maize) */}
                  <g
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => {
                      setSelectedMapPlot("plot-a1");
                      showScreenToast("Selected Plot A1: 9.0 Ha Maize DMR-LSR-Y.");
                    }}
                  >
                    <rect
                      x="30"
                      y="30"
                      width="340"
                      height="170"
                      rx="6"
                      fill={selectedMapPlot === "plot-a1" ? "#2d6a4f" : "#40916c"}
                      stroke="#1b4332"
                      strokeWidth={selectedMapPlot === "plot-a1" ? "3" : "1"}
                    />
                    <text x="50" y="70" fill="#ffffff" fontWeight="bold" fontSize="16">Plot A1 • 9.0 Ha Maize</text>
                    <text x="50" y="95" fill="#d8f3dc" fontSize="12">NDVI: 0.78 (Optimal) | Soil VWC: 19%</text>
                    <circle cx="280" cy="110" r="10" fill="#f4a261" stroke="#ffffff" strokeWidth="2" />
                    <text x="296" y="114" fill="#ffffff" fontSize="11" fontWeight="bold">JD 5075E Tractor (Active)</text>
                  </g>

                  {/* Plot A2 (Grain Staging) */}
                  <g
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => {
                      setSelectedMapPlot("plot-a2");
                      showScreenToast("Selected Plot A2: 9.0 Ha Maize Top-Dressing.");
                    }}
                  >
                    <rect
                      x="430"
                      y="30"
                      width="340"
                      height="170"
                      rx="6"
                      fill={selectedMapPlot === "plot-a2" ? "#2d6a4f" : "#52b788"}
                      stroke="#1b4332"
                      strokeWidth={selectedMapPlot === "plot-a2" ? "3" : "1"}
                    />
                    <text x="450" y="70" fill="#ffffff" fontWeight="bold" fontSize="16">Plot A2 • 9.0 Ha Grain</text>
                    <text x="450" y="95" fill="#d8f3dc" fontSize="12">Split-N Scheduled Friday • Crew B</text>
                  </g>

                  {/* Plot B1 (Tomato Roma VF) */}
                  <g
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => {
                      setSelectedMapPlot("plot-b1");
                      showScreenToast("Selected Plot B1: 6.5 Ha Tomato Roma VF.");
                    }}
                  >
                    <rect
                      x="30"
                      y="250"
                      width="340"
                      height="170"
                      rx="6"
                      fill={selectedMapPlot === "plot-b1" ? "#b02a37" : "#d9534f"}
                      stroke="#842029"
                      strokeWidth={selectedMapPlot === "plot-b1" ? "3" : "1"}
                    />
                    <text x="50" y="290" fill="#ffffff" fontWeight="bold" fontSize="16">Plot B1 • 6.5 Ha Tomato</text>
                    <text x="50" y="315" fill="#f8d7da" fontSize="12">Weather Hold: Mancozeb Fungicide Pause</text>
                  </g>

                  {/* Aquaculture Ponds & Poultry */}
                  <g
                    className="cursor-pointer transition-all hover:opacity-90"
                    onClick={() => {
                      setSelectedMapPlot("plot-aqua");
                      showScreenToast("Selected Intensive Unit: Catfish Pond P2 & Broiler House 1.");
                    }}
                  >
                    <rect
                      x="430"
                      y="250"
                      width="340"
                      height="170"
                      rx="6"
                      fill={selectedMapPlot === "plot-aqua" ? "#1d4e89" : "#3b82f6"}
                      stroke="#1e3a8a"
                      strokeWidth={selectedMapPlot === "plot-aqua" ? "3" : "1"}
                    />
                    <text x="450" y="290" fill="#ffffff" fontWeight="bold" fontSize="16">Aquaculture P2 &amp; Poultry B4</text>
                    <text x="450" y="315" fill="#dbeafe" fontSize="12">DO: 6.1 mg/L • Broilers: Day 21 (1,250 Birds)</text>
                  </g>
                </svg>

                <div className="flex items-center justify-between text-xs text-on-surface-variant z-10 bg-surface-container-lowest/80 p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#40916c]" /> Maize Plots</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#d9534f]" /> Horticultural Row</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#3b82f6]" /> Intensive Livestock &amp; Fish</span>
                  </div>
                  <span>Click any parcel to inspect real-time sensor node</span>
                </div>
              </div>

              {/* Telemetry Sensor Node Sidebar */}
              <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-space-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <Icon name="sensors" className="text-secondary text-lg" />
                    <span className="font-label-md text-label-md font-bold text-on-surface">Node Telemetry Feed</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">
                    ONLINE
                  </span>
                </div>

                {selectedMapPlot === "plot-a1" && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-on-surface">Plot A1 - Maize Vegetative (9.0 Ha)</h4>
                      <p className="text-xs text-on-surface-variant">Zone 4A Clay Loam • Mesh Sensor #OY-ISE-SN01</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-surface-container-lowest rounded-lg">
                        <span className="text-on-surface-variant block">Soil Moisture (VWC)</span>
                        <strong className="text-base text-secondary">19.2%</strong>
                      </div>
                      <div className="p-2 bg-surface-container-lowest rounded-lg">
                        <span className="text-on-surface-variant block">NDVI Canopy</span>
                        <strong className="text-base text-secondary">0.78 Optimal</strong>
                      </div>
                      <div className="p-2 bg-surface-container-lowest rounded-lg">
                        <span className="text-on-surface-variant block">Soil Temperature</span>
                        <strong className="text-base text-on-surface">24.6°C</strong>
                      </div>
                      <div className="p-2 bg-surface-container-lowest rounded-lg">
                        <span className="text-on-surface-variant block">EC (Salinity)</span>
                        <strong className="text-base text-on-surface">0.82 dS/m</strong>
                      </div>
                    </div>
                    <div className="p-2 bg-surface-container-lowest rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-on-surface">Machinery In-Field:</div>
                      <div className="text-on-surface-variant">JD 5075E Tractor • Alhaji Kazeem Syndicate</div>
                      <div className="text-secondary font-medium">GPS Speed: 5.4 km/h • 50% Coverage Completed</div>
                    </div>
                  </div>
                )}

                {selectedMapPlot === "plot-b1" && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-on-surface">Plot B1 - Tomato Roma VF (6.5 Ha)</h4>
                      <p className="text-xs text-on-surface-variant">Flowering Stage • Sensor #OY-ISE-SN03</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-surface-container-lowest rounded-lg">
                        <span className="text-on-surface-variant block">Soil Moisture</span>
                        <strong className="text-base text-on-surface">26.1%</strong>
                      </div>
                      <div className="p-2 bg-surface-container-lowest rounded-lg">
                        <span className="text-on-surface-variant block">Canopy Leaf Wetness</span>
                        <strong className="text-base text-error">94% High</strong>
                      </div>
                    </div>
                    <div className="p-2 bg-error-container/40 rounded-lg text-xs text-error font-medium">
                      Alert: Foliar wash-off risk high. Postpone chemical spray application until dry front arrives Saturday.
                    </div>
                  </div>
                )}

                {(selectedMapPlot === "plot-a2" || selectedMapPlot === "plot-aqua") && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-on-surface">Intensive Enterprise Telemetry</h4>
                      <p className="text-xs text-on-surface-variant">Catfish Pond P2 &amp; Broiler House 1</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-surface-container-lowest rounded-lg">
                        <span className="text-on-surface-variant block">Dissolved Oxygen</span>
                        <strong className="text-base text-secondary">6.1 mg/L</strong>
                      </div>
                      <div className="p-2 bg-surface-container-lowest rounded-lg">
                        <span className="text-on-surface-variant block">Poultry Temp</span>
                        <strong className="text-base text-on-surface">28.4°C</strong>
                      </div>
                    </div>
                    <div className="p-2 bg-surface-container-lowest rounded-lg text-xs text-on-surface-variant">
                      Automatic solar aerator and tunnel ventilation running within normal guardrails.
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    showScreenToast("Telemetry raw packet exported to JSON.");
                  }}
                  className="w-full py-2 bg-surface-container text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container-high transition-colors text-center"
                >
                  Download Node Diagnostic Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. DAILY OPERATIONS ROSTER VIEW (Default Table View) */}
        {viewMode === "roster" &&
          slot(
            slots,
            "operations",
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-space-lg py-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest border-b border-surface-container">
                <div className="space-y-0.5">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Scheduled Operations Ledger</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Master Specification §3.4 Dispatch Pipeline • Auto-enforced Agronomic Windows</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Batch Action:</span>
                  <select
                    className="h-8 px-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm focus:outline-none cursor-pointer"
                    value={batchAction}
                    onChange={(e) => setBatchAction(e.target.value)}
                  >
                    <option value="verify">Bulk Mark Verified</option>
                    <option value="reschedule">Reschedule +24 Hours</option>
                    <option value="sms">Trigger SMS Alert to Operators</option>
                  </select>
                  <button
                    className="px-3 py-1 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container"
                    type="button"
                    onClick={handleExecuteBatchAction}
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead className="bg-surface-container-high text-on-surface-variant uppercase tracking-wider font-label-sm text-label-sm">
                    <tr>
                      <th className="py-3 px-space-md w-12 text-center">
                        <input
                          className="rounded text-primary focus:ring-0 cursor-pointer"
                          type="checkbox"
                          checked={selectedIds.length === filteredOps.length && filteredOps.length > 0}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th className="py-3 px-space-md font-semibold">Operation ID &amp; Activity</th>
                      <th className="py-3 px-space-md font-semibold">Enterprise / Field</th>
                      <th className="py-3 px-space-md font-semibold">Agronomic Window</th>
                      <th className="py-3 px-space-md font-semibold">Resources &amp; Input Staging</th>
                      <th className="py-3 px-space-md font-semibold">Execution Status</th>
                      <th className="py-3 px-space-md text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredOps.map((op) => (
                      <tr key={op.id} className="hover:bg-surface-container-low transition-colors bg-surface-container-lowest">
                        <td className="py-space-md px-space-md text-center">
                          <input
                            className="rounded text-primary focus:ring-0 cursor-pointer"
                            type="checkbox"
                            checked={selectedIds.includes(op.id)}
                            onChange={() => handleToggleSelectRow(op.id)}
                          />
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm font-mono text-secondary font-bold">{op.opCode}</span>
                            <span className="font-headline-sm text-body-lg font-bold text-on-surface mt-0.5">{op.activity}</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Method: {op.method}</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">{op.plot}</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">{op.enterprise}</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-secondary font-semibold">{op.dueWindow}</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">{op.dueDetail}</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center gap-1.5 text-on-surface font-medium">
                              <Icon name="check_circle" className="text-sm text-secondary" />
                              <span>{op.resources}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-on-surface-variant text-label-sm font-label-sm">
                              <Icon name="groups" className="text-sm" />
                              <span>{op.crew}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${op.statusBadgeClass}`}>
                            <span className="w-2 h-2 rounded-full bg-current" /> {op.statusText}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <button
                            className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm"
                            type="button"
                            onClick={() => {
                              setOperations(
                                operations.map((o) =>
                                  o.id === op.id ? { ...o, status: "completed", statusText: "Completed & GPS Logged" } : o
                                )
                              );
                              showScreenToast(`Operation ${op.opCode} logged as completed with GPS RTK anchor.`);
                            }}
                          >
                            {op.status === "completed" ? "Completed" : "Log Completion & GPS"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-space-lg py-space-sm bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant border-t border-surface-container">
                <span>Displaying {filteredOps.length} operations for Early Rains Season 2026</span>
                <div className="flex items-center gap-space-xs">
                  <button
                    className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface shadow-sm disabled:opacity-50"
                    disabled
                    type="button"
                    onClick={() => {
                      showScreenToast("Already on the first page of operations.");
                    }}
                  >
                    Previous
                  </button>
                  <span className="px-2 font-semibold text-primary">Page 1 of 1</span>
                  <button
                    className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-high"
                    type="button"
                    onClick={() => {
                      showScreenToast("All operations loaded on active page.");
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* 7-DAY WEATHER RISK & LABOUR/MACHINERY ROSTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Live Weather Forecast Card */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between space-y-space-md">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-sm border-b border-surface-container">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">
                    {weatherData?.ok ? "Open-Meteo & NiMet Agro-Meteorology" : "NiMet & ECMWF Agro-Meteorology"}
                  </span>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">7-Day Operations Risk Forecast</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
                  <Icon name="wb_sunny" className="text-sm text-secondary" />
                  <span>
                    {pilotForecast ? `${pilotForecast.place.town} Cluster Station (${pilotForecast.place.state})` : "Iseyin Cluster Station (Lat 7.96° N)"}
                  </span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                Predictive operational windows for tractor traction, chemical foliar spray, and fertilizer wash-off prevention.
              </p>
            </div>

            {/* 7 Day forecast strip */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {weatherDays.map((w, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center p-2 rounded-lg space-y-2 text-center transition-all ${
                    w.safe === "HAZARD" ? "bg-error-container/40 ring-1 ring-error" : "bg-surface-container-low hover:bg-surface-container"
                  }`}
                >
                  <span className={`font-label-sm text-label-sm font-semibold ${w.safe === "HAZARD" ? "text-error" : "text-on-surface"}`}>{w.day}</span>
                  <Icon name={w.icon as any} className={`text-xl ${w.safe === "HAZARD" ? "text-error" : "text-secondary"}`} />
                  <div className="space-y-0.5">
                    <span className="font-label-md text-label-md font-bold text-on-surface">{w.high}</span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant">{w.low}</span>
                  </div>
                  <div className="w-full pt-1 space-y-1">
                    <span className={`block font-label-sm text-label-sm font-mono ${w.safe === "HAZARD" ? "font-bold text-error" : "text-secondary"}`}>{w.rain}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${w.safeBg}`}>{w.safe}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-space-md rounded-lg bg-surface-container-low flex items-start gap-space-sm mt-space-sm">
              <Icon name="info" className="text-tertiary text-xl flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-body-sm font-body-sm">
                <span className="font-semibold text-on-surface">Agronomist Recommendation for Weather Front:</span>
                <p className="text-on-surface-variant">
                  {activeWeatherHazard
                    ? `Do not mobilize foliar herbicides or Mancozeb on ${activeWeatherHazard.day} due to ${activeWeatherHazard.rain} rainfall forecast causing chemical wash-off into irrigation channels. Dry days provide prime canopy conditions.`
                    : "No imminent hazardous rainfront detected for the 7-day window. Field soil moisture and canopy conditions remain prime for weeding, fertilizer top-dressing, and tractor tillage."}
                </p>
              </div>
            </div>
          </div>

          {/* Labour & Machinery Roster Card */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between space-y-space-md">
            <div>
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
                <div>
                  <span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider">Field Personnel &amp; Rates</span>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">Labour &amp; Machinery Roster</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono font-bold text-label-sm">₦3,500 / Day</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                Daily casual workforce attendance, geofence sign-in, and escrow payroll staging.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-label-md">AO</div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-on-surface">Adeleke O. (Crew B Lead)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Plot A1 • 6 Hands • Checked in 06:45 WAT</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-md text-label-md font-mono font-bold text-secondary">₦21,000</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">GPS Verified</span>
                </div>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-md">BG</div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-on-surface">Babatunde Gbadamosi</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Tractor Operator (JD 5075E) • Plot A1</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-md text-label-md font-mono font-bold text-on-surface">₦45,000 / Day</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Syndicate Escrow</span>
                </div>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-label-md">TY</div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-on-surface">Tawa Yusuf (Crew A Lead)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Plot B1 • 6 Hands • Checked in 07:10 WAT</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-md text-label-md font-mono font-bold text-secondary">₦21,000</span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">GPS Verified</span>
                </div>
              </div>
            </div>

            <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between text-body-sm font-body-sm">
              <div className="flex items-center gap-2">
                <Icon name="payments" className="text-primary text-base" />
                <span className="font-medium text-on-surface">Today&apos;s Estimated Daily Wage Total:</span>
              </div>
              <span className="font-label-lg text-label-lg font-mono font-bold text-primary">₦87,000.00</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                className="font-label-sm text-label-sm text-secondary font-bold hover:underline flex items-center gap-1"
                type="button"
                onClick={() => {
                  showScreenToast("Workforce geofencing active: Plot A1 and B1 bounds locked to 15 GPS beacons.");
                }}
              >
                <span>Manage Workforce Geofencing</span>
                <Icon name="arrow_forward" className="text-xs" />
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-bold shadow-sm hover:bg-primary transition-colors"
                type="button"
                onClick={() => {
                  setPayrollReconciled(true);
                  showScreenToast("Daily labour wage of ₦87,000 reconciled and transferred via Zenith Escrow API.");
                }}
              >
                {payrollReconciled ? "Signed Off (₦87k Released)" : "Reconcile & Sign Off"}
              </button>
            </div>
          </div>
        </div>

        {/* 3 Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="satellite" className="text-secondary" />
                <span className="font-label-md text-label-md font-bold text-on-surface">Plot A1 Canopy NDVI</span>
              </div>
              <span className="font-mono text-label-sm font-bold text-secondary">0.78 (Optimal)</span>
            </div>
            <div className="w-full h-32 rounded-lg bg-surface-container overflow-hidden relative">
              <img className="w-full h-full object-cover" data-alt="Satellite imagery" src="/images/screens/a56a24c12a3c.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute bottom-2 left-2 bg-primary/90 text-on-primary px-2 py-0.5 rounded text-[10px] font-mono">NDVI Scan #2026-03</div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Vegetative V6 Growth Index</span>
              <span className="text-on-surface font-semibold">+14.2% vs 2025</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="local_shipping" className="text-primary" />
                <span className="font-label-md text-label-md font-bold text-on-surface">JD 5075E Telematics</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">CANBUS LINK</span>
            </div>
            <div className="w-full h-32 rounded-lg bg-surface-container overflow-hidden relative">
              <img className="w-full h-full object-cover" data-alt="Heavy green tractor" src="/images/screens/9fe0feab9c6c.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute top-2 right-2 bg-surface-container-lowest/95 px-2 py-0.5 rounded shadow text-[10px] font-mono font-bold text-on-surface">Speed: 5.4 km/h</div>
              <div className="absolute bottom-2 left-2 bg-primary/90 text-on-primary px-2 py-0.5 rounded text-[10px] font-mono">Fuel: 78% • 1,420 RPM</div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Coverage: 4.5 / 9.0 Ha Completed</span>
              <span className="text-secondary font-bold">50% Complete</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="thermostat" className="text-secondary" />
                <span className="font-label-md text-label-md font-bold text-on-surface">Poultry House 1 Microclimate</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono text-[10px] font-bold">NORMAL</span>
            </div>
            <div className="w-full h-32 rounded-lg bg-surface-container overflow-hidden relative">
              <img className="w-full h-full object-cover" data-alt="Poultry house" src="/images/screens/4815cc9e8dc1.webp" alt="" loading="lazy" decoding="async" />
              <div className="absolute top-2 left-2 bg-surface-container-lowest/95 px-2 py-0.5 rounded shadow text-[10px] font-mono font-bold text-on-surface">Temp: 28.4°C | RH: 64%</div>
              <div className="absolute bottom-2 left-2 bg-primary/90 text-on-primary px-2 py-0.5 rounded text-[10px] font-mono">Ammonia: &lt; 10 ppm</div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Mortality Rate: 0.08% (Target &lt; 0.5%)</span>
              <span className="text-secondary font-bold">Grade A Flock</span>
            </div>
          </div>
        </div>

        {/* Audit Log Anchor Footer */}
        <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col sm:flex-row items-center justify-between gap-space-sm text-body-sm font-body-sm text-on-surface-variant">
          <div className="flex items-center gap-space-sm">
            <Icon name="verified_user" className="text-secondary" />
            <span>All field activities cryptographically stamped with GPS lat/long &amp; local timestamps for Agro-Syndicate escrow release.</span>
          </div>
          <div className="flex items-center gap-space-md font-label-sm text-label-sm">
            <span className="text-on-surface font-semibold">Mesh Hash: 8f9a..4b1c</span>
            <button
              className="text-secondary font-bold hover:underline"
              type="button"
              onClick={() => {
                downloadFile(
                  "field-operations-audit-anchor.json",
                  JSON.stringify(
                    {
                      meshNode: "OY-ISE-04",
                      session: "Early Rains 2026",
                      merkleRoot: "0x8f9a4b1ce0094192",
                      recordsCount: operations.length,
                      powerSyncSyncTime: "14:02:11 WAT",
                    },
                    null,
                    2
                  ),
                  "application/json"
                );
                showScreenToast("Field operations cryptographic audit anchor exported (JSON).");
              }}
            >
              View Audit Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
