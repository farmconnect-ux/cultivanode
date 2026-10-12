"use client";

// Ported from the "my_farms_field_registry" design (New screen). Static content is the design's reference data;
// pages pass live data through props where the backend already provides it.
import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export type FarmRegistrySlot = "pills" | "actions" | "kpis" | "inventory";

interface PlotRecord {
  id: string;
  name: string;
  parcel: string;
  areaHa: number;
  areaAcres: number;
  enterprise: string;
  enterpriseCategory: "Grain" | "Horticulture" | "Root" | "Legumes";
  variety: string;
  soil: string;
  soilSub: string;
  tenure: string;
  supervisor: string;
  supervisorRole: string;
}

const INITIAL_PLOTS: PlotRecord[] = [
  {
    id: "#ISY-PL-A1",
    name: "Plot A1",
    parcel: "Savanna North Front",
    areaHa: 10.0,
    areaAcres: 24.7,
    enterprise: "Maize",
    enterpriseCategory: "Grain",
    variety: "DMR-LSR-Y (Yellow)",
    soil: "Sandy Loam",
    soilSub: "pH 6.4 · Slope 2%",
    tenure: "Family Lease (25y)",
    supervisor: "Adeleke O.",
    supervisorRole: "Agronomist II",
  },
  {
    id: "#ISY-PL-A2",
    name: "Plot A2",
    parcel: "Savanna Central Ridge",
    areaHa: 8.0,
    areaAcres: 19.8,
    enterprise: "Maize",
    enterpriseCategory: "Grain",
    variety: "DMR-LSR-Y (Yellow)",
    soil: "Sandy Loam",
    soilSub: "pH 6.3 · Slope 1.8%",
    tenure: "Family Lease (25y)",
    supervisor: "Adeleke O.",
    supervisorRole: "Agronomist II",
  },
  {
    id: "#ISY-PL-B1",
    name: "Plot B1",
    parcel: "Horticulture Lowland",
    areaHa: 6.5,
    areaAcres: 16.1,
    enterprise: "Tomato",
    enterpriseCategory: "Horticulture",
    variety: "Roma VF (Hybrid Drip)",
    soil: "Loamy Alluvial",
    soilSub: "pH 6.6 · Borehole #2",
    tenure: "Freehold Title",
    supervisor: "Fashola K.",
    supervisorRole: "Hort Specialist",
  },
  {
    id: "#ISY-PL-B2",
    name: "Plot B2",
    parcel: "Southern Plateau",
    areaHa: 14.0,
    areaAcres: 34.6,
    enterprise: "Cassava",
    enterpriseCategory: "Root",
    variety: "TME 419 (Clean Stems)",
    soil: "Red Ferruginous Loam",
    soilSub: "pH 6.1 · Rainfed",
    tenure: "Syndicate Lease",
    supervisor: "Babatunde T.",
    supervisorRole: "Field Officer",
  },
  {
    id: "#ISY-PL-B3",
    name: "Plot B3",
    parcel: "Eastern Buffer Plot",
    areaHa: 4.0,
    areaAcres: 9.9,
    enterprise: "Cowpea",
    enterpriseCategory: "Legumes",
    variety: "SAMPEA-14 (PBR)",
    soil: "Sandy Loam",
    soilSub: "pH 6.5 · Bio-N plot",
    tenure: "Syndicate Lease",
    supervisor: "Adeleke O.",
    supervisorRole: "Agronomist II",
  },
];

