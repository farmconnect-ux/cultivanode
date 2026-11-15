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
    supervisor: "Supervisor 1",
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
    supervisor: "Supervisor 1",
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
    supervisor: "Supervisor 2",
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
    supervisor: "Supervisor 3",
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
    supervisor: "Supervisor 1",
    supervisorRole: "Agronomist II",
  },
];

export function FarmRegistry({ slots }: ScreenProps<FarmRegistrySlot>) {
  const [plots, setPlots] = useState<PlotRecord[]>(INITIAL_PLOTS);
  const [enterpriseFilter, setEnterpriseFilter] = useState<string>("all");

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
    downloadFile(geojson, `CultivaNode-Plot-Map-${new Date().toISOString().slice(0, 10)}.geojson`, "application/geo+json");
    showScreenToast("Plot map GeoJSON downloaded (sample boundaries, not a survey).");
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
            supervisor: "Supervisor 1",
            supervisorRole: "Agronomist II",
          };
          setPlots([...plots, newPlot]);
          showScreenToast("New plot added to your farm records.");
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
                  Sample Area: 42.5 Hectares
                </span>
              </div>
            )}
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-bold">
              My Farms &amp; Field Registry
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Your farms and their plots. Split each farm into plots so every crop gets its own plan.
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
                <span>Export Plot Map</span>
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
                  <span>Farm pin saved · boundary walking coming soon</span>
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
        <div className="grid grid-cols-1 gap-space-lg mb-space-lg">
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
                  Showing {filteredPlots.length} of {plots.length} demarcated plots • Sample Area: 42.5 Hectares
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
        </div>
      </div>
    </div>
  );
}
