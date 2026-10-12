"use client";

// Ported from the "enterprise_agricultural_management_dashboard_10.1" design. Interactive client workspace
// with live ERP synchronization, CSV board pack export, central approvals queue, and estate telemetry modals.
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { downloadFile } from "@/lib/download";
import { showScreenToast } from "@/components/ds/screen-dialog";
import type { ScreenProps } from "./types";

interface ApprovalItem {
  id: string;
  title: string;
  estate: string;
  amount: string;
  status: "pending" | "authorized" | "reviewed";
}

export function EnterpriseDashboard({ lang }: ScreenProps) {
  const [syncing, setSyncing] = useState(false);
  const [activeEstateModal, setActiveEstateModal] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: "app-1",
      title: "Bulk Urea 400 MT Procurement",
      estate: "Oke-Ogun Hub · ₦64,800,000.00",
      amount: "₦64,800,000.00",
      status: "pending",
    },
    {
      id: "app-2",
      title: "Low-Bed Haulage Fleet 30-Day Lease",
      estate: "Egba & Sagamu · ₦18,250,000.00",
      amount: "₦18,250,000.00",
      status: "pending",
    },
    {
      id: "app-3",
      title: "Combine Harvester Radial Tires (x12)",
      estate: "Fleet Central Depot · ₦8,400,000.00",
      amount: "₦8,400,000.00",
      status: "pending",
    },
  ]);

  const pendingCount = 12 - approvals.filter((a) => a.status !== "pending").length;

  const handleDownloadBoardPack = () => {
    const csvContent = [
      "Conglomerate_Entity,Reporting_Period,Cadastral_Land_Ha,Cultivated_Ha,Revenue_YTD_NGN,OpEx_YTD_NGN,EBITDA_YTD_NGN,Headcount,Fleet_Units,ERP_Connector",
      "Odua Agro-Enterprises PLC,2026 Early Rains,8420.0,6150.0,1840000000.00,942500000.00,897500000.00,3420,124,SAP S4HANA & PostGIS",
      "",
      "Estate_Name,Zone,Hectares,Primary_Crops,Yield_Metric,OpEx_NGN,Revenue_NGN,Net_Margin_Pct,Manager",
      "Oke-Ogun Savanna Agro-Hub,Saki & Iseyin,3200,Grain Maize & Soya,4.3 MT/Ha (+12%),340000000,710000000,52.1%,Engr. Kayode Adebayo",
      "Egba Cassava & Starch Plantation,Abeokuta North,2100,TME-419 Cassava,24.2 MT/Ha,228000000,495000000,53.9%,Chief Adeleke Ogundimu",
      "Ogun Green River Basin Scheme,Sagamu & Ijebu,1500,Faro-44 Lowland Paddy,88% Saturation,195000000,380000000,48.7%,Alhaji Kazeem Gbadamosi",
      "Osun Oil Palm & Agroforestry Estate,Ejigbo & Ede,1620,Fresh Fruit Bunches,Perennial Grove,179500000,255000000,29.6%,Mrs. Funmilayo Adewale",
    ].join("\n");

    downloadFile(`odua-agro-enterprises-consolidated-board-pack-${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    showScreenToast("Consolidated Board Pack (.csv) downloaded successfully");
  };

  const handleForceSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      showScreenToast("Multi-Tenant ERP & PostGIS Cadastre Synchronized (0ms latency)");
    }, 850);
  };

  const handleAuthorize = (id: string, title: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "authorized" } : item))
    );
    showScreenToast(`Authorized: ${title}`);
  };

  const handleReview = (id: string, title: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "reviewed" } : item))
    );
    showScreenToast(`VP Approval Recorded: ${title}`);
  };
  return (
    <div className="screen">
      <div className="flex flex-col w-full">
        <section className="flex flex-col gap-space-sm mb-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-sm px-space-md py-space-xs bg-surface-container-high rounded-lg shadow-sm">
            <div className="flex items-center gap-space-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-md text-label-md text-primary tracking-wide uppercase">Consolidated Group Entity: Odua Agro-Enterprises PLC</span>
              <span className="text-outline text-label-sm">|</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1"><Icon name="cloud_done" className="text-[16px] text-secondary" /> Multi-Tenant ERP Synchronization Online (SAP S/4HANA &amp; PostGIS Engine)</span>
            </div>
            <div className="flex items-center gap-space-md text-label-sm font-label-sm">
              <span className="text-on-surface-variant">Cluster Audit Cycle: <strong className="text-on-surface">2026 Early Rains Active</strong></span>
              <span className="px-space-sm py-0.5 rounded bg-surface-container-lowest text-primary shadow-sm font-semibold">CAMA 2020 &amp; IFRS-15 Verified</span>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="px-space-sm py-0.5 bg-primary-container text-on-primary-container rounded font-label-sm text-label-sm uppercase tracking-wider">Multi-Estate HQ Command §10.1</span>
                <span className="text-outline text-label-sm font-label-sm">Spec §3.6 &amp; §14 Enterprise Admin Active</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Agro-Allied Conglomerate Operations Command</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">West Africa Estates Division · Consolidated Regional Telemetry across 6 Commercial Estates &amp; 8 Agro-Processing Mills</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm">
              <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg shadow-sm">
                <Icon name="domain" className="text-secondary text-[22px]" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Portfolio Scope</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">All 6 Estates &amp; 8 Processing Plants</span>
                </div>
                <Icon name="unfold_more" className="text-outline text-[18px] ml-space-sm" />
              </div>
              <button onClick={handleDownloadBoardPack} className="flex items-center justify-center gap-space-xs px-space-md py-space-sm bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-container transition-colors font-label-lg text-label-lg" type="button"><Icon name="download" className="text-[18px]" /> Consolidated Board Pack</button>
            </div>
          </div>
        </section>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md mb-space-xl">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Consolidated Land</span>
              <Icon name="crop_free" className="text-secondary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary">8,420 <span className="text-body-sm font-body-sm text-on-surface-variant">Ha</span></div>
              <p className="font-body-sm text-body-sm text-on-surface mt-1">6,150 Ha Cultivated (73%)</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low p-space-xs rounded text-label-sm font-label-sm text-on-surface-variant flex justify-between">
              <span>Fallow: 1,420 Ha</span>
              <span>Infra: 850 Ha</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Group Revenue YTD</span>
              <Icon name="payments" className="text-secondary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary">₦1.84 <span className="text-body-sm font-body-sm text-on-surface-variant">Billion</span></div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm mt-1"><Icon name="trending_up" className="text-[16px]" /> +31.2% YoY vs Budget</div>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low p-space-xs rounded text-label-sm font-label-sm text-on-surface-variant">Cash Inflow: ₦1.68B Bank Validated</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Consolidated OpEx</span>
              <Icon name="account_balance_wallet" className="text-tertiary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-on-surface">₦942.50<span className="text-body-sm font-body-sm text-on-surface-variant">M</span></div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm mt-1"><Icon name="arrow_downward" className="text-[16px]" /> -7.1% efficiency saving</div>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low p-space-xs rounded text-label-sm font-label-sm text-on-surface-variant">₦153,250/Ha (Bench: ₦165k)</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Group EBITDA</span>
              <Icon name="analytics" className="text-primary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary">₦897.50<span className="text-body-sm font-body-sm text-on-surface-variant">M</span></div>
              <p className="font-body-sm text-body-sm text-on-surface font-semibold mt-1">48.8% Blended Margin</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-secondary-fixed text-on-secondary-fixed p-space-xs rounded text-label-sm font-label-sm font-semibold text-center">Arable &amp; Mills Integrated</div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Workforce Headcount</span>
              <Icon name="badge" className="text-outline text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-on-surface">3,420 <span className="text-body-sm font-body-sm text-on-surface-variant">Ppl</span></div>
              <p className="font-body-sm text-body-sm text-secondary font-semibold mt-1">99.2% Biometric Check-in</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low p-space-xs rounded text-label-sm font-label-sm text-on-surface-variant flex justify-between">
              <span>320 Core Staff</span>
              <span>3.1k Seasonal</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Fleet Utilization</span>
              <Icon name="agriculture" className="text-secondary text-[20px]" />
            </div>
            <div>
              <div className="font-metric-num text-metric-num text-primary">91.4%</div>
              <p className="font-body-sm text-body-sm text-on-surface mt-1">124 Heavy Units Live</p>
            </div>
            <div className="mt-space-sm pt-space-xs bg-surface-container-low p-space-xs rounded text-label-sm font-label-sm text-on-surface-variant flex justify-between">
              <span>64 Tractors</span>
              <span>18 Combines</span>
            </div>
          </div>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="relative bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-5/12 relative h-48 md:h-auto min-h-[190px]">
                <img className="w-full h-full object-cover" data-alt="Expansive panoramic drone view of industrial grain maize and cassava agro-estate in Oke-Ogun savanna Nigeria with center pivot irrigation and modern tractors in equatorial sunlight" src="/images/screens/c8f99a9e40d3.webp" alt="" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-container-lowest/90 hidden md:block" />
                <div className="absolute top-space-sm left-space-sm bg-primary/80 backdrop-blur-sm text-on-primary text-label-sm font-label-sm px-space-sm py-1 rounded">Cadastral Boundary PostGIS Active</div>
              </div>
              <div className="md:w-7/12 p-space-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-space-sm mb-space-xs">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-label-sm text-label-sm uppercase text-secondary font-semibold">Agronomic Cycle 2026 Telemetry</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary">Estate Production &amp; Value-Chain Sync</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Synchronized agro-dealer input flow, satellite NDVI health metrics, and automated weighbridge logging across Oyo, Ogun, Osun, Ondo, and Edo estates.</p>
                </div>
                <div className="grid grid-cols-3 gap-space-sm mt-space-md pt-space-sm bg-surface-container-low p-space-sm rounded-lg">
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Active Parcels</span>
                    <span className="font-headline-sm text-headline-sm text-primary">184 Blocks</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Avg Field NDVI</span>
                    <span className="font-headline-sm text-headline-sm text-secondary">0.78 (Optimum)</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-outline block">Logistics Hauls</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">42 Fleet Dispatched</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary">Farm-to-Farm Estate Performance Benchmark</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Real-time yields, operating expenditures, and mill linkages (§10.1 Operational Management)</p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">4 Active Anchor Estates</span>
                </div>
              </div>
              <div className="space-y-space-md">
                <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-space-sm flex-wrap">
                      <span className="font-headline-sm text-headline-sm text-primary">Oke-Ogun Savanna Agro-Hub (Saki &amp; Iseyin)</span>
                      <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">High Efficiency</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                      <span><strong className="text-on-surface font-semibold">3,200 Ha</strong> Arable</span>
                      <span>Crops: <strong>Grain Maize &amp; Industrial Soya</strong></span>
                      <span>Manager: <strong>Engr. Kayode Adebayo</strong></span>
                    </div>
                    <div className="flex items-center gap-space-md mt-space-sm pt-space-xs text-body-sm">
                      <span className="text-secondary font-semibold flex items-center gap-1"><Icon name="eco" className="text-[16px]" /> Yield: 4.3 MT/Ha (+12% vs target)</span>
                      <span className="text-outline">·</span>
                      <span>OpEx: <strong>₦340M</strong></span>
                      <span className="text-outline">·</span>
                      <span className="text-primary font-semibold">Revenue: <strong>₦710M</strong></span>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-space-sm">
                    <span className="text-label-sm font-label-sm px-space-sm py-1 bg-surface-container-lowest rounded text-primary font-bold">52.1% Net Margin</span>
                    <button onClick={() => setActiveEstateModal("oke-ogun")} className="px-space-md py-1.5 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-sm text-label-sm rounded shadow-sm" type="button">Estate Telemetry</button>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-space-sm flex-wrap">
                      <span className="font-headline-sm text-headline-sm text-primary">Egba Cassava &amp; Starch Plantation (Abeokuta North)</span>
                      <span className="px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Optimal</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                      <span><strong className="text-on-surface font-semibold">2,100 Ha</strong> Industrial Root</span>
                      <span>Crops: <strong>TME-419 Starch Cassava</strong></span>
                      <span>Offtake: <strong>Direct to Psaltry Starch Plant</strong></span>
                    </div>
                    <div className="flex items-center gap-space-md mt-space-sm pt-space-xs text-body-sm">
                      <span className="text-secondary font-semibold flex items-center gap-1"><Icon name="sync_alt" className="text-[16px]" /> Inflow: 24.2 MT/Ha</span>
                      <span className="text-outline">·</span>
                      <span>OpEx: <strong>₦228M</strong></span>
                      <span className="text-outline">·</span>
                      <span className="text-primary font-semibold">Revenue: <strong>₦495M</strong></span>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-space-sm">
                    <span className="text-label-sm font-label-sm px-space-sm py-1 bg-surface-container-lowest rounded text-secondary font-bold">100% Factory Offtake</span>
                    <button onClick={() => setActiveEstateModal("egba")} className="px-space-md py-1.5 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-sm text-label-sm rounded shadow-sm" type="button">Weighbridge Data</button>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-space-sm flex-wrap">
                      <span className="font-headline-sm text-headline-sm text-primary">Ogun Green River Basin Rice Scheme (Sagamu &amp; Ijebu)</span>
                      <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">On Track</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                      <span><strong className="text-on-surface font-semibold">1,500 Ha</strong> Paddy Fields</span>
                      <span>Crops: <strong>Faro-44 Lowland Paddy</strong></span>
                      <span>System: <strong>Irrigated Gravity Pumping</strong></span>
                    </div>
                    <div className="flex items-center gap-space-md mt-space-sm pt-space-xs text-body-sm">
                      <span className="text-on-surface-variant font-semibold flex items-center gap-1"><Icon name="water_drop" className="text-[16px] text-secondary" /> Soil Saturation 88%</span>
                      <span className="text-outline">·</span>
                      <span>OpEx: <strong>₦195M</strong></span>
                      <span className="text-outline">·</span>
                      <span className="text-primary font-semibold">Revenue: <strong>₦380M</strong></span>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-space-sm">
                    <span className="text-label-sm font-label-sm px-space-sm py-1 bg-surface-container-lowest rounded text-on-surface font-bold">Basin Pumping Active</span>
                    <button onClick={() => setActiveEstateModal("ogun-basin")} className="px-space-md py-1.5 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-sm text-label-sm rounded shadow-sm" type="button">Paddy Sluices</button>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-space-md justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-space-sm flex-wrap">
                      <span className="font-headline-sm text-headline-sm text-primary">Osun Oil Palm &amp; Agroforestry Estate (Ejigbo &amp; Ede)</span>
                      <span className="px-space-sm py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">Maintenance Scheduled</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-md mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                      <span><strong className="text-on-surface font-semibold">1,620 Ha</strong> Perennial Grove</span>
                      <span>Crops: <strong>Fresh Fruit Bunches (FFB)</strong></span>
                      <span>Processing: <strong>Semi-automated Mill Unit 3</strong></span>
                    </div>
                    <div className="flex items-center gap-space-md mt-space-sm pt-space-xs text-body-sm">
                      <span className="text-error font-semibold flex items-center gap-1"><Icon name="build" className="text-[16px]" /> Turbine Overhaul 48h</span>
                      <span className="text-outline">·</span>
                      <span>OpEx: <strong>₦179.5M</strong></span>
                      <span className="text-outline">·</span>
                      <span className="text-primary font-semibold">Revenue: <strong>₦255M</strong></span>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-space-sm">
                    <span className="text-label-sm font-label-sm px-space-sm py-1 bg-surface-container-lowest rounded text-error font-bold">Mill Offline: 24h</span>
                    <button onClick={() => setActiveEstateModal("osun-palm")} className="px-space-md py-1.5 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-sm text-label-sm rounded shadow-sm" type="button">Maintenance Log</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="assignment_turned_in" className="text-secondary text-[20px]" />
                      <h3 className="font-headline-sm text-headline-sm text-primary">Central Approval Queue</h3>
                    </div>
                    <span className="px-space-sm py-0.5 rounded-full bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-bold">{pendingCount} Pending MD/CFO</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">Requisitions exceeding local Estate Manager threshold (Tier 2 &amp; Tier 3 approvals).</p>
                  <div className="space-y-space-xs">
                    {approvals.map((app) => (
                      <div key={app.id} className="p-space-xs bg-surface-container-low rounded flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface font-semibold">{app.title}</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{app.estate}</span>
                        </div>
                        {app.status === "authorized" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                            <Icon name="check_circle" className="text-[14px]" /> Dispatched
                          </span>
                        ) : app.status === "reviewed" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold">
                            <Icon name="verified" className="text-[14px]" /> VP Signed
                          </span>
                        ) : (
                          <button
                            onClick={() => (app.id === "app-3" ? handleReview(app.id, app.title) : handleAuthorize(app.id, app.title))}
                            className={
                              app.id === "app-3"
                                ? "px-space-sm py-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded font-label-sm text-label-sm font-semibold transition-colors"
                                : "px-space-sm py-1 bg-primary hover:bg-primary-container text-on-primary rounded font-label-sm text-label-sm font-semibold transition-colors"
                            }
                            type="button"
                          >
                            {app.id === "app-3" ? "VP Review" : "Authorize"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-space-sm pt-space-xs flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
                  <span>Delegated Authority: Board Limit &gt;₦10M</span>
                  <Link className="text-secondary font-semibold hover:underline" href={`/${lang}/account/inventory`}>View All 12 Items</Link>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-xs">
                    <div className="flex items-center gap-space-xs">
                      <Icon name="filter_center_focus" className="text-secondary text-[20px]" />
                      <h3 className="font-headline-sm text-headline-sm text-primary">Inter-Company Elimination</h3>
                    </div>
                    <span className="px-space-sm py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Sentinel Active</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">Automated ledger reconciliation eliminating internal double-counting between estates and processing plants.</p>
                  <div className="space-y-space-xs bg-surface-container-low p-space-sm rounded-lg">
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Gross Agro-Internal Billings:</span>
                      <span className="font-semibold text-on-surface">₦412,600,000.00</span>
                    </div>
                    <div className="flex justify-between items-center text-body-sm text-secondary">
                      <span className="flex items-center gap-1"><Icon name="check_circle" className="text-[16px]" /> Auto-Eliminated in Consolidation:</span>
                      <span className="font-semibold">-₦412,600,000.00</span>
                    </div>
                    <div className="flex justify-between items-center text-body-sm pt-space-xs">
                      <span className="font-semibold text-primary">Net Consolidated Arm&apos;s-Length:</span>
                      <span className="font-bold text-primary">₦1,840,000,000.00</span>
                    </div>
                  </div>
                </div>
                <div className="mt-space-sm pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1"><Icon name="verified" className="text-[14px] text-secondary" /> IFRS-15 Section 8 Reconciled</span>
                  <span className="text-outline">Zero Out-of-Period Discrepancy</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="font-headline-sm text-headline-sm text-primary">Cost-Centre Allocation</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">₦942.50M OpEx Distribution</span>
                </div>
                <Icon name="pie_chart" className="text-outline text-[22px]" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <div className="h-4 w-full bg-surface-container rounded-full overflow-hidden flex shadow-sm">
                  <div className="bg-primary h-full" style={{ width: "32%" }} title="Crop Nutrition: 32%" />
                  <div className="bg-secondary h-full" style={{ width: "28%" }} title="Mechanization & Fleet: 28%" />
                  <div className="bg-secondary-fixed-dim h-full" style={{ width: "22%" }} title="Direct Field Labour: 22%" />
                  <div className="bg-tertiary-fixed-dim h-full" style={{ width: "12%" }} title="Logistics & Warehousing: 12%" />
                  <div className="bg-outline-variant h-full" style={{ width: "6%" }} title="Compliance & Insurance: 6%" />
                </div>
                <div className="flex justify-between text-label-sm font-label-sm text-outline">
                  <span>Agronomy 32%</span>
                  <span>Fleet 28%</span>
                  <span>Labour 22%</span>
                  <span>Haulage 12%</span>
                </div>
              </div>
              <div className="space-y-space-sm pt-space-xs">
                <div className="flex items-center justify-between p-space-xs bg-surface-container-low rounded text-body-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="font-semibold text-on-surface">Crop Nutrition &amp; Agrochemicals</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary">₦301.6M</span>
                    <span className="text-label-sm font-label-sm text-on-surface-variant block">32.0%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-space-xs bg-surface-container-low rounded text-body-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <span className="font-semibold text-on-surface">Mechanization &amp; Diesel Fleet</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface">₦263.9M</span>
                    <span className="text-label-sm font-label-sm text-on-surface-variant block">28.0%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-space-xs bg-surface-container-low rounded text-body-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim" />
                    <span className="font-semibold text-on-surface">Direct Field Labour &amp; Crew</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface">₦207.3M</span>
                    <span className="text-label-sm font-label-sm text-on-surface-variant block">22.0%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-space-xs bg-surface-container-low rounded text-body-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim" />
                    <span className="font-semibold text-on-surface">Post-Harvest Haulage &amp; Storage</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface">₦113.1M</span>
                    <span className="text-label-sm font-label-sm text-on-surface-variant block">12.0%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-space-xs bg-surface-container-low rounded text-body-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                    <span className="font-semibold text-on-surface">Insurance &amp; Compliance Overheads</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface">₦56.6M</span>
                    <span className="text-label-sm font-label-sm text-on-surface-variant block">6.0%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="font-headline-sm text-headline-sm text-primary">Enterprise Risk Register</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Underwriting &amp; Contingency Status</span>
                </div>
                <Icon name="warning" className="text-error text-[22px]" />
              </div>
              <div className="space-y-space-sm">
                <div className="bg-error-container/20 p-space-sm rounded-lg flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-space-xs py-0.5 rounded bg-error text-on-error font-label-sm text-label-sm font-semibold">HIGH PRIORITY</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Meteorological</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface text-[15px]">Monsoon Deluge Forecast (Ogun Basin)</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Severe 72h precipitation warning in Sagamu lowland. 8 high-capacity centrifugal drainage pumps mobilized to prevent paddy waterlogging.</p>
                  <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold mt-1"><Icon name="check_circle" className="text-[16px]" /> Mitigation in effect (Sluices Open)</div>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-space-xs py-0.5 rounded bg-tertiary-container text-on-tertiary font-label-sm text-label-sm font-semibold">MEDIUM PRIORITY</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Market Hedge</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface text-[15px]">Automotive Gas Oil (Diesel) Fluctuation</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Ex-depot Apapa spot price volatility. Central procurement locked 60-day fuel hedge at ₦1,280/Litre for 380,000 Litres depot reserve.</p>
                  <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold mt-1"><Icon name="lock" className="text-[16px]" /> ₦486.4M Exposure Hedged</div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-headline-sm text-primary">Governance Matrix (§14)</h3>
                <Icon name="gavel" className="text-outline text-[20px]" />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Delegated Financial Authority Limits &amp; Dual-Control Validation Hierarchy:</p>
              <div className="space-y-space-xs pt-space-xs">
                <div className="p-space-xs bg-surface-container-low rounded flex items-center justify-between text-body-sm">
                  <span className="text-on-surface font-semibold">Estate Resident Manager</span>
                  <span className="font-label-sm text-label-sm px-space-sm py-0.5 bg-surface-container rounded text-primary font-bold">Limit: ≤₦2.0M</span>
                </div>
                <div className="p-space-xs bg-surface-container-low rounded flex items-center justify-between text-body-sm">
                  <span className="text-on-surface font-semibold">VP Agribusiness Operations</span>
                  <span className="font-label-sm text-label-sm px-space-sm py-0.5 bg-surface-container rounded text-primary font-bold">Limit: ≤₦10.0M</span>
                </div>
                <div className="p-space-xs bg-surface-container-low rounded flex items-center justify-between text-body-sm">
                  <span className="text-on-surface font-semibold">Group MD &amp; Board Escrow</span>
                  <span className="font-label-sm text-label-sm px-space-sm py-0.5 bg-primary-container text-on-primary-container rounded font-bold">Limit: &gt;₦10.0M Dual Sign</span>
                </div>
              </div>
              <div className="mt-space-sm p-space-xs bg-secondary-fixed text-on-secondary-fixed rounded text-label-sm font-label-sm flex items-center gap-space-xs">
                <Icon name="verified_user" className="text-[16px]" />
                <span>Dual KYC &amp; Bank Biometric Token Enforcement Active</span>
              </div>
            </div>
          </div>
        </div>
        <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md mb-space-sm flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex flex-wrap items-center gap-space-lg text-body-sm font-body-sm text-on-surface-variant">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="font-semibold text-on-surface">SAP / Oracle ERP Connector Sync:</span>
              <span className="text-secondary font-bold">100% Operational (0 Latency)</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <Icon name="map" className="text-secondary text-[18px]" />
              <span className="font-semibold text-on-surface">PostGIS GIS Cadastral Layer:</span>
              <span>Verified (8,420 Ha Delineated)</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <Icon name="security" className="text-primary text-[18px]" />
              <span className="font-semibold text-on-surface">Data Custody:</span>
              <span>NDPA 2023 Enterprise Certified</span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="font-label-sm text-label-sm text-outline">Telemetry Refresh: 15s</span>
            <button
              onClick={handleForceSync}
              disabled={syncing}
              className="flex items-center gap-1 px-space-sm py-1 bg-surface-container hover:bg-surface-container-high rounded text-primary font-label-sm text-label-sm font-semibold transition-colors disabled:opacity-50"
              type="button"
            >
              <Icon name="refresh" className={`text-[16px] ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing ERP..." : "Force Audit Sync"}
            </button>
          </div>
        </section>

        {activeEstateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-space-md backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full p-space-lg shadow-elevation-3 border border-outline-variant flex flex-col gap-space-md animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-outline-variant pb-space-sm">
                <div className="flex items-center gap-space-xs text-primary font-headline-sm">
                  <Icon name="analytics" className="text-[22px]" />
                  <span>
                    {activeEstateModal === "oke-ogun" && "Oke-Ogun Savanna Telemetry Hub"}
                    {activeEstateModal === "egba" && "Egba Weighbridge & Intake Registry"}
                    {activeEstateModal === "ogun-basin" && "Ogun Basin Sluice & Irrigation Matrix"}
                    {activeEstateModal === "osun-palm" && "Osun Palm Processing Mill Telemetry"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEstateModal(null)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>

              <div className="text-body-sm text-on-surface space-y-space-sm">
                {activeEstateModal === "oke-ogun" && (
                  <>
                    <p className="text-on-surface-variant">Live telemetry feed from Saki &amp; Iseyin agro-monitoring stations:</p>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">NDVI Canopy Health</div>
                        <div className="text-title-md font-bold text-secondary">0.78 (Optimal)</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Soil Moisture (30cm)</div>
                        <div className="text-title-md font-bold text-primary">34.2% Volumetric</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Tractor Fleet Status</div>
                        <div className="text-title-md font-bold text-on-surface">14 of 16 Active</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Grain Silo Capacity</div>
                        <div className="text-title-md font-bold text-on-surface">4,800 MT (71%)</div>
                      </div>
                    </div>
                  </>
                )}
                {activeEstateModal === "egba" && (
                  <>
                    <p className="text-on-surface-variant">Abeokuta North digital weighbridge intake ledger:</p>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Today&apos;s Intake</div>
                        <div className="text-title-md font-bold text-primary">184.6 MT</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Truck Turnaround</div>
                        <div className="text-title-md font-bold text-secondary">19 mins avg</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Psaltry Starch Sync</div>
                        <div className="text-title-md font-bold text-secondary">Direct Electronic Manifest</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Starch Yield Index</div>
                        <div className="text-title-md font-bold text-on-surface">24.2% Density</div>
                      </div>
                    </div>
                  </>
                )}
                {activeEstateModal === "ogun-basin" && (
                  <>
                    <p className="text-on-surface-variant">Sagamu &amp; Ijebu lowland irrigation status:</p>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Active Sluices</div>
                        <div className="text-title-md font-bold text-primary">Canals A, B, C Open</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Flow Rate</div>
                        <div className="text-title-md font-bold text-secondary">450 L/sec</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Paddy Saturation</div>
                        <div className="text-title-md font-bold text-primary">88% (Target 85-90%)</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Standby Pumps</div>
                        <div className="text-title-md font-bold text-on-surface">Dual Diesel Online</div>
                      </div>
                    </div>
                  </>
                )}
                {activeEstateModal === "osun-palm" && (
                  <>
                    <p className="text-on-surface-variant">Ejigbo processing facility maintenance &amp; telemetry:</p>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Turbine Unit 3</div>
                        <div className="text-title-md font-bold text-error">Overhaul (ETA 24h)</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Holding Tanks</div>
                        <div className="text-title-md font-bold text-on-surface">1,200 MT Buffer Active</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Spare Parts Docket</div>
                        <div className="text-title-md font-bold text-secondary">Dispatched from Depot</div>
                      </div>
                      <div className="p-space-sm bg-surface-container-low rounded">
                        <div className="text-label-sm text-outline">Lead Engineer</div>
                        <div className="text-title-md font-bold text-on-surface">Signed Off (Mrs. Adewale)</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    const csv = `Estate,Metric,Value\n${activeEstateModal},Telemetry_Status,Operational\n${activeEstateModal},Timestamp,${new Date().toISOString()}`;
                    downloadFile(`odua-${activeEstateModal}-telemetry.csv`, csv);
                    showScreenToast(`Downloaded ${activeEstateModal} telemetry report`);
                  }}
                  className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-label-sm rounded text-label-sm font-semibold transition-colors"
                >
                  Download Dossier (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEstateModal(null)}
                  className="px-space-md py-1.5 bg-primary text-on-primary hover:bg-primary/90 font-label-sm rounded text-label-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
