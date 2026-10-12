"use client";

// Ported from the "machinery_telemetry_fleet_tracking_8.6_19" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface TelemetryRow {
  unitId: string;
  name: string;
  model: string;
  category: "tractor" | "harvester" | "transporter";
  hp: string;
  serial: string;
  operator: string;
  field: string;
  task: string;
  rpm: number;
  coolant: string;
  oil: string;
  load: string;
  fuelPct: number;
  speed: string;
  workedHa: number;
  targetHa: number;
  powStatus: string;
  healthState: string;
  healthBadgeClass: string;
}

const FLEET_TELEMETRY: TelemetryRow[] = [
  {
    unitId: "TR-01",
    name: "#TR-01 · MF 375",
    model: "Massey Ferguson 375 4WD",
    category: "tractor",
    hp: "75 HP",
    serial: "MF-2023-9081",
    operator: "Jimoh Rasaq",
    field: "Oke-Ogun Plot 14",
    task: "Secondary Harrowing · Sector B",
    rpm: 1850,
    coolant: "88°C",
    oil: "4.2 bar",
    load: "76%",
    fuelPct: 74,
    speed: "6.8 km/h",
    workedHa: 18.5,
    targetHa: 24.0,
    powStatus: "100% PoW Matched",
    healthState: "Nominal",
    healthBadgeClass: "bg-secondary-fixed text-on-secondary-fixed",
  },
  {
    unitId: "TR-04",
    name: "#TR-04 · JD 5075E",
    model: "John Deere 5075E",
    category: "tractor",
    hp: "75 HP",
    serial: "JD-2024-4412",
    operator: "Taofeeq Adeleke",
    field: "Egba Sector 3",
    task: "Contour Ridging · Zone D",
    rpm: 1920,
    coolant: "91°C",
    oil: "4.0 bar",
    load: "81%",
    fuelPct: 62,
    speed: "7.1 km/h",
    workedHa: 22.4,
    targetHa: 25.0,
    powStatus: "100% PoW Matched",
    healthState: "Due in 18h",
    healthBadgeClass: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
  {
    unitId: "TR-03",
    name: "#TR-03 · Case IH Farmall",
    model: "Case IH Farmall 80JX",
    category: "tractor",
    hp: "80 HP",
    serial: "CIH-2022-1082",
    operator: "Abiodun Kolade",
    field: "Iseyin East Basin",
    task: "Deep Ripping · Sub-Field 02",
    rpm: 1780,
    coolant: "86°C",
    oil: "3.8 bar",
    load: "72%",
    fuelPct: 58,
    speed: "6.2 km/h",
    workedHa: 14.1,
    targetHa: 18.0,
    powStatus: "100% PoW Matched",
    healthState: "Air Filter Adv.",
    healthBadgeClass: "bg-tertiary-fixed text-on-tertiary-fixed",
  },
  {
    unitId: "CH-02",
    name: "#CH-02 · NH TC5.30",
    model: "New Holland TC5.30",
    category: "harvester",
    hp: "175 HP",
    serial: "NH-2023-5510",
    operator: "Mufutau Balogun",
    field: "Shaki Grain Valley",
    task: "Sorghum Harvest · Block 08",
    rpm: 2100,
    coolant: "89°C",
    oil: "4.1 bar",
    load: "84%",
    fuelPct: 82,
    speed: "4.8 km/h",
    workedHa: 31.2,
    targetHa: 38.0,
    powStatus: "100% PoW Matched",
    healthState: "Nominal",
    healthBadgeClass: "bg-secondary-fixed text-on-secondary-fixed",
  },
  {
    unitId: "LB-01",
    name: "#LB-01 · Steyr 8x4",
    model: "Steyr Heavy Low-Bed Carrier",
    category: "transporter",
    hp: "420 HP",
    serial: "STY-2021-3004",
    operator: "Kehinde Olatunji",
    field: "Sagamu - Iseyin Arterial",
    task: "Implements Haulage Transit",
    rpm: 1420,
    coolant: "84°C",
    oil: "4.6 bar",
    load: "62%",
    fuelPct: 91,
    speed: "54 km/h",
    workedHa: 0,
    targetHa: 0,
    powStatus: "Corridor Compliant",
    healthState: "In Transit",
    healthBadgeClass: "bg-secondary-fixed text-on-secondary-fixed",
  },
];

export function MachineryTelemetry(_props: ScreenProps) {
  const [filterCategory, setFilterCategory] = useState<"all" | "tractor" | "harvester" | "transporter">("all");
  const [page, setPage] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<TelemetryRow | null>(null);
  const [showMechanicModal, setShowMechanicModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showServicePackModal, setShowServicePackModal] = useState(false);

  // Mechanic Dispatch Form State
  const [mechanicForm, setMechanicForm] = useState({
    unitId: "#TR-03",
    depot: "Iseyin Central Depot 01",
    issueType: "Air Filter Differential (SPN 107 FMI 0)",
    urgency: "Scheduled (within 12h)",
    technician: "Lead Tech: Babatunde Adeleke",
  });

  const filteredUnits = FLEET_TELEMETRY.filter((row) => {
    if (filterCategory === "all") return true;
    return row.category === filterCategory;
  });

  const handleExportCSV = () => {
    const headers = "Unit ID,Model,Category,Operator,Cadastral Field,Task,RPM,Coolant,Oil Pressure,Engine Load,Fuel %,Speed,Worked Ha,Target Ha,PoW Status,Health State\n";
    const rows = FLEET_TELEMETRY.map((u) =>
      `"${u.unitId}","${u.model}","${u.category}","${u.operator}","${u.field}","${u.task}",${u.rpm},"${u.coolant}","${u.oil}","${u.load}",${u.fuelPct},"${u.speed}",${u.workedHa},${u.targetHa},"${u.powStatus}","${u.healthState}"`
    ).join("\n");

    downloadFile("cultivanode-machinery-telemetry.csv", headers + rows, "text/csv");
    showScreenToast("Exported live CAN-bus telemetry log for all 24 registered machinery units.");
  };

  const handleDispatchMechanic = (e: React.FormEvent) => {
    e.preventDefault();
    const dispatchRef = "MECH-DISP-" + Math.floor(1000 + Math.random() * 9000);
    showScreenToast(`Mobile workshop van mobilized for ${mechanicForm.unitId} from ${mechanicForm.depot}. Ref: ${dispatchRef}`);
    setShowMechanicModal(false);
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> CAN-bus &amp; GPS Telematics Online
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                <Icon name="wifi_tethering" className="text-[16px] text-secondary" /> Latency: 8s · Starlink Hub + 4G LTE-M Dual Node
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                <Icon name="satellite_alt" className="text-[16px] text-primary" /> RTK GNSS: Sub-Meter Precision Active
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Machinery Telemetry &amp; Fleet Tracking (§8.6 &amp; §19)</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Real-time telemetry command for 24 heavy units across Iseyin, Saki &amp; Eruwa agricultural clusters with verified proof-of-work (PoW) hectarage.</p>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap self-start md:self-center">
            <button
              onClick={handleExportCSV}
              className="px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center gap-2 transition-colors cursor-pointer"
              type="button"
            >
              <Icon name="download" className="text-[18px]" /> Export Telemetry (.CSV)
            </button>
            <button
              onClick={() => setShowMechanicModal(true)}
              className="px-space-md py-2.5 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-lg text-label-lg flex items-center gap-2 transition-colors cursor-pointer"
              type="button"
            >
              <Icon name="handyman" className="text-[18px]" /> Dispatch Mobile Mechanic
            </button>
            <button
              onClick={() => setShowMapModal(true)}
              className="px-space-md py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              type="button"
            >
              <Icon name="share_location" className="text-[18px]" /> Live Geofence Map View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
          <div
            onClick={() => {
              setFilterCategory("tractor");
              showScreenToast("Filtering by Active Tractors (16 Units).");
            }}
            className="p-space-md bg-surface-container-lowest rounded-xl flex items-center gap-space-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-primary-container text-primary-fixed flex items-center justify-center shrink-0">
              <Icon name="agriculture" className="text-[24px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline truncate">Active Tractors</span>
              <span className="font-metric-num text-metric-num text-on-surface">16 <span className="font-body-sm text-body-sm text-on-surface-variant">/ 16 Online</span></span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">100% Operational</span>
            </div>
          </div>

          <div
            onClick={() => {
              setFilterCategory("harvester");
              showScreenToast("Filtering by Combine Harvesters (4 Units).");
            }}
            className="p-space-md bg-surface-container-lowest rounded-xl flex items-center gap-space-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
              <Icon name="grass" className="text-[24px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline truncate">Harvesters</span>
              <span className="font-metric-num text-metric-num text-on-surface">4 <span className="font-body-sm text-body-sm text-on-surface-variant">Units</span></span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">3 Active · 1 Staging</span>
            </div>
          </div>

          <div
            onClick={() => {
              setFilterCategory("transporter");
              showScreenToast("Filtering by Haulage & Low-Bed Transporters (4 Units).");
            }}
            className="p-space-md bg-surface-container-lowest rounded-xl flex items-center gap-space-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-surface-container text-on-surface flex items-center justify-center shrink-0">
              <Icon name="local_shipping" className="text-[24px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline truncate">Haulage &amp; Low-Bed</span>
              <span className="font-metric-num text-metric-num text-on-surface">4 <span className="font-body-sm text-body-sm text-on-surface-variant">Units</span></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">2 In Transit · 2 Standby</span>
            </div>
          </div>

          <div
            onClick={() => setShowServicePackModal(true)}
            className="p-space-md bg-surface-container-lowest rounded-xl flex items-center gap-space-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <Icon name="build_circle" className="text-[24px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline truncate">Depot Workshop</span>
              <span className="font-metric-num text-metric-num text-on-surface">2 <span className="font-body-sm text-body-sm text-on-surface-variant">Scheduled</span></span>
              <span className="font-label-sm text-label-sm text-tertiary-container font-semibold">500h Periodic Filter Maint</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-space-md">
          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Engine Cycle Hours</span>
              <Icon name="timer" className="text-[18px] text-primary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">2,840.5 <span className="text-body-sm font-normal text-on-surface-variant">hrs</span></div>
              <div className="flex items-center gap-1 text-secondary font-label-md text-label-md mt-1">
                <Icon name="trending_up" className="text-[14px]" /> +14.2% YoY Fleet Use
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary-container h-full rounded-full" style={{ width: "82%" }} />
            </div>
          </div>

          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">24h Area Worked</span>
              <Icon name="crop_square" className="text-[18px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">142.8 <span className="text-body-sm font-normal text-on-surface-variant">Ha</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Harrow 68 · Plant 44 · Ridge 31</div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: "91%" }} />
            </div>
          </div>

          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Fuel Burn Rate</span>
              <Icon name="local_gas_station" className="text-[18px] text-tertiary-container" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">3.42 <span className="text-body-sm font-normal text-on-surface-variant">L/Ha</span></div>
              <div className="flex items-center gap-1 text-secondary font-label-md text-label-md mt-1">
                <Icon name="arrow_downward" className="text-[14px]" /> -12.8% vs Manual Log
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: "74%" }} />
            </div>
          </div>

          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Field Speed &amp; Load</span>
              <Icon name="speed" className="text-[18px] text-outline" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">7.2 <span className="text-body-sm font-normal text-on-surface-variant">km/h</span></div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Load Factor: <span className="font-semibold text-on-surface">78% Tractive</span></div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "68%" }} />
            </div>
          </div>

          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Idle Time Ratio</span>
              <Icon name="hourglass_disabled" className="text-[18px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">8.4%</div>
              <div className="text-secondary font-label-md text-label-md mt-1">Well below 15% ceiling</div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary-fixed-dim h-full rounded-full" style={{ width: "42%" }} />
            </div>
          </div>

          <div className="p-space-md bg-surface-container-lowest rounded-xl flex flex-col justify-between shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Cadastral Compliance</span>
              <Icon name="verified_user" className="text-[18px] text-secondary" />
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">99.8%</div>
              <div className="font-body-sm text-body-sm text-secondary font-semibold mt-1">0 Breaches Logged</div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: "99.8%" }} />
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-low/40">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Icon name="radar" className="text-primary text-[22px]" />
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Real-Time Machinery Telematics &amp; Operator Roster</h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live CAN-bus diagnostic stream, verified hectare logs, and biometric operator check-ins.</p>
            </div>
            <div className="flex items-center gap-space-xs flex-wrap">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-1.5 font-label-md text-label-md rounded-lg cursor-pointer ${filterCategory === "all" ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container hover:bg-surface-container-high text-on-surface"}`}
                type="button"
              >
                All Units (24)
              </button>
              <button
                onClick={() => setFilterCategory("tractor")}
                className={`px-3 py-1.5 font-label-md text-label-md rounded-lg cursor-pointer ${filterCategory === "tractor" ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container hover:bg-surface-container-high text-on-surface"}`}
                type="button"
              >
                Tractors (16)
              </button>
              <button
                onClick={() => setFilterCategory("harvester")}
                className={`px-3 py-1.5 font-label-md text-label-md rounded-lg cursor-pointer ${filterCategory === "harvester" ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container hover:bg-surface-container-high text-on-surface"}`}
                type="button"
              >
                Harvesters (4)
              </button>
              <button
                onClick={() => setFilterCategory("transporter")}
                className={`px-3 py-1.5 font-label-md text-label-md rounded-lg cursor-pointer ${filterCategory === "transporter" ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container hover:bg-surface-container-high text-on-surface"}`}
                type="button"
              >
                Transporters (4)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-3 px-space-md">Machine / Unit ID</th>
                  <th className="py-3 px-space-md">Operator &amp; Biometrics</th>
                  <th className="py-3 px-space-md">Field / Cadastral Task</th>
                  <th className="py-3 px-space-md">CAN-bus Telemetry</th>
                  <th className="py-3 px-space-md">Fuel &amp; Speed</th>
                  <th className="py-3 px-space-md">Verified Area (PoW)</th>
                  <th className="py-3 px-space-md">Health State</th>
                  <th className="py-3 px-space-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y divide-surface-container-high/40">
                {filteredUnits.map((row) => (
                  <tr key={row.unitId} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-space-md">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
                          <Icon name={row.category === "harvester" ? "grass" : row.category === "transporter" ? "local_shipping" : "agriculture"} className="text-[20px]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">{row.name}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{row.hp} · SN: {row.serial}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface flex items-center gap-1">
                          {row.operator} <Icon name="verified" className="text-secondary text-[14px]" />
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary">Biometric Authenticated</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">{row.field}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{row.task}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs font-mono">
                        <span className="text-on-surface-variant">RPM: <strong className="text-on-surface">{row.rpm}</strong></span>
                        <span className="text-on-surface-variant">Coolant: <strong className="text-secondary">{row.coolant}</strong></span>
                        <span className="text-on-surface-variant">Oil: <strong className="text-on-surface">{row.oil}</strong></span>
                        <span className="text-on-surface-variant">Load: <strong className="text-on-surface">{row.load}</strong></span>
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md">
                      <div className="flex flex-col gap-1 w-28">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono text-on-surface">{row.fuelPct}% Tank</span>
                          <span className="text-secondary font-bold">{row.speed}</span>
                        </div>
                        <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full" style={{ width: `${row.fuelPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md">
                      <div className="flex flex-col gap-1">
                        {row.targetHa > 0 ? (
                          <>
                            <span className="font-semibold text-on-surface">{row.workedHa} / {row.targetHa} Ha</span>
                            <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                              <div className="bg-primary-container h-full rounded-full" style={{ width: `${Math.round((row.workedHa / row.targetHa) * 100)}%` }} />
                            </div>
                            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5">
                              <Icon name="gavel" className="text-[12px]" /> {row.powStatus}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-on-surface">{row.field}</span>
                            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5">
                              <Icon name="security" className="text-[12px]" /> {row.powStatus}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-space-md">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${row.healthBadgeClass} font-label-sm text-label-sm`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" /> {row.healthState}
                      </span>
                    </td>
                    <td className="py-3.5 px-space-md text-right">
                      <button
                        onClick={() => setSelectedUnit(row)}
                        className="p-1.5 hover:bg-surface-container rounded-lg text-primary transition-colors cursor-pointer"
                        title="Telemetry Inspector"
                        type="button"
                      >
                        <Icon name="query_stats" className="text-[18px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
            <div className="flex items-center gap-space-md flex-wrap">
              <span>Showing {filteredUnits.length} of 24 Units Logged</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-secondary">
                <Icon name="sync" className="text-[14px]" /> CAN-Bus Sync Frequency: 500ms
              </span>
              <span>•</span>
              <span>Cryptographic Hash: <code className="font-mono text-xs">0x8f2d...c3b9 (Polygon PoW Ledger)</code></span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                className="px-2.5 py-1 bg-surface-container-lowest text-on-surface rounded font-semibold shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
                type="button"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(1)}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${page === 1 ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface"}`}
                type="button"
              >
                1
              </button>
              <button
                onClick={() => {
                  setPage(2);
                  showScreenToast("Showing telemetry records page 2 (Units 6 to 12).");
                }}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${page === 2 ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface"}`}
                type="button"
              >
                2
              </button>
              <button
                onClick={() => setPage(2)}
                className="px-2.5 py-1 bg-surface-container-lowest text-on-surface rounded font-semibold shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-1 mb-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="verified_user" className="text-secondary text-[22px]" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Fuel Telematics &amp; Anti-Siphon Watchdog</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md font-semibold">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Zero Siphon Anomalies
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Continuous ultrasonic level sensor curve cross-referenced with engine load &amp; torque output.</p>
            </div>

            <div className="w-full bg-surface-container-low/50 rounded-lg p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Continuous Fuel Burn vs Engine Work Load (Last 12 Hours)</span>
                <span className="font-mono text-secondary font-semibold">Tolerance: ±0.05 L/Ha</span>
              </div>
              <div className="w-full h-40">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 140">
                  <line className="text-surface-container-high" stroke="currentColor" strokeDasharray="4" x1="0" x2="600" y1="30" y2="30" />
                  <line className="text-surface-container-high" stroke="currentColor" strokeDasharray="4" x1="0" x2="600" y1="70" y2="70" />
                  <line className="text-surface-container-high" stroke="currentColor" strokeDasharray="4" x1="0" x2="600" y1="110" y2="110" />
                  <path d="M 0,40 Q 80,48 150,55 T 300,75 T 450,88 T 600,105 L 600,140 L 0,140 Z" fill="rgba(0, 108, 73, 0.1)" />
                  <path d="M 0,40 Q 80,48 150,55 T 300,75 T 450,88 T 600,105" fill="none" stroke="#006c49" strokeLinecap="round" strokeWidth="3" />
                  <path d="M 0,70 L 40,50 L 90,85 L 140,40 L 190,45 L 240,65 L 290,38 L 340,52 L 390,70 L 440,35 L 490,48 L 540,60 L 600,50" fill="none" stroke="#ff9939" strokeLinecap="round" strokeWidth="2" />
                  <circle cx="150" cy="55" fill="#006c49" r="4" />
                  <circle cx="300" cy="75" fill="#006c49" r="4" />
                  <circle cx="450" cy="88" fill="#006c49" r="4" />
                </svg>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surface-container font-label-sm text-label-sm text-on-surface-variant">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-secondary rounded-full" /> Fuel Volume Remaining (L)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-on-tertiary-container rounded-full" /> Engine Load Dynamic (%)</span>
                </div>
                <span className="font-mono">Current Cluster Level: 4,120 L</span>
              </div>
            </div>

            <div className="mt-space-md p-space-md rounded-lg bg-surface-container flex items-start gap-space-md">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                <Icon name="security" className="text-[20px]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">Anti-Theft Guardian Protocol: Verified Nominal</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Active</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">No rapid fuel drops (&gt;3.0 L/min with ignition switch off) recorded in the last 48 hours across any registered tractor, combine, or low-bed diesel tank.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-1 mb-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="map" className="text-primary text-[22px]" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Cadastral Polygon Coverage</h3>
                </div>
                <span className="font-mono text-xs text-on-surface-variant">EPSG:4326 · UTM 31N</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live geofence breadcrumb trail corroborating implement pass lines.</p>
            </div>

            <div
              onClick={() => setShowMapModal(true)}
              className="relative w-full h-64 rounded-xl overflow-hidden bg-surface-container cursor-pointer group"
              data-alt="Satellite imagery map view of extensive agricultural fields in Oyo State Nigeria"
              data-location="Iseyin, Oyo State, Nigeria"
              style={{ backgroundImage: "url('/images/screens/442c1d15059d.webp')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent group-hover:from-primary/70 transition-colors" />
              <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                <span className="px-2.5 py-1 rounded bg-surface-container-lowest/90 backdrop-blur text-on-surface font-label-sm text-label-sm font-bold shadow-sm flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Oke-Ogun Hub
                </span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-on-primary">
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg font-bold">Plot 14 Cadastral Sector B</span>
                  <span className="font-label-sm text-label-sm text-primary-fixed">98.4% Track Overlap Accuracy (RTK)</span>
                </div>
                <div className="px-3 py-1 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">Pass 14 of 18</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-space-md pt-space-sm border-t border-surface-container text-center">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Perimeter Offset</span>
                <span className="font-label-lg text-label-lg font-bold text-on-surface">&lt; 15 cm</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Turning Headlands</span>
                <span className="font-label-lg text-label-lg font-bold text-secondary">Optimal</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Overlap Skip Rate</span>
                <span className="font-label-lg text-label-lg font-bold text-on-surface">1.2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="terminal" className="text-primary text-[20px]" />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">DTC Engine Diagnostics</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono text-xs">J1939 CAN</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live broadcast of SAE J1939 ECU fault codes and differential sensors.</p>
            </div>
            <div className="my-space-md flex flex-col gap-space-sm">
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-secondary text-[18px]" />
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">Critical Engine Faults (MIL)</span>
                </div>
                <span className="font-mono font-bold text-secondary text-sm">0 Active</span>
              </div>
              <div
                onClick={() => {
                  const tr03 = FLEET_TELEMETRY.find((u) => u.unitId === "TR-03");
                  if (tr03) setSelectedUnit(tr03);
                }}
                className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon name="warning" className="text-tertiary-container text-[18px]" />
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">Advisory DTC #TR-03</span>
                    <span className="font-mono text-xs text-outline">SPN 107 FMI 0 (Air Filter ΔP)</span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm font-semibold text-tertiary-container">Inspect Depot</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="thermostat" className="text-secondary text-[18px]" />
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">Transmission Temperature</span>
                </div>
                <span className="font-mono font-bold text-secondary text-sm">All &lt; 92°C</span>
              </div>
            </div>
            <div className="font-label-sm text-label-sm text-outline flex items-center gap-1">
              <Icon name="info" className="text-[14px]" /> Next automatic engine CAN scan scheduled in 4m 12s
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="hourglass_top" className="text-primary text-[20px]" />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">Maintenance Countdown</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">Depot 01</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Preventative service scheduling according to cumulative hour-meters.</p>
            </div>
            <div className="my-space-md p-space-md bg-surface-container-low rounded-lg flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg font-bold text-on-surface">#TR-04 (JD 5075E)</span>
                <span className="font-mono text-tertiary-container font-bold text-sm">18.5 hrs remaining</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary-container h-full rounded-full" style={{ width: "96%" }} />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">500-hour major service: Engine synthetic oil change, hydraulic high-pressure filter replacement, and tie-rod greasing.</p>
            </div>
            <div className="flex items-center justify-between pt-space-xs">
              <span className="font-label-sm text-label-sm text-outline">Service Bay 2 Assigned</span>
              <button
                onClick={() => setShowServicePackModal(true)}
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                type="button"
              >
                View Service Pack
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="military_tech" className="text-primary text-[20px]" />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">Operator Precision Index</h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">Top Quartile</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Engine conservation, headland turn smoothness &amp; idle minimization.</p>
            </div>
            <div className="my-space-md flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface">Speed Uniformity Index</span>
                <span className="font-label-md text-label-md font-bold text-secondary">94 / 100</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "94%" }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-body-sm text-body-sm text-on-surface">Headland Turning Technique</span>
                <span className="font-label-md text-label-md font-bold text-secondary">91 / 100</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "91%" }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-body-sm text-body-sm text-on-surface">Idle Minimization Compliance</span>
                <span className="font-label-md text-label-md font-bold text-secondary">96 / 100</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "96%" }} />
              </div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Cluster Leader: <strong className="text-on-surface">Jimoh Rasaq (96.4)</strong></span>
              <span className="text-secondary font-semibold">+₦18,500 Fuel Bonus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Inspector Modal */}
      {selectedUnit && (
        <ScreenDialog
          title={`CAN-bus Telemetry Inspector: ${selectedUnit.name}`}
          subtitle={`Unit SN: ${selectedUnit.serial} · Real-time ECU J1939 Diagnostics Stream`}
          onClose={() => setSelectedUnit(null)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                <div className="p-space-sm bg-surface-container-low rounded-xl">
                  <span className="text-on-surface-variant font-label-sm block">Engine RPM</span>
                  <span className="text-headline-sm font-bold text-primary font-mono">{selectedUnit.rpm}</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-xl">
                  <span className="text-on-surface-variant font-label-sm block">Coolant Temp</span>
                  <span className="text-headline-sm font-bold text-secondary font-mono">{selectedUnit.coolant}</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-xl">
                  <span className="text-on-surface-variant font-label-sm block">Oil Pressure</span>
                  <span className="text-headline-sm font-bold text-on-surface font-mono">{selectedUnit.oil}</span>
                </div>
                <div className="p-space-sm bg-surface-container-low rounded-xl">
                  <span className="text-on-surface-variant font-label-sm block">Fuel Tank Level</span>
                  <span className="text-headline-sm font-bold text-tertiary-container font-mono">{selectedUnit.fuelPct}%</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-container-high flex flex-col gap-2">
                <span className="font-label-md font-bold text-on-surface">Proof-of-Work Verification Summary</span>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Assigned Cadastral Polygon:</span>
                  <span className="font-semibold text-on-surface">{selectedUnit.field}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Operator In Command:</span>
                  <span className="font-semibold text-secondary">{selectedUnit.operator} (Biometric Verified)</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Hectares Executed:</span>
                  <span className="font-bold text-primary">{selectedUnit.workedHa} / {selectedUnit.targetHa} Ha</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Ground Velocity:</span>
                  <span className="font-mono text-on-surface">{selectedUnit.speed}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-space-xs">
                <button
                  onClick={() => {
                    showScreenToast(`CAN-bus snapshot packet captured for ${selectedUnit.unitId} (SHA-256 ledger logged).`);
                    setSelectedUnit(null);
                  }}
                  className="px-3 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg font-label-md text-on-surface cursor-pointer"
                  type="button"
                >
                  Save Diagnostics Log
                </button>
                <ScreenDialogClose onClick={() => setSelectedUnit(null)}>Close Inspector</ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* Mobile Mechanic Modal */}
      {showMechanicModal && (
        <ScreenDialog
          title="Dispatch Mobile Mechanic Rapid Team"
          subtitle="Equipped mobile field workshop van deployment with genuine OEM spare parts"
          onClose={() => setShowMechanicModal(false)}
          panel={
            <form onSubmit={handleDispatchMechanic} className="flex flex-col gap-space-md p-space-md">
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-on-surface font-semibold">Target Machine</label>
                  <select
                    value={mechanicForm.unitId}
                    onChange={(e) => setMechanicForm({ ...mechanicForm, unitId: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  >
                    <option value="#TR-03">#TR-03 · Case IH Farmall (Air Filter)</option>
                    <option value="#TR-04">#TR-04 · JD 5075E (500h Service)</option>
                    <option value="#CH-02">#CH-02 · NH TC5.30 (Combine)</option>
                    <option value="#TR-01">#TR-01 · MF 375 (Nominal Check)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-on-surface font-semibold">Dispatching Depot</label>
                  <select
                    value={mechanicForm.depot}
                    onChange={(e) => setMechanicForm({ ...mechanicForm, depot: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  >
                    <option>Iseyin Central Depot 01</option>
                    <option>Saki Mechanization Station 02</option>
                    <option>Abeokuta North Agro-Hub 03</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-on-surface font-semibold">Work Order / Fault Code</label>
                <input
                  type="text"
                  value={mechanicForm.issueType}
                  onChange={(e) => setMechanicForm({ ...mechanicForm, issueType: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-on-surface font-semibold">Urgency SLA</label>
                  <select
                    value={mechanicForm.urgency}
                    onChange={(e) => setMechanicForm({ ...mechanicForm, urgency: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  >
                    <option>Emergency Breakdown (&lt; 2h SLA)</option>
                    <option>Scheduled (within 12h)</option>
                    <option>Depot Periodic Routine</option>
                  </select>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-on-surface font-semibold">Assigned Lead Tech</label>
                  <input
                    type="text"
                    value={mechanicForm.technician}
                    onChange={(e) => setMechanicForm({ ...mechanicForm, technician: e.target.value })}
                    className="h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-space-sm pt-space-xs">
                <ScreenDialogClose onClick={() => setShowMechanicModal(false)}>Cancel</ScreenDialogClose>
                <button
                  type="submit"
                  className="px-space-lg py-2.5 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-md font-bold transition-colors cursor-pointer"
                >
                  Mobilize Field Service Van
                </button>
              </div>
            </form>
          }
        />
      )}

      {/* Geofence Map Modal */}
      {showMapModal && (
        <ScreenDialog
          title="Live Regional Geofence &amp; CAN-bus Fleet Map"
          subtitle="Real-time multi-band RTK satellite positions across Oyo and Ogun agricultural clusters"
          onClose={() => setShowMapModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="w-full h-80 rounded-xl bg-surface-container relative overflow-hidden flex items-center justify-center border border-surface-container-high">
                <img src="/images/screens/442c1d15059d.webp" alt="Geofence Map" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/25 flex flex-col justify-between p-space-md">
                  <div className="flex justify-between items-center">
                    <span className="bg-surface-container-lowest/90 px-3 py-1 rounded-full text-primary font-bold text-label-sm flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-ping" /> 24 Machines Online
                    </span>
                    <span className="bg-surface-container-lowest/90 px-2.5 py-1 rounded text-on-surface font-mono text-xs shadow-md">
                      RTK FIX: 100%
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest/95 backdrop-blur-md p-space-sm rounded-xl shadow-lg flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-label-md font-bold text-primary">Oke-Ogun Agricultural Basin</span>
                      <span className="text-label-sm text-on-surface-variant">Saki West, Iseyin, Kisi &amp; Ogbomoso</span>
                    </div>
                    <span className="text-label-sm font-semibold text-secondary">0 Geofence Violations</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-space-xs">
                <ScreenDialogClose onClick={() => setShowMapModal(false)}>Close Geofence Radar</ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}

      {/* Service Pack Modal */}
      {showServicePackModal && (
        <ScreenDialog
          title="Maintenance Service Pack: #TR-04 (JD 5075E)"
          subtitle="500-Hour Major Preventative Maintenance Bill of Materials"
          onClose={() => setShowServicePackModal(false)}
          panel={
            <div className="flex flex-col gap-space-md p-space-md">
              <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2">
                <div className="flex justify-between text-body-sm font-medium">
                  <span>Cumulative Engine Hours:</span>
                  <span className="font-bold text-primary">481.5 / 500.0 hrs</span>
                </div>
                <div className="flex justify-between text-body-sm font-medium">
                  <span>Assigned Service Bay:</span>
                  <span className="font-bold text-on-surface">Depot 01 - Bay 2</span>
                </div>
                <div className="flex justify-between text-body-sm font-medium">
                  <span>Required Spares in Stock:</span>
                  <span className="font-bold text-secondary">100% Reserved (Iseyin Store)</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 border border-surface-container rounded-lg p-space-sm">
                <span className="font-label-sm font-bold uppercase text-on-surface-variant">Parts Package Checklist</span>
                <ul className="text-body-sm space-y-1.5 text-on-surface">
                  <li className="flex items-center gap-2"><Icon name="check_circle" className="text-secondary text-[16px]" /> 20L Premium 15W-40 Synthetic Diesel Engine Oil (OEM Spec)</li>
                  <li className="flex items-center gap-2"><Icon name="check_circle" className="text-secondary text-[16px]" /> High-pressure hydraulic cartridge filter (JD-4412)</li>
                  <li className="flex items-center gap-2"><Icon name="check_circle" className="text-secondary text-[16px]" /> Dual Stage Primary &amp; Secondary Fuel Water Separators</li>
                  <li className="flex items-center gap-2"><Icon name="check_circle" className="text-secondary text-[16px]" /> Heavy duty steering knuckle grease nipples &amp; seal kit</li>
                </ul>
              </div>

              <div className="flex justify-end gap-space-sm pt-space-xs">
                <button
                  onClick={() => {
                    showScreenToast("Work order #WO-500-TR04 confirmed and locked for technician assignment.");
                    setShowServicePackModal(false);
                  }}
                  className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md font-semibold cursor-pointer"
                  type="button"
                >
                  Confirm Bay Requisition
                </button>
                <ScreenDialogClose onClick={() => setShowServicePackModal(false)}>Close</ScreenDialogClose>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
