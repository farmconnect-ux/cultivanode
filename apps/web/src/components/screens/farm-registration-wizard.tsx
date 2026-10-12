"use client";

import { useState } from "react";
import { Icon } from "@/components/ds/icon";
import { GoogleMapView } from "@/components/maps/google-map-view";
import { ScreenDialog, ScreenDialogClose, showScreenToast } from "@/components/ds/screen-dialog";
import { downloadFile } from "@/lib/download";
import { slot, type ScreenProps } from "./types";

export type FarmRegistrationWizardSlot = "form";

export function FarmRegistrationWizard({ slots }: ScreenProps<FarmRegistrationWizardSlot>) {
  const [hasDocument, setHasDocument] = useState(true);
  const [ingestMethod, setIngestMethod] = useState<"upload" | "walk" | "draw">("upload");
  const [mapLayer, setMapLayer] = useState<"satellite" | "topo" | "drainage">("satellite");

  const handleExportSurveyorSheet = () => {
    const sheetContent = `SURCON EPSG:4326 FIELD SURVEY CADASTRE DATA SHEET
Surveyors Council of Nigeria (SURCON) Technical Specification §8.1
Project: CultivaNode Smallholder Cadastral Boundary Formalization
State: Oyo State | LGA: Saki West / Iseyin Agrarian Grid
Geodetic Datum: WGS 84 (EPSG:4326) | Coordinate Format: Decimal Degrees (DD.dddddd)

BEACON IDENTIFIERS & FIELD LOG:
Point_ID,Latitude_DD_N,Longitude_DD_E,Elevation_MSL_m,Beacon_Type,Surveyor_Remarks
V-01,8.664210,3.410120,382.4,Concrete Pillar,North-West Boundary Corner
V-02,8.669850,3.411420,384.1,Concrete Pillar,Riparian Stream Buffer
V-03,8.672100,3.418900,380.6,Concrete Pillar,Access Road Intersection
V-04,8.668400,3.424100,378.2,Concrete Pillar,Eastern Concession Marker
V-05,8.665100,3.423900,376.5,Concrete Pillar,South-East Ridge Boundary
V-06,8.662900,3.419800,377.9,Concrete Pillar,Drainage Culvert Beacon
V-07,8.661800,3.415200,379.2,Concrete Pillar,Southern Access Track
V-08,8.663500,3.411000,381.0,Concrete Pillar,South-West Corner Peg

VALIDATION RULES:
1. Polygon closure tolerance: < 0.05m
2. Minimum internal vertex angle: 15.0 degrees
3. Overlap check query: SELECT ST_Intersects(a.geom, b.geom) FROM surcon_cadastre a, new_farm b;
4. Coordinate Precision: 6 decimal places (approx. 0.11m ground resolution)

Certified by Surcon Accredited Licensed Surveyor.
`;
    downloadFile("cultivanode-surcon-blank-survey-sheet.txt", sheetContent, "text/plain");
    showScreenToast("SURCON blank survey sheet exported!");
  };

  const handleDownloadCoordinates = () => {
    const csvContent = `Point_ID,Latitude,Longitude,Elevation_m,Bearing,Distance_m
V-01,8.664210,3.410120,382,042°15',640.2
V-02,8.669850,3.411420,384,078°30',850.4
V-03,8.672100,3.418900,380,145°10',620.1
V-04,8.668400,3.424100,378,185°45',370.8
V-05,8.665100,3.423900,376,242°20',510.3
V-06,8.662900,3.419800,377,255°05',525.0
V-07,8.661800,3.415200,379,298°15',480.6
V-08,8.663500,3.411000,381,350°40',142.6
`;
    downloadFile("cultivanode-farm-vertices-wgs84.csv", csvContent, "text/csv");
    showScreenToast("Boundary vertices (WGS84) downloaded as CSV!");
  };

  const handleSaveDraft = () => {
    const draft = {
      farmName: "Oke-Ogun Pioneer Agrarian Estate",
      farmType: "commercial",
      declaredAreaHa: 48.60,
      perimeterMeters: 3140,
      verticesCount: 18,
      state: "Oyo",
      lga: "Saki West",
      ingestMethod,
      mapLayer,
      hasDocument,
      savedAt: new Date().toISOString(),
    };
    downloadFile("cultivanode-farm-cadastre-draft.json", JSON.stringify(draft, null, 2), "application/json");
    showScreenToast("Farm registration draft saved to local SQLite & cloud repository!");
  };

  const modalViewDocument = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="verified" className="text-secondary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Chieftaincy Consent Deed</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Baale_Chieftaincy_Consent_Deed_Signed.pdf (1.8 MB)</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="p-space-lg space-y-space-md text-left">
        <div className="p-space-md bg-surface-container-low rounded-lg space-y-2 border border-surface-container">
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Traditional Authority:</span>
            <span className="font-bold text-on-surface">Saki Traditional Land Committee</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Lead Custodian:</span>
            <span className="font-bold text-on-surface">Chief Alhaji Jimoh Oyedepo (Baale)</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Grantee / Estate:</span>
            <span className="font-bold text-primary">Oke-Ogun Pioneer Agrarian Estate</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Cryptographic Verification:</span>
            <span className="font-bold text-secondary">SHA-256 Validated • NDPA Compliant</span>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Document verified by optical character recognition (OCR) with physical seal of Saki Traditional Land Council and witness endorsement from Oyo State Ministry of Lands.
        </p>
        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold" type="button">
              Close Preview
            </button>
          </ScreenDialogClose>
        </div>
      </div>
    </div>
  );

  const modalConfirmRegistration = (
    <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-space-lg bg-surface-container-lowest flex items-center justify-between border-b border-surface-container-high">
        <div className="flex items-center gap-space-xs">
          <Icon name="fact_check" className="text-primary text-2xl" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Register Cadastral Boundary</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">PostGIS Spatial Validation §8.1 Approval</p>
          </div>
        </div>
        <ScreenDialogClose>
          <button onClick={() => {}} className="p-1 text-on-surface-variant hover:text-on-surface" type="button">
            <Icon name="close" />
          </button>
        </ScreenDialogClose>
      </div>
      <div className="p-space-lg space-y-space-md text-left">
        <div className="p-space-md bg-surface-container-low rounded-lg space-y-2">
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Declared Estate:</span>
            <span className="font-bold text-on-surface">Oke-Ogun Pioneer Agrarian Estate</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">PostGIS Surface Area:</span>
            <span className="font-bold text-primary">48.60 Hectares (120.09 Acres)</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Topological Nodes:</span>
            <span className="font-bold text-secondary">18 Vertices • Zero Boundary Clashes</span>
          </div>
          <div className="flex justify-between font-label-md text-label-md">
            <span className="text-on-surface-variant">Tenure Document:</span>
            <span className="font-bold text-secondary">{hasDocument ? "Verified Baale Consent on File" : "Provisional"}</span>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          This operation publishes the verified parcel geometry into the Oyo State Geographic Information System (OYGIS) ledger and locks the boundary hash into the CultivaNode trust network.
        </p>
        <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-container-high">
          <ScreenDialogClose>
            <button onClick={() => {}} className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              Review Edits
            </button>
          </ScreenDialogClose>
          <ScreenDialogClose>
            <button
              onClick={() => showScreenToast("Cadastral boundary registered and synced to Oyo State OYGIS cadastre!")}
              className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold"
              type="button"
            >
              Confirm &amp; Register Cadastre
            </button>
          </ScreenDialogClose>
        </div>
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="flex flex-col w-full pb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md">
              <Icon name="satellite_alt" className="text-sm" />
              <span>POSTGIS SPATIAL CADASTRE ONBOARDING • §8.1 ACCREDITATION</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary tracking-tight">Register New Farm &amp; Cadastral Boundary</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">PostGIS-compliant geospatial boundary onboarding, land-tenure accreditation, and ecological zoning for South-West Nigeria agricultural corridors.</p>
          </div>
          <div className="flex items-center gap-space-sm self-start lg:self-center">
            <div className="bg-surface-container-low px-space-md py-space-xs rounded-lg shadow-sm flex items-center gap-space-xs">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-surface font-semibold tracking-wide">SURCON EPSG:4326 ENGINE READY</span>
            </div>
            <button
              onClick={handleExportSurveyorSheet}
              className="bg-surface-container-lowest text-on-surface px-space-md py-2.5 rounded-lg font-label-md text-label-md shadow-sm hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
              type="button"
            >
              <Icon name="download_for_offline" className="text-base" />
              <span>Export Blank Surveyor Sheet</span>
            </button>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md mb-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md relative">
            <div className="flex items-center gap-space-sm bg-surface-container-low/50 p-space-sm rounded-lg">
              <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-md text-label-md shrink-0 shadow-sm">
                <Icon name="check" className="text-lg" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">Step 1 • Completed</span>
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">Identity &amp; Governance</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm bg-secondary-container/20 p-space-sm rounded-lg">
              <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md text-label-md shrink-0 shadow-sm font-bold">2</div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">Step 2 • Active Setup</span>
                <span className="font-headline-sm text-headline-sm text-on-surface truncate">Geographic &amp; Soil Zoning</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
              <div className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-label-md text-label-md shrink-0">3</div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold tracking-wider">Step 3 • Geospatial</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant truncate">Cadastral &amp; PostGIS Map</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
              <div className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-md text-label-md shrink-0">4</div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold tracking-wider">Step 4 • Production</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant truncate">Enterprises &amp; Seasons</span>
              </div>
            </div>
          </div>
        </div>
        {slot(slots, "form", (
          <div className="flex flex-col gap-space-xl" id="farmCadastreForm" role="form">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-space-lg py-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                    <Icon name="corporate_fare" className="text-base" />
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Section A: Farm Identity &amp; Land Tenure Governance</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Statutory operational registration and legal customary land-rights verification.</p>
                  </div>
                </div>
                <span className="self-start md:self-auto px-2.5 py-1 bg-surface-container-lowest text-secondary font-label-sm text-label-sm rounded-full shadow-sm flex items-center gap-1"><Icon name="verified_user" className="text-sm" /> CAC &amp; Traditional Roster Sync</span>
              </div>
              <div className="p-space-lg grid grid-cols-1 md:grid-cols-12 gap-space-lg">
                <div className="md:col-span-7 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="farm_name">Registered Farm Name <span className="text-error">*</span></label>
                  <div className="relative">
                    <input className="w-full h-11 px-space-md bg-surface-container-lowest text-on-surface rounded-lg font-body-md text-body-md shadow-sm focus:outline-none focus:bg-surface-container-low transition-colors" id="farm_name" name="farm_name" placeholder="e.g. Ago-Are Commercial Syndicate Farm" type="text" defaultValue="Oke-Ogun Pioneer Agrarian Estate" />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Official estate label used for off-taker procurement orders and agricultural subsidy claims.</p>
                </div>
                <div className="md:col-span-5 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="farm_type">Operational Enterprise Model <span className="text-error">*</span></label>
                  <div className="relative">
                    <select defaultValue="commercial" className="w-full h-11 px-space-md bg-surface-container-lowest text-on-surface rounded-lg font-body-md text-body-md shadow-sm focus:outline-none appearance-none cursor-pointer" id="farm_type" name="farm_type">
                      <option value="commercial">Commercial Agribusiness (&gt; 20 Ha)</option>
                      <option value="cooperative">Outgrower Cooperative Cluster</option>
                      <option value="smallholder">Smallholder Family Farm</option>
                      <option value="seed_multiplication">Seed Multiplication &amp; Breeding Facility</option>
                    </select>
                    <Icon name="expand_more" className="absolute right-3 top-3 text-on-surface-variant pointer-events-none text-xl" />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Drives default farm book ledgers and mechanization pooling ratios.</p>
                </div>
                <div className="md:col-span-6 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">Tenure Classification &amp; Land Deed Category <span className="text-error">*</span></label>
                  <div className="grid grid-cols-2 gap-space-sm">
                    <label className="p-space-sm bg-surface-container-low rounded-lg flex items-start gap-space-xs cursor-pointer hover:bg-surface-container transition-colors">
                      <input defaultChecked className="mt-1 accent-primary w-4 h-4" name="tenure_type" type="radio" value="customary" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Customary Family Land</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Baale / Royal Family Attestation</span>
                      </div>
                    </label>
                    <label className="p-space-sm bg-surface-container-lowest rounded-lg flex items-start gap-space-xs cursor-pointer shadow-sm hover:bg-surface-container-low transition-colors">
                      <input className="mt-1 accent-primary w-4 h-4" name="tenure_type" type="radio" value="c_of_o" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Statutory C of O</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">State Lands Registry Title</span>
                      </div>
                    </label>
                    <label className="p-space-sm bg-surface-container-lowest rounded-lg flex items-start gap-space-xs cursor-pointer shadow-sm hover:bg-surface-container-low transition-colors">
                      <input className="mt-1 accent-primary w-4 h-4" name="tenure_type" type="radio" value="leasehold" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Agricultural Leasehold</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">10–25 Years Long-term Contract</span>
                      </div>
                    </label>
                    <label className="p-space-sm bg-surface-container-lowest rounded-lg flex items-start gap-space-xs cursor-pointer shadow-sm hover:bg-surface-container-low transition-colors">
                      <input className="mt-1 accent-primary w-4 h-4" name="tenure_type" type="radio" value="communal" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Communal Allocation</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Cooperative Trust Scheme</span>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="md:col-span-6 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">Assigned Operations Leadership &amp; Farm Manager <span className="text-error">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
                      <img className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" data-alt="Portrait of an experienced Nigerian lead agronomist wearing field khaki gear and safety equipment under natural daylight" src="/images/screens/65e037ed10ac.webp" alt="" loading="lazy" decoding="async" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Quadri Olapade</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Lead Agronomist (Full Admin)</span>
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
                      <img className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" data-alt="Professional portrait of a female Nigerian precision agriculture surveyor with GIS tools in an outdoor agronomic research station" src="/images/screens/d421f9ddbf77.webp" alt="" loading="lazy" decoding="async" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">Titilayo Alabi, FNIS</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Cadastral GIS Officer</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Both personnel receive real-time SMS &amp; WhatsApp alerts for boundary encroachment notifications.</p>
                </div>
                <div className="md:col-span-12 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">Tenure Legal Document &amp; Chieftaincy Endorsement Deed <span className="text-error">*</span></label>
                  <div className="bg-surface-container-low/70 rounded-xl p-space-md flex flex-col md:flex-row items-center gap-space-md">
                    <div className="w-14 h-14 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center shrink-0 shadow-sm">
                      <Icon name="upload_file" className="text-3xl" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Drag &amp; drop deed scan here, or</span>
                        <button
                          onClick={() => {
                            setHasDocument(true);
                            showScreenToast("Selected Baale_Chieftaincy_Consent_Deed_Signed.pdf from storage.");
                          }}
                          className="text-secondary font-label-md text-label-md underline hover:text-primary transition-colors"
                          type="button"
                        >
                          browse files
                        </button>
                        <span className="px-2 py-0.5 rounded text-xs bg-secondary-container text-on-secondary-container font-semibold">OCR Verification Active</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Supports PDF, GeoTIFF, JPG up to 25MB. Must show physical stamp of Saki Traditional Land Committee.</p>
                    </div>
                    {hasDocument && (
                      <div className="w-full md:w-auto bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex items-center justify-between gap-space-md shrink-0">
                        <div className="flex items-center gap-space-xs">
                          <Icon name="picture_as_pdf" className="text-primary text-2xl" />
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold truncate max-w-[210px]">Baale_Chieftaincy_Consent_Deed_Signed.pdf</span>
                            <span className="font-label-sm text-label-sm text-secondary font-medium">1.8 MB • Cryptographically Verified</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ScreenDialog title="Document Preview" side="center" panel={modalViewDocument}>
                            <button onClick={() => {}} aria-label="View Document" className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-on-surface" type="button">
                              <Icon name="visibility" className="text-base" />
                            </button>
                          </ScreenDialog>
                          <button
                            onClick={() => {
                              setHasDocument(false);
                              showScreenToast("Tenure document removed. Please upload valid deed.");
                            }}
                            aria-label="Remove Document"
                            className="p-1 hover:bg-surface-container rounded text-error"
                            type="button"
                          >
                            <Icon name="close" className="text-base" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-space-lg py-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                    <Icon name="public" className="text-base" />
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Section B: Location &amp; Regional Agro-Ecological Profiling</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Federal Ministry of Agriculture &amp; Food Security (FMAFS) regional pedology classification.</p>
                  </div>
                </div>
                <span className="self-start md:self-auto px-2.5 py-1 bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm rounded-full shadow-sm flex items-center gap-1"><Icon name="eco" className="text-sm text-secondary" /> Agro-Zone Auto-Classifier</span>
              </div>
              <div className="p-space-lg grid grid-cols-1 md:grid-cols-12 gap-space-lg">
                <div className="md:col-span-3 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">Federation Country</label>
                  <input className="w-full h-11 px-space-md bg-surface-container-low text-on-surface rounded-lg font-body-md text-body-md shadow-sm" readOnly type="text" defaultValue="Nigeria" />
                </div>
                <div className="md:col-span-3 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">State of Origin</label>
                  <input className="w-full h-11 px-space-md bg-surface-container-low text-on-surface rounded-lg font-body-md text-body-md shadow-sm" readOnly type="text" defaultValue="Oyo State" />
                </div>
                <div className="md:col-span-3 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">Local Government Area (LGA)</label>
                  <input className="w-full h-11 px-space-md bg-surface-container-low text-on-surface rounded-lg font-body-md text-body-md shadow-sm" readOnly type="text" defaultValue="Saki West LGA" />
                </div>
                <div className="md:col-span-3 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">Community / Agricultural Axis</label>
                  <input className="w-full h-11 px-space-md bg-surface-container-lowest text-on-surface rounded-lg font-body-md text-body-md shadow-sm focus:outline-none" type="text" defaultValue="Kinnikinni Agrarian Corridor" />
                </div>
                <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                  <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">Agro-Ecological Belt</span>
                      <Icon name="wb_sunny" className="text-secondary text-xl" />
                    </div>
                    <div>
                      <div className="font-headline-sm text-headline-sm text-primary font-bold">Derived Guinea Savanna</div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Bimodal Rainfall Pattern: 1,150 – 1,280 mm/year with clear August Break breakline.</p>
                    </div>
                    <div className="mt-space-sm pt-space-xs flex items-center justify-between text-xs font-semibold text-secondary">
                      <span>Growing Season: 215 Days</span>
                      <span>Solar Radiation: 19.4 MJ/m²</span>
                    </div>
                  </div>
                  <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">Soil Pedology &amp; Texture</span>
                      <Icon name="layers" className="text-tertiary-container text-xl" />
                    </div>
                    <div>
                      <div className="font-headline-sm text-headline-sm text-primary font-bold">Luvisol / Sandy Clay Loam</div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Base Cation Saturation: High. Baseline Topsoil pH: 6.2 – 6.5 (Optimal for root-crops).</p>
                    </div>
                    <div className="mt-space-sm pt-space-xs flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                      <span>Organic Carbon: 1.42%</span>
                      <span>CEC: 18.2 cmol(+)/kg</span>
                    </div>
                  </div>
                  <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">Hydrology &amp; Aquifer Depth</span>
                      <Icon name="water_drop" className="text-secondary text-xl" />
                    </div>
                    <div>
                      <div className="font-headline-sm text-headline-sm text-primary font-bold">Perennial Stream &amp; Shallow Table</div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Basement Complex Aquifer at 28–35m depth. Riparian border along southern boundary.</p>
                    </div>
                    <div className="mt-space-sm pt-space-xs flex items-center justify-between text-xs font-semibold text-secondary">
                      <span>Borehole Yield: 4.8 m³/hr</span>
                      <span>Salinity: 0.2 dS/m</span>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-12 flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">Active Hydrological Sources Available On-Site</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                    <label className="p-space-sm bg-surface-container-lowest rounded-lg flex items-center gap-space-xs shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input defaultChecked className="rounded w-4 h-4 text-primary accent-primary" type="checkbox" />
                      <span className="font-label-md text-label-md text-on-surface">Perennial River / Stream</span>
                    </label>
                    <label className="p-space-sm bg-surface-container-lowest rounded-lg flex items-center gap-space-xs shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input defaultChecked className="rounded w-4 h-4 text-primary accent-primary" type="checkbox" />
                      <span className="font-label-md text-label-md text-on-surface">Solar Deep Borehole (10HP)</span>
                    </label>
                    <label className="p-space-sm bg-surface-container-lowest rounded-lg flex items-center gap-space-xs shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input defaultChecked className="rounded w-4 h-4 text-primary accent-primary" type="checkbox" />
                      <span className="font-label-md text-label-md text-on-surface">Rainfed Catchment Earth Dam</span>
                    </label>
                    <label className="p-space-sm bg-surface-container-lowest rounded-lg flex items-center gap-space-xs shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
                      <input className="rounded w-4 h-4 text-primary accent-primary" type="checkbox" />
                      <span className="font-label-md text-label-md text-on-surface">Municipal Canal Access</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-space-lg py-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                    <Icon name="polyline" className="text-base" />
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Section C: Cadastral Boundary Delineation &amp; PostGIS Validation</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Geodetic projection WGS 84 (EPSG:4326) with automated topology validation.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm rounded-full font-bold flex items-center gap-1 shadow-sm"><Icon name="check_circle" className="text-sm" /> ST_IsValid: True</span>
                  <span className="px-2.5 py-1 bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm rounded-full shadow-sm">EPSG:4326</span>
                </div>
              </div>
              <div className="p-space-lg flex flex-col gap-space-lg">
                <div className="flex flex-col gap-2">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Boundary Capture Methodology</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                    <button
                      onClick={() => {
                        setIngestMethod("upload");
                        showScreenToast("Boundary ingestion: GeoJSON / KML / Shapefile active.");
                      }}
                      className={`p-space-md rounded-xl text-left flex items-start gap-space-sm shadow-sm transition-all ${
                        ingestMethod === "upload" ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                      }`}
                      type="button"
                    >
                      <Icon name="file_upload" className={`text-2xl ${ingestMethod === "upload" ? "text-secondary-container" : "text-secondary"}`} />
                      <div className="flex flex-col">
                        <span className={`font-headline-sm text-headline-sm font-bold ${ingestMethod === "upload" ? "text-white" : "text-on-surface"}`}>Upload GeoJSON / KML / SHP</span>
                        <span className={`font-body-sm text-body-sm ${ingestMethod === "upload" ? "text-on-primary-container/80" : "text-on-surface-variant"}`}>Import survey coordinates from RTK GPS or certified surveyor shapefile.</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setIngestMethod("walk");
                        showScreenToast("Boundary ingestion: Mobile Walk Boundary Rover active.");
                      }}
                      className={`p-space-md rounded-xl text-left flex items-start gap-space-sm shadow-sm transition-all ${
                        ingestMethod === "walk" ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                      }`}
                      type="button"
                    >
                      <Icon name="directions_walk" className={`text-2xl ${ingestMethod === "walk" ? "text-secondary-container" : "text-secondary"}`} />
                      <div className="flex flex-col">
                        <span className={`font-headline-sm text-headline-sm font-bold ${ingestMethod === "walk" ? "text-white" : "text-on-surface"}`}>Walk Boundary on Field Mobile App</span>
                        <span className={`font-body-sm text-body-sm ${ingestMethod === "walk" ? "text-on-primary-container/80" : "text-on-surface-variant"}`}>Sync real-time Bluetooth RTK rover antenna with sub-meter precision.</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setIngestMethod("draw");
                        showScreenToast("Boundary ingestion: Satellite Canvas Drawing active.");
                      }}
                      className={`p-space-md rounded-xl text-left flex items-start gap-space-sm shadow-sm transition-all ${
                        ingestMethod === "draw" ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                      }`}
                      type="button"
                    >
                      <Icon name="draw" className={`text-2xl ${ingestMethod === "draw" ? "text-secondary-container" : "text-secondary"}`} />
                      <div className="flex flex-col">
                        <span className={`font-headline-sm text-headline-sm font-bold ${ingestMethod === "draw" ? "text-white" : "text-on-surface"}`}>Draw Boundary on Satellite Canvas</span>
                        <span className={`font-body-sm text-body-sm ${ingestMethod === "draw" ? "text-on-primary-container/80" : "text-on-surface-variant"}`}>Polygon trace on 10m Sentinel-2 &amp; Planet 3m high-resolution mosaics.</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
                  <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Calculated Surface Area</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl font-bold text-primary">48.60</span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-bold">Hectares (Ha)</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-secondary font-semibold mt-1">Equivalent to 120.09 Acres</span>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Cadastral Perimeter</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl font-bold text-primary">3,140</span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-bold">Meters (m)</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Total Boundary Fence Line</span>
                  </div>
                  <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">Topological Node Count</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display-lg text-headline-xl-mobile sm:text-headline-xl font-bold text-primary">18</span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-bold">Vertices</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-secondary font-semibold mt-1">ST_IsSimple &amp; ST_Closed: True</span>
                  </div>
                  <div className="bg-secondary-container/30 p-space-md rounded-xl flex flex-col justify-between">
                    <span className="font-label-sm text-label-sm text-on-secondary-container font-bold uppercase tracking-wider">Boundary Overlap Check</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <Icon name="verified" className="text-secondary text-2xl" />
                      <span className="font-headline-sm text-headline-sm text-on-secondary-container font-bold">Zero Clashes Detected</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-secondary-container font-medium mt-1">Adjacent Saki Cadastre Clear</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                  <div className="lg:col-span-8 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5"><Icon name="map" className="text-secondary text-base" /> Geospatial Boundary Viewport (Saki West Agrarian Grid)</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setMapLayer("satellite");
                            showScreenToast("Map view: Sentinel-2 Multi-Spectral mosaic.");
                          }}
                          className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                            mapLayer === "satellite" ? "bg-primary text-on-primary font-bold" : "bg-surface-container-low hover:bg-surface-container text-on-surface"
                          }`}
                          type="button"
                        >
                          Satellite (Sentinel-2)
                        </button>
                        <button
                          onClick={() => {
                            setMapLayer("topo");
                            showScreenToast("Map view: Topographic Elevation Contours.");
                          }}
                          className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                            mapLayer === "topo" ? "bg-primary text-on-primary font-bold" : "bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant"
                          }`}
                          type="button"
                        >
                          Topographic
                        </button>
                        <button
                          onClick={() => {
                            setMapLayer("drainage");
                            showScreenToast("Map view: Slope & Hydrological Drainage Basin.");
                          }}
                          className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                            mapLayer === "drainage" ? "bg-primary text-on-primary font-bold" : "bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant"
                          }`}
                          type="button"
                        >
                          Slope / Drainage
                        </button>
                      </div>
                    </div>
                    <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-sm bg-surface-container-high">
                      <GoogleMapView
                        className="w-full h-full min-h-[400px]"
                        center={{ lat: 8.6701, lng: 3.4125 }}
                        zoom={15}
                        editable={true}
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Boundary Vertices (WGS84)</span>
                      <button
                        onClick={() => showScreenToast("Vertices snapped to official SURCON cadastral beacons #SK-082 to #SK-099.")}
                        className="text-secondary font-label-sm text-label-sm hover:underline flex items-center gap-0.5"
                        type="button"
                      >
                        <Icon name="tune" className="text-sm" /> Snap to Beacon
                      </button>
                    </div>
                    <div className="bg-surface-container-low rounded-xl p-space-sm overflow-hidden flex flex-col h-[400px]">
                      <div className="overflow-y-auto pr-1 flex-1">
                        <table className="w-full text-left font-body-sm text-body-sm">
                          <thead className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase sticky top-0">
                            <tr>
                              <th className="py-2 px-2.5 rounded-l">Point</th>
                              <th className="py-2 px-2">Latitude (°N)</th>
                              <th className="py-2 px-2">Longitude (°E)</th>
                              <th className="py-2 px-2 text-right rounded-r">Elevation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-container-high/40">
                            <tr className="hover:bg-surface-container-lowest/60 transition-colors">
                              <td className="py-2 px-2.5 font-bold text-primary">V-01</td>
                              <td className="py-2 px-2">8.670112</td>
                              <td className="py-2 px-2">3.412530</td>
                              <td className="py-2 px-2 text-right">382 m</td>
                            </tr>
                            <tr className="hover:bg-surface-container-lowest/60 transition-colors">
                              <td className="py-2 px-2.5 font-bold text-primary">V-02</td>
                              <td className="py-2 px-2">8.673420</td>
                              <td className="py-2 px-2">3.416801</td>
                              <td className="py-2 px-2 text-right">380 m</td>
                            </tr>
                            <tr className="hover:bg-surface-container-lowest/60 transition-colors">
                              <td className="py-2 px-2.5 font-bold text-primary">V-03</td>
                              <td className="py-2 px-2">8.672950</td>
                              <td className="py-2 px-2">3.424100</td>
                              <td className="py-2 px-2 text-right">376 m</td>
                            </tr>
                            <tr className="hover:bg-surface-container-lowest/60 transition-colors">
                              <td className="py-2 px-2.5 font-bold text-primary">V-04</td>
                              <td className="py-2 px-2">8.669800</td>
                              <td className="py-2 px-2">3.428500</td>
                              <td className="py-2 px-2 text-right">371 m</td>
                            </tr>
                            <tr className="hover:bg-surface-container-lowest/60 transition-colors">
                              <td className="py-2 px-2.5 font-bold text-primary">V-05</td>
                              <td className="py-2 px-2">8.664200</td>
                              <td className="py-2 px-2">3.429100</td>
                              <td className="py-2 px-2 text-right">369 m</td>
                            </tr>
                            <tr className="hover:bg-surface-container-lowest/60 transition-colors">
                              <td className="py-2 px-2.5 font-bold text-primary">V-06</td>
                              <td className="py-2 px-2">8.661000</td>
                              <td className="py-2 px-2">3.423900</td>
                              <td className="py-2 px-2 text-right">374 m</td>
                            </tr>
                            <tr className="hover:bg-surface-container-lowest/60 transition-colors">
                              <td className="py-2 px-2.5 font-bold text-primary">V-07</td>
                              <td className="py-2 px-2">8.661800</td>
                              <td className="py-2 px-2">3.415200</td>
                              <td className="py-2 px-2 text-right">379 m</td>
                            </tr>
                            <tr className="hover:bg-surface-container-lowest/60 transition-colors">
                              <td className="py-2 px-2.5 font-bold text-primary">V-08</td>
                              <td className="py-2 px-2">8.663500</td>
                              <td className="py-2 px-2">3.411000</td>
                              <td className="py-2 px-2 text-right">381 m</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 pt-2 bg-surface-container-lowest rounded-lg p-space-sm flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant font-medium">10 additional nodes hidden</span>
                        <button
                          onClick={handleDownloadCoordinates}
                          className="text-secondary font-semibold hover:underline"
                          type="button"
                        >
                          Download Coordinates (.CSV)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-xl flex items-start gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="verified" className="text-base" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Baale Cadastral Clearance Confirmed</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">The PostGIS spatial query <code className="font-mono text-xs bg-surface-container px-1 py-0.5 rounded">ST_Intersects()</code> detected zero overlapping perimeter conflicts with neighboring agrarian concessions in Kinnikinni and Saki West gazetted archives.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-space-lg py-space-md bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                    <Icon name="agriculture" className="text-base" />
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Section D: Production Enterprises &amp; Crop Cycle Allocation</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Initialize baseline agronomic crops and livestock enterprises for Early Rains 2026.</p>
                  </div>
                </div>
                <span className="self-start md:self-auto px-2.5 py-1 bg-surface-container-lowest text-on-surface font-label-sm text-label-sm rounded-full shadow-sm">Season: Early Rains 2026</span>
              </div>
              <div className="p-space-lg grid grid-cols-1 md:grid-cols-12 gap-space-lg">
                <div className="md:col-span-7 flex flex-col gap-space-sm">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">Primary Arable Crops Scheduled for Deployment <span className="text-error">*</span></label>
                  <div className="space-y-space-sm">
                    <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between gap-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-bold">White Maize (SAMMAZ-15)</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">Drought-tolerant hybrid • 105-day cycle • Target: 4.8 MT/Ha</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input className="w-16 h-8 text-center rounded bg-surface-container-lowest font-semibold text-sm shadow-sm" type="number" defaultValue="24.0" />
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Ha</span>
                      </div>
                    </div>
                    <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between gap-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-bold">Industrial Cassava (TME-419)</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">High-starch variety for flour • 12-month cycle • Target: 28 MT/Ha</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input className="w-16 h-8 text-center rounded bg-surface-container-lowest font-semibold text-sm shadow-sm" type="number" defaultValue="16.5" />
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Ha</span>
                      </div>
                    </div>
                    <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between gap-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <input defaultChecked className="w-4 h-4 rounded text-primary accent-primary" type="checkbox" />
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-bold">Lowland Rice (Faro 44 / SIPI)</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">Riparian flood basin strip • 115-day cycle • Target: 5.2 MT/Ha</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input className="w-16 h-8 text-center rounded bg-surface-container-lowest font-semibold text-sm shadow-sm" type="number" defaultValue="8.1" />
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Ha</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 flex flex-col gap-space-sm">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">Livestock &amp; Aquaculture Operations</label>
                  <div className="space-y-space-sm">
                    <label className="p-space-sm bg-surface-container-low rounded-xl flex items-start gap-space-sm cursor-pointer hover:bg-surface-container transition-colors">
                      <input defaultChecked className="w-4 h-4 mt-1 rounded text-primary accent-primary" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">Broiler Poultry Farm</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Capacity: 5,000 birds • Deep litter pen infrastructure</span>
                        <span className="font-label-sm text-label-sm text-secondary font-medium mt-0.5">Generates on-farm organic manure for maize plots</span>
                      </div>
                    </label>
                    <label className="p-space-sm bg-surface-container-low rounded-xl flex items-start gap-space-sm cursor-pointer hover:bg-surface-container transition-colors">
                      <input defaultChecked className="w-4 h-4 mt-1 rounded text-primary accent-primary" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">Catfish Aquaculture (Clarias Gariepinus)</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">4 earthen ponds fed by stream diversion • 20,000 fingerlings/batch</span>
                      </div>
                    </label>
                    <label className="p-space-sm bg-surface-container-low rounded-xl flex items-start gap-space-sm cursor-pointer hover:bg-surface-container transition-colors">
                      <input className="w-4 h-4 mt-1 rounded text-primary accent-primary" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">Small Ruminants (West African Dwarf Goats)</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Semi-intensive paddock rotational grazing on fallow parcels</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="flex items-center gap-2">
                  <Icon name="security" className="text-secondary text-2xl" />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">NDPA 2023 Compliant</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Data sovereignty &amp; encrypted land records</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-surface-container-high hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2">
                  <Icon name="account_balance" className="text-secondary text-2xl" />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Providus Bank Escrow Ready</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Automated mechanization disbursement</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-sm w-full md:w-auto justify-end">
                <button
                  onClick={() => showScreenToast("Reset form to initial cadastral survey values.")}
                  className="px-space-md py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant bg-surface-container-low hover:bg-surface-container transition-colors"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-space-md py-2.5 rounded-lg font-label-md text-label-md text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
                  id="btnSaveDraft"
                  type="button"
                >
                  <Icon name="save" className="text-base" />
                  <span>Save Draft</span>
                </button>
                <ScreenDialog title="Confirm Cadastral Registration" side="center" panel={modalConfirmRegistration}>
                  <button
                    onClick={() => {}}
                    className="px-space-lg py-2.5 rounded-lg font-label-md text-label-md text-on-primary bg-primary hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 font-semibold"
                    type="button"
                  >
                    <Icon name="verified" className="text-base" />
                    <span>Validate &amp; Register Farm Boundary</span>
                  </button>
                </ScreenDialog>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
