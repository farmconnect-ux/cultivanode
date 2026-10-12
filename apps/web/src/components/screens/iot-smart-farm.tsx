"use client";

// Ported from the "iot_smart_farm_8.4_17" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.

import { useState, useMemo } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import type { ScreenProps } from "./types";

interface SensorNode {
  id: string;
  model: string;
  serial: string;
  sector: string;
  coordinates: string;
  parameter: string;
  latestReading: string;
  readingStatus?: "normal" | "warning" | "elevated";
  statusText?: string;
  timeAgo: string;
  battery: string;
  rssi: string;
  calDue: string;
}

const INITIAL_NODES: SensorNode[] = [
  {
    id: "NODE-ISY-004",
    model: "Dragino LSE01",
    serial: "SN: 9940A",
    sector: "Oke-Ogun Block 4",
    coordinates: "7.981°N, 3.592°E",
    parameter: "Soil VWC & Temp (30cm)",
    latestReading: "31.4% VWC",
    readingStatus: "normal",
    timeAgo: "1m ago",
    battery: "3.58V (96%)",
    rssi: "-92 dBm · SNR +9",
    calDue: "14 Nov 2026",
  },
  {
    id: "NODE-SKW-019",
    model: "Dragino LSE01",
    serial: "SN: 4421B",
    sector: "Saki West Sector 4",
    coordinates: "8.672°N, 3.391°E",
    parameter: "Tensiometric Suction",
    latestReading: "12.8% VWC",
    readingStatus: "warning",
    statusText: "Drop Warning",
    timeAgo: "34m ago",
    battery: "3.41V (82%)",
    rssi: "-104 dBm · SNR +4",
    calDue: "02 Aug 2026",
  },
  {
    id: "NODE-EGB-012",
    model: "Sensirion SHT40",
    serial: "SN: 7710C",
    sector: "Egba Sector B",
    coordinates: "7.155°N, 3.351°E",
    parameter: "Canopy Micro-RH & Temp",
    latestReading: "28.4°C / 78% RH",
    readingStatus: "normal",
    timeAgo: "4m ago",
    battery: "3.62V (98%)",
    rssi: "-88 dBm · SNR +11",
    calDue: "18 Jan 2027",
  },
  {
    id: "NODE-SGM-042",
    model: "Decagon 5TE",
    serial: "SN: 1089A",
    sector: "Sagamu Nursery Pad",
    coordinates: "6.840°N, 3.649°E",
    parameter: "Salinity EC & Dielectric",
    latestReading: "1.84 dS/m EC",
    readingStatus: "elevated",
    statusText: "Elevated",
    timeAgo: "2m ago",
    battery: "3.32V (74%)",
    rssi: "-98 dBm · SNR +7",
    calDue: "10 Jun 2026",
  },
];