export function FarmRegistry({ slots }: ScreenProps<FarmRegistrySlot>) {
  const [plots, setPlots] = useState<PlotRecord[]>(INITIAL_PLOTS);
  const [enterpriseFilter, setEnterpriseFilter] = useState<string>("all");
  const [activeMapLayer, setActiveMapLayer] = useState<"boundaries" | "ndvi" | "moisture" | "drip" | "swales">("boundaries");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Filtered plots
  const filteredPlots = plots.filter((p) => {
    if (enterpriseFilter === "all") return true;
    return p.enterpriseCategory === enterpriseFilter;
  });

  const handleExportCadastral = () => {
    const geojson = JSON.stringify(
      {
        type: "FeatureCollection",
        cluster: "Iseyin Agro-Cluster",
        state: "Oyo State",
        datum: "WGS84 / UTM Zone 31N",
        features: plots.map((p) => ({
          type: "Feature",
          properties: {
            id: p.id,
            name: p.name,
            parcel: p.parcel,
            areaHa: p.areaHa,
            enterprise: p.enterprise,
            variety: p.variety,
            tenure: p.tenure,
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [3.5971, 7.9532],
                [3.5995, 7.9548],
                [3.5982, 7.9515],
                [3.5971, 7.9532],
              ],
            ],
          },
        })),
      },
      null,
      2
    );
    downloadFile(geojson, `CultivaNode-Cadastral-Survey-${new Date().toISOString().slice(0, 10)}.geojson`, "application/geo+json");
    showScreenToast("Cadastral Survey GeoJSON downloaded successfully.");
  };

  const handleDownloadDeed = () => {
    const deedText = `GOVERNMENT OF OYO STATE - MINISTRY OF LANDS & HOUSING
CUSTOMARY LEASEHOLD REGISTRATION CERTIFICATE
Certificate Seal: OYO/ISY/2021/0488
Grantee: Quadri Olapade & CultivaNode Agronomic Syndicate
Cadastral Holding: 42.5 Hectares
Location: Iseyin Centraltop, Oke-Ogun Zone
Duration: 25 Years (Expiring 31 Dec 2046)
Witness: Baale of Ado-Awaye Domain

PostGIS Post-survey Boundary Seal:
Centroid: Lat 7.9532 N, Long 3.5971 E
Surveyor: Surveyor-General of Oyo State (Seal #OYO/LD/2024/914B)
`;
    downloadFile(deedText, "OYO-ISY-2021-0488-Certified-Deed.txt", "text/plain");
    showScreenToast("Certified title deed document downloaded.");
  };

  // Modal: Add New Field
  const modalNewField = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="add_location_alt" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Register New Field / Plot</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">PostGIS polygon boundary and agronomy profile</p>
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
          const newPlot: PlotRecord = {
            id: `#ISY-PL-C${plots.length + 1}`,
            name: `Plot C${plots.length + 1}`,
            parcel: "New Demarcation Parcel",
            areaHa: 5.0,
            areaAcres: 12.4,
            enterprise: "Soybeans",
            enterpriseCategory: "Legumes",
            variety: "TGx 1448-2E",
            soil: "Sandy Clay Loam",
            soilSub: "pH 6.5 · Slope 1.5%",
            tenure: "Syndicate Lease",
            supervisor: "Adeleke O.",
            supervisorRole: "Agronomist II",
          };
          setPlots([...plots, newPlot]);
          showScreenToast("New plot demarcated and synchronized to PostGIS cadastral registry!");
        }}
        className="p-space-lg space-y-space-md text-left"
      >
        <div className="space-y-space-xs">
          <label className="font-label-md text-label-md text-on-surface font-semibold">Plot Name / Description</label>
          <input defaultValue="Plot C2 - Savanna East Expansion" className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="text" />
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Area (Hectares)</label>
            <input defaultValue="5.0" step="0.1" className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="number" />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Enterprise Vertical</label>
            <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
              <option>Maize (Grain)</option>
              <option>Soybeans (Legumes)</option>
              <option>Cassava (Root & Tubers)</option>
              <option>Tomato (Horticulture)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Soil Typology</label>
            <input defaultValue="Sandy Clay Loam (pH 6.5)" className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none" type="text" />
          </div>
          <div className="space-y-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Tenure Deed</label>
            <select className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-md font-body-md text-on-surface focus:outline-none">
              <option>Syndicate Lease (10y)</option>
              <option>Family Customary Lease (25y)</option>
              <option>Freehold Title Deed</option>
            </select>
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
              Save Plot to Registry
            </button>
          </ScreenDialogClose>
        </div>
      </form>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-space-xl">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-space-md mb-space-lg">
          <div className="space-y-space-xs max-w-3xl">
            {slot(
              slots,
              "pills",
              <div className="flex flex-wrap items-center gap-space-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> PostGIS Georeferenced
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  Zone 4A: Drier Derived Savanna
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
                  Total Mapped Area: 42.5 Hectares
                </span>
              </div>
            )}
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-bold">
              My Farms &amp; Field Registry
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Cadastral GIS boundaries, soil profile typology, agro-ecological zoning, and tenure records for Iseyin Cluster.
            </p>
          </div>
          {slot(
            slots,
            "actions",
            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
              <button
                onClick={handleExportCadastral}
                className="flex items-center gap-space-xs px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-colors font-semibold"
                type="button"
              >
                <Icon name="picture_as_pdf" className="text-base text-error" />
                <span>Export Cadastral Survey</span>
              </button>
              <button
                onClick={() => showScreenToast("KML/GeoJSON import ready: Drag and drop files or browse to upload coordinates.")}
                className="flex items-center gap-space-xs px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-colors font-semibold"
                type="button"
              >
                <Icon name="upload_file" className="text-base text-secondary" />
                <span>Import KML / GeoJSON</span>
              </button>
              <ScreenDialog title="Register Plot" side="center" panel={modalNewField}>
                <button onClick={() => {}} className="flex items-center gap-space-xs px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary transition-colors font-semibold" type="button">
                  <Icon name="add_location_alt" className="text-base" />
                  <span>Add New Field / Plot</span>
                </button>
              </ScreenDialog>
            </div>
          )}
        </div>
        {slot(
          slots,
          "kpis",
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Total Farm Holding</span>
                <span className="p-1.5 rounded-md bg-surface-container text-secondary">
                  <Icon name="grid_view" className="text-base" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-bold">
                  42.5 <span className="font-headline-sm text-headline-sm text-on-surface-variant">Ha</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-semibold">
                  <Icon name="verified" className="text-sm" />
                  <span>100% cadastral boundaries polygon-locked</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Active Cultivated Area</span>
                <span className="p-1.5 rounded-md bg-secondary-container/40 text-secondary">
                  <Icon name="psychiatry" className="text-base" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-bold">
                  38.5 <span className="font-headline-sm text-headline-sm text-on-surface-variant">Ha</span>
                </div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Spread across 5 operational crop blocks</div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Fallow / Eco-Reserve</span>
                <span className="p-1.5 rounded-md bg-surface-container text-on-surface-variant">
                  <Icon name="nature" className="text-base" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-bold">
                  4.0 <span className="font-headline-sm text-headline-sm text-on-surface-variant">Ha</span>
                </div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Plot C1 regeneration &amp; riparian swale</div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Soil Health Status</span>
                <span className="p-1.5 rounded-md bg-surface-container-high text-primary">
                  <Icon name="science" className="text-base" />
                </span>
              </div>
              <div className="mt-space-sm">
                <div className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-bold">Optimal</div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">pH 6.4 · OC 1.8% · Cation Exch. 14.2 meq</div>
              </div>
            </div>
          </div>
        )}
        <div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden mb-space-lg">
          <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="p-2 rounded bg-surface-container-lowest text-primary shadow-sm">
                <Icon name="satellite_alt" className="text-lg" />
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Cadastral GIS Vector &amp; Sentinel Overlay</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Orthomosaic Resolution 0.25m/px · RTK GNSS Locked</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <button
                onClick={() => setActiveMapLayer("boundaries")}
                className={`px-2.5 py-1.5 rounded font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-colors ${
                  activeMapLayer === "boundaries" ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                }`}
                type="button"
              >
                <Icon name="layers" className="text-xs" /> Plot Boundaries
              </button>
              <button
                onClick={() => setActiveMapLayer("ndvi")}
                className={`px-2.5 py-1.5 rounded font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-colors ${
                  activeMapLayer === "ndvi" ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                }`}
                type="button"
              >
                <Icon name="eco" className="text-xs text-secondary" /> NDVI Canopy
              </button>
              <button
                onClick={() => setActiveMapLayer("moisture")}
                className={`px-2.5 py-1.5 rounded font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-colors ${
                  activeMapLayer === "moisture" ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                }`}
                type="button"
              >
                <Icon name="water_drop" className="text-xs text-secondary" /> Moisture Sensors
              </button>
              <button
                onClick={() => setActiveMapLayer("drip")}
                className={`px-2.5 py-1.5 rounded font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-colors ${
                  activeMapLayer === "drip" ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                }`}
                type="button"
              >
                <Icon name="grain" className="text-xs text-primary" /> Drip Lines
              </button>
              <button
                onClick={() => setActiveMapLayer("swales")}
                className={`px-2.5 py-1.5 rounded font-label-sm text-label-sm flex items-center gap-1 shadow-sm transition-colors ${
                  activeMapLayer === "swales" ? "bg-primary-container text-on-primary font-bold" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                }`}
                type="button"
              >
                <Icon name="terrain" className="text-xs text-on-surface-variant" /> Elevation 2% Swales
              </button>
            </div>
          </div>
          <div className="relative w-full h-[520px] bg-inverse-surface overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity transition-transform duration-300"
              style={{
                backgroundImage: "url('/images/screens/5cf3381e05ca.webp')",
                transform: `scale(${zoomLevel})`,
              }}
            />
            <svg
              className="absolute inset-0 w-full h-full transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
              preserveAspectRatio="none"
              viewBox="0 0 1100 520"
            >
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
                <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">18.0 Ha</span>
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
                <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">6.5 Ha</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Tomato Roma VF (Drip)</p>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1.5 bg-surface-container-low px-1.5 py-1 rounded">
                <span>Tensiometer: <strong>28 kPa</strong></span>
              </div>
            </div>
            <div className="absolute bottom-20 left-48 bg-surface-container-lowest/95 backdrop-blur-md p-2.5 rounded-lg shadow-md max-w-[200px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-md text-label-md text-secondary font-bold">Plot B2</span>
                <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">14.0 Ha</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Cassava TME 419</p>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1.5 bg-surface-container-low px-1.5 py-1 rounded">
                <span>Weed Cycle: <strong>Post-Emerg.</strong></span>
              </div>
            </div>
            <div className="absolute bottom-20 left-[570px] bg-surface-container-lowest/95 backdrop-blur-md p-2.5 rounded-lg shadow-md max-w-[190px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-md text-label-md text-primary font-bold">Plot B3</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">4.0 Ha</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Cowpea SAMPEA-14</p>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1.5 bg-surface-container-low px-1.5 py-1 rounded">
                <span>Inoculation: <strong>Bio-N Verified</strong></span>
              </div>
            </div>
            <div className="absolute top-16 right-16 bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-lg shadow-md w-60">
              <div className="flex items-center gap-1.5 mb-2 text-primary font-label-md text-label-md font-bold">
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
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="p-1.5 hover:bg-surface-container rounded text-on-surface transition-colors"
                title="Zoom in"
                type="button"
              >
                <Icon name="add" className="text-sm" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                className="p-1.5 hover:bg-surface-container rounded text-on-surface transition-colors"
                title="Zoom out"
                type="button"
              >
                <Icon name="remove" className="text-sm" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 hover:bg-surface-container rounded text-on-surface transition-colors"
                title="Reset View"
                type="button"
              >
                <Icon name="my_location" className="text-sm" />
              </button>
              <button
                onClick={() => showScreenToast("Cadastral map expanded to fullscreen mode.")}
                className="p-1.5 hover:bg-surface-container rounded text-on-surface transition-colors"
                title="Fullscreen"
                type="button"
              >
                <Icon name="fullscreen" className="text-sm" />
              </button>
            </div>
          </div>
          <div className="p-space-sm bg-surface-container-low px-space-md flex flex-col md:flex-row items-start md:items-center justify-between text-on-surface-variant font-label-sm text-label-sm gap-2">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-semibold text-on-surface flex items-center gap-1">
                <Icon name="explore" className="text-sm text-secondary" /> Centroid: Lat 7.9532° N, Long 3.5971° E
              </span>
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
          {slot(
            slots,
            "inventory",
            <div className="xl:col-span-8 bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-space-md flex items-center justify-between bg-surface-container-low">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Field &amp; Plot Inventory</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">5 demarcated parcels · 100% active cultivation ledger</p>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Filter by enterprise:</span>
                    <select
                      value={enterpriseFilter}
                      onChange={(e) => setEnterpriseFilter(e.target.value)}
                      className="bg-surface-container-lowest px-2 py-1 rounded text-on-surface font-label-sm text-label-sm shadow-sm focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Enterprises (Crops &amp; Nursery)</option>
                      <option value="Grain">Grain (Maize)</option>
                      <option value="Horticulture">Horticulture (Tomato)</option>
                      <option value="Root">Root &amp; Tubers (Cassava)</option>
                      <option value="Legumes">Legumes (Cowpea)</option>
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
                      {filteredPlots.map((plot, idx) => (
                        <tr
                          key={plot.id}
                          className={`hover:bg-surface-container-low transition-colors ${
                            idx % 2 === 1 ? "bg-surface-container-low/40" : ""
                          }`}
                        >
                          <td className="py-3.5 px-space-md">
                            <div className="font-label-md text-label-md font-bold text-on-surface">{plot.id}</div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">{plot.parcel}</div>
                          </td>
                          <td className="py-3.5 px-space-md">
                            <div className="font-label-md text-label-md font-semibold">{plot.areaHa} Ha</div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">{plot.areaAcres} Acres</div>
                          </td>
                          <td className="py-3.5 px-space-md">
                            <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold">
                              <span className="w-2 h-2 rounded-full bg-secondary" /> {plot.enterprise}
                            </span>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">{plot.variety}</div>
                          </td>
                          <td className="py-3.5 px-space-md">
                            <div>{plot.soil}</div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">{plot.soilSub}</div>
                          </td>
                          <td className="py-3.5 px-space-md">
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
                              {plot.tenure}
                            </span>
                          </td>
                          <td className="py-3.5 px-space-md">
                            <div className="font-label-md text-label-md font-semibold">{plot.supervisor}</div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">{plot.supervisorRole}</div>
                          </td>
                          <td className="py-3.5 px-space-md text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => showScreenToast(`PostGIS Polygon editor opened for ${plot.name} (${plot.id})`)}
                                className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                                title="Edit GIS Polygon"
                                type="button"
                              >
                                <Icon name="polyline" className="text-base" />
                              </button>
                              <button
                                onClick={() => showScreenToast(`Viewing phenology tracker: ${plot.name} currently at V6 growth stage.`)}
                                className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                                title="View Phenology"
                                type="button"
                              >
                                <Icon name="timelapse" className="text-base" />
                              </button>
                              <button
                                onClick={() => showScreenToast(`Soil chemistry lab results for ${plot.name}: pH ${plot.soilSub}, OC 1.8%.`)}
                                className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                                title="Soil Chemistry History"
                                type="button"
                              >
                                <Icon name="biotech" className="text-base" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Showing {filteredPlots.length} of {plots.length} demarcated plots • Certified Area: 42.5 Hectares
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => showScreenToast("Already on the first page of demarcated plots.")} className="px-3 py-1.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm" disabled type="button">
                    Previous
                  </button>
                  <button onClick={() => showScreenToast("Page 1 active: 4 demarcated plots displayed.")} className="px-3 py-1.5 rounded bg-primary text-on-primary font-label-sm text-label-sm shadow-sm font-semibold" type="button">
                    1
                  </button>
                  <button onClick={() => showScreenToast("All 4 plots are displayed on Page 1.")} className="px-3 py-1.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm shadow-sm" disabled type="button">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="xl:col-span-4 space-y-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
              <div className="flex items-center justify-between pb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="p-2 rounded bg-surface-container text-primary">
                    <Icon name="science" className="text-base" />
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Soil Profile &amp; Test Telemetry</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">IITA Soil Diagnostic Lab, Ibadan</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">March 2026</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 mb-space-md">
                Composite core sample analysis (0–20 cm depth) across savanna toposequence for Early Rains planting window.
              </p>
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
                  <p className="font-body-sm text-body-sm text-on-surface">
                    Split Nitrogen top-dressing required at <strong>V6 stage</strong> (Urea 46% @ 65kg/Ha). Zero additional phosphorus needed due to strong residual Bray-1 levels.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
              <div className="flex items-center gap-space-xs mb-space-sm">
                <span className="p-2 rounded bg-surface-container text-secondary">
                  <Icon name="gavel" className="text-base" />
                </span>
                <div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">Tenure &amp; Legal Registry</h4>
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
              <button
                onClick={handleDownloadDeed}
                className="mt-space-md w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md transition-colors font-semibold"
                type="button"
              >
                <Icon name="verified_user" className="text-base text-secondary" />
                <span>View Certified Title Documents</span>
              </button>
            </div>
            <div className="bg-primary text-on-primary p-space-md rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm tracking-wider uppercase opacity-80 font-semibold">Iseyin Micro-Climate Station</span>
                <Icon name="cloud_sync" className="text-secondary-container" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl font-bold">31.4°C</span>
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
