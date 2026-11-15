"use client";

// Ported from the "unified_notification_centre" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useDeferredValue, useState } from "react";
import { Icon } from "@/components/ds/icon";
import type { IconName } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export type NotificationCentreSlot = "actions" | "kpis" | "filters" | "stream" | "statusBar";

interface NotificationItem {
  id: string;
  category: "ops" | "weather" | "escrow" | "inventory" | "security" | "ai";
  severity: "critical" | "warning" | "advisory" | "compliance";
  badge: string;
  subsystem: string;
  time: string;
  autoTag?: string;
  title: string;
  body: string;
  meta: Array<{ icon: string; text: string; highlight?: boolean }>;
  isRead?: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    category: "weather",
    severity: "critical",
    badge: "Critical Severity",
    subsystem: "Weather & Agronomy Engine",
    time: "14:12 WAT (18m ago)",
    autoTag: "Weather Forecast Auto-Trigger",
    title: "Flash Squall & Heavy Downpour Alert: Plot M2 & M4 Nitrogen Leaching Hazard",
    body: "The weather forecast indicates 48mm/hr precipitation inbound within 3 hours over the Iseyin Cluster (Maize V4 Stage). Nitrogen top-dressing holding lock has been automatically triggered to prevent nutrient runoff and economic loss.",
    meta: [
      { icon: "location_on", text: "Affected: Plot M2 (14.2 Ha) & Plot M4 (8.1 Ha)" },
      { icon: "water_drop", text: "Projected Soil Saturation: 94%" },
      { icon: "lock_clock", text: "Fertilization Auto-Lock Active", highlight: true },
    ],
  },
  {
    id: "notif-2",
    category: "escrow",
    severity: "warning",
    badge: "Escrow SLA Warning",
    subsystem: "Escrow (not live — waiting for a licensed payment partner)",
    time: "14:02 WAT (28m ago)",
    autoTag: "Cutoff: 18:30 WAT (2h remaining)",
    title: "Escrow Auto-Release Window Closing: Booking #BKG-2026-0492 Rotary Weeding",
    body: "Sample: contractor submitted GPS proof-of-work polygon (18.5 Ha completed). 48-hour review window lapses today. Escrow and proof of work are not live yet; in the pilot you pay the provider directly.",
    meta: [
      { icon: "badge", text: "Syndicate Operator: Sample operator (Verified Tier-2)" },
      { icon: "polyline", text: "PoW Boundary Match: 99.1% verified" },
      { icon: "payments", text: "Escrow Locked: ₦95,000.00", highlight: true },
    ],
  },
  {
    id: "notif-3",
    category: "inventory",
    severity: "warning",
    badge: "Inventory Warning",
    subsystem: "Storekeeper Subsystem",
    time: "11:45 WAT (2h 45m ago)",
    title: "Critical Fertilizer Stockout: NPK 15:15:15 (Central Warehouse Oke-Ogun)",
    body: "Stock balance has depleted to 6 bags (50kg each). Agronomic calendar dictates Stage 2 top-dressing for 12.0 Ha of Early Rains Maize within 4 days, requiring minimum 24 bags. Shortfall: 18 bags.",
    meta: [
      { icon: "warehouse", text: "Hub: Oke-Ogun Agronomic Depot" },
      { icon: "production_quantity_limits", text: "Stock On Hand: 300 kg / Required: 1,200 kg" },
    ],
  },
  {
    id: "notif-4",
    category: "ops",
    severity: "warning",
    badge: "Fleet Telemetry Alarm",
    subsystem: "Asset Telematics (planned)",
    time: "10:18 WAT (4h 12m ago)",
    autoTag: "102°C Overheat",
    title: "MF 375 Tractor Overheat & Boundary Breach: Asset #TRC-04 at Saki West Parcel",
    body: "CAN-Bus diagnostic sensor logged coolant temp of 102°C under heavy tillage load. Concurrently, GPS telemetry marks machine operating 120m outside cadastral boundary of designated Farm Service contract zone.",
    meta: [
      { icon: "person", text: "Syndicate Driver: Sample driver" },
      { icon: "warning", text: "Geofence Deviation: 120m East" },
      { icon: "sensors", text: "CAN-Bus RPM: 2,150 (Idle recommended)", highlight: true },
    ],
  },
  {
    id: "notif-5",
    category: "security",
    severity: "compliance",
    badge: "Compliance SLA",
    subsystem: "Security & Legal (§11.7)",
    time: "09:30 WAT",
    autoTag: "28 Days Remaining",
    title: "DSAR Data Export Request Pending Review: Sample Farmer (#DSAR-2026-006)",
    body: "A farmer lodged a Nigerian Data Protection Act (NDPA 2023) portability request for verified soil test results, farm ledger accounting records, and satellite NDVI historical records. Automated PII sanitization pre-pass completed.",
    meta: [
      { icon: "security", text: "Masking Protocol: SHA-256 BVN/NIN redact pass" },
      { icon: "verified", text: "Identity Verification: Level 2 Confirmed", highlight: true },
    ],
  },
  {
    id: "notif-6",
    category: "ai",
    severity: "advisory",
    badge: "AI Advisory",
    subsystem: "Farm Assistant (photo diagnosis coming soon)",
    time: "08:15 WAT",
    autoTag: "Confidence 88.4%",
    title: "Fall Armyworm Early Windowing Symptom Detected: Plot B1 Border Zone",
    body: "Sample: early instar Spodoptera frugiperda foliar pinhole damage reported by Quadri Olapade during a morning field walk. Immediate biological or targeted chemical spray recommended within 48h.",
    meta: [
      { icon: "eco", text: "Crop: Maize / Sweet Potato Buffer (Plot B1)" },
      { icon: "science", text: "Recommended Rx: Emamectin Benzoate 5% SG", highlight: true },
    ],
  },
];