export function IotSmartFarm(_props: ScreenProps) {
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [nodesList, setNodesList] = useState<SensorNode[]>(INITIAL_NODES);

  // Dialog states
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [calibrateModalOpen, setCalibrateModalOpen] = useState(false);
  const [dispatchScoutModalOpen, setDispatchScoutModalOpen] = useState(false);
  const [scheduleSwapModalOpen, setScheduleSwapModalOpen] = useState(false);
  const [flushModalOpen, setFlushModalOpen] = useState(false);
  const [diagnosticsNode, setDiagnosticsNode] = useState<SensorNode | null>(null);
  const [settingsNode, setSettingsNode] = useState<SensorNode | null>(null);
  const [recalibrateNode, setRecalibrateNode] = useState<SensorNode | null>(null);
  const [irrigationLogicOpen, setIrrigationLogicOpen] = useState(false);
  const [overrideActuatorsOpen, setOverrideActuatorsOpen] = useState(false);
  const [fullFleetOpen, setFullFleetOpen] = useState(false);

  // New Sensor form state
  const [newSensorForm, setNewSensorForm] = useState({
    nodeId: "NODE-OYO-095",
    model: "Dragino LSE01 (Soil Moisture & EC)",
    sector: "Oke-Ogun Block 4",
    coordinates: "7.985°N, 3.596°E",
    parameter: "Soil VWC (30cm) + Canopy Temp",
    devEui: "A84041000188942A",
    appKey: "01020304050607080910111213141516",
  });

  const filteredNodes = useMemo(() => {
    if (selectedSector === "All Sectors") return nodesList;
    return nodesList.filter((n) => n.sector.toLowerCase().includes(selectedSector.toLowerCase()));
  }, [nodesList, selectedSector]);

  const handleExportCSV = () => {
    const csvHeader = "NodeID,Model,Serial,Sector,Coordinates,Parameter,LatestReading,Battery,RSSI,CalibrationDue\n";
    const csvRows = nodesList
      .map(
        (n) =>
          `"${n.id}","${n.model}","${n.serial}","${n.sector}","${n.coordinates}","${n.parameter}","${n.latestReading}","${n.battery}","${n.rssi}","${n.calDue}"`
      )
      .join("\n");
    downloadFile("cultivanode-iot-telemetry.csv", csvHeader + csvRows, "text/csv");
    showScreenToast("Export Successful", "Cultivanode LoRaWAN & IoT Telemetry CSV downloaded successfully.");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        {/* Header and top action bar */}
        <div className="flex flex-col gap-space-md mb-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-sm mb-1">
                <span className="inline-flex items-center px-space-xs py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider font-semibold">Telemetry Core Active</span>
                <span className="text-on-surface-variant font-label-sm text-label-sm">· Region: Oyo, Ogun &amp; Osun Savanna Belts</span>
                <span className="text-outline font-label-sm text-label-sm">· ChirpStack v4.8 LNS</span>
              </div>
              <div className="flex items-baseline gap-space-sm">
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">IoT &amp; Smart Farm Command Center (§8.4 &amp; §17)</h1>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Live LoRaWAN &amp; 4G Dual-Path Telemetry Terminal</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              {_props.slots?.actions ?? (
                <>
                  <button
                    className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all font-label-lg text-label-lg shadow-sm"
                    type="button"
                    onClick={() => setRegisterModalOpen(true)}
                  >
                    <Icon name="add_circle" className="text-[18px]" />
                    <span>Register New Sensor (+)</span>
                  </button>
                  <button
                    className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-all font-label-lg text-label-lg"
                    type="button"
                    onClick={() => setCalibrateModalOpen(true)}
                  >
                    <Icon name="tune" className="text-[18px] text-primary" />
                    <span>Calibrate Transducers</span>
                  </button>
                  <button
                    className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-all font-label-lg text-label-lg"
                    type="button"
                    onClick={handleExportCSV}
                  >
                    <Icon name="download" className="text-[18px] text-on-surface-variant" />
                    <span>Export (.CSV)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Top telemetry KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary">
                <Icon name="cell_tower" className="text-[24px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Gateway Network</span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface">99.8% Online</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">14 Base Stations (Oyo, Ogun, Osun)</span>
              </div>
            </div>
            <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <Icon name="sensors" className="text-[24px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Active Edge Nodes</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-on-surface">184</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">Online</span>
                  <span className="font-label-sm text-label-sm text-outline font-normal">/ 6 Batt / 2 Off</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Dual-Path RF 868MHz + LTE-M</span>
              </div>
            </div>
            <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
                <Icon name="security" className="text-[24px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Ingest Infrabase</span>
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">MQTT / TLS 1.3</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">ChirpStack Bridge · AES-128</span>
              </div>
            </div>
            <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-secondary-fixed/40 flex items-center justify-center text-secondary">
                <Icon name="timer" className="text-[24px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Gateway Pulse Latency</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface">24s</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">Sync Stable</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Buffer zero · Sub-minute jitter</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Macro Sensor metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-space-md mb-space-lg">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Soil Moisture Index</span>
                <Icon name="water_drop" className="text-[18px] text-secondary" />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="font-metric-num text-metric-num text-primary font-bold">31.4%</span>
                <span className="font-label-md text-label-md text-on-surface-variant">VWC</span>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm mb-space-sm font-semibold">
                <Icon name="trending_up" className="text-[14px]" />
                <span>+2.1% WoW · Optimal Zone</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 pt-space-xs bg-surface-container-low p-2 rounded-lg">
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>WP: 14%</span>
                <span className="font-semibold text-primary">Target: 28–35%</span>
                <span>FC: 38%</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-error-container w-[14%]" />
                <div className="bg-surface-variant w-[14%]" />
                <div className="bg-secondary w-[35%]" />
                <div className="bg-surface-container-highest w-[37%]" />
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Canopy Temp</span>
                <Icon name="thermostat" className="text-[18px] text-tertiary-container" />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="font-metric-num text-metric-num text-on-surface font-bold">29.2°</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Celsius</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm mb-space-sm">
                <span>Peak: 33.1°C</span>
                <span className="text-outline">·</span>
                <span>Night: 23.8°C</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-space-xs bg-surface-container-low p-2 rounded-lg font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Crop Heat Units</span>
              <span className="font-semibold text-primary">1,420 GDD</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Humidity &amp; VPD</span>
                <Icon name="air" className="text-[18px] text-primary" />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="font-metric-num text-metric-num text-on-surface font-bold">76%</span>
                <span className="font-label-md text-label-md text-on-surface-variant">RH</span>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm mb-space-sm font-semibold">
                <span>0.94 kPa VPD</span>
                <span className="text-outline">·</span>
                <span>Transpiration Ok</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-space-xs bg-surface-container-low p-2 rounded-lg font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Foliar Stress</span>
              <span className="text-secondary font-semibold">None (Optimal)</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Solar Rad / PAR</span>
                <Icon name="wb_sunny" className="text-[18px] text-tertiary-container" />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="font-metric-num text-metric-num text-on-surface font-bold">19.8</span>
                <span className="font-label-md text-label-md text-on-surface-variant">MJ/m²</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm mb-space-sm">
                <span>Daily Integrated Lux</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-space-xs bg-surface-container-low p-2 rounded-lg font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Active PAR</span>
              <span className="font-semibold text-primary">1,620 µmol/m²/s</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Aquifer / Sump</span>
                <Icon name="waves" className="text-[18px] text-secondary" />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="font-metric-num text-metric-num text-secondary font-bold">84.5%</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Capacity</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm mb-space-sm">
                <span>Water Table: 18.2m</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-space-xs bg-surface-container-low p-2 rounded-lg font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Drawdown</span>
              <span className="font-semibold text-primary">1.2m (Normal)</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Packet Ingest</span>
                <Icon name="dynamic_form" className="text-[18px] text-primary" />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="font-metric-num text-metric-num text-on-surface font-bold">42.8k</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Pkts/24h</span>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm mb-space-sm font-semibold">
                <span>Loss: 0.04%</span>
                <span className="text-outline">·</span>
                <span>QoS Grade 1</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-space-xs bg-surface-container-low p-2 rounded-lg font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Avg Battery</span>
              <span className="font-semibold text-secondary">92% Fleet-wide</span>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="mb-space-lg flex flex-col gap-space-sm">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-space-sm">
              <Icon name="warning" className="text-[20px] text-error" />
              <span className="font-headline-sm text-headline-sm text-on-surface">Active Field Transducer &amp; Agronomic Alerts</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">3 anomalies quarantined · Automatic irrigation lockouts active</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                  <Icon name="emergency_home" className="text-[18px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-error/10 text-error font-label-sm text-label-sm font-semibold">Critical Hydraulic Alert</span>
                    <span className="text-outline font-label-sm text-label-sm">34m ago</span>
                  </div>
                  <p className="font-headline-sm text-headline-sm text-on-surface mt-1">Sudden Moisture Drop: Saki West Sec 4</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Tensiometer reading plummeted to <strong>12.8% VWC</strong> within 4h. Diagnostic indicator points to potential underground drip-line breach or sub-surface fissure.</p>
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">
                <span className="font-label-sm text-label-sm text-outline font-mono">NODE-SKW-019 · Dragino LSE01</span>
                <button
                  className="px-space-sm py-1 bg-primary text-on-primary font-label-sm text-label-sm rounded hover:bg-primary-container transition-all"
                  type="button"
                  onClick={() => setDispatchScoutModalOpen(true)}
                >
                  Dispatch Scout
                </button>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center shrink-0">
                  <Icon name="battery_alert" className="text-[18px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">Hardware Advisory</span>
                    <span className="text-outline font-label-sm text-label-sm">1h 12m ago</span>
                  </div>
                  <p className="font-headline-sm text-headline-sm text-on-surface mt-1">Low Battery Voltage: &lt;2.9V Threshold</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">LoRa Node <strong>#SN-LSE-089</strong> mounted at Iseyin Weather Mast dropped to 2.84V LiSOCl2 cell output. Packet loss projected in next 48h daylight cycle.</p>
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">
                <span className="font-label-sm text-label-sm text-outline font-mono">NODE-ISY-089 · SHT40 Weather</span>
                <button
                  className="px-space-sm py-1 bg-surface-container-high text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-variant transition-all"
                  type="button"
                  onClick={() => setScheduleSwapModalOpen(true)}
                >
                  Schedule Swap
                </button>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-xl border-t-2 border-secondary shadow-sm flex flex-col justify-between">
              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                  <Icon name="science" className="text-[18px]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">Agronomic Telemetry Drift</span>
                    <span className="text-outline font-label-sm text-label-sm">2h 45m ago</span>
                  </div>
                  <p className="font-headline-sm text-headline-sm text-on-surface mt-1">Salinity EC Spike: Sagamu Lowland Paddy</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Decagon 5TE bulk electrical conductivity registered <strong>1.84 dS/m</strong> (threshold 1.20 dS/m). Likely fertilizer accumulation or back-flush sediment accumulation.</p>
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">
                <span className="font-label-sm text-label-sm text-outline font-mono">NODE-SGM-042 · Decagon 5TE</span>
                <button
                  className="px-space-sm py-1 bg-surface-container-high text-on-surface font-label-sm text-label-sm rounded hover:bg-surface-variant transition-all"
                  type="button"
                  onClick={() => setFlushModalOpen(true)}
                >
                  Flush Protocol
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Moisture chart and sensor roster */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg">
          <div className="xl:col-span-8 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md">
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-primary">Multi-Depth Root-Zone Moisture Curves</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Plot 4B Maize &amp; Cassava</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Continuously sampled 15-minute intervals across early-season tropical loam</span>
                </div>
                <div className="flex items-center gap-space-md">
                  <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                    <span className="w-3 h-3 rounded-full bg-secondary" />
                    <span className="text-on-surface">Topsoil (10cm)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                    <span className="w-3 h-3 rounded-full bg-primary-container" />
                    <span className="text-on-surface">Root Core (30cm)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
                    <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim" />
                    <span className="text-on-surface">Deep Subsoil (60cm)</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-surface-container-low/50 p-space-md rounded-xl">
                <div className="flex items-center justify-between text-outline font-label-sm text-label-sm mb-2">
                  <span>40% VWC (Field Capacity)</span>
                  <span>24-Hour Horizon (18:00 Yesterday - 18:00 Today)</span>
                </div>
                <div className="relative w-full h-56 flex items-end">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="w-full h-px bg-outline" />
                    <div className="w-full h-px bg-outline" />
                    <div className="w-full h-px bg-outline" />
                    <div className="w-full h-px bg-outline" />
                  </div>
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
                    <rect className="text-secondary/5" fill="currentColor" height="70" width="800" x="0" y="30" />
                    <path className="text-secondary" d="M0,120 Q50,110 100,105 T200,85 T300,70 T400,120 T500,135 T600,110 T700,90 T800,82" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <path className="text-primary-container" d="M0,100 Q80,98 160,95 T320,90 T480,95 T640,92 T800,88" fill="none" stroke="currentColor" strokeDasharray="4 2" strokeWidth="2.5" />
                    <path className="text-tertiary-fixed-dim" d="M0,65 Q100,66 200,64 T400,63 T600,65 T800,64" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line className="text-secondary" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1.5" x1="300" x2="300" y1="20" y2="180" />
                    <circle className="text-secondary" cx="300" cy="70" fill="currentColor" r="4" />
                  </svg>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mt-3 pt-2">
                  <span>18:00</span>
                  <span>22:00</span>
                  <span className="text-secondary font-semibold">02:00 (Precipitation +14mm)</span>
                  <span>06:00</span>
                  <span>10:00</span>
                  <span>14:00 (Peak Transpiration)</span>
                  <span>18:00 (Current)</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mt-space-md">
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Topsoil (10cm)</span>
                  <span className="font-headline-sm text-headline-sm text-secondary font-semibold">33.2% VWC</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Root Core (30cm)</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold">31.8% VWC</span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Deep Subsoil (60cm)</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">36.1% VWC</span>
                </div>
              </div>
            </div>

            {/* Deployed Transducers & Edge Roster Table */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-space-lg flex flex-wrap items-center justify-between gap-space-md">
                <div className="flex flex-col">
                  <h2 className="font-headline-sm text-headline-sm text-primary">Deployed Transducers &amp; Edge Roster</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Active field nodes transmitting telemetry through ChirpStack LoRaWAN</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <div className="bg-surface-container-low px-space-md py-1 rounded-lg flex items-center text-on-surface-variant">
                    <Icon name="filter_list" className="text-[18px] mr-1 text-outline" />
                    <select
                      className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none cursor-pointer"
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                    >
                      <option>All Sectors</option>
                      <option>Oke-Ogun Block 4</option>
                      <option>Saki West Sector 4</option>
                      <option>Egba Sector B</option>
                      <option>Sagamu Nursery Pad</option>
                    </select>
                  </div>
                  <button
                    className="text-primary hover:text-primary-container font-label-sm text-label-sm font-semibold flex items-center gap-1"
                    type="button"
                    onClick={() => setFullFleetOpen(true)}
                  >
                    <span>View All 192 Nodes</span>
                    <Icon name="chevron_right" className="text-[16px]" />
                  </button>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-high/60 text-outline font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-space-sm px-space-md">Sensor ID &amp; Model</th>
                      <th className="py-space-sm px-space-md">Sector &amp; Coordinates</th>
                      <th className="py-space-sm px-space-md">Monitored Parameter</th>
                      <th className="py-space-sm px-space-md">Latest Reading</th>
                      <th className="py-space-sm px-space-md">Battery &amp; RF RSSI</th>
                      <th className="py-space-sm px-space-md">Cal. Due</th>
                      <th className="py-space-sm px-space-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
                    {filteredNodes.map((node) => (
                      <tr key={node.id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-space-sm px-space-md">
                          <div className="flex flex-col">
                            <span className="font-label-lg text-label-lg font-semibold text-on-surface">{node.id}</span>
                            <span className="font-label-sm text-label-sm text-outline">{node.model} · {node.serial}</span>
                          </div>
                        </td>
                        <td className="py-space-sm px-space-md">
                          <div className="flex flex-col">
                            <span className="text-on-surface">{node.sector}</span>
                            <span className="font-label-sm text-label-sm text-outline font-mono">{node.coordinates}</span>
                          </div>
                        </td>
                        <td className="py-space-sm px-space-md">
                          <span
                            className={`px-2 py-0.5 rounded font-label-sm text-label-sm ${
                              node.readingStatus === "warning"
                                ? "bg-error-container/40 text-on-error-container"
                                : node.readingStatus === "elevated"
                                ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                                : "bg-surface-container text-on-surface"
                            }`}
                          >
                            {node.parameter}
                          </span>
                        </td>
                        <td className="py-space-sm px-space-md">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                node.readingStatus === "warning"
                                  ? "bg-error"
                                  : node.readingStatus === "elevated"
                                  ? "bg-tertiary-fixed-dim"
                                  : "bg-secondary"
                              }`}
                            />
                            <span
                              className={`font-semibold ${
                                node.readingStatus === "warning"
                                  ? "text-error"
                                  : node.readingStatus === "elevated"
                                  ? "text-tertiary-container"
                                  : "text-on-surface"
                              }`}
                            >
                              {node.latestReading}
                            </span>
                            <span className="text-outline font-label-sm text-label-sm">{node.statusText || node.timeAgo}</span>
                          </div>
                        </td>
                        <td className="py-space-sm px-space-md">
                          <div className="flex flex-col">
                            <span className="font-semibold text-secondary font-label-sm text-label-sm">{node.battery}</span>
                            <span className="font-label-sm text-label-sm text-outline">{node.rssi}</span>
                          </div>
                        </td>
                        <td className="py-space-sm px-space-md text-on-surface-variant font-label-sm text-label-sm">{node.calDue}</td>
                        <td className="py-space-sm px-space-md text-right">
                          {node.readingStatus === "warning" ? (
                            <button
                              className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                              title="Alert Diagnostic"
                              type="button"
                              onClick={() => setDiagnosticsNode(node)}
                            >
                              <Icon name="error" className="text-[18px]" />
                            </button>
                          ) : node.readingStatus === "elevated" ? (
                            <button
                              className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                              title="Recalibrate"
                              type="button"
                              onClick={() => setRecalibrateNode(node)}
                            >
                              <Icon name="tune" className="text-[18px]" />
                            </button>
                          ) : node.id === "NODE-EGB-012" ? (
                            <button
                              className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                              title="Settings"
                              type="button"
                              onClick={() => setSettingsNode(node)}
                            >
                              <Icon name="settings" className="text-[18px]" />
                            </button>
                          ) : (
                            <button
                              className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                              title="Diagnostics"
                              type="button"
                              onClick={() => setDiagnosticsNode(node)}
                            >
                              <Icon name="build" className="text-[18px]" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column: Spatial Map and ChirpStack Topology */}
          <div className="xl:col-span-4 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <Icon name="map" className="text-[20px] text-primary" />
                  <span className="font-headline-sm text-headline-sm text-primary">Spatial Node Dispersion</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed/50 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">14 Base Stations</span>
              </div>
              <div
                className="relative w-full h-64 rounded-xl overflow-hidden bg-surface-container-high cursor-pointer"
                data-location="Iseyin, Oyo State, Nigeria"
                onClick={() => showScreenToast("Spatial GIS Map", "Google Maps Platform satellite overlay loaded for Iseyin & Saki LoRaWAN nodes.")}
              >
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/screens/1a1d89ff156c.webp')" }} />
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px]" />
                <div className="absolute top-4 left-4 bg-surface-container-lowest/95 p-2 rounded-lg shadow-md flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm font-bold text-on-surface">Iseyin Savanna Cluster</span>
                    <span className="text-[10px] text-on-surface-variant">Gateways GW-01 &amp; GW-04 Active</span>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-surface-container-lowest/95 p-2 rounded-lg shadow-md flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3 text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">Coverage Radius:</span>
                    <span className="font-bold text-primary">18.5 km</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-label-sm font-label-sm">
                    <span className="text-on-surface-variant">Packet Arrival:</span>
                    <span className="font-bold text-secondary">99.82%</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md grid grid-cols-2 gap-space-sm text-label-sm font-label-sm">
                <div className="bg-surface-container-low p-2 rounded-lg">
                  <span className="text-on-surface-variant block">Oyo Central Station</span>
                  <span className="font-bold text-primary">GW-01 · 868.1 MHz</span>
                </div>
                <div className="bg-surface-container-low p-2 rounded-lg">
                  <span className="text-on-surface-variant block">Ogun Estuary Station</span>
                  <span className="font-bold text-primary">GW-03 · 868.3 MHz</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <Icon name="router" className="text-[20px] text-secondary" />
                  <span className="font-headline-sm text-headline-sm text-primary">LoRaWAN &amp; ChirpStack Topology</span>
                </div>
                <span className="font-label-sm text-label-sm text-outline">v4.8 Core</span>
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant font-medium">Mean Received Signal (RSSI)</span>
                    <span className="font-semibold text-secondary">-94 dBm (Excellent)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full w-[82%]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-label-sm text-label-sm">
                    <span className="text-on-surface-variant font-medium">Signal-to-Noise Ratio (SNR)</span>
                    <span className="font-semibold text-primary">+8.4 dB</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-container h-full rounded-full w-[74%]" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Primary Concentrators</span>
                  <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="check_circle" className="text-[16px] text-secondary" />
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm font-semibold text-on-surface">GW-Oyo-Iseyin-01</span>
                        <span className="text-[10px] text-outline font-mono">SX1302 · FW 2.1.0-prod</span>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm font-semibold text-secondary">Up 44d</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="check_circle" className="text-[16px] text-secondary" />
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm font-semibold text-on-surface">GW-Oyo-Saki-02</span>
                        <span className="text-[10px] text-outline font-mono">SX1303 · FW 2.1.4-prod</span>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm font-semibold text-secondary">Up 19d</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="sync_problem" className="text-[16px] text-tertiary-container" />
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm font-semibold text-on-surface">GW-Ogun-Sagamu-03</span>
                        <span className="text-[10px] text-outline font-mono">SX1302 · FW 2.0.9-legacy</span>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm font-semibold text-tertiary-container">OTA Due</span>
                  </div>
                </div>
                <div className="p-space-sm bg-surface-container-high rounded-lg flex items-center gap-space-sm">
                  <Icon name="verified_user" className="text-[20px] text-primary" />
                  <div className="flex flex-col text-label-sm font-label-sm">
                    <span className="text-on-surface font-semibold">End-to-End Encryption</span>
                    <span className="text-on-surface-variant">AES-128 AppSKey &amp; NwkSKey Rotation Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower banner: Automated Agronomic Decision Rule */}
        <div className="w-full bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-primary-fixed">
              <Icon name="agriculture" className="text-[22px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg font-semibold text-on-surface">Automated Agronomic Decision Rule §8.4 Active</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Pivot sprinkler lockout enforced when 10cm soil moisture exceeds 34% or rainfall probability &gt; 65% within 6-hour forecast window.</span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
              type="button"
              onClick={() => setIrrigationLogicOpen(true)}
            >
              View Irrigation Logic
            </button>
            <button
              className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-colors"
              type="button"
              onClick={() => setOverrideActuatorsOpen(true)}
            >
              Override Actuators
            </button>
          </div>
        </div>

        {/* Modal: Register New Sensor */}
        {registerModalOpen && (
          <ScreenDialog
            title="Register New LoRaWAN / Cellular Transducer"
            subtitle="Enroll edge node into ChirpStack v4.8 LNS cluster and bind to cadastral boundary"
            onClose={() => setRegisterModalOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Sensor Identifier</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={newSensorForm.nodeId}
                      onChange={(e) => setNewSensorForm({ ...newSensorForm, nodeId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Hardware Model</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={newSensorForm.model}
                      onChange={(e) => setNewSensorForm({ ...newSensorForm, model: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Sector &amp; Field Block</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={newSensorForm.sector}
                      onChange={(e) => setNewSensorForm({ ...newSensorForm, sector: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">GPS Coordinates (WGS84)</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                      value={newSensorForm.coordinates}
                      onChange={(e) => setNewSensorForm({ ...newSensorForm, coordinates: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">DevEUI (16 Hex)</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-mono text-body-sm text-on-surface border border-outline-variant"
                      value={newSensorForm.devEui}
                      onChange={(e) => setNewSensorForm({ ...newSensorForm, devEui: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">AppKey (32 Hex AES-128)</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low rounded-lg p-2.5 font-mono text-body-sm text-on-surface border border-outline-variant"
                      value={newSensorForm.appKey}
                      onChange={(e) => setNewSensorForm({ ...newSensorForm, appKey: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-space-sm pt-space-xs">
                  <ScreenDialogClose onClick={() => setRegisterModalOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary-container transition-colors shadow-sm"
                    onClick={() => {
                      const created: SensorNode = {
                        id: newSensorForm.nodeId,
                        model: newSensorForm.model.split(" ")[0],
                        serial: `SN: ${Math.floor(1000 + Math.random() * 9000)}X`,
                        sector: newSensorForm.sector,
                        coordinates: newSensorForm.coordinates,
                        parameter: newSensorForm.parameter,
                        latestReading: "0.0% VWC (Syncing)",
                        timeAgo: "Just now",
                        battery: "3.65V (100%)",
                        rssi: "-85 dBm · SNR +12",
                        calDue: "Nov 2026",
                      };
                      setNodesList([created, ...nodesList]);
                      setRegisterModalOpen(false);
                      showScreenToast("Node Enrolled", `Device ${newSensorForm.nodeId} joined ChirpStack gateway OTAP successfully.`);
                    }}
                  >
                    Provision &amp; Connect Node
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Calibrate Transducers */}
        {calibrateModalOpen && (
          <ScreenDialog
            title="Transducer Baseline Calibration Matrix"
            subtitle="Calibrate volumetric water content, EC electrical conductivity, and dielectric permittivity"
            onClose={() => setCalibrateModalOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md bg-surface-container-low rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">TDR / FDR Soil Calibrations</span>
                    <span className="text-secondary font-label-sm text-label-sm font-bold">Topp Equation (Sandy Loam)</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Calibrate dielectric permittivity curve: ε = 3.03 + 9.3θ + 146.0θ² - 76.7θ³.</p>
                </div>
                <div className="flex justify-end gap-space-sm">
                  <ScreenDialogClose onClick={() => setCalibrateModalOpen(false)}>Close</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary-container transition-colors"
                    onClick={() => {
                      setCalibrateModalOpen(false);
                      showScreenToast("Calibration Applied", "Zero-point offsets pushed to 184 active field transducers via LoRaWAN downlink.");
                    }}
                  >
                    Push Downlink Calibration
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Dispatch Scout */}
        {dispatchScoutModalOpen && (
          <ScreenDialog
            title="Dispatch Field Scout: Saki West Sector 4"
            subtitle="Rapid inspection for suspected subsurface drip breach or leak (NODE-SKW-019)"
            onClose={() => setDispatchScoutModalOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md bg-error-container/20 rounded-lg">
                  <span className="font-label-sm text-label-sm font-bold text-error uppercase">Urgent Ticket #SC-SKW-19</span>
                  <p className="font-body-sm text-body-sm text-on-surface mt-1">Sensor coordinates: <strong>8.672°N, 3.391°E</strong>. Diagnostic flag: Tensiometric suction drop to 12.8% VWC within 4h.</p>
                </div>
                <div className="flex justify-end gap-space-sm">
                  <ScreenDialogClose onClick={() => setDispatchScoutModalOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary-container transition-colors"
                    onClick={() => {
                      setDispatchScoutModalOpen(false);
                      showScreenToast("Scout Dispatched", "Ticket #SC-SKW-19 assigned to Field Agronomist Babatunde K. via SMS/Starlink.");
                    }}
                  >
                    Confirm Scout Dispatch
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Schedule Battery Swap */}
        {scheduleSwapModalOpen && (
          <ScreenDialog
            title="Schedule Field Battery Swap"
            subtitle="Node #SN-LSE-089 (Iseyin Weather Mast) LiSOCl2 cell &lt; 2.9V"
            onClose={() => setScheduleSwapModalOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <p className="font-body-sm text-body-sm text-on-surface-variant">Mobile technician will be dispatched with replacement 3.6V ER18505 4000mAh LiSOCl2 battery pack.</p>
                <div className="flex justify-end gap-space-sm">
                  <ScreenDialogClose onClick={() => setScheduleSwapModalOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-bold hover:bg-primary-container transition-colors"
                    onClick={() => {
                      setScheduleSwapModalOpen(false);
                      showScreenToast("Work Order Scheduled", "Technician maintenance visit scheduled for tomorrow 09:00 WAT.");
                    }}
                  >
                    Confirm Work Order
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Flush Protocol */}
        {flushModalOpen && (
          <ScreenDialog
            title="Execute Soil Bed Flush Protocol"
            subtitle="Sagamu Lowland Paddy (NODE-SGM-042) Salinity EC: 1.84 dS/m"
            onClose={() => setFlushModalOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-md text-label-md font-bold text-on-surface">Flushing Action Plan</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Open Sluice Cluster S-2 to flush 6,500L clean borehole aquifer water across Nursery Pad to leach accumulated mineral salts below root depth.</p>
                </div>
                <div className="flex justify-end gap-space-sm">
                  <ScreenDialogClose onClick={() => setFlushModalOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-secondary text-on-secondary font-label-md text-label-md rounded-lg font-bold hover:bg-secondary/90 transition-colors"
                    onClick={() => {
                      setFlushModalOpen(false);
                      showScreenToast("Flush Cycle Initiated", "Automated flush valve opened for 45-minute cycle. Solenoid #SV-03 energized.");
                    }}
                  >
                    Start Flush Cycle
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Diagnostics Node */}
        {diagnosticsNode && (
          <ScreenDialog
            title={`Diagnostics: ${diagnosticsNode.id}`}
            subtitle={`${diagnosticsNode.model} · ${diagnosticsNode.sector} (${diagnosticsNode.coordinates})`}
            onClose={() => setDiagnosticsNode(null)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="grid grid-cols-2 gap-space-sm bg-surface-container-low p-space-md rounded-lg font-body-sm text-body-sm">
                  <div>
                    <span className="text-on-surface-variant block">Latest Value:</span>
                    <span className="font-bold text-on-surface">{diagnosticsNode.latestReading}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Battery Voltage:</span>
                    <span className="font-bold text-secondary">{diagnosticsNode.battery}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Signal Strength:</span>
                    <span className="font-bold text-on-surface">{diagnosticsNode.rssi}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block">Calibration Due:</span>
                    <span className="font-bold text-primary">{diagnosticsNode.calDue}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-space-sm">
                  <ScreenDialogClose onClick={() => setDiagnosticsNode(null)}>Close</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-semibold hover:bg-primary-container transition-colors"
                    onClick={() => {
                      showScreenToast("Downlink Ping Sent", `Downlink echo request transmitted to ${diagnosticsNode.id}. ACK received in 420ms.`);
                      setDiagnosticsNode(null);
                    }}
                  >
                    Ping Downlink ACK
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Settings Node */}
        {settingsNode && (
          <ScreenDialog
            title={`Configure Sensor: ${settingsNode.id}`}
            subtitle={`${settingsNode.model} · Microclimate Telemetry`}
            onClose={() => setSettingsNode(null)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Transmission Uplink Interval</label>
                  <select className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant">
                    <option>Every 15 minutes (Standard Battery Conservation)</option>
                    <option>Every 5 minutes (High-Resolution Monitoring)</option>
                    <option>Every 60 minutes (Ultra-low Power Mode)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-space-sm">
                  <ScreenDialogClose onClick={() => setSettingsNode(null)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg font-semibold hover:bg-primary-container transition-colors"
                    onClick={() => {
                      showScreenToast("Settings Saved", `Uplink period for ${settingsNode.id} updated. Next transmission will adopt profile.`);
                      setSettingsNode(null);
                    }}
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Recalibrate Node */}
        {recalibrateNode && (
          <ScreenDialog
            title={`Recalibrate Transducer: ${recalibrateNode.id}`}
            subtitle={`${recalibrateNode.model} · Salinity EC Probe`}
            onClose={() => setRecalibrateNode(null)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Bulk EC Offset (dS/m)</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue="0.00"
                    className="w-full bg-surface-container-low rounded-lg p-2.5 font-body-sm text-body-sm text-on-surface border border-outline-variant"
                  />
                </div>
                <div className="flex justify-end gap-space-sm">
                  <ScreenDialogClose onClick={() => setRecalibrateNode(null)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-1.5 bg-secondary text-on-secondary font-label-md text-label-md rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
                    onClick={() => {
                      showScreenToast("Recalibrated", `EC sensor ${recalibrateNode.id} zero-point calibration recorded.`);
                      setRecalibrateNode(null);
                    }}
                  >
                    Apply Recalibration
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: View Irrigation Logic */}
        {irrigationLogicOpen && (
          <ScreenDialog
            title="Rule §8.4 Automated Agronomic Decision Engine"
            subtitle="Closed-loop soil water balance &amp; rain prediction algorithm"
            onClose={() => setIrrigationLogicOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md font-body-sm text-body-sm text-on-surface-variant">
                <div className="p-space-md bg-surface-container-low rounded-lg space-y-2">
                  <span className="font-label-md text-label-md font-bold text-primary block">Active Lockout Rules</span>
                  <p>1. <strong>Moisture Cap:</strong> Solenoid closed when topsoil (10cm) VWC &gt; 34% (Field Capacity is 38%).</p>
                  <p>2. <strong>Weather Convection Hold:</strong> Automatic suspension when NiMet 6-hour convective rain forecast &gt; 65% probability.</p>
                  <p>3. <strong>VPD Stress Override:</strong> When Vapor Pressure Deficit exceeds 1.8 kPa and leaf temperature &gt; 32°C, micro-misting is triggered for 180 seconds.</p>
                </div>
                <div className="flex justify-end">
                  <ScreenDialogClose onClick={() => setIrrigationLogicOpen(false)}>Close</ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: Override Actuators */}
        {overrideActuatorsOpen && (
          <ScreenDialog
            title="Manual Hydraulic Actuator Override"
            subtitle="Bypass closed-loop automation with emergency operator authority"
            onClose={() => setOverrideActuatorsOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md">
                <div className="p-space-md bg-error-container/20 rounded-lg">
                  <span className="font-label-sm text-label-sm font-bold text-error uppercase">Operator Notice</span>
                  <p className="font-body-sm text-body-sm text-on-surface mt-1">Manual overrides bypass automatic rain-holds and pressure relief thresholds. All operations are logged to the cryptographic immutable ledger.</p>
                </div>
                <div className="flex justify-end gap-space-sm">
                  <ScreenDialogClose onClick={() => setOverrideActuatorsOpen(false)}>Cancel</ScreenDialogClose>
                  <button
                    type="button"
                    className="px-space-md py-2 bg-error text-on-error font-label-md text-label-md rounded-lg font-bold hover:bg-error/90 transition-colors"
                    onClick={() => {
                      setOverrideActuatorsOpen(false);
                      showScreenToast("Manual Override Engaged", "Supervised manual actuator mode enabled for 60 minutes.");
                    }}
                  >
                    Confirm Manual Override
                  </button>
                </div>
              </div>
            }
          />
        )}

        {/* Modal: View All 192 Nodes */}
        {fullFleetOpen && (
          <ScreenDialog
            title="LoRaWAN Transducer Network Roster (192 Active Nodes)"
            subtitle="Full telemetry inventory across Oyo, Ogun, and Osun agricultural corridors"
            onClose={() => setFullFleetOpen(false)}
            panel={
              <div className="flex flex-col gap-space-md max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm text-center">
                  <div className="bg-surface-container-low p-2 rounded-lg">
                    <span className="font-label-sm text-label-sm text-outline block">Total Fleet</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">192</span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-lg">
                    <span className="font-label-sm text-label-sm text-outline block">Active &amp; Normal</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold">184</span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-lg">
                    <span className="font-label-sm text-label-sm text-outline block">Low Battery</span>
                    <span className="font-headline-sm text-headline-sm text-tertiary-container font-bold">6</span>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-lg">
                    <span className="font-label-sm text-label-sm text-outline block">Offline / Servicing</span>
                    <span className="font-headline-sm text-headline-sm text-error font-bold">2</span>
                  </div>
                </div>
                <div className="flex justify-end pt-space-xs">
                  <ScreenDialogClose onClick={() => setFullFleetOpen(false)}>Close</ScreenDialogClose>
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
