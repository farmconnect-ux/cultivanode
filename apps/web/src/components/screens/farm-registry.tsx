// Ported from the "my_farms_field_registry" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { Icon } from "@/components/ds/icon";
import { slot, type ScreenProps } from "./types";

export type FarmRegistrySlot = "pills" | "actions" | "kpis" | "inventory";

export function FarmRegistry({ slots }: ScreenProps<FarmRegistrySlot>) {
  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-space-xl">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-space-md mb-space-lg">
          <div className="space-y-space-xs max-w-3xl">
            {slot(slots, "pills", (
              <div className="flex flex-wrap items-center gap-space-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-secondary" /> PostGIS Georeferenced</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Zone 4A: Drier Derived Savanna</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">Total Mapped Area: 42.5 Hectares</span>
              </div>
            ))}
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">My Farms &amp; Field Registry</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Cadastral GIS boundaries, soil profile typology, agro-ecological zoning, and tenure records for Iseyin Cluster.</p>
          </div>
          {slot(slots, "actions", (
            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
              <button className="flex items-center gap-space-xs px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-colors" type="button"><Icon name="picture_as_pdf" className="text-base" /> Export Cadastral Survey</button>
              <button className="flex items-center gap-space-xs px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-colors" type="button"><Icon name="upload_file" className="text-base" /> Import KML / GeoJSON</button>
              <button className="flex items-center gap-space-xs px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary transition-colors" type="button"><Icon name="add_location_alt" className="text-base" /> Add New Field / Plot</button>
            </div>
          ))}
        </div>
        {slot(slots, "kpis", (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Farm Holding</span>
                <span className="p-1.5 rounded-md bg-surface-container text-secondary">
                  <Icon name="grid_view" className="text-base" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">42.5 <span className="font-headline-sm text-headline-sm text-on-surface-variant">Ha</span></div>
                <div className="mt-1 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm">
                  <Icon name="verified" className="text-sm" />
                  <span>100% cadastral boundaries polygon-locked</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Cultivated Area</span>
                <span className="p-1.5 rounded-md bg-secondary-container/40 text-secondary">
                  <Icon name="psychiatry" className="text-base" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">38.5 <span className="font-headline-sm text-headline-sm text-on-surface-variant">Ha</span></div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Spread across 5 operational crop blocks</div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Fallow / Eco-Reserve</span>
                <span className="p-1.5 rounded-md bg-surface-container text-on-surface-variant">
                  <Icon name="nature" className="text-base" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface">4.0 <span className="font-headline-sm text-headline-sm text-on-surface-variant">Ha</span></div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Plot C1 regeneration &amp; riparian swale</div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Soil Health Status</span>
                <span className="p-1.5 rounded-md bg-surface-container-high text-primary">
                  <Icon name="science" className="text-base" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary">Optimal</div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">pH 6.4 · OC 1.8% · Cation Exch. 14.2 meq</div>
              </div>
            </div>
          </div>
        ))}
        <div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden mb-space-lg">
          <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="p-2 rounded bg-surface-container-lowest text-primary shadow-sm">
                <Icon name="satellite_alt" className="text-lg" />
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Cadastral GIS Vector &amp; Sentinel Overlay</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Orthomosaic Resolution 0.25m/px · RTK GNSS Locked</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <button className="px-2.5 py-1.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm flex items-center gap-1 shadow-sm" type="button"><Icon name="layers" className="text-xs" /> Plot Boundaries</button>
              <button className="px-2.5 py-1.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm flex items-center gap-1 hover:bg-surface-container transition-colors shadow-sm" type="button"><Icon name="eco" className="text-xs text-secondary" /> NDVI Canopy</button>
              <button className="px-2.5 py-1.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm flex items-center gap-1 hover:bg-surface-container transition-colors shadow-sm" type="button"><Icon name="water_drop" className="text-xs text-secondary" /> Moisture Sensors</button>
              <button className="px-2.5 py-1.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm flex items-center gap-1 hover:bg-surface-container transition-colors shadow-sm" type="button"><Icon name="grain" className="text-xs text-primary" /> Drip Lines</button>
              <button className="px-2.5 py-1.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm flex items-center gap-1 hover:bg-surface-container transition-colors shadow-sm" type="button"><Icon name="terrain" className="text-xs text-on-surface-variant" /> Elevation 2% Swales</button>
            </div>
          </div>
          <div className="relative w-full h-[520px] bg-inverse-surface overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity" data-location="Iseyin, Oyo State, Nigeria" style={{ backgroundImage: "url('/images/screens/5cf3381e05ca.webp')" }} />
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1100 520">
              <defs>
                <pattern height="40" id="cadGrid" patternUnits="userSpaceOnUse" width="40">
                  <path className="text-surface-container-lowest/10" d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.7" />
                </pattern>
                <linearGradient id="polyGradA" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#134e33" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#006c49" stopOpacity="0.35" />
                </linearGradient>
                <linearGradient id="polyGradB1" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ff9939" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#6a3700" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="polyGradB2" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#006c49" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#6cf8bb" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="polyGradB3" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#31694c" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#134e33" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <rect fill="url(#cadGrid)" height="100%" width="100%" />
              <path d="M 120 440 L 460 270 L 680 230 L 980 180" fill="none" opacity="0.85" stroke="#6cf8bb" strokeDasharray="6,4" strokeWidth="2.5" />
              <path d="M 40 100 Q 280 140 500 110 T 1050 90" fill="none" opacity="0.3" stroke="#dce9ff" strokeDasharray="3,3" strokeWidth="1" />
              <path d="M 30 220 Q 340 260 620 210 T 1060 200" fill="none" opacity="0.3" stroke="#dce9ff" strokeDasharray="3,3" strokeWidth="1" />
              <polygon className="cursor-pointer hover:opacity-90 transition-opacity" fill="url(#polyGradA)" points="110,70 420,50 490,260 170,290" stroke="#4edea3" strokeWidth="2" />
              <polygon className="cursor-pointer hover:opacity-90 transition-opacity" fill="url(#polyGradB1)" points="510,60 760,80 730,230 490,260" stroke="#ffb77d" strokeWidth="2" />
              <polygon className="cursor-pointer hover:opacity-90 transition-opacity" fill="url(#polyGradB2)" points="180,310 520,280 500,470 140,460" stroke="#6cf8bb" strokeWidth="2" />
              <polygon className="cursor-pointer hover:opacity-90 transition-opacity" fill="url(#polyGradB3)" points="530,300 780,250 820,440 540,470" stroke="#99d3b0" strokeWidth="2" />
              <polygon fill="#213145" fillOpacity="0.65" points="780,90 1040,110 1010,430 830,420" stroke="#d3e4fe" strokeDasharray="4,4" strokeWidth="1.5" />
            </svg>
            <div className="absolute top-20 left-48 bg-surface-container-lowest/95 backdrop-blur-md p-2.5 rounded-lg shadow-md max-w-[210px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-md text-label-md text-primary font-bold">Plot A1 &amp; A2</span>
                <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">18.0 Ha</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Maize DMR-LSR-Y</p>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1.5 bg-surface-container-low px-1.5 py-1 rounded">
                <span>NDVI: <strong className="text-secondary">0.78</strong></span>
                <span>Moist: <strong className="text-secondary">62%</strong></span>
              </div>
            </div>
            <div className="absolute top-20 left-[540px] bg-surface-container-lowest/95 backdrop-blur-md p-2.5 rounded-lg shadow-md max-w-[190px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-md text-label-md text-tertiary font-bold">Plot B1</span>
                <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm">6.5 Ha</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Tomato Roma VF (Drip)</p>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1.5 bg-surface-container-low px-1.5 py-1 rounded">
                <span>Tensiometer: <strong>28 kPa</strong></span>
              </div>
            </div>
            <div className="absolute bottom-20 left-48 bg-surface-container-lowest/95 backdrop-blur-md p-2.5 rounded-lg shadow-md max-w-[200px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-md text-label-md text-secondary font-bold">Plot B2</span>
                <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">14.0 Ha</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Cassava TME 419</p>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1.5 bg-surface-container-low px-1.5 py-1 rounded">
                <span>Weed Cycle: <strong>Post-Emerg.</strong></span>
              </div>
            </div>
            <div className="absolute bottom-20 left-[570px] bg-surface-container-lowest/95 backdrop-blur-md p-2.5 rounded-lg shadow-md max-w-[190px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-md text-label-md text-primary font-bold">Plot B3</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">4.0 Ha</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Cowpea SAMPEA-14</p>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1.5 bg-surface-container-low px-1.5 py-1 rounded">
                <span>Inoculation: <strong>Bio-N Verified</strong></span>
              </div>
            </div>
            <div className="absolute top-16 right-16 bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-lg shadow-md w-60">
              <div className="flex items-center gap-1.5 mb-2 text-primary font-label-md text-label-md">
                <Icon name="domain" className="text-base" />
                <span>Central Cluster Infrastructure</span>
              </div>
              <ul className="space-y-1.5 text-on-surface-variant font-body-sm text-body-sm">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" />Solar Borehole #02</span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">12.5k L/hr</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-on-tertiary-container" />Storehouse &amp; Drier</span>
                  <span className="font-label-sm text-label-sm">350 MT Cap</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-container" />Poultry House 1</span>
                  <span className="font-label-sm text-label-sm">3,500 Birds</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-surface-tint" />Catfish Pond P2</span>
                  <span className="font-label-sm text-label-sm">Active Growout</span>
                </li>
              </ul>
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md p-1 rounded-lg shadow-sm">
              <button className="p-1.5 hover:bg-surface-container rounded text-on-surface" title="Zoom in" type="button">
                <Icon name="add" className="text-sm" />
              </button>
              <button className="p-1.5 hover:bg-surface-container rounded text-on-surface" title="Zoom out" type="button">
                <Icon name="remove" className="text-sm" />
              </button>
              <button className="p-1.5 hover:bg-surface-container rounded text-on-surface" title="Reset View" type="button">
                <Icon name="my_location" className="text-sm" />
              </button>
              <button className="p-1.5 hover:bg-surface-container rounded text-on-surface" title="Fullscreen" type="button">
                <Icon name="fullscreen" className="text-sm" />
              </button>
            </div>
          </div>
          <div className="p-space-sm bg-surface-container-low px-space-md flex flex-col md:flex-row items-start md:items-center justify-between text-on-surface-variant font-label-sm text-label-sm gap-2">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-semibold text-on-surface flex items-center gap-1"><Icon name="explore" className="text-sm text-secondary" /> Centroid: Lat 7.9532° N, Long 3.5971° E</span>
              <span>•</span>
              <span>Datum: WGS84 / UTM Zone 31N</span>
              <span>•</span>
              <span>EPSG: 32631</span>
              <span>•</span>
              <span>Surveyor: Oyo State Ministry of Lands &amp; Agriculture (Survey Seal #OYO/LD/2024/914B)</span>
            </div>
            <div className="flex items-center gap-1 text-secondary font-semibold">
              <Icon name="offline_pin" className="text-sm" />
              <span>Cached for PowerSync Offline</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg">
          {slot(slots, "inventory", (
            <div className="xl:col-span-8 bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-space-md flex items-center justify-between bg-surface-container-low">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Field &amp; Plot Inventory</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">5 demarcated parcels · 100% active cultivation ledger</p>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Filter by enterprise:</span>
                    <select className="bg-surface-container-lowest px-2 py-1 rounded text-on-surface font-label-sm text-label-sm shadow-sm focus:outline-none">
                      <option>All Enterprises (Crops &amp; Nursery)</option>
                      <option>Grain (Maize)</option>
                      <option>Horticulture (Tomato)</option>
                      <option>Root &amp; Tubers (Cassava)</option>
                      <option>Legumes (Cowpea)</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-high/40 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-3 px-space-md">Plot ID &amp; Parcel</th>
                        <th className="py-3 px-space-md">Area</th>
                        <th className="py-3 px-space-md">Enterprise &amp; Seed</th>
                        <th className="py-3 px-space-md">Soil Typology</th>
                        <th className="py-3 px-space-md">Tenure / Deed</th>
                        <th className="py-3 px-space-md">Supervisor</th>
                        <th className="py-3 px-space-md text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-bold text-on-surface">#ISY-PL-A1</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Savanna North Front</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-semibold">10.0 Ha</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">24.7 Acres</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Maize</span>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">DMR-LSR-Y (Yellow)</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div>Sandy Loam</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">pH 6.4 · Slope 2%</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">Family Lease (25y)</span>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md">Adeleke O.</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Agronomist II</div>
                        </td>
                        <td className="py-3.5 px-space-md text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Edit GIS Polygon" type="button">
                              <Icon name="polyline" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="View Phenology" type="button">
                              <Icon name="timelapse" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Soil Chemistry History" type="button">
                              <Icon name="biotech" className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-bold text-on-surface">#ISY-PL-A2</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Savanna Central Ridge</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-semibold">8.0 Ha</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">19.8 Acres</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Maize</span>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">DMR-LSR-Y (Yellow)</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div>Sandy Loam</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">pH 6.3 · Slope 1.8%</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">Family Lease (25y)</span>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md">Adeleke O.</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Agronomist II</div>
                        </td>
                        <td className="py-3.5 px-space-md text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Edit GIS Polygon" type="button">
                              <Icon name="polyline" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="View Phenology" type="button">
                              <Icon name="timelapse" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Soil Chemistry History" type="button">
                              <Icon name="biotech" className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-bold text-on-surface">#ISY-PL-B1</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Horticulture Lowland</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-semibold">6.5 Ha</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">16.1 Acres</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex items-center gap-1 font-label-md text-label-md text-on-tertiary-container font-semibold"><span className="w-2 h-2 rounded-full bg-tertiary" /> Tomato</span>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Roma VF (Hybrid Drip)</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div>Loamy Alluvial</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">pH 6.6 · Borehole #2</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Freehold Title</span>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md">Fashola K.</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Hort Specialist</div>
                        </td>
                        <td className="py-3.5 px-space-md text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Edit GIS Polygon" type="button">
                              <Icon name="polyline" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="View Phenology" type="button">
                              <Icon name="timelapse" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Soil Chemistry History" type="button">
                              <Icon name="biotech" className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-bold text-on-surface">#ISY-PL-B2</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Southern Plateau</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-semibold">14.0 Ha</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">34.6 Acres</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary font-semibold"><span className="w-2 h-2 rounded-full bg-secondary" /> Cassava</span>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">TME 419 (Clean Stems)</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div>Red Ferruginous Loam</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">pH 6.1 · Rainfed</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">Syndicate Lease</span>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md">Babatunde T.</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Field Officer</div>
                        </td>
                        <td className="py-3.5 px-space-md text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Edit GIS Polygon" type="button">
                              <Icon name="polyline" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="View Phenology" type="button">
                              <Icon name="timelapse" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Soil Chemistry History" type="button">
                              <Icon name="biotech" className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-bold text-on-surface">#ISY-PL-B3</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Eastern Buffer Plot</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md font-semibold">4.0 Ha</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">9.9 Acres</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold"><span className="w-2 h-2 rounded-full bg-primary-fixed-dim" /> Cowpea</span>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">SAMPEA-14 (PBR)</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div>Sandy Loam</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">pH 6.5 · Bio-N plot</div>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">Syndicate Lease</span>
                        </td>
                        <td className="py-3.5 px-space-md">
                          <div className="font-label-md text-label-md">Adeleke O.</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">Agronomist II</div>
                        </td>
                        <td className="py-3.5 px-space-md text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Edit GIS Polygon" type="button">
                              <Icon name="polyline" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="View Phenology" type="button">
                              <Icon name="timelapse" className="text-base" />
                            </button>
                            <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" title="Soil Chemistry History" type="button">
                              <Icon name="biotech" className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Showing 5 of 5 demarcated plots • Certified Area: 42.5 Hectares</span>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm" disabled type="button">Previous</button>
                  <button className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm shadow-sm" type="button">1</button>
                  <button className="px-3 py-1.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm" disabled type="button">Next</button>
                </div>
              </div>
            </div>
          ))}
          <div className="xl:col-span-4 space-y-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="p-2 rounded bg-surface-container text-primary">
                    <Icon name="science" className="text-base" />
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Soil Profile &amp; Test Telemetry</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">IITA Soil Diagnostic Lab, Ibadan</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">March 2026</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 mb-space-md">Composite core sample analysis (0–20 cm depth) across savanna toposequence for Early Rains planting window.</p>
              <div className="space-y-space-sm">
                <div className="p-2.5 rounded bg-surface-container-low">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Total Nitrogen (N)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">0.14% (Medium)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "58%" }} />
                  </div>
                  <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm mt-1">
                    <span>Threshold: 0.12%</span>
                    <span className="text-secondary font-semibold">Adequate Base</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-surface-container-low">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Phosphorus (Bray-1 P)</span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">12.8 mg/kg (Optimal)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "74%" }} />
                  </div>
                  <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm mt-1">
                    <span>Optimum: 10 - 15 mg/kg</span>
                    <span className="text-secondary font-semibold">Well Supplied</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-surface-container-low">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Exchangeable Potassium (K)</span>
                    <span className="font-label-sm text-label-sm text-on-surface font-bold">0.28 cmol/kg (Good)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "65%" }} />
                  </div>
                  <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm mt-1">
                    <span>Critical min: 0.20 cmol/kg</span>
                    <span className="text-secondary font-semibold">Healthy</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md p-space-sm rounded bg-surface-container-high/60 flex items-start gap-space-xs">
                <Icon name="tips_and_updates" className="text-primary text-lg mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-label-md text-label-md text-primary font-bold">Agronomic Prescription:</span>
                  <p className="font-body-sm text-body-sm text-on-surface">Split Nitrogen top-dressing required at <strong>V6 stage</strong> (Urea 46% @ 65kg/Ha). Zero additional phosphorus needed due to strong residual Bray-1 levels.</p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
              <div className="flex items-center gap-space-xs mb-space-sm">
                <span className="p-2 rounded bg-surface-container text-secondary">
                  <Icon name="gavel" className="text-base" />
                </span>
                <div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface">Tenure &amp; Legal Registry</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Iseyin Chieftaincy &amp; State Land Bureau</p>
                </div>
              </div>
              <div className="space-y-2 text-on-surface font-body-sm text-body-sm">
                <div className="flex justify-between p-2 rounded bg-surface-container-low">
                  <span className="text-on-surface-variant">Certified Deed Reg:</span>
                  <span className="font-label-md text-label-md font-semibold">OYO/ISY/2021/0488</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-surface-container-low">
                  <span className="text-on-surface-variant">Tenure Type:</span>
                  <span className="font-label-md text-label-md font-semibold">25-Year Customary Leasehold</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-surface-container-low">
                  <span className="text-on-surface-variant">Expiry Date:</span>
                  <span className="font-label-md text-label-md font-semibold">31 Dec 2046 (20 yrs remaining)</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-surface-container-low">
                  <span className="text-on-surface-variant">Signatory Witness:</span>
                  <span className="font-label-md text-label-md font-semibold">Baale of Ado-Awaye Domain</span>
                </div>
              </div>
              <button className="mt-space-md w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md transition-colors" type="button"><Icon name="verified_user" className="text-base" /> View Certified Title Documents</button>
            </div>
            <div className="bg-primary text-on-primary p-space-md rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm tracking-wider uppercase opacity-80">Iseyin Micro-Climate Station</span>
                <Icon name="cloud_sync" className="text-secondary-container" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl">31.4°C</span>
                <span className="font-label-md text-label-md opacity-90">Savanna Breezes (SW 11 km/h)</span>
              </div>
              <div className="mt-space-sm pt-space-sm flex items-center justify-between text-on-primary/90 font-label-sm text-label-sm bg-primary-container/40 p-2 rounded">
                <span>7-Day Rain Outlook: <strong>42 mm</strong></span>
                <span>Et0 Evapotranspiration: <strong>4.8 mm/day</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
