// Ported from the "farm_geospatial_map_cadastre_command_8.2" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import type { ScreenProps } from "./types";

export function FarmGeospatialMap({ lang }: ScreenProps) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full space-y-space-md pb-space-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
              <Link className="hover:text-primary transition-colors" href={`/${lang}/account/farms`}>Farms</Link>
              <Icon name="chevron_right" className="text-sm" />
              <span className="text-on-surface font-semibold">Oke-Ogun Pioneer Agrarian Estate (#NG-OYO-082)</span>
              <Icon name="chevron_right" className="text-sm" />
              <span className="text-primary font-bold">Interactive Cadastral Map</span>
            </div>
            <div className="flex items-center gap-space-sm mt-1">
              <div className="relative inline-flex items-center">
                <select defaultValue="Oke-Ogun Pioneer Agrarian Estate (48.6 Ha, Saki West, Oyo State)" className="appearance-none bg-surface-container-low text-on-surface font-headline-sm text-headline-sm py-1.5 pl-space-md pr-10 rounded-lg cursor-pointer focus:outline-none focus:bg-surface-container hover:bg-surface-container transition-colors">
                  <option>Oke-Ogun Pioneer Agrarian Estate (48.6 Ha, Saki West, Oyo State)</option>
                  <option>Iseyin Savanna Cluster (42.5 Ha, Iseyin LGA)</option>
                  <option>Ogbomoso Organic Orchard (18.2 Ha, Oyo State)</option>
                </select>
                <Icon name="arrow_drop_down" className="absolute right-2 pointer-events-none text-on-surface-variant" />
              </div>
              <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center gap-1 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> PostGIS 3.4 Connected</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs">
            <button className="px-space-md py-2 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg flex items-center gap-1.5 transition-colors shadow-sm" type="button">
              <Icon name="polyline" className="text-lg text-primary" />
              <span>Walk / Edit Boundary</span>
            </button>
            <button className="px-space-md py-2 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg flex items-center gap-1.5 transition-colors shadow-sm" type="button">
              <Icon name="file_download" className="text-lg text-primary" />
              <span>Export GeoJSON / SHP</span>
            </button>
            <button className="px-space-md py-2 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg flex items-center gap-1.5 transition-colors shadow-sm" type="button">
              <Icon name="add_location_alt" className="text-lg text-secondary" />
              <span>Add Infrastructure</span>
            </button>
            <button className="px-space-md py-2 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg flex items-center gap-1.5 transition-colors shadow-sm hover:opacity-95" type="button">
              <Icon name="satellite_alt" className="text-lg" />
              <span>Satellite Re-scan</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-space-sm">
          <div className="bg-surface-container-lowest p-space-sm px-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <Icon name="landscape" className="text-xl" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-on-surface-variant font-label-sm text-label-sm truncate">TOTAL CADASTRE</span>
              <span className="text-on-surface font-metric-num text-headline-sm font-bold truncate">48.60 Ha</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-sm px-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
              <Icon name="grid_4x4" className="text-xl" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-on-surface-variant font-label-sm text-label-sm truncate">DELINEATED FIELDS</span>
              <span className="text-on-surface font-metric-num text-headline-sm font-bold truncate">6 Plots (100%)</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-sm px-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
              <Icon name="energy_savings_leaf" className="text-xl" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-on-surface-variant font-label-sm text-label-sm truncate">NDVI VIGOUR</span>
              <div className="flex items-center gap-1.5">
                <span className="text-on-surface font-metric-num text-headline-sm font-bold">0.81</span>
                <span className="text-secondary font-label-sm text-label-sm font-semibold">High</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-sm px-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary-container">
              <Icon name="agriculture" className="text-xl" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-on-surface-variant font-label-sm text-label-sm truncate">FLEET TELEMETRY</span>
              <span className="text-on-surface font-metric-num text-headline-sm font-bold truncate">2 Nodes Active</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-sm px-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
              <Icon name="sensors" className="text-xl" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-on-surface-variant font-label-sm text-label-sm truncate">SOIL MOISTURE</span>
              <span className="text-on-surface font-metric-num text-headline-sm font-bold truncate">34.2% VWC</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-space-sm px-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-error">
              <Icon name="warning" className="text-xl" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-on-surface-variant font-label-sm text-label-sm truncate">SCOUTING ALERT</span>
              <span className="text-error font-metric-num text-headline-sm font-bold truncate">1 Active (FAW)</span>
            </div>
          </div>
        </div>
        <div className="relative w-full h-[760px] rounded-xl overflow-hidden shadow-lg flex">
          <div className="absolute left-4 top-4 z-20 w-80 max-h-[720px] bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-space-md shadow-xl flex flex-col gap-space-sm overflow-y-auto">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-2">
                <Icon name="layers" className="text-primary text-xl" />
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">GIS Layers &amp; Overlays</span>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface p-1 rounded transition-colors" title="Collapse Layer Panel" type="button">
                <Icon name="unfold_less" className="text-lg" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5 p-space-sm bg-surface-container-low rounded-lg">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold tracking-wider uppercase">Basemap Provider</span>
              <div className="grid grid-cols-3 gap-1">
                <button className="py-1 px-1.5 text-center rounded bg-primary-container text-on-primary font-label-sm text-label-sm font-medium shadow-xs" type="button">Satellite</button>
                <button className="py-1 px-1.5 text-center rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm hover:bg-surface-container transition-colors" type="button">Topographic</button>
                <button className="py-1 px-1.5 text-center rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm hover:bg-surface-container transition-colors" type="button">Cadastral</button>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 pt-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold tracking-wider uppercase">Operational Layers</span>
              <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-on-surface font-label-md text-label-md cursor-pointer select-none">
                    <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                    <span>Cadastral Boundary</span>
                  </label>
                  <span className="w-3.5 h-3.5 rounded bg-primary-fixed border border-primary" />
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-[10px] text-on-surface-variant">Opacity</span>
                  <input className="w-full h-1 bg-surface-container-highest rounded-lg accent-primary cursor-pointer" type="range" defaultValue="100" />
                </div>
              </div>
              <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-on-surface font-label-md text-label-md font-semibold cursor-pointer select-none">
                    <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                    <span>Fields &amp; Crop Delineation</span>
                  </label>
                  <span className="text-xs text-secondary font-bold">6 Active</span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-[10px] text-on-surface-variant">Opacity</span>
                  <input className="w-full h-1 bg-surface-container-highest rounded-lg accent-primary cursor-pointer" type="range" defaultValue="85" />
                </div>
              </div>
              <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-on-surface font-label-md text-label-md cursor-pointer select-none">
                    <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                    <span>Sentinel-2 NDVI Heatmap</span>
                  </label>
                  <span className="text-[10px] px-1 bg-secondary-container text-on-secondary-container rounded font-bold">L2A 10m</span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-[10px] text-on-surface-variant">Opacity</span>
                  <input className="w-full h-1 bg-surface-container-highest rounded-lg accent-primary cursor-pointer" type="range" defaultValue="60" />
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <label className="flex items-center gap-2 text-on-surface font-label-md text-label-md cursor-pointer select-none">
                  <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                  <span>Machinery &amp; Fleet Nodes</span>
                </label>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <label className="flex items-center gap-2 text-on-surface font-label-md text-label-md cursor-pointer select-none">
                  <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                  <span>Water Infr. &amp; Irrigation</span>
                </label>
                <Icon name="water_drop" className="text-sm text-surface-tint" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <label className="flex items-center gap-2 text-on-surface font-label-md text-label-md cursor-pointer select-none">
                  <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                  <span>Farm Roads &amp; Facilities</span>
                </label>
                <Icon name="warehouse" className="text-sm text-outline" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors opacity-70">
                <label className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md cursor-pointer select-none">
                  <input className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                  <span>High-Res Drone Ortho (Phase 2)</span>
                </label>
                <span className="text-[10px] text-on-surface-variant font-semibold">Q3 &apos;26</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors opacity-70">
                <label className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md cursor-pointer select-none">
                  <input className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                  <span>LoRaWAN Sensor Array</span>
                </label>
                <span className="text-[10px] text-on-surface-variant font-semibold">Offline</span>
              </div>
            </div>
            <div className="pt-space-xs mt-auto">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider block mb-1.5">NDVI Index Spectrum</span>
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-yellow-200 to-emerald-600" />
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-1 font-mono">
                <span>0.15 (Bare)</span>
                <span>0.50 (Moderate)</span>
                <span>0.88 (Dense)</span>
              </div>
            </div>
          </div>
          <div className="relative flex-1 w-full h-full bg-surface-container-high overflow-hidden select-none" data-location="Saki West, Oyo State, Nigeria">
            <div className="absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none filter contrast-105 brightness-95" data-alt="Ultra high definition aerial satellite perspective of large organized agrarian farmland fields divided into distinct crop sectors with rich tropical green foliage and rich brown loamy soils under bright equatorial daylight in South-West Nigeria" style={{ backgroundImage: "url('/images/screens/50855ccf1922.webp')" }} />
            <svg className="absolute inset-0 w-full h-full pointer-events-auto" preserveAspectRatio="none" viewBox="0 0 1200 800">
              <defs>
                <pattern height="20" id="cropPatternMaize" patternUnits="userSpaceOnUse" width="20">
                  <path d="M 0,10 L 20,10 M 10,0 L 10,20" opacity="0.3" stroke="#134e33" strokeWidth="0.5" />
                </pattern>
                <linearGradient id="ndviGradField" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#134e33" stopOpacity="0.65" />
                </linearGradient>
              </defs>
              <polygon className="opacity-90" fill="none" points="180,60 1080,45 1160,540 890,750 240,730 140,430" stroke="#006c49" strokeDasharray="10 5" strokeWidth="3.5" />
              <g className="cursor-pointer group" id="poly-field-01">
                <polygon className="transition-all duration-300 hover:fill-primary-fixed/50" fill="url(#ndviGradField)" points="200,90 620,80 590,380 220,390" stroke="#6ffbbe" strokeWidth="3" />
                <polygon fill="none" points="200,90 620,80 590,380 220,390" stroke="#134e33" strokeWidth="1.5" />
                <text className="drop-shadow-md select-none" fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="14" fontWeight="700" textAnchor="middle" x="390" y="225">FIELD 01: MAIZE (SAMMAZ-15)</text>
                <text className="drop-shadow-md select-none" fill="#eaf1ff" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="390" y="245">12.4 Ha · NDVI 0.82</text>
              </g>
              <g className="cursor-pointer group" id="poly-field-02">
                <polygon className="hover:fill-opacity-50 transition-all" fill="#31694c" fillOpacity="0.38" points="630,80 1060,65 1010,380 600,380" stroke="#4edea3" strokeWidth="1.8" />
                <text className="drop-shadow-md select-none" fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="14" fontWeight="700" textAnchor="middle" x="820" y="220">FIELD 02: CASSAVA (TME-419)</text>
                <text className="drop-shadow-md select-none" fill="#eaf1ff" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="820" y="240">16.2 Ha · Canopy Closure</text>
              </g>
              <g className="cursor-pointer group" id="poly-field-03">
                <polygon className="hover:fill-opacity-60 transition-all" fill="#006c49" fillOpacity="0.45" points="600,390 1010,390 920,680 620,690" stroke="#6cf8bb" strokeWidth="1.8" />
                <text className="drop-shadow-md select-none" fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="14" fontWeight="700" textAnchor="middle" x="790" y="530">FIELD 03: RICE (FARO-44)</text>
                <text className="drop-shadow-md select-none" fill="#eaf1ff" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="790" y="550">8.5 Ha · Irrigated Basin</text>
              </g>
              <g className="cursor-pointer group" id="poly-field-04">
                <polygon className="hover:fill-opacity-55 transition-all" fill="#ffb77d" fillOpacity="0.4" points="230,400 580,390 560,570 250,570" stroke="#ff9939" strokeWidth="1.8" />
                <text className="drop-shadow-md select-none" fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="14" fontWeight="700" textAnchor="middle" x="395" y="475">FIELD 04: HORTICULTURE</text>
                <text className="drop-shadow-md select-none" fill="#eaf1ff" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="395" y="495">4.2 Ha · Drip Fertigation</text>
              </g>
              <g className="cursor-pointer group" id="poly-field-05">
                <polygon className="hover:fill-opacity-40 transition-all" fill="#6a3700" fillOpacity="0.25" points="255,580 555,580 540,710 270,710" stroke="#ffdcc3" strokeWidth="1.8" />
                <text className="drop-shadow-md select-none" fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="700" textAnchor="middle" x="400" y="640">FIELD 05: FALLOW RESTORATION</text>
                <text className="drop-shadow-md select-none" fill="#ffdcc3" fontFamily="Inter" fontSize="10" fontWeight="600" textAnchor="middle" x="400" y="658">5.3 Ha · Green Manure</text>
              </g>
              <g className="cursor-pointer group" id="poly-field-06">
                <polygon className="hover:fill-opacity-65 transition-all" fill="#165035" fillOpacity="0.5" points="620,700 900,690 870,740 610,740" stroke="#99d3b0" strokeWidth="1.8" />
                <text className="drop-shadow-md select-none" fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" textAnchor="middle" x="750" y="722">FIELD 06: NURSERY &amp; FORESTRY (2.0 Ha)</text>
              </g>
              <polyline opacity="0.6" points="150,390 600,385 610,750" stroke="#f8f9ff" strokeLinecap="round" strokeWidth="4" />
              <polyline opacity="0.5" points="590,80 600,750" stroke="#f8f9ff" strokeDasharray="8 6" strokeWidth="3" />
              <polyline opacity="0.6" points="600,385 1080,380" stroke="#f8f9ff" strokeLinecap="round" strokeWidth="3" />
              <line stroke="#00714d" strokeDasharray="4 4" strokeWidth="2.5" x1="590" x2="250" y1="380" y2="400" />
            </svg>
            <div className="absolute top-[210px] left-[320px] -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-tertiary-fixed animate-ping opacity-60" />
                <div className="w-9 h-9 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center shadow-md">
                  <Icon name="agriculture" className="text-lg" />
                </div>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-surface-container-lowest p-2 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-primary font-bold">MF-375 #04</span>
                  <span className="px-1 bg-secondary-container text-on-secondary-container rounded text-[10px] font-bold">Disc Harrow</span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Speed: 4.2 km/h · Heading: 084°</p>
              </div>
            </div>
            <div className="absolute top-[385px] left-[595px] -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center shadow-md">
                <Icon name="water_drop" className="text-lg" />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-surface-container-lowest p-2 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-label-sm text-label-sm text-on-surface font-bold">Solar Borehole Station</span>
                <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">5,000 L/hr · Pressure: 2.8 Bar</p>
              </div>
            </div>
            <div className="absolute top-[360px] left-[180px] -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shadow-md">
                <Icon name="warehouse" className="text-lg" />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-surface-container-lowest p-2 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-label-sm text-label-sm text-on-surface font-bold">Silo &amp; Warehouse Complex</span>
                <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Capacity: 450 MT · Stock: 68 MT</p>
              </div>
            </div>
            <div className="absolute top-[280px] left-[460px] -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-md">
                <Icon name="sensors" className="text-sm" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-surface-container-lowest p-2 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-label-sm text-label-sm text-on-surface font-bold">Soil Node #B12</span>
                <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">VWC: 34% · Soil Temp: 26.8°C</p>
              </div>
            </div>
            <div className="absolute top-[120px] left-[550px] -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full bg-error-container animate-ping opacity-75" />
                <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shadow-md">
                  <Icon name="pest_control" className="text-sm" />
                </div>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-surface-container-lowest p-2 rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 text-error font-label-sm text-label-sm font-bold">
                  <Icon name="priority_high" className="text-xs" />
                  <span>Scout Flag #S-09: Fall Armyworm</span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Early larval detection on Field 01 border. Spot spray advised.</p>
              </div>
            </div>
            <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-1 flex flex-col items-center">
                <button className="w-9 h-9 flex items-center justify-center text-on-surface hover:bg-surface-container-low rounded-lg transition-colors" title="Zoom In" type="button">
                  <Icon name="add" className="text-xl" />
                </button>
                <div className="w-6 h-px bg-surface-container my-0.5" />
                <button className="w-9 h-9 flex items-center justify-center text-on-surface hover:bg-surface-container-low rounded-lg transition-colors" title="Zoom Out" type="button">
                  <Icon name="remove" className="text-xl" />
                </button>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-md p-1 flex flex-col items-center">
                <button className="w-9 h-9 flex items-center justify-center text-primary hover:bg-surface-container-low rounded-lg transition-colors" title="Compass Orientation" type="button">
                  <Icon name="explore" className="text-xl" />
                </button>
                <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors" title="Area & Distance Measurement" type="button">
                  <Icon name="straighten" className="text-xl" />
                </button>
                <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors" title="Fullscreen Geospatial Canvas" type="button">
                  <Icon name="fullscreen" className="text-xl" />
                </button>
              </div>
            </div>
            <div className="absolute left-4 bottom-4 z-20 bg-surface-container-lowest/90 backdrop-blur-sm px-space-md py-1.5 rounded-lg shadow-sm flex items-center gap-space-md font-mono text-[11px] text-on-surface-variant">
              <span>EPSG:4326 (WGS 84)</span>
              <span>Lat: 8.6672° N · Lon: 3.3934° E</span>
              <span>Scale: 1:5,000 (200m)</span>
              <div className="w-16 h-1 bg-on-surface rounded-full" />
            </div>
          </div>
          <div className="w-[390px] h-full bg-surface-container-lowest shadow-2xl z-30 flex flex-col overflow-y-auto">
            <div className="relative h-44 w-full bg-surface-container-high overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center" data-alt="Vibrant close-up agronomic shot of lush green high-yield hybrid maize stalks in early vegetative stage in an African savanna field during morning sunlight" style={{ backgroundImage: "url('/images/screens/9897b78f3d57.webp')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/30 to-transparent" />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">Field 01 · Primary Sector</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Optimal Health</span>
              </div>
              <div className="absolute bottom-2 left-4 right-4">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">SAMMAZ-15 White Maize</h2>
                <span className="font-body-sm text-body-sm text-on-surface-variant">12.40 Hectares (25.5% of Total Farm Cadastre)</span>
              </div>
            </div>
            <div className="p-space-md flex flex-col gap-space-md">
              <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-space-sm rounded-lg">
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Soil Pedology</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">Luvisol (Loamy Sand)</span>
                  <span className="font-body-sm text-xs text-on-surface-variant">pH 6.4 · CEC 14.2 cmol/kg</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Tenure Witness</span>
                  <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1"><Icon name="verified" className="text-sm" /> Baale Deed Verified</span>
                  <span className="font-body-sm text-xs text-on-surface-variant">Boundary Signed 2024</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 bg-surface-container-low p-space-sm rounded-lg">
                <div className="flex items-center justify-between font-label-md text-label-md">
                  <span className="text-on-surface font-semibold">Early Savanna Season 2025</span>
                  <span className="text-primary font-bold">Day 38 / 110 (V4 Vegetative)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: "35%" }} />
                </div>
                <div className="flex items-center justify-between font-body-sm text-xs text-on-surface-variant">
                  <span>Planted: 14 May 2025</span>
                  <span>Est. Harvest: 02 Sep 2025</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon name="monitoring" className="text-secondary text-base" />
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Multispectral NDVI Trend</span>
                  </div>
                  <span className="text-secondary font-label-sm text-label-sm font-bold bg-secondary-container/60 px-1.5 py-0.5 rounded">+4.2% vs Cluster Avg</span>
                </div>
                <div className="h-14 w-full flex items-end">
                  <svg className="w-full h-full text-secondary" preserveAspectRatio="none" viewBox="0 0 200 50">
                    <path d="M0,45 Q30,42 60,35 T120,20 T160,15 T200,8" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M0,45 Q30,42 60,35 T120,20 T160,15 T200,8 L200,50 L0,50 Z" fill="currentColor" fillOpacity="0.12" />
                    <circle cx="200" cy="8" fill="currentColor" r="3.5" />
                  </svg>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>S-2 L2A Pass: Yesterday</span>
                  <span className="font-bold text-on-surface">Vigour Index: 0.82</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Scheduled Farm Operations</span>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex items-start gap-space-sm">
                  <div className="w-8 h-8 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                    <Icon name="science" className="text-base" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-bold">2nd Split Urea Top-Dressing</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold">In 3 Days</span>
                    </div>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">50kg/Ha Granular Urea application before predicted Friday precipitation.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Operational Deployment</span>
                <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary text-xs">TB</div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Tunde Balogun</span>
                      <span className="font-body-sm text-xs text-on-surface-variant">Field Supervisor + 4 Hands</span>
                    </div>
                  </div>
                  <button className="p-1 text-primary hover:bg-surface-container rounded transition-colors" title="Call or Message Supervisor" type="button">
                    <Icon name="call" className="text-lg" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-space-xs mt-auto">
                <button className="w-full py-2.5 px-space-md bg-primary-container text-on-primary font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-sm" type="button">
                  <Icon name="open_in_new" className="text-lg" />
                  <span>View Field Full Master File</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 px-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-1.5 transition-colors" type="button">
                    <Icon name="flag" className="text-base text-error" />
                    <span>Log Scouting</span>
                  </button>
                  <button className="py-2 px-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-1.5 transition-colors" type="button">
                    <Icon name="precision_manufacturing" className="text-base text-tertiary" />
                    <span>Order Machine</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Delineated Farm Plots &amp; Agronomic States</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Click any parcel below to pan map and inspect parameters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-space-sm">
            <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm text-primary font-bold">FIELD 01</span>
                <span className="w-2 h-2 rounded-full bg-secondary" />
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold truncate">SAMMAZ-15 Maize</p>
              <p className="font-body-sm text-xs text-on-surface-variant">12.4 Ha · Day 38 (V4)</p>
              <div className="mt-2 text-xs font-semibold text-secondary">NDVI 0.82 High</div>
            </div>
            <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm text-primary font-bold">FIELD 02</span>
                <span className="w-2 h-2 rounded-full bg-secondary" />
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold truncate">TME-419 Cassava</p>
              <p className="font-body-sm text-xs text-on-surface-variant">16.2 Ha · Canopy Done</p>
              <div className="mt-2 text-xs font-semibold text-secondary">NDVI 0.79 High</div>
            </div>
            <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm text-primary font-bold">FIELD 03</span>
                <span className="w-2 h-2 rounded-full bg-secondary" />
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold truncate">Faro-44 Rice</p>
              <p className="font-body-sm text-xs text-on-surface-variant">8.5 Ha · Tillering Stage</p>
              <div className="mt-2 text-xs font-semibold text-surface-tint">Irrigated Basin</div>
            </div>
            <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm text-primary font-bold">FIELD 04</span>
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container" />
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold truncate">Tatashe &amp; Tomato</p>
              <p className="font-body-sm text-xs text-on-surface-variant">4.2 Ha · Fertigated</p>
              <div className="mt-2 text-xs font-semibold text-on-tertiary-container">Active Harvest</div>
            </div>
            <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">FIELD 05</span>
                <span className="w-2 h-2 rounded-full bg-outline" />
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold truncate">Fallow Restoration</p>
              <p className="font-body-sm text-xs text-on-surface-variant">5.3 Ha · Mucuna cover</p>
              <div className="mt-2 text-xs font-semibold text-on-surface-variant">Regenerative</div>
            </div>
            <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm text-primary font-bold">FIELD 06</span>
                <span className="w-2 h-2 rounded-full bg-secondary" />
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold truncate">Agro-Forestry &amp; Nursery</p>
              <p className="font-body-sm text-xs text-on-surface-variant">2.0 Ha · Border Windbreak</p>
              <div className="mt-2 text-xs font-semibold text-secondary">Teak &amp; Cashew</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
