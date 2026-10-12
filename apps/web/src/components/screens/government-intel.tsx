"use client";

// Ported from the "government_agricultural_intelligence_dashboard_10.3" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";

export function GovernmentIntel(_props: ScreenProps) {
  const [cadastreLayer, setCadastreLayer] = useState<"choropleth" | "soil" | "ndvi">("choropleth");

  const handleExportGazette = () => {
    const content = `FEDERAL MINISTRY OF AGRICULTURE AND FOOD SECURITY (FMAFS)
SOUTH-WEST REGIONAL AGRICULTURAL COMMISSION JOINT DATA ENGINE
STATUTORY GAZETTE & CADASTRAL CROP PRODUCTION ESTIMATE
Season: 2026 Early Rain Cycle (April - July)
Agro-Ecological Corridor: South-West (Oyo, Ogun, Ondo, Osun, Ekiti, Lagos)
NDPA 2023 Compliance Hash: 0x7F9B82C10E48FA94A12B
Total Smallholders Surveyed: 184,920
Total Registered Hectarage: 412,650 Ha
Maize Yield Estimate: 3.42 MT/Ha (Oke-Ogun Basin)
Yellow Cassava (TME-419) In-Ground: 1,840,000 MT
Fertilizer Subsidy Tranche 1 Audit: 99.4% Biometric Proof-of-Delivery
Cryptographic Seal: SHA256-FMAFS-SW-2026-994821`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "FMAFS-Gazette-SW-2026-Q2.txt";
    a.click();
    URL.revokeObjectURL(url);
    showScreenToast("FMAFS Statutory Gazette exported (SHA-256 verified).");
  };

  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <header className="w-full bg-surface-container-low px-space-md lg:px-space-xl py-space-lg shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg">
            <div className="flex flex-col gap-space-xs max-w-4xl">
              <div className="flex flex-wrap items-center gap-space-sm text-secondary">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 text-on-secondary-fixed-variant font-label-sm text-label-sm uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Statutory Cluster §10.3 &amp; §22</span>
                <span className="text-outline-variant font-label-sm text-label-sm">•</span>
                <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Joint Federal &amp; State Sovereign Gateway</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold tracking-tight">Government Agricultural Intelligence Dashboard</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Federal Ministry of Agriculture and Food Security (FMAFS) &amp; South-West Regional Agricultural Commission Joint Data Engine. Real-time regional agricultural telemetry, subsidy auditing, and harvest yield models.</p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm self-start xl:self-center">
              <button onClick={handleExportGazette} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container transition-colors" type="button"><Icon name="download" className="text-[18px] text-secondary" /> Export FMAFS Gazette (.PDF)</button>
              <button onClick={() => showScreenToast("State Data Seals Verified: All 6 South-West states signed with Merkle root 0x7F9B...4A12.")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors" type="button"><Icon name="verified_user" className="text-[18px]" /> Verify State Data Seals</button>
            </div>
          </div>
          <div className="mt-space-md p-space-sm rounded-lg bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <Icon name="shield" className="text-secondary text-[20px] shrink-0" />
              <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate">NDPA 2023 Compliant:</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">All smallholder agronomic metrics aggregated to LGA / community hydrologic level. Zero raw geolocations or personally identifiable records exposed without sovereign warrant.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Protocol Hash:</span>
              <code className="px-2 py-0.5 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-mono">0x7F9B...4A12</code>
            </div>
          </div>
          <div className="mt-space-md flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <Icon name="public" className="text-[16px] text-primary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Zone:</span>
              <span className="font-label-sm text-label-sm font-semibold text-primary">South-West Agro-Ecological Corridor (6 States)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <Icon name="calendar_month" className="text-[16px] text-primary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Season:</span>
              <span className="font-label-sm text-label-sm font-semibold text-primary">2026 Early Rains</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <Icon name="layers" className="text-[16px] text-primary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Resolution:</span>
              <span className="font-label-sm text-label-sm font-semibold text-primary">LGA / Hydrological Basin</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm">
              <Icon name="update" className="text-[16px] text-secondary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Telemetry Freshness:</span>
              <span className="font-label-sm text-label-sm font-semibold text-secondary">Synchronized 14 mins ago</span>
            </div>
          </div>
        </header>
        <div className="p-space-md lg:p-space-xl space-y-space-xl">
          <section className="space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">§10.3 Regional Overview</span>
                <h2 className="font-headline-lg text-headline-lg text-primary font-bold">South-West Agricultural Aggregates</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline-block">Harmonized with National Agribusiness Register (NAR)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Registered Smallholders</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="group" className="text-[18px]" />
                  </div>
                </div>
                <div className="mt-space-sm">
                  <div className="font-metric-num text-metric-num text-on-surface">64,820</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center text-secondary font-label-sm text-label-sm font-semibold"><Icon name="trending_up" className="text-[14px]" /> +18.4%</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">YoY Cadastral</span>
                  </div>
                </div>
                <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded p-2 text-on-surface-variant font-body-sm text-body-sm">Across 137 LGAs verified</div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Cultivated Area (Hectares)</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="grid_view" className="text-[18px]" />
                  </div>
                </div>
                <div className="mt-space-sm">
                  <div className="font-metric-num text-metric-num text-on-surface">148,450</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center text-secondary font-label-sm text-label-sm font-semibold"><Icon name="check_circle" className="text-[14px]" /> 92%</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Planting target met</span>
                  </div>
                </div>
                <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded p-2 text-on-surface-variant font-body-sm text-body-sm truncate">Maize, Cassava, Rice, Yam</div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Modelled Gross Output</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="inventory_2" className="text-[18px]" />
                  </div>
                </div>
                <div className="mt-space-sm">
                  <div className="font-metric-num text-metric-num text-on-surface">612,400 <span className="text-body-md font-body-md text-on-surface-variant">MT</span></div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center text-primary font-label-sm text-label-sm font-semibold">₦74.8 Billion</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Est. Ag-GDP</span>
                  </div>
                </div>
                <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded p-2 text-on-surface-variant font-body-sm text-body-sm">Early Rains harvest projection</div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Food Security Index</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="verified" className="text-[18px]" />
                  </div>
                </div>
                <div className="mt-space-sm">
                  <div className="font-metric-num text-metric-num text-secondary">78.4 <span className="text-body-md font-body-md text-on-surface-variant">/100</span></div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center text-secondary font-label-sm text-label-sm font-semibold"><Icon name="arrow_downward" className="text-[14px]" /> -12.6%</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Grain price pressure</span>
                  </div>
                </div>
                <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded p-2 text-on-surface-variant font-body-sm text-body-sm">Buffer: Optimal resilience band</div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Input Subsidies (NAGS-AP)</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="redeem" className="text-[18px]" />
                  </div>
                </div>
                <div className="mt-space-sm">
                  <div className="font-metric-num text-metric-num text-on-surface">42,180</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center text-secondary font-label-sm text-label-sm font-semibold">94.2%</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">E-voucher redemption</span>
                  </div>
                </div>
                <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded p-2 text-on-surface-variant font-body-sm text-body-sm">Zero-leakage wallet audit</div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Fleet Mechanization Density</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <Icon name="agriculture" className="text-[18px]" />
                  </div>
                </div>
                <div className="mt-space-sm">
                  <div className="font-metric-num text-metric-num text-on-surface">1.84 <span className="text-body-md font-body-md text-on-surface-variant">HP/Ha</span></div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center text-primary font-label-sm text-label-sm font-semibold">Target: 2.50</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">HP/Ha standard</span>
                  </div>
                </div>
                <div className="mt-space-sm pt-space-xs bg-surface-container-low rounded p-2 text-on-surface-variant font-body-sm text-body-sm">412 active tracked tractors</div>
              </div>
            </div>
          </section>
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
            <div className="xl:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="map" className="text-secondary text-[20px]" />
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">§10.3 Planning Cadastre</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">South-West Geospatial Hectarage Terminal</h3>
                </div>
                <div className="inline-flex items-center gap-1 bg-surface-container p-1 rounded-lg">
                  <button
                    onClick={() => {
                      setCadastreLayer("choropleth");
                      showScreenToast("Cadastre view switched to Regional Hectarage Choropleth.");
                    }}
                    className={`px-2.5 py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${
                      cadastreLayer === "choropleth" ? "text-on-primary bg-primary" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    type="button"
                  >
                    Choropleth
                  </button>
                  <button
                    onClick={() => {
                      setCadastreLayer("soil");
                      showScreenToast("Cadastre view switched to Sentinel-1 Soil Moisture Infiltration.");
                    }}
                    className={`px-2.5 py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${
                      cadastreLayer === "soil" ? "text-on-primary bg-primary" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    type="button"
                  >
                    Soil Moisture
                  </button>
                  <button
                    onClick={() => {
                      setCadastreLayer("ndvi");
                      showScreenToast("Cadastre view switched to Sentinel-2 NDVI Canopy Vigor Index.");
                    }}
                    className={`px-2.5 py-1 rounded font-label-sm text-label-sm font-semibold transition-colors ${
                      cadastreLayer === "ndvi" ? "text-on-primary bg-primary" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    type="button"
                  >
                    NDVI Vigor
                  </button>
                </div>
              </div>
              <div className="relative w-full rounded-xl overflow-hidden bg-surface-container-low">
                <div className="w-full h-80 bg-cover bg-center rounded-xl relative" data-location="Oyo State, Nigeria">
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px]" />
                  <div className="absolute top-4 left-4 p-space-sm rounded-lg bg-surface-container-lowest/95 shadow-md max-w-xs">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Primary Grain Basin</div>
                    <div className="font-headline-sm text-headline-sm text-primary font-bold">Oke-Ogun Agricultural Zone</div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Highest regional density: 44,200 Ha dedicated to commercial White Maize &amp; Yellow Cassava (TME-419).</p>
                  </div>
                  <div className="absolute bottom-4 right-4 p-space-sm rounded-lg bg-surface-container-lowest/95 shadow-md flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Live PostGIS Ingestion</span>
                      <span className="font-label-md text-label-md font-semibold text-secondary">137 LGA Cadastral Boundaries Active</span>
                    </div>
                    <span className="w-3 h-3 rounded-full bg-secondary animate-ping" />
                  </div>
                </div>
              </div>
              <div className="space-y-space-sm">
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">State-by-State Hectarage Allocation Roster</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-sm">
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md font-bold text-on-surface">Oyo State</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">39.2% of corridor</span>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-primary font-bold mt-1">58,200 Ha</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Savanna: Grain Maize, Industrial Soya, Cassava</div>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md font-bold text-on-surface">Ogun State</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">23.0% of corridor</span>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-primary font-bold mt-1">34,100 Ha</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Rainforest: Lowland Paddy Rice, Industrial Starch</div>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md font-bold text-on-surface">Osun State</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">16.7% of corridor</span>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-primary font-bold mt-1">24,800 Ha</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Agroforestry, White Yam, Cocoa-Plantain Mix</div>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md font-bold text-on-surface">Ondo &amp; Ekiti</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">14.4% of corridor</span>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-primary font-bold mt-1">21,350 Ha</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Highland: Plantain clusters, Cocoa, Tree crops</div>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col justify-between sm:col-span-2 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md font-bold text-on-surface">Lagos State</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">6.7% of corridor</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="font-headline-sm text-headline-sm text-primary font-bold">10,000 Ha</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">Peri-Urban Protected Horticulture &amp; Aquaculture</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="xl:col-span-5 space-y-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Seasonal Progression</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">2026 Early Rains Crop Timeline</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">Peak Vegetative</span>
                </div>
                <div className="space-y-space-md pt-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">1. Land Preparation &amp; Tillage</span>
                      <span className="font-label-md text-label-md font-bold text-secondary">100% Completed</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container">
                      <div className="h-2 rounded-full bg-secondary" style={{ width: "100%" }} />
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 inline-block">Concluded March 28 across all 6 SW States</span>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">2. Sowing &amp; Germination</span>
                      <span className="font-label-md text-label-md font-bold text-secondary">92% Completed</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container">
                      <div className="h-2 rounded-full bg-secondary" style={{ width: "92%" }} />
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 inline-block">Late plantings concentrated in Oke-Ogun river basin</span>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">3. Vegetative Growth &amp; Nitrogen Top-Dress</span>
                      <span className="font-label-md text-label-md font-bold text-primary">64% In Progress</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container">
                      <div className="h-2 rounded-full bg-primary" style={{ width: "64%" }} />
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 inline-block">Current active agricultural window (FMAFS Urea Vouchers 88% applied)</span>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">4. Early Harvest Window (Fresh Maize &amp; Yam)</span>
                      <span className="font-label-md text-label-md font-semibold text-on-surface-variant">Target: July 15, 2026</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container">
                      <div className="h-2 rounded-full bg-outline-variant" style={{ width: "14%" }} />
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 inline-block">Anticipated market arrival to curb food price basket inflation</span>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="sunny" className="text-secondary text-[24px]" />
                    <div>
                      <div className="font-label-md text-label-md font-semibold text-on-surface">Accumulated Thermal Heat Units</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">Growing Degree Days: 1,420 GDD (Optimal)</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-surface-container-lowest text-secondary font-label-sm text-label-sm font-bold shadow-xs">NORMAL</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Scouting Drone &amp; Sat Imagery</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Station: IITA/FMAFS Ibadan</span>
                </div>
                <div className="relative rounded-lg overflow-hidden h-40">
                  <img className="w-full h-full object-cover" data-alt="High-resolution aerial satellite imagery of vast lush green agricultural farmland in Oyo state Nigeria showing well-organized contour plots, healthy maize canopy, clear drainage canals, early morning soft natural sunlight, captured from an ag-drone survey perspective." src="/images/screens/493e0ab5e3a8.webp" alt="" loading="lazy" decoding="async" />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold shadow-sm">NDVI Vigor: 0.81 (Extremely Healthy)</div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Multi-spectral multispectral orthomosaics demonstrate uniform canopies with minimal moisture stress across Ibarapa North &amp; South clusters.</p>
              </div>
            </div>
          </section>
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">§10.3 Programme Monitoring</span>
                <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Public Interventions &amp; Subsidy Queue</h2>
              </div>
              <div className="flex items-center gap-space-sm">
                <button onClick={() => showScreenToast("Subsidy audit ledger verified: ₦1,240,000,000 reconciles with CBN Anchor Borrowers escrow.")} className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors" type="button">Audit Ledger</button>
                <button onClick={() => showScreenToast("Tranche 2 disbursement queued: ₦420M allocated to verified biometric smallholder vouchers.")} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors" type="button">Disburse Tranche 2</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Intervention Programme</th>
                    <th className="py-3 px-4 font-semibold">Capital Allocation</th>
                    <th className="py-3 px-4 font-semibold">Disbursed / Delivered</th>
                    <th className="py-3 px-4 font-semibold">Smallholder Beneficiaries</th>
                    <th className="py-3 px-4 font-semibold">Geospatial Integrity</th>
                    <th className="py-3 px-4 font-semibold text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm divide-y-0">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <div>
                          <div className="font-label-md text-label-md text-primary font-bold">NAGS-AP 2026 Maize-Cassava Subsidy</div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm">Federal agro-input input voucher program</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">₦420,000,000</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-secondary">₦312,000,000</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">74.2% Drawdown</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">21,500 <span className="font-normal text-on-surface-variant">Farmers</span></td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 100% PostGIS Geofenced</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">Audited &amp; Active</span>
                    </td>
                  </tr>
                  <tr className="bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <div>
                          <div className="font-label-md text-label-md text-primary font-bold">OYSADEP Clean Certified Seeds Scheme</div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm">Oyo State Agricultural Development Programme</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">₦85,000,000</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-secondary">₦83,300,000</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">98.0% Delivered</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">6,400 <span className="font-normal text-on-surface-variant">Youth &amp; Women</span></td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Biometric Verified</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">Completed</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <div>
                          <div className="font-label-md text-label-md text-primary font-bold">Ogun Green Basin Irrigated Rice Scheme</div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm">River basin modernization initiative</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">₦180,000,000</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">14 Solar Pumps</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">1,500 Ha Double-Cropped</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">3,850 <span className="font-normal text-on-surface-variant">Rice Producers</span></td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> IoT Sensor Streamed</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Pumping Live</span>
                    </td>
                  </tr>
                  <tr className="bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <div>
                          <div className="font-label-md text-label-md text-primary font-bold">AfDB Special Agro-Industrial Zone (SAPZ)</div>
                          <div className="text-on-surface-variant font-body-sm text-body-sm">Heavy fleet &amp; post-harvest processing cluster</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">₦620,000,000</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">38 Tractor Hubs</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Oke-Ogun &amp; Ibarapa Syndicates</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">10,430 <span className="font-normal text-on-surface-variant">Cluster Farmers</span></td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> GPS Telematics</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">Phase 2 Deployed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
            <section className="xl:col-span-7 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="price_change" className="text-secondary text-[20px]" />
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">§10.3 &amp; §10.6 Price Watchdog</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Farm-Gate vs. Urban Wholesale Spread Tracker</h3>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Daily Spot Survey</span>
              </div>
              <div className="space-y-space-md">
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="grain" className="text-primary text-[20px]" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">White Maize (Grain, Cleaned)</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold">Spread: ₦95/kg (Fair Margin)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Farm-Gate (Saki / Iseyin)</span>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">₦580 <span className="font-body-sm text-body-sm text-on-surface-variant">/kg</span></span>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Wholesale (Bodija, Ibadan)</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₦740 <span className="font-body-sm text-body-sm text-on-surface-variant">/kg</span></span>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Logistics &amp; Haulage Toll</span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-bold">₦65 <span className="font-body-sm text-body-sm text-on-surface-variant">/kg freight</span></span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="nutrition" className="text-primary text-[20px]" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">Industrial Wet Cassava Roots</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold">Supply: High Factory Demand</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Farm-Gate (Oyo/Ogun Belt)</span>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">₦85,000 <span className="font-body-sm text-body-sm text-on-surface-variant">/MT</span></span>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Factory Gate (Psaltry/FMN)</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₦115,000 <span className="font-body-sm text-body-sm text-on-surface-variant">/MT</span></span>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Starch Content Benchmark</span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-bold">22.4% <span className="font-body-sm text-body-sm text-on-surface-variant">Grade A</span></span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="rice_bowl" className="text-primary text-[20px]" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">Lowland Milled Rice (Faro-44)</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold">Lagos Terminal Spread: ₦230/kg</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Farm-Gate (Ogun Basin Mill)</span>
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">₦1,250 <span className="font-body-sm text-body-sm text-on-surface-variant">/kg</span></span>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Mile 12 Lagos Wholesale</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">₦1,480 <span className="font-body-sm text-body-sm text-on-surface-variant">/kg</span></span>
                    </div>
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Retail Bag Equilibrium</span>
                      <span className="font-headline-sm text-headline-sm text-secondary font-bold">₦74,000 <span className="font-body-sm text-body-sm text-on-surface-variant">/50kg</span></span>
                    </div>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-high/40 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                      <Icon name="warehouse" className="text-[20px]" />
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Federal Grain Reserve Silos</span>
                      <div className="font-label-md text-label-md text-primary font-bold">Saki National Strategic Silo Complex (45,000 MT Capacity)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-metric-num text-metric-num text-secondary">68%</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">30,600 MT Stocked</div>
                    </div>
                    <div className="w-16 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: "68%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="xl:col-span-5 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="warning" className="text-error text-[20px]" />
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-error font-semibold">§10.3 Risk Intelligence</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Environmental &amp; Weather Alerts</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">3 Active</span>
              </div>
              <div className="space-y-space-sm">
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="pest_control" className="text-secondary text-[20px]" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">Fall Armyworm &amp; Stem Borer</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">Low Severity</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Sporadic pheromone trap triggers reported in Oyo Savanna (Itesiwaju &amp; Atisbo LGAs). Biological control dispatch units deployed by IITA Extension Taskforce.</p>
                  <div className="mt-1 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Trap Density: 1.2 / trap / night</span>
                    <span className="text-secondary font-semibold">Contained</span>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="flood" className="text-error text-[20px]" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">Ogun River Flash Flood Alert</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">High Vulnerability</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Oyan Dam controlled spillway discharge scheduled for mid-June. 1,200 lowland rice hectares downstream in Obafemi Owode LGA placed on early bund-reinforcement mandate.</p>
                  <div className="mt-1 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Sensor Basin Stage: 8.4m (Warning: 9.0m)</span>
                    <span className="text-error font-semibold">Immediate Bunding</span>
                  </div>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="inventory" className="text-tertiary-container text-[20px]" />
                      <span className="font-label-md text-label-md font-bold text-on-surface">Fertilizer Depot Discrepancy</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">Audit Required</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">2 redemption depots in Osun State (Ife North &amp; Ede South) flagged a 140 MT variance between digital e-vouchers validated and physical warehouse gate-pass receipts.</p>
                  <div className="mt-1 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Auditor Dispatched: FMAFS Special Ops</span>
                    <span className="text-primary font-semibold">Investigation Live</span>
                  </div>
                </div>
              </div>
              <div className="p-space-md rounded-xl bg-primary text-on-primary flex items-center justify-between gap-space-sm shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center">
                    <Icon name="notification_important" className="text-secondary-fixed text-[22px]" />
                  </div>
                  <div>
                    <div className="font-label-md text-label-md font-bold text-on-primary">Sovereign Ministerial Flash Dispatch</div>
                    <div className="font-body-sm text-body-sm text-on-primary-container">Generate emergency State Executive Council memo</div>
                  </div>
                </div>
                <button onClick={() => showScreenToast("Emergency Ministerial Flash Dispatch delivered to 6 State Executive Councils & NEMA.")} className="px-3.5 py-2 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold hover:bg-secondary/90 transition-colors shrink-0" type="button">Dispatch Memo</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