export function NotificationCentre({ slots }: ScreenProps<NotificationCentreSlot>) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Filter on a deferred copy so typing stays smooth while the list re-renders.
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortOrder, setSortOrder] = useState<"severity" | "recent">("severity");
  const [quietHours, setQuietHours] = useState(true);
  const [weatherOverride, setWeatherOverride] = useState(true);
  const [dialect, setDialect] = useState<"EN" | "YOR" | "PID">("EN");

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter !== "all" && n.category !== activeFilter) return false;
    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchBody = n.body.toLowerCase().includes(q);
      const matchSub = n.subsystem.toLowerCase().includes(q);
      if (!matchTitle && !matchBody && !matchSub) return false;
    }
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showScreenToast("All 48 notifications marked as read across active channels.");
  };

  const handleBatchAcknowledge = () => {
    showScreenToast("Batch acknowledged: 5 operational alerts cleared from notification stream.");
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showScreenToast("Notification dismissed.");
  };

  const handleAction = (message: string) => {
    showScreenToast(message);
  };

  const handleExportDSAR = () => {
    const dsarPackage = `CULTIVANODE NDPA 2023 DSAR PORTABILITY EXPORT
Subject: Sample Farmer (#DSAR-2026-006)
Date: ${new Date().toISOString()}
Compliance Hash: 0x9d4e...82bc

1. SOIL TEST RESULTS (sample):
- Nitrogen: 0.14% (Adequate)
- Phosphorus: 12.8 ppm (Optimal)
- Potassium: 0.42 cmol/kg
- pH: 6.4 (Water)

2. FARM LEDGER ACCOUNTING RECORDS:
- Total Corroborated Purchases: N840,000
- Verified Produce Deliveries: N2,410,000

3. SATELLITE NDVI TIME-SERIES:
- Dec 2025: 0.68
- Jan 2026: 0.72
- Feb 2026: 0.79

SHA-256 Signature Sealed by CultivaNode Security Subsystem.
`;
    downloadFile(dsarPackage, "DSAR-Export-Sample-Farmer.txt", "text/plain");
    showScreenToast("DSAR export generated and downloaded.");
  };

  // Emergency dispatch modal
  const modalEmergency = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="emergency_share" className="text-error text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Dispatch Emergency Alert</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">High-priority broadcast to cluster farmers &amp; syndicate leads</p>
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
          showScreenToast("Emergency Agronomy Alert dispatched to 142 cluster farmers via SMS & Mobile Push!");
        }}
        className="p-space-lg space-y-space-md text-left"
      >
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Incident Type</label>
          <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
            <option>Severe Weather (Flash Flood / Wind Gusts)</option>
            <option>Pest Outbreak (Fall Armyworm / Locusts)</option>
            <option>Biosecurity Warning (NDV / Bird Flu Alert)</option>
            <option>Infrastructure (River Basin Irrigation Outage)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Broadcast Cluster</label>
            <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
              <option>Iseyin Savanna Cluster (All Plots)</option>
              <option>Oke-Ogun Northern Sub-cluster</option>
              <option>Saki Agricultural Corridor</option>
            </select>
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Channels</label>
            <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
              <option>Termii SMS + In-App Push</option>
              <option>Termii SMS Flash Only</option>
              <option>All Multi-Channel Gateways</option>
            </select>
          </div>
        </div>
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Alert Message (EN / YOR / PID)</label>
          <textarea
            defaultValue="URGENT CULTIVANODE ALERT: Heavy frontal squall (48mm) expected within 3 hours. Halt all chemical spraying and secure poultry houses immediately."
            rows={3}
            className="w-full p-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none resize-none"
          />
        </div>
        <div className="p-space-lg bg-surface-container-low flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Cancel
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button
              onClick={() => showScreenToast("Emergency Agronomy Alert dispatched to 142 cluster farmers via SMS & Mobile Push!")}
              className="px-space-md py-2 rounded-lg bg-error text-on-error font-label-md text-label-md font-semibold"
              type="button"
            >
              Broadcast Emergency Alert
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-space-md mb-space-md bg-surface-container-low px-space-md py-space-sm rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-space-sm text-label-sm font-label-sm text-on-surface-variant">
            <div className="flex items-center gap-space-xs text-primary font-semibold">
              <Icon name="notifications_active" className="text-[16px]" />
              <span>Unified Notification Centre (§12.1)</span>
            </div>
            <span>/</span>
            <span>Communication &amp; Omnichannel Operations</span>
            <span>/</span>
            <span className="bg-surface-container px-space-xs py-0.5 rounded text-on-surface font-semibold">
              Iseyin Savanna Cluster · Oyo Zone
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-space-md mt-space-xs md:mt-0">
            <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded text-label-sm font-label-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-on-surface font-semibold">Telemetry: 5s Polling</span>
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded text-label-sm font-label-sm shadow-sm">
              <Icon name="verified_user" className="text-primary text-[15px]" />
              <span className="text-on-surface font-semibold">Masked ID Numbers (NDPA 2023)</span>
            </div>
            <div className="flex items-center gap-space-xs bg-secondary-container px-space-sm py-1 rounded text-on-secondary-container text-label-sm font-label-sm font-bold">
              <Icon name="sync_saved_locally" className="text-[15px]" />
              <span>Offline Sync: Coming Soon</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
          <div>
            <div className="flex items-center gap-space-sm">
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight font-bold">
                Notification Command &amp; Multi-Channel Dispatch
              </h1>
              <span className="bg-error-container text-on-error-container font-label-md text-label-md px-space-sm py-0.5 rounded-full font-bold">
                {notifications.filter((n) => n.severity === "critical").length} High Severity
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Real-time multi-channel broadcast engine servicing 42.5 Ha Iseyin Agronomic Cluster, syndicate machinery CAN-bus, and escrow (not live — waiting for a licensed payment partner).
            </p>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex flex-wrap items-center gap-space-sm">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md shadow-sm transition-colors font-medium"
                type="button"
              >
                <Icon name="done_all" className="text-[18px]" />
                <span>Mark All Read</span>
              </button>
              <button
                onClick={handleBatchAcknowledge}
                className="flex items-center gap-space-xs bg-surface-container-lowest text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md shadow-sm transition-colors font-medium"
                type="button"
              >
                <Icon name="checklist" className="text-[18px]" />
                <span>Batch Acknowledge</span>
              </button>
              <ScreenDialog title="Emergency Alert" side="center" panel={modalEmergency}>
                <button onClick={() => {}} className="flex items-center gap-space-xs bg-tertiary-container text-on-tertiary hover:bg-tertiary px-space-md py-2 rounded-lg font-label-md text-label-md shadow-sm transition-colors font-bold" type="button">
                  <Icon name="emergency_share" className="text-[18px]" />
                  <span>Dispatch Emergency Agronomy Alert</span>
                </button>
              </ScreenDialog>
            </div>
          )}
        </div>
        {slot(
          slots,
          "kpis",
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-gutter mb-space-xl">
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Active Unread Alerts</span>
                <span className="p-1.5 rounded-md bg-error-container text-on-error-container">
                  <Icon name="priority_high" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-on-surface font-bold">{notifications.length}</span>
                  <span className="font-label-sm text-label-sm text-error font-semibold">
                    {notifications.filter((n) => n.severity === "critical").length} High Sev
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>5 Operational · 4 Info</span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-space-sm overflow-hidden flex">
                <div className="bg-error h-full" style={{ width: "25%" }} />
                <div className="bg-tertiary-container h-full" style={{ width: "42%" }} />
                <div className="bg-secondary h-full" style={{ width: "33%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Multi-Channel Delivery</span>
                <span className="p-1.5 rounded-md bg-secondary-container text-on-secondary-container">
                  <Icon name="satellite_alt" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-primary font-bold">99.4%</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">+0.3% vs Wk 15</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">In-App, Termii, Push, Hooks</p>
              </div>
              <div className="mt-space-sm">
                <svg className="w-full h-4 text-secondary" fill="none" preserveAspectRatio="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 20">
                  <path d="M0 16 L20 14 L40 18 L60 9 L80 11 L100 4" />
                </svg>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Escrow SLA (not live)</span>
                <span className="p-1.5 rounded-md bg-surface-container-low text-primary">
                  <Icon name="timer" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-on-surface font-bold">18.2m</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">Fast</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Under 45m target</p>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-space-sm overflow-hidden">
                <div className="bg-primary h-full" style={{ width: "40.4%" }} />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Emergency Agronomist</span>
                <span className="p-1.5 rounded-md bg-tertiary-fixed text-on-tertiary-fixed">
                  <Icon name="campaign" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-tertiary-container font-bold">2</span>
                  <span className="font-label-sm text-label-sm text-tertiary-container font-semibold">Active Cycle</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Armyworm &amp; Flash Squall</p>
              </div>
              <div className="mt-space-sm flex items-center gap-1 text-label-sm font-label-sm text-on-surface font-semibold">
                <Icon name="check_circle" className="text-[14px] text-secondary" />
                <span>Broadcast Reach: 100%</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Termii SMS Gateway</span>
                <span className="p-1.5 rounded-md bg-surface-container text-on-surface">
                  <Icon name="sms" className="text-[18px]" />
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-metric-num text-metric-num text-on-surface font-bold">98.7%</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">1,420 sent</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Oyo &amp; Ogun cluster routes</p>
              </div>
              <div className="mt-space-sm flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                <span>Balance: ₦18,420</span>
                <span className="text-secondary font-semibold">1.8s Latency</span>
              </div>
            </div>
          </div>
        )}
        {slot(
          slots,
          "filters",
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm mb-space-lg flex flex-col gap-space-md">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
              <div className="flex flex-wrap items-center gap-1 bg-surface-container-low p-1 rounded-lg">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-space-sm py-1.5 rounded-md font-label-md text-label-md transition-all ${
                    activeFilter === "all" ? "bg-primary text-on-primary font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  All Notifications ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter("ops")}
                  className={`px-space-sm py-1.5 rounded-md font-label-md text-label-md transition-all ${
                    activeFilter === "ops" ? "bg-primary text-on-primary font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Farm Ops &amp; Phenology
                </button>
                <button
                  onClick={() => setActiveFilter("weather")}
                  className={`px-space-sm py-1.5 rounded-md font-label-md text-label-md transition-all ${
                    activeFilter === "weather" ? "bg-primary text-on-primary font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Weather &amp; Risk
                </button>
                <button
                  onClick={() => setActiveFilter("escrow")}
                  className={`px-space-sm py-1.5 rounded-md font-label-md text-label-md transition-all ${
                    activeFilter === "escrow" ? "bg-primary text-on-primary font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Escrow &amp; PoW
                </button>
                <button
                  onClick={() => setActiveFilter("inventory")}
                  className={`px-space-sm py-1.5 rounded-md font-label-md text-label-md transition-all ${
                    activeFilter === "inventory" ? "bg-primary text-on-primary font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveFilter("security")}
                  className={`px-space-sm py-1.5 rounded-md font-label-md text-label-md transition-all ${
                    activeFilter === "security" ? "bg-primary text-on-primary font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  Security &amp; KYC
                </button>
                <button
                  onClick={() => setActiveFilter("ai")}
                  className={`px-space-sm py-1.5 rounded-md font-label-md text-label-md transition-all ${
                    activeFilter === "ai" ? "bg-primary text-on-primary font-semibold shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  type="button"
                >
                  AI Agronomy
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-space-xs text-label-sm font-label-sm">
                <div className="flex items-center gap-1.5 px-space-sm py-1 bg-secondary-container text-on-secondary-container rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>In-App Push (Active)</span>
                </div>
                <div className="flex items-center gap-1.5 px-space-sm py-1 bg-surface-container text-on-surface rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Termii SMS (Online)</span>
                </div>
                <div className="flex items-center gap-1.5 px-space-sm py-1 bg-surface-container-high text-on-surface-variant rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                  <span>WhatsApp Pilot (Phase 1.5)</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-xs">
              <div className="relative w-full sm:w-96">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-md bg-surface-container-low text-on-surface text-body-sm font-body-sm focus:outline-none focus:bg-surface-container transition-colors"
                  placeholder="Filter by Parcel (e.g. Plot M2), Booking #, or Keyword..."
                  type="text"
                />
              </div>
              <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Sort:</span>
                <button
                  onClick={() => {
                    const next = sortOrder === "severity" ? "recent" : "severity";
                    setSortOrder(next);
                    showScreenToast(`Sorting by: ${next === "severity" ? "Highest Severity First" : "Most Recent"}`);
                  }}
                  className="flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary bg-surface-container-low px-space-sm py-1.5 rounded-md hover:bg-surface-container transition-colors"
                  type="button"
                >
                  <span>{sortOrder === "severity" ? "Highest Severity First" : "Most Recent"}</span>
                  <Icon name="expand_more" className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>
        )}
        {slot(
          slots,
          "stream",
          <div className="flex flex-col gap-space-md mb-space-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="stream" className="text-primary text-[20px]" />
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                  Active Critical &amp; Operational Stream
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Live streaming via Supabase Realtime (WebSocket 38ms)</span>
            </div>

            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-surface-container-lowest rounded-lg p-space-md lg:p-space-lg shadow-sm relative overflow-hidden transition-all hover:shadow-md"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  notif.severity === "critical"
                    ? "bg-error"
                    : notif.severity === "warning"
                    ? "bg-tertiary-container"
                    : notif.severity === "compliance"
                    ? "bg-secondary"
                    : "bg-secondary-fixed-dim"
                }`} />
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-md">
                  <div className="flex items-start gap-space-md flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      notif.severity === "critical"
                        ? "bg-error-container text-on-error-container"
                        : notif.severity === "warning"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed"
                        : notif.severity === "compliance"
                        ? "bg-surface-container-low text-secondary"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}>
                      <Icon name={
                        notif.category === "weather"
                          ? "thunderstorm"
                          : notif.category === "escrow"
                          ? "account_balance_wallet"
                          : notif.category === "inventory"
                          ? "inventory_2"
                          : notif.category === "ops"
                          ? "agriculture"
                          : notif.category === "security"
                          ? "policy"
                          : "psychology"
                      } className="text-[26px]" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-space-xs">
                        <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-bold tracking-wider uppercase ${
                          notif.severity === "critical"
                            ? "bg-error text-on-error"
                            : notif.severity === "warning"
                            ? "bg-tertiary-container text-on-tertiary"
                            : "bg-surface-container text-on-surface"
                        }`}>
                          {notif.badge}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">
                          {notif.subsystem}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">· {notif.time}</span>
                        {notif.autoTag && (
                          <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface font-label-sm text-label-sm font-semibold">
                            {notif.autoTag}
                          </span>
                        )}
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
                        {notif.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        {notif.body}
                      </p>
                      <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-label-sm text-label-sm text-on-surface-variant">
                        {notif.meta.map((m, idx) => (
                          <div key={idx} className={`flex items-center gap-1 ${m.highlight ? "text-secondary font-semibold" : ""}`}>
                            <Icon name={m.icon as IconName} className="text-[16px]" />
                            <span>{m.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap lg:flex-col gap-space-xs shrink-0 items-stretch lg:min-w-[210px]">
                    {notif.id === "notif-1" ? (
                      <>
                        <button
                          onClick={() => handleAction("Top-dressing postponed by 48h. Work order updated in field operations.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors"
                          type="button"
                        >
                          <Icon name="event_busy" className="text-[18px]" />
                          <span>Postpone Top-Dress</span>
                        </button>
                        <button
                          onClick={() => handleAction("Dispatched Termii SMS alerts to 8 field hands assigned to Plots M2 & M4.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors"
                          type="button"
                        >
                          <Icon name="send_to_mobile" className="text-[18px]" />
                          <span>Notify Workers via SMS</span>
                        </button>
                        <button
                          onClick={() => handleAction("Weather forecast: 48mm front moving NE at 22 km/h.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-primary px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors"
                          type="button"
                        >
                          <Icon name="radar" className="text-[16px]" />
                          <span>View Forecast</span>
                        </button>
                      </>
                    ) : notif.id === "notif-2" ? (
                      <>
                        <button
                          onClick={() => handleAction("Escrow is not live yet. In the pilot, pay the provider directly.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors"
                          type="button"
                        >
                          <Icon name="verified" className="text-[18px]" />
                          <span>Authorize Payout (₦95k)</span>
                        </button>
                        <button
                          onClick={() => handleAction("24h inspection extension requested. Counterparty operator notified.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors"
                          type="button"
                        >
                          <Icon name="more_time" className="text-[18px]" />
                          <span>Request 24h Extension</span>
                        </button>
                        <button
                          onClick={() => handleAction("PoW Dossier: 18.5 Ha boundary verified against satellite cadastral layer.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-primary px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors"
                          type="button"
                        >
                          <Icon name="map" className="text-[16px]" />
                          <span>Inspect PoW Dossier</span>
                        </button>
                      </>
                    ) : notif.id === "notif-3" ? (
                      <>
                        <button
                          onClick={() => handleAction("Requisition PO created for 18 bags NPK 15:15:15 to an agro-dealer.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors"
                          type="button"
                        >
                          <Icon name="post_add" className="text-[18px]" />
                          <span>Create Requisition PO</span>
                        </button>
                        <button
                          onClick={() => handleAction("Found 3 verified agro-dealers in Oke-Ogun with NPK available.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors"
                          type="button"
                        >
                          <Icon name="storefront" className="text-[18px]" />
                          <span>Check Agro-dealers</span>
                        </button>
                        <button
                          onClick={() => handleDismiss(notif.id)}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-primary px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors"
                          type="button"
                        >
                          <Icon name="snooze" className="text-[16px]" />
                          <span>Snooze 12 Hours</span>
                        </button>
                      </>
                    ) : notif.id === "notif-4" ? (
                      <>
                        <button
                          onClick={() => handleAction("Priority alert sent to the driver (sample).")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors"
                          type="button"
                        >
                          <Icon name="ring_volume" className="text-[18px]" />
                          <span>Ping via USSD / Tel</span>
                        </button>
                        <button
                          onClick={() => handleAction("Coolant temp 102°C, 2,150 RPM. Safe idling advisory broadcast to machine.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors"
                          type="button"
                        >
                          <Icon name="my_location" className="text-[18px]" />
                          <span>CAN-Bus &amp; GPS (planned)</span>
                        </button>
                        <button
                          onClick={() => handleAction("Workshop dispatch ticket assigned to the workshop lead.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-primary px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors"
                          type="button"
                        >
                          <Icon name="build" className="text-[16px]" />
                          <span>Dispatch Workshop Lead</span>
                        </button>
                      </>
                    ) : notif.id === "notif-5" ? (
                      <>
                        <button
                          onClick={handleExportDSAR}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors"
                          type="button"
                        >
                          <Icon name="folder_zip" className="text-[18px]" />
                          <span>Generate Encrypted ZIP</span>
                        </button>
                        <button
                          onClick={() => handleAction("PII masking check: BVN/NIN fields are masked.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors"
                          type="button"
                        >
                          <Icon name="visibility" className="text-[18px]" />
                          <span>Review PII Masking</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction("Spray protocol approved: Emamectin Benzoate 5% SG added to task queue.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold shadow-sm transition-colors"
                          type="button"
                        >
                          <Icon name="biotech" className="text-[18px]" />
                          <span>Approve Spray Protocol</span>
                        </button>
                        <button
                          onClick={() => handleAction("Sample result. Photo diagnosis is coming soon.")}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container-high px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold transition-colors"
                          type="button"
                        >
                          <Icon name="image_search" className="text-[18px]" />
                          <span>Review AI Diagnosis</span>
                        </button>
                        <button
                          onClick={() => handleDismiss(notif.id)}
                          className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-error px-space-md py-1.5 rounded-lg font-label-sm text-label-sm transition-colors"
                          type="button"
                        >
                          <Icon name="close" className="text-[16px]" />
                          <span>Dismiss Advisory</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-space-xl">
          <div className="lg:col-span-8 bg-surface-container-lowest p-space-md lg:p-space-lg rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm mb-space-md gap-space-xs">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                    Notification Channel Matrix &amp; Dispatch Rules (§12.1)
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Failover tiers and multi-channel delivery profiles across rural Nigeria.</p>
                </div>
                <span className="px-space-sm py-1 rounded bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">
                  Cluster Policy: Savanna Fallback
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-2.5 px-space-sm rounded-l">Notification Category</th>
                      <th className="py-2.5 px-space-sm">In-App Push</th>
                      <th className="py-2.5 px-space-sm">Termii SMS</th>
                      <th className="py-2.5 px-space-sm">Expo Mobile Push</th>
                      <th className="py-2.5 px-space-sm rounded-r">Language Fallbacks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container text-body-sm font-body-sm">
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <Icon name="agriculture" className="text-[18px] text-primary" />
                          <span>Farm Operations &amp; Phenology</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold">Instant</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-on-surface-variant font-label-sm text-label-sm">Daily Digest (06:00 WAT)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-secondary font-label-sm text-label-sm font-bold">Immediate P1</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface font-label-sm text-label-sm">
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">EN</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">YOR</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded">PID</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <Icon name="lock_clock" className="text-[18px] text-tertiary-container" />
                          <span>Escrow (not live) &amp; Dispute Timers</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold">Instant Modal</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-error font-label-sm text-label-sm font-semibold">Instant (Tier-1 OTP/Alert)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-secondary font-label-sm text-label-sm font-bold">Immediate P1</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface font-label-sm text-label-sm">
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">EN</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded">YOR</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <Icon name="thunderstorm" className="text-[18px] text-error" />
                          <span>Severe Weather Alarms</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="bg-error text-on-error px-2 py-0.5 rounded font-label-sm text-label-sm font-bold">Persistent Banner</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-error font-label-sm text-label-sm font-bold">Flash SMS (High Priority)</span>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="text-error font-label-sm text-label-sm font-bold">Sound Override Buzzer</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface font-label-sm text-label-sm">
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">EN</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">YOR</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded">PID</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-space-sm font-semibold text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <Icon name="psychology" className="text-[18px] text-secondary" />
                          <span>CultivaNode AI Recommendations</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-sm">
                        <span className="bg-surface-container text-on-surface px-2 py-0.5 rounded font-label-sm text-label-sm">Advisory Card</span>
                      </td>
                      <td className="py-3 px-space-sm text-on-surface-variant font-label-sm text-label-sm">Disabled (Cost Opt.)</td>
                      <td className="py-3 px-space-sm text-on-surface-variant font-label-sm text-label-sm">Standard Push</td>
                      <td className="py-3 px-space-sm text-on-surface font-label-sm text-label-sm">
                        <span className="px-1.5 py-0.5 bg-surface-container rounded mr-1">EN</span>
                        <span className="px-1.5 py-0.5 bg-surface-container rounded">YOR</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-space-md mt-space-md bg-surface-container-low p-space-sm rounded-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                <Icon name="verified" className="text-primary text-[18px]" />
                <span>Automatic network failover triggers Termii SMS after 120s unread push in rural low-bandwidth cells.</span>
              </div>
              <button
                onClick={() => showScreenToast("Cluster dispatch rule updated: Termii SMS failover verified.")}
                className="text-primary hover:text-primary-container font-label-sm text-label-sm font-bold shrink-0"
                type="button"
              >
                Configure Cluster Dispatch Rules →
              </button>
            </div>
          </div>
          <div className="lg:col-span-4 bg-surface-container-lowest p-space-md lg:p-space-lg rounded-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-space-sm mb-space-md">
                <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">Dispatch Preferences</h3>
                <Icon name="tune" className="text-on-surface-variant" />
              </div>
              <div className="flex flex-col gap-space-md">
                <div className="flex items-start justify-between gap-space-sm">
                  <div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold block">Quiet Hours (Night Silence)</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Suppress routine notifications between 21:00 and 05:00 WAT.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      checked={quietHours}
                      onChange={(e) => setQuietHours(e.target.checked)}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
                <div className="flex items-start justify-between gap-space-sm">
                  <div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold block">Severe Weather Override</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Bypass quiet hours for flash floods, storms, &amp; armyworm panics.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      checked={weatherOverride}
                      onChange={(e) => setWeatherOverride(e.target.checked)}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface font-semibold block mb-1">Default Dialect Fallback</label>
                  <div className="grid grid-cols-3 gap-space-xs">
                    <button
                      onClick={() => setDialect("EN")}
                      className={`py-1.5 px-space-xs rounded font-bold font-label-sm text-label-sm text-center transition-colors ${
                        dialect === "EN" ? "bg-surface-container-low text-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                      }`}
                      type="button"
                    >
                      English (UK)
                    </button>
                    <button
                      onClick={() => setDialect("YOR")}
                      className={`py-1.5 px-space-xs rounded font-bold font-label-sm text-label-sm text-center transition-colors ${
                        dialect === "YOR" ? "bg-surface-container-low text-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                      }`}
                      type="button"
                    >
                      Yorùbá
                    </button>
                    <button
                      onClick={() => setDialect("PID")}
                      className={`py-1.5 px-space-xs rounded font-bold font-label-sm text-label-sm text-center transition-colors ${
                        dialect === "PID" ? "bg-surface-container-low text-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                      }`}
                      type="button"
                    >
                      Naija Pidgin
                    </button>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                  <div className="flex items-center justify-between text-label-sm font-label-sm">
                    <span className="text-on-surface-variant font-semibold">Termii Pool Wallet</span>
                    <span className="font-bold text-primary">₦18,420.00</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-secondary h-full" style={{ width: "74%" }} />
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">Est. 4,605 local SMS credits remaining</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => showScreenToast("Notification dispatch preferences saved!")}
              className="w-full mt-space-md py-2 px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-md text-label-md font-semibold transition-colors"
              type="button"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>
        {slot(
          slots,
          "statusBar",
          <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm mb-space-lg flex flex-col lg:flex-row items-center justify-between gap-space-md">
            <div className="flex flex-wrap items-center gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface font-bold leading-tight">Termii SMS Gateway (Lagos Route)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">99.2% Delivered · 1.8s Latency</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface font-bold leading-tight">Expo Mobile Push Service (FCM/APNs)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">0 Failed Payloads · SSL Encrypted</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface font-bold leading-tight">Supabase Realtime WebSockets</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">38ms ping · offline mode coming soon</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-on-surface-variant shrink-0">
              <Icon name="fingerprint" className="text-[16px] text-primary" />
              <span>Ledger Hash: <code className="bg-surface-container px-1 py-0.5 rounded text-on-surface font-mono">0x9d4e...82bc</code></span>
              <span className="text-secondary font-bold">Spec §11.7</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
